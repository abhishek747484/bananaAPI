const registerForm = document.querySelector("#registerForm");
const loginForm = document.querySelector("#loginForm");
const formMessage = document.querySelector("#formMessage");

function showFormMessage(message, type = "error") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`;
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const submitButton = registerForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    showFormMessage("Creating your account…", "info");

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          email: formData.get("email"),
          password: formData.get("password")
        })
      });
      window.location.href = "/pages/game.html";
    } catch (error) {
      showFormMessage(error.message);
      submitButton.disabled = false;
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const submitButton = loginForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    showFormMessage("Signing you in…", "info");

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password")
        })
      });
      window.location.href = "/pages/game.html";
    } catch (error) {
      showFormMessage(error.message);
      submitButton.disabled = false;
    }
  });
}
