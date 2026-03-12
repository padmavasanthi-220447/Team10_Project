let username = "Vikram";

document.getElementById("username").textContent = username;
function confirmLogout(){

let confirmAction = confirm("Are you sure you want to logout?");

if(confirmAction){
return true;   // allow redirect to login page
}else{
return false;  // stop redirect
}

}
document.addEventListener("DOMContentLoaded", function(){

updateDashboard();
loadWeeklyGraph();

});

function updateDashboard(){

let transactions = JSON.parse(localStorage.getItem("expenses")) || [];

let monthlyBudget = parseFloat(localStorage.getItem("monthlyBudget")) || 0;

let totalIncome = 0;
let totalExpense = 0;
let totalSavings = 0;

transactions.forEach(item => {

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



// UPDATE CARDS

document.getElementById("budgetCard").textContent = "₹" + monthlyBudget;

document.getElementById("expenseCard").textContent = "₹" + totalExpense;

document.getElementById("savingsCard").textContent = "₹" + totalSavings;

}

function loadWeeklyGraph(){

let transactions = JSON.parse(localStorage.getItem("expenses")) || [];

let weeklyExpenses = [0,0,0,0,0,0,0];
let weeklySavings = [0,0,0,0,0,0,0];

transactions.forEach(item=>{

let date = new Date(item.date);

let day = date.getDay();

let index = (day + 6) % 7; // Monday start

if(item.type === "expense"){

weeklyExpenses[index] += item.amount;

}

if(item.type === "savings"){

weeklySavings[index] += item.amount;

}

});

const ctx = document.getElementById("weeklyChart");

new Chart(ctx,{
type:"line",
data:{
labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
datasets:[

{
label:"Expenses",
data:weeklyExpenses,
borderColor:"#e53935",
backgroundColor:"rgba(229,57,53,0.2)",
fill:true,
tension:0.3
},

{
label:"Savings",
data:weeklySavings,
borderColor:"#2e7d32",
backgroundColor:"rgba(46,125,50,0.2)",
fill:true,
tension:0.3
}

]
},
options:{
responsive:true,
plugins:{
legend:{
display:true
}
},
scales:{
y:{
beginAtZero:true
}
}
}
});

}