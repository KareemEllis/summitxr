const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { removeImageBackground } = require('./backgroundRemover'); // Import background removal function
const { sendImageTo3DAPI } = require('./3dModelGenerator'); // Import 3D model generation function

// Ensure 'uploads/images' directory exists
const uploadDir = 'uploads/images';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
}

// Set up multer for file uploads (you can customize the storage path)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Store images in 'uploads/images'
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Name the file with current timestamp
  },
});

const upload = multer({ storage: storage });

// POST route to generate a model from an uploaded image
router.post('/api/model/generate-from-image', upload.single('image'), async (req, res) => {
  // Simulate model generation from the uploaded image
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  console.log('-----------');
  console.log('Generating model from image:', req.file);
  console.log('-----------');

  const imagePath = req.file.path;

  try {
    const imageWithNoBackground = await removeImageBackground(imagePath);
    // Generate path for the output image
    const outputPath = `uploads/images/bgRemoved_${req.file.filename}`;
    // Save the processed image (with no background) to a file
    fs.writeFileSync(outputPath, imageWithNoBackground);
    // Model Path
    const generatedModelPath = path.resolve(__dirname, `../public/assets/models/generated/${req.file.filename.replace(/\..+$/, '')}.glb`);    
    console.log('Model path:', generatedModelPath);
    console.log('Output path:', outputPath);
    //Generate 3D model from the image
    const apiKey = 'YOUR_API_KEY'; // This needs to be hidden in production
    await sendImageTo3DAPI(outputPath, generatedModelPath, apiKey);
  } catch (error) {
    // Handle errors in background removal or file handling
    console.error('Entering catch block: ' + error);
  }
});

module.exports = router;
