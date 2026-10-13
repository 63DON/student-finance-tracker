const comparators = {
  date: (first, second) => first.date.localeCompare(second.date) || first.createdAt.localeCompare(second.createdAt),
  description: (first, second) => first.description.localeCompare(second.description, undefined, { sensitivity: "base" }),
  amount: (first, second) => first.amount - second.amount
};

export function sortRecords(records, key, direction) {
  const compare = comparators[key] || comparators.date;
  const sorted = [...records].sort(compare);
  return direction === "descending" ? sorted.reverse() : sorted;
}

export function compileRegex(input, flags = "i") {
  if (input === "") {
    return null;
  }
  try {
    return new RegExp(input, flags);
  } catch {
    return null;
  }
}

function recordTexts(record) {
  return [record.description, record.category, record.date, String(record.amount)];
}

export function filterRecords(records, regex, toTexts = recordTexts) {
  if (!regex) {
    return records;
  }
  return records.filter((record) => toTexts(record).some((text) => regex.test(text)));
}

const htmlEscapes = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;"
};

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (character) => htmlEscapes[character]);
}

export function highlight(text, regex) {
  if (!regex) {
    return escapeHtml(text);
  }
  const flags = regex.flags.includes("g") ? regex.flags : regex.flags + "g";
  const globalRegex = new RegExp(regex.source, flags);
  let result = "";
  let cursor = 0;
  let match = globalRegex.exec(text);
  while (match !== null) {
    if (match[0] === "") {
      globalRegex.lastIndex += 1;
    } else {
      result += escapeHtml(text.slice(cursor, match.index));
      result += "<mark>" + escapeHtml(match[0]) + "</mark>";
      cursor = match.index + match[0].length;
    }
    match = globalRegex.exec(text);
  }
  return result + escapeHtml(text.slice(cursor));
}
