// Render, hoja de edición, gesto de deslizar y avisos.
(function () {
  const A = (window.App = window.App || {});
  const $ = s => document.querySelector(s);
  const { clp, esc, num, maskInput } = A.fmt;
  const S = A.store;
  const Q = { Q1: "Urgente", Q2: "Importante", Q4: "Prescindible" };
  const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>';
  const ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  let timer;
  function toast(msg, undo) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>${undo ? "<button>Deshacer</button>" : ""}`;
    t.classList.add("show");
    if (undo) t.querySelector("button").onclick = () => { undo(); t.classList.remove("show"); };
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove("show"), 4500);
  }

  function mutate(fn, msg) {
    const before = S.snap();
    fn();
    render();
    toast(msg, () => { S.restore(before); render(); });
  }

  function bindSwipe(track, done) {
    const knob = track.querySelector(".knob");
    let x0 = null, dx = 0;
    const max = () => track.clientWidth - knob.offsetWidth - 8;
    knob.onpointerdown = e => { x0 = e.clientX; knob.setPointerCapture(e.pointerId); track.classList.add("drag"); };
    knob.onpointermove = e => {
      if (x0 === null) return;
      dx = Math.max(0, Math.min(max(), e.clientX - x0));
      track.style.setProperty("--dx", dx + "px");
    };
    knob.onpointerup = () => {
      if (x0 === null) return;
      const ok = dx > max() * 0.8;
      x0 = null; dx = 0;
      track.classList.remove("drag");
      track.style.setProperty("--dx", "0px");
      if (ok) done();
    };
    knob.onclick = e => { if (e.detail === 0) done(); };
  }

  function renderFocus(next, total) {
    const box = $("#focus");
    if (!next) {
      box.innerHTML = `<div class="focus idle"><div class="focus-body"><h2>${total ? "Todo al día" : "Sin tareas"}</h2><p>${total ? "No queda nada pendiente en esta vista." : "Agrega tu primera tarea abajo."}</p></div></div>`;
      return;
    }
    const verb = next.cost > 0 ? "pagar" : "completar";
    box.innerHTML = `
      <article class="focus">
        <div class="focus-meta"><span>${Q[next.quadrant] || "Importante"} · ${esc(next.category)}</span><span>${next.cost > 0 ? clp(next.cost) : "Sin costo"}</span></div>
        <button class="focus-body" data-edit="${next.id}"><h2>${esc(next.title)}</h2>${next.notes ? `<p>${esc(next.notes)}</p>` : ""}</button>
        <div class="track"><button class="knob" aria-label="Deslizar para ${verb}">${ARROW}</button><span>Desliza para ${verb}</span></div>
      </article>`;
    bindSwipe(box.querySelector(".track"), () => completeTask(next.id));
  }

  const row = (t, n) => `
    <div class="row ${t.isDone ? "done" : ""}">
      <button class="check" data-toggle="${t.id}" aria-label="${t.isDone ? "Desmarcar" : "Completar"}">${CHECK}</button>
      <button class="row-main" data-edit="${t.id}">
        <span class="row-title">${esc(t.title)}</span>
        <span class="row-meta">${t.isDone ? "" : "#" + n + " · "}${esc(t.category)} · ${Q[t.quadrant] || "Importante"}</span>
      </button>
      <span class="row-cost">${t.cost > 0 ? clp(t.cost) : ""}</span>
    </div>`;

  function render() {
    const b = S.balance(), list = S.view(), next = list.find(t => !t.isDone);
    $("#free").textContent = clp(b.free);
    $("#inc").textContent = clp(b.income);
    $("#paid").textContent = clp(b.paid);
    $("#bar").style.width = (b.income ? Math.min(100, (b.paid / b.income) * 100) : 0) + "%";
    document.querySelectorAll("[data-f]").forEach(c => c.setAttribute("aria-pressed", c.dataset.f === S.state.filter));
    renderFocus(next, list.length);
    const pending = list.filter(t => !t.isDone).length;
    $("#count").textContent = pending === 1 ? "1 pendiente" : `${pending} pendientes`;
    $("#list").innerHTML = list.length ? (() => { let n = 0; return list.map(t => row(t, t.isDone ? 0 : ++n)).join(""); })() : '<p class="empty">No hay tareas en esta vista.</p>';
  }

  function completeTask(id) {
    const t = S.get(id);
    if (!t) return;
    const wasDone = t.isDone;
    mutate(() => S.toggle(id), wasDone ? "Marcada como pendiente" : t.cost > 0 ? `Pagado ${clp(t.cost)}` : "Completada");
  }

  const dlg = $("#sheet"), form = $("#form"), fTitle = $("#fTitle"), fAmount = $("#fAmount"), detect = $("#detect");
  let editing = null, cls = null;

  function setKind(kind) {
    form.elements.kind.value = kind;
    const task = kind === "task";
    $("#sheetTitle").textContent = editing ? "Editar tarea" : task ? "Nueva tarea" : "Nuevo ingreso";
    $("#lblTitle").textContent = task ? "¿Qué es?" : "Detalle";
    fTitle.placeholder = task ? "Pagar arriendo" : "Sueldo, cliente, venta";
    fTitle.required = task;
    detect.hidden = !(task && cls && fTitle.value.trim());
  }

  function openSheet(kind, id) {
    form.reset();
    editing = id ? S.get(id) : null;
    cls = editing ? { category: editing.category, quadrant: editing.quadrant, isRock: editing.isRock, label: Q[editing.quadrant] } : null;
    $("#kindSeg").hidden = !!editing;
    $("#btnDelete").hidden = !editing;
    $("#btnSave").textContent = "Guardar";
    if (editing) { fTitle.value = editing.title; fAmount.value = editing.cost ? String(editing.cost) : ""; maskInput(fAmount); showDetect(); }
    setKind(kind);
    dlg.showModal();
    fTitle.focus();
  }

  function showDetect() {
    detect.hidden = !(cls && fTitle.value.trim());
    if (cls) detect.textContent = `${cls.category} · ${Q[cls.quadrant]}${cls.label && cls.label !== Q[cls.quadrant] ? " · " + cls.label : ""}`;
  }

  fTitle.addEventListener("input", () => {
    if (form.elements.kind.value !== "task") return;
    cls = A.classify(fTitle.value);
    showDetect();
  });
  fAmount.addEventListener("input", () => maskInput(fAmount));
  form.elements.kind.forEach(r => r.addEventListener("change", () => setKind(r.value)));
  $("#btnClose").onclick = () => dlg.close();
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });

  form.onsubmit = e => {
    e.preventDefault();
    const title = fTitle.value.trim(), amount = num(fAmount.value);
    if (form.elements.kind.value === "income") {
      if (amount <= 0) { fAmount.focus(); return; }
      dlg.close();
      mutate(() => S.addIncome(title || "Ingreso", amount), `Se sumaron ${clp(amount)}`);
    } else {
      if (!title) return;
      const c = cls || A.classify(title);
      dlg.close();
      mutate(() => S.saveTask({ id: editing && editing.id, title, cost: amount, category: c.category, quadrant: c.quadrant, isRock: c.isRock }), editing ? "Cambios guardados" : "Tarea agregada");
    }
  };

  $("#btnDelete").onclick = () => {
    const id = editing.id;
    dlg.close();
    mutate(() => S.remove(id), "Tarea eliminada");
  };

  A.ui = { render, openSheet, mutate, completeTask, toast };
})();
