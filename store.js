// Estado y persistencia. Mantiene las claves v11 para conservar tus datos.
(function () {
  const A = (window.App = window.App || {});
  const KT = "covey_stack_tasks_v11", KI = "covey_stack_incomes_v11";
  const state = { tasks: [], incomes: [], filter: "ALL" };

  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const save = () => {
    try {
      localStorage.setItem(KT, JSON.stringify(state.tasks));
      localStorage.setItem(KI, JSON.stringify(state.incomes));
    } catch {}
  };

  const seed = () => {
    const t = (id, title, category, quadrant, cost, isRock, notes) => ({ id, title, category, quadrant, cost, isDone: false, isRock, notes });
    state.incomes = [{ id: "inc1", title: "Sueldo del mes", amount: 800000 }];
    state.tasks = [
      t("t1", "Pagar arriendo del mes", "Casa", "Q1", 320000, true, "Obligación de vivienda. Fecha límite cercana."),
      t("t2", "Pagar internet", "Casa", "Q1", 28000, true, "Herramienta básica para trabajar."),
      t("t3", "Arreglar la chapa de la puerta", "Casa", "Q2", 45000, true, "Mantenimiento preventivo."),
      t("t4", "Curso de capacitación y ventas", "Estudio", "Q2", 65000, true, "Afilar la sierra para ganar más."),
      t("t5", "Micrófono para entregables", "Trabajo", "Q2", 70000, false, "Para entregar mejor trabajo."),
      t("t6", "Asado familiar del domingo", "Familia", "Q2", 30000, true, "Cuidar los lazos importantes.")
    ];
  };

  A.store = {
    state,
    init() {
      const t = read(KT), i = read(KI);
      if (t || i) { state.tasks = t || []; state.incomes = i || []; } else { seed(); save(); }
    },
    snap: () => JSON.stringify({ t: state.tasks, i: state.incomes }),
    restore(s) { const o = JSON.parse(s); state.tasks = o.t; state.incomes = o.i; save(); },
    setFilter: f => { state.filter = f; },

    view() {
      const f = state.filter;
      const keep = f === "ALL" ? () => true : f === "Q1" ? t => t.quadrant === "Q1" : f === "ROCK" ? t => t.isRock : t => t.category === f;
      return state.tasks.filter(keep).sort((a, b) => (a.isDone - b.isDone) || (A.classify.priority(b) - A.classify.priority(a)) || (a.cost || 0) - (b.cost || 0));
    },
    balance() {
      const income = state.incomes.reduce((s, i) => s + (+i.amount || 0), 0);
      const paid = state.tasks.filter(t => t.isDone).reduce((s, t) => s + (+t.cost || 0), 0);
      return { income, paid, free: income - paid };
    },
    get: id => state.tasks.find(t => t.id === id),

    toggle(id) { const t = A.store.get(id); if (t) { t.isDone = !t.isDone; save(); } return t; },
    saveTask(data) {
      const t = data.id && A.store.get(data.id);
      if (t) Object.assign(t, data);
      else state.tasks.unshift({ ...data, id: "task_" + Date.now(), isDone: false });
      save();
    },
    remove(id) { state.tasks = state.tasks.filter(t => t.id !== id); save(); },
    addIncome(title, amount) { state.incomes.unshift({ id: "inc_" + Date.now(), title, amount }); save(); },
    reset() { state.tasks = []; state.incomes = []; save(); }
  };
})();
