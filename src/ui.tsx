/* global AFRAME */
import './assets/style.css';
import nipplejs from 'nipplejs'
import { render } from 'solid-js/web';
import { Show, createSignal } from 'solid-js';
import { IoSettingsOutline } from 'solid-icons/io';
import { MicButton } from './MicButton';
import { CameraButton } from './CameraButton';
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

const Joystick = () => {
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

  const cameraEl = document.getElementById('camera') as Entity;
  // turn joystick data into WASD movement in AFRAME
  var f; var ang; var xVec; var yVec;

  // Listen to joystick events
  joystick.on('move', function (evt, data) {
    f = data.force;
    ang = data.angle.radian

    xVec = Math.cos(ang + 3.14 / 180 * cameraEl.getAttribute('rotation').y);
    yVec = Math.sin(ang + 3.14 / 180 * cameraEl.getAttribute('rotation').y);

    var x = cameraEl.getAttribute("position").x + f / 15 * (xVec);
    var y = cameraEl.getAttribute("position").y
    var z = cameraEl.getAttribute("position").z - f / 15 * (yVec);

    cameraEl.setAttribute("position", `${x} ${y} ${z}`)
  });
}

const BottomBar = () => {
  return (
    <div class="naf-bottom-bar-center">
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
      <MicButton entity="#player" />
      <CameraButton entity="#player" />
      <UsersButton />
      <ChatButton />
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
        <Joystick />
      </Show>
    </>
  );
};

const root = document.createElement('div');
document.body.appendChild(root);
render(() => <App />, root);
