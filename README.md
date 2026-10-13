# Student Finance Tracker

A small single page app for logging what a student spends, keeping an eye on a budget cap, and searching records with regular expressions.

Theme: Student Finance Tracker (budgets, transactions, search)

Built with plain HTML, CSS and JavaScript. No frameworks, no libraries, no build step.

## Live site

https://63don.github.io/student-finance-tracker/

## Demo video

Demo video: link to be added

## Features

- Add records with a form that validates every field while you type
- Records shown as a table on wide screens and as cards on phones
- Edit a record in place, delete with a confirmation dialog
- Sort by date, description or amount in both directions
- Live regular expression search with highlighted matches and an ignore case toggle
- A bad search pattern shows a message instead of breaking the page
- Dashboard with total records, total spent, top category and a bar chart of the last 7 days
- Budget cap with a remaining or over message
- Base currency plus two others with manual exchange rates, and a choice of display currency
- Add, rename and remove categories
- Data saved in localStorage after every change
- Export to JSON or CSV, import from JSON with validation and a replace or merge choice
- Sample data on first run
- Light and dark theme
- Works with the keyboard alone and with a screen reader

## How to run locally

The scripts are ES modules, so the page has to be served over http. Opening index.html straight from the file system will not work.

1. Clone the repository
2. Start a local server in the project folder, for example:
   - VS Code: right click index.html and choose "Open with Live Server"
   - Python: `python -m http.server 8000`
3. Open http://localhost:8000/ in a browser

## How to run the tests

1. Start the local server as above
2. Open http://localhost:8000/tests.html
3. The page shows a summary line and a pass or fail entry for every assertion

The tests cover every validator, the safe regex compiler, sorting and filtering, highlight escaping, the stats, import validation and CSV export.

## Regex catalog

| Rule | Pattern | What it does | Valid | Invalid |
| --- | --- | --- | --- | --- |
| Description | `/^\S(?:.*\S)?$/` | No spaces at the start or end | `Lunch at cafe` | ` Lunch` |
| Amount | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Zero or a number without leading zeros, up to two decimals | `12.50` | `012` |
| Date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | YYYY-MM-DD. A second check rejects days that do not exist | `2024-02-29` | `2025-02-30` |
| Category | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Letters, with single spaces or hyphens between words | `Take-away` | `Food2` |
| Duplicate word (back-reference) | `/\b(\w+)\s+\1\b/i` | Finds a word repeated straight after itself. Shown as a warning, it does not block saving | `the the bus` is flagged | `the theme` is not flagged |
| Exchange rate (lookahead) | `/^(?=.*[1-9])\d+(\.\d{1,4})?$/` | A number with up to four decimals that has at least one non-zero digit | `0.92` | `0.00` |
| Currency code | `/^[A-Z]{3}$/` | Three capital letters | `USD` | `usd` |
| Record id (import) | `/^txn_\d{4,}$/` | The id format used by the app | `txn_0001` | `7` |
| Timestamp (import) | `/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z\|[+-]\d{2}:\d{2})$/` | ISO date and time | `2025-09-29T12:15:00.000Z` | `2025-09-29` |

Collapsing spaces before saving uses `/\s{2,}/g`.

Search patterns to try:

- `\.\d{2}\b` finds amounts that have cents
- `(coffee|tea)` finds a beverage keyword
- `\b(\w+)\s+\1\b` finds a duplicated word

Search patterns are compiled inside a try/catch. A pattern that cannot be compiled returns null, the full list stays visible and an "invalid pattern" message appears under the search box.

## Keyboard map

| Key | Where | What it does |
| --- | --- | --- |
| Tab, Shift+Tab | Everywhere | Move forwards and backwards |
| Enter | Skip link | Jump past the header to the main content |
| Enter | Navigation links | Jump to that section |
| Enter or Space | Buttons, sort headers, pattern hints | Activate |
| Space | Ignore case checkbox | Toggle |
| Arrow keys | Select boxes | Change the option |
| Enter | Add record form | Submit |
| Enter | A record being edited | Save the edit |
| Escape | A record being edited | Cancel the edit |
| Enter | A category name box | Rename that category |
| Escape | Dialog | Close without doing anything |

Where focus goes:

- After adding a record: back to the description field
- After saving or cancelling an edit: the Edit button of that record
- After deleting: the Edit button of the next record, or the Records heading if the list is empty
- After closing a dialog without confirming: the button that opened it
- After an import: the Records heading

## Accessibility notes

- Landmarks: header, nav, main, footer, and a labelled section for each part of the page
- One h1, an h2 per section and h3 for the parts inside them
- The skip link is the first focusable element
- Every input has a visible label. Errors are linked with aria-describedby and aria-invalid
- The records table has a caption, column headers with scope and aria-sort on the sorted column
- Live regions: form summary, search result count, record changes and settings messages are polite. Going over the budget cap is assertive. A rejected import is an alert
- The delete, import and clear confirmations use a native dialog. Focus moves into it and goes back afterwards
- The bar chart has visible labels and a text summary for screen readers
- Text contrast is at least 4.5:1 and borders and focus rings at least 3:1, in both themes
- Animations are switched off when the system asks for reduced motion
- User text is always escaped before it is put on the page, including inside search highlights

## Data model

Each record:

```json
{
  "id": "txn_0001",
  "description": "Lunch at the cafeteria",
  "amount": 4.5,
  "category": "Food",
  "date": "2026-10-13",
  "createdAt": "2026-10-13T10:15:00.000Z",
  "updatedAt": "2026-10-13T10:15:00.000Z"
}
```

- id: generated by the app, unique, never reused after a delete
- description: text with no spaces at the ends
- amount: a number, zero or more, up to two decimals, stored in the base currency
- category: one of the categories in Settings
- date: YYYY-MM-DD
- createdAt and updatedAt: ISO timestamps. updatedAt changes on every edit

Everything is stored under one localStorage key, `studentFinanceTracker`, as `{ records, settings, nextId }`.

## Seed data

seed.json holds 17 sample records and is loaded the first time the app runs with empty storage. It is also a valid import file. It includes:

- Edge dates: 2024-02-29, 2025-12-31 and 2026-01-01
- Tiny and large amounts: 0, 0.01 and 99999.99
- Tricky text: an apostrophe, double quotes, an ampersand and text that looks like HTML
- One description with a duplicated word
- Every default category
- Several records from the week of 13 October 2026 so the 7 day chart has bars. On a later date, add a record dated today to see the chart fill in

## Project layout

- index.html: the app
- tests.html and tests/tests.js: the assertions
- seed.json: sample data
- styles/main.css: all styles
- scripts/main.js: starts everything, loads saved data, saves after each change
- scripts/state.js: the records and settings, and every function that changes them
- scripts/storage.js: reads and writes localStorage
- scripts/validators.js: the regex rules
- scripts/search.js: regex compiler, filter, sort and highlight
- scripts/stats.js: totals, top category, 7 day trend, cap and currency conversion
- scripts/ui.js: small helpers shared by the views
- scripts/records.js: the records table and cards, search, sort, edit and delete
- scripts/form.js: the add record form
- scripts/dashboard.js: the stat cards and chart
- scripts/settings.js: currencies, budget cap and categories
- scripts/dataTools.js: export, import and clear buttons
- scripts/importExport.js: import validation, JSON and CSV output
- scripts/dialog.js: the confirmation dialog
- scripts/theme.js: light and dark theme
- docs/spec.md: the spec and accessibility plan
- assets/wireframes: mobile, tablet and desktop sketches

## Author

Bayubahe Don

- GitHub: https://github.com/63DON
- Email: b.don@alustudent.com
