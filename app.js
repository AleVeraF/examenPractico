let tareas = JSON.parse(localStorage.getItem("tareas")) || [];
let historialUndo = [];
let historialRedo = [];
let filtroActual = "todas";

const form = document.getElementById("add-task-form");
const taskList = document.getElementById("tasks");
const counter = document.getElementById("task-counter");
const themeToggle = document.getElementById("theme-toggle");

let temaOscuro = JSON.parse(localStorage.getItem("temaOscuro")) || false;
if (temaOscuro) document.body.classList.add("dark-mode");

themeToggle.addEventListener("click", () => {
    temaOscuro = !temaOscuro;
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("temaOscuro", JSON.stringify(temaOscuro));
});

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("task-name").value.trim();
    const fecha = document.getElementById("task-deadline").value;
    const prioridad = document.getElementById("task-priority").value;
    if (!texto || !isValidDate(fecha)) return alert("Campos inválidos");

    const nueva = {
        id: Date.now(),
        texto,
        fecha,
        prioridad,
        completada: false
    };
    tareas.push(nueva);
    guardarEstado();
    renderTareas();
    form.reset();
});

function isValidDate(d) {
    return !isNaN(Date.parse(d));
}

function guardarEstado() {
    historialUndo.push(JSON.stringify(tareas));
    historialRedo = [];
    localStorage.setItem("tareas", JSON.stringify(tareas));
}

function renderTareas() {
    taskList.innerHTML = "";
    let filtradas = tareas;
    if (filtroActual === "completadas") filtradas = tareas.filter(t => t.completada);
    if (filtroActual === "pendientes") filtradas = tareas.filter(t => !t.completada);

    filtradas.forEach((tarea, i) => {
        const li = document.createElement("li");
        li.setAttribute("draggable", true);
        li.dataset.index = i;
        li.dataset.id = tarea.id;

        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = tarea.completada;
        check.addEventListener("change", () => {
            tarea.completada = check.checked;
            guardarEstado();
            renderTareas();
        });

        const span = document.createElement("span");
        span.textContent = `${tarea.texto} (${tarea.fecha}) - ${tarea.prioridad}`;

        const editBtn = document.createElement("button");
        editBtn.textContent = "Editar";
        editBtn.addEventListener("click", () => editarTarea(tarea));

        const delBtn = document.createElement("button");
        delBtn.textContent = "Eliminar";
        delBtn.addEventListener("click", () => {
            tareas = tareas.filter(t => t.id !== tarea.id);
            guardarEstado();
            renderTareas();
        });

        li.append(check, span, editBtn, delBtn);
        taskList.appendChild(li);
    });

    const pendientes = tareas.filter(t => !t.completada).length;
    counter.textContent = `Tareas restantes: ${pendientes}`;

    if (pendientes > 0) {
        counter.classList.add("bounce");
        setTimeout(() => counter.classList.remove("bounce"), 400);
    } else {
        counter.classList.remove("bounce");
    }

    addDragEvents();
}

function editarTarea(tarea) {
    const li = [...taskList.children].find(el => el.dataset.id == tarea.id);
    li.innerHTML = "";

    const input = document.createElement("input");
    input.value = tarea.texto;
    const date = document.createElement("input");
    date.type = "date";
    date.value = tarea.fecha;

    const save = document.createElement("button");
    save.textContent = "Guardar";
    save.addEventListener("click", () => {
        if (!input.value.trim() || !isValidDate(date.value)) {
            return alert("Texto vacío o fecha inválida");
        }
        tarea.texto = input.value.trim();
        tarea.fecha = date.value;
        guardarEstado();
        renderTareas();
    });

    const cancel = document.createElement("button");
    cancel.textContent = "Cancelar";
    cancel.addEventListener("click", renderTareas);

    li.append(input, date, save, cancel);
}

function addDragEvents() {
    taskList.querySelectorAll("li").forEach(li => {
        li.addEventListener("dragstart", e => {
            e.dataTransfer.setData("text/plain", li.dataset.index);
        });

        li.addEventListener("dragover", e => e.preventDefault());

        li.addEventListener("drop", e => {
            const from = +e.dataTransfer.getData("text/plain");
            const to = +li.dataset.index;
            const moved = tareas.splice(from, 1)[0];
            tareas.splice(to, 0, moved);
            guardarEstado();
            renderTareas();
        });
    });
}

[
    { id: "filter-all", valor: "todas" },
    { id: "filter-completed", valor: "completadas" },
    { id: "filter-pending", valor: "pendientes" }
  ].forEach(({ id, valor }) => {
    document.getElementById(id).addEventListener("click", () => {
      filtroActual = valor;
      renderTareas();
    });
  });
  


window.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "z" && historialUndo.length > 0) {
        historialRedo.push(JSON.stringify(tareas));
        tareas = JSON.parse(historialUndo.pop());
        localStorage.setItem("tareas", JSON.stringify(tareas));
        renderTareas();
    } else if (e.ctrlKey && e.key === "y" && historialRedo.length > 0) {
        historialUndo.push(JSON.stringify(tareas));
        tareas = JSON.parse(historialRedo.pop());
        localStorage.setItem("tareas", JSON.stringify(tareas));
        renderTareas();
    }
});

// Carga inicial
renderTareas();
