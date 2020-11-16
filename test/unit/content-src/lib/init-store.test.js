import { actionCreators as ac, actionTypes as at } from "common/Actions.jsm";
import { addNumberReducer, GlobalOverrider } from "test/unit/utils";
import {
  EARLY_QUEUED_ACTIONS,
  INCOMING_MESSAGE_NAME,
  initStore,
  initMoCoCNPrefs,
  MERGE_STORE_ACTION,
  OUTGOING_MESSAGE_NAME,
  queueEarlyMessageMiddleware,
  rehydrationMiddleware,
} from "content-src/lib/init-store";

describe("initStore", () => {
  let globals;
  let store;
  beforeEach(() => {
    globals = new GlobalOverrider();
    globals.set("addEventListener", globals.sandbox.spy());
    globals.set("RPMSendAsyncMessage", globals.sandbox.spy());
    globals.set("RPMAddMessageListener", globals.sandbox.spy());
    store = initStore({ number: addNumberReducer });
  });
  afterEach(() => globals.restore());
  it("should create a store with the provided reducers", () => {
    assert.ok(store);
    assert.property(store.getState(), "number");
  });
  it("should add a listener that dispatches actions", () => {
    assert.calledWith(global.RPMAddMessageListener, INCOMING_MESSAGE_NAME);
    const [, listener] = global.RPMAddMessageListener.firstCall.args;
    globals.sandbox.spy(store, "dispatch");
    const message = { name: INCOMING_MESSAGE_NAME, data: { type: "FOO" } };

    listener(message);

    assert.calledWith(store.dispatch, message.data);
  });
  it("should not throw if RPMAddMessageListener is not defined", () => {
    // Note: this is being set/restored by GlobalOverrider
    delete global.RPMAddMessageListener;

    assert.doesNotThrow(() => initStore({ number: addNumberReducer }));
  });
  it("should log errors from failed messages", () => {
    const [, callback] = global.RPMAddMessageListener.firstCall.args;
    globals.sandbox.stub(global.console, "error");
    globals.sandbox.stub(store, "dispatch").throws(Error("failed"));

    const message = {
      name: INCOMING_MESSAGE_NAME,
      data: { type: MERGE_STORE_ACTION },
    };
    callback(message);

    assert.calledOnce(global.console.error);
  });
  [
    { event: { key: "otherprefix.test", oldValue: 0, newValue: 1 }, shouldDispatch: false },
    { event: { key: "redux.test", oldValue: 1, newValue: 1 }, shouldDispatch: false },
    { event: { key: "redux.test", oldValue: 1, newValue: 2 }, shouldDispatch: true },
  ].forEach(({ event, shouldDispatch }) => {
    it(`should add a storage listener that may dispatch actions for ${event.key}: ${event.oldValue} => ${event.newValue}`, () => {
      assert.calledWith(global.addEventListener, "storage");
      const [, listener] = global.addEventListener.firstCall.args;
      globals.sandbox.spy(store, "dispatch");

      listener(event);

      if (shouldDispatch) {
        assert.calledWith(store.dispatch, {
          type: at.MOCOCN_PREF_CHANGED,
          data: { name: event.key, value: event.newValue }
        });
      } else {
        assert.notCalled(store.dispatch);
      }
    });
  });
  it("should log errors from failed event handlers", () => {
    const [, listener] = global.addEventListener.firstCall.args;
    globals.sandbox.stub(global.console, "error");
    globals.sandbox.stub(store, "dispatch").throws(Error("failed"));

    const event = { key: "redux.test", oldValue: 0, newValue: 1 };
    listener(event);

    assert.calledOnce(global.console.error);
  });
  it("should replace the state if a MERGE_STORE_ACTION is dispatched", () => {
    store.dispatch({ type: MERGE_STORE_ACTION, data: { number: 42 } });
    assert.deepEqual(store.getState(), { number: 42 });
  });
  it("should call .send and update the local store if an AlsoToMain action is dispatched", () => {
    const subscriber = sinon.spy();
    const action = ac.AlsoToMain({ type: "FOO" });

    store.subscribe(subscriber);
    store.dispatch(action);

    assert.calledWith(
      global.RPMSendAsyncMessage,
      OUTGOING_MESSAGE_NAME,
      action
    );
    assert.calledOnce(subscriber);
  });
  it("should call .send but not update the local store if an OnlyToMain action is dispatched", () => {
    const subscriber = sinon.spy();
    const action = ac.OnlyToMain({ type: "FOO" });

    store.subscribe(subscriber);
    store.dispatch(action);

    assert.calledWith(
      global.RPMSendAsyncMessage,
      OUTGOING_MESSAGE_NAME,
      action
    );
    assert.notCalled(subscriber);
  });
  it("should persist a MOCOCN_SET_PREF action into localStorage", () => {
    // stub `Storage.prototype` instead of `localStorage` per advice from
    // https://github.com/jasmine/jasmine/issues/299#issuecomment-78126524
    globals.sandbox.stub(global.Storage.prototype, "setItem");
    const action = {
      type: at.MOCOCN_SET_PREF,
      data: { name: "redux.test", value: 1 },
    };
    store.dispatch(action);
    assert.calledOnce(global.localStorage.setItem);
  });
  it("should not send out other types of actions", () => {
    store.dispatch({ type: "FOO" });
    assert.notCalled(global.RPMSendAsyncMessage);
  });
  describe("rehydrationMiddleware", () => {
    it("should allow NEW_TAB_STATE_REQUEST to go through", () => {
      const action = ac.AlsoToMain({ type: at.NEW_TAB_STATE_REQUEST });
      const next = sinon.spy();
      rehydrationMiddleware(store)(next)(action);
      assert.calledWith(next, action);
    });
    it("should dispatch an additional NEW_TAB_STATE_REQUEST if INIT was received after a request", () => {
      const requestAction = ac.AlsoToMain({ type: at.NEW_TAB_STATE_REQUEST });
      const next = sinon.spy();
      const dispatch = rehydrationMiddleware(store)(next);

      dispatch(requestAction);
      next.resetHistory();
      dispatch({ type: at.INIT });

      assert.calledWith(next, requestAction);
    });
    it("should allow MERGE_STORE_ACTION to go through", () => {
      const action = { type: MERGE_STORE_ACTION };
      const next = sinon.spy();
      rehydrationMiddleware(store)(next)(action);
      assert.calledWith(next, action);
    });
    it("should not allow actions from main to go through before MERGE_STORE_ACTION was received", () => {
      const next = sinon.spy();
      const dispatch = rehydrationMiddleware(store)(next);

      dispatch(ac.BroadcastToContent({ type: "FOO" }));
      dispatch(ac.AlsoToOneContent({ type: "FOO" }, 123));

      assert.notCalled(next);
    });
    it("should allow all local actions to go through", () => {
      const action = { type: "FOO" };
      const next = sinon.spy();
      rehydrationMiddleware(store)(next)(action);
      assert.calledWith(next, action);
    });
    it("should allow actions from main to go through after MERGE_STORE_ACTION has been received", () => {
      const next = sinon.spy();
      const dispatch = rehydrationMiddleware(store)(next);

      dispatch({ type: MERGE_STORE_ACTION });
      next.resetHistory();

      const action = ac.AlsoToOneContent({ type: "FOO" }, 123);
      dispatch(action);
      assert.calledWith(next, action);
    });
    it("should not let startup actions go through for the preloaded about:home document", () => {
      globals.set("__FROM_STARTUP_CACHE__", true);
      const next = sinon.spy();
      const dispatch = rehydrationMiddleware(store)(next);
      const action = ac.BroadcastToContent(
        { type: "FOO", meta: { isStartup: true } },
        123
      );
      dispatch(action);
      assert.notCalled(next);
    });
  });
  describe("queueEarlyMessageMiddleware", () => {
    it("should allow all local actions to go through", () => {
      const action = { type: "FOO" };
      const next = sinon.spy();

      queueEarlyMessageMiddleware(store)(next)(action);

      assert.calledWith(next, action);
    });
    it("should allow action to main that does not belong to EARLY_QUEUED_ACTIONS to go through", () => {
      const action = ac.AlsoToMain({ type: "FOO" });
      const next = sinon.spy();

      queueEarlyMessageMiddleware(store)(next)(action);

      assert.calledWith(next, action);
    });
    it(`should line up EARLY_QUEUED_ACTIONS only let them go through after it receives the action from main`, () => {
      EARLY_QUEUED_ACTIONS.forEach(actionType => {
        const testStore = initStore({ number: addNumberReducer });
        const next = sinon.spy();
        const dispatch = queueEarlyMessageMiddleware(testStore)(next);
        const action = ac.AlsoToMain({ type: actionType });
        const fromMainAction = ac.AlsoToOneContent({ type: "FOO" }, 123);

        // Early actions should be added to the queue
        dispatch(action);
        dispatch(action);

        assert.notCalled(next);
        assert.equal(testStore.getState.earlyActionQueue.length, 2);
        next.resetHistory();

        // Receiving action from main would empty the queue
        dispatch(fromMainAction);

        assert.calledThrice(next);
        assert.equal(next.firstCall.args[0], fromMainAction);
        assert.equal(next.secondCall.args[0], action);
        assert.equal(next.thirdCall.args[0], action);
        assert.equal(testStore.getState.earlyActionQueue.length, 0);
        next.resetHistory();

        // New action should go through immediately
        dispatch(action);
        assert.calledOnce(next);
        assert.calledWith(next, action);
      });
    });
  });
  describe("initMoCoCNPrefs", () => {
    it("should read values from localStorage", () => {
      globals.sandbox.stub(global.Storage.prototype, "getItem").returns("1");
      globals.sandbox.stub(store, "dispatch");

      initMoCoCNPrefs(store);

      assert.calledThrice(global.localStorage.getItem);
      assert.calledOnce(store.dispatch);
      assert.calledWith(store.dispatch, {
        type: at.MOCOCN_PREFS_INITIAL_VALUES,
        data: {
          "redux.promo.both.hideUntil": 1,
          "redux.promo.left.hideUntil": 1,
          "redux.promo.right.hideUntil": 1,
        }
      });
    });

    it("should not throw if data in localStorage is not valid JSON", () => {
      globals.sandbox.stub(global.Storage.prototype, "getItem").returns("Invalid JSON");
      globals.sandbox.stub(store, "dispatch");

      assert.doesNotThrow(() => { initMoCoCNPrefs(store) });
      assert.calledOnce(store.dispatch);
      assert.calledWith(store.dispatch, {
        type: at.MOCOCN_PREFS_INITIAL_VALUES,
        data: {
          "redux.promo.both.hideUntil": 0,
          "redux.promo.left.hideUntil": 0,
          "redux.promo.right.hideUntil": 0,
        }
      });
    });

    it("should log errors if dispatching initial values failed but not throw", () => {
      globals.sandbox.stub(global.console, "error");
      globals.sandbox.stub(store, "dispatch").throws(Error("failed"));

      assert.doesNotThrow(() => { initMoCoCNPrefs(store) });
      assert.calledOnce(global.console.error);
    });

  });
});
