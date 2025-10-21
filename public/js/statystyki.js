import { getArray } from './http.js';
import { extractAmount } from './finance-utils.js';

const $ = (selector) => document.querySelector(selector);

const fmt = (value) =>
  new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const ym = (dateStr) =>
  typeof dateStr === 'string' && dateStr.length >= 7 ? dateStr.slice(0, 7) : null;

const amountOf = (row) => {
  const value = extractAmount(row);
  return Number.isFinite(value) ? value : 0;
};

let charts = { pie: null, line: null };
let calendar = null;

const categoryChartEl = $('#categoryChart');
const monthlyChartEl = $('#monthlyChart');
const totalsBar = $('#totalsBar');
const fromEl = $('#fromMonth');
const toEl = $('#toMonth');
const summaryCategory = $('#summaryCategory');
const summaryMonthly = $('#summaryMonthly');
const chartsGrid = $('#chartsGrid');
const calendarWrap = $('#calendarWrap');
const btnList = $('#btnList');
const btnCal = $('#btnCal');
const heroCalendarBtn = $('#heroCalendarBtn');

function destroyCharts() {
  if (charts.pie) {
    charts.pie.destroy();
    charts.pie = null;
  }
  if (charts.line) {
    charts.line.destroy();
    charts.line = null;
  }
}

function filterByMonthRange(rows, fromYM, toYM) {
  if (!fromYM && !toYM) return rows;
  return rows.filter((row) => {
    const month = ym(row.data);
    if (!month) return false;
    if (fromYM && month < fromYM) return false;
    if (toYM && month > toYM) return false;
    return true;
  });
}

function groupByCategory(rows) {
  const map = new Map();
  let totalAll = 0;

  rows.forEach((row) => {
    const value = amountOf(row);
    totalAll += value;
    const key = row?.kategoria || 'Inne';
    map.set(key, (map.get(key) || 0) + value);
  });

  const pairs = [...map.entries()].map(([label, value]) => ({ label, value }));
  pairs.sort((a, b) => b.value - a.value);

  const labels = pairs.map((p) => p.label);
  const values = pairs.map((p) => p.value);
  const top3 = pairs.slice(0, 3).map((p) => ({
    ...p,
    pct: totalAll ? (p.value / totalAll) * 100 : 0,
  }));

  return { labels, values, totalAll, top3 };
}

function groupByMonth(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const month = ym(row.data);
    if (!month) return;
    const value = amountOf(row);
    map.set(month, (map.get(month) || 0) + value);
  });

  const labels = [...map.keys()].sort();
  const values = labels.map((label) => map.get(label));

  if (!labels.length) {
    return { labels, values, best: null, worst: null };
  }

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const bestIdx = values.indexOf(maxValue);
  const worstIdx = values.indexOf(minValue);

  return {
    labels,
    values,
    best: bestIdx >= 0 ? { ym: labels[bestIdx], val: values[bestIdx] } : null,
    worst: worstIdx >= 0 ? { ym: labels[worstIdx], val: values[worstIdx] } : null,
  };
}

function badge(label, value) {
  return `<span class="badge text-bg-light border"><b>${label}:</b> ${value}</span>`;
}

