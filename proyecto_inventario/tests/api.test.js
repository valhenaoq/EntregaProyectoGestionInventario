// Pruebas de integración. Requieren MySQL con la base cargada y la tabla `ventas`.
// IMPORTANTE: crean y modifican datos; ejecútalas contra una base de PRUEBAS (DB_NAME en .env).
require('dotenv').config();

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const app = require('../src/app');
const pool = require('../src/infrastructure/database/mysql');
const PasswordService = require('../src/infrastructure/services/PasswordService');

const RUN = Date.now();
const PASSWORD = 'clave123';
const email = (name) => `${name}.${RUN}@test.com`;

let server;
let baseUrl;
let empleado; // { token, user }
let otroEmpleado;
let admin;

const api = async (method, path, { body, token } = {}) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
};

const registerAndLogin = async (name, rol) => {
    const reg = await api('POST', '/api/auth/register', { body: { nombre: name, email: email(name), password: PASSWORD } });
    assert.equal(reg.status, 201);
    if (rol === 'admin') {
        await pool.query('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', ['admin', reg.body.user.id_usuario]);
    }
    const login = await api('POST', '/api/auth/login', { body: { email: email(name), password: PASSWORD } });
    assert.equal(login.status, 200);
    return { token: login.body.token, user: login.body.user };
};

const createProduct = async (overrides = {}) => {
    const res = await api('POST', '/api/products', {
        token: admin.token,
        body: {
            nombre: `Producto test ${RUN} ${Math.random().toString(36).slice(2, 7)}`,
            descripcion: 'Producto de prueba',
            precio_venta: 100.5,
            precio_compra: 50,
            stock_actual: 10,
            id_categoria: 1,
            ...overrides
        }
    });
    assert.equal(res.status, 201, JSON.stringify(res.body));
    return res.body;
};

const stockOf = async (id) => (await api('GET', `/api/products/${id}`, { token: admin.token })).body.stock_actual;
const countSales = async (id_producto) => {
    const [rows] = await pool.query('SELECT COUNT(*) AS n FROM ventas WHERE id_producto = ?', [id_producto]);
    return rows[0].n;
};

before(async () => {
    server = app.listen(0);
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    empleado = await registerAndLogin('empleado');
    otroEmpleado = await registerAndLogin('otro');
    admin = await registerAndLogin('admin', 'admin');
});

after(async () => {
    server.close();
    await pool.end();
});

describe('Conexión', () => {
    it('GET / responde que la API funciona', async () => {
        const res = await api('GET', '/');
        assert.equal(res.status, 200);
        assert.equal(res.body.message, 'API funcionando correctamente');
    });

    it('ruta inexistente responde 404', async () => {
        assert.equal((await api('GET', '/api/tasks')).status, 404);
    });
});

