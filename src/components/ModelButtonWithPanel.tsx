import { createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { BsBox } from 'solid-icons/bs';
import { VsChromeClose } from 'solid-icons/vs';

import { setShowChatPanel } from './Chat';
import { setShowUsersPanel } from './UsersButton';

// Signals to store form input values
const [description, setDescription] = createSignal('');
const [uploadedFile, setUploadedFile] = createSignal<File | null>(null); // Signal to store uploaded file

// Toggle visibility of the model panel
export const [showModelPanel, setShowModelPanel] = createSignal(false);

// Handler for submitting the uploaded image
const handleImageUploadSubmit = async () => {
  if (uploadedFile()) {
    // Send the uploaded file to the server for model generation
    const formData = new FormData();
    formData.append('image', uploadedFile()!);
    console.log(uploadedFile())

    try {
      const response = await fetch('/api/model/generate-from-image', {
        method: 'POST',
        body: formData,
      });

      const { modelPath } = await response.json();
      console.log('Model generated:', modelPath);
      // addModelToScene(modelPath); // Assuming the API returns the path to the generated 3D model
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }
};

// Handler for submitting the description to an API
const handleDescriptionSubmit = async () => {
  if (description()) {
    try {
      // Simulate API call to generate model from description
      const response = await fetch('/api/model/generate-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description() }),
      });

      const { modelPath } = await response.json();
      console.log('Model generated:', modelPath);
      // addModelToScene(modelPath); // Assuming the API returns a model URL
    } catch (error) {
      console.error('Error generating model from description:', error);
    }

    setDescription(''); // Reset input after submission
  }
};

// Function to add a 3D model into the A-Frame scene
const addModelToScene = (modelUrl: string) => {
  const scene = document.querySelector('a-scene');
  const modelEntity = document.createElement('a-entity');
  modelEntity.setAttribute('gltf-model', modelUrl); // Assuming it's a glTF format
  modelEntity.setAttribute('position', '0 1 -3'); // Example position
  scene.appendChild(modelEntity);
};

// The component for the "Add Model" button and the panel
export const ModelButtonWithPanel = () => {
  return (
    <>
      {/* Button to open the panel */}
      <button
        type="button"
        class="btn btn-circle btn-xs w-10 h-10 border shadow-md"
        classList={{
          "btn-neutral": showModelPanel(),
          "btn-active": showModelPanel()
        }}
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
                class="btn btn-circle btn-sm btn-neutral"
                type="button"
                title="Close"
                onClick={() => setShowModelPanel(false)}
              >
                <VsChromeClose size={16} />
              </button>
            </div>

            {/* Section 1: Upload Image to generate 3D model */}
            <div class="flex flex-col space-y-4">
              <h3 class="text-lg font-semibold">Upload an Image to Generate a 3D Model</h3>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onInput={(e) => setUploadedFile(e.target.files[0])}
                class="form-input w-full px-4 py-2 text-sm rounded-lg"
              />
              <button class="btn btn-primary w-full" onClick={handleImageUploadSubmit}>
                Submit Image
              </button>
            </div>

            {/* Section 2: Generate a model based on a description */}
            <div class="flex flex-col space-y-4">
              <h3 class="text-lg font-semibold">Generate a 3D Model</h3>
              <label for="description" class="text-sm">Describe the model you want to generate:</label>
              <textarea
                id="description"
                value={description()}
                onInput={(e) => setDescription(e.target.value)}
                placeholder="Example: A soccer ball"
                class="form-textarea w-full px-4 py-2 text-sm rounded-lg max-h-20"
              />
              <button class="btn btn-primary w-full" onClick={handleDescriptionSubmit}>
                Submit Description
              </button>
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};
