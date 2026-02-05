// Endpoint global para la comunicación con el servidor de datos
const API_URL = 'http://localhost:3000';

// ESTADO GLOBAL DEL ADMINISTRADOR
let usuarioActual = null; // Datos del admin logueado
let usuarios = [];        // Colección completa de usuarios del sistema
let tareas = [];          // Colección de todas las tareas de todos los usuarios
let filtroTareasActual = 'todas'; // Estado de filtrado para la tabla de supervisión

// ELEMENTOS DEL DOM (VISTA)
const adminNameSpan = document.getElementById('adminName');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarBtns = document.querySelectorAll('.menu-btn'); // Botones de navegación lateral
const adminSections = document.querySelectorAll('.admin-section'); // Contenedores de vistas
const filterBtns = document.querySelectorAll('.filter-btn');
const searchUsuariosInput = document.getElementById('searchUsuarios');

// CICLO DE VIDA: Inicialización al cargar la ventana
window.addEventListener('load', () => {
    verificarAutenticacion(); // Middleware de seguridad
    cargarDatos();           // Carga masiva de datos (Promesas en paralelo)
    configurarEventos();      // Listeners de interacción
});

// MIDDLEWARE DE SEGURIDAD: Control de acceso por Rol
function verificarAutenticacion() {
    const usuarioSesion = localStorage.getItem('usuarioAutenticado');
    
    // 1. Verificación de existencia de sesión
    if (!usuarioSesion) {
        window.location.href = '../index.html';
        return;
    }
    usuarioActual = JSON.parse(usuarioSesion);

    // 2. Verificación de Autorización: Solo el rol 'admin' puede continuar
    if (usuarioActual.rol !== 'admin') {
        alert('Acceso denegado. Solo administradores pueden acceder.');
        window.location.href = './dashboard.html'; // Redirige al dashboard de usuario normal
        return;
    }

    adminNameSpan.textContent = usuarioActual.nombre;
}

// CARGA DE DATOS MULTI-FUENTE (Optimización asíncrona)
async function cargarDatos() {
    try {
        // Promise.all: Ejecuta ambas peticiones simultáneamente para ahorrar tiempo de carga
        const [usuariosRes, tareasRes] = await Promise.all([
            fetch(`${API_URL}/usuarios`),
            fetch(`${API_URL}/tareas`)
        ]);

        usuarios = await usuariosRes.json();
        tareas = await tareasRes.json();

        // Orquestación de renderizado tras recibir los datos
        actualizarDashboard(); // Estadísticas numéricas
        renderizarUsuarios();  // Lista de gestión de usuarios
        renderizarTareas();    // Tabla de supervisión de tareas
        cargarActividad();     // Feed de actividades recientes
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// GESTIÓN DE EVENTOS Y FILTROS
function configurarEventos() {
    // Navegación Single Page (SPA): Cambia secciones sin recargar
    sidebarBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section; // Obtiene el ID de la sección desde el atributo data
            mostrarSeccion(section);
        });
    });

    // Filtros de estado de tareas
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filtroTareasActual = e.target.dataset.filter;
            renderizarTareas();
        });
    });

    // Búsqueda de usuarios por coincidencia de texto (Email o Nombre)
    searchUsuariosInput.addEventListener('input', (e) => {
        const termino = e.target.value.toLowerCase();
        const usuariosFiltrados = usuarios.filter(u =>
            u.nombre.toLowerCase().includes(termino) ||
            u.email.toLowerCase().includes(termino)
        );
        mostrarUsuariosEnTabla(usuariosFiltrados);
    });

    logoutBtn.addEventListener('click', cerrarSesion);
}

// CONTROL DE VISTAS (Switching)
function mostrarSeccion(seccion) {
    sidebarBtns.forEach(btn => btn.classList.remove('active'));
    adminSections.forEach(sec => sec.classList.remove('active'));

    // Activa el botón clickeado y la sección correspondiente
    event.target.classList.add('active');
    document.getElementById(seccion).classList.add('active');
}

// PROCESAMIENTO DE ESTADÍSTICAS (BI - Business Intelligence)
function actualizarDashboard() {
    const totalUsuarios = usuarios.filter(u => u.rol === 'usuario').length;
    const totalTareas = tareas.length;
    const tareasCompletadas = tareas.filter(t => t.estado === 'completada').length;
    
    // Cálculo de KPI (Key Performance Indicator)
    const tasaCompletitud = totalTareas > 0 ? Math.round((tareasCompletadas / totalTareas) * 100) : 0;

    document.getElementById('totalUsuarios').textContent = totalUsuarios;
    document.getElementById('totalTareas').textContent = totalTareas;
    document.getElementById('tareasCompletadas').textContent = tareasCompletadas;
    document.getElementById('tasaCompletitud').textContent = tasaCompletitud + '%';
}

