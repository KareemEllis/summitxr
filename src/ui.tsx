/* global AFRAME */
import './assets/style.css';
import { render } from 'solid-js/web';
import { Show, createSignal } from 'solid-js';

import { IoSettingsOutline } from 'solid-icons/io';
import { BsThreeDots } from 'solid-icons/bs';

import { JoystickWASD, LookJoystick } from './components/JoystickControls';
import { MicButton } from './components/MicButton';
import { CameraButton } from './components/CameraButton';
import { ScreenShareButton } from './components/ScreenShareButton';
import { UsernameInput } from './components/UsernameInput';
import { ChatButton, showChatPanel } from './components/Chat';
import { UsersButton, showUsersPanel } from './components/UsersButton';
import { ModelButtonWithPanel, showModelPanel, setShowModelPanel } from './components/ModelButtonWithPanel';

const [showSettings, setShowSettings] = createSignal(false);
const [entered, setEntered] = createSignal(false);
const [sceneLoaded, setSceneLoaded] = createSignal(false);

const UserForm = () => {
  return (
    <div class="flex flex-col gap-2">
      <label for="username">Your name</label>
      <UsernameInput entity="#player" />
    </div>
  );
};

const SettingsScreen = () => {
  return (
    <div class="naf-centered-fullscreen">
      <UserForm />
      <button
        type="button"
        id="saveSettingsButton"
        class="btn min-w-[100px]"
        onClick={() => {
          setShowSettings(false);
        }}
      >
        Close
      </button>
    </div>
  );
};

const EnterScreen = () => {
  return (
    <div class="naf-centered-fullscreen">
      <UserForm />
      <button
        type="button"
        id="playButton"
        class="btn min-w-[100px]"
        onClick={() => {
          setEntered(true);
          const sceneEl = document.querySelector('a-scene');
          // emit connect when the scene has loaded
          const sceneLoadedCallback = () => {
            setSceneLoaded(true);
            // @ts-ignore
            sceneEl?.emit('connect');
          };

          // @ts-ignore
          if (sceneEl.hasLoaded) {
            sceneLoadedCallback();
          } else {
            // @ts-ignore
            sceneEl.addEventListener('loaded', sceneLoadedCallback);
          }
        }}
      >
        Enter
      </button>
    </div>
  );
};

const BottomBar = () => {
  const isVRHeadsetConnected = AFRAME.utils.device.checkHeadsetConnected();
  const isMobileDevice = AFRAME.utils.device.isMobile();

  // Signal for toggling the "more" dropdown menu
  const [showMoreMenu, setShowMoreMenu] = createSignal(false);

  return (
    <div class="naf-bottom-bar-center">
      {/* Mic Button */}
      <MicButton entity="#player" />

      {/* CameraButton */}
      <Show when={!isVRHeadsetConnected || isMobileDevice}>
        <CameraButton entity="#player" />
      </Show>

      {/* Users Button */}
      <UsersButton />

      {/* Chat Button */}
      <ChatButton />

      {/* "More" Button and Dropdown Menu */}
      <div class="more-menu-container">
        <button
          type="button"
          class="btn-secondary btn-rounded"
          classList={{ active: showMoreMenu() }}
          onClick={() => {
            setShowMoreMenu((prev) => !prev)
            if (showMoreMenu()) {
              setShowModelPanel(false);
            }
          }}
          title="More"
        >
          <BsThreeDots size={24} />
        </button>

        {/* Dropdown menu that appears when the "More" button is clicked */}
        <Show when={showMoreMenu()}>
          <div class="more-menu">
            {/* Settings Button */}
            <button
              type="button"
              id="settingsButton"
              class="btn-secondary btn-rounded"
              onClick={() => {
                setShowSettings(true);
              }}
              title="Settings"
            >
              <IoSettingsOutline size={24} />
            </button>

            {/* Screen Share Button */}
            <Show when={!isVRHeadsetConnected && !isMobileDevice}>
              <ScreenShareButton entity="#player" />
            </Show>

            <ModelButtonWithPanel />

          </div>
        </Show>
      </div>
    </div>
  );
};

const App = () => {
  // const isVRHeadsetConnected = AFRAME.utils.device.checkHeadsetConnected();
  const isMobileDevice = AFRAME.utils.device.isMobile();
  return (
    <>
      <Show when={!entered()}>
        <EnterScreen />
      </Show>
      <Show when={showSettings()}>
        <SettingsScreen />
      </Show>
      <Show when={entered() && sceneLoaded() && !showSettings()}>
        <BottomBar />

        {/* Don't show the joysticks when the chat, model, or users panel is open */}
        <Show when={isMobileDevice && !showChatPanel() && !showModelPanel() && !showUsersPanel()}>
          <JoystickWASD />
          <LookJoystick />
        </Show>
      </Show>
    </>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);
render(() => <App />, root);
