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
  let screenSharingInProgress = false; // New flag to prevent duplicate creation

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

    if (!rig || !scene || !player || screenSharingInProgress) return;

    const screenEntity = document.querySelector('#screen-display');
    const existingScreenVideo = document.querySelector('#screen-video');

    if (enabled) {
      if (!screenEntity) {
        screenSharingInProgress = true;

        // Remove any existing screen video element
        if (existingScreenVideo) {
          document.body.removeChild(existingScreenVideo);
        }

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

          // Adjust the camera position to accommodate the screen share
          const cameraVideoEl = document.querySelector('#camera-video') as HTMLElement;
          if (cameraVideoEl) {
            cameraVideoEl.style.top = `${cameraVideoEl.offsetHeight + 20}px`; // Move camera down to stack below the screen share
          }

          // Attach the stream to a small video element on the top-left corner
          const videoEl = document.createElement('video');
          videoEl.setAttribute('id', 'screen-video');
          // @ts-ignore
          videoEl.srcObject = stream;
          // @ts-ignore
          videoEl.autoplay = true;
          // @ts-ignore
          videoEl.muted = true; // Prevent echo
          // @ts-ignore
          videoEl.playsInline = true; // Ensure it plays on mobile devices
          videoEl.style.position = 'absolute';
          videoEl.style.top = '10px';
          videoEl.style.left = '10px';
          videoEl.style.width = '200px'; // Adjust the size as needed
          videoEl.style.height = 'auto';
          videoEl.style.zIndex = '9999'; // Make sure it stays on top

          document.body.appendChild(videoEl);

          stream.getVideoTracks().forEach((track) => {
            track.addEventListener(
              'ended',
              () => {
                NAF.connection.adapter?.removeLocalMediaStream('screen');
                setScreenEnabled(false);
                scene.removeChild(screen);
                document.body.removeChild(videoEl);
                screenSharingInProgress = false; // Reset the flag

                // Reset the camera position when screen share is removed
                if (cameraVideoEl) {
                  cameraVideoEl.style.top = '10px'; // Move camera back to the top-left
                }
              },
              { once: true }
            );
          });

          screenSharingInProgress = false; // Reset the flag after the stream has been successfully added
        }).catch((error) => {
          console.error("Screen sharing failed: ", error);
          screenSharingInProgress = false; // Reset the flag if the user cancels or an error occurs
        });
      }
    } else {
      // Remove the screen entity from the scene
      if (screenEntity) {
        NAF.connection.adapter?.removeLocalMediaStream('screen');
        scene.removeChild(screenEntity);

        if (existingScreenVideo) {
          document.body.removeChild(existingScreenVideo);
        }

        // Reset the camera position when screen share is removed
        const cameraVideoEl = document.querySelector('#camera-video') as HTMLElement;
        if (cameraVideoEl) {
          cameraVideoEl.style.top = '10px'; // Move camera back to the top-left
        }

        screenSharingInProgress = false; // Reset the flag when screen sharing is stopped
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
          class="btn btn-circle btn-xs w-10 h-10 border shadow-md"
          classList={{
            "btn-neutral": !iconOff(),
            "btn-active": !iconOff()
          }}
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