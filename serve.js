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

const dataFilePath = path.join(__dirname, 'zakupy.json');

// API endpoint to get all zakupy
app.get('/api/zakupy', async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
    return res.status(200).json({
      message: 'Zakupy retrieved successfully.',
      data: data.zakupy || []
    });
  } catch (error) {
    console.error('Failed to read zakupy data file.', error);
    return res.status(500).json({
      message: 'Unable to retrieve zakupy at this time.'
    });
  }
});

// API endpoint to get all grupy
app.get('/api/grupy', async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
    return res.status(200).json({
      message: 'Grupy retrieved successfully.',
      data: data.grupy || []
    });
  } catch (error) {
    console.error('Failed to read grupy data file.', error);
    return res.status(500).json({
      message: 'Unable to retrieve grupy at this time.'
    });
  }

});

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API endpoint to post new zakupy
app.post('/api/zakupy', async (req, res) => {
  const { sklep, kategoria } = req.body;
  const wartoscRaw = req.body['wartość'];

  const validationErrors = [];
  if (!sklep || typeof sklep !== 'string' || !sklep.trim()) {
    validationErrors.push('Pole "sklep" musi być niepustym ciągiem znaków.');
  }
  if (!kategoria || typeof kategoria !== 'string' || !kategoria.trim()) {
    validationErrors.push('Pole "kategoria" musi być niepustym ciągiem znaków.');
  }
  if (wartoscRaw === undefined || wartoscRaw === null || Number.isNaN(Number(wartoscRaw))) {
    validationErrors.push('Pole "wartość" musi być liczbą.');
  }

  if (validationErrors.length) {
    return res.status(400).json({
      message: 'Nieprawidłowe dane dla zakupu.',
      errors: validationErrors
    });
  }

  const newZakupy = {
    ...req.body,
    sklep: sklep.trim(),
    kategoria: kategoria.trim(),
    ['wartość']: Number(wartoscRaw),
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD')
  };

  try {
    const data = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
    data.zakupy = Array.isArray(data.zakupy) ? data.zakupy : [];
    data.zakupy.push(newZakupy);
    await fs.writeFile(dataFilePath, JSON.stringify(data), 'utf-8');
    return res.status(201).json({
      message: 'Zakup został pomyślnie utworzony.',
      data: newZakupy
    });
  } catch (error) {
    console.error('Failed to write zakupy data file.', error);
    return res.status(500).json({
      message: 'Nie udało się zapisać nowego zakupu.'
    });
  }
});

// API endpoint to post new grupy
app.post('/api/grupy', async (req, res) => {
  const { month, kategoria, kwota } = req.body;

  const validationErrors = [];
  if (!month || typeof month !== 'string' || !month.trim()) {
    validationErrors.push('Pole "month" musi być niepustym ciągiem znaków.');
  }
  if (!kategoria || typeof kategoria !== 'string' || !kategoria.trim()) {
    validationErrors.push('Pole "kategoria" musi być niepustym ciągiem znaków.');
  }
  if (kwota === undefined || kwota === null || Number.isNaN(Number(kwota))) {
    validationErrors.push('Pole "kwota" musi być liczbą.');
  }

  if (validationErrors.length) {
    return res.status(400).json({
      message: 'Nieprawidłowe dane dla grupy.',
      errors: validationErrors
    });
  }

  const newGrupy = {
    ...req.body,
    month: month.trim(),
    kategoria: kategoria.trim(),
    kwota: Number(kwota),
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD')
  };

  try {
    const data = JSON.parse(await fs.readFile(dataFilePath, 'utf-8'));
    data.grupy = Array.isArray(data.grupy) ? data.grupy : [];
    data.grupy.push(newGrupy);
    await fs.writeFile(dataFilePath, JSON.stringify(data), 'utf-8');
    return res.status(201).json({
      message: 'Grupa została pomyślnie utworzona.',
      data: newGrupy
    });
  } catch (error) {
    console.error('Failed to write grupy data file.', error);
    return res.status(500).json({
      message: 'Nie udało się zapisać nowej grupy.'
    });
  }
});