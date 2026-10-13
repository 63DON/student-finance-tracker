window.extraChecks = async ({ w, d, $, type, add, rows, log, wait }) => {
  log("--- M5");
  log("count=" + $("#statCount").textContent + " total=" + $("#statTotal").textContent + " top=" + $("#statTopCategory").textContent + " (" + $("#statTopCategoryNote").textContent + ")");
  log("cap: " + $("#statCap").textContent + " | " + $("#statCapNote").textContent);
  const today = new Date();
  const iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  add("Lunch today", "12", "Food", iso);
  log("chart columns=" + d.querySelectorAll(".chart-column").length + " last bar height=" + d.querySelector(".chart-column:last-child .chart-bar").style.height + " px=" + d.querySelector(".chart-column:last-child .chart-bar").getBoundingClientRect().height);
  log("trend note: " + $("#trendNote").textContent);
  log("trend summary: " + $("#trendSummary").textContent);
  type("#budgetCapInput", "abc");
  log("cap error: " + $("#budgetCapError").textContent);
  type("#budgetCapInput", "100");
  $("#budgetForm").requestSubmit();
  log("under: " + $("#statCap").textContent + " | polite=" + $("#capPolite").textContent + " | assertive=" + $("#capAssertive").textContent + " | " + $("#budgetStatus").textContent);
  type("#budgetCapInput", "30");
  $("#budgetForm").requestSubmit();
  log("over: " + $("#statCap").textContent + " | polite=" + $("#capPolite").textContent + " | assertive=" + $("#capAssertive").textContent + " over-class=" + $("#capCard").classList.contains("is-over"));
};
