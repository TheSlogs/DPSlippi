const express = require('express');
const multer = require('multer');
const { processReplay } = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/upload', upload.single('file'), processReplay);

module.exports = router;

router.post('/delete-table', async (req, res) => {
    try {
      const { tableName } = req.body;
      if (!tableName) return res.status(400).json({ error: 'Table name required' });
  
      await pool.query(`DROP TABLE IF EXISTS ${tableName}`);
      res.json({ message: `Table ${tableName} deleted successfully` });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error deleting table' });
    }
  });