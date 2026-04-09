import {
  renderTransactions,
  applyFilters,
  normalizeTransactionsResponse,
  getCurrencySymbol
} from "./shared.js";

const API_BASE = "https://wolex.onrender.com";
const USE_MOCK = false;

let allTransactions = [];

export function getToken() {
  return localStorage.getItem("access");
}
const token = getToken();

if (!token) {
  console.warn("No token found");
  window.location.href = "/pages/login.html";
}



function loadTransactionList() {
  fetch(`${API_BASE}/api/transactions/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res =>
      res.status === 401
        ? (window.location.href = "/pages/login.html", null)
        : res.json()
    )
    .then(data => {
      if (!data) return;

      const normalized = normalizeTransactionsResponse(data);

      allTransactions = normalized.transactions;
      currencySymbol = getCurrencySymbol(normalized.currency || "NGN");

      // 🔥 FULL LIST (NO SLICE HERE)
      renderTransactions(allTransactions, ".table-body");
    })
    .catch(err => console.error("Failed to load transactions:", err));
}

function setupFilters() {
  const searchInput = document.querySelector(".search-input");
  const typeSelect = document.querySelector('select[title="type"]');
  const categorySelect = document.querySelector('select[title="category"]');

  if (searchInput)
    searchInput.addEventListener("input", () =>
      applyFilters(allTransactions, renderTransactions, ".table-body")
    );

  if (typeSelect)
    typeSelect.addEventListener("change", () =>
      applyFilters(allTransactions, renderTransactions, ".table-body")
    );

  if (categorySelect)
    categorySelect.addEventListener("change", () =>
      applyFilters(allTransactions, renderTransactions, ".table-body")
    );
}

document.addEventListener("DOMContentLoaded", () => {
  loadTransactionList();
  setupFilters();
});
