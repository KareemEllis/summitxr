/* global NAF */
import { createSignal, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { BsBox } from 'solid-icons/bs';
import { VsChromeClose } from 'solid-icons/vs';

import { setShowChatPanel } from './Chat';
import { setShowUsersPanel } from './UsersButton';

import calcSpawnPosition from '../calculate-spawn-position';

// Signals to store form input values
const [description, setDescription] = createSignal('');
const [uploadedFile, setUploadedFile] = createSignal<File | null>(null); // Signal to store uploaded file

const [descGenerationLoading, setDescGenerationLoading] = createSignal(false);
const [imageGenerationLoading, setImageGenerationLoading] = createSignal(false);
const [applyPhysicsImage, setApplyPhysicsImage] = createSignal(false);
const [applyPhysicsDescription, setApplyPhysicsDescription] = createSignal(false);
const [selectedShapeImage, setSelectedShapeImage] = createSignal('auto');
const [selectedShapeDescription, setSelectedShapeDescription] = createSignal('auto');
// Toggle visibility of the model panel
export const [showModelPanel, setShowModelPanel] = createSignal(false);

interface Coords {
  x: number;
  y: number;
  z: number;
}

// Handler for submitting the uploaded image
const handleImageUploadSubmit = async () => {
  if (uploadedFile()) {
    setImageGenerationLoading(true);

    // Send the uploaded file to the server for model generation
    const formData = new FormData();
    formData.append('image', uploadedFile()!);
    console.log(uploadedFile());

    try {
      const response = await fetch('/api/model/generate-from-image', {
        method: 'POST',
        body: formData,
      });

      const { modelPath } = await response.json();
      console.log('Model generated (CLIENT):', modelPath);

      // Get the player's position and rotation
      const playerPositionAttr = document.querySelector('#rig').getAttribute('position');
      const playerRotationAttr = document.querySelector('#player').getAttribute('rotation');
      // Convert the position and rotation strings to numeric values
      const playerPosition = {
        x: parseFloat(playerPositionAttr.x),
        y: parseFloat(playerPositionAttr.y),
        z: parseFloat(playerPositionAttr.z),
      };
      const playerRotation = {
        x: parseFloat(playerRotationAttr.x),
        y: parseFloat(playerRotationAttr.y),
        z: parseFloat(playerRotationAttr.z),
      };
      const modelPosition = calcSpawnPosition(playerPosition, playerRotation);
      const sourceFlag = 'image';
      addModelToScene(modelPath, modelPosition, true, sourceFlag, selectedShapeImage());
      setImageGenerationLoading(false);
      setApplyPhysicsDescription(false);
      setApplyPhysicsImage(false);
      setSelectedShapeDescription('auto');
      setSelectedShapeImage('auto');
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageGenerationLoading(false);
    }
  }
};

// Handler for submitting the description to an API
const handleDescriptionSubmit = async () => {
  if (description()) {
    try {
      setDescGenerationLoading(true);

      // Simulate API call to generate model from description
      const response = await fetch('/api/model/generate-from-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: description() }),
      });

      const { modelPath } = await response.json();
      console.log('Model generated (CLIENT):', modelPath);

      // Get the player's position and rotation
      const playerPositionAttr = document.querySelector('#rig').getAttribute('position');
      const playerRotationAttr = document.querySelector('#player').getAttribute('rotation');
      // Convert the position and rotation strings to numeric values
      const playerPosition = {
        x: parseFloat(playerPositionAttr.x),
        y: parseFloat(playerPositionAttr.y),
        z: parseFloat(playerPositionAttr.z),
      };
      const playerRotation = {
        x: parseFloat(playerRotationAttr.x),
        y: parseFloat(playerRotationAttr.y),
        z: parseFloat(playerRotationAttr.z),
      };

      const modelPosition = calcSpawnPosition(playerPosition, playerRotation);
      const sourceFlag = 'desc';
      addModelToScene(modelPath, modelPosition, true, sourceFlag, selectedShapeDescription());
      setDescGenerationLoading(false);
      setApplyPhysicsDescription(false);
      setApplyPhysicsImage(false);
      setSelectedShapeDescription('auto');
      setSelectedShapeImage('auto');
    } catch (error) {
      console.error('Error generating model from description:', error);
      setDescGenerationLoading(false);
    }
    setDescription(''); // Reset input after submission
  }
};

