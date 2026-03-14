const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const { WebSocketServer } = require('ws');

const DB_FILE = './server.db';
const db = new sqlite3.Database(DB_FILE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, muscle TEXT, sets INTEGER, reps INTEGER, weight TEXT, day TEXT, date TEXT
  )`);
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

function broadcast(wsServer, msg) {
  const s = JSON.stringify(msg);
  wsServer.clients.forEach(c => { if (c.readyState === 1) c.send(s); });
}

app.get('/exercises', (req, res) => {
  db.all('SELECT * FROM exercises ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    res.json(rows);
  });
});

app.post('/exercises', (req, res) => {
  //console.log('SERVER: POST /exercises body:', req.body);
  const e = req.body;
  const stmt = db.prepare('INSERT INTO exercises (name,muscle,sets,reps,weight,day,date) VALUES (?,?,?,?,?,?,?)');
  stmt.run([e.name, e.muscle, e.sets, e.reps, e.weight, e.day, e.date], function(err) {
    if (err) return res.status(500).send(err.message);
    const id = this.lastID;
    db.get('SELECT * FROM exercises WHERE id=?', [id], (err2, row) => {
      if (err2) return res.status(500).send(err2.message);
      res.json(row);
      // broadcast below after wsServer exists
      if (global.wsServer) broadcast(global.wsServer, { type: 'create', item: row });
    });
  });
});

app.put('/exercises/:id', (req, res) => {
  //console.log('SERVER: PUT /exercises/' + req.params.id + ' body:', req.body);
  const id = Number(req.params.id);
  const e = req.body;
  db.run('UPDATE exercises SET name=?,muscle=?,sets=?,reps=?,weight=?,day=?,date=? WHERE id=?',
    [e.name,e.muscle,e.sets,e.reps,e.weight,e.day,e.date,id],
    function(err) {
      if (err) return res.status(500).send(err.message);
      db.get('SELECT * FROM exercises WHERE id=?', [id], (err2,row) => {
        if (err2) return res.status(500).send(err2.message);
        res.json(row);
        if (global.wsServer) broadcast(global.wsServer, { type: 'update', item: row });
      });
    });
});

app.delete('/exercises/:id', (req, res) => {
  //console.log('SERVER: DELETE /exercises/' + req.params.id);
  const id = Number(req.params.id);
  db.run('DELETE FROM exercises WHERE id=?', [id], function(err) {
    if (err) return res.status(500).send(err.message);
    res.json({ success: true, id });
    if (global.wsServer) broadcast(global.wsServer, { type: 'delete', id });
  });
});

const server = app.listen(3000, '0.0.0.0', () => console.log('API listening on :3000'));

// WebSocket server for push updates
const wss = new WebSocketServer({ server, path: '/ws' });
global.wsServer = wss;
wss.on('connection', socket => console.log('ws client connected'));