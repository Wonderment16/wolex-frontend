import {
  renderTransactions,
  applyFilters,
  normalizeTransactionsResponse,
  getCurrencySymbol
} from "./shared.js";

const API_BASE = "https://wolex.onrender.com";
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

const fab = document.querySelector(".fab");
const modal = document.getElementById("txn-modal");
const closeBtn = document.getElementById("close-modal");

fab.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

function setTransactionStats(transactions) {
  const totalBox = document.querySelector("#total-count");
  const budgetBox = document.querySelector("#budget-value");
  const remainingBox = document.querySelector("#remaining-value");
  const infoText = document.getElementById("income-expense-text");
  
  const income = transactions
    .filter(tx => tx.transaction_type === "INCOME")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const expense = transactions
    .filter(tx => tx.transaction_type === "EXPENSE")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  infoText.textContent = `${expense.toLocaleString()} Expenses ● ${income.toLocaleString()} Income`;

  if (!totalBox || !budgetBox || !remainingBox) return;

  const total = transactions.length;


  // 🔥 TEMP (until real budget system exists)
  const budget = income; 

  const used = expense;
  const remaining = budget - used;

  // SET VALUES
  totalBox.textContent = total;
  budgetBox.textContent = budget.toLocaleString();
  remainingBox.textContent = remaining.toLocaleString();

  document.getElementById("used-value").textContent = used.toLocaleString();
  document.getElementById("left-value").textContent = remaining.toLocaleString();

  if (remaining < 0) {
    remainingBox.style.color = "red";
  } else {
    remainingBox.style.color = "lightgreen";
  }
}

const saveBtn = document.getElementById("save-txn");

saveBtn.addEventListener("click", () => {

  const desc = document.getElementById("txn-desc").value;
  const amount = parseFloat(document.getElementById("txn-amount").value);
  const type = document.getElementById("txn-type").value;
  const category = document.getElementById("txn-category").value;

  if (!desc || !amount) {
    alert("Fill all fields");
    return;
  }

  fetch("https://wolex.onrender.com/api/transactions/", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        description: desc,
        amount: amount,
        transaction_type: type,
        category_id: Number(category)
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    })
    .then(data => {

      // 🔥 CLOSE MODAL
      modal.classList.add("hidden");

      // 🔥 CLEAR INPUTS
      document.getElementById("txn-desc").value = "";
      document.getElementById("txn-amount").value = "";

      // 🔥 REFRESH UI
      loadTransactions();

    })
    .catch(err => {
      console.error(err);
      alert("Error saving transaction");
    });

  // 🔥 close modal
  modal.classList.add("hidden");
});

function loadTransactions() {
  if (USE_MOCK) {
    allTransactions = normalized.transactions;
    setTransactionStats(allTransactions);
    currencySymbol = getCurrencySymbol(normalized.currency || "NGN");
    renderTransactions(allTransactions.slice(0, 5), ".table-body");
    return;
  }

  const token = localStorage.getItem("access");
  if (!token) {
    window.location.href = "/pages/login.html";
    return;
  }

  fetch(`${API_BASE}/api/category/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => (res.status === 401 ? (window.location.href = "/pages/login.html", null) : res.json()))
    .then(data => {
      const select = document.getElementById("txn-category");

      if (!select) return;

      select.innerHTML = ""; // clear old static options

      data.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;   // 🔥 IMPORTANT: use ID now
        option.textContent = cat.name;
        select.appendChild(option);
      });

      if (!data) return;
      // 2. Load the actual Transactions for the table
      fetch(`${API_BASE}/api/transactions/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
          // 'data' here is the list of transactions from your Django Serializer
          allTransactions = data; 
          setTransactionStats(allTransactions);
          renderTransactions(allTransactions.slice(0, 5), ".table-body");
      });
    })
    .catch(err => console.error("Failed to load transactions:", err));
}

function filterCategoriesByType(type, categories) {
  return categories.filter(cat => cat.kind === type);
}

document.addEventListener("DOMContentLoaded", () => {
  loadTransactions();

  const filterBtn = document.querySelector(".filter-btn");
  const filters = document.querySelector(".filters");
  if (filterBtn && filters) {
    filterBtn.addEventListener("click", () => filters.classList.toggle("hidden"));
  }

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
});
