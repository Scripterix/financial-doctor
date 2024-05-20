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
  const kwota = kwotaInput.value.trim();

  let newGrupy;

  if (month && kategoria && kwota) {
    moment.locale('pl');
    const formattedMonth = moment(month, 'DD-MM-YYYY').format('MMMM-YYYY');
    newGrupy = {
      uuid: uuidv4(),
      month: formattedMonth,
      kategoria: kategoria,
      kwota: kwota
    };
  }

  if (newGrupy) {
    fetch('/api/grupy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newGrupy),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }
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