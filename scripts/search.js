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
