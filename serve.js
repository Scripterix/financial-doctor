const express = require('express');
const app = express();
const fs = require('fs').promises;
const path = require('path');
const port = 3000;

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

app.listen(port, () => console.log(`Listening on port ${port}...`));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all zakupy
app.get('/api/zakupy', async (req, res) => {
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'zakupy.json'), 'utf-8'));
  res.json(data.zakupy);
});

// API endpoint to get all grupy
app.get('/api/grupy', async (req, res) => {
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'zakupy.json'), 'utf-8'));
  res.json(data.grupy);

});

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API endpoint to post new zakupy
app.post('/api/zakupy', async (req, res) => {
  const newZakupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD')
  };
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'zakupy.json'), 'utf-8'));
  data.zakupy.push(newZakupy);
  await fs.writeFile(path.join(__dirname, 'zakupy.json'), JSON.stringify(data), 'utf-8');
  res.json(newZakupy);
});

// API endpoint to post new grupy
app.post('/api/grupy', async (req, res) => {
  const newGrupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD')
  };
  const data = JSON.parse(await fs.readFile(path.join(__dirname, 'zakupy.json'), 'utf-8'));
  data.grupy.push(newGrupy);
  await fs.writeFile(path.join(__dirname, 'zakupy.json'), JSON.stringify(data), 'utf-8');
  res.json(newGrupy);
});