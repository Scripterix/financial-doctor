const express = require('express');
const app = express();
const fs = require('fs').promises;
const path = require('path');
const port = 3000;

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

const dataFilePath = path.join(__dirname, 'zakupy.json');

const respondWithError = (res, statusCode, message, error) => {
  if (error) {
    console.error(message, error);
  }

  return res.status(statusCode).json({
    message,
  });
};

const validateZakupyPayload = (payload) => {
  const { sklep, kategoria, wartość } = payload;

  if (!sklep || typeof sklep !== 'string') {
    return 'Pole "sklep" jest wymagane.';
  }

  if (!kategoria || typeof kategoria !== 'string') {
    return 'Pole "kategoria" jest wymagane.';
  }

  const numericValue = Number(wartość);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Pole "wartość" musi być dodatnią liczbą.';
  }

  return null;
};

const validateGrupyPayload = (payload) => {
  const { month, kategoria, kwota } = payload;

  if (!month || typeof month !== 'string') {
    return 'Pole "month" jest wymagane.';
  }

  if (!kategoria || typeof kategoria !== 'string') {
    return 'Pole "kategoria" jest wymagane.';
  }

  const numericValue = Number(kwota);

  if (Number.isNaN(numericValue) || numericValue <= 0) {
    return 'Pole "kwota" musi być dodatnią liczbą.';
  }

  return null;
};

app.listen(port, () => console.log(`Listening on port ${port}...`));

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all zakupy
app.get('/api/zakupy', async (req, res) => {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    return res.status(200).json({
      message: 'Lista zakupów pobrana poprawnie.',
      data: data.zakupy,
    });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się pobrać listy zakupów.', error);
  }
});

// API endpoint to get all grupy
app.get('/api/grupy', async (req, res) => {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    return res.status(200).json({
      message: 'Lista grup pobrana poprawnie.',
      data: data.grupy,
    });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się pobrać listy grup.', error);
  }
});

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// API endpoint to post new zakupy
app.post('/api/zakupy', async (req, res) => {
  const validationError = validateZakupyPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const newZakupy = {
      ...req.body,
      uuid: uuidv4(),
      data: moment().format('YYYY-MM-DD'),
      wartość: Number(req.body.wartość),
    };

    data.zakupy.push(newZakupy);
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');

    return res.status(201).json({
      message: 'Zakup został utworzony.',
      data: newZakupy,
    });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się utworzyć zakupu.', error);
  }
});

// API endpoint to post new grupy
app.post('/api/grupy', async (req, res) => {
  const validationError = validateGrupyPayload(req.body);

  if (validationError) {
    return res.status(400).json({
      message: validationError,
    });
  }

  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);

    const newGrupy = {
      ...req.body,
      uuid: uuidv4(),
      data: moment().format('YYYY-MM-DD'),
      kwota: Number(req.body.kwota),
    };

    data.grupy.push(newGrupy);
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');

    return res.status(201).json({
      message: 'Grupa została utworzona.',
      data: newGrupy,
    });
  } catch (error) {
    return respondWithError(res, 500, 'Nie udało się utworzyć grupy.', error);
  }
});
