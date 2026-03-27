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

// ✅ HANDLE GOOGLE OAUTH CALLBACK (Extract tokens from URL)
window.addEventListener("DOMContentLoaded", () => {
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
    
    // Redirect to home
    window.location.href = "home.html";
  }
});

// REGISTER USER
document.getElementById("register-form").addEventListener("submit", async function(e){
  e.preventDefault();
  const name = this.elements["name"].value;
  const email = this.elements["email"].value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if(password !== confirmPassword){
    alert("Passwords do not match!");
    return;
  }

  try{
    const res = await fetch(window.buildApiUrl("/api/auth/register"),{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    alert(data.message);
    if(data.message === "User registered successfully") showLogin();
  }catch(err){
    console.error(err);
    alert("Registration failed");
  }
});

// LOGIN USER
document.getElementById("login-form").addEventListener("submit", async function(e){
  e.preventDefault();
  const email = this.elements["email"].value;
  const password = this.elements["password"].value;

  try{
    const res = await fetch(window.buildApiUrl("/api/auth/login"),{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(data.user){
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userId", data.user.id || data.user._id);
      if (data.token) localStorage.setItem("token", data.token);
      window.location.href = "home.html";
    }else{
      alert(data.message);
    }
  }catch(err){
    console.error(err);
    alert("Login failed");
  }
});

// ✅ GOOGLE LOGIN BUTTON HANDLER
const googleBtn = document.getElementById("google-login-btn");
if (googleBtn) {
  googleBtn.addEventListener("click", function() {
    window.location.href = window.buildApiUrl("/api/auth/google");
  });
}