// Formato de números y texto seguro.
(function () {
  const A = (window.App = window.App || {});
  const dots = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  A.fmt = {
    clp: n => "$" + dots(Math.round(Number(n) || 0)),
    num: v => parseInt(String(v || "").replace(/\D/g, ""), 10) || 0,
    maskInput(input) {
      const n = A.fmt.num(input.value);
      input.value = n ? dots(n) : "";
    },
    esc: s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
  };
})();
