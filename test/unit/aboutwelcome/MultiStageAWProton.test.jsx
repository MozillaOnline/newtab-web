import { AboutWelcomeDefaults } from "aboutwelcome/lib/AboutWelcomeDefaults.jsm";
import { MultiStageProtonScreen } from "content-src/aboutwelcome/components/MultiStageProtonScreen";
import React from "react";
import { mount } from "enzyme";

describe("MultiStageAboutWelcomeProton module", () => {
  let sandbox;
  let clock;
  beforeEach(() => {
    clock = sinon.useFakeTimers();
    sandbox = sinon.createSandbox();
  });
  afterEach(() => {
    clock.restore();
    sandbox.restore();
  });

  describe("MultiStageAWProton component", () => {
    it("should render MultiStageProton Screen", () => {
      const SCREEN_PROPS = {
        content: {
          title: "test title",
          subtitle: "test subtitle",
        },
      };
      const wrapper = mount(<MultiStageProtonScreen {...SCREEN_PROPS} />);
      assert.ok(wrapper.exists());
    });

    it("should render section left for corner positioned screens", () => {
      const SCREEN_PROPS = {
        content: {
          position: "corner",
          title: "test title",
          hero_text: "test subtitle",
        },
      };
      const wrapper = mount(<MultiStageProtonScreen {...SCREEN_PROPS} />);
      assert.ok(wrapper.exists());
      assert.equal(wrapper.find(".welcome-text h1").text(), "test title");
      assert.equal(wrapper.find(".section-left h1").text(), "test subtitle");
      assert.equal(wrapper.find("main").prop("pos"), "corner");
    });

    it("should render with no section left for center positioned screens", () => {
      const SCREEN_PROPS = {
        content: {
          position: "center",
          title: "test title",
        },
      };
      const wrapper = mount(<MultiStageProtonScreen {...SCREEN_PROPS} />);
      assert.ok(wrapper.exists());
      assert.equal(wrapper.find(".section-left").exists(), false);
      assert.equal(wrapper.find(".welcome-text h1").text(), "test title");
      assert.equal(wrapper.find("main").prop("pos"), "center");
    });
  });

  describe("AboutWelcomeDefaults for proton", () => {
    const getData = () => AboutWelcomeDefaults.getDefaults();
    async function prepConfig(config) {
      return AboutWelcomeDefaults.prepareContentForReact({
        ...(await getData()),
        ...config,
      });
    }
    beforeEach(() => {
      sandbox.stub(global.Services.prefs, "getBoolPref").returns(true);
    });
    it("should have 'pin' button by default", async () => {
      const data = await getData();

      assert.propertyVal(
        data.screens[0].content.primary_button.action,
        "type",
        "PIN_FIREFOX_TO_TASKBAR"
      );
    });
    it("should have 'pin' button if we need default and pin", async () => {
      const data = await prepConfig({ needDefault: true, needPin: true });

      assert.propertyVal(
        data.screens[0].content.primary_button.action,
        "type",
        "PIN_FIREFOX_TO_TASKBAR"
      );
      assert.propertyVal(data.screens[0], "id", "AW_PIN_FIREFOX");
      assert.propertyVal(data.screens[1], "id", "AW_SET_DEFAULT");
      assert.lengthOf(data.screens, getData().screens.length - 1);
    });
    it("should keep 'pin' and remove 'default' if already default", async () => {
      const data = await prepConfig({ needPin: true });

      assert.propertyVal(data.screens[0], "id", "AW_PIN_FIREFOX");
      assert.propertyVal(data.screens[1], "id", "AW_IMPORT_SETTINGS");
      assert.lengthOf(data.screens, getData().screens.length - 2);
    });
    it("should switch to 'default' if already pinned", async () => {
      const data = await prepConfig({ needDefault: true });

      assert.propertyVal(data.screens[0], "id", "AW_ONLY_DEFAULT");
      assert.propertyVal(data.screens[1], "id", "AW_IMPORT_SETTINGS");
      assert.lengthOf(data.screens, getData().screens.length - 2);
    });
    it("should switch to 'start' if already pinned and default", async () => {
      const data = await prepConfig();

      assert.propertyVal(data.screens[0], "id", "AW_GET_STARTED");
      assert.propertyVal(data.screens[1], "id", "AW_IMPORT_SETTINGS");
      assert.lengthOf(data.screens, getData().screens.length - 2);
    });
    it("should have a FxA button", async () => {
      const data = await prepConfig();

      assert.notProperty(data, "skipFxA");
      assert.property(data.screens[0].content, "secondary_button_top");
    });
    it("should remove the FxA button if pref disabled", async () => {
      global.Services.prefs.getBoolPref.returns(false);

      const data = await prepConfig();

      assert.property(data, "skipFxA", true);
      assert.notProperty(data.screens[0].content, "secondary_button_top");
    });
    it("should have an image caption", async () => {
      const data = await prepConfig();

      assert.property(data.screens[0].content, "help_text");
    });
    it("should remove the caption if deleteIfNotEn is true", async () => {
      sandbox.stub(global.Services.locale, "appLocaleAsBCP47").value("de");

      const data = await prepConfig({
        id: "DEFAULT_ABOUTWELCOME_PROTON",
        template: "multistage",
        transitions: true,
        background_url: `chrome://activity-stream/content/data/content/assets/proton-bkg.avif`,
        screens: [
          {
            id: "AW_PIN_FIREFOX",
            content: {
              position: "corner",
              help_text: {
                deleteIfNotEn: true,
                string_id: "mr1-onboarding-welcome-image-caption",
              },
            },
          },
        ],
      });

      assert.notProperty(data.screens[0].content, "help_text");
    });
  });
  describe("AboutWelcomeDefaults prepareContentForReact", () => {
    it("should not set action without screens", async () => {
      const data = await AboutWelcomeDefaults.prepareContentForReact({
        ua: "test",
      });

      assert.propertyVal(data, "ua", "test");
      assert.notProperty(data, "screens");
    });
    it("should set action for import action", async () => {
      const TEST_CONTENT = {
        ua: "test",
        screens: [
          {
            id: "AW_IMPORT_SETTINGS",
            content: {
              primary_button: {
                action: {
                  type: "SHOW_MIGRATION_WIZARD",
                },
              },
            },
          },
        ],
      };
      const data = await AboutWelcomeDefaults.prepareContentForReact(
        TEST_CONTENT
      );
      assert.propertyVal(data, "ua", "test");
      assert.propertyVal(
        data.screens[0].content.primary_button.action.data,
        "source",
        "test"
      );
    });
    it("should not set action if the action type != SHOW_MIGRATION_WIZARD", async () => {
      const TEST_CONTENT = {
        ua: "test",
        screens: [
          {
            id: "AW_IMPORT_SETTINGS",
            content: {
              primary_button: {
                action: {
                  type: "SHOW_FIREFOX_ACCOUNTS",
                  data: {},
                },
              },
            },
          },
        ],
      };
      const data = await AboutWelcomeDefaults.prepareContentForReact(
        TEST_CONTENT
      );
      assert.propertyVal(data, "ua", "test");
      assert.notPropertyVal(
        data.screens[0].content.primary_button.action.data,
        "source",
        "test"
      );
    });
    it("should remove theme screens on win7", async () => {
      sandbox.stub(AppConstants, "isPlatformAndVersionAtMost").returns(true);

      const { screens } = await AboutWelcomeDefaults.prepareContentForReact({
        screens: [
          {
            content: {
              tiles: { type: "theme" },
            },
          },
          { id: "hello" },
          {
            content: {
              tiles: { type: "theme" },
            },
          },
          { id: "world" },
        ],
      });

      assert.deepEqual(screens, [{ id: "hello" }, { id: "world" }]);
    });
    it("shouldn't remove colorway screens on win7", async () => {
      sandbox.stub(AppConstants, "isPlatformAndVersionAtMost").returns(true);

      const { screens } = await AboutWelcomeDefaults.prepareContentForReact({
        screens: [
          {
            content: {
              tiles: { type: "colorway" },
            },
          },
          { id: "hello" },
          {
            content: {
              tiles: { type: "theme" },
            },
          },
          { id: "world" },
        ],
      });

      assert.deepEqual(screens, [
        {
          content: {
            tiles: { type: "colorway" },
          },
        },
        { id: "hello" },
        { id: "world" },
      ]);
    });
  });
});
