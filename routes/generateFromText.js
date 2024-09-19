const express = require('express');
const router = express.Router();
const path = require('path');
require('dotenv').config(); 
const fs = require('fs');
const {generateImageFromText} = require('./textToImage');
const { removeImageBackground } = require('./backgroundRemover'); // Import background removal function
const { sendImageTo3DAPI } = require('./3dModelGenerator'); // Import 3D model generation function
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
    //path for the generated image
    const outputPath = `uploads/images/generated_${description.replace(/\s/g, '-')}.png`;
    // Save the generated image to a file
    const imageBuffer = Buffer.from(base64ImageData, 'base64');
    fs.writeFileSync(outputPath, imageBuffer);

    //Remove background from the image
    const imageWithNoBackground = await removeImageBackground(outputPath);
    // Generate path for the processed image
    const bg_outputPath = `uploads/images/bgRemoved_${description.replace(/\s/g, '-')}.png`;
    // Save the processed image (with no background) to a file
    fs.writeFileSync(bg_outputPath, imageWithNoBackground);

    //Generate 3D model from the image
    const generatedModelPath = path.resolve(
      __dirname,
      `../public/assets/models/generated/${description.replace(/\..+$/, '')}.glb`,
    );
    //Generate 3D model from the image
    const apiKey = process.env.STABILITY_AI_API_KEY; // Load
    await sendImageTo3DAPI(outputPath, generatedModelPath, apiKey);

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
