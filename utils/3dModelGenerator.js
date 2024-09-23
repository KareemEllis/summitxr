const axios = require('axios'); // Use require for CommonJS
const FormData = require('form-data');
const fs = require('node:fs');
/**
 * Function to send an image to the 3D API using a provided image URL
 * @param {string} imageUrl - Path or URL of the image to send
 * @param {string} outputPath - Path where the output 3D model file will be saved
 * @param {string} apiKey - API Key for authorization
 */
async function sendImageTo3DAPI(imageUrl, outputPath, apiKey) {
  try {
    // Read the image from the provided URL or path
    const payload = {
      image: fs.createReadStream(imageUrl),
    };

    // Send the image using axios and FormData
    const response = await axios.postForm(
      `https://api.stability.ai/v2beta/3d/stable-fast-3d`,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    console.log('outputPath:', outputPath);

    if (response.status === 200) {
      fs.writeFileSync(outputPath, Buffer.from(response.data));
      console.log(`3D model saved successfully at ${outputPath}`);
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }
  } catch (error) {
    console.error('Error sending the image to the 3D API:', error.message);
  }
}

module.exports = {
  sendImageTo3DAPI,
};