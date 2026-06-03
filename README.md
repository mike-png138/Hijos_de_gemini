<h1 align="center">🛒 POS ABARROTES MIGRAO // HIJOS DE GEMINI</h1>
<h3 align="center">📍 Sistema de Punto de Venta en Tiempo Real con Escáner Móvil Inalámbrico</h3>
<p align="center">
  <i>Plataforma web de gestión de inventario y ventas diseñada bajo una arquitectura cliente-servidor en tiempo real, utilizando un dispositivo móvil como escáner óptico inalámbrico y asegurando la integridad de datos mediante transacciones relacionales.</i>
</p>

---

## ⚙️ CARACTERÍSTICAS PRINCIPALES
* **Escáner Móvil Integrado:** Uso de la cámara de un smartphone para leer códigos QR y de barras, enviando los datos al monitor principal sin necesidad de cables.
* **Sincronización en Tiempo Real:** El carrito de compras en la PC se actualiza instantáneamente al escanear un producto gracias a WebSockets.
* **Arquitectura Transaccional y Segura:** Bases de datos blindadas contra números negativos. Uso de operaciones ACID (Rollback/Commit) y *Triggers* automáticos para descontar stock y generar folios.
* **Módulo de Autenticación:** Sistema de Login para control de acceso a la caja registradora utilizando credenciales de usuario.
* **Reportes Analíticos:** Generación dinámica del "Corte de Caja" diario calculando el total de transacciones e ingresos.
* **Generador de QR Automático:** Creación masiva de códigos QR para el catálogo de productos usando Python/Node.js.

## 🛠️ STACK TECNOLÓGICO
* **Backend:** Node.js | Express.js | API REST
* **Tiempo Real:** Socket.io (WebSockets)
* **Base de Datos:** SQLite3 (Consultas parametrizadas, Triggers)
* **Frontend:** HTML5 | CSS3 | Vanilla JS (Modular)
* **Herramientas Ópticas y de Red:** `html5-qrcode`, `qrcode` (NPM), `local-ssl-proxy` (Túnel HTTPS seguro para dispositivos móviles).

---

## 🚀 GUÍA DE INSTALACIÓN Y EJECUCIÓN

Para evaluar este sistema localmente, asegúrese de tener **Node.js (v18+)** instalado en su equipo. Ambos dispositivos (PC y Celular) deben estar conectados a la **misma red Wi-Fi**.

### Paso 1: Instalación de Dependencias
Abra su terminal en la carpeta raíz del proyecto y descargue los módulos necesarios:
```bash
npm install express cors socket.io sqlite3 qrcode
Paso 2: Configuración de Red Local (IP)
Para que el celular se comunique con la computadora, necesita configurar la dirección IP:

Abra su terminal y ejecute ipconfig (Windows) o ifconfig (Mac/Linux) para obtener su Dirección IPv4.

Abra el archivo escaner.html en su editor de código.

Vaya a la sección de endpoints (línea 479) y reemplace la IP por la suya:

JavaScript
const SERVER_IP = "192.168.X.X"; // Inserte aquí su IPv4 local
Paso 3: Inicialización del Sistema
Se requieren dos terminales ejecutándose simultáneamente para operar el sistema completo.

Terminal 1 (Servidor Principal y Base de Datos):

Bash
node api.js
Terminal 2 (Túnel de Seguridad HTTPS para la cámara del celular):
Nota: Los navegadores móviles bloquean el acceso a la cámara si no es una conexión segura. Este comando simula un certificado SSL local.

Bash
npx local-ssl-proxy --source 3001 --target 3000
📱 MODO DE USO
Monitor / Caja Registradora (PC): Abra su navegador web normal y acceda a: http://localhost:3000/monitor.html

Escáner Óptico (Smartphone): Abra Safari o Chrome y acceda a: https://[SU_IP_AQUI]:3001/escaner.html (Nota: El navegador mostrará una advertencia de "Conexión no privada", haga clic en "Configuración avanzada" -> "Continuar de todos modos").

👥 Equipazo 
Carlos Castañeda Ramírez

Yahair Emiliano Martínez Muñoz

Miguel Ángel Lozano Muñoz
