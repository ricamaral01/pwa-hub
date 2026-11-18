/* Add accessible mobile labels without replacing framework-owned elements. */
(() => {
  function labelTables() {
    document.querySelectorAll('table').forEach(table => {
      if (table.dataset.mobileLabels || table.querySelector('thead [colspan],thead [rowspan]')) return;
      const headings = [...table.querySelectorAll('thead tr:last-child th')].map(th => th.textContent.trim());
      if (!headings.length) return;
      table.classList.add('responsive-records');
      table.querySelectorAll('tbody tr').forEach(row => [...row.cells].forEach((cell, index) => {
        if (cell.colSpan === 1 && headings[index]) cell.dataset.label = headings[index];
      }));
    });
  }
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; labelTables(); });
  }).observe(document.documentElement, {childList: true, subtree: true});
  document.addEventListener('DOMContentLoaded', labelTables);
})();
