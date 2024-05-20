fetch('/api/zakupy')
  .then(response => response.json())
  .then(data => {
    // Obiekt do przechowywania sum
    const sums = {};

    // Przejście przez dane i aktualizacja sum
    data.forEach(zakupy => {
      if (!sums[zakupy.kategoria]) {
        sums[zakupy.kategoria] = 0;
      }
      sums[zakupy.kategoria] += Number(zakupy.wartość);
    });

    // Tworzenie tabeli z sumami
    const html = `<table class="table table-striped">
      <thead>
        <tr>
        <th>Data</th>
          <th>Kategoria</th>
          <th>Suma</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(sums).map(([kategoria, suma]) => `
          <tr>
            <td class="fw-bold">Maj 2024</td>
            <td>${kategoria}</td>
            <td>${suma.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;

    // Dodanie tabeli do strony
    document.getElementById('sums-container').innerHTML = html;
  });