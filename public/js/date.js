// Pobierz aktualną datę  w formacie YYYY-MM-DD


let date = moment().format('YYYY-MM-DD');
let dateElement = document.getElementById('currentDate');
dateElement.textContent += date;
console.log(date);