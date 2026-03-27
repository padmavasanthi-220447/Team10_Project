let lastSavings=0;
let lastTotalExpense=0;
// ==========================
// PAGE LOAD
// ==========================
document.addEventListener("DOMContentLoaded", async function(){

if(!localStorage.getItem("userId")){
window.location.href="login.html";
return;
}

await loadBudget();
await loadExpenses();

});


// ==========================
// MONTH HELPERS
// ==========================
function getMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}_${now.getMonth() + 1}`;
}

function getPreviousMonthData(userId) {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);

  const key = `monthlyData_${userId}_${now.getFullYear()}_${now.getMonth() + 1}`;

  return JSON.parse(localStorage.getItem(key)) || {
    carryRemaining: 0,
    carrySavings: 0
  };
}

function filterCurrentMonth(transactions) {
  const now = new Date();

  return transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  });
}


// ==========================
// SAVE BUDGET (DB + localStorage)
// ==========================
async function saveBudget(){

let budget = parseFloat(document.getElementById("budgetInput").value);

if(!budget || budget < 0){
alert("Enter valid budget");
return;
}

let userId = localStorage.getItem("userId");

// Save to localStorage as fast cache
localStorage.setItem(`monthlyBudget_${userId}`, budget);

// ✅ Save to DB so it works on any device
try {
  await fetch(window.buildApiUrl("/api/expenses/budget"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, budget })
  });
} catch(e) {
  console.warn("Budget DB save failed:", e);
}

await loadBudget();
await updateSummary();

}


// ==========================
// LOAD BUDGET (DB first, localStorage fallback)
// ==========================
async function loadBudget(){

let userId = localStorage.getItem("userId");
if (!userId) return;

try {
  const res = await fetch(window.buildApiUrl("/api/expenses/budget?userId=" + encodeURIComponent(userId)));
  if (res.ok) {
    const data = await res.json();
    const dbBudget = data.monthlyBudget || 0;
    // Update localStorage cache too
    localStorage.setItem(`monthlyBudget_${userId}`, dbBudget);
    document.getElementById("monthlyBudget").textContent = "₹" + dbBudget;
    return;
  }
} catch(e) {
  console.warn("Budget DB load failed, using localStorage:", e);
}

// Fallback to localStorage
let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;
document.getElementById("monthlyBudget").textContent = "₹" + budget;

}


// ==========================
// FETCH EXPENSES
// ==========================
async function fetchExpenses(){

const userId = String(localStorage.getItem("userId") || "").trim();
if (!userId) return [];

const res = await fetch(
    window.buildApiUrl("/api/expenses?userId=" + encodeURIComponent(userId))
  );
if (!res.ok) return [];
return await res.json();

}


// ==========================
// CALCULATION FUNCTION (FINAL FIXED)
// ==========================
function calculateSummary(transactions, budget, carryData){

let income = transactions
  .filter(t => t.type === "income")
  .reduce((sum, t) => sum + Number(t.amount), 0);

let expense = transactions
  .filter(t => t.type === "expense")
  .reduce((sum, t) => sum + Number(t.amount), 0);

let savings = transactions
  .filter(t => t.type === "savings")
  .reduce((sum, t) => sum + Number(t.amount), 0);

// ✅ Correct logic
let totalBudget = budget + income + carryData.carryRemaining;

// Only for display
let totalSavings = savings + carryData.carrySavings;

// ❗ IMPORTANT FIX
let remaining = totalBudget - expense;

return { income, expense, savings: totalSavings, totalBudget, remaining };

}


// ==========================
// ADD EXPENSE (FIXED)
// ==========================
async function addExpense(){

const userId = String(localStorage.getItem("userId") || "").trim();

let date = document.getElementById("date").value;
let type = document.getElementById("type").value;
let category = document.getElementById("category").value;
let description = document.getElementById("description").value;
let amount = parseFloat(document.getElementById("amount").value);

if(!date || !category || !amount || amount <= 0){
alert("Fill all required fields correctly");
return;
}

let transactions = await fetchExpenses();
transactions = filterCurrentMonth(transactions);

let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

let carryData = getPreviousMonthData(userId);

let summary = calculateSummary(transactions, budget, carryData);

// Validation
if((type === "expense" || type === "savings") && amount > summary.remaining){
    alert("Not enough balance!");
    return;
}

// SAVE
const saveRes = await fetch(window.buildApiUrl("/api/expenses/add"),{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({ userId, date, type, category, description, amount })
});

if (!saveRes.ok) {
const err = await saveRes.json().catch(() => ({}));
alert(err.message || "Could not save transaction. Check the server.");
return;
}

// ==========================
// AFTER SAVE (CORRECT PLACE)
// ==========================
await loadExpenses();

// 🔥 ALERT LOGIC (FIXED)
let updatedTransactions = await fetchExpenses();
updatedTransactions = filterCurrentMonth(updatedTransactions);

// get fresh budget
let updatedUserId = localStorage.getItem("userId");
let updatedBudget = parseFloat(localStorage.getItem(`monthlyBudget_${updatedUserId}`)) || 0;

checkAlerts(updatedTransactions, updatedBudget);

// clear form
clearInputs();

}


// ==========================
// RENDER TABLE
// ==========================
async function renderTable(){

let table = document.getElementById("expenseTable");
table.innerHTML = "";

let transactions = await fetchExpenses();
transactions = filterCurrentMonth(transactions);

transactions.forEach((item,index)=>{

let row = table.insertRow();

row.innerHTML = `
<td data-label="Date">${item.date.split("T")[0]}</td>
<td data-label="Type" class="${item.type}">${item.type}</td>
<td data-label="Category">${item.category}</td>
<td data-label="Description">${item.description}</td>
<td data-label="Amount">₹${item.amount}</td>
<td data-label="Action">
<button onclick="editExpense(${index})">Edit</button>
<button onclick="deleteExpense('${item._id}')">Delete</button>
</td>
`;

});

}


// ==========================
// EDIT
// ==========================
async function editExpense(index){

let transactions = await fetchExpenses();
let item = transactions[index];

// ✅ ONLY FILL FORM (NO DELETE HERE)
document.getElementById("date").value = item.date.split("T")[0];
document.getElementById("type").value = item.type;
document.getElementById("category").value = item.category;
document.getElementById("description").value = item.description;
document.getElementById("amount").value = item.amount;

// ❌ REMOVE THIS LINE
// await fetch(... DELETE ...)

}


// ==========================
// DELETE
// ==========================
async function deleteExpense(id){

if(!confirm("Delete this transaction?")) return;

// 🔥 STEP 1: get previous data
let prevTransactions = await fetchExpenses();
prevTransactions = filterCurrentMonth(prevTransactions);

let prevSavings = prevTransactions
  .filter(t => t.type === "savings")
  .reduce((sum, t) => sum + t.amount, 0);

// 🔥 STEP 2: delete
await fetch(window.buildApiUrl("/api/expenses/" + id),{ method:"DELETE" });

await loadExpenses();

// 🔥 STEP 3: get updated data
let updatedTransactions = await fetchExpenses();
updatedTransactions = filterCurrentMonth(updatedTransactions);

let newSavings = updatedTransactions
  .filter(t => t.type === "savings")
  .reduce((sum, t) => sum + t.amount, 0);

// 🔥 STEP 4: force toast (independent of lastSavings)
if(prevSavings > newSavings){
  let diff = prevSavings - newSavings;

  setTimeout(() => {
    showToast(`⚠️ You used ₹${diff} from your savings`, "info");
  }, 100); // small delay ensures UI updated
}

// 🔥 STEP 5: other alerts
let userId = localStorage.getItem("userId");
let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

checkAlerts(updatedTransactions, budget);

}


// ==========================
// LOAD EXPENSES
// ==========================
async function loadExpenses(){

await renderTable();
await updateSummary();

}


// ==========================
// UPDATE SUMMARY (FINAL FIXED)
// ==========================
async function updateSummary(){

let transactions = await fetchExpenses();
transactions = filterCurrentMonth(transactions);

let userId = localStorage.getItem("userId");
let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

let carryData = getPreviousMonthData(userId);

let summary = calculateSummary(transactions, budget, carryData);

document.getElementById("totalIncome").textContent = "₹" + summary.income;
document.getElementById("totalBudget").textContent = "₹" + summary.totalBudget;
document.getElementById("totalSpent").textContent = "₹" + summary.expense;
document.getElementById("savings").textContent = "₹" + summary.savings;
document.getElementById("remaining").textContent = "₹" + summary.remaining;

saveCurrentMonthData(userId, summary);
}


// ==========================
// SAVE MONTH DATA
// ==========================
function saveCurrentMonthData(userId, summary){

  const key = `monthlyData_${userId}_${getMonthKey()}`;

  const data = {
    carryRemaining: summary.remaining,
    carrySavings: summary.savings
  };

  localStorage.setItem(key, JSON.stringify(data));
}


// ==========================
// CLEAR FORM
// ==========================
function clearInputs(){

document.getElementById("date").value="";
document.getElementById("category").value="";
document.getElementById("description").value="";
document.getElementById("amount").value="";

}


// ==========================
// PDF REPORT (FIXED)
// ==========================
async function downloadReport() {
  try {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    const name = localStorage.getItem("userName") || "User";

    // ==========================
    // DATA
    // ==========================
    let transactions = await fetchExpenses();
    transactions = filterCurrentMonth(transactions);

    let userId = localStorage.getItem("userId");
    let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

    let carryData = getPreviousMonthData(userId);
    let summary = calculateSummary(transactions, budget, carryData);

    // ==========================
    // LOAD LOGO (SAFE)
    // ==========================
    let logo = null;
    try {
      const img = new Image();
      img.src = "images/transparent_logo.png";
      await new Promise((res) => {
        img.onload = res;
        img.onerror = res;
      });
      logo = img;
    } catch {}

    // ==========================
    // HEADER
    // ==========================
    function addHeader() {
      if (logo) {
        doc.addImage(logo, "PNG", 20, 10, 20, 20);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CASH COMPASS", 45, 18);

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Monthly Expense Report", 45, 24);

      doc.setFontSize(9);
      doc.text(
        "Generated: " + new Date().toLocaleDateString(),
        pageWidth - 20,
        18,
        { align: "right" }
      );

      doc.line(20, 32, pageWidth - 20, 32);
    }

    // ==========================
    // FOOTER
    // ==========================
    function addFooter(pageNumber) {
      doc.line(20, pageHeight - 18, pageWidth - 20, pageHeight - 18);

      doc.setFontSize(9);
      doc.text(`Page ${pageNumber}`, pageWidth - 20, pageHeight - 10, { align: "right" });

      doc.text(
        "CASH COMPASS - A SMART EXPENSE TRACKER",
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // ==========================
    // FIRST PAGE
    // ==========================
    addHeader();

    doc.setFontSize(11);
    doc.text("User: " + name, 20, 42);

    // SUMMARY
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 20, 55);

    doc.setFont("helvetica", "normal");
    doc.text(`Monthly Budget: Rs ${budget}`, 20, 65);
    doc.text(`Total Income: Rs ${summary.income}`, 20, 73);
    doc.text(`Total Budget: Rs ${summary.totalBudget}`, 20, 81);

    // ==========================
    // TABLE DATA
    // ==========================
    const tableData = transactions.map(t => [
      t.date.split("T")[0],
      t.type,
      t.category,
      t.description,
      "Rs " + Number(t.amount).toFixed(2)
    ]);

    // ==========================
    // TABLE (MULTI-PAGE)
    // ==========================
    doc.autoTable({
      startY: 90,
      head: [["Date", "Type", "Category", "Description", "Amount"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9 },
      headStyles: { fillColor: [33, 150, 243] },
      margin: { top: 35, bottom: 25 },

      didDrawPage: function () {
        const pageNumber = doc.internal.getNumberOfPages();
        addHeader();
        addFooter(pageNumber);
      }
    });

    // ==========================
    // FINAL SUMMARY (SAFE)
    // ==========================
    let finalY = doc.lastAutoTable.finalY + 10;

    if (finalY > pageHeight - 30) {
      doc.addPage();
      addHeader();
      finalY = 50;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Final Summary", 20, finalY);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Expense: Rs ${summary.expense}`, 20, finalY + 10);
    doc.text(`Total Savings: Rs ${summary.savings}`, 20, finalY + 18);
    doc.text(`Remaining Balance: Rs ${summary.remaining}`, 20, finalY + 26);

    addFooter(doc.internal.getNumberOfPages());

    // ==========================
    // SAVE
    // ==========================
    doc.save("cash-compass-report.pdf");

  } catch (err) {
    console.error("PDF ERROR:", err);
    alert("Report generation failed.");
  }
}


