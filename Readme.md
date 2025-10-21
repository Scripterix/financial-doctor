# Finance Doctor (Planer Finansowy)

Aplikacja Node.js (Express) z frontendem Bootstrap służąca do planowania i kontroli wydatków. Dane są przechowywane lokalnie w pliku `zakupy.json`, więc projekt świetnie nadaje się jako lekki planer lub baza do dalszych eksperymentów.

---

## Status – 21.10.2025

- ✅ **PR 1** – klient API (`http.js`), guardy DOM i normalizacja kwot.
- ✅ **PR 2–4** – hero + KPI na stronie głównej, statystyki Chart.js z filtrami.
- ✅ **PR 5** – widok kalendarza (FullCalendar) wspierający zapytania `?from&to`.
- ✅ **PR 6** – archiwum miesięcy (soft-hide, `localStorage`).
- ✅ **PR 7** – sumy w tabelach, odświeżony UI (CTA w hero, jaśniejsze gradienty, stopka).
- ✅ **PR 9** – przycisk „Ukryj/Pokaż archiwum” zapamiętuje stan (Bootstrap collapse).
- ⏳ **Next** – upload rachunków (multer) + rozszerzona dokumentacja QA.

---

## Szybki start

```
npm install
npm run migrate   # jednorazowo – konwersja kwot na liczby
npm start         # http://localhost:3000
```

Tryb deweloperski: `npm run dev` (nodemon + watch na `public`).

> Dzięki helperowi w `http.js` oraz nagłówkom CORS interfejs świetnie współpracuje z Live Serverem / Vite.

---

## Dostępne skrypty

| Polecenie         | Opis                                                      |
| ----------------- | --------------------------------------------------------- |
| `npm start`       | Uruchamia serwer Express (prod/dev).                      |
| `npm run dev`     | Tryb deweloperski z nodemon.                              |
| `npm run migrate` | `scripts/migrate-numbers.js` – normalizacja kwot w JSON.  |

---

## Co oferuje aplikacja

- **Home** – hero z CTA, trzy KPI (wydatki, budżet, saldo), lista ostatnich zakupów + akordeon archiwum z sumą w stopce tabeli.
- **Grupy** – wyśrodkowany formularz limitów (Bootstrap grid), tabela z planami.
- **Realizacja** – agregacja wydatków wg miesiąca, oznaczanie miesięcy jako archiwalne, panel można ukryć/przywrócić (stan w `localStorage`).
- **Statystyki** – filtry zakresu (`input type="month"`), badge z sumami, wykres pie/line oraz przełącznik Lista/Kalendarz (FullCalendar + `/api/zakupy?from&to`).
- **Docs** – aktualny status, roadmapa i prompty dla Codex.

---

## Najnowsze usprawnienia

- Sumy w stopkach tabel na stronie głównej (`tfoot`) z formatowaniem `1 234,56 zł`.
- Nowe CTA w sekcjach hero, jaśniejszy gradient oraz wspólna stopka (`Regulamin`, `Polityka prywatności`).
- Przełącznik Lista/Kalendarz + hero shortcut do kalendarza w statystykach.
- Przycisk „Ukryj/Pokaż archiwum” w realizacji – animowany (Bootstrap collapse) i zapamiętujący stan w `localStorage`.

---

## Prompty dla Codex (kolejność)

1. `fix(frontend): robust API client + DOM guards to stop map/null errors`
2. `chore(data): enforce UTF-8; migrate zakupy/grupy amounts to numbers`
3. `feat(ui): Home hero + KPI cards + card tables`
4. `feat(stats): category pie + monthly trend with Chart.js`
5. `feat(calendar): FullCalendar view powered by /api/zakupy?from&to`
6. `feat(archive): month-level soft archive with localStorage`
7. `feat(ui): table footers with total sum + centered form on groups page`
9. `fix(archive): toggle hide/show months archive button`

---

## Notatki operacyjne

- Archiwum miesięcy: `localStorage` (`fp-archive-months`, `fp-archive-toggle`).
- Kwoty w JSON = liczby (po `npm run migrate`), front korzysta z helperów `finance-utils.js`.
- Kalendarz i filtry odwołują się do `/api/zakupy?from&to`; backend waliduje daty `moment(..., true)`.
- `npm start` wypisuje w CLI gotowy link `http://localhost:3000`.

---

Masz pomysł? Otwórz issue/PR lub napisz na <piotr.adamkowski@gmail.com>. Codex-ready! 🛠️
