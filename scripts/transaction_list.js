import {
  renderTransactions,
  applyFilters,
  normalizeTransactionsResponse,
  getCurrencySymbol
} from "./shared.js";

const API_BASE = "http://127.0.0.1:8000";
const USE_MOCK = false;

let allTransactions = [];
let currencySymbol = "₦";

export function getToken() {
  return localStorage.getItem("access");
}
const token = getToken();

if (!token) {
  console.warn("No token found");
  window.location.href = "/pages/login.html";
}


const mockTransactions = [
  {
    id: 1,
    transaction_type: "EXPENSE",
    amount: 4500,
    category: "FOOD",
    description: "Lunch at Mr Biggs",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    transaction_type: "EXPENSE",
    amount: 1200,
    category: "TRANSPORTATION",
    description: "Uber to YDF",
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 3,
    transaction_type: "INCOME",
    amount: 15000,
    category: "MISCELLANEOUS",
    description: "Freelance payment",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4,
    transaction_type: "EXPENSE",
    amount: 3000,
    category: "BILLS AND UTILITIES",
    description: "Data subscription",
    created_at: new Date(Date.now() - 172800000).toISOString()
  }
];

const mockDashboardData = {
  total_income: 15000,
  total_expense: 8700,
  balance: 6300,
  currency: "NGN",
  transactions: mockTransactions,
  insights: ["You're managing your money well 👍"],
  weekly: { labels: [], datasets: [{ data: [] }, { data: [] }] },
  monthly: { labels: [], datasets: [{ data: [] }, { data: [] }] },
  yearly: { labels: [], datasets: [{ data: [] }, { data: [] }] }
};



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
