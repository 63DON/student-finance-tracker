import { patterns, isRealDate } from "./validators.js";

const idPattern = /^txn_\d{4,}$/;
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

const fieldTypes = {
  id: "string",
  description: "string",
  amount: "number",
  category: "string",
  date: "string",
  createdAt: "string",
  updatedAt: "string"
};

function isTimestamp(value) {
  return timestampPattern.test(value) && !Number.isNaN(Date.parse(value));
}

function findRecordProblem(record) {
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return "is not an object";
  }
  for (const [field, type] of Object.entries(fieldTypes)) {
    if (!(field in record)) {
      return "is missing the " + field + " field";
    }
    if (typeof record[field] !== type) {
      return "needs " + field + " to be a " + type;
    }
  }
  if (!idPattern.test(record.id)) {
    return "has an id that does not look like txn_0001";
  }
  if (!patterns.description.test(record.description)) {
    return "has an empty description or one with spaces at the ends";
  }
  if (!Number.isFinite(record.amount) || !patterns.amount.test(String(record.amount))) {
    return "has an amount that is not zero or more with up to two decimals";
  }
  if (!patterns.category.test(record.category)) {
    return "has a category with characters other than letters, spaces and hyphens";
  }
  if (!patterns.date.test(record.date) || !isRealDate(record.date)) {
    return "has a date that is not a real YYYY-MM-DD day";
  }
  if (!isTimestamp(record.createdAt) || !isTimestamp(record.updatedAt)) {
    return "has a createdAt or updatedAt that is not an ISO timestamp";
  }
  return null;
}

function pickRecordFields(record) {
  const picked = {};
  for (const field of Object.keys(fieldTypes)) {
    picked[field] = record[field];
  }
  return picked;
}

function reject(errors) {
  return { valid: false, errors, records: [] };
}

export function validateRecords(records) {
  if (!Array.isArray(records)) {
    return reject(["The file must contain a list of records."]);
  }
  const errors = [];
  const seenIds = new Set();
  records.forEach((record, index) => {
    const problem = findRecordProblem(record);
    if (problem) {
      errors.push("Record " + (index + 1) + " " + problem + ".");
    } else if (seenIds.has(record.id)) {
      errors.push("Record " + (index + 1) + " repeats the id " + record.id + ".");
    } else {
      seenIds.add(record.id);
    }
  });
  if (errors.length > 0) {
    return reject(errors);
  }
  return { valid: true, errors: [], records: records.map(pickRecordFields) };
}

export function parseImport(text) {
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    return reject(["The file is not valid JSON."]);
  }
  const result = validateRecords(data);
  if (result.valid && result.records.length === 0) {
    return reject(["The file has no records in it."]);
  }
  return result;
}

export function summariseErrors(errors, limit = 3) {
  const shown = errors.slice(0, limit).join(" ");
  const hiddenCount = errors.length - limit;
  return hiddenCount > 0 ? shown + " And " + hiddenCount + " more." : shown;
}

export function recordsToJson(records) {
  return JSON.stringify(records, null, 2);
}

export function downloadFile(filename, text, mimeType) {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
