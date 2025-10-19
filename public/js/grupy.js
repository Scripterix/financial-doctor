const form = document.querySelector('.form-grupy');
const monthInput = document.getElementById('monthInput');
const kategoriaInput = document.getElementById('kategoriaInput');
const kwotaInput = document.getElementById('kwotaInput');
const btnSubmitGrupy = document.getElementById('btnSubmitGrupy');

const outputKategorie = document.getElementById('displayKategorie');


btnSubmitGrupy.addEventListener('click', function (e) {
  e.preventDefault();

  const month = monthInput.value.trim();
  const kategoria = kategoriaInput.value.trim();
  const rawKwota = kwotaInput.value.trim().replace(',', '.');
  const parsedKwota = Number.parseFloat(rawKwota);

  if (!month || !kategoria || Number.isNaN(parsedKwota) || parsedKwota < 0) {
    console.warn('Nieprawidłowe dane formularza grupy');
    return;
  }

  moment.locale('pl');
  const formattedMonth = moment(month, 'DD-MM-YYYY').format('MMMM-YYYY');
  const normalisedKwota = Math.round(parsedKwota * 100) / 100;

  const newGrupy = {
    month: formattedMonth,
    kategoria: kategoria,
    kwota: normalisedKwota
  };

  fetch('/api/grupy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newGrupy),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(error.message || 'Błąd zapisu grupy.');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });

  monthInput.value = '';
  kategoriaInput.value = '';
  kwotaInput.value = '';
});

fetch('/api/grupy')
  .then(response => response.json())
  .then(data => {
    const html = `<table class="table table-striped">
  <thead>
    <tr>
      <th>Miesiąc</th>
      <th>Kategoria</th>
      <th>Kwota</th>
    </tr>
  </thead>
  <tbody>
    ${data.map(grupy => {
      return `
      <tr>
        <td>${grupy.month}</td>
        <td>${grupy.kategoria}</td>
        <td>${grupy.kwota}</td>
      </tr>
      `;
    }).join('')}
  </tbody>`;

    outputKategorie.innerHTML = html;
  })
  .catch((error) => {
    console.error('Error pobieranoa:', error);
  });