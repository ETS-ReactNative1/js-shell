import React, {Component} from 'react';
import Window from './Window';
import Gesture from '../../Gesture';
import {Row, Column} from '../../Layout';

export default class WindowHeader extends Component {
  _initialWindowPosition = {};
  _initialTouchPosition = {};

  constructor(props) {
    super(props);

    const {desktopWindow} = this.props;
    if (!(desktopWindow instanceof Window)) {
      throw new Error('desktopWindow must be instance of Window');
    }
  }

  handleTouchStart = (evt) => {
    const {desktopWindow} = this.props;
  
    let {x: winPosX, y: winPosY} = desktopWindow.getPosition();
    // winPosX = winPosX || 0;
    // winPosY = winPosY || 0;

    // console.debug('touch start', evt);
    this._initialWindowPosition = {
      x: winPosX,
      y: winPosY
    };

    // TODO: Remove
    // console.debug('start', evt);
    // console.debug('initial window position', this._initialTouchPosition);
  }

  handleTouchMove = (evt) => {
    const {desktopWindow} = this.props;
    const {x: initialWinPosX, y: initialWinPosY} = this._initialWindowPosition;

    const deltaX = evt.delta[0];
    const deltaY = evt.delta[1];

    const newX = initialWinPosX + deltaX;
    const newY = initialWinPosY + deltaY;

    desktopWindow.moveTo(newX, newY);
  }

  // TODO: Handle touch end (if necessary)
  handleTouchEnd = (evt) => {
    console.debug('touch end', evt);
  }

  render() {
    let {desktopWindow, className, title, toolbar, toolbarRight, subToolbar, ...propsRest} = this.props;
    
    if (!toolbar) {
      // TODO: Implement specifically for relevant browser
      // 2 - 3 works best on Chrome
      // 3 - 4 works best on Firefox
      toolbar = <div style={{marginTop: 2}}>{title}</div>
    }
    
    return (
      <div
        {...propsRest}
        className={`WindowHeader ${className ? className : ''}`}
      >
        <Gesture
          touch={true}
          mouse={true}
          onDown={(evt) => this.handleTouchStart(evt)}
          onMove={(evt) => this.handleTouchMove(evt)}
          onUp={(evt) => this.handleTouchEnd(evt)}
          // onMove={ evt => console.debug(evt) /* (evt) => desktopWindow.moveTo(evt.xy[0], evt.xy[1]) */}
        >
          <div>
            {
              // TODO: Dynamically pad depending on if Chrome or Firefox
            }
            <Row style={{paddingBottom: 1}}>
              {
                // TODO: Move styles to CSS declaration
              }
              <Column style={{textAlign: 'left'}}>
                <div style={{display: 'inline-block', paddingLeft: 2, overflow: 'hidden'}}>
                  <button
                    className="Dot Red"
                    onClick={(evt) => desktopWindow.close()}
                  ></button>
                  <button
                    className="Dot Yellow"
                    onClick={(evt) => desktopWindow.toggleMinimize()}
                  ></button>
                  <button
                    className="Dot Green"
                    onClick={(evt) => desktopWindow.toggleMaximize()}
                  ></button>
                </div>
              </Column>
              <Column style={{textAlign: 'center'}}>
                <div style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', display: 'inline-block', verticalAlign: 'middle' }}>
                  {
                    toolbar
                  }
                </div>
              </Column>
              <Column style={{textAlign: 'right'}}>
                <div className="column right">
                  {
                    toolbarRight
                  }
                </div>
              </Column>
            </Row>
          </div>

          {
            subToolbar &&
            <div className="SubToolbar">
              {
                subToolbar
              }
            </div>
          }
          
        </Gesture>
      </div>
    );
  }
};