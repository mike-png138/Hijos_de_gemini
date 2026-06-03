const express = require('express');
const cors = require('cors');
const { 
    buscarProductoPorCodigo, 
    agregarProducto, 
    insertarProducto, 
    reacomodarlos,
    registrarVentaCompleta 
} = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); 

let ultimoProductoEscaneado = null; 

app.get('/api/escaner/:codigo', async (req, res) => {
    try {
        const codigo = req.params.codigo;
        const producto = await buscarProductoPorCodigo(codigo);
        
        if (producto) {
            ultimoProductoEscaneado = producto; 
            res.json({ success: true, data: producto });
        } else {
            res.status(404).json({ success: false, message: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/ultimo-producto', (req, res) => {
    if (ultimoProductoEscaneado) {
        res.json({ success: true, data: ultimoProductoEscaneado });
    } else {
        res.json({ success: false, message: 'Aún no hay productos' });
    }
});

app.post('/api/productos/agregar', async (req, res) => {
    try {
        const { nombre, precio, stock, id_proveedor, codigo_barras } = req.body;
        const id = await agregarProducto(nombre, precio, stock, id_proveedor, codigo_barras);
        res.json({ success: true, message: 'Producto agregado', id: id });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/productos/insertar', async (req, res) => {
    try {
        const id = await insertarProducto(req.body);
        res.json({ success: true, message: 'Producto insertado', id: id });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.put('/api/productos/reacomodar', async (req, res) => {
    try {
        const { id_producto, nuevo_stock } = req.body;
        const cambios = await reacomodarlos(id_producto, nuevo_stock);
        res.json({ success: true, message: `Productos reacomodados. Filas afectadas: ${cambios}` });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/venta/cobrar', async (req, res) => {
    try {
        const { carrito, id_dueño } = req.body; 

        if (!carrito || carrito.length === 0) {
            return res.status(400).json({ success: false, message: 'El carrito está vacío' });
        }

        const idVenta = await registrarVentaCompleta(carrito, id_dueño || 1);

        res.json({ 
            success: true, 
            message: 'Venta registrada correctamente', 
            folio_venta: idVenta 
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor API corriendo en el puerto ${PORT}`);
});