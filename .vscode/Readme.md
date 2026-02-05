1. Descripción del Proyecto
Este es un sistema de gestión de tareas desarrollado como una Single Page Application (SPA). El proyecto permite a los usuarios registrarse, iniciar sesión y gestionar sus tareas personales. Incluye un panel administrativo robusto donde un usuario con rol admin puede supervisar a todos los usuarios, ver estadísticas globales y gestionar la integridad de los datos.

El sistema destaca por su seguridad basada en roles y la persistencia de datos mediante una API REST simulada.

2. Tecnologías y Lenguajes Aplicados
HTML5: Estructura semántica para todas las vistas (Login, Registro, Dashboards, Perfil).

CSS3: Estilos personalizados organizados por módulos (Administración, Usuarios, Estilos globales).

JavaScript (Vanilla ES6+): Lógica de negocio, manipulación del DOM y gestión de estados.

JSON Server: Simulación de Backend y base de datos NoSQL.

Fetch API: Comunicación asíncrona con el servidor.

LocalStorage: Persistencia de sesión en el navegador.

3. Estructura del Proyecto
Basado en la arquitectura del sistema, el proyecto se organiza de la siguiente manera:

EXAM JAVASCRIPT/
├── .vscode/             # Configuraciones del editor
├── data/
│   └── db.json          # "Base de datos" (Usuarios y Tareas)
├── JS/                  # Lógica de programación
│   ├── admin-dashboard.js
│   ├── dashboard.js
│   ├── main.js
│   ├── profile.js
│   ├── redirection.js
│   └── Register.js
├── STYLES/              # Hojas de estilo CSS
│   ├── admin-dashboard.css
│   ├── dashboard.css
│   ├── profile.css
│   └── styles.css
├── admin-dashboard.html # Vista exclusiva para Admins
├── dashboard.html       # Vista para Usuarios estándar
├── index.html           # Punto de entrada y Login
├── profile.html         # Gestión de perfil de usuario
└── register.html        # Formulario de registro de nuevos usuarios

4. Cómo Correr el Sistema
Requisitos Previos:
Tener instalado Node.js y el gestor de paquetes npm.

Pasos:
Instalar JSON Server (si no lo tienes):

npm install -g json-server

json-server --watch data/db.json --port 3000

Lanzar la aplicación: Abre el archivo index.html con la extensión Live Server de VS Code o simplemente arrastra el archivo al navegador.

5. Conceptos Técnicos Implementados
[!NOTE] Aquí se incluye el contenido que ya tienes sobre JSON Server, Async/Await, Métodos HTTP, JWT y Protección de rutas.

5.1 Protección de Rutas (Ejemplo en este proyecto)
En este sistema, se implementó una lógica de redirección automática:

Si un usuario intenta entrar a admin-dashboard.html sin ser admin, es redirigido a su dashboard personal.

Si no hay sesión iniciada, cualquier intento de acceso a las páginas internas redirige al index.html.

JSON SERVER, ASYNC/AWAIT, PROMESAS, MÉTODOS HTTP, JWT Y PROTECCIÓN DE RUTAS (SPA)

Explicación detallada en JavaScript



==================================================



1) JSON SERVER



QUÉ ES

JSON Server es una herramienta que permite crear una API REST falsa (mock) a partir de un archivo JSON, sin necesidad de programar un backend real.



Tú defines un archivo `db.json` con datos y JSON Server:

- Levanta un servidor HTTP

- Crea endpoints REST automáticamente

- Permite hacer operaciones CRUD reales



Normalmente corre en:

http://localhost:3000



PARA QUÉ SIRVE

- Prototipar front-end rápidamente

- Practicar fetch y CRUD

- Simular un backend mientras el backend real no existe

- Probar lógica de SPA sin depender del servidor



CÓMO SE IMPLEMENTA



Instalación:

npm install -g json-server



Archivo db.json:

{

  "users": [

    { "id": 1, "name": "Juan", "role": "admin" }

  ],

  "posts": [

    { "id": 1, "title": "Hola", "userId": 1 }

  ]

}



Ejecutar:

json-server --watch db.json --port 3000



Rutas generadas:

GET /users

GET /users/1

POST /users

PUT /users/1

PATCH /users/1

DELETE /users/1



==================================================



2) PROMESAS, ASYNC Y AWAIT



JavaScript es no bloqueante. Muchas operaciones toman tiempo, por eso usa asincronía.



PROMESAS

Una Promesa representa un valor futuro.

Estados: pending, fulfilled, rejected.



Ejemplo:

fetch(url)

  .then(res => res.json())

  .then(data => console.log(data))

  .catch(err => console.error(err));



ASYNC / AWAIT

Forma moderna y legible de manejar promesas.



Ejemplo:

async function loadUsers() {

  try {

    const res = await fetch("/users");

    const data = await res.json();

    console.log(data);

  } catch (err) {

    console.error(err);

  }

}



==================================================



3) MÉTODOS HTTP



GET: Obtiene datos

POST: Crea datos

PUT: Reemplaza datos

PATCH: Actualiza parcialmente

DELETE: Elimina datos



Códigos comunes:

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

500 Internal Server Error



==================================================



4) JWT (JSON WEB TOKEN)



JWT es un token de autenticación.

Formato: header.payload.signature



No está encriptado, solo firmado.



Se usa para:

- Autenticación

- Autorización

- SPAs con APIs



Ejemplo de uso:

Authorization: Bearer TOKEN



==================================================



5) PROTECCIÓN DE RUTAS EN SPA



Evita que usuarios no autenticados accedan a vistas privadas.



Niveles:

- Frontend (UX)

- Backend (seguridad real)



Ejemplo:

function isAuthenticated() {

  return Boolean(localStorage.getItem("accessToken"));

}



==================================================



FIN DEL DOCUMENTO