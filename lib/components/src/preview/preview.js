import React, { Component, Fragment } from 'react';
import styled from 'react-emotion';

import { PointerBlock } from './pointerBlock';
import { Toolbar, Zoom, Address } from './toolbar';

const defaults = {
  grid: {
    backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
    backgroundPosition: '-2px -2px, -2px -2px, -1px -1px, -1px -1px',

    backgroundImage: `
    linear-gradient(rgba(0,0,0,0.05) 2px, transparent 2px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 2px, transparent 2px),
    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
  },
  background: {
    backgroundColor: 'transparent',
  },
};

class IFrame extends Component {
  shouldComponentUpdate() {
    // this component renders an iframe, which gets updates via post-messages
    return false;
  }

  render() {
    const { id, title, src, allowFullScreen, ...rest } = this.props;
    return <iframe id={id} title={title} src={src} allowFullScreen={allowFullScreen} {...rest} />;
  }
}

const Frame = styled('div')(
  {
    position: 'absolute',
    top: 0,
    left: 0,
    border: '0 none',
    overflow: 'hidden',
    transition: 'transform .2s ease-out, height .2s ease-out, width .2s ease-out',
    transformOrigin: 'top left',
  },
  ({ grid = defaults.grid }) => grid,
  ({ background = defaults.background }) => background,
  {
    '& > iframe': {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
    },
  }
);

const FrameWrap = styled('div')(({ offset, full }) => ({
  position: full ? 'fixed' : 'absolute',
  overflow: 'auto',
  left: 0,
  right: 0,
  bottom: 0,
  top: full ? 0 : offset,
  zIndex: full ? 1 : 3,
  height: full ? '100vh' : `calc(100% - ${offset}px)`,
  background: full ? 'white' : 'transparent',
}));

class Preview extends Component {
  state = {
    zoom: 1,
  };

  render() {
    const {
      id,
      isDragging,
      full = false,
      toolbar = true,
      url = 'https://example.com',
    } = this.props;
    const { zoom } = this.state;

    const toolbarHeight = toolbar ? 40 : 0;

    return (
      <Fragment>
        <PointerBlock shown={isDragging} />
        <FrameWrap offset={toolbarHeight} full={full} id="storybook-preview-background">
          <Frame
            style={{
              width: `${100 * zoom}%`,
              height: `${100 * zoom}%`,
              transform: `scale(${1 / zoom})`,
            }}
          >
            <IFrame
              id="storybook-preview-iframe"
              title={id || 'preview'}
              src={url}
              allowFullScreen
            />
          </Frame>
        </FrameWrap>
        {toolbar && !full ? (
          <Toolbar
            left={[<Address key="address" value={url} readOnly />]}
            right={[
              <Zoom key="zoom" current={zoom} set={v => this.setState({ zoom: zoom * v })} />,
            ]}
          />
        ) : null}
      </Fragment>
    );
  }
}

export { Preview };