describe('Autenticación', () => {
    it('registro: no devuelve password y fuerza rol empleado aunque se envíe admin', async () => {
        const res = await api('POST', '/api/auth/register', {
            body: { nombre: 'Intruso', email: email('intruso'), password: PASSWORD, rol: 'admin' }
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.user.rol, 'empleado');
        assert.equal(JSON.stringify(res.body).includes('password'), false);
    });

    it('registro: correo duplicado -> 409', async () => {
        const res = await api('POST', '/api/auth/register', {
            body: { nombre: 'Dup', email: email('empleado'), password: PASSWORD }
        });
        assert.equal(res.status, 409);
    });

    it('registro: datos inválidos -> 400', async () => {
        assert.equal((await api('POST', '/api/auth/register', { body: { email: 'a@b.com', password: PASSWORD } })).status, 400);
        assert.equal((await api('POST', '/api/auth/register', { body: { nombre: 'X', email: 'no-es-correo', password: PASSWORD } })).status, 400);
        assert.equal((await api('POST', '/api/auth/register', { body: { nombre: 'X', email: 'x@y.com', password: '123' } })).status, 400);
        assert.equal((await api('POST', '/api/auth/register', { body: { nombre: 'X', email: 'x@y.com' } })).status, 400);
    });

    it('login correcto devuelve token y usuario sin password', async () => {
        const res = await api('POST', '/api/auth/login', { body: { email: email('empleado'), password: PASSWORD } });
        assert.equal(res.status, 200);
        assert.ok(res.body.token);
        assert.equal(res.body.user.email, email('empleado'));
        assert.equal(JSON.stringify(res.body).includes('password'), false);
    });

    it('login: contraseña incorrecta y correo inexistente dan el mismo 401', async () => {
        const wrong = await api('POST', '/api/auth/login', { body: { email: email('empleado'), password: 'incorrecta' } });
        const unknown = await api('POST', '/api/auth/login', { body: { email: 'nadie@nada.com', password: PASSWORD } });
        assert.equal(wrong.status, 401);
        assert.equal(unknown.status, 401);
        assert.equal(wrong.body.message, unknown.body.message);
    });

    it('login con contraseña en texto plano heredada: funciona y se migra a bcrypt', async () => {
        const legacy = email('legacy');
        await pool.query("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Legacy', ?, 'plana123', 'empleado')", [legacy]);
        const res = await api('POST', '/api/auth/login', { body: { email: legacy, password: 'plana123' } });
        assert.equal(res.status, 200);
        const [rows] = await pool.query('SELECT password_hash FROM usuarios WHERE email = ?', [legacy]);
        assert.match(rows[0].password_hash, /^\$2[aby]\$/);
        const again = await api('POST', '/api/auth/login', { body: { email: legacy, password: 'plana123' } });
        assert.equal(again.status, 200);
    });

    it('login con hash bcrypt truncado nunca autentica (ni siquiera con el propio hash)', async () => {
        const truncated = '$2a$12$eImiTXuWVxfM37uY4JANk';
        const broken = email('roto');
        await pool.query("INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ('Roto', ?, ?, 'empleado')", [broken, truncated]);
        assert.equal((await api('POST', '/api/auth/login', { body: { email: broken, password: truncated } })).status, 401);
        assert.equal((await api('POST', '/api/auth/login', { body: { email: broken, password: PASSWORD } })).status, 401);
    });

    it('login de usuario inactivo -> 403', async () => {
        const inactive = email('inactivo');
        await pool.query('INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, FALSE)',
            ['Inactivo', inactive, await PasswordService.hash(PASSWORD), 'empleado']);
        assert.equal((await api('POST', '/api/auth/login', { body: { email: inactive, password: PASSWORD } })).status, 403);
    });

    it('GET /api/auth/me devuelve el usuario autenticado', async () => {
        const res = await api('GET', '/api/auth/me', { token: empleado.token });
        assert.equal(res.status, 200);
        assert.equal(res.body.id_usuario, empleado.user.id_usuario);
        assert.equal(JSON.stringify(res.body).includes('password'), false);
    });

    it('token ausente, mal formado, inválido o expirado -> 401', async () => {
        assert.equal((await api('GET', '/api/auth/me')).status, 401);

        const malformed = await fetch(`${baseUrl}/api/auth/me`, { headers: { Authorization: empleado.token } });
        assert.equal(malformed.status, 401);

        assert.equal((await api('GET', '/api/auth/me', { token: 'abc.def.ghi' })).status, 401);

        const expired = jwt.sign({ id_usuario: 1, email: 'x@x.com', rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: -10 });
        const res = await api('GET', '/api/products', { token: expired });
        assert.equal(res.status, 401);
        assert.match(res.body.message, /expirado/i);
    });

    it('todas las rutas de datos exigen token', async () => {
        for (const path of ['/api/users', '/api/products', '/api/sales']) {
            assert.equal((await api('GET', path)).status, 401, path);
        }
    });
});

describe('Productos', () => {
    let producto;

    it('crear producto (201)', async () => {
        producto = await createProduct({ nombre: `Laptop Lenovo ${RUN}`, id_categoria: 1 });
        assert.ok(producto.id_producto);
        assert.equal(producto.categoria, 'Electrónica y Tecnología');
    });

    it('validaciones de creación -> 400', async () => {
        const base = { nombre: 'X', descripcion: 'd', precio_venta: 10, stock_actual: 1, id_categoria: 1 };
        const bad = [
            { ...base, nombre: '' },
            { ...base, descripcion: undefined },
            { ...base, precio_venta: 0 },
            { ...base, precio_venta: -5 },
            { ...base, precio_venta: '10' },
            { ...base, stock_actual: -1 },
            { ...base, stock_actual: 1.5 },
            { ...base, stock_actual: undefined },
            { ...base, id_categoria: undefined }
        ];
        for (const body of bad) {
            const res = await api('POST', '/api/products', { token: admin.token, body });
            assert.equal(res.status, 400, JSON.stringify(body));
        }
    });

    it('categoría inexistente -> 400', async () => {
        const res = await api('POST', '/api/products', {
            token: admin.token,
            body: { nombre: 'X', descripcion: 'd', precio_venta: 10, stock_actual: 1, id_categoria: 99999 }
        });
        assert.equal(res.status, 400);
        assert.match(res.body.message, /categoría/);
    });

    it('listar, consultar por id y filtros combinables con coincidencia parcial', async () => {
        const list = await api('GET', '/api/products', { token: empleado.token });
        assert.equal(list.status, 200);
        assert.ok(Array.isArray(list.body));

        const byName = await api('GET', `/api/products?nombre=Lenovo ${RUN}`, { token: empleado.token });
        assert.equal(byName.body.length, 1);

        // sin tilde: la colación utf8mb4_unicode_ci ignora acentos
        const both = await api('GET', `/api/products?categoria=Tecnologia&nombre=Lenovo ${RUN}`, { token: empleado.token });
        assert.equal(both.body.length, 1);

        const none = await api('GET', `/api/products?categoria=Mascotas&nombre=Lenovo ${RUN}`, { token: empleado.token });
        assert.equal(none.body.length, 0);

        const wildcard = await api('GET', '/api/products?nombre=%25', { token: empleado.token });
        assert.equal(wildcard.body.length, 0, 'el % del usuario se busca literalmente');

        const one = await api('GET', `/api/products/${producto.id_producto}`, { token: empleado.token });
        assert.equal(one.status, 200);
        assert.equal(one.body.nombre, `Laptop Lenovo ${RUN}`);
    });

    it('id inexistente -> 404 e inválido -> 400', async () => {
        assert.equal((await api('GET', '/api/products/999999', { token: admin.token })).status, 404);
        assert.equal((await api('GET', '/api/products/abc', { token: admin.token })).status, 400);
        assert.equal((await api('GET', '/api/products/-1', { token: admin.token })).status, 400);
    });

    it('actualizar producto', async () => {
        const res = await api('PUT', `/api/products/${producto.id_producto}`, { token: admin.token, body: { precio_venta: 2500000, stock_actual: 7 } });
        assert.equal(res.status, 200);
        assert.equal(res.body.precio_venta, 2500000);
        assert.equal(res.body.stock_actual, 7);

        assert.equal((await api('PUT', `/api/products/${producto.id_producto}`, { token: admin.token, body: { precio_venta: -1 } })).status, 400);
        assert.equal((await api('PUT', `/api/products/${producto.id_producto}`, { token: admin.token, body: {} })).status, 400);
        assert.equal((await api('PUT', '/api/products/999999', { token: admin.token, body: { nombre: 'x' } })).status, 404);
    });

    it('eliminar producto sin ventas -> 200; con ventas -> 409', async () => {
        const libre = await createProduct();
        assert.equal((await api('DELETE', `/api/products/${libre.id_producto}`, { token: admin.token })).status, 200);
        assert.equal((await api('GET', `/api/products/${libre.id_producto}`, { token: admin.token })).status, 404);

        const vendido = await createProduct();
        const sale = await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 1, id_producto: vendido.id_producto } });
        assert.equal(sale.status, 201);
        const res = await api('DELETE', `/api/products/${vendido.id_producto}`, { token: admin.token });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /ventas asociadas/);

        // un producto con historial de movimientos (datos de ejemplo) tampoco se borra en silencio
        assert.equal((await api('DELETE', '/api/products/1', { token: admin.token })).status, 409);
    });
});

