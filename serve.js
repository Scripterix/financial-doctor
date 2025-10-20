const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const storage = require('./storage');

app.listen(port, () => console.log(`Listening on port ${port}...`));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all zakupy
app.get('/api/zakupy', async (req, res) => {
  try {
    const zakupy = await storage.getZakupy();
    res.json(zakupy);
  } catch (error) {
    console.error('Failed to load zakupy:', error);
    res.status(500).json({ error: 'Failed to load zakupy' });
  }
});

// API endpoint to get all grupy
app.get('/api/grupy', async (req, res) => {
  try {
    const grupy = await storage.getGrupy();
    res.json(grupy);
  } catch (error) {
    console.error('Failed to load grupy:', error);
    res.status(500).json({ error: 'Failed to load grupy' });
  }
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

  try {
    const savedZakupy = await storage.addZakupy(newZakupy);
    res.status(201).json(savedZakupy);
  } catch (error) {
    console.error('Failed to save zakupy:', error);
    res.status(500).json({ error: 'Failed to save zakupy' });
  }
});

// API endpoint to post new grupy
app.post('/api/grupy', async (req, res) => {
  const newGrupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD')
  };

  try {
    const savedGrupy = await storage.addGrupy(newGrupy);
    res.status(201).json(savedGrupy);
  } catch (error) {
    console.error('Failed to save grupy:', error);
    res.status(500).json({ error: 'Failed to save grupy' });
  }
});
