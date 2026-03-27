(function () {
  const dummyApiOrigin = getDummyApiOrigin();
  const dummyApi = function (path) {
    return dummyApiOrigin.replace(/\/+$/, "") + path;
  };

  let mainTrackerImportUrl = "http://localhost:5000/import-transactions";

  const LOGIN_USER_ID_KEY = "dummyFinanceUserId";
  const LOGIN_EMAIL_KEY = "dummyFinanceEmail";
  const LOGIN_PHONE_KEY = "dummyFinancePhone";
  const LAST_SYNC_SIG_KEY = "dummyFinanceLastSyncSig";

  function getDummyApiOrigin() {
    // When served over http/https, we can reuse the current origin.
    // When opened via file://, fall back to the expected dummy server port.
    if (window.location && (window.location.protocol === "http:" || window.location.protocol === "https:")) {
      return window.location.origin;
    }
    return "http://localhost:5001";
  }

  function $(id) {
    return document.getElementById(id);
  }

  function setMessage(el, text, type) {
    if (!el) return;
    el.textContent = text || "";
    el.className = "message" + (type ? " " + type : "");
  }

  function setSpinner(spinnerEl, isLoading) {
    if (!spinnerEl) return;
    spinnerEl.classList.toggle("show", !!isLoading);
  }

  function disableButton(btn, isDisabled) {
    if (!btn) return;
    btn.disabled = !!isDisabled;
    btn.style.opacity = isDisabled ? "0.7" : "1";
    btn.style.cursor = isDisabled ? "not-allowed" : "pointer";
  }

  function formatHumanDate(dateStrOrDate) {
    const d = new Date(dateStrOrDate);
    if (Number.isNaN(d.getTime())) return String(dateStrOrDate || "");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  function computeSyncSignature(transactions) {
    // Simple signature to avoid importing the exact same batch repeatedly.
    return (transactions || [])
      .map((t) => `${t.date}|${t.type}|${t.category}|${t.description}|${t.amount}`)
      .join("~");
  }

  async function httpJson(url, options) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error((data && data.message) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function loadTransactions(userId) {
    const tbody = $("txTbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="color:#6b7280; font-weight:600; padding:16px;">Loading...</td></tr>`;

    const txs = await httpJson(dummyApi(`/api/transactions/${encodeURIComponent(userId)}`), {
      method: "GET",
    });

    if (!Array.isArray(txs) || txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="color:#6b7280; font-weight:600; padding:16px;">No transactions yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = txs
      .map((tx) => {
        const amount = Number(tx.amount);
        const amountText = Number.isFinite(amount) ? amount.toFixed(2) : String(tx.amount ?? "");
        const typeTagClass = tx.type === "income" ? "" : "expense";
        return `
          <tr>
            <td>${formatHumanDate(tx.date)}</td>
            <td><span class="tag ${typeTagClass}">${tx.type}</span></td>
            <td>${escapeHtml(tx.category)}</td>
            <td>${escapeHtml(tx.description)}</td>
            <td>${amountText}</td>
          </tr>
        `;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function initLoginPage() {
    const loginForm = $("loginForm");
    if (!loginForm) return false;

    const messageEl = $("loginMessage");
    const spinnerEl = $("loginSpinner");
    const btn = loginForm.querySelector("button[type='submit']");

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = $("email").value;
      const phone = $("phone").value;

      setMessage(messageEl, "", "");
      disableButton(btn, true);
      setSpinner(spinnerEl, true);

      try {
        const data = await httpJson(dummyApi("/api/auth/login"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, phone }),
        });

        localStorage.setItem(LOGIN_USER_ID_KEY, data.userId);
        localStorage.setItem(LOGIN_EMAIL_KEY, data.email || email);
        localStorage.setItem(LOGIN_PHONE_KEY, data.phone || phone);

        window.location.href = "dashboard.html";
      } catch (err) {
        setMessage(messageEl, err.message || "Login failed", "error");
      } finally {
        disableButton(btn, false);
        setSpinner(spinnerEl, false);
      }
    });

    return true;
  }

  function initDashboardPage() {
    const paymentForm = $("paymentForm");
    const syncBtn = $("syncBtn");
    const logoutBtn = $("logoutBtn");
    const messageEl = $("dashboardMessage");

    if (!paymentForm || !syncBtn) return false;

    const userId = localStorage.getItem(LOGIN_USER_ID_KEY);
    const email = localStorage.getItem(LOGIN_EMAIL_KEY);
    const phone = localStorage.getItem(LOGIN_PHONE_KEY);

    if (!userId) {
      setMessage(messageEl, "Please login first.", "error");
      window.location.href = "login.html";
      return true;
    }

    const userDetailsEl = $("userDetails");
    if (userDetailsEl) {
      userDetailsEl.textContent = `User ID: ${userId} | Email: ${email || "-"} | Phone: ${phone || "-"}`;
    }

    // Initial load.
    loadTransactions(userId).catch((e) => setMessage(messageEl, e.message || "Failed to load transactions", "error"));

    // Logout (client-side only).
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem(LOGIN_USER_ID_KEY);
        localStorage.removeItem(LOGIN_EMAIL_KEY);
        localStorage.removeItem(LOGIN_PHONE_KEY);
        localStorage.removeItem(LAST_SYNC_SIG_KEY);
        window.location.href = "login.html";
      });
    }

    // Add dummy payment.
    const paySpinner = $("paySpinner");
    const payBtn = paymentForm.querySelector("button[type='submit']");

    paymentForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      setMessage(messageEl, "", "");
      disableButton(payBtn, true);
      setSpinner(paySpinner, true);

      const amount = $("amount").value;
      const category = $("category").value;
      const description = $("description").value;

      try {
        await httpJson(dummyApi("/api/transactions/add"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: userId,
            amount: Number(amount),
            category: category,
            description: description,
          }),
        });

        setMessage(messageEl, "Transaction saved in Dummy Finance.", "success");
        await loadTransactions(userId);
        paymentForm.reset();
      } catch (err) {
        // Include duplicate feedback.
        setMessage(messageEl, err.message || "Failed to add transaction", err.status === 409 ? "error" : "error");
      } finally {
        disableButton(payBtn, false);
        setSpinner(paySpinner, false);
      }
    });

    // Sync with main expense tracker.
    const syncSpinner = $("syncSpinner");

    syncBtn.addEventListener("click", async () => {
      setMessage(messageEl, "", "");

      disableButton(syncBtn, true);
      setSpinner(syncSpinner, true);
      syncBtn.style.display = "inline-flex";

      try {
        const emailNorm = String(email || "").trim().toLowerCase();
        if (!emailNorm) {
          throw new Error(
            "Missing email for sync. Please login again on the Dummy Finance provider."
          );
        }

        const exported = await httpJson(dummyApi(`/api/transactions/export/${encodeURIComponent(userId)}`), {
          method: "GET",
        });

        const signature = `${emailNorm}|${computeSyncSignature(exported)}`;
        const lastSig = localStorage.getItem(LAST_SYNC_SIG_KEY);
        if (lastSig && lastSig === signature) {
          setMessage(messageEl, "Already synced with the latest transactions.", "success");
          return;
        }

        const importRes = await fetch(mainTrackerImportUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailNorm, transactions: exported }),
        });

        if (!importRes.ok) {
          const raw = await importRes.text();
          throw new Error(raw || `Import failed (${importRes.status})`);
        }

        localStorage.setItem(LAST_SYNC_SIG_KEY, signature);
        setMessage(messageEl, "Synced with Expense Tracker successfully.", "success");
      } catch (err) {
        setMessage(messageEl, err.message || "Sync failed", "error");
      } finally {
        disableButton(syncBtn, false);
        setSpinner(syncSpinner, false);
      }
    });

    return true;
  }

  // Boot.
  async function boot() {
    try {
      const configRes = await fetch(dummyApi("/api/config"));
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.mainTrackerImportUrl) {
          mainTrackerImportUrl = configData.mainTrackerImportUrl;
        }
      }
    } catch (e) {
      console.warn("Could not fetch dummy-finance-app config API", e);
    }
    const didLogin = initLoginPage();
    if (!didLogin) initDashboardPage();
  }
  boot();
})();

