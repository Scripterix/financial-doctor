
const form = document.getElementById('form');
const shopInput = document.getElementById('shopInput');
const inputField = document.getElementById('simpleText');
const inputCash = document.getElementById('simpleCost');
const btnSubmit = document.getElementById('btnSubmit');
const outputField = document.getElementById('output');

const showShoppingList = document.getElementById('showZakupy');



btnSubmit.addEventListener('click', function (e) {
  e.preventDefault();

  const shop = shopInput.value.trim();
  const inputText = inputField.value.trim();
  const rawPrice = inputCash.value.trim().replace(',', '.');
  const parsedPrice = Number.parseFloat(rawPrice);

  if (!shop || !inputText || Number.isNaN(parsedPrice) || parsedPrice < 0) {
    console.warn('Nieprawidłowe dane formularza zakupu');
    return;
  }

  const normalisedPrice = Math.round(parsedPrice * 100) / 100;

  const newZakupy = {
    sklep: shop,
    kategoria: inputText,
    'wartość': normalisedPrice
  };

  fetch('/api/zakupy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newZakupy),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(error => {
            throw new Error(error.message || 'Błąd zapisu zakupu.');
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

  shopInput.value = '';
  inputField.value = '';
  inputCash.value = '';
});



fetch('/api/zakupy')
  .then(response => response.json())
  .then(data => {
    const html = `<table class="table table-striped">
  <thead>
    <tr>
      <th>Data</th>
      <th>Sklep</th>
      <th>Kategoria</th>
      <th>Wartość</th>
    </tr>
  </thead>
  <tbody>
    ${data.map(zakupy => `
      <tr>
        <td>${zakupy.data}</td>
        <td>${zakupy.sklep}</td>
        <td>${zakupy.kategoria}</td>
        <td>${zakupy.wartość}</td>
      </tr>
    `).join('')}
  </tbody>
</table>`;

    showShoppingList.innerHTML = html;
  })
  .catch(error => console.error('Błąd pobierania danych', error));


// console.log(form);
// console.log(inputField);
// console.log(btnSubmit);
// console.log(outputField.firstChild);
