/* global AFRAME */
import './assets/style.css';
import nipplejs from 'nipplejs'
import { render } from 'solid-js/web';
import { Show, createSignal } from 'solid-js';
import { IoSettingsOutline } from 'solid-icons/io';
import { BsThreeDots } from 'solid-icons/bs';
import { MicButton } from './MicButton';
import { CameraButton } from './CameraButton';
import { ScreenShareButton } from './ScreenShareButton';
import { UsernameInput } from './UsernameInput';
import { ChatButton } from './Chat';
import { UsersButton } from './UsersButton';
import { Entity } from 'aframe';
// import { Joystick } from './Joystick';

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

const JoystickWASD = () => {
  const joystickZone = document.getElementById('zone_joystick');
  if (!joystickZone) {
    return null; // or handle the error
  }

  var joystick = nipplejs.create({
    zone: joystickZone,
    mode: 'static',
    position: { left: '50%', top: '50%' }, // Center the joystick
    color: 'blue'
  });

  const playerEl = document.getElementById('player') as Entity;
  // turn joystick data into WASD movement in AFRAME
  var f; var ang; var xVec; var yVec;

  // Listen to joystick events
  joystick.on('move', function (evt, data) {
    f = data.force;
    ang = data.angle.radian

    xVec = Math.cos(ang + 3.14 / 180 * playerEl.getAttribute('rotation').y);
    yVec = Math.sin(ang + 3.14 / 180 * playerEl.getAttribute('rotation').y);

    var x = playerEl.getAttribute("position").x + f / 15 * (xVec);
    var y = playerEl.getAttribute("position").y
    var z = playerEl.getAttribute("position").z - f / 15 * (yVec);

    playerEl.setAttribute("position", `${x} ${y} ${z}`)
  });
}

const LookJoystick = () => {
  const joystickZone = document.getElementById('joystick_look');
  if (!joystickZone) {
    return null; // we can handle errors here
  }

  const joystick = nipplejs.create({
    zone: joystickZone,
    mode: 'static',
    position: { right: '50%', top: '50%' }, // Center the joystick
    color: 'red',
  });

  const playerEl = document.getElementById('player') as Entity;

  joystick.on('move', function (evt, data) {
    const rotation = playerEl.getAttribute('rotation');
    const deltaX = data.vector.x * 2; // Adjust sensitivity as needed
    const deltaY = data.vector.y * 2;

    const newRotationY = rotation.y - deltaX;
    const newRotationX = Math.max(-90, Math.min(90, rotation.x + deltaY)); // Limit pitch rotation

    playerEl.setAttribute('rotation', `${newRotationX} ${newRotationY} 0`);
  });
};

const BottomBar = () => {
  const isVRHeadsetConnected = AFRAME.utils.device.checkHeadsetConnected();
  const isMobileDevice = AFRAME.utils.device.isMobile();

  // Signal for toggling the "more" dropdown menu
  const [showMoreMenu, setShowMoreMenu] = createSignal(false);

  return (
    <div class="naf-bottom-bar-center">
      <MicButton entity="#player" />

      {/* Conditionally render the CameraButton and ScreenShareButton */}
      <Show when={!isVRHeadsetConnected || isMobileDevice}>
        <CameraButton entity="#player" />
      </Show>

      <UsersButton />
      <ChatButton />

      {/* "More" Button and Dropdown Menu */}
      <div class="more-menu-container">
        <button
          type="button"
          class="btn-secondary btn-rounded"
          onClick={() => setShowMoreMenu((prev) => !prev)}
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

          </div>
        </Show>
      </div>
    </div>
  );
};

const App = () => {
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
        <JoystickWASD />
        <LookJoystick />
      </Show>
    </>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);
render(() => <App />, root);
