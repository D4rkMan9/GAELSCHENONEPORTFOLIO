import os
import re

# Mostrar todas las carpetas disponibles en la ruta actual
ruta_actual = os.getcwd()
carpetas_disponibles = [carpeta for carpeta in os.listdir(ruta_actual) if os.path.isdir(os.path.join(ruta_actual, carpeta))]

if not carpetas_disponibles:
    print("No hay carpetas disponibles en el directorio actual.")
    exit()

print("Seleccione una carpeta para renombrar los archivos:")
for i, carpeta in enumerate(carpetas_disponibles):
    print(f"{i + 1}. {carpeta}")

# Solicitar al usuario que seleccione una carpeta
try:
    opcion = int(input("Ingrese el número de la carpeta: ")) - 1
except ValueError:
    print("Entrada inválida. Debe ingresar un número.")
    exit()

if 0 <= opcion < len(carpetas_disponibles):
    carpeta = os.path.join(ruta_actual, carpetas_disponibles[opcion])
else:
    print("Opción inválida. Saliendo del programa.")
    exit()

print(f"\n📁 Carpeta seleccionada: {carpeta}\n")

# Recorrer archivos en la carpeta seleccionada
for archivo in os.listdir(carpeta):
    ruta_vieja = os.path.join(carpeta, archivo)

    if os.path.isfile(ruta_vieja):
        # Usar search en vez de match, y permitir espacio antes del paréntesis
        match = re.search(r'\s*\((\d+)\)\.', archivo)
        if match:
            numero = match.group(1)
            # Eliminar la parte (n).<extensión> del nombre original
            nombre_sin_extension, extension = os.path.splitext(re.sub(r'\s*\(\d+\)\.', '.', archivo).strip())
            nuevo_nombre = f"{nombre_sin_extension}_{numero}{extension}"
            ruta_nueva = os.path.join(carpeta, nuevo_nombre)

            if os.path.exists(ruta_nueva):
                print(f"⚠️ Ya existe: {nuevo_nombre}. No se renombró {archivo}.")
            else:
                os.rename(ruta_vieja, ruta_nueva)
                print(f"✅ Renombrado: {archivo} -> {nuevo_nombre}")
