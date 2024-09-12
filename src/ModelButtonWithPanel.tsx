import { createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { BsBox } from 'solid-icons/bs';
import { VsChromeClose } from 'solid-icons/vs';

import { setShowChatPanel } from './Chat';
import { setShowUsersPanel } from './UsersButton';

// Signals to store form input values
const [sketchfabUrl, setSketchfabUrl] = createSignal('');
const [description, setDescription] = createSignal('');

// Toggle visibility of the model panel
export const [showModelPanel, setShowModelPanel] = createSignal(false);

// Handler for submitting the Sketchfab URL
const handleSketchfabSubmit = () => {
  if (sketchfabUrl()) {
    // Add the model to the scene using the URL
    addModelToScene(sketchfabUrl());
    setSketchfabUrl(''); // Reset the input after submission
  }
};

// Handler for submitting the description to an API
const handleDescriptionSubmit = async () => {
  if (description()) {
    // Simulate API call to generate model from description
    await generateModelFromDescription(description());
    setDescription(''); // Reset input after submission
  }
};

// Function to add a 3D model from Sketchfab into the A-Frame scene
const addModelToScene = (modelUrl: string) => {
  const scene = document.querySelector('a-scene');
  const modelEntity = document.createElement('a-entity');
  modelEntity.setAttribute('gltf-model', modelUrl); // Assuming it's a glTF format
  modelEntity.setAttribute('position', '0 1 -3'); // Example position
  scene.appendChild(modelEntity);
};

// Simulated function to generate a model based on description via an API
const generateModelFromDescription = async (description: string) => {
  // This function would make an API call to generate a 3D model based on the description
  const response = await fetch('/generate-model', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ description }),
  });

  const modelPath = await response.json();
  addModelToScene(modelPath); // Assuming the API returns a model URL
};

// The component for the "Add Model" button and the panel
export const ModelButtonWithPanel = () => {
  return (
    <>
      {/* Button to open the panel */}
      <button
        type="button"
        class="btn-secondary btn-rounded"
        onClick={() => {
          setShowModelPanel((v) => !v)
          if (showModelPanel()) {
            setShowChatPanel(false);
            setShowUsersPanel(false);
          }
        }}
        title="Add 3D Model"
      >
        <BsBox size={24} />
      </button>

      {/* Portal for the model panel */}
      <Show when={showModelPanel()}>
        <Portal>
          <div class="bg-panel absolute bottom-14 left-2 right-2 z-20 mb-3 mt-3 flex max-w-full flex-col space-y-4 rounded-lg p-4 shadow-lg ring-1 ring-black ring-opacity-5 sm:left-auto sm:w-screen sm:max-w-sm">
            {/* Close Button */}
            <div class="flex justify-end space-x-2 pb-2">
              <button
                class="btn-secondary btn-rounded"
                type="button"
                title="Close"
                onClick={() => setShowModelPanel(false)}
              >
                <VsChromeClose size={16} />
              </button>
            </div>

            {/* Section 1: Add model via URL */}
            <div class="flex flex-col space-y-4">
              <h3 class="text-lg font-semibold">Add a 3D Model from Sketchfab</h3>
              <label for="sketchfab-url" class="text-sm">Model URL:</label>
              <input
                id="sketchfab-url"
                type="text"
                value={sketchfabUrl()}
                onInput={(e) => setSketchfabUrl(e.target.value)}
                placeholder="Enter Sketchfab URL"
                class="form-input w-full px-4 py-2 text-sm rounded-lg"
              />
              <button class="btn-secondary w-full" onClick={handleSketchfabSubmit}>
                Submit
              </button>
            </div>

            {/* Section 2: Generate a model based on a description */}
            <div class="flex flex-col space-y-4">
              <h3 class="text-lg font-semibold">Generate a 3D Model</h3>
              <label for="description" class="text-sm">Describe the model:</label>
              <textarea
                id="description"
                value={description()}
                onInput={(e) => setDescription(e.target.value)}
                placeholder="Describe the model you want"
                class="form-textarea w-full px-4 py-2 text-sm rounded-lg"
              />
              <button class="btn-secondary w-full" onClick={handleDescriptionSubmit}>
                Submit Description
              </button>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};
