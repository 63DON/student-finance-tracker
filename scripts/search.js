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
