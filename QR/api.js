const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const QRCode = require('qrcode');
const fs = require('fs'); // Módulo nativo para verificar carpetas

// 🛠️ IMPORTANTE: Importamos las funciones preparadas de db.js
const { insertarProducto } = require('./db');

const app = express();
const server = http.createServer(app);

// Configuración de CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); 

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'Abarrotesmigrao.db');

// Conexión a la Base de Datos SQLite (Mantenemos la instancia local para el GET)
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('❌ Error al conectar a SQLite:', err.message);
    else console.log('💾 Conectado exitosamente a Abarrotesmigrao.db');
});

// Canal de WebSockets
io.on('connection', (socket) => {
    console.log(`🔌 Cliente WebSocket conectado: ${socket.id}`);
});

// 🌐 Endpoint del Escáner (GET)
app.get('/api/escanear/:codigo', (req, res) => {
    const codigoBarras = req.params.codigo;
    const query = `SELECT NOMBRE AS nombre, PRECIO AS precio, STOCK AS stock FROM PRODUCTO WHERE CODIGO_BARRAS = ?`;
    
    db.get(query, [codigoBarras], (err, producto) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        if (!producto) {
            console.log(`⚠️ Código no registrado: ${codigoBarras}`);
            io.emit('producto-no-encontrado', { codigo: codigoBarras });
            return res.status(404).json({ success: false, status: "No encontrado", codigo: codigoBarras });
        }

        console.log(`✅ Producto encontrado: ${producto.nombre}`); 
        io.emit('nuevo-producto-escaneado', producto);
        return res.json({ success: true, status: "Escaneado con éxito", producto });
    });
});

// 🔥 ENDPOINT ACTUALIZADO: Registrar producto y generar su QR
app.post('/api/productos', async (req, res) => {
    try {
        const { nombre, precio, stock, id_proveedor, codigo_barras } = req.body;

        // Validaciones básicas
        if (!nombre || !precio || !codigo_barras) {
            return res.status(400).json({ success: false, error: "Datos incompletos" });
        }

        // 1. Guardar en la base de datos SQLite usando tu db.js
        await insertarProducto({ nombre, precio, stock, id_proveedor, codigo_barras });
        console.log(`📥 Nuevo producto registrado: ${nombre}`);

        // 2. GENERAR Y GUARDAR EL ARCHIVO QR AUTOMÁTICAMENTE
        const outputDir = path.join(__dirname, 'qrs_productos');
        
        // Asegurar que la carpeta exista (por si acaso se borra)
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Saneamos el nombre exactamente igual que en generador.py
        const nombreSeguro = nombre
            .replace(/[^a-zA-Z0-9 _-]/g, "") // Quitar caracteres raros
            .trim()
            .replace(/\s+/g, '_'); // Cambiar espacios por guiones bajos
        
        const nombreArchivo = `${codigo_barras}_${nombreSeguro}.png`;
        const rutaCompletaQR = path.join(outputDir, nombreArchivo);

        // Opciones de diseño del QR (similares a las de Python)
        const opcionesQR = {
            errorCorrectionLevel: 'L',
            margin: 4,
            scale: 10 // Tamaño del bloque
        };

        // Guardar el QR en disco conteniendo únicamente el string del código de barras
        await QRCode.toFile(rutaCompletaQR, String(codigo_barras), opcionesQR);
        console.log(`📸 QR auto-generado con éxito: ${nombreArchivo}`);

        // 3. Notificar al monitor en tiempo real
        io.emit('nuevo-producto-escaneado', { nombre, precio, stock });

        return res.status(201).json({ success: true, message: "Producto registrado y QR generado" });

    } catch (err) {
        console.error('❌ Error en el proceso de alta:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// Levantar el servidor unificado
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`🔒 Recuerda levantar el puente SSL proxy en el puerto 3001 para el celular`);
});