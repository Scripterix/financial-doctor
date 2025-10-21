import { createApiClient } from './http.js';
import {
  extractAmount,
  formatAmount
  formatMonthLabel,
  sortByDateKeyAsc,
} from './finance-utils.js';

const tablesContainer = document.getElementById('tablesContainer');
const monthPills = document.getElementById('monthPills');
const toggleArchiveBtn = document.getElementById('toggleArchiveBtn');
const archiveSection = document.getElementById('archiveSection');

if (tablesContainer && monthPills && toggleArchiveBtn && archiveSection) {
  console.debug('[realizacja] module initialised');
  const api = createApiClient();

  const ARCHIVE_KEY = 'fp-archive-months';
  const ARCHIVE_COLLAPSE_KEY = 'fp-archive-toggle';

  const readJson = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(Nie uda³o siê zapisaæ  w localStorage., error);
    }
  };

  let archiveState = readJson(ARCHIVE_KEY, {});
  let archivePanelVisible = readJson(ARCHIVE_COLLAPSE_KEY, true) !== false;
  let aggregates = new Map();
  let archiveCollapse = null;

  const ensureCollapseInstance = () => {
    if (typeof bootstrap === 'undefined') return;
    if (!archiveCollapse) {
      archiveCollapse = new bootstrap.Collapse(archiveSection, { toggle: false });
    }
    if (archivePanelVisible) {
      archiveCollapse.show();
    } else {
      archiveCollapse.hide();
    }
  };

  const updateArchiveLabel = () => {
    toggleArchiveBtn.textContent = archivePanelVisible
      ? 'Ukryj archiwum'
      : 'Poka¿ archiwum';
  };

  const buildAggregates = (rows) => {
    const map = new Map();

    rows.forEach((row) => {
      const amount = extractAmount(row);
      if (!Number.isFinite(amount) || amount <= 0) return;

      const dataStr = typeof row?.data === 'string' ? row.data : null;
      if (!dataStr || dataStr.length < 7) return;

      const monthKey = ${dataStr.slice(0, 4)}-;
      if (!map.has(monthKey)) {
        map.set(monthKey, {
          total: 0,
          count: 0,
          categories: new Map(),
        });
      }

      const entry = map.get(monthKey);
      entry.total += amount;
      entry.count += 1;

      const category = (row?.kategoria || 'Nieznana kategoria').trim();
      const categoryEntry = entry.categories.get(category) || {
        total: 0,
        count: 0,
      };
      categoryEntry.total += amount;
      categoryEntry.count += 1;
      entry.categories.set(category, categoryEntry);
    });

    return map;
  };

  const renderMonthButtons = (keys) => {
    if (!keys.length) {
      monthPills.innerHTML =
        '<span class="text-muted small">Brak danych do wyœwietlenia.</span>';
      return;
    }

    const fragment = document.createDocumentFragment();

    keys.forEach((monthKey) => {
      const isArchived = Boolean(archiveState[monthKey]);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = [
        'btn',
        'btn-sm',
        isArchived ? 'btn-outline-secondary' : 'btn-outline-primary',
      ].join(' ');
      button.dataset.month = monthKey;
      button.innerHTML = ${formatMonthLabel(monthKey)};
      fragment.appendChild(button);
    });

    monthPills.innerHTML = '';
    monthPills.appendChild(fragment);
  };

  const createMonthCard = (monthKey, data) => {
    const categories = [...data.categories.entries()].sort(
      (a, b) => b[1].total - a[1].total
    );
    const monthLabel = formatMonthLabel(monthKey);
    const isArchived = Boolean(archiveState[monthKey]);

    const rows = categories
      .map(
        ([category, info]) => 
          <tr>
            <td></td>
            <td class="text-end"></td>
            <td class="text-end"></td>
          </tr>
      )
      .join('');

    return 
      <div class="mb-4">
        <div class="card border-0 shadow-sm">
          <div class="card-header bg-white border-0 d-flex justify-content-between align-items-center">
            <div>
              <h3 class="h6 mb-0"></h3>
              <span class="text-muted small">Transakcji: </span>
            </div>
            
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped table-hover table-sm mb-0">
                <thead>
                  <tr>
                    <th>Kategoria</th>
                    <th class="text-end">Suma</th>
                    <th class="text-end">Liczba pozycji</th>
                  </tr>
                </thead>
                <tbody>
                  
                </tbody>
                <tfoot>
                  <tr class="table-light fw-semibold">
                    <td>Razem</td>
                    <td class="text-end"></td>
                    <td class="text-end"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>;
  };

  const renderTables = () => {
    const orderedKeys = sortByDateKeyAsc(aggregates.entries())
      .map(([key]) => key)
      .reverse();

    renderMonthButtons(orderedKeys);
    updateArchiveLabel();

    if (!orderedKeys.length) {
      tablesContainer.innerHTML =
        '<p class="text-muted mb-0">Brak danych do wyœwietlenia.</p>';
      return;
    }

    const markup = orderedKeys
      .map((key) => createMonthCard(key, aggregates.get(key)))
      .join('');

    tablesContainer.innerHTML = markup;
  };

  monthPills.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-month]');
    if (!button) return;
    const monthKey = button.dataset.month;
    if (archiveState[monthKey]) {
      delete archiveState[monthKey];
    } else {
      archiveState[monthKey] = true;
    }
    writeJson(ARCHIVE_KEY, archiveState);
    renderTables();
  });

  toggleArchiveBtn.addEventListener('click', () => {
    archivePanelVisible = !archivePanelVisible;
    writeJson(ARCHIVE_COLLAPSE_KEY, archivePanelVisible);
    ensureCollapseInstance();
    updateArchiveLabel();
  });

  const loadData = async () => {
    try {
      tablesContainer.innerHTML =
        '<p class="text-muted mb-0">£adowanie danych...</p>';
      const rows = await api.getArray('/api/zakupy');
      aggregates = buildAggregates(rows);
      renderTables();
    } catch (error) {
      tablesContainer.innerHTML = '';
      console.error(error);
      const alert = document.createElement('div');
      alert.className = 'alert alert-danger mt-3';
      alert.textContent =
        error?.message || 'Nie uda³o siê pobraæ danych realizacji.';
      tablesContainer.parentElement?.insertBefore(alert, tablesContainer);
    }
  };

  ensureCollapseInstance();
  updateArchiveLabel();
  loadData();
}

