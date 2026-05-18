import os
import sqlite3
import qrcode


def generar_qrs():
    # Rutas relativas para asegurar portabilidad
    db_path = os.path.join(os.path.dirname(__file__), "Abarrotesmigrao.db")
    output_dir = "qrs_productos"

    # Crear la carpeta de salida si no existe
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"📁 Carpeta creada: {output_dir}")

    conn = None
    try:
        # Conexión a la base de datos
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Seleccionamos los códigos y nombres de la tabla PRODUCTO
        cursor.execute("SELECT codigo_barras, nombre FROM PRODUCTO")
        productos = cursor.fetchall()

        if not productos:
            print("⚠️ No se encontraron productos en la tabla PRODUCTO.")
            return

        print(f"📦 Se encontraron {len(productos)} productos. Generando QRs...")

        for codigo_barras, nombre in productos:
            if not codigo_barras:
                continue

            # Limpiar el nombre para evitar caracteres inválidos en el archivo final
            nombre_seguro = "".join(
                c for c in str(nombre) if c.isalnum() or c in (" ", "_", "-")
            ).rstrip()
            nombre_archivo = (
                f"{output_dir}/{codigo_barras}_{nombre_seguro.replace(' ', '_')}.png"
            )

            # Configuración del generador QR
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )

            # El QR ahora contiene únicamente el código de barras bruto
            qr.add_data(str(codigo_barras))
            qr.make(fit=True)

            # Crear y guardar la imagen
            img = qr.make_image(fill_color="black", back_color="white")
            img.save(nombre_archivo)
            print(f"✅ QR Generado: {nombre_archivo}")

        print("\n🎉 ¡Proceso terminado con éxito!")

    except sqlite3.Error as e:
        print(f"❌ Error de SQLite: {e}")
    except Exception as e:
        print(f"❌ Ocurrió un error inesperado: {e}")
    finally:
        if conn:
            conn.close()
            print("💾 Conexión a la base de datos cerrada de forma segura.")


if __name__ == "__main__":
    generar_qrs()