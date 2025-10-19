const express = require('express');
const app = express();
const fs = require('fs').promises;
const path = require('path');
const port = 3000;

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const DATA_PATH = path.join(__dirname, 'zakupy.json');
const MAX_AMOUNT = 1_000_000;

const parseAmount = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return Number(value);
  }
  return NaN;
};

const normaliseZakupy = (zakupy = []) =>
  zakupy.map((item) => {
    const amount = parseAmount(item['wartość']);
    return {
      ...item,
      'wartość': Number.isFinite(amount) ? amount : null
    };
  });

const normaliseGrupy = (grupy = []) =>
  grupy.map((item) => {
    const amount = parseAmount(item.kwota);
    return {
      ...item,
      kwota: Number.isFinite(amount) ? amount : null
    };
  });

const loadData = async () => {
  const raw = await fs.readFile(DATA_PATH, 'utf-8');
  const parsed = JSON.parse(raw);
  return {
    zakupy: normaliseZakupy(parsed.zakupy),
    grupy: normaliseGrupy(parsed.grupy)
  };
};

const saveData = (data) =>
  fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');

const isValidText = (value) => typeof value === 'string' && value.trim().length > 0;

const isValidAmount = (value) => Number.isFinite(value) && value >= 0 && value <= MAX_AMOUNT;

app.listen(port, () => console.log(`Listening on port ${port}...`));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all zakupy
app.get('/api/zakupy', async (req, res) => {
  const data = await loadData();
  res.json(normaliseZakupy(data.zakupy));
});

// API endpoint to get all grupy
app.get('/api/grupy', async (req, res) => {
  const data = await loadData();
  res.json(normaliseGrupy(data.grupy));
});

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// API endpoint to post new zakupy
app.post('/api/zakupy', async (req, res) => {
  const { sklep, kategoria } = req.body;
  const parsedAmount = parseAmount(req.body['wartość']);

  if (!isValidText(sklep) || !isValidText(kategoria) || !isValidAmount(parsedAmount)) {
    return res.status(400).json({ message: 'Nieprawidłowe dane zakupu.' });
  }

  const data = await loadData();
  const newZakupy = {
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD'),
    sklep: sklep.trim(),
    kategoria: kategoria.trim(),
    'wartość': Math.round(parsedAmount * 100) / 100
  };

  data.zakupy.push(newZakupy);
  await saveData(data);

  res.status(201).json(newZakupy);
});

// API endpoint to post new grupy
app.post('/api/grupy', async (req, res) => {
  const { month, kategoria } = req.body;
  const parsedAmount = parseAmount(req.body.kwota);

  if (!isValidText(month) || !isValidText(kategoria) || !isValidAmount(parsedAmount)) {
    return res.status(400).json({ message: 'Nieprawidłowe dane grupy.' });
  }

  const data = await loadData();
  const newGrupy = {
    uuid: uuidv4(),
    month: month.trim(),
    kategoria: kategoria.trim(),
    kwota: Math.round(parsedAmount * 100) / 100,
    data: moment().format('YYYY-MM-DD')
  };

  data.grupy.push(newGrupy);
  await saveData(data);

  res.status(201).json(newGrupy);
});