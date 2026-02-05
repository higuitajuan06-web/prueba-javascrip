// URL base para las peticiones HTTP al servidor backend (JSON Server/Node.js)
const API_URL = 'http://localhost:3000';

// VARIABLES DE ESTADO GLOBAL: Mantienen la información en la memoria de la aplicación
let usuarioActual = null; // Almacena el objeto del usuario logueado (sesión)
let tareas = [];          // Array principal que guarda la colección de objetos de tareas
let filtroActual = 'todas'; // Estado para el filtrado de la UI (todas/pendientes/completadas)
let tareaEnEdicion = null; // Referencia temporal para saber qué tarea se está modificando

// REFERENCIAS AL DOM: Acceso directo a los elementos HTML mediante sus IDs
const userNameSpan = document.getElementById('userName');
const userInitials = document.getElementById('userInitials');
const logoutBtn = document.getElementById('logoutBtn');
const newTaskBtn = document.getElementById('newTaskBtn');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const cancelBtn = document.getElementById('cancelBtn');
const closeBtn = document.querySelector('.close');
const tasksTableBody = document.getElementById('tasksTableBody');
const tabBtns = document.querySelectorAll('.tab-btn'); // NodeList de botones de filtro
const searchInput = document.getElementById('searchInput');
const modalTitle = document.getElementById('modalTitle');

// EVENTO DE INICIALIZACIÓN: Se dispara cuando el DOM y recursos han cargado totalmente
window.addEventListener('load', () => {
    verificarAutenticacion(); // Control de acceso
    cargarTareas();           // Fetch inicial de datos
    configurarEventos();      // Registro de listeners
});

// FUNCIÓN DE SEGURIDAD Y SESIÓN
function verificarAutenticacion() {
    // Obtiene el string de sesión de la memoria persistente del navegador
    const usuarioSesion = localStorage.getItem('usuarioAutenticado');
    
    // Guardrail: Si no hay sesión, redirige al login mediante el objeto window.location
    if (!usuarioSesion) {
        window.location.href = '../index.html';
        return;
    }
    
    // Deserialización: Convierte el JSON string de nuevo en un objeto JavaScript
    usuarioActual = JSON.parse(usuarioSesion);
    
    // Inyección de datos en la UI
    if (userNameSpan) userNameSpan.textContent = usuarioActual.nombre;
    if (userInitials) {
        // Lógica de iniciales: Divide el nombre, mapea la primera letra, une y corta a 2 caracteres
        const initials = (usuarioActual.nombre || 'U').split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
        userInitials.textContent = initials;
    }
}

// CONFIGURACIÓN DE ESCUCHADORES (LISTENERS)
function configurarEventos() {
    if (logoutBtn) logoutBtn.addEventListener('click', cerrarSesion);
    newTaskBtn.addEventListener('click', abrirModalNuevaTarea);
    taskForm.addEventListener('submit', guardarTarea); // Maneja el evento de envío de formulario
    cancelBtn.addEventListener('click', cerrarModal);
    closeBtn.addEventListener('click', cerrarModal);

    // Iteración sobre los botones de pestañas para aplicar filtros dinámicos
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active')); // Limpia clases previas
            e.target.classList.add('active'); // Resalta el botón seleccionado
            filtroActual = e.target.dataset.filter; // Accede al atributo data-filter del HTML
            renderizarTareas(); // Refresca la vista
        });
    });

    // Evento 'input' para búsqueda en tiempo real (se dispara en cada tecla)
    searchInput.addEventListener('input', () => renderizarTareas());

    // Cierre de modal por propagación de eventos (clic fuera del contenido del modal)
    window.addEventListener('click', (e) => {
        if (e.target === taskModal) cerrarModal();
    });
}

