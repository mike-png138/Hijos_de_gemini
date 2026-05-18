import qrcode
import sqlite3
import re

base_url = "https://slingshot-atrium-stubble.ngrok-free.dev/escaner.html?codigo="

# 2. Conectar directamente a tu base de datos
try:
    conexion = sqlite3.connect('Abarrotesmigrao.db')
    cursor = conexion.cursor()

    # 3. Extraer el nombre y el código de barras de los 46 productos
    cursor.execute("SELECT NOMBRE, CODIGO_BARRAS FROM PRODUCTO")
    productos = cursor.fetchall()

    print(f"¡Base de datos conectada! Se encontraron {len(productos)} productos.")
    print("-" * 50)

    # 4. Generar un QR para cada uno 
    for producto in productos:
        nombre = str(producto[0])
        codigo = str(producto[1])
        
       
        if codigo and codigo != "None" and codigo != "":
            url_final = base_url + codigo
            img = qrcode.make(url_final)
            
            
            nombre_limpio = re.sub(r'[\\/*?:"<>|]', "", nombre).strip()
            nombre_archivo = f"QR_{nombre_limpio}.png"
            
            img.save(nombre_archivo)
            print(f"✅ Generado: {nombre_archivo}")
        else:
            print(f"Saltando '{nombre}' (No tiene código de barras registrado)")

    conexion.close()
    print("-" * 50)
    print("✨ ¡Todos los códigos QR han sido generados con éxito! ✨")

except sqlite3.Error as error:
    print("❌ Error al conectar con la base de datos SQLite:", error)