/* global NAF */
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show, untrack } from 'solid-js';
import { TbScreenShare, TbScreenShareOff } from 'solid-icons/tb';

export const [screenEnabled, setScreenEnabled] = createSignal(false);
const [isConnected, setIsConnected] = createSignal(false);

export const [screenShareAvailable, setScreenShareAvailable] = createSignal(false);

const [domContentLoaded, setDomContentLoaded] = createSignal(false);

document.addEventListener('DOMContentLoaded', () => {
  setDomContentLoaded(true);
  const sceneEl = document.querySelector('a-scene');

  const sceneLoaded = () => {
    // @ts-ignore
    const settings = sceneEl?.getAttribute('networked-scene');
    // @ts-ignore
    const adapter = settings.adapter;
    if (adapter !== 'easyrtc' && adapter !== 'janus') return;
    // @ts-ignore
    if (adapter === 'easyrtc' && !settings.video) return;

    setScreenShareAvailable(true);
  };

  // @ts-ignore
  if (sceneEl.hasLoaded) {
    sceneLoaded();
  } else {
    // @ts-ignore
    sceneEl.addEventListener('loaded', sceneLoaded);
  }
});

interface Props {
    entity?: string;
}

export const ScreenShareButton: Component<Props> = (props) => {
  const iconOff = createMemo(() => {
    return !screenEnabled();
  });

  const title = createMemo(() => {
    if (!iconOff()) {
      return 'Stop Screen Share';
    } else {
      return 'Share Screen';
    }
  });

  onMount(() => {
    if (NAF.connection.isConnected()) {
      setIsConnected(true);
    } else {
      const listener = () => {
        setIsConnected(true);
        toggleScreenDisplay(untrack(screenEnabled));
      };
      document.body.addEventListener('connected', listener);
      onCleanup(() => {
        document.body.removeEventListener('connected', listener);
      });
    }
  });

  const toggleScreenDisplay = (enabled: boolean) => {
    const scene = document.querySelector('a-scene');
    const rig = document.querySelector('#rig');
    const player = document.querySelector('#player');

    if (!rig || !scene || !player) return;

    const screenEntity = document.querySelector('#screen-display');

    if (enabled) {
      if (!screenEntity) {
        // Get the player's position and rotation
        const playerPosition = rig.getAttribute('position');
        const playerRotation = player.getAttribute('rotation');

        // Calculate the screen position in front of the player
        const offsetDistance = 2; // Distance in front of the player
        // @ts-ignore
        const radY = playerRotation.y * (Math.PI / 180); // Convert Y rotation to radians

        const screenPosition = {
          // @ts-ignore
          x: playerPosition.x + offsetDistance * Math.sin(radY),
          // @ts-ignore
          y: playerPosition.y + 1.5, // Adjust to place it at eye level
          // @ts-ignore
          z: playerPosition.z + offsetDistance * Math.cos(radY),
        };

        // Create the screen entity and set its attributes
        const screen = document.createElement('a-entity');
        screen.setAttribute('id', 'screen');
        screen.setAttribute('position', `${screenPosition.x} ${screenPosition.y} ${screenPosition.z}`);
        // @ts-ignore
        screen.setAttribute('rotation', `0 ${playerRotation.y} 0`); // Align the screen to face the player
        screen.setAttribute('networked', 'template:#screenshare-template;');

        // Append the screen entity to the scene
        scene.appendChild(screen);

        // Start screen sharing
        navigator.mediaDevices.getDisplayMedia().then((stream) => {
          NAF.connection.adapter?.addLocalMediaStream(stream, 'screen');
          stream.getVideoTracks().forEach((track) => {
            track.addEventListener(
              'ended',
              () => {
                NAF.connection.adapter?.removeLocalMediaStream('screen');
                setScreenEnabled(false);
                scene.removeChild(screen);
              },
              { once: true }
            );
          });
        });
      }
    } else {
      // Remove the screen entity from the scene
      if (screenEntity) {
        NAF.connection.adapter?.removeLocalMediaStream('screen');
        scene.removeChild(screenEntity);
      }
    }
  };

  createEffect(() => {
    if (!domContentLoaded()) return;
    const info = { screenShareOff: iconOff() };
    // @ts-ignore
    document.querySelector(props.entity ?? '#player')?.setAttribute('player-info', info);
    toggleScreenDisplay(screenEnabled());
  });

  createEffect(() => {
    const enabled = screenEnabled();
    localStorage.setItem('screenEnabled', enabled.toString());
    if (isConnected()) {
      if (!NAF.connection.adapter?.addLocalMediaStream) {
        console.error(
          `The specified NAF adapter doesn't have the removeLocalMediaStream feature, please be sure you have networked-scene="adapter:easyrtc;video:true" options and networked-video-source="streamName: screen" on your screen display template.`,
        );
        return;
      }
      // NAF.connection.adapter?.addLocalMediaStream(stream, 'screen'); Not sure if this is necessary like the camera component
      toggleScreenDisplay(enabled);
    }
  });

  return (
      <Show when={screenShareAvailable()}>
        <button
          class="btn-secondary btn-rounded"
          classList={{ active: !iconOff() }}
          onClick={() => {
            setScreenEnabled((enabled) => !enabled);
            // @ts-ignore
            document.activeElement.blur();
            document.body.focus();
          }}
          title={title()}
        >
          <Show when={!iconOff()}>
            <TbScreenShareOff size={24} />
          </Show>
          <Show when={iconOff()}>
            <TbScreenShare size={24} />
          </Show>
        </button>
      </Show>
  );
};