const express = require('express');
const router = express.Router();

// POST route to generate a model from a text description
router.post('/api/model/generate-from-text', async (req, res) => {
  const { description } = req.body;

  if (!description) {
    console.error('Description is required');
    return res.status(400).json({ error: 'Description is required' });
  }

  console.log('-----------')
  console.log('Generating model from text:', description);
  console.log('-----------')

  // Handle generating a model from the text description

  // Create a model path so it can be displayed in the client
  const generatedModelPath = `/assets/models/generated/${description.replace(/\s/g, '-')}.glb`;

  // Send back the model path
  res.status(200).json({
    message: 'Model generated from text prompt',
    modelPath: generatedModelPath,
  });
});

module.exports = router;
