# SVD Image Compression Lab 🧪

Una aplicación web interactiva y altamente optimizada para explorar la **Descomposición en Valores Singulares (SVD)** aplicada a la compresión de imágenes. Este proyecto combina matemáticas avanzadas con una interfaz moderna y un rendimiento de alto nivel.

![Versión](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)
![Vite](https://img.shields.io/badge/Vite-7-646cff.svg)

## ✨ Características

- **Procesamiento en Tiempo Real:** Visualiza cómo varía la calidad de la imagen al ajustar el rango $k$ mediante un slider fluido.
- **Arquitectura de Alto Rendimiento:**
  - **Web Workers:** El cálculo pesado de la SVD ocurre en un hilo secundario para no bloquear la interfaz.
  - **Zero-Copy Memory:** Uso de *Transferable Objects* para mover datos entre hilos sin sobrecarga de clonación.
  - **Caché Friendly:** Algoritmo de reconstrucción optimizado para acceso contiguo a la memoria (Simulación de matrices en Float32Array).
- **Diseño Premium:** Estética oscura con efectos de *glassmorphism*, animaciones fluidas con `framer-motion` y tipografía cuidada.
- **Educativo:** Incluye una sección explicativa detallada sobre los fundamentos matemáticos de la SVD ($A = U\Sigma V^T$).

## 🚀 Tecnologías

- **Frontend:** React 19 + TypeScript.
- **Álgebra Lineal:** `ml-matrix` para factorizaciones de alta precisión.
- **Animaciones:** Framer Motion para transiciones y micro-interacciones.
- **Estilo:** CSS Moderno con variables y filtros de desenfoque.
- **Build Tool:** Vite para una experiencia de desarrollo instantánea.

## 🛠️ Instalación y Uso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/svd-imagen.git
   cd svd-imagen
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir para producción:**
   ```bash
   npm run build
   ```

## 🧠 ¿Cómo funciona la SVD aquí?

La aplicación descompone cada canal de color (R, G, B) de la imagen cargada en tres matrices:
1. **U:** Vectores singulares izquierdos (base ortogonal de columnas).
2. **Σ:** Valores singulares (importancia de cada componente).
3. **Vᵀ:** Vectores singulares derechos (base ortogonal de filas).

Al reducir el valor de $k$, nos quedamos solo con los $k$ valores más grandes de $\Sigma$, lo que permite representar la imagen con una fracción mínima de los datos originales, sacrificando solo el ruido o los detalles de alta frecuencia.

---

Creado con ❤️ por [Norberto A. Hernández-Leandro](https://github.com/norberto89).
