const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const findPlayer = require('./findPlayer.js');
const processGame = require('./processGame.js');
const { platform } = require('os');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: function (req, file, cb){
    cb(null, "uploads/");
  },
  filename: function(req, file, cb){
    cb(null, Date.now()+'-'+file.originalname);
  }
});

const db = new sqlite3.Database("uploads.db", (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');

    // Drop the table if it exists
    db.run(`DROP TABLE IF EXISTS uploads`, (dropErr) => {
      console.log("HERE!");
      if (dropErr) {
        console.error('Error dropping table:', dropErr);
      } else {
        console.log('Table dropped successfully');

        // Create the table again
        db.run(`CREATE TABLE uploads (
          id              INTEGER PRIMARY KEY AUTOINCREMENT,
          startAt         DATETIME    NOT NULL,
          opp_name        TEXT        NOT NULL,
          opp_tag         TEXT        NOT NULL,
          character       TEXT        NOT NULL,
          opp_character   TEXT        NOT NULL,
          stage           TEXT        NOT NULL,
          game_duration   TEXT        NOT NULL,
          result          INTEGER     NOT NULL
        )`, (createErr) => {
          if (createErr) {
            console.error('Error creating table:', createErr);
          } else {
            console.log('Table created successfully');
          }
        });
      }
    });
  }
});
const upload = multer({storage})

app.post('/api/upload', upload.array('files'), async (req, res) => {
  const files = req.files;
  const playerCode = findPlayer(files);
  console.log(playerCode);

  const uploadPromises = files.map((file) => {
    return new Promise((resolve) => {
      try {
        const gameData = processGame(file, playerCode);
        if (!gameData) {
          return resolve({ status: 'skipped', file: file.originalname });
        }

        db.run(
          `INSERT INTO uploads (
            startAt,
            opp_name,
            opp_tag,
            character,
            opp_character,
            stage,
            game_duration,
            result
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          gameData,
          function (err) {
            if (err) {
              console.error(`DB insert error for ${file.originalname}:`, err);
              return resolve({ status: 'error', file: file.originalname, error: err.message });
            } else {
              return resolve({ status: 'success', file: file.originalname });
            }
          }
        );
      } catch (err) {
        console.error(`Processing error for ${file.originalname}:`, err);
        return resolve({ status: 'error', file: file.originalname, error: err.message });
      }
    });
  });

  const results = await Promise.all(uploadPromises);

  // Delete all files afterward
  files.forEach((file) => {
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error(`Error deleting file: ${file.path}`, err);
    }
  });

  res.json({
    message: 'Processing complete',
    results,
  });
});

/* app.post('/api/upload', upload.array('files'), async (req, res)=>{
  const files = req.files;
  const playerCode = findPlayer(files);
  console.log(playerCode);
  const uploadPromises = files.map((file) => {
    return new Promise((resolve, reject) => {
      try {
        const gameData = processGame(file, playerCode);
        if (!gameData){return resolve(null);} // skip
        db.run(
          `INSERT INTO uploads (startAt,
        opp_name,
        opp_tag,
        character,
        opp_character,
        stage,
        game_duration,
        result)VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          gameData,
          function (err) {
            if (err) {return reject(err);}
            else {return resolve(gameData);}
          }
        );
      } catch (err) {
        return reject(err);
      }
    });
  });

  try {
    const results = await Promise.all(uploadPromises);
    console.log("DONE");
    // After all uploads are done, delete the files
    files.forEach(file => {
      try {
        fs.unlinkSync(file.path); // Delete the file from disk
      } catch (err) {
        console.error(`Error deleting file: ${file.path}`, err);
      }
    });

    res.json({
      message: 'Files processed, uploaded to the database, and deleted successfully.',
      files: results
    });
  } catch (err) {
    console.error('Error processing files:', err);
    res.status(500).json({ error: 'Error processing files' });
  }
}); */

app.get('/api/uploads', (req, res) => {
  const { character, stage, opp_tag } = req.query;
  const filters = [];
  const values = [];

  if (character) {
    filters.push('character LIKE ?');
    values.push(`%${character}%`);
  }
  if (stage) {
    filters.push('stage LIKE ?');
    values.push(`%${stage}%`);
  }
  if (opp_tag) {
    filters.push('opp_tag LIKE ?');
    values.push(`%${opp_tag}%`);
  }

  let sql = `SELECT startAt,
            opp_name,
            opp_tag,
            character,
            opp_character,
            stage,
            game_duration,
            result FROM uploads`;
  if (filters.length) {
    sql += ' WHERE ' + filters.join(' AND ');
  }

  db.all(sql, values, (err, rows) => {
    if (err) {
      console.error('Error fetching filtered games', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

/*app.get('/api/uploads', (req, res)=>{
  const { character, stage, opp_tag } = req.query;
  db.all("SELECT * FROM uploads", [], (err, rows) => {
    if(err){
      console.log('Error fetching uploads', err);
      res.status(500).json({
        error: "Error fetching uploads"
      })
    } else{
      res.json(rows)
    }
  })

})*/


app.get('/api/winrates', (req, res) => {
  //console.log("HERE!");
  const { groupBy } = req.query;
  const cols = Array.isArray(groupBy) ? groupBy : (groupBy ? groupBy.split(',') : []);

  // validate against allowed columns
  const allowed = ['opp_tag','character','opp_character','stage'];
  const groupCols = cols.filter(c => allowed.includes(c));
  if (groupCols.length === 0) {
    return res.status(400).json({ error: 'Must select at least one grouping.' });
  }

  // build the SELECT and GROUP BY clauses
  const selectCols = groupCols.join(', ');
  const sql = `
    SELECT
      ${selectCols},
      COUNT(*) AS gamesPlayed,
      ROUND(1.0 * SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) / COUNT(*), 4) AS winRate
    FROM uploads
    GROUP BY ${selectCols}
  `;
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('WinRate query error:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.listen(port, ()=>{
  console.log(`Server running at http://localhost:${port}`)
})