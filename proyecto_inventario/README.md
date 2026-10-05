# API de Inventario y Ventas

API REST para administrar **usuarios, productos, inventario y ventas**, construida con Node.js, Express y MySQL, con autenticación JWT y pensada para ser consumida desde una app Android (Kotlin + Retrofit).

## Tecnologías

Node.js (CommonJS) · Express 4 · MySQL con `mysql2/promise` · `jsonwebtoken` · `bcryptjs` · `cors` · `dotenv` · `morgan` · `nodemon` (desarrollo).

## Requisitos

- Node.js 18 o superior
- MySQL 8 (o MariaDB 10.5+)

## Instalación

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
```

Edita `.env` con tus datos reales (este archivo **no** se sube a Git):

| Variable | Descripción |
|---|---|
| `PORT` | Puerto de la API (por defecto 3000) |
| `DB_HOST`, `DB_PORT` | Servidor MySQL |
| `DB_USER`, `DB_PASSWORD` | Credenciales de MySQL |
| `DB_NAME` | Base de datos (`gestion_inventario`) |
| `JWT_SECRET` | Secreto largo y aleatorio para firmar los tokens |
| `JWT_EXPIRES_IN` | Duración del token (por defecto `8h`) |

Si falta alguna de `DB_HOST`, `DB_USER`, `DB_NAME` o `JWT_SECRET`, el servidor no arranca y te indica cuál.

## Configuración de MySQL

1. Crea la base y los datos de ejemplo. Usa `database/bdGestionInventario.corregido.sql`: es tu script original con los errores de sintaxis corregidos (SELECT sueltos sin `;`, un INSERT sin `VALUES`). Los datos no cambian.
2. Crea la tabla `ventas` con la migración (no modifica ninguna tabla existente):

```bash
mysql -u TU_USUARIO -p --default-character-set=utf8mb4 < database/bdGestionInventario.corregido.sql
mysql -u TU_USUARIO -p --default-character-set=utf8mb4 < database/migracion_ventas.sql
```

> `ventas` usa `ON DELETE RESTRICT` (no `CASCADE`): la propia base de datos también impide borrar usuarios o productos con ventas.

### Contraseñas de los usuarios de ejemplo

- `maria.lopez@empresa.com` tiene la contraseña en texto plano (`maria.lopez1234`). Puede iniciar sesión y **en ese primer login se migra automáticamente a bcrypt**.
- Los demás usuarios tienen un hash `$2a$12$eImi…` **truncado** (un bcrypt válido mide 60 caracteres), así que ninguna contraseña los autentica. Asígnales una:

```bash
node scripts/reset-password.js carlos.gomez@empresa.com MiClave123
```

## Ejecución

```bash
npm run dev     # desarrollo, con nodemon (reinicia al guardar)
npm start       # producción
npm test        # pruebas de integración (ver advertencia abajo)
```

Comprueba que funciona: `GET http://localhost:3000/` → `{"message":"API funcionando correctamente"}`.

> **Pruebas:** `npm test` crea y modifica datos (usuarios, productos, ventas). Ejecútalo contra una base de **pruebas**, no contra tus datos reales.

## Estructura del proyecto

```text
proyecto_inventario/
├── src/
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── auth/       RegisterUser.js, LoginUser.js
│   │   │   ├── users/      GetUsers.js, GetUserById.js, UpdateUser.js, DeleteUser.js
│   │   │   ├── products/   CreateProduct.js, GetProducts.js, GetProductById.js, UpdateProduct.js, DeleteProduct.js
│   │   │   └── sales/      CreateSale.js, GetSales.js, GetSaleById.js, UpdateSale.js, DeleteSale.js
│   │   └── validation/     validators.js, productValidator.js
│   ├── domain/
│   │   ├── entities/       User.js, Product.js, Sale.js
│   │   ├── errors/         AppError.js
│   │   └── repositories/   IUserRepository.js, IProductRepository.js, ISaleRepository.js
│   ├── infrastructure/
│   │   ├── database/       mysql.js
│   │   ├── repositories/   UserRepository.js, ProductRepository.js, SaleRepository.js
│   │   └── services/       TokenService.js, PasswordService.js
│   ├── interfaces/
│   │   ├── controllers/    AuthController.js, UserController.js, ProductController.js, SaleController.js
│   │   ├── middlewares/    authMiddleware.js, asyncHandler.js, errorHandler.js
│   │   └── routes/         authRoutes.js, userRoutes.js, productRoutes.js, saleRoutes.js
│   ├── container.js        raíz de composición (conecta repositorios, casos de uso y controllers)
│   ├── app.js
│   └── server.js
├── database/               bdGestionInventario.corregido.sql, migracion_ventas.sql
├── scripts/                reset-password.js
├── tests/                  api.test.js
├── docs/                   ANDROID.md
├── .env.example · .gitignore · package.json · README.md
```

## Arquitectura

Clean Architecture simplificada. Las dependencias apuntan hacia adentro y **no hay SQL fuera de los repositorios**, ni lógica de negocio en rutas o controllers:

```text
HTTP Request → Route → Middleware → Controller → Use Case → Repository → MySQL → ... → JSON
```

