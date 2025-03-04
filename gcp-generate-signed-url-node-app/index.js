const express = require('express');
const { Storage } = require('@google-cloud/storage');

const app = express();
const port = 3000;
const storage = new Storage();

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.get('/list/:bucketName', async (req, res) => {
    const bucketName = req.params.bucketName;
    try {
        const [files] = await storage.bucket(bucketName).getFiles();
        const fileNames = files.map(file => file.name);
        res.json({ files: fileNames });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoint to generate a signed URL
app.get('/generate-signed-url', async (req, res) => {
    try {
      const { bucketName, fileName } = req.query;
  
      if (!bucketName || !fileName) {
        return res.status(400).json({ error: 'Missing bucketName or fileName' });
      }
  
      // Define signed URL options
      const options = {
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes expiry
      };
  
      // Generate signed URL
      const [url] = await storage.bucket(bucketName).file(fileName).getSignedUrl(options);
  
      res.json({ signedUrl: url });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});