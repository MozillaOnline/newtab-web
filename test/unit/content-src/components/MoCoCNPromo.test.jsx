import {
  _MoCoCNPromo as MoCoCNPromo,
} from "content-src/components/MoCoCNPromo/MoCoCNPromo";
import React from "react";
import { shallow } from "enzyme";
import { actionTypes as at } from "common/Actions.sys.mjs";

// Maybe should override `Date.now` instead of using 4e5/1e6 ?

describe("<MoCoCNPromo>", () => {
  let DEFAULT_PROPS = {
    MoCoCNPrefs: { values: {} },
    Prefs: { values: { "feeds.topsites": true } },
    Sections: [{ enabled: true, id: "topstories", pref: {} }],
    TopSites: { pref: {} },
    options: {
      image: "http://blog.seanmartell.com/wp-content/uploads/2012/03/logo_0000_1-150x150.png",
      imageHeight: "150px",
      imageWidth: "150px",
    },
    shownUntil: "1000000",
    type: "float",
    url: "https://www.mozilla.org/firefox",
    variant: "right",
  };

  it("should render MoCoCNPromo component with its content", () => {
    const wrapper = shallow(<MoCoCNPromo {...DEFAULT_PROPS} />);
    assert.ok(wrapper.exists());
    assert.lengthOf(wrapper.find("aside"), 1);
    assert.lengthOf(wrapper.find("aside > .float_promo"), 1);
  });

  [
    { props: { type: "float", variant: "left" }, expected: "left" },
    { props: { type: "float", variant: "right" }, expected: "right" },
    { props: { type: "skin", variant: "left" }, expected: "both" },
    { props: { type: "skin", variant: "right" }, expected: "both" },
  ].forEach(({ props, expected }) => {
    it(`pref key should be "${expected}" for "${props.type}" on the ${props.variant} side`, () => {
      const prefKeyProps = Object.assign({}, DEFAULT_PROPS, props);
      const expectedPrefKey = `redux.promo.${expected}.hideUntil`;

      const wrapper = shallow(<MoCoCNPromo {...prefKeyProps} />);
      assert.equal(wrapper.instance().getPrefKey(), expectedPrefKey);
    });
  });

  [
    { props: { variant: "invalid" }, rawValue: "invalid", expected: 0 },
    { props: { variant: "invalid" }, rawValue: 7, expected: 0 },
    { props: { variant: "left" }, rawValue: 2, expected: 7 },
    { props: { variant: "main" }, rawValue: undefined, expected: 2 },
    { props: { variant: "right" }, rawValue: 5, expected: 18 },
  ].forEach(({ props, rawValue, expected }) => {
    it(`should normalize rawValue "${rawValue}" with variant "${props.variant}" to ${expected}`, () => {
      const normalizeProps = Object.assign({}, DEFAULT_PROPS, props);

      const wrapper = shallow(<MoCoCNPromo {...normalizeProps} />);
      assert.equal(wrapper.instance().normalize(rawValue), expected);
    });
  });

  describe(".onClick", () => {
    const dispatch = sinon.stub();
    const preventDefault = sinon.stub();
    const url = "https://test.example.com/";
    const clickProps = Object.assign({}, DEFAULT_PROPS, { dispatch, url });

    const wrapper = shallow(<MoCoCNPromo {...clickProps} />);
    wrapper.find("aside > .float_promo").simulate("click", { preventDefault });

    it("preventDefault should be called on the event", () => {
      assert.calledOnce(preventDefault);
    });

    it("dispatch should be called twice", () => {
      assert.calledTwice(dispatch);
    });

    it("first dispatch should be called with OPEN_LINK", () => {
      const [firstAction] = dispatch.firstCall.args;
      assert.propertyVal(firstAction, "type", at.OPEN_LINK);
      assert.propertyVal(firstAction.data, "url", url);
    });

    it("second dispatch should be called for telemetry", () => {
      const [secondAction] = dispatch.secondCall.args;
      assert.isUserEventAction(secondAction);
      assert.propertyVal(secondAction.data, "event", "CLICK");
      assert.propertyVal(secondAction.data, "source", "MOCOCN_PROMO");
      assert.propertyVal(secondAction.data, "action_position", 3);
    });
  });

  [
    { hideUntil: 0, variant: "right", expected: 3 },
    { hideUntil: 400000, variant: "left", expected: 91 },
  ].forEach(({ hideUntil, variant, expected }) => {
    describe(`.onCloseSelf, ${hideUntil ? "once" : "never"} closed in the past`, () => {
      const dispatch = sinon.stub();
      const preventDefault = sinon.stub();
      const stopPropagation = sinon.stub();
      const clickProps = Object.assign({}, DEFAULT_PROPS, {
        MoCoCNPrefs: { values: {
          [`redux.promo.${variant}.hideUntil`]: hideUntil,
        }},
        dispatch,
        shownUntil: "1000000",
        variant,
      });

      const wrapper = shallow(<MoCoCNPromo {...clickProps} />);
      wrapper.find("aside > .float_promo > .closeSelf").simulate("click", {
        preventDefault,
        stopPropagation,
      });

      it("preventDefault should be called on the event", () => {
        assert.calledOnce(preventDefault);
      });

      it("stopPropagation should be called on the event", () => {
        assert.calledOnce(stopPropagation);
      });

      it("dispatch should be called twice", () => {
        assert.calledTwice(dispatch);
      });

      it("first dispatch should be called with MOCOCN_SET_PREF", () => {
        const [firstAction] = dispatch.firstCall.args;
        assert.propertyVal(firstAction, "type", at.MOCOCN_SET_PREF);
        assert.propertyVal(firstAction.data, "name", `redux.promo.${variant}.hideUntil`);
        // `1000000` is 2084-01-29T16:00:00.000Z, first 1AM UTC/9AM CST after
        // that is `1000009`, which is 2084-01-30T01:00:00.000Z.
        assert.propertyVal(firstAction.data, "value", 1000009);
      });

      it("second dispatch should be called for telemetry", () => {
        const [secondAction] = dispatch.secondCall.args;
        assert.isUserEventAction(secondAction);
        assert.propertyVal(secondAction.data, "event", "BLOCK");
        assert.propertyVal(secondAction.data, "source", "MOCOCN_PROMO");
        assert.propertyVal(secondAction.data, "action_position", expected);
      });
    });
  });

  it("should render empty <aside> if expired", () => {
    const expiredProps = Object.assign({}, DEFAULT_PROPS, {
      shownUntil: "0",
    });

    const wrapper = shallow(<MoCoCNPromo {...expiredProps} />);
    assert.ok(wrapper.exists());
    assert.lengthOf(wrapper.find("aside"), 1);
    assert.isFalse(wrapper.find("aside").children().exists());
  });

  it("should render empty <aside> if still hidden by user", () => {
    const hiddenProps = Object.assign({}, DEFAULT_PROPS, {
      MoCoCNPrefs: { values: {
        "redux.promo.left.hideUntil": 1000000,
      }},
      variant: "left",
    });

    const wrapper = shallow(<MoCoCNPromo {...hiddenProps} />);
    assert.ok(wrapper.exists());
    assert.lengthOf(wrapper.find("aside"), 1);
    assert.isFalse(wrapper.find("aside").children().exists());
  });

  it("should render non-empty <aside> if once hidden by user", () => {
    const onceHiddenProps = Object.assign({}, DEFAULT_PROPS, {
      MoCoCNPrefs: { values: {
        "redux.promo.right.hideUntil": 400000,
      }},
      variant: "right",
    });

    const wrapper = shallow(<MoCoCNPromo {...onceHiddenProps} />);
    assert.ok(wrapper.exists());
    assert.lengthOf(wrapper.find("aside"), 1);
    assert.lengthOf(wrapper.find("aside > .float_promo"), 1);
  });

  [
    { topSites: false, topStories: false, expected: false },
    { topSites: false, topStories: true, expected: true },
    { topSites: true, topStories: false, expected: true },
    { topSites: true, topStories: true, expected: true },
  ].forEach(({ topSites, topStories, expected }) => {
    it(`should${expected ? "" : " not"} render <aside>, when enabled(topSites=${topSites} & topStories=${topStories})`, () => {
      const disabledProps = Object.assign({}, DEFAULT_PROPS, {
        Prefs: { values: { "feeds.topsites": topSites } },
        Sections: [{ enabled: topStories, id: "topstories", pref: {} }],
      });

      const wrapper = shallow(<MoCoCNPromo {...disabledProps} />);
      assert.ok(wrapper.exists());
      assert.equal(wrapper.children().exists(), expected);
    });
  });

  [
    { topSites: undefined, topStories: undefined, expected: true },
    { topSites: undefined, topStories: true, expected: true },
    { topSites: true, topStories: undefined, expected: true },
    { topSites: true, topStories: true, expected: false },
  ].forEach(({ topSites, topStories, expected }) => {
    it(`should${expected ? "" : " not"} render <aside>, when collapsed(topSites=${topSites} & topStories=${topStories})`, () => {
      const collapsedProps = Object.assign({}, DEFAULT_PROPS, {
        TopSites: { pref: { collapsed: topSites } },
        Sections: [{ enabled: true, id: "topstories", pref: { collapsed: topStories } }],
      });

      const wrapper = shallow(<MoCoCNPromo {...collapsedProps} />);
      assert.ok(wrapper.exists());
      assert.equal(wrapper.children().exists(), expected);
    });
  });

  [
    { variant: "left", closeButtonCount: 0 },
    { variant: "right", closeButtonCount: 1 },
  ].forEach(({ variant, closeButtonCount }) => {
    describe(`skin promo on the ${variant} side`, () => {
      const skinProps = Object.assign({}, DEFAULT_PROPS, {
        options: {
          imageBg: "https://test.example.com/static/img/background.png",
          imageFg: "https://test.example.com/static/img/foreground.png",
          imageHeight: "185px",
          imageWidth: "300px",
        },
        type: "skin",
        url: "https://test.example.com/",
        variant,
      });
      const columns = 5;
      const rows = 21;
      const wrapper = shallow(<MoCoCNPromo {...skinProps} />);

      it("should render an unordered list", () => {
        assert.ok(wrapper.exists());
        assert.lengthOf(wrapper.find("aside"), 1);
        assert.lengthOf(wrapper.find("aside > ul"), 1);
        assert.isTrue(wrapper.find("aside > ul").hasClass("skin_promo"));
      });

      it(`should render an unordered list with ${columns * rows} list item`, () => {
        assert.lengthOf(wrapper.find("aside > .skin_promo > li"), columns * rows);
      });

      it(`half of those ${columns * rows} list item should contains an anchor`, () => {
        assert.lengthOf(wrapper.find("aside > .skin_promo > li > a"), (columns * rows + 1) / 2);
      });

      it(`there should be ${closeButtonCount} close button on the ${variant} side`, () => {
        assert.lengthOf(wrapper.find("aside > .skin_promo > li > .closeSelf"), closeButtonCount);
      });
    });
  });

  it("should render empty <aside> for placeholder", () => {
    const placeholderProps = Object.assign({}, DEFAULT_PROPS, {
      type: "placeholder",
    });

    const wrapper = shallow(<MoCoCNPromo {...placeholderProps} />);
    assert.ok(wrapper.exists());
    assert.lengthOf(wrapper.find("aside"), 1);
    assert.isFalse(wrapper.find("aside").children().exists());
  });
});
