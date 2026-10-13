import { getState } from "./state.js";
import { recordsToJson, downloadFile } from "./importExport.js";

const exportJsonButton = document.querySelector("#exportJsonButton");
const dataStatus = document.querySelector("#dataStatus");

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

export function initDataTools() {
  exportJsonButton.addEventListener("click", exportJson);
}
