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
        const sql = `INSERT INTO PRODUCTO (NOMBRE, PRECIO, STOCK, ID_PROVEEDOR, CODIGO_BARRAS) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [nombre, precio, stock, id_proveedor, codigo_barras], function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
        });
    });
};


const reacomodarlos = (id_producto, nuevo_stock) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE PRODUCTO SET STOCK = ? WHERE ID_PRODUCTO = ?`;
        db.run(sql, [nuevo_stock, id_producto], function(err) {
            if (err) reject(err);
            else resolve(this.changes);
        });
    });
};

module.exports = {
    db,
    buscarProductoPorCodigo,
    agregarProducto,
    insertarProducto,
    reacomodarlos
};