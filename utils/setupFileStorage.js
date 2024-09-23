const multer = require('multer');
const path = require('path');
const fs = require('fs');

/*
This function takes a string with the upload directory path.
It checks if the firectory exists and creates the directory if it doesn't
It returns the multer storage that can be used for uploads
*/
function setupFileStorage(uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
  }

  // Set up multer for file uploads (you can customize the storage path)
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir); // Store images in Upload Directory
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname)); // Name the file with current timestamp
    },
  });

  const upload = multer({ storage: storage });

  return upload
}

module.exports = {
  setupFileStorage,
};