(() => {
  "use strict";
  const TITLE = "Dashboard Concretagem Matriz";
  const apply = () => {
    const heading = document.querySelector("#viewProdAnalise .mi-topbar h2");
    if (heading && heading.textContent !== TITLE) heading.textContent = TITLE;
  };
  const start = () => {
    apply();
    const view = document.getElementById("viewProdAnalise");
    if (view) new MutationObserver(apply).observe(view, { childList: true, subtree: true, characterData: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