async function render() {
  if (
    !categoryChartEl ||
    !monthlyChartEl ||
    !totalsBar ||
    !fromEl ||
    !toEl ||
    !summaryCategory ||
    !summaryMonthly
  ) {
    return;
  }

  let rows = await getArray('/api/zakupy');

  const months = [...new Set(rows.map((row) => ym(row.data)).filter(Boolean))].sort();
  if (months.length) {
    if (!fromEl.value) fromEl.value = months[0];
    if (!toEl.value) toEl.value = months[months.length - 1];
  }

  rows = filterByMonthRange(rows, fromEl.value || null, toEl.value || null);

  const total = rows.reduce((acc, row) => acc + amountOf(row), 0);
  const count = rows.length;
  const avg = count ? total / count : 0;

  totalsBar.innerHTML = [
    badge(
      `Zakres ${fromEl.value || '–'} – ${toEl.value || '–'}`,
      `${fmt(total)} zł`
    ),
    badge('Transakcji', String(count)),
    badge('Średnia', `${fmt(avg)} zł`),
  ].join(' ');

  if (!rows.length) {
    destroyCharts();
    summaryCategory.textContent = 'Brak danych do wyświetlenia.';
    summaryMonthly.textContent = 'Brak danych do wyświetlenia.';
    if (calendar) {
      calendar.refetchEvents();
    }
    return;
  }

  const byCategory = groupByCategory(rows);
  const byMonth = groupByMonth(rows);

  destroyCharts();

  charts.pie = new Chart(categoryChartEl.getContext('2d'), {
    type: 'pie',
    data: {
      labels: byCategory.labels,
      datasets: [
        {
          data: byCategory.values,
          backgroundColor: [
            '#0d6efd',
            '#20c997',
            '#6f42c1',
            '#fd7e14',
            '#dc3545',
            '#198754',
            '#7950f2',
            '#0dcaf0',
            '#6c757d',
            '#ffc107',
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });

  summaryCategory.innerHTML = byCategory.top3.length
    ? `Top 3: ${byCategory.top3
        .map(
          (item) =>
            `${item.label} — ${fmt(item.value)} zł (${item.pct.toFixed(1)}%)`
        )
        .join('; ')}`
    : 'Brak danych dla kategorii.';

  charts.line = new Chart(monthlyChartEl.getContext('2d'), {
    type: 'line',
    data: {
      labels: byMonth.labels,
      datasets: [
        {
          label: 'Suma miesięczna',
          data: byMonth.values,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13, 110, 253, 0.15)',
          tension: 0.2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `${fmt(value)} zł`,
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => `${fmt(context.parsed.y)} zł`,
          },
        },
        legend: { display: false },
      },
    },
  });

  summaryMonthly.textContent =
    byMonth.best && byMonth.worst
      ? `Najwyższe wydatki: ${byMonth.best.ym} — ${fmt(byMonth.best.val)} zł; ` +
        `Najniższe wydatki: ${byMonth.worst.ym} — ${fmt(byMonth.worst.val)} zł`
      : 'Brak danych miesięcznych.';

  if (calendar) {
    calendar.refetchEvents();
  }
}

function bindFilters() {
  const btn = $('#applyFilters');
  if (btn) {
    btn.addEventListener('click', () => {
      render().catch((error) => console.error(error));
    });
  }
}

function initCalendar() {
  if (calendar || !calendarWrap) return;
  const el = document.getElementById('calendar');
  if (!el || typeof FullCalendar === 'undefined') return;

  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    height: 'auto',
    events: async (info, success, failure) => {
      try {
        const from = info.startStr.slice(0, 10);
        const to = info.endStr.slice(0, 10);
        const rows = await getArray(`/api/zakupy?from=${from}&to=${to}`);
        const events = rows.map((row) => ({
          title: `${row.sklep || 'Zakup'} (${fmt(amountOf(row))} zł)`,
          start: row.data,
          allDay: true,
        }));
        success(events);
      } catch (err) {
        console.error(err);
        failure(err);
        window.alert('Błąd ładowania danych kalendarza');
      }
    },
  });

  calendar.render();
}

function showList() {
  chartsGrid?.classList.remove('d-none');
  calendarWrap?.classList.add('d-none');
  btnList?.classList.add('active');
  btnList?.classList.remove('btn-outline-primary');
  btnList?.classList.add('btn-primary');
  btnCal?.classList.remove('active');
  btnCal?.classList.remove('btn-primary');
  btnCal?.classList.add('btn-outline-primary');
  if (calendar) {
    calendar.destroy();
    calendar = null;
  }
}

function showCalendar() {
  chartsGrid?.classList.add('d-none');
  calendarWrap?.classList.remove('d-none');
  btnCal?.classList.add('active');
  btnCal?.classList.remove('btn-outline-primary');
  btnCal?.classList.add('btn-primary');
  btnList?.classList.remove('active');
  btnList?.classList.remove('btn-primary');
  btnList?.classList.add('btn-outline-primary');
  if (!calendar) {
    initCalendar();
  }
}

function bindViewSwitch() {
  btnList?.addEventListener('click', () => {
    showList();
  });
  btnCal?.addEventListener('click', () => {
    showCalendar();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bindFilters();
  bindViewSwitch();
  showList();
  render().catch((error) => console.error(error));
  heroCalendarBtn?.addEventListener('click', () => {
    showCalendar();
  });
});
