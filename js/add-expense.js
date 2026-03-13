// RUN WHEN PAGE LOADS
document.addEventListener("DOMContentLoaded", function(){

loadBudget();
loadExpenses();

});


// SAVE MONTHLY BUDGET

function saveBudget(){

let budget = document.getElementById("budgetInput").value;

if(!budget){
alert("Enter monthly budget");
return;
}

localStorage.setItem("monthlyBudget", budget);

loadBudget();
updateSummary();

}


// LOAD BUDGET CARD

function loadBudget(){

let budget = parseFloat(localStorage.getItem("monthlyBudget")) || 0;

document.getElementById("monthlyBudget").textContent = "₹" + budget;

}


// ADD TRANSACTION

function addExpense(){

let date = document.getElementById("date").value;
let type = document.getElementById("type").value;
let category = document.getElementById("category").value;
let description = document.getElementById("description").value;
let amount = parseFloat(document.getElementById("amount").value);

if(!date || !category || !amount){
alert("Fill all required fields");
return;
}

let transactions = JSON.parse(localStorage.getItem("expenses")) || [];

let totalIncome = 0;
let totalExpense = 0;
let totalSavings = 0;

transactions.forEach(item=>{

if(item.type === "income"){
totalIncome += item.amount;
}

else if(item.type === "savings"){
totalSavings += item.amount;
}

else{
totalExpense += item.amount;
}

});

let monthlyBudget = parseFloat(localStorage.getItem("monthlyBudget")) || 0;

let totalBudget = monthlyBudget + totalIncome;

let remainingBalance = totalBudget - (totalExpense + totalSavings);


// EXPENSE LIMIT CHECK

if(type === "expense" && amount > remainingBalance){

alert("Expense exceeds available balance!");
return;

}


// SAVINGS LIMIT CHECK

if(type === "savings" && amount > remainingBalance){

alert("Not enough balance for savings!");
return;

}


// SAVE TRANSACTION

let transaction = {
date,
type,
category,
description,
amount
};

transactions.push(transaction);

localStorage.setItem("expenses", JSON.stringify(transactions));

renderTable();
updateSummary();
clearInputs();

}


// DISPLAY TABLE

function renderTable(){

let table = document.getElementById("expenseTable");

table.innerHTML = "";

let transactions = JSON.parse(localStorage.getItem("expenses")) || [];

transactions.forEach((item,index)=>{

let row = table.insertRow();

row.innerHTML = `
<td>${item.date}</td>
<td class="${item.type}">${item.type}</td>
<td>${item.category}</td>
<td>${item.description}</td>
<td>₹${item.amount}</td>
<td>
<button onclick="editExpense(${index})">Edit</button>
<button onclick="deleteExpense(${index})">Delete</button>
</td>
`;

});

}


// EDIT TRANSACTION

function editExpense(index){

let transactions = JSON.parse(localStorage.getItem("expenses"));

let item = transactions[index];

document.getElementById("date").value = item.date;
document.getElementById("type").value = item.type;
document.getElementById("category").value = item.category;
document.getElementById("description").value = item.description;
document.getElementById("amount").value = item.amount;

transactions.splice(index,1);

localStorage.setItem("expenses", JSON.stringify(transactions));

renderTable();
updateSummary();

}


// DELETE TRANSACTION

function deleteExpense(index){

let confirmDelete = confirm("Delete this transaction?");

if(!confirmDelete) return;

let transactions = JSON.parse(localStorage.getItem("expenses"));

transactions.splice(index,1);

localStorage.setItem("expenses", JSON.stringify(transactions));

renderTable();
updateSummary();

}


// LOAD EXPENSES

function loadExpenses(){

renderTable();
updateSummary();

}


// UPDATE SUMMARY CARDS

function updateSummary(){

let transactions = JSON.parse(localStorage.getItem("expenses")) || [];

let totalIncome = 0;
let totalExpense = 0;
let totalSavings = 0;

transactions.forEach(item=>{

if(item.type === "income"){
totalIncome += item.amount;
}

else if(item.type === "savings"){
totalSavings += item.amount;
}

else{
totalExpense += item.amount;
}

});

let monthlyBudget = parseFloat(localStorage.getItem("monthlyBudget")) || 0;

let totalBudget = monthlyBudget + totalIncome;

let remaining = totalBudget - (totalExpense + totalSavings);


document.getElementById("totalIncome").textContent = "₹" + totalIncome;

document.getElementById("totalBudget").textContent = "₹" + totalBudget;

document.getElementById("totalSpent").textContent = "₹" + totalExpense;

document.getElementById("savings").textContent = "₹" + totalSavings;

document.getElementById("remaining").textContent = "₹" + remaining;

}


// CLEAR FORM

function clearInputs(){

document.getElementById("date").value="";
document.getElementById("category").value="";
document.getElementById("description").value="";
document.getElementById("amount").value="";

}