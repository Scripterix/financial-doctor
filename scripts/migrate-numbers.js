const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'zakupy.json');

const VALUE_KEYS = [
  'wartość',
  'wartosc',
  'warto��',
  'warto�',
  'warto�>��',
];

const GROUP_AMOUNT_KEYS = ['kwota'];

const decimalRegex = /,/;

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    const coerced = Number(value);
    return Number.isNaN(coerced) ? value : coerced;
  }

  const normalized = value.trim().replace(decimalRegex, '.');
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? value : parsed;
};

const normalizeCollection = (items, keys) => {
  if (!Array.isArray(items)) return { converted: 0 };
  let converted = 0;

  items.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    keys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        const previous = item[key];
        const next = toNumber(previous);
        if (next !== previous) {
          item[key] = next;
          converted += 1;
        }
      }
    });
  });

  return { converted };
};

function migrate() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Could not find ${DATA_FILE}`);
    process.exitCode = 1;
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  const data = JSON.parse(raw);

  const zakupyResult = normalizeCollection(data.zakupy, VALUE_KEYS);
  const grupyResult = normalizeCollection(data.grupy, GROUP_AMOUNT_KEYS);

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');

  console.log(
    `Migracja zakończona: zakupy=${zakupyResult.converted}, grupy=${grupyResult.converted}`
  );
}

if (require.main === module) {
  migrate();
}

module.exports = {
  migrate,
};
