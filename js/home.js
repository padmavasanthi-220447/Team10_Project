let weeklyChart;


// =========================
// PAGE LOAD + CHAT INIT
// =========================
document.addEventListener("DOMContentLoaded", async function(){

  // ✅ HANDLE GOOGLE OAUTH CALLBACK (Extract tokens from URL if present)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const userId = urlParams.get("userId");
  const userName = urlParams.get("name");

  if (token && userId) {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", userName || "User");
    
    // Clear URL parameters for security
    window.history.replaceState({}, document.title, window.location.pathname);
  }

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
  await loadGoals();
});


// =========================
// LOGOUT
// =========================
function confirmLogout(){
  let confirmAction = confirm("Are you sure you want to logout?");

  if(confirmAction){
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("token");
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
  const userId = String(localStorage.getItem("userId") || "").trim();
  if (!userId) return [];
  const res = await fetch(
    window.buildApiUrl("/api/expenses?userId=" + encodeURIComponent(userId))
  );
  if (!res.ok) return [];
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

  const summary = calculateSummaryHome(transactions, userId);

  document.getElementById("budgetCard").textContent = "₹" + monthlyBudget;
  document.getElementById("incomeCard").textContent = "₹" + summary.income;
  document.getElementById("expenseCard").textContent = "₹" + summary.expense;
  document.getElementById("savingsCard").textContent = "₹" + summary.savings;

  // 🔥 IMPORTANT: goals trigger
  handleSavingsChange(summary.savings);
}


// =========================
// UPDATE GRAPH
// =========================
function updateGraph(transactions){

  // =========================
  // GET CURRENT WEEK RANGE
  // =========================
  const today = new Date();

  const startOfWeek = new Date(today);
  const day = today.getDay(); // 0 = Sun, 1 = Mon
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  startOfWeek.setDate(today.getDate() + diff);
  startOfWeek.setHours(0,0,0,0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);

  // =========================
  // INIT ARRAYS
  // =========================
  let weeklyExpenses = [0,0,0,0,0,0,0];
  let weeklySavings = [0,0,0,0,0,0,0];

  let labels = [];

  // Create labels like 25 Mar, 26 Mar...
  for(let i=0; i<7; i++){
    let d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);

    labels.push(
      d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    );
  }

  // =========================
  // FILTER CURRENT WEEK DATA
  // =========================
  transactions.forEach(item=>{
    let d = new Date(item.date);

    if(d >= startOfWeek && d <= endOfWeek){

      let index = Math.floor((d - startOfWeek) / (1000 * 60 * 60 * 24));

      if(item.type === "expense") weeklyExpenses[index] += item.amount;
      if(item.type === "savings") weeklySavings[index] += item.amount;
    }
  });

  // =========================
  // RENDER GRAPH
  // =========================
  const ctx = document.getElementById("weeklyChart").getContext("2d");

  if(weeklyChart) weeklyChart.destroy();

  weeklyChart = new Chart(ctx,{
    type:"line",
    data:{
      labels: labels, // 🔥 NOW SHOWS DATES
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

    const res = await fetch(window.buildApiUrl("/api/chat"), {
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

// goals
let lastSavings = 0;

async function handleSavingsChange(currentSavings){

  if(currentSavings === lastSavings) return;

  console.log("Savings changed:", currentSavings);

  lastSavings = currentSavings;

  if(currentSavings > 0){
    await updateGoalsFromSavings(currentSavings);
  }
}
async function updateGoalsFromSavings(savings){

  const userId = localStorage.getItem("userId");

  await fetch(window.buildApiUrl("/api/goals/distribute"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId,
      savings
    })
  });

  // refresh goals UI
  loadGoals();
}
async function loadGoals() {
  const userId = localStorage.getItem("userId");

  const res = await fetch(window.buildApiUrl(`/api/goals/${userId}`));
  const goals = await res.json();

  const container = document.getElementById("goalList");
  container.innerHTML = "";

  goals.forEach(g => {
    const percent = Math.min((g.amountSaved / g.amount) * 100, 100);

    container.innerHTML += `
      <div class="goal-card">
        <h3>${g.name}</h3>

        <div class="goal-meta">
          🎯 ₹${g.amountSaved.toFixed(0)} / ₹${g.amount} <br>
          📅 ${new Date(g.deadline).toLocaleDateString()} <br>
          ⚡ Priority: ${g.priority}
        </div>

        <div class="progress">
          <div class="progress-bar" style="width:${percent}%"></div>
        </div>

        <div class="goal-actions">
          <button class="edit-btn" onclick="editGoal('${g._id}')">Edit</button>
          <button class="delete-btn" onclick="deleteGoal('${g._id}')">Delete</button>
        </div>
      </div>
    `;
  });
}
function showGoalForm() {
  const form = document.getElementById("goalForm");

  form.style.display = (form.style.display === "flex") ? "none" : "flex";
}
async function addGoal(){

  const userId = localStorage.getItem("userId");

  const data = {
    userId,
    name: document.getElementById("goalName").value,
    amount: Number(document.getElementById("goalAmount").value),
    deadline: document.getElementById("goalDeadline").value,
    priority: Number(document.getElementById("goalPriority").value)
  };

  if(!data.name || !data.amount || !data.deadline || !data.priority){
    alert("Please fill all fields");
    return;
  }

  await fetch(window.buildApiUrl("/api/goals/add"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  // reset form
  document.getElementById("goalForm").style.display = "none";

  // clear inputs
  document.getElementById("goalName").value = "";
  document.getElementById("goalAmount").value = "";
  document.getElementById("goalDeadline").value = "";
  document.getElementById("goalPriority").value = "";

  // reload goals
  loadGoals();
}
async function deleteGoal(id){
  await fetch(window.buildApiUrl(`/api/goals/${id}`), {
    method: "DELETE"
  });

  loadGoals();
}
async function editGoal(id){

  const name = prompt("New name:");
  const amount = prompt("New amount:");
  const priority = prompt("New priority:");

  await fetch(window.buildApiUrl(`/api/goals/${id}`), {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name,
      amount,
      priority
    })
  });

  loadGoals();
}
lastSavings = Number(localStorage.getItem("lastSavings")) || 0;

async function handleSavingsChange(currentSavings){

  if(currentSavings === lastSavings) return;

  console.log("Savings changed:", currentSavings);

  lastSavings = currentSavings;
  localStorage.setItem("lastSavings", currentSavings);

  if(currentSavings > 0){
    await updateGoalsFromSavings(currentSavings);
  }
}
function calculateSummaryHome(transactions, userId){

  // filter current month
  const now = new Date();

  transactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear();
  });

  let income = 0;
  let expense = 0;
  let savings = 0;

  transactions.forEach(t=>{
    const type = t.type.toLowerCase();

    if(type === "income") income += Number(t.amount);
    if(type === "expense") expense += Number(t.amount);
    if(type === "savings") savings += Number(t.amount);
  });

  // 🔥 carry savings (same as add-expense)
  const prev = new Date();
  prev.setMonth(prev.getMonth() - 1);

  const key = `monthlyData_${userId}_${prev.getFullYear()}_${prev.getMonth() + 1}`;

  const carryData = JSON.parse(localStorage.getItem(key)) || {
    carryRemaining: 0,
    carrySavings: 0
  };

  let totalSavings = savings + carryData.carrySavings;

  return {
    income,
    expense,
    savings: totalSavings
  };
}