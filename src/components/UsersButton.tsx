/* global NAF */
import { Component, createMemo, createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Portal } from 'solid-js/web';
import { FiUsers } from 'solid-icons/fi';
import { BsMic, BsMicMute, BsCameraVideo } from 'solid-icons/bs';
import { TbScreenShare } from 'solid-icons/tb';
import { VsChromeClose } from 'solid-icons/vs';

import { setShowChatPanel } from './Chat';
import { setShowModelPanel } from './ModelButtonWithPanel';

import { audioEnabled } from './MicButton';
import { videoEnabled } from './CameraButton';

export interface Presence {
  id: string;
  muted: boolean;
  videoOff: boolean;
  screenShareOff: boolean;
  name: string;
}

export const [presences, setPresences] = createStore<Presence[]>([]);

document.body.addEventListener('clientDisconnected', (evt) => {
  // @ts-ignore
  setPresences(presences.filter((p) => p.id !== evt.detail.clientId));
});

document.addEventListener('DOMContentLoaded', () => {
  const sceneEl = document.querySelector('a-scene');
  if (!sceneEl) return;

  // @ts-ignore
  const listener = (evt) => {
    const { el, data, oldData } = evt.detail;
    const clientId = el.components?.networked?.data?.owner;
    if (!clientId) {
      // no clientId, that's me
      return;
    }

    if (!el.components['player-info'].presenceAdded) {
      setPresences(presences.length, { id: clientId, muted: data.muted, videoOff: data.videoOff, screenShareOff: data.screenShareOff, name: data.name });
      el.components['player-info'].presenceAdded = true;
    } else if (oldData) {
      if (oldData.muted !== data.muted) {
        setPresences((p) => p.id === clientId, 'muted', data.muted);
      }
      if (oldData.videoOff !== data.videoOff) {
        setPresences((p) => p.id === clientId, 'videoOff', data.videoOff);
      }
      if (oldData.screenShareOff !== data.screenShareOff) {
        setPresences((p) => p.id === clientId, 'screenShareOff', data.screenShareOff);
      }
      if (oldData.name !== data.name) {
        setPresences((p) => p.id === clientId, 'name', data.name);
      }
    }
  };

  sceneEl.addEventListener('player-info-updated', listener);

  const me = document.querySelector('[player-info]');
  const listenerConnected = async () => {
    // Clear the store
    setPresences([]);
    // @ts-ignore
    me.components['player-info'].presenceAdded = false;
    await NAF.utils.getNetworkedEntity(me); // to be sure me.components?.networked?.data?.owner is set
    // @ts-ignore
    listener({ detail: { el: me, data: me.components['player-info'].data }, oldData: {} });
  };
  document.body.addEventListener('connected', listenerConnected);
});

export const [showUsersPanel, setShowUsersPanel] = createSignal(false);

export const UsersButton: Component = () => {
  const usersCount = createMemo(() => {
    return presences.length;
  });

  return (
    <>
      <button
        type="button"
        class="btn btn-circle btn-xs w-10 h-10 border shadow-md relative"
        classList={{
          "btn-neutral": showUsersPanel(),
          "btn-active": showUsersPanel()
        }}
        onClick={() => {
          setShowUsersPanel((v) => !v);
          if (showUsersPanel()) {
            setShowChatPanel(false);
            setShowModelPanel(false);
          }
        }}
        title="Users"
      >
        <FiUsers size={24} />
        <span class="counter">{usersCount()}</span>
      </button>

      <Portal>
        <Show when={showUsersPanel()}>
          <div class="bg-panel absolute bottom-14 left-2 right-2 z-20 mb-3 mt-3 flex max-w-full flex-col space-y-4 rounded-lg p-4 shadow-lg ring-1 ring-black ring-opacity-5 sm:left-auto sm:w-screen sm:max-w-sm">
            <div class="flex justify-end space-x-2 pb-2">
              <button
                class="btn btn-circle btn-sm btn-neutral"
                type="button"
                title="Close"
                onClick={() => setShowUsersPanel(false)}
              >
                <VsChromeClose size={16} />
              </button>
            </div>
            <For each={presences}>
              {(p) => (
                <div class="flex items-center space-x-1 text-sm font-medium">
                  {/* Muted */}
                  <Show when={!p.muted && audioEnabled()}>
                    <BsMic size={20} />
                  </Show>
                  <Show when={p.muted && audioEnabled()}>
                    <BsMicMute size={20} />
                  </Show>

                  {/* VideoOff */}
                  <Show when={!p.videoOff && videoEnabled()}>
                    <BsCameraVideo size={20} />
                  </Show>

                  {/* ScreenShareOff */}
                  <Show when={!p.screenShareOff && videoEnabled()}>
                    <TbScreenShare size={20} />
                  </Show>

                  <span>{p.name}</span>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Portal>
    </>
  );
};
