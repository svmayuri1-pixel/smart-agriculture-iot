const express = require('express');
const router  = express.Router();
const http    = require('http');

// GET /api/cameras — list all known cameras from MQTT
router.get('/', (req, res) => {
  const { liveData } = require('../mqtt/mqttClient');
  const cameras = Object.values(liveData.cameras);

  // If no real cameras yet, return demo entries
  if (cameras.length === 0) {
    return res.json([
      { id: 'CAM-NORTH-01', status: 'offline', streamUrl: null, label: 'North Field' },
      { id: 'CAM-SOUTH-01', status: 'offline', streamUrl: null, label: 'South Field' },
      { id: 'CAM-BARN-01',  status: 'offline', streamUrl: null, label: 'Barn / Livestock' },
    ]);
  }

  res.json(cameras);
});

/**
 * GET /api/cameras/proxy-stream?url=http://192.168.1.x/stream
 *
 * Proxies the ESP32-CAM MJPEG stream through the Node.js server.
 * This avoids browser mixed-content and CORS issues when the ESP32
 * is on the local network but the dashboard is served over HTTPS.
 *
 * Usage in frontend:
 *   <img src="/api/cameras/proxy-stream?url=http://192.168.1.50/stream" />
 */
router.get('/proxy-stream', (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ message: 'url query param required' });

  // Basic validation — only allow local network IPs
  const allowed = /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/;
  if (!allowed.test(url)) {
    return res.status(403).json({ message: 'Only local network camera URLs allowed' });
  }

  try {
    const camUrl = new URL(url);
    const options = {
      hostname: camUrl.hostname,
      port:     camUrl.port || 80,
      path:     camUrl.pathname,
      method:   'GET',
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // Forward content-type (multipart/x-mixed-replace for MJPEG)
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'multipart/x-mixed-replace');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Access-Control-Allow-Origin', '*');
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Camera proxy error:', err.message);
      if (!res.headersSent) res.status(502).json({ message: 'Camera unreachable' });
    });

    proxyReq.end();

    // Clean up if client disconnects
    req.on('close', () => proxyReq.destroy());

  } catch (err) {
    res.status(400).json({ message: 'Invalid camera URL' });
  }
});

module.exports = router;