describe('Ventas', () => {
    it('crear venta: calcula el total en el backend, ignora total_venta del cliente y descuenta stock', async () => {
        const p = await createProduct({ precio_venta: 100.5, stock_actual: 10 });
        const res = await api('POST', '/api/sales', {
            token: empleado.token,
            body: { cantidad: 3, id_producto: p.id_producto, total_venta: 1 }
        });
        assert.equal(res.status, 201);
        assert.equal(res.body.total_venta, 301.5);
        assert.equal(res.body.cantidad, 3);
        assert.equal(res.body.id_usuario, empleado.user.id_usuario);
        assert.equal(res.body.nombre_producto, p.nombre);
        assert.ok(res.body.nombre_usuario);
        assert.equal(await stockOf(p.id_producto), 7);

        const [movs] = await pool.query(
            "SELECT tipo_movimiento, cantidad FROM movimientos_inventario WHERE id_producto = ? AND notas = ?",
            [p.id_producto, `Venta #${res.body.id_venta}`]);
        assert.deepEqual(movs.map((m) => ({ ...m })), [{ tipo_movimiento: 'SALIDA', cantidad: 3 }]);

        const one = await api('GET', `/api/sales/${res.body.id_venta}`, { token: empleado.token });
        assert.equal(one.status, 200);
        assert.equal(one.body.id_venta, res.body.id_venta);
        const list = await api('GET', '/api/sales', { token: empleado.token });
        assert.ok(list.body.some((s) => s.id_venta === res.body.id_venta));
    });

    it('stock insuficiente -> 409 sin crear venta ni tocar el stock', async () => {
        const p = await createProduct({ stock_actual: 2 });
        const res = await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 3, id_producto: p.id_producto } });
        assert.equal(res.status, 409);
        assert.match(res.body.message, /inventario suficiente/);
        assert.equal(await stockOf(p.id_producto), 2);
        assert.equal(await countSales(p.id_producto), 0);
    });

    it('vender exactamente todo el stock deja 0 (nunca negativo)', async () => {
        const p = await createProduct({ stock_actual: 4 });
        assert.equal((await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 4, id_producto: p.id_producto } })).status, 201);
        assert.equal(await stockOf(p.id_producto), 0);
        assert.equal((await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 1, id_producto: p.id_producto } })).status, 409);
    });

    it('validaciones: cantidad, producto y usuario inexistentes', async () => {
        const p = await createProduct();
        const post = (body) => api('POST', '/api/sales', { token: admin.token, body });
        assert.equal((await post({ cantidad: 0, id_producto: p.id_producto })).status, 400);
        assert.equal((await post({ cantidad: -2, id_producto: p.id_producto })).status, 400);
        assert.equal((await post({ cantidad: '2', id_producto: p.id_producto })).status, 400);
        assert.equal((await post({ cantidad: 1.5, id_producto: p.id_producto })).status, 400);
        assert.equal((await post({ id_producto: p.id_producto })).status, 400);
        assert.equal((await post({ cantidad: 1 })).status, 400);
        assert.equal((await post({ cantidad: 1, id_producto: 999999 })).status, 404);
        assert.equal((await post({ cantidad: 1, id_producto: p.id_producto, id_usuario: 999999 })).status, 404);
        assert.equal(await stockOf(p.id_producto), 10);
    });

    it('un empleado no puede vender a nombre de otro; un admin sí', async () => {
        const p = await createProduct();
        const denied = await api('POST', '/api/sales', {
            token: empleado.token,
            body: { cantidad: 1, id_producto: p.id_producto, id_usuario: otroEmpleado.user.id_usuario }
        });
        assert.equal(denied.status, 403);

        const ok = await api('POST', '/api/sales', {
            token: admin.token,
            body: { cantidad: 1, id_producto: p.id_producto, id_usuario: otroEmpleado.user.id_usuario }
        });
        assert.equal(ok.status, 201);
        assert.equal(ok.body.id_usuario, otroEmpleado.user.id_usuario);
    });

    it('actualizar: aumentar cantidad descuenta solo la diferencia', async () => {
        const p = await createProduct({ precio_venta: 10, stock_actual: 10 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 2, id_producto: p.id_producto } })).body;
        assert.equal(await stockOf(p.id_producto), 8);

        const res = await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { cantidad: 5, total_venta: 1 } });
        assert.equal(res.status, 200);
        assert.equal(res.body.cantidad, 5);
        assert.equal(res.body.total_venta, 50);
        assert.equal(await stockOf(p.id_producto), 5);
    });

    it('actualizar: disminuir cantidad devuelve unidades', async () => {
        const p = await createProduct({ precio_venta: 10, stock_actual: 10 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 5, id_producto: p.id_producto } })).body;
        const res = await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { cantidad: 2 } });
        assert.equal(res.status, 200);
        assert.equal(res.body.total_venta, 20);
        assert.equal(await stockOf(p.id_producto), 8);
    });

    it('actualizar: misma cantidad y mismo producto no altera stock ni total', async () => {
        const p = await createProduct({ precio_venta: 10, stock_actual: 10 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 2, id_producto: p.id_producto } })).body;
        await api('PUT', `/api/products/${p.id_producto}`, { token: admin.token, body: { precio_venta: 999 } });
        const res = await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { cantidad: 2, id_producto: p.id_producto } });
        assert.equal(res.status, 200);
        assert.equal(res.body.total_venta, 20);
        assert.equal(await stockOf(p.id_producto), 8);
    });

    it('actualizar: aumentar por encima del stock -> 409 y todo queda igual', async () => {
        const p = await createProduct({ precio_venta: 10, stock_actual: 5 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 2, id_producto: p.id_producto } })).body;
        const res = await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { cantidad: 9 } });
        assert.equal(res.status, 409);
        assert.equal(await stockOf(p.id_producto), 3);
        assert.equal((await api('GET', `/api/sales/${sale.id_venta}`, { token: empleado.token })).body.cantidad, 2);
    });

    it('actualizar: cambiar de producto restaura el anterior, descuenta el nuevo y recalcula el total', async () => {
        const a = await createProduct({ precio_venta: 10, stock_actual: 10 });
        const b = await createProduct({ precio_venta: 25, stock_actual: 10 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 3, id_producto: a.id_producto } })).body;
        assert.equal(await stockOf(a.id_producto), 7);

        const res = await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { id_producto: b.id_producto } });
        assert.equal(res.status, 200);
        assert.equal(res.body.id_producto, b.id_producto);
        assert.equal(res.body.total_venta, 75);
        assert.equal(await stockOf(a.id_producto), 10);
        assert.equal(await stockOf(b.id_producto), 7);
    });

    it('actualizar: cambiar a un producto sin stock -> 409 con ROLLBACK completo', async () => {
        const a = await createProduct({ precio_venta: 10, stock_actual: 10 });
        const b = await createProduct({ precio_venta: 25, stock_actual: 1 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 3, id_producto: a.id_producto } })).body;

        const res = await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { id_producto: b.id_producto } });
        assert.equal(res.status, 409);
        assert.equal(await stockOf(a.id_producto), 7, 'el stock del producto anterior no debe haberse restaurado');
        assert.equal(await stockOf(b.id_producto), 1);
        assert.equal((await api('GET', `/api/sales/${sale.id_venta}`, { token: empleado.token })).body.id_producto, a.id_producto);
    });

    it('actualizar: producto inexistente -> 404, venta inexistente -> 404, sin campos -> 400', async () => {
        const p = await createProduct();
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 1, id_producto: p.id_producto } })).body;
        assert.equal((await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: { id_producto: 999999 } })).status, 404);
        assert.equal((await api('PUT', '/api/sales/999999', { token: empleado.token, body: { cantidad: 1 } })).status, 404);
        assert.equal((await api('PUT', `/api/sales/${sale.id_venta}`, { token: empleado.token, body: {} })).status, 400);
    });

    it('un empleado no puede modificar ni eliminar ventas ajenas', async () => {
        const p = await createProduct();
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 1, id_producto: p.id_producto } })).body;
        assert.equal((await api('PUT', `/api/sales/${sale.id_venta}`, { token: otroEmpleado.token, body: { cantidad: 2 } })).status, 403);
        assert.equal((await api('DELETE', `/api/sales/${sale.id_venta}`, { token: otroEmpleado.token })).status, 403);
        assert.equal(await stockOf(p.id_producto), 9);
    });

    it('eliminar venta restaura el inventario', async () => {
        const p = await createProduct({ stock_actual: 10 });
        const sale = (await api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 2, id_producto: p.id_producto } })).body;
        assert.equal(await stockOf(p.id_producto), 8);

        const res = await api('DELETE', `/api/sales/${sale.id_venta}`, { token: empleado.token });
        assert.equal(res.status, 200);
        assert.equal(await stockOf(p.id_producto), 10);
        assert.equal((await api('GET', `/api/sales/${sale.id_venta}`, { token: empleado.token })).status, 404);
        assert.equal((await api('DELETE', `/api/sales/${sale.id_venta}`, { token: empleado.token })).status, 404);
    });

    it('ids inválidos -> 400', async () => {
        assert.equal((await api('GET', '/api/sales/abc', { token: admin.token })).status, 400);
        assert.equal((await api('DELETE', '/api/sales/0', { token: admin.token })).status, 400);
    });

    it('ROLLBACK: si falla un paso intermedio no queda venta ni stock descontado', async () => {
        const p = await createProduct({ stock_actual: 10 });
        // Token de un administrador que ya no existe: el INSERT del movimiento falla por FK
        // DESPUÉS de insertar la venta y descontar el stock.
        const ghost = jwt.sign({ id_usuario: 987654, email: 'fantasma@test.com', rol: 'admin' }, process.env.JWT_SECRET);
        const res = await api('POST', '/api/sales', {
            token: ghost,
            body: { cantidad: 4, id_producto: p.id_producto, id_usuario: empleado.user.id_usuario }
        });
        assert.ok([400, 409].includes(res.status), `status ${res.status}`);
        assert.equal(await stockOf(p.id_producto), 10);
        assert.equal(await countSales(p.id_producto), 0);
    });

    it('concurrencia: 12 ventas simultáneas de 1 unidad con stock 5 -> exactamente 5 exitosas', async () => {
        const p = await createProduct({ stock_actual: 5 });
        const results = await Promise.all(Array.from({ length: 12 }, () =>
            api('POST', '/api/sales', { token: empleado.token, body: { cantidad: 1, id_producto: p.id_producto } })));
        const ok = results.filter((r) => r.status === 201).length;
        const rejected = results.filter((r) => r.status === 409).length;
        assert.equal(ok, 5);
        assert.equal(rejected, 7);
        assert.equal(await stockOf(p.id_producto), 0);
        assert.equal(await countSales(p.id_producto), 5);
    });
});

