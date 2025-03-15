const { SlippiGame } = require('@slippi/slippi-js');
const pool = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const processReplay = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate a unique table name
    const sessionId = uuidv4().replace(/-/g, ''); // Remove dashes to keep it SQL-safe
    const tableName = `games_${sessionId}`;

    // Create table dynamically
    await pool.query(`
      CREATE TABLE ${tableName} (
        id SERIAL PRIMARY KEY,
        stage_id INT,
        player1_character INT,
        player2_character INT,
        duration FLOAT
      )
    `);

    const game = new SlippiGame(req.file.buffer);
    const settings = game.getSettings();
    const metadata = game.getMetadata();

    const stageId = settings.stageId;
    const player1Char = settings.players[0]?.characterId;
    const player2Char = settings.players[1]?.characterId;
    const duration = metadata?.lastFrame ? metadata.lastFrame / 60 : null;

    // Insert data into the user's temporary table
    await pool.query(
      `INSERT INTO ${tableName} (stage_id, player1_character, player2_character, duration) 
       VALUES ($1, $2, $3, $4)`,
      [stageId, player1Char, player2Char, duration]
    );

    res.json({ message: 'File processed successfully', tableName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error processing replay file' });
  }
};

module.exports = { processReplay };