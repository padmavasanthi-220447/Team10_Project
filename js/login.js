// quotes array
const quotes = [
"Track your money, control your future.",
"Financial discipline begins with awareness.",
"Small savings today create big wealth tomorrow.",
"Understand your expenses to master your finances.",
"Every rupee you track is a step toward financial freedom.",
"Spend wisely, save consistently, live freely."
];

// select quote element
const quoteElement = document.getElementById("quote");

// pick random quote
const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

// display quote
quoteElement.textContent = randomQuote;



// toggle forms
function showRegister(){
document.getElementById("login-form").style.display="none";
document.getElementById("register-form").style.display="flex";
}

function showLogin(){
document.getElementById("register-form").style.display="none";
document.getElementById("login-form").style.display="flex";
}

// REGISTER PASSWORD CHECK

document.getElementById("register-form").addEventListener("submit", function(e){

const password = document.getElementById("password").value;
const confirmPassword = document.getElementById("confirm-password").value;

if(password !== confirmPassword){
e.preventDefault();
alert("Passwords do not match!");
}

});