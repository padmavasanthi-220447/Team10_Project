// ==========================
// API BASE URL
// ==========================
const API_BASE = "/api";

// ==========================
// QUOTES
// ==========================
const quotes = [
"Track your money, control your future.",
"Financial discipline begins with awareness.",
"Small savings today create big wealth tomorrow.",
"Understand your expenses to master your finances.",
"Every rupee you track is a step toward financial freedom.",
"Spend wisely, save consistently, live freely."
];

const quoteElement = document.getElementById("quote");
quoteElement.textContent = quotes[Math.floor(Math.random() * quotes.length)];


// ==========================
// ADMIN LOGIN
// ==========================
document.getElementById("login-form").addEventListener("submit", async function (e) {

e.preventDefault();

const email = this.email.value;
const password = this.password.value;

try {

const response = await fetch(`${API_BASE}/admin/login`, {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ email, password })
});

const data = await response.json();

if (response.ok) {

localStorage.setItem("adminToken", data.token);

alert("Admin Login Successful");

window.location.href = "admin.html";

} else {

alert(data.message || "Invalid admin credentials");

}

} catch (error) {

console.error(error);
alert("Server error");

}

});