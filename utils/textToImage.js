const OpenAI = require('openai');
require('dotenv').config();
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
});

/**
 * Generates an image from a text prompt using DALL·E 3.
 * @param {string} textPrompt - The text prompt to generate the image.
 * @returns {Promise<void>}
 */
async function generateImageFromText(textPrompt) {
  const refinementPromt =
    ' NO background detail, focus ONLY on the object, make it three dimensional. Keep the background as clear and simple as possible: a plain white or transparent background.`';
  const fullPrompt = textPrompt + refinementPromt;
  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: textPrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json', // remove to get a URL
    });

    const base64ImageData = response.data[0].b64_json;
    return base64ImageData;
  } catch (error) {
    console.error('Error generating', error);
    throw new Error('Failed to generate image');
  }
}

module.exports = { generateImageFromText };
