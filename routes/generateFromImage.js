const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

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
router.post('/api/model/generate-from-image', upload.single('image'), (req, res) => {
  // Simulate model generation from the uploaded image
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  console.log('-----------')
  console.log('Generating model from image:', req.file);
  console.log('-----------')

  const imagePath = req.file.path;

  // Use the image to generate the model

  // Simulate generating the model path
  const generatedModelPath = `/assets/models/generated/${req.file.filename.replace(/\..+$/, '')}.glb`;

  // Send back the model path (this should be generated after your API processes the image)
  res.status(200).json({
    message: 'Model generated from image',
    modelPath: generatedModelPath,
  });
});

module.exports = router;
