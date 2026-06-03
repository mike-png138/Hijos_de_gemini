const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'Abarrotesmigrao.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error("❌ Error al conectar con SQLite:", err.message);
    else console.log("💾 Conectado exitosamente a Abarrotesmigrao.db");
});

const buscarProductoPorCodigo = (codigo_barras) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT ID_PRODUCTO, CODIGO_BARRAS, NOMBRE AS nombre, PRECIO AS precio, STOCK AS stock FROM PRODUCTO WHERE CODIGO_BARRAS = ?`;
        db.get(sql, [codigo_barras], (err, row) => {
            if (err) reject(err);
            else resolve(row);
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
                db.run(sqlDetalle, [idVenta, item.ID_PRODUCTO, item.cantidad, item.precio], function(errDetalle) {
                    if (errDetalle) huboError = true;
                    
                    procesados++;
                    if (procesados === carrito.length) {
                        if (huboError) reject(new Error("Error al registrar el detalle (Verifica stock o triggers)"));
                        else resolve(idVenta);
                    }
                });
            });
        });
    });
};

const obtenerCorteDeCajaDelDia = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT COUNT(ID_VENTA) as numero_de_ventas, IFNULL(SUM(TOTAL), 0) as dinero_total_en_caja 
            FROM VENTA WHERE date(FECHA) = date('now', 'localtime')
        `;
        db.get(sql, [], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};


const loginDueño = (nombre, telefono) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT ID_DUEÑO, NOMBRE FROM DUEÑO WHERE NOMBRE = ? AND TELEFONO = ?`;
        db.get(sql, [nombre, telefono], (err, row) => {
            if (err) reject(err);
            else resolve(row); 
        });
    });
};

module.exports = {
    db, 
    buscarProductoPorCodigo, 
    insertarProducto, 
    registrarVentaCompleta, 
    obtenerCorteDeCajaDelDia,
    loginDueño
};