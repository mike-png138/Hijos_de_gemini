const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');

// Importamos TODAS tus funciones robustas
const { buscarProductoPorCodigo, insertarProducto, registrarVentaCompleta, obtenerCorteDeCajaDelDia } = require('./db');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });
const PORT = 3000;

io.on('connection', (socket) => {
    console.log(`🔌 Cliente conectado al monitor: ${socket.id}`);
});

// GET: Escanear (Conecta sockets + base de datos segura)
app.get('/api/escanear/:codigo', async (req, res) => {
    try {
        const codigoBarras = req.params.codigo;
        const producto = await buscarProductoPorCodigo(codigoBarras);
        
        if (!producto) {
            io.emit('producto-no-encontrado', { codigo: codigoBarras });
            return res.status(404).json({ success: false });
        }
        
        io.emit('nuevo-producto-escaneado', producto);
        return res.json({ success: true, producto });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST: Registrar producto nuevo desde el celular
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, precio, stock, id_proveedor, codigo_barras } = req.body;
    
        await insertarProducto({ nombre, precio, stock, id_proveedor, codigo_barras });

        const outputDir = path.join(__dirname, 'qrs_productos');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const nombreSeguro = nombre.replace(/[^a-zA-Z0-9 _-]/g, "").trim().replace(/\s+/g, '_');
        await QRCode.toFile(path.join(outputDir, `${codigo_barras}_${nombreSeguro}.png`), String(codigo_barras), { scale: 10 });

        io.emit('nuevo-producto-escaneado', { nombre, precio, stock });
        return res.status(201).json({ success: true });
    } catch (err) {
        return res.status(400).json({ success: false, error: err.message }); // 400 por si mandan negativos
    }
});


app.post('/api/ventas', async (req, res) => {
    try {
        const { productos } = req.body; // monitor.js lo manda como 'productos'
        if (!productos || productos.length === 0) {
            return res.status(400).json({ success: false, message: 'El carrito está vacío' });
        }
        
        // Usamos tu función que escribe en VENTA y DETALLE_VENTA
        const idVenta = await registrarVentaCompleta(productos, 1);
        res.json({ success: true, folio_venta: idVenta });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get('/api/reportes/corte-caja', async (req, res) => {
    try {
        const corte = await obtenerCorteDeCajaDelDia();
        res.json({ success: true, datos: corte });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

server.listen(PORT, () => console.log(`🚀 Servidor Unificado corriendo en http://localhost:${PORT}`));