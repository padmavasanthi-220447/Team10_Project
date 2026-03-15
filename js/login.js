// =======================
// LOGIN & REGISTER FRONTEND
// =======================

// toggle forms
function showRegister() {
  document.getElementById("login-form").style.display = "none";
  document.getElementById("register-form").style.display = "flex";
}
function showLogin() {
  document.getElementById("register-form").style.display = "none";
  document.getElementById("login-form").style.display = "flex";
}

// ===== QUOTES =====
const quotes = [
  "Track your money, control your future.",
  "Financial discipline begins with awareness.",
  "Small savings today create big wealth tomorrow.",
  "Understand your expenses to master your finances.",
  "Every rupee you track is a step toward financial freedom.",
  "Spend wisely, save consistently, live freely.",
];
document.getElementById("quote").textContent =
  quotes[Math.floor(Math.random() * quotes.length)];

// ===== REGISTER =====
document
  .getElementById("register-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = this.name.value;
    const email = this.email.value;
    const password = this.password.value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      alert(data.message);
      if (res.ok) showLogin();
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  });

// ===== LOGIN =====
document
  .getElementById("login-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = this.email.value;
    const password = this.password.value;

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("Login Response:", data); // debug

      if (data.token) {
        // store token
        localStorage.setItem("token", data.token);
        alert("Login successful");
        window.location.href = "home.html";
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  });
