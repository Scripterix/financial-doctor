import { createApiClient } from './http.js';
import {
  extractAmount,
  formatAmount,
  formatCurrency,
} from './finance-utils.js';

const mount = (id) => document.getElementById(id);
const sanitizeNumber = (value) => Number(String(value ?? '').replace(',', '.'));

const createAlertManager = (target, id) => {
  const ensure = (variant, message) => {
    if (!target) return;
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement('div');
      box.id = id;
      target.parentElement?.insertBefore(box, target);
    }
    box.className = `alert alert-${variant} mt-3`;
    box.textContent = message;
  };

  return {
    danger: (message) => ensure('danger', message),
    success: (message) => ensure('success', message),
    clear: () => {
      const box = document.getElementById(id);
      if (box) box.remove();
    },
  };
};

const renderTable = (rows, target, emptyMessage) => {
  if (!target) return;

  if (!rows.length) {
    target.innerHTML = `<p class="text-muted mb-0">${emptyMessage}</p>`;
    return;
  }

  const total = rows.reduce((acc, row) => acc + extractAmount(row), 0);

  const tableRows = rows
    .map((row) => {
      const amount = extractAmount(row);
      return `
        <tr>
          <td>${row?.data ?? '-'}</td>
          <td>${row?.sklep ?? '-'}</td>
          <td>${row?.kategoria ?? '-'}</td>
          <td class="text-end">${formatAmount(amount)}</td>
        </tr>`;
    })
    .join('');

  target.innerHTML = `
    <div class="table-responsive">
      <table class="table table-striped table-hover table-sm mb-0">
        <thead>
          <tr>
            <th>Data</th>
            <th>Sklep</th>
            <th>Kategoria</th>
            <th class="text-end">Kwota</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        <tfoot>
          <tr class="table-light fw-semibold">
            <td colspan="3" class="text-end">Razem</td>
            <td class="text-end">${formatAmount(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
};

const showShoppingList = mount('showZakupy');
const archiveList = mount('archiveZakupy');
const formContainer = mount('form');
const shopInput = mount('shopInput');
const categoryInput = mount('simpleText');
const amountInput = mount('simpleCost');
const submitButton = mount('btnSubmit');
const kpiSpend = mount('kpiSpend');
const kpiBudget = mount('kpiBudget');
const kpiBalance = mount('kpiBalance');
const AMOUNT_FIELD = 'wartość';

if (
  showShoppingList &&
  formContainer &&
  shopInput &&
  categoryInput &&
  amountInput &&
  submitButton
) {
  console.debug('[zakupy] module initialised');
  const api = createApiClient();
  const alerts = createAlertManager(formContainer, 'zakupy-alert');

  const currentMonthKey = () => new Date().toISOString().slice(0, 7);

  const updateKpis = (zakupyRows, grupyRows) => {
    if (!kpiSpend || !kpiBudget || !kpiBalance) return;

    const monthKey = currentMonthKey();
    const monthlySpend = zakupyRows.reduce((acc, row) => {
      const dateKey =
        typeof row?.data === 'string' && row.data.length >= 7
          ? row.data.slice(0, 7)
          : null;
      if (dateKey !== monthKey) return acc;
      const amount = extractAmount(row);
      return acc + (Number.isFinite(amount) ? amount : 0);
    }, 0);

    const budgetTotal = Array.isArray(grupyRows)
      ? grupyRows.reduce((acc, row) => {
          const value = Number(row?.kwota);
          return acc + (Number.isFinite(value) ? value : 0);
        }, 0)
      : 0;

    const balance = budgetTotal - monthlySpend;

    kpiSpend.textContent = formatCurrency(monthlySpend);
    kpiBudget.textContent = formatCurrency(budgetTotal);
    kpiBalance.textContent = formatCurrency(balance);

    kpiBalance.classList.remove('text-success', 'text-danger');
    if (Number.isFinite(balance)) {
      kpiBalance.classList.add(balance >= 0 ? 'text-success' : 'text-danger');
    }
  };

  const renderZakupyLists = (rows) => {
    const sorted = [...rows].sort((a, b) => {
      const aTime = new Date(a?.data ?? 0).getTime();
      const bTime = new Date(b?.data ?? 0).getTime();
      if (!Number.isFinite(aTime) && !Number.isFinite(bTime)) return 0;
      if (!Number.isFinite(bTime)) return -1;
      if (!Number.isFinite(aTime)) return 1;
      return bTime - aTime;
    });

    const recent = sorted.slice(0, 10);
    const archive = sorted.slice(10);

    renderTable(recent, showShoppingList, 'Brak zapisanych zakupów.');
    if (archiveList) {
      renderTable(
        archive,
        archiveList,
        'Brak starszych wpisów. Dodaj więcej zakupów, aby zobaczyć archiwum.'
      );
    }
  };

  const loaderMarkup = '<p class="text-muted mb-0">Ładowanie danych...</p>';

  const loadData = async () => {
    try {
      alerts.clear();
      showShoppingList.innerHTML = loaderMarkup;
      if (archiveList) {
        archiveList.innerHTML =
          '<p class="text-muted mb-0">Ładowanie archiwum...</p>';
      }

      const promises = [api.getArray('/api/zakupy')];
      if (kpiSpend && kpiBudget && kpiBalance) {
        promises.push(api.getArray('/api/grupy'));
      }

      const [zakupyRows, grupyRows = []] = await Promise.all(promises);
      renderZakupyLists(zakupyRows);
      updateKpis(zakupyRows, grupyRows);
    } catch (error) {
      showShoppingList.innerHTML = '';
      if (archiveList) archiveList.innerHTML = '';
      alerts.danger(error.message || 'Nie udało się pobrać danych.');
      console.error(error);
    }
  };

  const resetForm = () => {
    shopInput.value = '';
    categoryInput.value = '';
    amountInput.value = '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const sklep = shopInput.value.trim();
    const kategoria = categoryInput.value.trim();
    const kwota = sanitizeNumber(amountInput.value);

    if (!sklep || !kategoria || !amountInput.value.trim()) {
      alerts.danger('Wypełnij wszystkie pola formularza.');
      return;
    }

    if (Number.isNaN(kwota) || kwota <= 0) {
      alerts.danger('Wartość musi być dodatnią liczbą.');
      return;
    }

    try {
      alerts.clear();
      await api.postJson('/api/zakupy', {
        [AMOUNT_FIELD]: kwota,
        sklep,
        kategoria,
      });
      resetForm();
      alerts.success('Zakup został zapisany.');
      await loadData();
    } catch (error) {
      alerts.danger(error.message || 'Nie udało się zapisać zakupu.');
      console.error(error);
    }
  };

  submitButton.addEventListener('click', handleSubmit);
  formContainer.addEventListener('submit', handleSubmit);

  loadData();
}




