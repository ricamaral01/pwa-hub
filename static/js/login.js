(function () {
  const config = window.erpTemplateConfig || {};

  function showError(message) {
    const errorBox = document.getElementById("loginError");
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.hidden = false;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const payload = {
      username: form.username.value.trim(),
      password: form.password.value,
    };

    const errorBox = document.getElementById("loginError");
    if (errorBox) errorBox.hidden = true;

    if (typeof config.auth?.login !== "function") {
      showError("Configure window.erpTemplateConfig.auth.login() para integrar esta tela com sua API.");
      return;
    }

    try {
      await config.auth.login(payload);
      window.location.replace(config.homeHref || "../../frontend/pages/index.html");
    } catch (error) {
      showError(error?.message || "Falha ao autenticar.");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("loginForm");
    if (form) form.addEventListener("submit", handleSubmit);
  });
})();
