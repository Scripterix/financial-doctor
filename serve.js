// serve.js (resolved)
// API uses storage layer (queued writes) + simple validation.

const express = require('express');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const storage = require('./storage');

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Helpers ----------

const respondWithError = (res, statusCode, message, error) => {
  if (error) console.error(message, error);
  return res.status(statusCode).json({ error: message });
};

const validateZakupyPayload = (payload) => {
  const { sklep, kategoria, wartość } = payload || {};

  if (!sklep || typeof sklep !== 'string') {
    return 'Pole "sklep" jest wymagane.';
  }
  if (!kategoria || typeof kategoria !== 'string') {
    return 'Pole "kategoria" jest wymagane.';
  }

  // Akceptuj "12,34" i "12.34"
  const numericValue = Number(String(wartość).replace(',', '.'));
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Pole "wartość" musi być dodatnią liczbą.';
  }
  return null;
};

const validateGrupyPayload = (payload) => {
  const { month, kategoria, kwota } = payload || {};

  if (!month || typeof month !== 'string') {
    return 'Pole "month" jest wymagane.';
  }
  if (!kategoria || typeof kategoria !== 'string') {
    return 'Pole "kategoria" jest wymagane.';
  }

  const numericValue = Number(String(kwota).replace(',', '.'));
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Pole "kwota" musi być dodatnią liczbą.';
  }
  return null;
};

// ---------- Routes ----------

// Health
app.get('/_health', (_req, res) => res.json({ ok: true, status: 'up' }));

// Home page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all zakupy
app.get('/api/zakupy', async (_req, res) => {
  try {
    const zakupy = await storage.getZakupy();
    return res.status(200).json({ message: 'Lista zakupów pobrana poprawnie.', data: zakupy });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się pobrać listy zakupów.', error);
  }
});

// Get all grupy
app.get('/api/grupy', async (_req, res) => {
  try {
    const grupy = await storage.getGrupy();
    return res.status(200).json({ message: 'Lista grup pobrana poprawnie.', data: grupy });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się pobrać listy grup.', error);
  }
});

// Create zakupy
app.post('/api/zakupy', async (req, res) => {
  const validationMsg = validateZakupyPayload(req.body);
  if (validationMsg) {
    return res.status(400).json({ error: validationMsg });
  }

  const newZakupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD'),
    // Upewnij się, że zapisujemy liczbę
    wartość: Number(String(req.body.wartość).replace(',', '.')),
  };

  try {
    const savedZakupy = await storage.addZakupy(newZakupy);
    return res.status(201).json({ message: 'Zakup został utworzony.', data: savedZakupy });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się utworzyć zakupu.', error);
  }
});

// Create grupy
app.post('/api/grupy', async (req, res) => {
  const validationMsg = validateGrupyPayload(req.body);
  if (validationMsg) {
    return res.status(400).json({ error: validationMsg });
  }

  const newGrupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD'),
    kwota: Number(String(req.body.kwota).replace(',', '.')),
  };

  try {
    const savedGrupy = await storage.addGrupy(newGrupy);
    return res.status(201).json({ message: 'Grupa została utworzona.', data: savedGrupy });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się utworzyć grupy.', error);
  }
});

// ---------- Start ----------

app.listen(port, () => console.log(`Listening on port ${port}...`));

module.exports = app;
