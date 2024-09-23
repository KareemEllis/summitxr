/* global NAF */
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show, untrack } from 'solid-js';
import { BsCameraVideo, BsCameraVideoOff } from 'solid-icons/bs';

export const [cameraEnabled, setCameraEnabled] = createSignal(false);
const [isConnected, setIsConnected] = createSignal(false);

export const [videoEnabled, setVideoEnabled] = createSignal(false);

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

    setVideoEnabled(true);
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

export const CameraButton: Component<Props> = (props) => {
  let cameraVideoAddingInProgress = false; // New flag to prevent duplicate creation

  const iconOff = createMemo(() => {
    return !cameraEnabled();
  });

  const title = createMemo(() => {
    if (!iconOff()) {
      return 'Disable Camera';
    } else {
      return 'Enable Camera';
    }
  });

  onMount(() => {
    if (NAF.connection.isConnected()) {
      setIsConnected(true);
    } else {
      const listener = () => {
        setIsConnected(true);
        NAF.connection.adapter?.enableCamera?.(untrack(cameraEnabled));
        toggleCameraDisplay(untrack(cameraEnabled));
      };
      document.body.addEventListener('connected', listener);
      onCleanup(() => {
        document.body.removeEventListener('connected', listener);
      });
    }
  });

  // This function toggles the visibility of the camera display
  const toggleCameraDisplay = (enabled: boolean) => {
    // Access the player entity
    const playerEntity = document.querySelector('#rig #player');

    if (!playerEntity || cameraVideoAddingInProgress) return;

    // Access the head and camera-display entities
    const modelEntity = playerEntity.querySelector('.avatar-model');
    const cameraDisplayEntity = playerEntity.querySelector('#camera-display');
    const existingCameraVideo = document.querySelector('#camera-video');

    if (!modelEntity || !cameraDisplayEntity) return;

    // Toggle visibility based on camera state
    if (enabled) {
      cameraVideoAddingInProgress = true; // Set flag to prevent duplicate creation

      // Remove any existing camera video element
      if (existingCameraVideo) {
        document.body.removeChild(existingCameraVideo);
      }

      // Hide the avatar head and show the camera display
      modelEntity.setAttribute('visible', 'false');
      cameraDisplayEntity.setAttribute('visible', 'true');

      // Attach the camera stream to a small video element on the top-left corner
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        const videoEl = document.createElement('video');
        // @ts-ignore
        videoEl.srcObject = stream;
        // @ts-ignore
        videoEl.autoplay = true;
        // @ts-ignore
        videoEl.muted = true; // Prevent echo
        // @ts-ignore
        videoEl.playsInline = true; // Ensure it plays on mobile devices

        // Check if a screen share video already exists to stack below it
        const existingScreenVideo = document.querySelector('#screen-video') as HTMLElement;
        const topPosition = existingScreenVideo ? existingScreenVideo.offsetHeight + 20 : 10;

        videoEl.setAttribute('id', 'camera-video');
        videoEl.style.position = 'absolute';
        videoEl.style.top = `${topPosition}px`; // Stack below any existing screen share video
        videoEl.style.left = '10px';
        videoEl.style.width = '200px'; // Adjust the size as needed
        videoEl.style.height = 'auto';
        videoEl.style.zIndex = '9999'; // Make sure it stays on top

        document.body.appendChild(videoEl);

        stream.getVideoTracks().forEach((track) => {
          track.addEventListener(
            'ended',
            () => {
              setCameraEnabled(false);
              cameraDisplayEntity.setAttribute('visible', 'false');
              document.body.removeChild(videoEl);
              cameraVideoAddingInProgress = false; // Reset the flag
            },
            { once: true }
          );
        })

        cameraVideoAddingInProgress = false; // Reset the after adding the video
      }).catch((error) => {
        console.error('Camera stream failed: ', error);
        cameraVideoAddingInProgress = false; // Reset the flag on error
      });
    } else {
      // Show the avatar head and hide the camera display
      modelEntity.setAttribute('visible', 'true');
      cameraDisplayEntity.setAttribute('visible', 'false');

      // Remove the camera video element from the HTML
      if (existingCameraVideo) {
        document.body.removeChild(existingCameraVideo);
      }

      cameraVideoAddingInProgress = false; // Reset the flag when disabling camera
    }
  };

  createEffect(() => {
    if (!domContentLoaded()) return;
    const info = { videoOff: iconOff() };
    // @ts-ignore
    document.querySelector(props.entity ?? '#player')?.setAttribute('player-info', info);
    toggleCameraDisplay(cameraEnabled());
  });

  createEffect(() => {
    const enabled = cameraEnabled();
    if (isConnected()) {
      if (!NAF.connection.adapter?.enableCamera) {
        console.error(
          `The specified NAF adapter doesn't have the enableCamera method, please be sure you have networked-scene="adapter:easyrtc;video:true" options and networked-video-source on your avatar template.`,
        );
        return;
      }
      NAF.connection.adapter.enableCamera(enabled);
      toggleCameraDisplay(enabled);
    }
  });

  return (
    <Show when={videoEnabled()}>
      <button
        class="btn btn-circle btn-xs w-10 h-10 border shadow-md"
        classList={{
          "btn-neutral": !iconOff(),
          "btn-active": !iconOff()
        }}
        onClick={() => {
          setCameraEnabled((enabled) => !enabled);
          // @ts-ignore
          document.activeElement.blur();
          document.body.focus();
        }}
        title={title()}
      >
        <Show when={!iconOff()}>
          <BsCameraVideo size={24} />
        </Show>
        <Show when={iconOff()}>
          <BsCameraVideoOff size={24} />
        </Show>
      </button>
    </Show>
  );
};