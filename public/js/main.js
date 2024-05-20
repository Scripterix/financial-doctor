
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
  const inputPrice = inputCash.value.trim();

  if (shop && inputText && inputPrice) {
    const newZakupy = {
      uuid: uuidv4(),
      data: moment().format('YYYY-MM-DD'),
      sklep: shop,
      kategoria: inputText,
      wartość: inputPrice
    };

    fetch('/api/zakupy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newZakupy),
    })
      .then(response => response.json())
      .then(data => {
        console.log('Success:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });

    shopInput.value = '';
    inputField.value = '';
    inputCash.value = '';
  }
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
