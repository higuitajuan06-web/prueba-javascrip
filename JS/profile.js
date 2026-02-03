const API_URL = 'http://localhost:3000';

let usuarioActual = null;

// Dom Elements
const nombreInput = document.getElementById('nombre');
const emailInput = document.getElementById('email');
const passwordActualInput = document.getElementById('passwordActual');
const passwordNuevaInput = document.getElementById('passwordNueva');
const saveBtn = document.getElementById('saveBtn');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const logoutBtn = document.getElementById('logoutBtn');
const totalTareasSpan = document.getElementById('totalTareas');
const tareasCompletadasSpan = document.getElementById('tareasCompletadas');
const tareasPendientesSpan = document.getElementById('tareasPendientes');

// Start
window.addEventListener('load', () => {
    verificarAutenticacion();
    cargarDatos();
    cargarEstadisticas();
    configurarEventos();
});

// Authentifycate
function verificarAutenticacion() {
    const usuarioSesion = localStorage.getItem('usuarioAutenticado');
    if (!usuarioSesion) {
        window.location.href = '../index.html';
        return;
    }
    usuarioActual = JSON.parse(usuarioSesion);
}

// load users date
async function cargarDatos() {
    try {
        const response = await fetch(`${API_URL}/usuarios/${usuarioActual.id}`);
        const usuario = await response.json();

        nombreInput.value = usuario.nombre;
        emailInput.value = usuario.email;
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// load statics
async function cargarEstadisticas() {
    try {
        const response = await fetch(`${API_URL}/tareas?usuarioId=${usuarioActual.id}`);
        const tareas = await response.json();

        const completadas = tareas.filter(t => t.estado === 'completada').length;
        const pendientes = tareas.filter(t => t.estado === 'pendiente').length;

        totalTareasSpan.textContent = tareas.length;
        tareasCompletadasSpan.textContent = completadas;
        tareasPendientesSpan.textContent = pendientes;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// settings events
function configurarEventos() {
    saveBtn.addEventListener('click', guardarCambios);
    deleteAccountBtn.addEventListener('click', eliminarCuenta);
    logoutBtn.addEventListener('click', cerrarSesion);
}

// save changes profile
async function guardarCambios() {
    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const passwordActual = passwordActualInput.value;
    const passwordNueva = passwordNuevaInput.value;

    if (!nombre || !email) {
        alert('Por favor, completa los campos requeridos');
        return;
    }

    try {
        // verify password
        const response = await fetch(`${API_URL}/usuarios/${usuarioActual.id}`);
        const usuario = await response.json();

        if (usuario.password !== passwordActual) {
            alert('Contraseña actual incorrecta');
            return;
        }

        // prepare dates to change
        const datosActualizados = {
            nombre,
            email,
            password: passwordNueva ? passwordNueva : usuario.password,
            rol: usuario.rol,
            fechaRegistro: usuario.fechaRegistro
        };

        // update dates
        const updateResponse = await fetch(`${API_URL}/usuarios/${usuarioActual.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosActualizados)
        });

        if (updateResponse.ok) {
            // update localStorage
            usuarioActual.nombre = nombre;
            usuarioActual.email = email;
            localStorage.setItem('usuarioAutenticado', JSON.stringify(usuarioActual));

            alert('Perfil actualizado exitosamente');
            passwordActualInput.value = '';
            passwordNuevaInput.value = '';
        } else {
            alert('Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// deletecuenta
async function eliminarCuenta() {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return;

    const confirmar = prompt('Escribe tu email para confirmar eliminación:');
    if (confirmar !== usuarioActual.email) {
        alert('Email no coincide');
        return;
    }

    try {
        // delete all tasks user
        const tareasResponse = await fetch(`${API_URL}/tareas?usuarioId=${usuarioActual.id}`);
        const tareas = await tareasResponse.json();

        for (const tarea of tareas) {
            await fetch(`${API_URL}/tareas/${tarea.id}`, { method: 'DELETE' });
        }

        // delete user
        await fetch(`${API_URL}/usuarios/${usuarioActual.id}`, { method: 'DELETE' });

        alert('Cuenta eliminada. Redirigiendo...');
        localStorage.removeItem('usuarioAutenticado');
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar cuenta');
    }
}

// close account
function cerrarSesion() {
    if (confirm('¿Cerrar sesión?')) {
        localStorage.removeItem('usuarioAutenticado');
        window.location.href = '../index.html';
    }
}