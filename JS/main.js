
// API URL - Asegúrate de que json-server esté corriendo en puerto 3000
const API_URL = 'http://localhost:3000';

// Seleccionar elementos del DOM
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signInBtn = document.getElementById('signInBtn');

// Verificar si el usuario ya está autenticado
window.addEventListener('load', () => {
    const usuarioAutenticado = localStorage.getItem('usuarioAutenticado');
    if (usuarioAutenticado) {
        // Redirigir a la página principal o dashboard
        window.location.href = '../admin-dashboard.html';
    }
});

// Escuchar el envío del formulario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validar que los campos no estén vacíos
    if (!email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }

    // Cambiar estado del botón
    signInBtn.disabled = true;
    signInBtn.textContent = 'Iniciando sesión...';

    try {
        // Buscar el usuario por email
        const response = await fetch(`${API_URL}/usuarios?email=${email}`);
        const usuarios = await response.json();

        if (usuarios.length === 0) {
            alert('Email no registrado');
            signInBtn.disabled = false;
            signInBtn.textContent = 'Sign In';
            return;
        }

        const usuario = usuarios[0];

        // Verificar contraseña
        if (usuario.password !== password) {
            alert('Contraseña incorrecta');
            signInBtn.disabled = false;
            signInBtn.textContent = 'Sign In';
            return;
        }

        // Login exitoso - Guardar sesión
        const usuarioSesion = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            timestamp: new Date().getTime()
        };

        localStorage.setItem('usuarioAutenticado', JSON.stringify(usuarioSesion));

        alert('¡Bienvenido ' + usuario.nombre + '!');

        // Limpiar formulario
        loginForm.reset();

        // Redirigir según rol
        setTimeout(() => {
            if (usuario.rol === 'admin') {
                window.location.href = '../admin-dashboard.html';
            } else {
                window.location.href = '../dashboard.html';
            }
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Asegúrate de que json-server esté corriendo.');
        signInBtn.disabled = false;
        signInBtn.textContent = 'Sign In';
    }
});

// Función para cerrar sesión (usa esto en otras páginas)
function cerrarSesion() {
    localStorage.removeItem('usuarioAutenticado');
    window.location.href = '../index.html';
}

// Función para obtener usuario autenticado
function obtenerUsuarioAutenticado() {
    const usuarioSesion = localStorage.getItem('usuarioAutenticado');
    return usuarioSesion ? JSON.parse(usuarioSesion) : null;
}