describe('Usuarios', () => {
    it('listar y consultar: nunca exponen password', async () => {
        const list = await api('GET', '/api/users', { token: empleado.token });
        assert.equal(list.status, 200);
        assert.ok(list.body.length >= 3);
        assert.equal(JSON.stringify(list.body).includes('password'), false);

        const one = await api('GET', `/api/users/${empleado.user.id_usuario}`, { token: empleado.token });
        assert.equal(one.status, 200);
        assert.equal(one.body.email, email('empleado'));
        assert.equal((await api('GET', '/api/users/999999', { token: empleado.token })).status, 404);
        assert.equal((await api('GET', '/api/users/xyz', { token: empleado.token })).status, 400);
    });

    it('un usuario edita su propio perfil; no puede editar a otros ni cambiar su rol', async () => {
        const ok = await api('PUT', `/api/users/${empleado.user.id_usuario}`, { token: empleado.token, body: { nombre: 'Empleado Editado' } });
        assert.equal(ok.status, 200);
        assert.equal(ok.body.nombre, 'Empleado Editado');

        assert.equal((await api('PUT', `/api/users/${otroEmpleado.user.id_usuario}`, { token: empleado.token, body: { nombre: 'Hack' } })).status, 403);
        assert.equal((await api('PUT', `/api/users/${empleado.user.id_usuario}`, { token: empleado.token, body: { rol: 'admin' } })).status, 403);
    });

    it('actualizar: validaciones y correo duplicado', async () => {
        const id = empleado.user.id_usuario;
        assert.equal((await api('PUT', `/api/users/${id}`, { token: empleado.token, body: { email: 'malo' } })).status, 400);
        assert.equal((await api('PUT', `/api/users/${id}`, { token: empleado.token, body: { password: '1' } })).status, 400);
        assert.equal((await api('PUT', `/api/users/${id}`, { token: empleado.token, body: {} })).status, 400);
        assert.equal((await api('PUT', `/api/users/${id}`, { token: empleado.token, body: { email: email('otro') } })).status, 409);
    });

    it('cambiar la contraseña permite iniciar sesión con la nueva', async () => {
        const res = await api('PUT', `/api/users/${otroEmpleado.user.id_usuario}`, { token: otroEmpleado.token, body: { password: 'nuevaClave9' } });
        assert.equal(res.status, 200);
        assert.equal((await api('POST', '/api/auth/login', { body: { email: email('otro'), password: 'nuevaClave9' } })).status, 200);
        assert.equal((await api('POST', '/api/auth/login', { body: { email: email('otro'), password: PASSWORD } })).status, 401);
    });

    it('un administrador puede cambiar el rol', async () => {
        const res = await api('PUT', `/api/users/${otroEmpleado.user.id_usuario}`, { token: admin.token, body: { rol: 'admin' } });
        assert.equal(res.status, 200);
        assert.equal(res.body.rol, 'admin');
        assert.equal((await api('PUT', `/api/users/${otroEmpleado.user.id_usuario}`, { token: admin.token, body: { rol: 'Vendedor' } })).status, 400);
    });

    it('eliminar: empleado -> 403; inexistente -> 404; con ventas -> 409; sin historial -> 200', async () => {
        const victim = await registerAndLogin('victima');
        assert.equal((await api('DELETE', `/api/users/${victim.user.id_usuario}`, { token: empleado.token })).status, 403);
        assert.equal((await api('DELETE', '/api/users/999999', { token: admin.token })).status, 404);

        const conVentas = await api('DELETE', `/api/users/${empleado.user.id_usuario}`, { token: admin.token });
        assert.equal(conVentas.status, 409);
        assert.match(conVentas.body.message, /ventas asociadas/);

        const sinHistorial = await api('DELETE', `/api/users/${victim.user.id_usuario}`, { token: admin.token });
        assert.equal(sinHistorial.status, 200);
        assert.equal((await api('GET', `/api/users/${victim.user.id_usuario}`, { token: admin.token })).status, 404);
    });
});

describe('Errores', () => {
    it('JSON mal formado -> 400 limpio', async () => {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email": '
        });
        assert.equal(res.status, 400);
        assert.ok((await res.json()).message);
    });

    it('cuerpo no objeto -> 400', async () => {
        const res = await api('POST', '/api/auth/login', { body: [1, 2] });
        assert.equal(res.status, 400);
    });
});
