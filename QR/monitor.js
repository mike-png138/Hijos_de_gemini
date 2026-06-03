const socket = io();
let carrito = [];
let totalGlobal = 0;

const txtNombre = document.getElementById('prod-nombre');
const txtPrecio = document.getElementById('prod-precio');
const txtStock = document.getElementById('prod-stock');

socket.on('nuevo-producto-escaneado', (producto) => {
    // Actualizar la tarjeta visual
    if (txtNombre) txtNombre.textContent = producto.nombre.toUpperCase();
    if (txtPrecio) txtPrecio.textContent = `$${parseFloat(producto.precio).toFixed(2)}`;
    if (txtStock) txtStock.textContent = `Stock disponible: ${producto.stock}`;

    const prod = { ...producto, cantidad: 1 };
    carrito.push(prod);

    actualizarTabla();
});

function actualizarTabla() {
    const tbody = document.getElementById('listaCarrito');
    tbody.innerHTML = '';
    totalGlobal = 0; // Reiniciamos el acumulador

    carrito.forEach((prod, index) => {
        const subtotal = prod.precio * prod.cantidad;
        totalGlobal += subtotal;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${prod.nombre}</td>
            <td>$${prod.precio.toFixed(2)}</td>
            <td>${prod.cantidad}</td>
            <td>$${subtotal.toFixed(2)}</td>
            <td><button class="btn-eliminar" onclick="eliminarProducto(${index})">❌</button></td>
        `;
        tbody.appendChild(fila);
    });

    // ¡ESTO ES LO QUE HACÍA FALTA! Actualizar el texto en pantalla cada vez
    document.getElementById('totalVenta').innerText = totalGlobal.toFixed(2);
}

// Función para eliminar producto individual
window.eliminarProducto = (index) => {
    carrito.splice(index, 1);

    // Si el carrito queda vacío, limpiamos también la tarjeta superior
    if (carrito.length === 0) {
        if (txtNombre) txtNombre.textContent = 'Esperando escaneo...';
        if (txtPrecio) txtPrecio.textContent = '$0.00';
        if (txtStock) txtStock.textContent = 'Stock: --';
    }

    actualizarTabla(); // Esto refresca el total visualmente
};

document.getElementById('btnCobrar').addEventListener('click', async () => {
    if (carrito.length === 0) return alert("El carrito está vacío");

    const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productos: carrito })
    });

    if ((await res.json()).success) {
        alert("Venta exitosa");
        carrito = [];
        actualizarTabla();
        if (txtNombre) txtNombre.textContent = 'Esperando escaneo...';
        if (txtPrecio) txtPrecio.textContent = '$0.00';
        if (txtStock) txtStock.textContent = 'Stock: --';
    } else {
        alert("Error al procesar la venta");
    }
});