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

// Signal for toggling the "more" dropdown menu
const [showMoreMenu, setShowMoreMenu] = createSignal(false);

function getRoomName() {
  const sceneEl = document.querySelector('a-scene');

  // Get the networked-scene component's attribute
  const networkedSceneAttr = sceneEl.getAttribute('networked-scene');

  // Parse the attribute to extract the room name
  const roomName = networkedSceneAttr.room;

  return roomName;
}

const UserForm = () => {
  return (
    <div class="flex flex-col gap-2 my-5">
      <label for="username">Your name</label>
      <UsernameInput entity="#player" />
    </div>
  );
};

const SettingsScreen = () => {
  const roomName = getRoomName();
  return (
    <div class="naf-centered-fullscreen">
      <img alt="Logo" src="./assets/Logo.webp" class="w-20" />
      <h2 class="text-2xl font-bold">SummitXR</h2>
      <h3 class="text-2xl font-medium">Settings</h3>

      <h4 class="text-sm mt-2">Room</h4>
      <p class='text-md font-medium'>{roomName}</p>

      <UserForm />
      <button
        type="button"
        id="saveSettingsButton"
        class="btn btn-primary min-w-[100px]"
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
      <img alt="Logo" src="./assets/Logo.webp" class="w-20" />
      <h2 class="text-2xl font-bold">SummitXR</h2>
      <h3 class="text-2xl font-medium">Ready to join?</h3>

      <UserForm />
      <button
        type="button"
        id="playButton"
        class="btn btn-primary min-w-[100px]"
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
        Join now
      </button>
    </div>
  );
};

const BottomBar = () => {
  const isVRHeadsetConnected = AFRAME.utils.device.checkHeadsetConnected();
  const isMobileDevice = AFRAME.utils.device.isMobile();

  return (
    <div class="naf-bottom-bar-center">
      {/* Mic Button */}
      <MicButton entity="#player" />

      {/* CameraButton */}
      <Show when={!isVRHeadsetConnected || isMobileDevice}>
        <CameraButton entity="#player" />
      </Show>

      {/* Chat Button */}
      <ChatButton />

      {/* "More" Button and Dropdown Menu */}
      <div class="more-menu-container">
        <button
          type="button"
          class="btn btn-circle btn-xs w-10 h-10 border shadow-md"
          classList={{
            "btn-neutral": showMoreMenu(),
            "btn-active": showMoreMenu()
          }}
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
              class="btn btn-circle btn-xs w-10 h-10 border shadow-md"
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

            {/* Users Button */}
            <UsersButton />

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

  // Determine if any panel or menu is open
  const isAnyPanelOpen = () => {
    return showChatPanel() || showModelPanel() || showMoreMenu() || showUsersPanel();
  };

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
        <Show when={isMobileDevice && !isAnyPanelOpen()}>
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
