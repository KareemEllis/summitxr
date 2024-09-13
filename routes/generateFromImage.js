const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { removeImageBackground } = require('./backgroundRemover'); // Import background removal function


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

  console.log('-----------')
  console.log('Generating model from image:', req.file);
  console.log('-----------')

  const imagePath = req.file.path;

    try {
    // Use the imported function to remove the background from the uploaded image
    const imageWithNoBackground = await removeImageBackground(imagePath);

    // Generate path for the output image
    const outputPath = `uploads/images/processedImages/bgRemoved_${req.file.filename}`;

    // Save the processed image (with no background) to a file
    fs.writeFileSync(outputPath, imageWithNoBackground);

    // Simulate generating the model path (this should be updated as per your API needs)
    const generatedModelPath = `/assets/models/generated/${req.file.filename.replace(/\..+$/, '')}.glb`;

    // Respond with the path of the processed image and the generated model path
    res.status(200).json({
      message: 'Model generated and background removed',
      imagePath: outputPath, // Path to the image without background
      modelPath: generatedModelPath, // Path to the generated model (simulated)
    });
  } catch (error) {
    // Handle errors in background removal or file handling
    res.status(500).json({ error: 'Error processing the image: ' + error.message });
  }
});




module.exports = router;
