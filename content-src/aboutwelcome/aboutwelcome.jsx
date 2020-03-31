/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from "react";
import ReactDOM from "react-dom";
import { HeroText } from "./components/HeroText";
import { FxCards } from "./components/FxCards";
import {
  AboutWelcomeUtils,
  DEFAULT_WELCOME_CONTENT,
} from "../lib/aboutwelcome-utils";

class AboutWelcome extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { metricsFlowUri: null };
    this.fetchFxAFlowUri = this.fetchFxAFlowUri.bind(this);
    this.handleStartBtnClick = this.handleStartBtnClick.bind(this);
  }

  async fetchFxAFlowUri() {
    this.setState({ metricsFlowUri: await window.AWGetFxAMetricsFlowURI() });
  }

  componentDidMount() {
    this.fetchFxAFlowUri();
    window.AWSendEventTelemetry({
      event: "IMPRESSION",
      message_id: "SIMPLIFIED_ABOUT_WELCOME",
    });
    // Captures user has seen about:welcome by setting
    // firstrun.didSeeAboutWelcome pref to true
    window.AWSendToParent("SET_WELCOME_MESSAGE_SEEN");
  }

  handleStartBtnClick() {
    AboutWelcomeUtils.handleUserAction(this.props.startButton.action);
    const ping = {
      event: "CLICK_BUTTON",
      message_id: this.props.startButton.message_id,
      id: "ABOUT_WELCOME",
    };
    window.AWSendEventTelemetry(ping);
  }

  render() {
    const { props } = this;
    return (
      <div className="trailheadCards">
        <div className="trailheadCardsInner">
          <main>
            <HeroText title={props.title} subtitle={props.subtitle} />
            <FxCards
              cards={props.cards}
              metricsFlowUri={this.state.metricsFlowUri}
              sendTelemetry={window.AWSendEventTelemetry}
            />
            {props.startButton && props.startButton.string_id && (
              <button
                className="start-button"
                data-l10n-id={props.startButton.string_id}
                onClick={this.handleStartBtnClick}
              />
            )}
          </main>
        </div>
      </div>
    );
  }
}

AboutWelcome.defaultProps = DEFAULT_WELCOME_CONTENT;

function mount(settings) {
  ReactDOM.render(
    <AboutWelcome title={settings.title} subtitle={settings.subtitle} />,
    document.getElementById("root")
  );
}

mount(window.AWGetStartupData());
