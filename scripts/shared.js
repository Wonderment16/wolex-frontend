const API_BASE = "https://wolex.onrender.com";
const USE_MOCK = false;

let currencySymbol = "₦";


export function getCurrencySymbol(code) {
    const map = {
        NGN: "₦",
        USD: "$",
        GBP: "£",
        EUR: "€"
    };
    return map[code] || code;
}

export function formatCategory(cat) {
    return cat.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

export function formatTime(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatAmount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return "0";
    return num.toLocaleString();
}

export function applyFilters(transactions, renderFn, containerSelector) {
    if (!Array.isArray(transactions)) {
        console.error("Transactions is not an array:", transactions);
        return;
    }

    const searchInput = document.querySelector(".search-input");
    const typeSelect = document.querySelector('select[title="type"]');
    const categorySelect = document.querySelector('select[title="category"]');

    const query = searchInput?.value.trim().toLowerCase() || "";
    const selectedType = typeSelect?.value || "All";
    const selectedCategory = categorySelect?.value || "All";

    let filtered = transactions;

    // 1. Search Filter
    if (query) {
        filtered = filtered.filter(tx => {
            const desc = (tx.description || "").toLowerCase();
            const type = (tx.transaction_type || "").toLowerCase();
            // Safely get category name for search
            const cat = typeof tx.category === "object" && tx.category !== null
                ? (tx.category.name || tx.category.code || "").toLowerCase()
                : (tx.category || "").toLowerCase(); 
            const amt = String(tx.amount || "");
            
            return desc.includes(query) || type.includes(query) || cat.includes(query) || amt.includes(query);
        });
    }

    // 2. Type Filter (FIXED: Uses .toUpperCase() to match "INCOME"/"EXPENSE")
    if (selectedType !== "All") {
        filtered = filtered.filter(tx => 
            tx.transaction_type === selectedType.toUpperCase()
        );
    }

    // 3. Category Filter (FIXED: Added parentheses to .toUpperCase() and fixed comparison)
    if (selectedCategory !== "All") {
        filtered = filtered.filter(tx => {
            const catName = typeof tx.category === "object" && tx.category !== null
                ? tx.category.name || tx.category.code
                : tx.category;

            // ✅ FIX: Use toUpperCase() as a function with parentheses
            return catName?.toString().toUpperCase() === selectedCategory.toUpperCase();
        });
    }

    renderFn(filtered, containerSelector);
}

export function normalizeTransactionsResponse(data) {
    if (!data) return { transactions: [], currency: null };

    if (Array.isArray(data)) {
        return { transactions: data, currency: data.currency || null };
    }

    if (Array.isArray(data.results)) {
        return { transactions: data.results, currency: data.currency || null };
    }

    if (Array.isArray(data.transactions)) {
        return { transactions: data.transactions, currency: data.currency || null };
    }

    return { transactions: [], currency: data.currency || null };
}

export function renderTransactions(list, containerSelector) {
    const tableBody = document.querySelector(containerSelector);
    if (!tableBody) return;

    // 1. Clear the container
    tableBody.innerHTML = "";

    // 2. Handle Empty State
    if (!Array.isArray(list) || list.length === 0) {
        tableBody.innerHTML = `
            <div class="empty-state">
                <p>No transactions yet</p>
                <small>Add transactions to get started</small>
            </div>`;
        return;
    }

    // 3. Render rows matching your CSS (.transaction-row)
    list.forEach(tx => {
        const row = document.createElement("div");
        row.className = "transaction-row"; // Matches your CSS exactly
        row.classList.add("transaction-row"); // Matches your CSS exactly

        const desc = tx.description || "No description";
        const catData = tx.category || tx.category_name;
        
        // Handle Category Object from Serializer
        const catName =
        typeof catData === "object"
            ? (catData.name || catData.code)
            : (catData || "Miscellaneous");

        const amount = Number(tx.amount).toLocaleString();
        const typeClass = tx.transaction_type === "EXPENSE" ? "expense" : "income";

        // This HTML structure matches your CSS grid (2fr 1fr 1fr)
        row.innerHTML = `
            <div>
                <strong>${desc}</strong><br/>
                <small>${tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</small>
            </div>
            <div>${catName}</div>
            <div class="amount ${typeClass}">₦${amount}</div>
        `;
        
        tableBody.appendChild(row);
    });
}
export function normalizeDashboardData(data) {
    if (!data) return null;
    
    return {
        balance: data.balance ?? data.current_balance ?? 0,
        total_income: data.total_income ?? data.total_earned ?? 0,
        total_expense: data.total_expense ?? data.total_purchased ?? 0,
        currency: data.currency || "NGN",
        transactions: data.last_transactions || [],
        weekly: data.weekly,
        monthly: data.monthly,
        yearly: data.yearly
    };
}