Las ventas usan `repository.transaction(work)`: el repositorio abre/confirma/revierte la transacción y expone operaciones SQL simples; **las reglas de negocio (stock, total, permisos) viven en los casos de uso**.

## Contrato de datos (nombres canónicos = los de la base de datos)

| Entidad | Campos |
|---|---|
| Usuario | `id_usuario`, `nombre`, `email`, `rol` (`admin` \| `empleado`), `activo`, `creado_en` (nunca `password`) |
| Producto | `id_producto`, `codigo_barras`, `nombre`, `descripcion`, `precio_compra`, `precio_venta`, `stock_actual`, `stock_minimo`, `id_categoria`, `categoria`, `id_proveedor`, `proveedor`, `creado_en` |
| Venta | `id_venta`, `fecha_venta`, `cantidad`, `total_venta`, `id_usuario`, `nombre_usuario`, `id_producto`, `nombre_producto` |

**Forma de las respuestas** (pensada para Retrofit/Gson):

- Listas → arreglo JSON plano (`List<T>`). Un recurso → objeto plano. `POST` → `201` con el recurso creado. `PUT` → `200` con el recurso actualizado. `DELETE` → `200` con `{ "message": ... }`.
- Login → `{ "message", "token", "user" }`. Registro → `{ "message", "user" }`.
- Errores → siempre `{ "message": "..." }`.

## Endpoints

Todos requieren `Authorization: Bearer <token>`, excepto `GET /`, `POST /api/auth/register` y `POST /api/auth/login`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Prueba de conexión |
| POST | `/api/auth/register` | Registro público (rol fijo `empleado`) |
| POST | `/api/auth/login` | Inicio de sesión |
| GET | `/api/auth/me` | Usuario autenticado |
| GET / GET :id / PUT :id / DELETE :id | `/api/users` | Usuarios |
| GET / GET :id / POST / PUT :id / DELETE :id | `/api/products` | Productos (filtros `?categoria=` y `?nombre=`, combinables, coincidencia parcial) |
| GET / GET :id / POST / PUT :id / DELETE :id | `/api/sales` | Ventas |

### Ejemplos

**Registro**

```http
POST /api/auth/register
{ "nombre": "Juan Perez", "email": "juan@example.com", "password": "123456" }
```
```json
201 { "message": "Usuario registrado exitosamente",
      "user": { "id_usuario": 21, "nombre": "Juan Perez", "email": "juan@example.com", "rol": "empleado", "activo": true, "creado_en": "2026-10-03T22:36:46.000Z" } }
```

**Login**

```http
POST /api/auth/login
{ "email": "juan@example.com", "password": "123456" }
```
```json
200 { "message": "Inicio de sesión exitoso", "token": "eyJhbGciOi...", "user": { "id_usuario": 21, "nombre": "Juan Perez", "email": "juan@example.com", "rol": "empleado", "activo": true, "creado_en": "..." } }
```

**Crear producto** (`id_categoria` obligatorio; `precio_compra`, `stock_minimo`, `id_proveedor`, `codigo_barras` opcionales)

```http
POST /api/products
{ "nombre": "Laptop Lenovo", "descripcion": "Laptop empresarial", "precio_venta": 2500000, "stock_actual": 10, "id_categoria": 1 }
```

**Filtrar productos**

```http
GET /api/products?categoria=Tecnologia&nombre=Laptop
```
La búsqueda ignora tildes y mayúsculas, y los caracteres `%` y `_` se buscan literalmente.

**Crear venta** (el cliente **no** envía `total_venta`; si lo envía, se ignora)

```http
POST /api/sales
{ "cantidad": 2, "id_producto": 2 }
```
```json
201 { "id_venta": 7, "fecha_venta": "2026-10-03T22:40:00.000Z", "cantidad": 2, "total_venta": 1240,
      "id_usuario": 21, "nombre_usuario": "Juan Perez", "id_producto": 2, "nombre_producto": "Laptop HP 15-DW" }
```
`id_usuario` es opcional: por defecto es el usuario del token.

**Errores**

```json
409 { "message": "No hay inventario suficiente para esta venta" }
409 { "message": "No se puede eliminar el producto porque tiene ventas asociadas" }
404 { "message": "Producto no encontrado" }
```

### Códigos HTTP

`200` OK · `201` creado · `400` datos inválidos · `401` sin token / token inválido o expirado / credenciales incorrectas · `403` sin permiso · `404` no existe · `409` conflicto (stock insuficiente, correo duplicado, eliminación con datos asociados) · `413` cuerpo demasiado grande · `500` error interno · `503` base de datos no disponible.

## Autenticación

- El token JWT contiene `id_usuario`, `email` y `rol`, y dura `JWT_EXPIRES_IN` (8 h por defecto).
- Se envía en cada petición protegida: `Authorization: Bearer <token>`.
- Token ausente, mal formado, inválido o expirado → `401` (el mensaje distingue "expirado").
- Credenciales incorrectas y correo inexistente devuelven el **mismo** mensaje para no revelar qué correos existen.
- Un usuario con `activo = false` recibe `403` al iniciar sesión.

