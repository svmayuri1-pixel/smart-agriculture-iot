/**
 * Pest Analysis Route — uses Google Gemini AI
 * POST /api/pest/analyze
 * Body: { imageUrl: "http://192.168.x.x/snapshot" }
 */

const express = require('express');
const router  = express.Router();
const https   = require('https');
const http    = require('http');

// POST /api/pest/analyze
router.post('/analyze', async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let imageData;

    if (imageBase64) {
      // Use base64 image directly from frontend
      imageData = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg'
        }
      };
    } else if (imageUrl) {
      // Fetch image from ESP32-CAM snapshot URL
      const imgBuffer = await fetchImage(imageUrl);
      imageData = {
        inlineData: {
          data: imgBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      };
    } else {
      return res.status(400).json({ error: 'imageUrl or imageBase64 required' });
    }

    const prompt = `You are an expert agricultural pest detection AI.
    
Analyze this plant/leaf image carefully and provide:

1. PEST_DETECTED: yes or no
2. PEST_NAME: name of pest or disease (if detected), else "None"
3. CONFIDENCE: percentage (0-100)
4. SEVERITY: None / Low / Medium / High / Critical
5. DESCRIPTION: brief description of what you see
6. TREATMENT: specific treatment recommendation
7. PREVENTION: prevention tips

Respond in this exact JSON format:
{
  "pestDetected": true/false,
  "pestName": "pest name or None",
  "confidence": 85,
  "severity": "Medium",
  "description": "description here",
  "treatment": "treatment steps here",
  "prevention": "prevention tips here"
}

If the image is not a plant/leaf, respond with pestDetected: false and explain in description.`;

    const result = await model.generateContent([prompt, imageData]);
    const text   = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Invalid AI response', raw: text });
    }

    const analysis = JSON.parse(jsonMatch[0]);
    res.json({ success: true, analysis });

  } catch (err) {
    console.error('Gemini AI error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Helper: fetch image from URL as buffer
function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

module.exports = router;
