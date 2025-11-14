document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  // ✅ Signup logic
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        role: document.getElementById("role").value,
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        address: document.getElementById("address").value,
        city: document.getElementById("city").value,
        phone: document.getElementById("phone").value,
      };

      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        // Redirect to login page after signup success
        window.location.href = "login.html";
      }
    });
  }

  // ✅ Login logic
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        role: document.getElementById("role").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
      };

      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        // Save login info
        localStorage.setItem("role", data.role);
        localStorage.setItem("user", JSON.stringify(result.user));

        // Redirect by role
        if (data.role === "admin") {
          window.location.href = "admin_dashboard.html";
        } else {
          window.location.href = "user_dashboard.html";
        }
      }
    });
  }

  // ✅ Logout logic (common for both dashboards)
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      alert("Logged out successfully!");
      window.location.href = "signup.html"; // redirect to signup
    });
  }
});