### Permisos por rol

La especificación pide solo autenticación en estas rutas; se añadieron estas restricciones mínimas:

- `PUT /api/users/:id`: un `empleado` solo edita su propio perfil y no puede cambiar `rol` ni `activo`.
- `DELETE /api/users/:id`: solo `admin`.
- Ventas: un `empleado` solo vende a su nombre y solo modifica o elimina sus propias ventas; un `admin` puede todo.

## Reglas de inventario y ventas

- El stock **nunca** queda negativo: se valida con la fila bloqueada (`SELECT ... FOR UPDATE`) y además el `UPDATE` exige `stock_actual + delta >= 0`.
- `total_venta = precio_venta × cantidad`, calculado en el backend (en centavos enteros) con el precio guardado en MySQL.
- **Crear:** valida cantidad, usuario y producto → transacción → bloquea el producto → verifica stock → inserta la venta → descuenta stock → registra un movimiento `SALIDA` → `COMMIT`. Cualquier fallo hace `ROLLBACK`.
- **Actualizar** (`cantidad`, `id_producto` y, solo admin, `id_usuario`):
  - Misma cantidad y producto: no cambia stock ni total.
  - Aumenta la cantidad: se descuentan solo las unidades adicionales.
  - Disminuye la cantidad: se devuelven las unidades sobrantes.
  - Cambia el producto: se restaura el anterior, se descuenta el nuevo y el total se recalcula con el precio del nuevo producto.
  - Si cambia la cantidad, el total se recalcula con el **precio actual** del producto.
  - Todo en una única transacción.
- **Eliminar:** restaura al inventario las unidades vendidas y borra la venta, en una transacción.
- Cada operación sobre ventas deja su movimiento (`ENTRADA`/`SALIDA`) en `movimientos_inventario`, con la nota `Venta #id`.
- **No se puede eliminar** un usuario o producto con ventas (`409`), ni con movimientos de inventario asociados, aunque la base tenga `ON DELETE CASCADE` en `movimientos_inventario`. Esto preserva el historial.
- El CRUD de productos (`POST`/`PUT`) **no** genera movimientos de inventario; solo las ventas lo hacen. Un `PUT` con `stock_actual` es una corrección manual.

## Conectar la app Android

La URL base se configura **solo en la app** (`RetrofitClient.BASE_URL`); el backend no depende de ninguna IP.

| Dónde corre la app | URL base |
|---|---|
| **Emulador de Android Studio** | `http://10.0.2.2:3000/` (`10.0.2.2` es el alias del emulador hacia el `localhost` de tu computador) |
| **Celular físico** | `http://IP_LOCAL_DE_TU_PC:3000/` |

Para el celular físico:

1. Conecta el celular y el computador a la **misma red Wi-Fi**.
2. Averigua la IP local del computador: `ipconfig` (Windows, "Dirección IPv4") o `ifconfig` / `ip a` (macOS/Linux). Suele ser `192.168.x.x`.
3. Permite el puerto 3000 en el firewall si la conexión se rechaza.
4. Si tu IP cambia (DHCP), actualiza la URL base y el dominio en `network_security_config.xml`.

`localhost` dentro del emulador o del celular apunta al propio dispositivo, **no** a tu computador. Como la API usa HTTP sin cifrar en desarrollo, la app necesita `android:usesCleartextTraffic="true"` y `network_security_config.xml` con tus dominios (como indica la guía).

Modelos, `ApiService` y el mapeo entre la guía y esta API: ver [`docs/ANDROID.md`](docs/ANDROID.md).

## Seguridad

- Las contraseñas se guardan con bcrypt y **nunca** se devuelven ni se registran (morgan solo registra método y URL).
- Los secretos solo viven en `.env` (ignorado por Git); `.env.example` solo trae placeholders.
- Todas las consultas están parametrizadas.
- Las respuestas de error no exponen SQL ni stack traces.

## Auditoría del backend original

| Tipo | Hallazgo | Qué se hizo |
|---|---|---|
| Bug real | `GET /api/products` era público | Ahora exige token |
| Bug real | Token inválido o expirado devolvía `403` | Ahora `401`, con mensaje distinto para "expirado" |
| Bug real | El login devolvía `401` ante cualquier error (incluso MySQL caído) | `401` solo por credenciales; el resto usa su código real (`503`, `500`) |
| Seguridad | Contraseña comparada en texto plano; mensajes distintos para correo y contraseña | bcrypt con migración transparente; mensaje único |
| Seguridad | Hashes truncados aceptaban como contraseña el propio texto del hash | Un valor que empieza por `$2` pero no es bcrypt válido nunca autentica |
| Arquitectura | Repositorios instanciados en cada request | Raíz de composición `container.js` |
| Cambio de comportamiento | Listado de productos devolvía `{message, data}` y errores `{error}` | Arreglo plano y `{message}`, compatible con `Response<List<T>>` de Retrofit |
| Cambio de comportamiento | Archivos con otros nombres (`MySQLProductRepository`, `AuthService`, `connection.js`...) | Renombrados a la estructura pedida; `UserEntity`→`User`, etc. |
