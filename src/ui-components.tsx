import './assets/style.css';
import { customElement, noShadowDOM } from 'solid-element';
import { ChatButton } from './components/Chat';
import { MicButton } from './components/MicButton';
import { CameraButton } from './components/CameraButton';
import { ScreenShareButton } from './components/ScreenShareButton';
import { UsernameInput } from './components/UsernameInput';
import { UsersButton } from './components/UsersButton';

customElement('naf-mic-button', { entity: '#player' }, (props) => {
  noShadowDOM();
  return <MicButton {...props} />;
});

customElement('naf-camera-button', { entity: '#player' }, (props) => {
  noShadowDOM();
  return <CameraButton {...props} />;
});

customElement('naf-screenshare-button', { entity: '#player' }, (props) => {
  noShadowDOM();
  return <ScreenShareButton {...props} />;
});

customElement('naf-username-input', { entity: '#player', enableColorPicker: true }, (props) => {
  noShadowDOM();
  return <UsernameInput {...props} />;
});

customElement('naf-chat-button', () => {
  noShadowDOM();
  return <ChatButton />;
});

customElement('naf-users-button', () => {
  noShadowDOM();
  return <UsersButton />;
});
