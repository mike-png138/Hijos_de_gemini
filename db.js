const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./Abarrotesmigrao.db', (err) => {
    if (err) {
        console.error("Error al conectar con SQLite:", err.message);
    } else {
        console.log("Conectado exitosamente a Abarrotesmigrao.db");
    }
});

const buscarProductoPorCodigo = (codigo_barras) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM PRODUCTO WHERE CODIGO_BARRAS = ?`;
        db.get(sql, [codigo_barras], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const agregarProducto = (nombre, precio, stock, id_proveedor, codigo_barras) => {
    return new Promise((resolve, reject) => {
        if (precio < 0) return reject(new Error("El precio no puede ser negativo"));
        if (stock < 0) return reject(new Error("El stock inicial no puede ser negativo"));

        const sql = `INSERT INTO PRODUCTO (NOMBRE, PRECIO, STOCK, ID_PROVEEDOR, CODIGO_BARRAS) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [nombre, precio, stock, id_proveedor, codigo_barras], function(err) {
            if (err) reject(err);
            else resolve(this.lastID); 
        });
    });
};

const insertarProducto = (datosProducto) => {
    return new Promise((resolve, reject) => {
        const { nombre, precio, stock, id_proveedor, codigo_barras } = datosProducto;
        
        if (precio < 0) return reject(new Error("El precio no puede ser negativo"));
        if (stock < 0) return reject(new Error("El stock inicial no puede ser negativo"));

        const sql = `INSERT INTO PRODUCTO (NOMBRE, PRECIO, STOCK, ID_PROVEEDOR, CODIGO_BARRAS) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [nombre, precio, stock, id_proveedor, codigo_barras], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};

const reacomodarlos = (id_producto, nuevo_stock) => {
    return new Promise((resolve, reject) => {
        if (nuevo_stock < 0) return reject(new Error("El stock no puede quedar en negativo"));
        
        const sql = `UPDATE PRODUCTO SET STOCK = ? WHERE ID_PRODUCTO = ?`;
        db.run(sql, [nuevo_stock, id_producto], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
};

const registrarVentaCompleta = (carrito, id_dueño = 1) => {
    return new Promise((resolve, reject) => {
        const sqlVenta = `INSERT INTO VENTA (ID_DUEÑO, FECHA, TOTAL) VALUES (?, datetime('now', 'localtime'), 0)`;
        
        db.run(sqlVenta, [id_dueño], function(err) {
            if (err) return reject(err);
            
            const idVenta = this.lastID; 
            let procesados = 0;
            let huboError = false;

            const sqlDetalle = `INSERT INTO DETALLE_VENTA (ID_VENTA, ID_PRODUCTO, CANTIDAD, PRECIO_UNITARIO) VALUES (?, ?, ?, ?)`;
            
            carrito.forEach(item => {
                db.run(sqlDetalle, [idVenta, item.ID_PRODUCTO, item.cantidad, item.PRECIO], function(errDetalle) {
                    if (errDetalle) huboError = true;
                    
                    procesados++;
                    if (procesados === carrito.length) {
                        if (huboError) reject(new Error("Error al registrar algunos productos en el detalle."));
                        else resolve(idVenta);
                    }
                });
            });
        });
    });
};

module.exports = {
    db,
    buscarProductoPorCodigo,
    agregarProducto,
    insertarProducto,
    reacomodarlos,
    registrarVentaCompleta
};