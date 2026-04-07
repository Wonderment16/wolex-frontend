import {
  renderTransactions,
  formatAmount,
  normalizeDashboardData,
  getCurrencySymbol
} from "./shared.js";
const API_BASE = "http://127.0.0.1:8000";
const USE_MOCK = false;

let allTransactions = [];
let currencySymbol = "₦";
let dashboardData = null;

export function getToken() {
  return localStorage.getItem("access");
}
const token = getToken();

// --- 1. MOVE THESE TO THE TOP (Global Scope) ---
const modal = document.getElementById("txn-modal");
const fab = document.querySelector(".fab");
const closeBtn = document.getElementById("close-modal");
const saveBtn = document.getElementById("save-txn");
const name = localStorage.getItem("user_name") || "User";

function setGreeting(name) {
  const hour = new Date().getHours();

  let greeting;

  if (hour < 12) greeting = "🌅 Good morning";
  else if (hour < 18) greeting = "☀️ Good afternoon";
  else greeting = "🌙 Good evening";

  document.getElementById("user-name").textContent = `${greeting}, ${name}`;
}


if (!token) {
  console.warn("No token found");
  window.location.href = "/pages/login.html";
}

function formatMoney(val) {
  const sign = val < 0 ? "-" : "";
  return `${sign}${currencySymbol}${formatAmount(Math.abs(val))}`;
}


