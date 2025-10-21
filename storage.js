const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'zakupy.json');

let writeQueue = Promise.resolve();

async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(content);
    return {
      zakupy: Array.isArray(parsed.zakupy) ? parsed.zakupy : [],
      grupy: Array.isArray(parsed.grupy) ? parsed.grupy : []
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      const initialData = { zakupy: [], grupy: [] };
      await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    throw error;
  }
}

function queueWrite(modifyFn) {
  const writeOperation = writeQueue.then(async () => {
    const data = await readData();
    const result = await modifyFn(data);
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return result;
  });

  writeQueue = writeOperation.catch(() => {});

  return writeOperation;
}

async function getZakupy() {
  const data = await readData();
  return data.zakupy;
}

async function getGrupy() {
  const data = await readData();
  return data.grupy;
}

function addZakupy(zakup) {
  return queueWrite((data) => {
    data.zakupy.push(zakup);
    return zakup;
  });
}

function addGrupy(grupa) {
  return queueWrite((data) => {
    data.grupy.push(grupa);
    return grupa;
  });
}

module.exports = {
  getZakupy,
  getGrupy,
  addZakupy,
  addGrupy
};
