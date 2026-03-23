const API_URL = "http://localhost:5000/api/expenses";


// ==========================
// PAGE LOAD
// ==========================
document.addEventListener("DOMContentLoaded", async function(){

if(!localStorage.getItem("userId")){
window.location.href="login.html";
return;
}

loadBudget();
await loadExpenses();

});


// ==========================
// SAVE BUDGET
// ==========================
function saveBudget(){

let budget = parseFloat(document.getElementById("budgetInput").value);

if(!budget || budget < 0){
alert("Enter valid budget");
return;
}

let userId = localStorage.getItem("userId");

localStorage.setItem(`monthlyBudget_${userId}`, budget);

loadBudget();
updateSummary();

}


// ==========================
// LOAD BUDGET
// ==========================
function loadBudget(){

let userId = localStorage.getItem("userId");

let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

document.getElementById("monthlyBudget").textContent = "₹" + budget;

}


// ==========================
// FETCH EXPENSES
// ==========================
async function fetchExpenses(){

let userId = localStorage.getItem("userId");

const res = await fetch(`${API_URL}?userId=${userId}`);
return await res.json();

}


// ==========================
// CALCULATION FUNCTION (FIXED)
// ==========================
function calculateSummary(transactions, budget){

let income = transactions
  .filter(t => t.type === "income")
  .reduce((sum, t) => sum + Number(t.amount), 0);

let expense = transactions
  .filter(t => t.type === "expense")
  .reduce((sum, t) => sum + Number(t.amount), 0);

let savings = transactions
  .filter(t => t.type === "savings")
  .reduce((sum, t) => sum + Number(t.amount), 0);

let totalBudget = budget + income;
let remaining = totalBudget - (expense + savings);

return { income, expense, savings, totalBudget, remaining };

}


// ==========================
// ADD EXPENSE (FIXED)
// ==========================
async function addExpense(){

let userId = localStorage.getItem("userId");

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

let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

let summary = calculateSummary(transactions, budget);

// ✅ FIXED VALIDATION
if((type === "expense" || type === "savings") && amount > summary.remaining){
    alert("Not enough balance!");
    return;
}


// SAVE
await fetch(`${API_URL}/add`,{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({ userId, date, type, category, description, amount })
});

await loadExpenses();
clearInputs();

}


// ==========================
// RENDER TABLE
// ==========================
async function renderTable(){

let table = document.getElementById("expenseTable");
table.innerHTML = "";

let transactions = await fetchExpenses();

transactions.forEach((item,index)=>{

let row = table.insertRow();

row.innerHTML = `
<td>${item.date.split("T")[0]}</td>
<td class="${item.type}">${item.type}</td>
<td>${item.category}</td>
<td>${item.description}</td>
<td>₹${item.amount}</td>
<td>
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

document.getElementById("date").value = item.date.split("T")[0];
document.getElementById("type").value = item.type;
document.getElementById("category").value = item.category;
document.getElementById("description").value = item.description;
document.getElementById("amount").value = item.amount;

await fetch(`${API_URL}/${item._id}`,{ method:"DELETE" });

await loadExpenses();

}


// ==========================
// DELETE
// ==========================
async function deleteExpense(id){

if(!confirm("Delete this transaction?")) return;

await fetch(`${API_URL}/${id}`,{ method:"DELETE" });

await loadExpenses();

}


// ==========================
// LOAD EXPENSES
// ==========================
async function loadExpenses(){

await renderTable();
await updateSummary();

}


// ==========================
// UPDATE SUMMARY (FIXED)
// ==========================
async function updateSummary(){

let transactions = await fetchExpenses();

let userId = localStorage.getItem("userId");
let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

let summary = calculateSummary(transactions, budget);

document.getElementById("totalIncome").textContent = "₹" + summary.income;
document.getElementById("totalBudget").textContent = "₹" + summary.totalBudget;
document.getElementById("totalSpent").textContent = "₹" + summary.expense;
document.getElementById("savings").textContent = "₹" + summary.savings;
document.getElementById("remaining").textContent = "₹" + summary.remaining;

}


// ==========================
// PDF REPORT (FIXED)
// ==========================
async function downloadReport(){

const { jsPDF } = window.jspdf;
const doc = new jsPDF();

const name = localStorage.getItem("userName") || "User";
const transactions = await fetchExpenses();

let userId = localStorage.getItem("userId");
let budget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

let summary = calculateSummary(transactions, budget);

// TITLE
doc.setFontSize(18);
doc.text("CASH COMPASS - Monthly Expense Report",20,20);

doc.setFontSize(10);
doc.text("Generated on: " + new Date().toLocaleDateString(),150,26);

doc.setFontSize(12);
doc.text("User: " + name,20,35);

// SUMMARY
doc.text("Monthly Budget: Rs " + budget,20,50);
doc.text("Total Income: Rs " + summary.income,20,58);
doc.text("Total Budget: Rs " + summary.totalBudget,20,66);

// TABLE
const tableData = transactions.map(t => [
t.date.split("T")[0],
t.type,
t.category,
t.description,
"Rs " + t.amount
]);

doc.autoTable({
startY:80,
head:[["Date","Type","Category","Description","Amount"]],
body:tableData,
theme:"grid",
headStyles:{ fillColor:[21,101,192] },
styles:{ fontSize:10 }
});

// TOTALS
let finalY = doc.lastAutoTable.finalY + 15;

doc.text("Total Expense: Rs " + summary.expense,20,finalY);
doc.text("Total Savings: Rs " + summary.savings,20,finalY+8);
doc.text("Remaining Balance: Rs " + summary.remaining,20,finalY+16);

// FOOTER
let pageHeight = doc.internal.pageSize.height;

doc.line(20, pageHeight - 20, 190, pageHeight - 20);

doc.text("CASH COMPASS - A SMART EXPENSE TRACKER",105,pageHeight - 12,{ align:"center" });

doc.save("cash-compass-report.pdf");

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