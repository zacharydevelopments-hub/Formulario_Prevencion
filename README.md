# Ficha de Levantamiento de Procesos, Puestos y Tareas

Formulario web (HTML/CSS/JS puro, sin build ni dependencias de instalación) que reproduce
la ficha de levantamiento y permite exportarla como PDF con un clic.

## Archivos

- `index.html` — estructura del formulario
- `style.css` — estilos
- `script.js` — filas dinámicas de la tabla resumen, autoguardado y exportación a PDF (vía [html2pdf.js](https://github.com/eKoopmans/html2pdf.js), cargado desde CDN)

No hay backend ni base de datos: los datos se guardan solo en el navegador de quien completa
el formulario (`localStorage`), y el PDF se genera en el propio navegador con el botón
**Generar PDF**.

## Probarlo en local

Solo abre `index.html` en el navegador, o levanta un servidor simple:

```bash
npx serve .
# o
python3 -m http.server 5500
```

## Subir a GitHub

```bash
cd ficha-levantamiento
git init
git add .
git commit -m "Ficha de levantamiento de procesos, puestos y tareas"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

## Desplegar en Vercel

1. Entra a [vercel.com](https://vercel.com) → **Add New Project** → importa el repositorio de GitHub.
2. Es un sitio estático: no hace falta configurar *build command* ni *output directory*
   (déjalos vacíos/por defecto). Vercel detecta el `index.html` automáticamente.
3. **Deploy**. En un par de minutos queda disponible en una URL `https://<proyecto>.vercel.app`.

Cada vez que hagas `git push` a `main`, Vercel vuelve a desplegar automáticamente.

## Notas

- El botón **Limpiar** borra el borrador guardado en el navegador y deja el formulario en blanco.
- El indicador junto a los botones muestra cuándo se guardó el último borrador automático.
- Los campos "Empresa", "Realizado por" y "Cargo" vienen prellenados con los valores de la
  ficha original; se pueden editar libremente.
