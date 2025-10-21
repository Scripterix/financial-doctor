const TARGET_KEY = 'wartosc';

const normaliseKey = (key) =>
  typeof key === 'string'
    ? key
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/gi, '')
        .toLowerCase()
    : '';

const currencyFormatter = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const amountFormatter = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat('pl-PL', {
  month: 'short',
  year: 'numeric',
});

export const extractAmount = (row) => {
  if (!row || typeof row !== 'object') return Number.NaN;

  return Object.keys(row).reduce((acc, key) => {
    if (!Number.isNaN(acc)) return acc;
    if (normaliseKey(key) !== TARGET_KEY) return Number.NaN;
    const value = row[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value.replace(',', '.'));
      return Number.isNaN(parsed) ? Number.NaN : parsed;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? Number.NaN : parsed;
  }, Number.NaN);
};

export const formatCurrency = (value) =>
  Number.isFinite(value) ? currencyFormatter.format(value) : '–';

export const formatAmount = (value) =>
  Number.isFinite(value) ? amountFormatter.format(value) : '–';

export const formatMonthLabel = (key) => {
  if (typeof key !== 'string') return key ?? '';
  const normalized = `${key}-01`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return key;
  return monthFormatter.format(parsed);
};

export const sortByDateKeyAsc = (entries) =>
  [...entries].sort(([a], [b]) => {
    if (a === b) return 0;
    return a < b ? -1 : 1;
  });
