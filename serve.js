const express = require('express');
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const storage = require('./storage');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.use(express.static(path.join(__dirname, 'public')));

const respondWithError = (res, statusCode, message, error, details) => {
  if (error) console.error(message, error);
  return res
    .status(statusCode)
    .json({ error: message, ...(details ? { details } : {}) });
};

const normaliseAmountKey = (key = '') =>
  key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');

const resolveAmountField = (payload = {}) => {
  const candidate = Object.keys(payload).find(
    (key) => normaliseAmountKey(key) === 'wartosc'
  );
  return candidate || 'wartość';
};

const parseAmount = (value) =>
  Number(String(value ?? '').replace(',', '.'));

const validateZakupyPayload = (payload) => {
  const { sklep, kategoria } = payload || {};

  if (!sklep || typeof sklep !== 'string') {
    return 'Pole "sklep" jest wymagane.';
  }
  if (!kategoria || typeof kategoria !== 'string') {
    return 'Pole "kategoria" jest wymagane.';
  }

  const amountField = resolveAmountField(payload);
  const numericValue = parseAmount(payload?.[amountField]);

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

  const numericValue = parseAmount(kwota);
  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Pole "kwota" musi być dodatnią liczbą.';
  }
  return null;
};

const parseDateQuery = (value, field) => {
  if (!value) return null;
  const parsed = moment(value, 'YYYY-MM-DD', true);
  if (!parsed.isValid()) {
    const error = new Error(
      `Parametr "${field}" ma nieprawidłowy format (wymagane YYYY-MM-DD).`
    );
    error.statusCode = 400;
    throw error;
  }
  return parsed.startOf('day');
};

const parseRowDate = (value) => {
  if (!value) return null;
  const parsed = moment(value, ['YYYY-MM-DD', moment.ISO_8601], true);
  return parsed.isValid() ? parsed.startOf('day') : null;
};

app.get('/_health', (_req, res) => res.json({ ok: true, status: 'up' }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/zakupy', async (req, res) => {
  try {
    const { from, to } = req.query || {};
    let fromDate = null;
    let toDate = null;

    try {
      fromDate = parseDateQuery(from, 'from');
      toDate = parseDateQuery(to, 'to');
    } catch (validationError) {
      return res.status(400).json({
        error: 'Bad Request',
        details: validationError.message,
      });
    }

    if (fromDate && toDate && fromDate.isAfter(toDate)) {
      return res.status(400).json({
        error: 'Bad Request',
        details: 'Parametr "from" nie może być późniejszy niż "to".',
      });
    }

    const zakupy = await storage.getZakupy();

    const filtered =
      fromDate || toDate
        ? zakupy.filter((row) => {
          const rowDate = parseRowDate(row?.data);
          if (!rowDate) return false;
          if (fromDate && toDate) {
            return rowDate.isBetween(fromDate, toDate, 'day', '[]');
          }
          if (fromDate && rowDate.isBefore(fromDate)) return false;
          if (toDate && rowDate.isAfter(toDate)) return false;
          return true;
        })
        : zakupy;

    return res
      .status(200)
      .json({ message: 'Lista zakupów pobrana poprawnie.', data: filtered });
  } catch (error) {
    return respondWithError(
      res,
      500,
      'Nie udało się pobrać listy zakupów.',
      error
    );
  }
});

app.get('/api/grupy', async (_req, res) => {
  try {
    const grupy = await storage.getGrupy();
    return res
      .status(200)
      .json({ message: 'Lista grup pobrana poprawnie.', data: grupy });
  } catch (error) {
    return respondWithError(
      res,
      500,
      'Nie udało się pobrać listy grup.',
      error
    );
  }
});

app.post('/api/zakupy', async (req, res) => {
  const validationMsg = validateZakupyPayload(req.body);
  if (validationMsg) {
    return res.status(400).json({ error: validationMsg });
  }

  const amountField = resolveAmountField(req.body);

  const newZakupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD'),
    [amountField]: parseAmount(req.body?.[amountField]),
  };

  try {
    const savedZakupy = await storage.addZakupy(newZakupy);
    return res
      .status(201)
      .json({ message: 'Zakup został utworzony.', data: savedZakupy });
  } catch (error) {
    return respondWithError(
      res,
      500,
      'Nie udało się utworzyć zakupu.',
      error
    );
  }
});

app.post('/api/grupy', async (req, res) => {
  const validationMsg = validateGrupyPayload(req.body);
  if (validationMsg) {
    return res.status(400).json({ error: validationMsg });
  }

  const newGrupy = {
    ...req.body,
    uuid: uuidv4(),
    data: moment().format('YYYY-MM-DD'),
    kwota: parseAmount(req.body.kwota),
  };

  try {
    const savedGrupy = await storage.addGrupy(newGrupy);
    return res
      .status(201)
      .json({ message: 'Grupa została utworzona.', data: savedGrupy });
  } catch (error) {
    return respondWithError(
      res,
      500,
      'Nie udało się utworzyć grupy.',
      error
    );
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
  console.log(`👉  http://localhost:${port}`);
});

module.exports = app;

