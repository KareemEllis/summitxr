const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

// Setup Multer Storage
const { setupFileStorage } = require('../utils/setupFileStorage');
// Background removal function
const { removeImageBackground } = require('../utils/backgroundRemover');
// 3D model generation function
const { sendImageTo3DAPI } = require('../utils/3dModelGenerator');

// Ensure 'uploads/images' directory exists
const uploadDir = 'uploads/images';
const upload = setupFileStorage(uploadDir)

// POST route to generate a model from an uploaded image
router.post('/api/model/generate-from-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  // Check the MIME type and extension
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  // Get the MIME type from the uploaded file
  const mimeType = req.file.mimetype;
  const extension = path.extname(req.file.originalname).toLowerCase();

  // Validate the MIME type and extension
  if (!allowedMimeTypes.includes(mimeType) || !allowedExtensions.includes(extension)) {
    // Remove the uploaded file (if it was saved on disk)
    if (req.file.path) {
      fs.unlinkSync(req.file.path); // Remove the uploaded file
    }

    return res.status(400).json({ error: 'Invalid file type. Only JPEG, PNG, and WEBP are allowed.' });
  }

  console.log('-----------');
  console.log('Generating model from image:', req.file);
  console.log('-----------');

  const imagePath = req.file.path;

  try {
    // Remove background from uploaded image
    const imageWithNoBackground = await removeImageBackground(imagePath);

    // Generate path for the image with removed background
    const removedBgPath = `uploads/images/bgRemoved_${req.file.filename}`;

    // Save the processed image (with no background) to a file
    fs.writeFileSync(removedBgPath, imageWithNoBackground);

    // New Generated Model Path
    const generatedModelPath = path.resolve(
      __dirname,
      `../public/assets/models/generated/${
        req.file.filename
          .replace(/\..+$/, '') // Remove file extension
          .replace(/\s+/g, '') // Remove all spaces
      }_${Date.now()}.glb` // Append the timestamp for uniqueness
    );

    console.log('Model path:', generatedModelPath);
    console.log('Output path:', removedBgPath);

    // Generate 3D model from the image
    const apiKey = process.env.STABILITY_AI_API_KEY; // Load

    await sendImageTo3DAPI(removedBgPath, generatedModelPath, apiKey);

    // Remove the images from processes
    fs.unlink(removedBgPath, (err) => {
      if (err) {
        console.error(`Error removing the file: ${err}`);
      } else {
        console.log('File successfully removed');
      }
    });
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(`Error removing the file: ${err}`);
      } else {
        console.log('File successfully removed');
      }
    });

    res.status(200).json({
      message: 'Model generated from image',
      modelPath: generatedModelPath,
    });
  } catch (error) {
    res.status(500).json({
      message: 'An error occurred while generating the model',
      error: error.message || 'Internal Server Error',
    });
  }
});

module.exports = router;
