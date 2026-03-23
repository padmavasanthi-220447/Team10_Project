const API_URL = "http://localhost:5000/api/expenses";

let weeklyChart;


// =========================
// PAGE LOAD + CHAT INIT
// =========================
document.addEventListener("DOMContentLoaded", async function(){

  // USERNAME
  document.getElementById("username").textContent =
  localStorage.getItem("userName") || "User";

  // AUTH CHECK
  if(!localStorage.getItem("userId")){
    window.location.href = "login.html";
    return;
  }

  // LOAD DASHBOARD
  await loadDashboard();

  // CHAT TOGGLE INIT
  const chatToggle = document.getElementById("chat-toggle");
  const chatContainer = document.getElementById("chat-container");

  if(chatToggle){
    chatToggle.addEventListener("click", () => {
      chatContainer.style.display = "flex";

      const messagesDiv = document.getElementById("chat-messages");

      if(messagesDiv.innerHTML.trim() === ""){
        messagesDiv.innerHTML += `
        <div class="bot-msg">
        Hi 👋 I’m your Smart Advisor<br><br>
        Ask me anything about your finances 💡
        </div>
        `;
      }
    });
  }

  // ENTER KEY SUPPORT
  document.getElementById("chat-input").addEventListener("keydown", function(e){
    if(e.key === "Enter"){
      sendChat();
    }
  });

});


// =========================
// LOGOUT
// =========================
function confirmLogout(){
  let confirmAction = confirm("Are you sure you want to logout?");

  if(confirmAction){
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "login.html";
  }else{
    return false;
  }
}


// =========================
// LISTEN FOR EXPENSE UPDATE
// =========================
window.addEventListener("storage", async function(event){
  if(event.key === "expenseUpdated"){
    await loadDashboard();
  }
});


// =========================
// FETCH EXPENSES
// =========================
async function fetchExpenses(){
  let userId = localStorage.getItem("userId");
  const res = await fetch(`${API_URL}?userId=${userId}`);
  return await res.json();
}


// =========================
// LOAD DASHBOARD
// =========================
async function loadDashboard(){
  const transactions = await fetchExpenses();
  updateCards(transactions);
  updateGraph(transactions);
}


// =========================
// UPDATE CARDS
// =========================
function updateCards(transactions){

  let userId = localStorage.getItem("userId");

  let monthlyBudget = parseFloat(localStorage.getItem(`monthlyBudget_${userId}`)) || 0;

  let totalExpense = 0;
  let totalSavings = 0;

  transactions.forEach(item=>{
    if(item.type === "expense") totalExpense += item.amount;
    if(item.type === "savings") totalSavings += item.amount;
  });

  document.getElementById("budgetCard").textContent = "₹" + monthlyBudget;
  document.getElementById("expenseCard").textContent = "₹" + totalExpense;
  document.getElementById("savingsCard").textContent = "₹" + totalSavings;
}


// =========================
// UPDATE GRAPH
// =========================
function updateGraph(transactions){

  let weeklyExpenses = [0,0,0,0,0,0,0];
  let weeklySavings = [0,0,0,0,0,0,0];

  transactions.forEach(item=>{
    let date = new Date(item.date);
    let day = date.getDay();
    let index = (day + 6) % 7;

    if(item.type === "expense") weeklyExpenses[index] += item.amount;
    if(item.type === "savings") weeklySavings[index] += item.amount;
  });

  const ctx = document.getElementById("weeklyChart").getContext("2d");

  if(weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx,{
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
      plugins:{ legend:{ display:true } },
      scales:{ y:{ beginAtZero:true } }
    }
  });

}


// =========================
// CHATBOT FUNCTIONS
// =========================

// CLOSE CHAT
function toggleChat(){
  document.getElementById("chat-container").style.display = "none";
}


// QUICK SUGGESTION BUTTONS
function quickAsk(text){
  document.getElementById("chat-input").value = text;
  sendChat();
}


// =========================
// SEND MESSAGE (ONLY CHANGE HERE)
// =========================
async function sendChat(){

  const input = document.getElementById("chat-input");
  const message = input.value.trim();

  if(!message) return;

  const messagesDiv = document.getElementById("chat-messages");
  const typing = document.getElementById("typing");

  messagesDiv.innerHTML += `<div class="user-msg">${message}</div>`;
  input.value = "";

  messagesDiv.scrollTop = messagesDiv.scrollHeight;

  typing.style.display = "block";

  try{
    const transactions = await fetchExpenses();

    // ✅ ADD THIS (NEW)
    const userId = localStorage.getItem("userId");
    const monthlyBudget = localStorage.getItem(`monthlyBudget_${userId}`) || 0;

    const res = await fetch("http://localhost:5000/api/chat", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        message,
        transactions,
        monthlyBudget   // ✅ FIX
      })
    });

    const data = await res.json();

    typing.style.display = "none";

    messagesDiv.innerHTML += `<div class="bot-msg">${data.reply}</div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  }catch(err){
    typing.style.display = "none";
    messagesDiv.innerHTML += `<div class="bot-msg">⚠️ Error connecting to AI</div>`;
  }
}