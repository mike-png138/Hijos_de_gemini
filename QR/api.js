const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 🛠️ Configuración de CORS para permitir peticiones seguras desde el celular
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); 

// Instancia de Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'Abarrotesmigrao.db');

// Conexión a la Base de Datos SQLite
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('❌ Error al conectar a SQLite:', err.message);
    else console.log('💾 Conectado exitosamente a Abarrotesmigrao.db');
});

// Canal de WebSockets
io.on('connection', (socket) => {
    console.log(`🔌 Cliente WebSocket conectado: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`❌ Cliente WebSocket desconectado: ${socket.id}`);
    });
});

// 🌐 Endpoint del Escáner
app.get('/api/escanear/:codigo', (req, res) => {
    const codigoBarras = req.params.codigo;

    // 🔥 SOLUCIÓN: Usamos "AS" para mapear las columnas en mayúsculas a minúsculas en el JSON de salida
    const query = `SELECT NOMBRE AS nombre, PRECIO AS precio, STOCK AS stock FROM PRODUCTO WHERE CODIGO_BARRAS = ?`;
    
    db.get(query, [codigoBarras], (err, producto) => {
        if (err) {
            console.error('❌ Error en consulta SQL:', err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (!producto) {
            console.log(`⚠️ Código no registrado: ${codigoBarras}`);
            io.emit('producto-no-encontrado', { codigo: codigoBarras });
            return res.status(404).json({ success: false, status: "No encontrado", codigo: codigoBarras });
        }

        console.log(`✅ Producto encontrado: ${producto.nombre}`); 
        // Emitir los datos en tiempo real al monitor.html (irá en minúsculas)
        io.emit('nuevo-producto-escaneado', producto);

        // Responder con éxito al celular
        return res.json({ success: true, status: "Escaneado con éxito", producto });
    });
});


// Levantar el servidor unificado
server.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`🔒 Recuerda levantar el puente SSL proxy en el puerto 3001 para el celular`);
});