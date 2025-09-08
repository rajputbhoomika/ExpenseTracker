const form = document.getElementById("transaction-form");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");
const categoryInput = document.getElementById("category");
const amountInput = document.getElementById("amount");
const transactionList = document.getElementById("transaction-list");
const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const netBalanceEl = document.getElementById("net-balance");
const filterCategory = document.getElementById("filter-category");
const chartCanvas = document.getElementById("expense-chart");
const voiceBtn = document.getElementById("voice-btn");
const themeToggle = document.getElementById("theme-toggle");
const exportBtn = document.getElementById("export-btn");
const importFile = document.getElementById("import-file");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  addTransaction();
});

filterCategory.addEventListener("change", renderTransactions);

voiceBtn.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-IN";
  recognition.start();
  recognition.onresult = (event) => {
    descriptionInput.value = event.results[0][0].transcript;
  };
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(transactions)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.json";
  a.click();
});

importFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      transactions = JSON.parse(reader.result);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      renderTransactions();
      updateSummary();
      updateChart();
    } catch {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});

function addTransaction() {
  const date = dateInput.value;
  const description = descriptionInput.value.trim();
  const category = categoryInput.value;
  const amount = parseFloat(amountInput.value);

  if (!date || !description || !category || isNaN(amount)) {
    alert("Please fill all fields correctly.");
    return;
  }

  const transaction = {
    id: Date.now(),
    date,
    description,
    category,
    amount,
    type: category === "Income" ? "income" : "expense"
  };

  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  form.reset();
  renderTransactions();
  updateSummary();
  updateChart();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
  updateSummary();
  updateChart();
}

function renderTransactions() {
  transactionList.innerHTML = "";
  const filtered = filterCategory.value === "All"
    ? transactions
    : transactions.filter(t => t.category === filterCategory.value);

  filtered.forEach(t => {
    const li = document.createElement("li");
    li.className = `transaction-item ${t.type}`;
    li.innerHTML = `
      <span>${t.date} - ${t.description} (${t.category})</span>
      <span>₹${t.amount.toFixed(2)}</span>
      <button onclick="editTransaction(${t.id})">Edit</button>
      <button onclick="deleteTransaction(${t.id})">Delete</button>
    `;
    transactionList.appendChild(li);
  });
}

function editTransaction(id) {
  const t = transactions.find(tx => tx.id === id);
  if (!t) return;
  dateInput.value = t.date;
  descriptionInput.value = t.description;
  categoryInput.value = t.category;
  amountInput.value = t.amount;
  deleteTransaction(id);
}

function updateSummary() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  totalIncomeEl.textContent = income.toFixed(2);
  totalExpensesEl.textContent = expenses.toFixed(2);
  netBalanceEl.textContent = (income - expenses).toFixed(2);
}

function updateChart() {
  const expenseData = {};
  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
    });

  const ctx = chartCanvas.getContext("2d");
  if (window.expenseChart) window.expenseChart.destroy();

  window.expenseChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(expenseData),
      datasets: [{
        data: Object.values(expenseData),
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"]
      }]
    }
  });
}

renderTransactions();
updateSummary();
updateChart();