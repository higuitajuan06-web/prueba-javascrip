const API_URL = 'http://localhost:3000';

// global variables
let usuarioActual = null;
let tareas = [];
let filtroActual = 'todas';
let tareaEnEdicion = null;

//DOM elements
const userNameSpan = document.getElementById('userName');
const userInitials = document.getElementById('userInitials');
const logoutBtn = document.getElementById('logoutBtn');
const newTaskBtn = document.getElementById('newTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const tasksTableBody = document.getElementById('tasksTableBody');
const tabBtns = document.querySelectorAll('.tab-btn');
const searchInput = document.getElementById('searchInput');
const modalTitle = document.getElementById('modalTitle');

// start
window.addEventListener('load', () => {
    verificarAutenticacion();
    cargarTareas();
    configurarEventos();
});

// auth verifice
function verificarAutenticacion() {
    const usuarioSesion = localStorage.getItem('usuarioAutenticado');
    if (!usuarioSesion) {
        window.location.href = '../index.html';
        return;
    }
    usuarioActual = JSON.parse(usuarioSesion);
    if (userNameSpan) userNameSpan.textContent = usuarioActual.nombre;
    if (userInitials) {
        const initials = (usuarioActual.nombre || 'U').split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
        userInitials.textContent = initials;
    }
}

// events setting
function configurarEventos() {
    if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);
    newTaskBtn.addEventListener('click', abrirModalNuevaTarea);
    taskForm.addEventListener('submit', guardarTarea);
    cancelBtn.addEventListener('click', cerrarModal);
    closeBtn.addEventListener('click', cerrarModal);

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filtroActual = e.target.dataset.filter;
            renderizarTareas();
        });
    });

    searchInput.addEventListener('input', () => renderizarTareas());

    // close modal to click out
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            cerrarModal();
        }
    });
}

// load user tasks
async function cargarTareas() {
    try {
        const response = await fetch(`${API_URL}/tareas?usuarioId=${usuarioActual.id}`);
        tareas = await response.json();
        actualizarEstadisticas();
        renderizarTareas();
    } catch (error) {
        console.error('Error cargando tareas:', error);
    }
}

// render task filter
function renderizarTareas() {
    const termino = searchInput.value.trim().toLowerCase();
    const tareasFiltradas = tareas.filter(tarea => {
        if (filtroActual !== 'todas' && tarea.estado !== filtroActual) return false;
        if (!termino) return true;
        return (
            tarea.titulo.toLowerCase().includes(termino) ||
            (tarea.descripcion || '').toLowerCase().includes(termino)
        );
    });

    if (tareasFiltradas.length === 0) {
        tasksTableBody.innerHTML = '<tr><td colspan="6">No tasks found.</td></tr>';
        return;
    }

    tasksTableBody.innerHTML = tareasFiltradas.map(tarea => {
        const estadoClass = tarea.estado === 'completada' ? 'status-completada' : 'status-pendiente';
        const prioClass = tarea.prioridad === 'alta' ? 'prio-alta' : tarea.prioridad === 'media' ? 'prio-media' : 'prio-baja';
        const assigneeName = usuarioActual.nombre || 'You';
        const initials = assigneeName.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
        const toggleIcon = tarea.estado === 'completada' ? '<i class="fa-solid fa-circle-arrow-left" style="color:grey;"></i>' : '<i class="fa-solid fa-circle-check"></i>';
        const toggleTitle = tarea.estado === 'completada' ? 'Marcar como pendiente' : 'Marcar como completada';

        return `
        <tr>
            <td>${tarea.titulo}</td>
            <td><div class="assignee"><div class="avatar">${initials}</div><div>${assigneeName}</div></div></td>
            <td><span class="status-badge ${estadoClass}">${tarea.estado}</span></td>
            <td><span class="priority"><span class="priority-dot ${prioClass}"></span>${tarea.prioridad}</span></td>
            <td>${formatearFecha(tarea.fechaEntrega)}</td>
            <td>
            <button class="action-btn checkBtn" onclick="toggleTarea('${tarea.id}')" title="${toggleTitle}">${toggleIcon}</button>
            <button class="action-btn editBtn" onclick="abrirModalEditar('${tarea.id}')"><i class="fa-solid fa-pen-to-square" style="color:#dbdf00;"></i></button>
            <button class="action-btn deleteBtn" onclick="eliminarTarea('${tarea.id}')"><i class="fa-solid fa-trash-can" style="color:red;"></i></button>
            </td>
        </tr>
    `;
    }).join('');
}

function actualizarEstadisticas() {
    const total = tareas.length;
    const completadas = tareas.filter(t => t.estado === 'completada').length;
    const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
    const percent = total > 0 ? Math.round((completadas / total) * 100) : 0;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completadas;
    document.getElementById('pendingTasks').textContent = pendientes;
    document.getElementById('progressPercent').textContent = percent + '%';
}

