// Local server for testing image loading
// Run with: node test-image-server.js

const express = require('express');
const app = express();
const port = 3001;

// Simulate slow loading or failed requests
app.get('/test-image', (req, res) => {
  const { status, delay, type } = req.query;
  
  // Simulate delay if specified
  const responseDelay = parseInt(delay) || 0;
  
  // Simulate error status if specified
  const responseStatus = parseInt(status) || 200;
  
  // Response content type
  const contentType = type === 'json' ? 'application/json' : 'image/png';
  
  console.log(`Serving test-image with delay=${responseDelay}ms, status=${responseStatus}, type=${contentType}`);
  
  setTimeout(() => {
    res.status(responseStatus);
    
    if (responseStatus >= 400) {
      res.json({ error: `Simulated error with status ${responseStatus}` });
      return;
    }
    
    if (contentType === 'application/json') {
      res.json({ message: "This is not an image but JSON" });
    } else {
      // Send a small test image or redirect to a placeholder
      res.redirect('https://via.placeholder.com/300x200');
    }
  }, responseDelay);
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Start server
app.listen(port, () => {
  console.log(`Test server running at http://localhost:${port}`);
  console.log('Available test routes:');
  console.log('- http://localhost:3001/test-image - Returns an image');
  console.log('- http://localhost:3001/test-image?delay=2000 - Returns an image after 2 seconds');
  console.log('- http://localhost:3001/test-image?status=404 - Simulates 404 error');
  console.log('- http://localhost:3001/test-image?type=json - Returns JSON instead of image');
});
