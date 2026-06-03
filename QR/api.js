const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const { insertarProducto } = require('./db');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'Abarrotesmigrao.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('❌ Error BD:', err.message);
    else console.log('💾 Conectado a BD');
});

io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado: ${socket.id}`);
});

// GET: Escanear
app.get('/api/escanear/:codigo', (req, res) => {
    const codigoBarras = req.params.codigo;
    db.get(`SELECT NOMBRE AS nombre, PRECIO AS precio, STOCK AS stock FROM PRODUCTO WHERE CODIGO_BARRAS = ?`, [codigoBarras], (err, producto) => {
        if (err || !producto) {
            io.emit('producto-no-encontrado', { codigo: codigoBarras });
            return res.status(404).json({ success: false });
        }
        // EVENTO PARA SINCRONIZAR
        io.emit('nuevo-producto-escaneado', producto);
        return res.json({ success: true, producto });
    });
});

// POST: Registrar producto + QR
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, precio, stock, id_proveedor, codigo_barras } = req.body;
        await insertarProducto({ nombre, precio, stock, id_proveedor, codigo_barras });

        const outputDir = path.join(__dirname, 'qrs_productos');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const nombreSeguro = nombre.replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, '_');
        await QRCode.toFile(path.join(outputDir, `${codigo_barras}_${nombreSeguro}.png`), String(codigo_barras), { scale: 10 });

        // EVENTO PARA SINCRONIZAR
        io.emit('nuevo-producto-escaneado', { nombre, precio, stock });
        return res.status(201).json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// POST: Ventas
app.post('/api/ventas', (req, res) => {
    const { productos } = req.body;
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        productos.forEach(item => {
            db.run(`UPDATE PRODUCTO SET STOCK = STOCK - ? WHERE NOMBRE = ?`, [item.cantidad, item.nombre]);
        });
        db.run("COMMIT");
        return res.json({ success: true });
    });
});

server.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));