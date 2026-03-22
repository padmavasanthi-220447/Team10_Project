const transactions = JSON.parse(localStorage.getItem("expenses")) || [];
const salary = parseFloat(localStorage.getItem("monthlyBudget")) || 0;

let monthlyIncome = Array(12).fill(0);
let monthlyExpenses = Array(12).fill(0);
let monthlySavings = Array(12).fill(0);
let monthlyBudget = Array(12).fill(0);

let categoryTotals = {};
let weeklyExpenses = [0,0,0,0,0];

transactions.forEach(t => {

const date = new Date(t.date);
const month = date.getMonth();
const day = date.getDate();
const amount = Number(t.amount);

// income
if(t.type === "income"){
monthlyIncome[month] += amount;
}

// expense
if(t.type === "expense"){

monthlyExpenses[month] += amount;

categoryTotals[t.category] =
(categoryTotals[t.category] || 0) + amount;

const week = Math.floor((day-1)/7);
weeklyExpenses[week] += amount;

}

// savings
if(t.type === "savings"){
monthlySavings[month] += amount;
}

});

// calculate total budget only if activity exists
for(let i=0;i<12;i++){

if(monthlyIncome[i] > 0 || monthlyExpenses[i] > 0 || monthlySavings[i] > 0){

monthlyBudget[i] = salary + monthlyIncome[i];

}else{

monthlyBudget[i] = 0;

}

}

// charts
createMonthlyChart();
createPieChart();
createWeeklyChart();
createCategoryChart();

function createMonthlyChart(){

new Chart(document.getElementById("monthlyChart"),{

type:"bar",

data:{

labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],

datasets:[

{
label:"Total Budget",
data:monthlyBudget,
backgroundColor:"#42a5f5"
},

{
label:"Expenses",
data:monthlyExpenses,
backgroundColor:"#ef5350"
},

{
label:"Savings",
data:monthlySavings,
backgroundColor:"#66bb6a"
}

]

},

options:{responsive:true}

});

}

function createPieChart(){

const categories = Object.keys(categoryTotals);
const values = Object.values(categoryTotals);

new Chart(document.getElementById("pieChart"),{

type:"doughnut",

data:{
labels:categories,
datasets:[{
data:values,
backgroundColor:[
"#ef5350",
"#26a69a",
"#42a5f5",
"#ffa726",
"#ab47bc"
]
}]
},

options:{responsive:true}

});

}

function createWeeklyChart(){

new Chart(document.getElementById("weeklyChart"),{

type:"bar",

data:{

labels:["Week 1","Week 2","Week 3","Week 4","Week 5"],

datasets:[{

label:"Weekly Expenses",

data:weeklyExpenses,

backgroundColor:"#ef5350"

}]

},

options:{responsive:true}

});

}

function createCategoryChart(){

const categories = Object.keys(categoryTotals);
const values = Object.values(categoryTotals);

new Chart(document.getElementById("categoryChart"),{

type:"bar",

data:{

labels:categories,

datasets:[{

label:"Category Expense",

data:values,

backgroundColor:"#26a69a"

}]

},

options:{responsive:true}

});

}