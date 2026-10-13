import { getState, replaceRecords, mergeRecords } from "./state.js";
import { recordsToJson, downloadFile, parseImport, summariseErrors } from "./importExport.js";
import { openDialog } from "./dialog.js";

const exportJsonButton = document.querySelector("#exportJsonButton");
const dataStatus = document.querySelector("#dataStatus");
const importFileInput = document.querySelector("#importFileInput");
const importError = document.querySelector("#importError");
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

export function initDataTools() {
  exportJsonButton.addEventListener("click", exportJson);
  importFileInput.addEventListener("change", importJson);
}
