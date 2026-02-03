// API URL - Asegúrate de que json-server esté corriendo en puerto 3000
const API_URL = 'http://localhost:3000';

// Seleccionar elementos del DOM
const registerForm = document.getElementById('registerForm');
const nombreInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const signBtn = document.getElementById('signBtn');

// Escuchar el envío del formulario
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores
    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Validar que los campos no estén vacíos
    if (!nombre || !email || !password) {
        alert('Por favor, completa todos los campos');
        return;
    }

    // Validar formato de email
    if (!validarEmail(email)) {
        alert('Por favor, ingresa un email válido');
        return;
    }

    // Validar que la contraseña tenga al menos 8 caracteres
    if (password.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres');
        return;
    }

    try {
        // Verificar si el email ya existe
        const usuarioExistente = await fetch(`${API_URL}/usuarios?email=${email}`);
        const usuarios = await usuarioExistente.json();

        if (usuarios.length > 0) {
            alert('El email ya está registrado');
            return;
        }

        // Crear nuevo usuario
        const nuevoUsuario = {
            id: generarId(),
            nombre: nombre,
            email: email,
            password: password, // En producción, NUNCA guardes contraseñas en texto plano
            rol: 'usuario',
            fechaRegistro: new Date().toISOString()
        };

        // Enviar al servidor
        const response = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevoUsuario)
        });

        if (response.ok) {
            alert('¡Registro exitoso! Redirigiendo al login...');
            // Limpiar formulario
            registerForm.reset();
            // Redirigir al login después de 1.5 segundos
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            alert('Error al registrar. Intenta de nuevo.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Asegúrate de que json-server esté corriendo.');
    }
});

// Función para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para generar un ID único
function generarId() {
    return Math.random().toString(36).substr(2, 9);
}