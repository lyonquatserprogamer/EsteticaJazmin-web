# Jazmin Estetica

Sitio web estatico listo para publicar en GitHub Pages.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub y sube `index.html`, `styles.css`, `script.js` y `README.md`.
2. En el repositorio, abre **Settings > Pages**.
3. En **Build and deployment**, elige **Deploy from a branch**, selecciona `main` y la carpeta `/root`.
4. Guarda los cambios. GitHub mostrara la URL publica del sitio.

## Personalizar

- Cambia los textos de contacto, direccion y precios en `index.html`.
- Reemplaza las URLs de imagen de Unsplash por fotos propias si lo deseas.
- El contacto de WhatsApp esta configurado en los enlaces de `index.html` y `script.js`.
- El formulario funciona sin servidor: valida la fecha y abre una solicitud prellenada en WhatsApp.

## Panel privado de empleados

El panel de reservas esta disponible en `/admin.html` y no aparece en el menu publico.

1. En Supabase, abre **SQL Editor** y ejecuta todo el contenido de `supabase-schema.sql`.
2. En **Authentication > Users**, crea una cuenta para cada empleado autorizado.
3. Comparte con ellos esta direccion: `https://lyonquatserprogamer.github.io/EsteticaJazmin-web/admin.html`.
4. Cada empleado inicia sesion con su propio correo y contraseña.

El panel muestra nombre, WhatsApp, apartado, tratamiento, fecha y hora. La pagina publica solo consulta disponibilidad y no expone esos datos personales.
