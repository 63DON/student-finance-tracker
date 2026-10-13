# Student Finance Tracker: spec

## Theme

A single page app that helps a student keep track of what they spend. Every purchase is saved as a record with a description, an amount, a category and a date. The app shows where the money goes, warns when a budget cap is passed, and lets the student search their records with regular expressions.

Everything runs in the browser. There is no server and no account. Data is kept in localStorage and can be exported to a JSON file and imported again.

## Who it is for

- A student who wants a quick way to log spending between classes, mostly on a phone
- A student who reviews the month on a laptop and wants to sort and search
- Anyone who uses the keyboard only or a screen reader

## Features

### Records

- Add a record with a form that checks every field while you type
- See records in a table on wide screens and as cards on small screens
- Edit a record in place, Enter saves and Escape cancels
- Delete a record after confirming in a dialog
- Sort by date, description or amount, in both directions

### Search

- Live search using a regular expression
- A bad pattern never crashes the page, it shows an inline message
- Toggle to ignore or respect letter case
- Matching text is highlighted
- Example patterns are shown as hints
- The number of results is announced

### Dashboard

- Total number of records
- Total spent in the display currency
- The category with the highest spend
- A bar chart of the last 7 days
- Remaining budget, or how far over the cap you are

### Settings

- A base currency and two other currencies with manual exchange rates
- Choice of which currency amounts are displayed in
- Budget cap
- Add, rename and remove categories
- Export to JSON, import from JSON with validation, clear all data

### Pages

- index.html: the app
- tests.html: small assertions for the validators, the search helpers and the import checks