// OPERACIÓN LECTURA (GET): Obtiene datos de la API de forma asíncrona
async function cargarTareas() {
    try {
        // Petición GET con Query Params para filtrar por el ID del usuario actual
        const response = await fetch(`${API_URL}/tareas?usuarioId=${usuarioActual.id}`);
        tareas = await response.json(); // Parsea el cuerpo de la respuesta a un array de objetos
        actualizarEstadisticas(); // Recalcula contadores
        renderizarTareas();       // Actualiza la tabla
    } catch (error) {
        console.error('Error cargando tareas:', error); // Manejo de excepciones de red
    }
}

// LÓGICA DE RENDERIZADO Y FILTRADO DINÁMICO
function renderizarTareas() {
    const termino = searchInput.value.trim().toLowerCase(); // Normaliza el texto de búsqueda
    
    // Método .filter(): Crea un subconjunto de tareas basado en filtros y búsqueda
    const tareasFiltradas = tareas.filter(tarea => {
        if (filtroActual !== 'todas' && tarea.estado !== filtroActual) return false;
        if (!termino) return true;
        // Búsqueda insensible a mayúsculas en título y descripción
        return (
            tarea.titulo.toLowerCase().includes(termino) ||
            (tarea.descripcion || '').toLowerCase().includes(termino)
        );
    });

    // Early return: Si no hay datos, muestra mensaje y corta la ejecución
    if (tareasFiltradas.length === 0) {
        tasksTableBody.innerHTML = '<tr><td colspan="6">No tasks found.</td></tr>';
        return;
    }

    // Generación de HTML mediante Template Literals y .map()
    tasksTableBody.innerHTML = tareasFiltradas.map(tarea => {
        // Lógica condicional para asignar clases CSS de estado y prioridad
        const estadoClass = tarea.estado === 'completada' ? 'status-completada' : 'status-pendiente';
        const prioClass = tarea.prioridad === 'alta' ? 'prio-alta' : tarea.prioridad === 'media' ? 'prio-media' : 'prio-baja';
        const assigneeName = usuarioActual.nombre || 'You';
        const initials = assigneeName.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
        
        // Operador ternario para cambiar el icono según el estado
        const toggleIcon = tarea.estado === 'completada' ? '<i class="fa-solid fa-circle-arrow-left" style="color:grey;"></i>' : '<i class="fa-solid fa-circle-check"></i>';
        const toggleTitle = tarea.estado === 'completada' ? 'Marcar como pendiente' : 'Marcar como completada';

        // Retorna el string de la fila <tr> que será insertado en el DOM
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
        </tr>`;
    }).join(''); // Convierte el array resultante de strings en un solo bloque de texto
}

// CÁLCULO DE MÉTRICAS
function actualizarEstadisticas() {
    const total = tareas.length;
    // .filter().length: Cuenta elementos que cumplen una condición específica
    const completadas = tareas.filter(t => t.estado === 'completada').length;
    const pendientes = tareas.filter(t => t.estado === 'pendiente').length;
    // Cálculo de porcentaje: (Parte / Todo) * 100
    const percent = total > 0 ? Math.round((completadas / total) * 100) : 0;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('completedTasks').textContent = completadas;
    document.getElementById('pendingTasks').textContent = pendientes;
    document.getElementById('progressPercent').textContent = percent + '%';
}

// OPERACIÓN CREACIÓN (POST) MEDIANTE PROMPTS
function abrirModalNuevaTarea() {
    tareaEnEdicion = null;
    const data = promptTaskData(); // Captura de datos del usuario
    if (!data) return; 

    // IIFE (Expresión de función invocada inmediatamente) asíncrona para el envío
    (async () => {
        try {
            await fetch(`${API_URL}/tareas`, {
                method: 'POST', // Define la operación como creación
                headers: { 'Content-Type': 'application/json' }, // Indica que enviamos JSON
                body: JSON.stringify({ // Serializa el objeto a string
                    id: generarId(),
                    ...data, // Spread operator: incluye todas las propiedades del objeto data
                    estado: 'pendiente',
                    usuarioId: usuarioActual.id,
                    fechaCreacion: new Date().toISOString() // Timestamp en formato ISO
                })
            });
            alert('Tarea creada exitosamente');
            cargarTareas(); // Re-sincroniza con el servidor
        } catch (error) {
            console.error('Error creando tarea:', error);
        }
    })();
}

// OPERACIÓN ACTUALIZACIÓN (PUT)
async function abrirModalEditar(id) {
    const tarea = tareas.find(t => t.id === id); // Localiza el objeto original en el array
    if (!tarea) return;

    const data = promptTaskData(tarea); // Pasa la tarea actual para pre-llenar los prompts
    if (!data) return; 

    try {
        await fetch(`${API_URL}/tareas/${id}`, {
            method: 'PUT', // Reemplazo total del recurso
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...tarea, // Mantiene datos originales (como id y usuarioId)
                ...data   // Sobrescribe con los nuevos datos capturados
            })
        });
        alert('Tarea actualizada exitosamente');
        cargarTareas();
    } catch (error) {
        console.error('Error actualizando tarea:', error);
    }
}

// CAPTURA Y VALIDACIÓN DE DATOS (Helper)
function promptTaskData(existing = {}) {
    const titulo = window.prompt('Título de la tarea:', existing.titulo || '');
    if (titulo === null) return null; // Cancelar si el usuario cierra el prompt

    const descripcion = window.prompt('Descripción:', existing.descripcion || '');
    if (descripcion === null) return null;

    let fechaEntrega = window.prompt('Fecha de entrega (YYYY-MM-DD):', existing.fechaEntrega || '');
    if (fechaEntrega === null) return null;
    
    // RegEx: Valida que el formato sea estrictamente AAAA-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaEntrega.trim())) {
        alert('Formato de fecha inválido. Use YYYY-MM-DD.');
        return null;
    }

    let prioridad = window.prompt('Prioridad (alta, media, baja):', existing.prioridad || 'media');
    if (prioridad === null) return null;
    prioridad = prioridad.toLowerCase();
    // Validación de entrada controlada
    if (!['alta', 'media', 'baja'].includes(prioridad)) prioridad = 'media';

    return { titulo: titulo.trim(), descripcion: descripcion.trim(), fechaEntrega, prioridad };
}

// OPERACIÓN ACTUALIZACIÓN PARCIAL (PATCH)
async function toggleTarea(id) {
    const tarea = tareas.find(t => t.id === id);
    if (!tarea) return;

    // Lógica de conmutación (Toggle): Si es A pasa a B, si es B pasa a A
    const nuevoEstado = tarea.estado === 'completada' ? 'pendiente' : 'completada';

    try {
        await fetch(`${API_URL}/tareas/${id}`, {
            method: 'PATCH', // Modifica solo el campo especificado
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        cargarTareas(); // Actualiza UI
    } catch (error) {
        console.error('Error actualizando tarea:', error);
    }
}

// OPERACIÓN ELIMINACIÓN (DELETE)
async function eliminarTarea(id) {
    // Confirmación nativa para evitar borrados accidentales
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
        await fetch(`${API_URL}/tareas/${id}`, {
            method: 'DELETE' // Indica al servidor que elimine el recurso con ese ID
        });
        alert('Tarea eliminada');
        cargarTareas();
    } catch (error) {
        console.error('Error eliminando tarea:', error);
    }
}

// CIERRE DE SESIÓN
function cerrarSesion() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        localStorage.removeItem('usuarioAutenticado'); // Destruye la sesión en el cliente
        window.location.href = '../index.html'; // Redirección
    }
}

// FUNCIONES AUXILIARES (UTILS)
function generarId() {
    // Genera un ID alfanumérico aleatorio (Base 36 utiliza 0-9 y a-z)
    return Math.random().toString(36).substr(2, 9);
}

function formatearFecha(fecha) {
    // Convierte el string ISO a un objeto Date y aplica formato local español
    return new Date(fecha).toLocaleDateString('es-ES');
}