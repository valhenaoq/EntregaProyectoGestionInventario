class Product {
    constructor({
        id_producto, codigo_barras, nombre, descripcion, precio_compra, precio_venta,
        stock_actual, stock_minimo, id_categoria, categoria, id_proveedor, proveedor, creado_en
    }) {
        this.id_producto = id_producto;
        this.codigo_barras = codigo_barras;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio_compra = precio_compra;
        this.precio_venta = precio_venta;
        this.stock_actual = stock_actual;
        this.stock_minimo = stock_minimo;
        this.id_categoria = id_categoria;
        this.categoria = categoria;
        this.id_proveedor = id_proveedor;
        this.proveedor = proveedor;
        this.creado_en = creado_en;
    }
}

module.exports = Product;