saveBtn.addEventListener("click", () => {

  const desc = document.getElementById("txn-desc").value;
  const amount = Number(document.getElementById("txn-amount").value);
  const type = document.getElementById("txn-type").value;
  const category_id = Number(document.getElementById("txn-category").value);

  if (!category_id) {
    alert("Invalid category selected");
    return;
  }
  if (!desc || !amount) {
    alert("Fill all fields");
    return;
  }

  console.log({
  description: desc,
  amount: amount,
  transaction_type: type,
  category_id: category_id
  });

  fetch(`${API_BASE}/api/transactions/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      description: desc,
      amount: amount,
      transaction_type: type,
      category_id: category_id
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("Failed to save");
    return res.json();
  })
  .then(data => {
      // data here is the JSON response from your Django serializer
      console.log("Success:", data); 

      modal.classList.add("hidden");
      document.getElementById("txn-desc").value = "";
      document.getElementById("txn-amount").value = "";

      // IMPORTANT: Now we call the real data fetcher
      loadDashboard(); 
  })
  .catch(err => {
    console.error(err);
    alert("Error saving transaction");
    alert("Check your inputs: Make sure the category matches the type (Income/Expense)");
    modal.classList.add("hidden");
  });
});


function setDashboardSummary(data) {
  const balanceEl = document.getElementById("balance-value"); 
  const incomeEl = document.getElementById("total_income");   // Matches HTML
  const expenseEl = document.getElementById("total_expense"); // Matches HTML
  
  if (balanceEl) {
    balanceEl.textContent = formatMoney(data.balance);
    if (data.balance < 0) {
      balanceEl.style.color = "#e74c3c";
    } else {
      balanceEl.style.color = "#2ecc71";
    }
  }
  if (incomeEl) incomeEl.textContent = formatMoney(data.total_income);
  if (expenseEl) expenseEl.textContent = formatMoney(data.total_expense);
}

let trendChart = null;
let currentRange = "weekly";

function initChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas || typeof Chart === "undefined") return;

  if (!canvas) return;

    // 🔥 FIX: If a chart already exists, destroy it so we can reuse the canvas
    if (trendChart !== null) {
        trendChart.destroy();
    }


  const ctx = canvas.getContext("2d");
  const incomeGradient = ctx.createLinearGradient(0, 0, 0, 300);
  incomeGradient.addColorStop(0, "rgba(50,212,26,0.35)");
  incomeGradient.addColorStop(1, "rgba(50,212,26,0)");

  const expenseGradient = ctx.createLinearGradient(0, 0, 0, 300);
  expenseGradient.addColorStop(0, "rgba(44,25,232,0.35)");
  expenseGradient.addColorStop(1, "rgba(44,25,232,0)");

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Income",
          data: [],
          borderColor: "#32D41A",
          backgroundColor: incomeGradient,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "#32D41A"
        },
        {
          label: "Expenses",
          data: [],
          borderColor: "#2C19E8",
          backgroundColor: expenseGradient,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: "#2C19E8"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      scales: {
        y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } }
      }
    }
  });
}

function updateChart(data) {
  if (!trendChart || !data || !data[currentRange] || !data[currentRange].datasets) {
    return;
  }

  const rangeData = data[currentRange];
  const emptyState = document.getElementById("chart-empty");
  const hasData = rangeData.datasets.some(ds =>
    ds.data.some(val => val !== 0)
  )

  if (!hasData) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  // Update labels (e.g., ["Mon", "Tue"...])
  trendChart.data.labels = rangeData.labels || [];
  
  // Update Dataset 0 (Income)
  trendChart.data.datasets[0].data = rangeData.datasets[0]?.data || [];
  
  // Update Dataset 1 (Expenses)
  trendChart.data.datasets[1].data = rangeData.datasets[1]?.data || [];

  trendChart.update(); // This triggers the animation and render
  
}

function bindChartButtons() {
  document.getElementById("weekly-btn")?.addEventListener("click", () => {
    currentRange = "weekly";
    updateChart(dashboardData); // Add this!
  });
  document.getElementById("monthly-btn")?.addEventListener("click", () => {
    currentRange = "monthly";
    updateChart(dashboardData); // Add this!
  });
  document.getElementById("yearly-btn")?.addEventListener("click", () => {
    currentRange = "yearly";
    updateChart(dashboardData); // Add this!
  });
}

// In dashboard.js
function loadCategories(selectedType = "EXPENSE") {
  fetch(`${API_BASE}/api/category/`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(data => {
      const select = document.getElementById("txn-category");
      if (!select || !Array.isArray(data)) return;

      select.innerHTML = "";

      // Filter: Only show categories where 'kind' matches 'selectedType'
      // Your model uses "INCOME" and "EXPENSE"
      const filtered = data.filter(cat => cat.kind === selectedType);

      filtered.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat.id;
        option.textContent = cat.name;
        select.appendChild(option);
      });
    });
}

function renderInsights(insights) {
  const box = document.getElementById("insights-box");
  if (!box) return;

  box.innerHTML = "";

  if (!insights || insights.length === 0) {
    box.innerHTML = `<p style="opacity:0.6">No insights yet</p>`;
    return;
  }

  insights.forEach(msg => {
    const p = document.createElement("p");
    p.textContent = msg;
    p.style.marginBottom = "8px";
    box.appendChild(p);
  });
}

function loadDashboard() {
    fetch(`${API_BASE}/api/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => (res.status === 401 ? (window.location.href = "/pages/login.html", null) : res.json()))
    .then(data => {
        if (!data) return;
        const normalized = normalizeDashboardData(data);
        dashboardData = normalized;

        updateChart(dashboardData); // Ensure the chart updates with the loaded data

        // ✅ REMOVED: The manual income/expense loop that was overwriting your data

        // Use the totals directly from Django
        setDashboardSummary(normalized);
        renderInsights(data.insights);
        setGreeting(data.user?.name || name);
        
        currencySymbol = getCurrencySymbol(normalized.currency);
        allTransactions = normalized.transactions || data.last_transactions || []; // Use the transactions sent by Django 
        
        // Use the 'top_category' sent by your Django View directly
        const { topExpense, topIncome } = computeTopCategories(allTransactions);
        
        const topSpendingEl = document.querySelector("#top_category");
        const topIncomeEl = document.querySelector("#top_income_source");

        if (topSpendingEl) {
          topSpendingEl.innerHTML = topExpense
          ? `
            <strong>${topExpense.name}</strong><br>
            <small>${currencySymbol}${formatAmount(topExpense.amount)}</small>
          `
          : `<span style="opacity:0.6">No data</span>`;
                }
                
        if (topIncomeEl) {
          topIncomeEl.innerHTML = topIncome
          ? `
            <strong>${topIncome.name}</strong><br>
            <small>${currencySymbol}${formatAmount(topIncome.amount)}</small>
          `
          : `<span style="opacity:0.6">No data</span>`;
          }        
        renderTransactions(allTransactions.slice(0, 5), ".table-body"); // Show only the latest 5 transactions

    })
    .catch(err => console.error("Failed to load dashboard:", err));
}

function computeTopCategories(transactions) {
  const expenseMap = {};
  const incomeMap = {};

  transactions.forEach(tx => {
    const category =
      tx.category_name ||
      (typeof tx.category === "object" ? tx.category.name : tx.category) ||
      "Unknown";
    const amount = Number(tx.amount) || 0;

    const type = tx.type || tx.transaction_type || "UNKNOWN";

    if (type === "EXPENSE") {
      expenseMap[category] = (expenseMap[category] || 0) + amount;
    }

    if (type === "INCOME") {
      incomeMap[category] = (incomeMap[category] || 0) + amount;
    }
});

  const getTopFull = (map) => {
  let top = null;
  let max = 0;

  for (let key in map) {
    if (map[key] > max) {
      max = map[key];
      top = key;
    }
  }

  return top ? { name: top, amount: max } : null;
  };

return {
    topExpense: getTopFull(expenseMap),
    topIncome: getTopFull(incomeMap)
};
}

document.addEventListener("DOMContentLoaded", () => {
  if (fab && modal) {
    fab.addEventListener("click", () => modal.classList.remove("hidden"));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  }

  const typeSelect = document.getElementById("txn-type");
  
  // Listen for changes on the Type dropdown
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      const selectedType = e.target.value; // "INCOME" or "EXPENSE"
      loadCategories(selectedType);
    });
  }

  // Initial load (default to EXPENSE)
  loadCategories("EXPENSE");

  initChart();
  bindChartButtons();
  loadDashboard();
});
