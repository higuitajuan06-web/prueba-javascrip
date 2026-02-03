========================================
DESCRIPCION GENERAR DE EL FUNCIONAMIENTO DE EL PROYECTO.

1.





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

