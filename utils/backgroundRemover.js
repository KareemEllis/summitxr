// backgroundRemover.js
const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');

// Function to remove background from an image
async function removeImageBackground(imagePath) {
  try {
    // Remove the background from the image
    const blob = await removeBackground(imagePath);
    // Convert the Blob to a buffer
    const buffer = Buffer.from(await blob.arrayBuffer());
    return buffer;
  } catch (error) {
    throw new Error('Error removing background: ' + error.message);
  }
}

module.exports = {
  removeImageBackground,
};
