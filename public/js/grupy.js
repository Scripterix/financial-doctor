import { createApiClient } from './http.js';

const mountById = (id) => document.getElementById(id);

const container = mountById('displayKategorie');
const form = document.getElementById('form-grupy');
const monthInput = mountById('monthInput');
const categoryInput = mountById('kategoriaInput');
const amountInput = mountById('kwotaInput');
const submitButton = mountById('btnSubmitGrupy');

if (
  container &&
  form &&
  monthInput &&
  categoryInput &&
  amountInput &&
  submitButton
) {
  console.debug('[grupy] module initialised');
  const api = createApiClient();

  const alerts = (() => {
    const ensure = (variant, message) => {
      let box = document.getElementById('grupy-alert');
      if (!box) {
        box = document.createElement('div');
        box.id = 'grupy-alert';
        form.parentElement?.insertBefore(box, form);
      }
      box.className = `alert alert-${variant} mt-3`;
      box.textContent = message;
    };

    return {
      danger: (message) => ensure('danger', message),
      success: (message) => ensure('success', message),
      clear: () => {
        const box = document.getElementById('grupy-alert');
        if (box) box.remove();
      },
    };
  })();

  const sanitizeNumber = (value) =>
    Number(String(value ?? '').replace(',', '.'));

  const renderRows = (rows) => {
    if (!rows.length) {
      container.innerHTML =
        '<p class="text-muted mb-0">Brak zdefiniowanych grup budżetowych.</p>';
      return;
    }

    const tableRows = rows
      .map(
        (row) => `
      <tr>
        <td>${row.month ?? '-'}</td>
        <td>${row.kategoria ?? '-'}</td>
        <td>${row.kwota ?? '-'}</td>
      </tr>`
      )
      .join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover table-sm mb-0">
          <thead>
            <tr>
              <th>Miesiąc</th>
              <th>Kategoria</th>
              <th>Kwota</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>`;
  };

  const loadGrupy = async () => {
    try {
      alerts.clear();
      container.innerHTML =
        '<p class="text-muted mb-0">Ładowanie danych...</p>';
      const rows = await api.getArray('/api/grupy');
      renderRows(rows);
    } catch (error) {
      container.innerHTML = '';
      alerts.danger(error.message || 'Nie udało się pobrać grup.');
      console.error(error);
    }
  };

  submitButton.addEventListener('click', async (event) => {
    event.preventDefault();

    const monthValue = monthInput.value.trim();
    const category = categoryInput.value.trim();
    const amountRaw = amountInput.value.trim();
    const amount = sanitizeNumber(amountRaw);

    if (!monthValue || !category || !amountRaw) {
      alerts.danger('Wypełnij wszystkie pola formularza.');
      return;
    }

    if (Number.isNaN(amount) || amount <= 0) {
      alerts.danger('Kwota musi być dodatnią liczbą.');
      return;
    }

    if (typeof moment !== 'function') {
      alerts.danger('Biblioteka moment.js jest wymagana do obsługi dat.');
      return;
    }

    const parsed = moment(monthValue, ['DD-MM-YYYY', 'YYYY-MM-DD', moment.ISO_8601], true);
    const formattedMonth = parsed.isValid() ? parsed.format('MMMM-YYYY') : null;

    if (!formattedMonth) {
      alerts.danger('Podaj poprawną datę (np. 05-2024 lub 2024-05-10).');
      return;
    }

    try {
      alerts.clear();
      await api.postJson('/api/grupy', {
        month: formattedMonth,
        kategoria: category,
        kwota: amount,
      });
      monthInput.value = '';
      categoryInput.value = '';
      amountInput.value = '';
      alerts.success('Grupa została zapisana.');
      await loadGrupy();
    } catch (error) {
      alerts.danger(error.message || 'Nie udało się zapisać grupy.');
      console.error(error);
    }
  });

  loadGrupy();
}
