(function () {
  "use strict";

  var STORAGE_KEY = "ficha_levantamiento_callegari_v1";
  var form = document.getElementById("ficha");
  var tablaBody = document.getElementById("tablaResumenBody");
  var checklistBody = document.getElementById("checklistBody");
  var saveIndicator = document.getElementById("saveIndicator");

  var CHECKLIST_ITEMS = [
    "El lugar donde se ejecuta la tarea fue observado.",
    "Las tareas descritas por la persona entrevistada coinciden con lo observado.",
    "Se identificaron tareas rutinarias y no rutinarias.",
    "Se revisaron herramientas, equipos o vehículos utilizados.",
    "Se consultó por sustancias o productos químicos, cuando corresponde.",
    "Se verificó el uso real de EPP."
  ];

  var RESUMEN_COLS = ["tarea", "lugar", "herramientas", "peligro", "control"];
  var resumenRowCount = 0;

  // ---------- registro resumido de tareas ----------
  function addResumenRow(data) {
    data = data || {};
    resumenRowCount++;
    var n = resumenRowCount;
    var tr = document.createElement("tr");
    tr.innerHTML =
      '<td class="col-n">' + n + '</td>' +
      '<td><input type="text" data-r="tarea"></td>' +
      '<td class="col-chk"><input type="checkbox" data-r="rutinaria"></td>' +
      '<td class="col-chk"><input type="checkbox" data-r="noRutinaria"></td>' +
      '<td><input type="text" data-r="lugar"></td>' +
      '<td><input type="text" data-r="herramientas"></td>' +
      '<td><input type="text" data-r="peligro"></td>' +
      '<td><input type="text" data-r="control"></td>' +
      '<td class="col-del no-print"><button type="button" class="row-del" title="Eliminar fila">✕</button></td>';

    tr.querySelector(".row-del").addEventListener("click", function () {
      tr.remove();
      renumberResumen();
      scheduleSave();
    });

    tablaBody.appendChild(tr);

    if (data.tarea) tr.querySelector('[data-r="tarea"]').value = data.tarea;
    if (data.lugar) tr.querySelector('[data-r="lugar"]').value = data.lugar;
    if (data.herramientas) tr.querySelector('[data-r="herramientas"]').value = data.herramientas;
    if (data.peligro) tr.querySelector('[data-r="peligro"]').value = data.peligro;
    if (data.control) tr.querySelector('[data-r="control"]').value = data.control;
    if (data.rutinaria) tr.querySelector('[data-r="rutinaria"]').checked = true;
    if (data.noRutinaria) tr.querySelector('[data-r="noRutinaria"]').checked = true;
  }

  function renumberResumen() {
    var rows = tablaBody.querySelectorAll("tr");
    resumenRowCount = rows.length;
    rows.forEach(function (tr, i) {
      tr.querySelector(".col-n").textContent = i + 1;
    });
  }

  function getResumenData() {
    var rows = [];
    tablaBody.querySelectorAll("tr").forEach(function (tr) {
      var row = {};
      RESUMEN_COLS.forEach(function (key) {
        row[key] = tr.querySelector('[data-r="' + key + '"]').value;
      });
      row.rutinaria = tr.querySelector('[data-r="rutinaria"]').checked;
      row.noRutinaria = tr.querySelector('[data-r="noRutinaria"]').checked;
      rows.push(row);
    });
    return rows;
  }

  document.getElementById("btnAddRow").addEventListener("click", function () {
    addResumenRow();
    scheduleSave();
  });

  // ---------- checklist de cierre ----------
  function buildChecklist(saved) {
    CHECKLIST_ITEMS.forEach(function (text, i) {
      var name = "checklist_" + i;
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + text + "</td>" +
        '<td class="col-chk"><input type="radio" name="' + name + '" value="Sí"></td>' +
        '<td class="col-chk"><input type="radio" name="' + name + '" value="No"></td>' +
        '<td class="col-chk"><input type="radio" name="' + name + '" value="N.A."></td>';
      checklistBody.appendChild(tr);
      if (saved && saved[i]) {
        var el = tr.querySelector('input[value="' + saved[i] + '"]');
        if (el) el.checked = true;
      }
    });
  }

  function getChecklistData() {
    return CHECKLIST_ITEMS.map(function (_, i) {
      var checked = form.querySelector('input[name="checklist_' + i + '"]:checked');
      return checked ? checked.value : "";
    });
  }

  // ---------- guardar / restaurar ----------
  function collectState() {
    var state = { fields: {}, radios: {}, checks: {} };

    form.querySelectorAll("[data-field]").forEach(function (el) {
      if (el.type === "checkbox") {
        state.checks[el.dataset.field] = el.checked;
      } else {
        state.fields[el.dataset.field] = el.value;
      }
    });

    form.querySelectorAll("input[type=radio][name]").forEach(function (el) {
      if (el.name.indexOf("checklist_") === 0) return;
      if (el.checked) state.radios[el.name] = el.value;
    });

    state.resumen = getResumenData();
    state.checklist = getChecklistData();
    return state;
  }

  function applyState(state) {
    if (!state) return;

    Object.keys(state.fields || {}).forEach(function (key) {
      var el = form.querySelector('[data-field="' + key + '"]');
      if (el) el.value = state.fields[key];
    });

    Object.keys(state.checks || {}).forEach(function (key) {
      var el = form.querySelector('[data-field="' + key + '"]');
      if (el) el.checked = state.checks[key];
    });

    Object.keys(state.radios || {}).forEach(function (name) {
      var el = form.querySelector('input[name="' + name + '"][value="' + cssEscape(state.radios[name]) + '"]');
      if (el) el.checked = true;
    });

    if (state.resumen && state.resumen.length) {
      tablaBody.innerHTML = "";
      resumenRowCount = 0;
      state.resumen.forEach(function (row) { addResumenRow(row); });
    }
  }

  function cssEscape(v) {
    return String(v).replace(/"/g, '\\"');
  }

  var saveTimer = null;
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 400);
  }

  function save() {
    try {
      var state = collectState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (saveIndicator) {
        saveIndicator.textContent = "Borrador guardado " + new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
      }
    } catch (e) {
      console.error("No se pudo guardar el borrador:", e);
      if (saveIndicator) saveIndicator.textContent = "No se pudo guardar el borrador";
    }
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      applyState(JSON.parse(raw));
      return true;
    } catch (e) {
      console.error("No se pudo restaurar el borrador:", e);
      return false;
    }
  }

  // ---------- inicialización ----------
  buildChecklist(null);
  for (var i = 0; i < 9; i++) addResumenRow();

  var hadDraft = restore();
  if (hadDraft && saveIndicator) {
    saveIndicator.textContent = "Borrador restaurado";
  }

  // Aplica checklist guardado si existía (restore ya llenó el resto)
  (function reapplyChecklistIfSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var state = JSON.parse(raw);
      if (!state.checklist) return;
      state.checklist.forEach(function (val, i) {
        if (!val) return;
        var el = form.querySelector('input[name="checklist_' + i + '"][value="' + cssEscape(val) + '"]');
        if (el) el.checked = true;
      });
    } catch (e) { /* noop */ }
  })();

  form.addEventListener("input", scheduleSave);
  form.addEventListener("change", scheduleSave);

  document.getElementById("btnLimpiar").addEventListener("click", function () {
    var ok = confirm("¿Vaciar todo el formulario? Se perderá el borrador guardado.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    form.reset();
    tablaBody.innerHTML = "";
    resumenRowCount = 0;
    for (var i = 0; i < 9; i++) addResumenRow();
    document.querySelector('[data-field="empresa"]').value = "Callegari";
    document.querySelector('[data-field="realizadoPor"]').value = "Claudia Aparicio Guerra";
    document.querySelector('[data-field="realizadoPorCargo"]').value = "Prevencionista de Riesgos";
    if (saveIndicator) saveIndicator.textContent = "Formulario vacío";
  });

  // ---------- exportar a PDF ----------
  document.getElementById("btnPdf").addEventListener("click", function () {
    var btn = this;
    var original = btn.textContent;
    btn.textContent = "Generando…";
    btn.disabled = true;

    document.body.classList.add("exporting");

    var empresa = (document.querySelector('[data-field="empresa"]').value || "empresa").trim();
    var cargo = (document.querySelector('[data-field="cargoEvaluado"]').value || "cargo").trim();
    var fecha = (document.querySelector('[data-field="fecha"]').value || "").trim();
    var filename = "Ficha_Levantamiento_" + slug(empresa) + "_" + slug(cargo) + (fecha ? "_" + fecha : "") + ".pdf";

    var opt = {
      margin: [10, 8, 10, 8],
      filename: filename,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: [".qa", ".card", "tr"] }
    };

    var target = document.getElementById("printArea");

    window.html2pdf().set(opt).from(target).save().then(function () {
      finishExport();
    }).catch(function (err) {
      console.error(err);
      alert("Ocurrió un problema generando el PDF. Intenta de nuevo.");
      finishExport();
    });

    function finishExport() {
      document.body.classList.remove("exporting");
      btn.textContent = original;
      btn.disabled = false;
    }
  });

  function slug(s) {
    return s
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "sin_dato";
  }
})();