const addModelToScene = (modelUrl: string, position: Coords, isNetworked = true, sourceFlag: string, shape: string) => {
  const scene = document.querySelector('a-scene');
  const modelEntity = document.createElement('a-entity');
  console.log(typeof modelEntity);

  // Gets the finame from modelUrl, '/assets/models/generated/tree.glb' => 'tree.glb'
  const filename = modelUrl.split('/').pop();

  // Removes the extension for example, 'tree.glb' => 'tree'
  const modelUrlWithoutExtension = filename.split('.').slice(0, -1).join('.');

  console.log('ADDING AT POSITION: ', position);

  // modelEntity.setAttribute('id', modelUrlWithoutExtension) // Add unique id to the entity
  modelEntity.setAttribute('position', `${position.x} ${position.y} ${position.z}`); // Set position
  modelEntity.setAttribute('gltf-model', modelUrl); // Add the model URL
  modelEntity.setAttribute('networked', 'template:#new-model-template'); // Sync with other users
  modelEntity.setAttribute('model-id', modelUrlWithoutExtension);
  // Logic to ensure that physics is only applied when correspoding radio button is checked
  // A user should not be able to check the radio button of the description upload, yet still apply physics to the image upload
  // The following 5 lines prevent this from happening
  const imageUpload = sourceFlag === 'image' ? true : false;
  const descUpload = sourceFlag === 'desc' ? true : false;
  const imageRadioSync = applyPhysicsImage() && imageUpload;
  const descRadioSync = applyPhysicsDescription() && descUpload;
  const applyPhysics = imageRadioSync || descRadioSync;
  if (applyPhysics) {
    modelEntity.addEventListener('model-loaded', () => {
      applyPhysicsToModel(modelEntity, shape); // Apply physics using the helper function
    });
  }
  scene.appendChild(modelEntity);
};

//Future proofing by adding a shape and mass parameter to the function
const applyPhysicsToModel = (modelEntity: typeof AFRAME.AEntity, shape: string = 'sphere', mass: string = '5') => {
  // Apply dynamic-body for physics
  modelEntity.setAttribute('dynamic-body', `shape: ${shape}; mass: ${mass}`);

  // Disable physics on grab, re-enable on release
  modelEntity.addEventListener('grab-start', () => {
    modelEntity.removeAttribute('dynamic-body'); // Disable physics during grab
  });

  modelEntity.addEventListener('grab-end', () => {
    modelEntity.setAttribute('dynamic-body', `shape: ${shape}; mass: ${mass}`); // Re-enable physics after release
  });
};

// The component for the "Add Model" button and the panel
export const ModelButtonWithPanel = () => {
  return (
    <>
      {/* Button to open the panel */}
      <button
        type="button"
        class="btn btn-circle btn-xs h-10 w-10 border shadow-md"
        classList={{
          'btn-neutral': showModelPanel(),
          'btn-active': showModelPanel(),
        }}
        onClick={() => {
          setShowModelPanel((v) => !v);
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
                class="btn btn-circle btn-neutral btn-sm"
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
                class="form-input w-full rounded-lg px-4 py-2 text-sm"
              />
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="apply-physics-upload"
                  checked={applyPhysicsImage()} // Sync the radio button with the signal
                  onInput={(e) => setApplyPhysicsImage(e.target.checked)}
                />
                <span class="text-sm">Apply physics</span>
                {/* Conditionally show the select input for shape when checkbox is checked */}
                {applyPhysicsImage() && (
                  <select
                    class="form-select text-sm"
                    value={selectedShapeImage()}
                    onChange={(e) => setSelectedShapeImage(e.target.value)}
                  >
                    <option value="auto">Default Shape</option>
                    <option value="sphere">Sphere</option>
                    <option value="box">Box</option>
                    <option value="cylinder">Cylinder</option>
                  </select>
                )}
              </label>
              <button class="btn btn-primary w-full" onClick={handleImageUploadSubmit}>
                <Show when={!imageGenerationLoading()}>Submit Image</Show>
                <Show when={imageGenerationLoading()}>
                  <span class="loading loading-spinner"></span>
                </Show>
              </button>
            </div>
            {/* Section 2: Generate a model based on a description */}
            <div class="flex flex-col space-y-4">
              <h3 class="text-lg font-semibold">Generate a 3D Model</h3>
              <label for="description" class="text-sm">
                Describe the model you want to generate:
              </label>
              <textarea
                id="description"
                value={description()}
                onInput={(e) => setDescription(e.target.value)}
                placeholder="Example: A soccer ball"
                class="form-textarea max-h-20 w-full rounded-lg px-4 py-2 text-sm"
              />
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="apply-physics-upload"
                  checked={applyPhysicsDescription()} // Sync the radio button with the signal
                  onInput={(e) => setApplyPhysicsDescription(e.target.checked)}
                />
                <span class="text-sm">Apply physics</span>
                {/* Conditionally show the select input for shape when checkbox is checked */}
                {applyPhysicsDescription() && (
                  <select
                    class="form-select text-sm"
                    value={selectedShapeDescription()}
                    onChange={(e) => setSelectedShapeDescription(e.target.value)}
                  >
                    <option value="auto">Default Shape</option>
                    <option value="sphere">Sphere</option>
                    <option value="box">Box</option>
                    <option value="cylinder">Cylinder</option>
                  </select>
                )}
              </label>
              <button class="btn btn-primary w-full" onClick={handleDescriptionSubmit}>
                <Show when={!descGenerationLoading()}>Submit Description</Show>
                <Show when={descGenerationLoading()}>
                  <span class="loading loading-spinner"></span>
                </Show>
              </button>
              {/* Add check box to apply physics to the model */}
            </div>
          </div>
        </Portal>
      </Show>
    </>
  );
};