// GESTIÓN DE TABLA DE USUARIOS
function renderizarUsuarios() {
    mostrarUsuariosEnTabla(usuarios);
}

function mostrarUsuariosEnTabla(usuariosList) {
    const tbody = document.getElementById('usuariosTableBody');
    // Filtro de seguridad: El admin no puede borrarse a sí mismo desde la tabla
    const usuariosNoAdmin = usuariosList.filter(u => u.rol !== 'admin');

    if (usuariosNoAdmin.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No hay usuarios</td></tr>';
        return;
    }

    tbody.innerHTML = usuariosNoAdmin.map(usuario => `
    <tr>
        <td>${usuario.id}</td>
        <td>${usuario.nombre}</td>
        <td>${usuario.email}</td>
        <td><span class="badge">${usuario.rol}</span></td>
        <td>${formatearFecha(usuario.fechaRegistro)}</td>
        <td>
            <button class="btn-info" onclick="verTareasUsuario('${usuario.id}', '${usuario.nombre}')">Ver Tareas</button>
            <button class="btn-danger" onclick="eliminarUsuarioAdmin('${usuario.id}')">Eliminar</button>
        </td>
    </tr>`).join('');
}

// SUPERVISIÓN DE TAREAS GLOBALES
function renderizarTareas() {
    const tareasFiltradas = tareas.filter(tarea => {
        if (filtroTareasActual === 'todas') return true;
        return tarea.estado === filtroTareasActual;
    });

    const tbody = document.getElementById('tareasTableBody');

    tbody.innerHTML = tareasFiltradas.map(tarea => {
        // Cruce de datos: Busca el nombre del usuario dueño de la tarea mediante el ID
        const usuario = usuarios.find(u => u.id === tarea.usuarioId);
        return `
        <tr>
            <td>${tarea.titulo}</td>
            <td>${usuario ? usuario.nombre : 'Desconocido'}</td>
            <td><span class="badge estado-${tarea.estado}">${tarea.estado}</span></td>
            <td><span class="badge prioridad-${tarea.prioridad}">${tarea.prioridad}</span></td>
            <td>${formatearFecha(tarea.fechaEntrega)}</td>
            <td><button class="btn-info" onclick="verDetallesTarea('${tarea.id}')">Ver</button></td>
        </tr>`;
    }).join('');
}

// LOG DE ACTIVIDAD RECIENTE
async function cargarActividad() {
    const actividadList = document.getElementById('actividadList');
    const actividades = [];

    // Muestra solo las últimas 10 tareas creadas (slice)
    tareas.slice(-10).forEach(tarea => {
        const usuario = usuarios.find(u => u.id === tarea.usuarioId);
        actividades.push({
            mensaje: `${usuario?.nombre || 'Usuario'} creó la tarea "${tarea.titulo}"`,
            fecha: tarea.fechaCreacion
        });
    });

    // Ordenamiento cronológico descendente (lo más nuevo primero)
    actividadList.innerHTML = actividades
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map(act => `
        <div class="activity-item">
            <span class="activity-message">${act.mensaje}</span>
            <span class="activity-date">${formatearFecha(act.fecha)}</span>
        </div>`).join('');
}

// ELIMINACIÓN EN CASCADA (Función Crítica)
async function eliminarUsuarioAdmin(usuarioId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario y todas sus tareas?')) return;

    try {
        // 1. Limpieza de base de datos: Borra todas las tareas asociadas al usuarioId
        const tareasUsuario = tareas.filter(t => t.usuarioId === usuarioId);
        for (const tarea of tareasUsuario) {
            await fetch(`${API_URL}/tareas/${tarea.id}`, { method: 'DELETE' });
        }

        // 2. Eliminación del recurso principal: El usuario
        await fetch(`${API_URL}/usuarios/${usuarioId}`, { method: 'DELETE' });

        alert('Usuario eliminado');
        cargarDatos(); // Recarga todo el dashboard para actualizar cifras
    } catch (error) {
        console.error('Error:', error);
    }
}

function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('usuarioAutenticado');
        window.location.href = '../index.html';
    }
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}