// open task prompts (not modal)
function abrirModalNuevaTarea() {
    // use promto not modal
    tareaEnEdicion = null;
    const data = promptTaskData();
    if (!data) return; // user cancel

    // Post new task
    (async () => {
        try {
            await fetch(`${API_URL}/tareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: generarId(),
                    titulo: data.titulo,
                    descripcion: data.descripcion,
                    fechaEntrega: data.fechaEntrega,
                    prioridad: data.prioridad,
                    estado: 'pendiente',
                    usuarioId: usuarioActual.id,
                    fechaCreacion: new Date().toISOString()
                })
            });
            alert('Tarea creada exitosamente');
            cargarTareas();
        } catch (error) {
            console.error('Error creando tarea:', error);
            alert('Error al crear la tarea');
        }
    })();
}

// Edit task to prompts (not modal)
async function abrirModalEditar(id) {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea) return;

    // get inputs user to prompts
    const data = promptTaskData(tarea);
    if (!data) return; // cancel

    try {
        await fetch(`${API_URL}/tareas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...tarea,
                titulo: data.titulo,
                descripcion: data.descripcion,
                fechaEntrega: data.fechaEntrega,
                prioridad: data.prioridad
            })
        });
        alert('Tarea actualizada exitosamente');
        cargarTareas();
    } catch (error) {
        console.error('Error actualizando tarea:', error);
        alert('Error al actualizar la tarea');
    }
}

// close modal
function cerrarModal() {
    taskModal.classList.add('hidden');
    tareaEnEdicion = null;
}

// Record task data using notifications. Returns object or null if canceled.
function promptTaskData(existing = {}) {
    const titulo = window.prompt('Título de la tarea:', existing.titulo || '');
    if (titulo === null) return null;
    const descripcion = window.prompt('Descripción:', existing.descripcion || '');
    if (descripcion === null) return null;
    let fechaEntrega = window.prompt('Fecha de entrega (YYYY-MM-DD):', existing.fechaEntrega || '');
    if (fechaEntrega === null) return null;
    fechaEntrega = fechaEntrega.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega)) {
        alert('Formato de fecha inválido. Use YYYY-MM-DD.');
        return null;
    }
    let prioridad = window.prompt('Prioridad (alta, media, baja):', existing.prioridad || 'media');
    if (prioridad === null) return null;
    prioridad = prioridad.toLowerCase();
    if (!['alta', 'media', 'baja'].includes(prioridad)) prioridad = 'media';
    return { titulo: titulo.trim(), descripcion: descripcion.trim(), fechaEntrega, prioridad };
}

//  Save task (create or edit)
async function guardarTarea(e) {
    e.preventDefault();

    const titulo = document.getElementById('taskTitle').value.trim();
    const descripcion = document.getElementById('taskDescription').value.trim();
    const fechaEntrega = document.getElementById('taskDate').value;
    const prioridad = document.getElementById('taskPriority').value;

    if (!titulo || !fechaEntrega) {
        alert('Por favor, completa los campos requeridos');
        return;
    }

    try {
        if (tareaEnEdicion) {
            // edit exis tasks
            await fetch(`${API_URL}/tareas/${tareaEnEdicion.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    titulo,
                    descripcion,
                    fechaEntrega,
                    prioridad,
                    usuarioId: usuarioActual.id
                })
            });
            alert('Tarea actualizada exitosamente');
        } else {
            // creat new tasks
            await fetch(`${API_URL}/tareas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: generarId(),
                    titulo,
                    descripcion,
                    fechaEntrega,
                    prioridad,
                    estado: 'pendiente',
                    usuarioId: usuarioActual.id,
                    fechaCreacion: new Date().toISOString()
                })
            });
            alert('Tarea creada exitosamente');
        }

        cerrarModal();
        cargarTareas();
    } catch (error) {
        console.error('Error guardando tarea:', error);
        alert('Error al guardar la tarea');
    }
}

// Toggle complet/incomplete task
async function toggleTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea) return;

    const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada';

    try {
        await fetch(`${API_URL}/tareas/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        cargarTareas();
    } catch (error) {
        console.error('Error actualizando tarea:', error);
    }
}

// delete task
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
        await fetch(`${API_URL}/tareas/${id}`, {
            method: 'DELETE'
        });
        alert('Tarea eliminada');
        cargarTareas();
    } catch (error) {
        console.error('Error eliminando tarea:', error);
    }
}

// close account
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('usuarioAutenticado');
        window.location.href = '../index.html';
    }
}

// auxiliar functions
function generarId() {
    return Math.random().toString(36).substr(2, 9);
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}