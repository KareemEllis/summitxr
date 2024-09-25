const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

// Setup Multer Storage
const { setupFileStorage } = require('../utils/setupFileStorage');
// Image generation function
const { generateImageFromText } = require('../utils/textToImage');
// Background removal function
const { removeImageBackground } = require('../utils/backgroundRemover');
// 3D model generation function
const { sendImageTo3DAPI } = require('../utils/3dModelGenerator');

// Ensure 'uploads/images' directory exists to upload generated images
const imageUploadDir = 'uploads/images';
const imageUpload = setupFileStorage(imageUploadDir)

// Ensure 'public/assets/models/generated' directory exists to upload generated models
const modelUploadDir = 'public/assets/models/generated';
const modelUpload = setupFileStorage(modelUploadDir)

// POST route to generate a model from a text description
router.post('/api/model/generate-from-text', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    console.error('Description is required');
    return res.status(400).json({ error: 'Description is required' });
  }

  console.log('-----------');
  console.log('Generating model from text:', description);
  console.log('-----------');

  // Handle generating a model from the text description
  try {
    const base64ImageData = await generateImageFromText(description);

    const formattedDescription = `${
      description
        .replace(/\..+$/, '') // Remove file extension
        .replace(/\s+/g, '') // Remove all spaces
    }_${Date.now()}`

    // path for the generated image
    const generatedImagePath = `uploads/images/generated_${formattedDescription}.png`;

    // Save the generated image to a file
    const imageBuffer = Buffer.from(base64ImageData, 'base64');
    fs.writeFileSync(generatedImagePath, imageBuffer);

    // Remove background from the image
    const imageWithNoBackground = await removeImageBackground(generatedImagePath);
    // Generate path for the processed image
    const removedBgPath = `uploads/images/bgRemoved_${formattedDescription}.png`;
    // Save the processed image (with no background) to a file
    fs.writeFileSync(removedBgPath, imageWithNoBackground);

    const generatedModelPath = `/assets/models/generated/${formattedDescription}.glb`;

    const modelOutputPath = path.resolve(
      __dirname,
      `../public/assets/models/generated/${formattedDescription}.glb`,
    );

    // Generate 3D model from the image
    const apiKey = process.env.STABILITY_AI_API_KEY; // Load
    await sendImageTo3DAPI(removedBgPath, modelOutputPath, apiKey);

    // Remove the images from processes
    fs.unlink(removedBgPath, (err) => {
      if (err) {
        console.error(`Error removing the file: ${err}`);
      } else {
        console.log('File successfully removed');
      }
    });
    fs.unlink(generatedImagePath, (err) => {
      if (err) {
        console.error(`Error removing the file: ${err}`);
      } else {
        console.log('File successfully removed');
      }
    });

    // Send back the model path
    res.status(200).json({
      message: 'Model generated from text prompt',
      modelPath: generatedModelPath,
    });
  } catch (error) {
    // Handle errors in background removal or file handling
    res.status(500).json({
      message: 'An error occurred while generating the model',
      error: error.message || 'Internal Server Error',
    });
  }
});

module.exports = router;
