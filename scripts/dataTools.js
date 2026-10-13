import { getState, replaceRecords, mergeRecords, clearAll } from "./state.js";
import { recordsToJson, recordsToCsv, downloadFile, parseImport, summariseErrors } from "./importExport.js";
import { openDialog } from "./dialog.js";

const exportJsonButton = document.querySelector("#exportJsonButton");
const exportCsvButton = document.querySelector("#exportCsvButton");
const dataStatus = document.querySelector("#dataStatus");
const importFileInput = document.querySelector("#importFileInput");
const importError = document.querySelector("#importError");
const clearDataButton = document.querySelector("#clearDataButton");
const recordsStatus = document.querySelector("#recordsStatus");
const recordsHeading = document.querySelector("#recordsHeading");

function describeCount(count) {
  return count === 1 ? "1 record" : count + " records";
}

function exportJson() {
  const { records } = getState();
  if (records.length === 0) {
    dataStatus.textContent = "There is nothing to export yet.";
    return;
  }
  downloadFile("student-finance-records.json", recordsToJson(records), "application/json");
  dataStatus.textContent = "Exported " + describeCount(records.length) + " to student-finance-records.json.";
}

function exportCsv() {
  const { records } = getState();
  if (records.length === 0) {
    dataStatus.textContent = "There is nothing to export yet.";
    return;
  }
  downloadFile("student-finance-records.csv", recordsToCsv(records), "text/csv");
  dataStatus.textContent = "Exported " + describeCount(records.length) + " to student-finance-records.csv.";
}

function rejectImport(message) {
  importError.textContent = "Import rejected. " + message;
  dataStatus.textContent = "";
  importFileInput.focus();
}

async function readChosenFile() {
  const file = importFileInput.files[0];
  try {
    return await file.text();
  } catch {
    return null;
  } finally {
    importFileInput.value = "";
  }
}

async function importJson() {
  if (importFileInput.files.length === 0) {
    return;
  }
  importError.textContent = "";
  const text = await readChosenFile();
  if (text === null) {
    rejectImport("The file could not be read.");
    return;
  }
  const result = parseImport(text);
  if (!result.valid) {
    rejectImport(summariseErrors(result.errors));
    return;
  }
  const found = describeCount(result.records.length);
  const answer = await openDialog({
    title: "Import " + found + "?",
    message: "Replace swaps out everything you have now. Merge keeps your records, adds these, and updates any that share an id.",
    choices: [
      { label: "Cancel", value: "" },
      { label: "Merge", value: "merge" },
      { label: "Replace", value: "replace", className: "button button-danger" }
    ]
  });
  if (answer === "replace") {
    replaceRecords(result.records);
  } else if (answer === "merge") {
    mergeRecords(result.records);
  } else {
    dataStatus.textContent = "Import cancelled. Nothing was changed.";
    return;
  }
  dataStatus.textContent = "";
  recordsStatus.textContent = answer === "replace"
    ? "Imported " + found + " and replaced what was there."
    : "Merged " + found + " into your records.";
  recordsHeading.focus();
}

async function clearEverything() {
  const answer = await openDialog({
    title: "Clear all data?",
    message: "Every record is deleted and the settings go back to their defaults. Export a copy first if you might want it back.",
    choices: [
      { label: "Cancel", value: "" },
      { label: "Clear everything", value: "clear", className: "button button-danger" }
    ]
  });
  if (answer !== "clear") {
    dataStatus.textContent = "Nothing was cleared.";
    return;
  }
  clearAll();
  importError.textContent = "";
  dataStatus.textContent = "All records were deleted and the settings were reset.";
}

export function initDataTools() {
  exportJsonButton.addEventListener("click", exportJson);
  exportCsvButton.addEventListener("click", exportCsv);
  importFileInput.addEventListener("change", importJson);
  clearDataButton.addEventListener("click", clearEverything);
}
