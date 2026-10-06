// Punto de entrada: conecta eventos con la interfaz.
(function () {
  const A = window.App, S = A.store, ui = A.ui;
  const $ = s => document.querySelector(s);

  S.init();
  ui.render();

  $("#btnTask").onclick = () => ui.openSheet("task");
  $("#btnIncome").onclick = () => ui.openSheet("income");
  $("#btnReset").onclick = () => ui.mutate(() => S.reset(), "Todo borrado");

  $("#filters").addEventListener("click", e => {
    const f = e.target.closest("[data-f]");
    if (f) { S.setFilter(f.dataset.f); ui.render(); }
  });

  document.addEventListener("click", e => {
    const edit = e.target.closest("[data-edit]");
    if (edit) return ui.openSheet("task", edit.dataset.edit);
    const tog = e.target.closest("[data-toggle]");
    if (tog) ui.completeTask(tog.dataset.toggle);
  });

  // Modal y lógica de importación de correos bancarios
  const mailSheet = $("#mailSheet");
  const mailForm = $("#mailForm");
  const mailText = $("#mailText");
  const btnMailClose = $("#btnMailClose");
  const btnPasteClip = $("#btnPasteClip");
  const btnSaveMail = $("#btnSaveMail");
  const mailPreview = $("#mailPreview");
  const previewType = $("#previewType");
  const previewTitle = $("#previewTitle");
  const previewAmount = $("#previewAmount");

  let currentParsed = null;

  function updateMailPreview() {
    const parsed = A.mailParser.parseEmail(mailText.value);
    currentParsed = parsed;
    if (parsed) {
      mailPreview.hidden = false;
      previewType.textContent = parsed.type === "income" ? "Ingreso" : "Gasto";
      previewType.className = "preview-tag " + (parsed.type === "income" ? "income" : "");
      previewTitle.textContent = parsed.title;
      previewAmount.textContent = A.fmt.clp(parsed.amount);
      btnSaveMail.disabled = false;
    } else {
      mailPreview.hidden = true;
      btnSaveMail.disabled = true;
    }
  }

  $("#btnMail").onclick = () => {
    mailText.value = "";
    updateMailPreview();
    mailSheet.showModal();
    mailText.focus();
  };

  btnMailClose.onclick = () => mailSheet.close();
  mailSheet.addEventListener("click", e => { if (e.target === mailSheet) mailSheet.close(); });

  mailText.addEventListener("input", updateMailPreview);

  btnPasteClip.onclick = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        mailText.value = clip;
        updateMailPreview();
      }
    } catch {
      ui.toast("No se pudo acceder al portapapeles. Pega manualmente.");
    }
  };

  mailForm.onsubmit = e => {
    e.preventDefault();
    if (!currentParsed) return;

    const { type, title, amount } = currentParsed;
    mailSheet.close();

    if (type === "income") {
      ui.mutate(() => S.addIncome(title, amount), `Ingreso registrado: ${A.fmt.clp(amount)}`);
    } else {
      const c = A.classify(title);
      ui.mutate(() => S.saveTask({
        title: title,
        cost: amount,
        category: c.category,
        quadrant: c.quadrant,
        isRock: c.isRock
      }), `Gasto registrado: ${title} (${A.fmt.clp(amount)})`);
    }
  };
})();
