import { actionCreators as ac, actionTypes as at } from "common/Actions.jsm";
import { connect } from "react-redux";
import React from "react";

export class _MoCoCNPromo extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onClick = this.onClick.bind(this);
    this.onCloseSelf = this.onCloseSelf.bind(this);
  }

  getPrefKey() {
    const shortKey = this.props.type === "skin"
      ? "both"
      : this.props.variant;
    return `redux.promo.${shortKey}.hideUntil`;
  }

  /*
   * normalized `action_position`:
   *
   * 1, 4, ... 3n + 1 for `left`
   * 2, 5, ... 3n + 2 for `main`
   * 3, 6, ... 3n + 3 for `right`
   * 0 for other (unknown) variant
   */
  normalize(rawValue = 0) {
    if (isNaN(rawValue)) {
      return 0;
    }

    switch (this.props.variant) {
      case "left":
        return rawValue * 3 + 1;
      case "main":
        return rawValue * 3 + 2;
      case "right":
        return rawValue * 3 + 3;
      default:
        return 0;
    }
  }

  onClick(event) {
    event.preventDefault();
    const { altKey, button, ctrlKey, metaKey, shiftKey } = event;

    this.props.dispatch(
      ac.OnlyToMain({
        type: at.OPEN_LINK,
        data: {
          event: { altKey, button, ctrlKey, metaKey, shiftKey },
          url: this.props.url,
        },
      })
    );

    this.props.dispatch(
      ac.UserEvent({
        event: "CLICK",
        source: "MOCOCN_PROMO",
        action_position: this.normalize(),
      })
    );
  }

  onCloseSelf(event) {
    event.preventDefault();
    event.stopPropagation();

    const name = this.getPrefKey();
    const oldValue = this.props.MoCoCNPrefs.values[name];
    const value = Math.ceil(Date.now() / 86400e3) * 24 + 1;

    this.props.dispatch({
      type: at.MOCOCN_SET_PREF,
      data: { name, value },
    });

    const diffInDays = oldValue &&
      Math.min(Math.round((value - oldValue) / 24), 30);
    this.props.dispatch(
      ac.UserEvent({
        event: "BLOCK",
        source: "MOCOCN_PROMO",
        action_position: this.normalize(diffInDays),
      })
    );
  }

  render() {
    const {
      MoCoCNPrefs,
      Sections,
      TopSites,
      options,
      shownUntil,
      type,
      url,
      variant
    } = this.props;

    const {
      [this.getPrefKey()]: hideUntil,
    } = MoCoCNPrefs.values;
    const currentHours = Date.now() / 3600e3;
    const shouldHide = (shownUntil && currentHours > shownUntil) || currentHours < hideUntil;

    const [topStories] = Sections.filter(section => section.id === "topstories");
    const showAside = !(TopSites.pref && TopSites.pref.collapsed) || !(topStories.pref && topStories.pref.collapsed);

    let asideChildren = [];
    switch (type) {
      case "float":
        asideChildren.push(
          <a className="float_promo" href={url} onClick={this.onClick} style={{
            "--mococn-promo-float-height": options.imageHeight,
            "--mococn-promo-float-width": options.imageWidth,
          }}>
            <button
              className="closeSelf icon icon-dismiss"
              onClick={this.onCloseSelf}
            />
          </a>
        );
        break;
      case "skin":
        const listItems = [];
        for (let i = 0, l = 5 * 21; i < l; i++) {
          listItems.push(
            <li>
              {(i % 2 == 0) &&
                <a href={url} onClick={this.onClick}>
                  <div className="background" />
                  <div className="foreground" />
                </a>
              }
              {(i == 15 && variant == "right") &&
                <button
                  className="closeSelf icon icon-dismiss"
                  onClick={this.onCloseSelf}
                />
              }
            </li>
          );
        }

        asideChildren.push(
          <ul className="skin_promo" style={{
            "--mococn-promo-skin-height": options.imageHeight,
            "--mococn-promo-skin-width": options.imageWidth,
          }}>
            {listItems}
          </ul>
        );
        break;
      default:
        break;
    }

    switch (variant) {
      default:
        return (showAside &&
          <aside data-side={variant}>
            {!shouldHide &&
              asideChildren
            }
          </aside>
        );
    }
  }
}

export const MoCoCNPromo = connect(state => ({
  MoCoCNPrefs: state.MoCoCNPrefs,
  Sections: state.Sections,
  TopSites: state.TopSites,
}))(_MoCoCNPromo);
