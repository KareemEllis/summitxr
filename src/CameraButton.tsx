/* global NAF */
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show, untrack } from 'solid-js';
import { BsCameraVideo, BsCameraVideoOff } from 'solid-icons/bs';

const savedCameraEnabled = localStorage.getItem('cameraEnabled');
export const [cameraEnabled, setCameraEnabled] = createSignal(savedCameraEnabled === 'true');
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
      };
      document.body.addEventListener('connected', listener);
      onCleanup(() => {
        document.body.removeEventListener('connected', listener);
      });
    }
  });

  createEffect(() => {
    if (!domContentLoaded()) return;
    const info = { videoOff: iconOff() };
    // @ts-ignore
    document.querySelector(props.entity ?? '#player')?.setAttribute('player-info', info);
  });

  createEffect(() => {
    const enabled = cameraEnabled();
    localStorage.setItem('cameraEnabled', enabled.toString());
    if (isConnected()) {
      if (!NAF.connection.adapter?.enableCamera) {
        console.error(
          `The specified NAF adapter doesn't have the enableCamera method, please be sure you have networked-scene="adapter:easyrtc;video:true" options and networked-video-source on your avatar template.`,
        );
        return;
      }
      NAF.connection.adapter.enableCamera(enabled);
    }
  });

  return (
    <Show when={videoEnabled()}>
      <button
        class="btn-secondary btn-rounded"
        classList={{ active: !iconOff() }}
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