// 🔥 CSV UPLOAD HANDLER
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fileInput = document.querySelector("#uploadForm input[type='file']");
    const userId = localStorage.getItem("userId");

    console.log("User ID:", userId); // 🔥 DEBUG

    if (!userId) {
        alert("User not logged in");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("userId", userId); // 🔥 THIS WAS MISSING

    try {
        const res = await fetch("/api/upload-statement", {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        alert(data.message);

        console.log("Upload response:", data);

        // OPTIONAL: refresh table after upload
        loadExpenses();

    } catch (err) {
        console.error(err);
        alert("Upload failed");
    }
});
function showToast(message, type="info") {
  const container = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}
function checkAlerts(transactions, budget) {

  transactions = filterCurrentMonth(transactions);

  let expenses = transactions.filter(t => t.type === "expense");
  let savingsList = transactions.filter(t => t.type === "savings");

  // =========================
  // TOTAL CALCULATIONS
  // =========================
  let totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  let totalSavings = savingsList.reduce((sum, t) => sum + t.amount, 0);

  // =========================
  // 1. CATEGORY > 40%
  // =========================
  let categoryTotals = {};

  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  for (let cat in categoryTotals) {
    if (categoryTotals[cat] > 0.4 * budget) {
      showToast(`⚠️ High spending on ${cat} (>40% of budget)`, "warning");
    }
  }

  // =========================
  // 2. FREQUENT SPENDING
  // =========================
  let today = new Date().toISOString().split("T")[0];
  let dailyCount = {};

  expenses.forEach(t => {
    let date = t.date.split("T")[0];
    if (date === today) {
      dailyCount[t.category] = (dailyCount[t.category] || 0) + 1;
    }
  });

  for (let cat in dailyCount) {
    if (dailyCount[cat] >= 4) {
      showToast(`⚠️ Frequent spending on ${cat} today`, "warning");
    }
  }

  // =========================
  // 3. 90% BUDGET USED
  // =========================
  if (totalExpense >= 0.9 * budget) {
    showToast("🚨 You have used 90% of your budget!", "danger");
  }

  // =========================
  // 🔥 NEW: 4. SAVINGS REDUCED
  // =========================
  if (lastSavings > totalSavings) {
    let diff = lastSavings - totalSavings;
    showToast(`⚠️ You used ₹${diff} from your savings`, "info");
  }

  // update tracker
  lastSavings = totalSavings;

    
}