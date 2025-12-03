// CLAVES DE CONEXIÓN
// *******************************************************************
const SUPABASE_URL = 'https://jmccyspvktlcywffqtlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptY2N5c3B2a3RsY3l3ZmZxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjA3NjUsImV4cCI6MjA4MDI5Njc2NX0.2nw0wSS3JZ9c0i9lEB76JIhWu2myZg';
// *******************************************************************

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const form = document.getElementById('productForm');
const mensaje = document.getElementById('mensaje');
const submitBtn = document.getElementById('submitBtn');

// ¡CORRECCIÓN CLAVE AQUÍ! Usando el nombre real del bucket
const BUCKET_NAME = 'imagenes-catalogo-base-480102'; // Nombre del Bucket de Storage

form.addEventListener('submit', handleFormSubmit);

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Deshabilitar botón y mostrar mensaje de progreso
    submitBtn.disabled = true;
    mensaje.className = 'message';
    mensaje.textContent = 'Guardando producto y subiendo imagen...';

    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const stock = document.getElementById('stock').value;
    const imagenFile = document.getElementById('imagen').files[0];
    
    // Generar ruta única para evitar colisiones
    const filePath = `public/${Date.now()}-${imagenFile.name.replace(/\s/g, '_')}`;

    try {
        // 1. SUBIR LA IMAGEN A SUPABASE STORAGE
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME) // ¡Usando el nombre correcto!
            .upload(filePath, imagenFile);

        if (storageError) throw new Error(`Error en Storage: ${storageError.message}. Revisa la política de subida.`);

        // 2. OBTENER LA URL PÚBLICA
        const { data: publicURLData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
        
        const url_imagen = publicURLData.publicUrl;

        // 3. GUARDAR LOS DATOS EN LA TABLA 'productos'
        const { error: dbError } = await supabase
            .from('productos')
            .insert([
                { 
                    nombre: nombre, 
                    precio: parseFloat(precio), 
                    stock: parseInt(stock), 
                    url_imagen: url_imagen 
                }
            ]);

        if (dbError) throw new Error(`Error en Base de Datos: ${dbError.message}. Revisa el nombre de la tabla.`);

        // Éxito
        mensaje.textContent = `✅ Producto "${nombre}" guardado con éxito.`;
        mensaje.className = 'message success';
        form.reset();

    } catch (error) {
        // Manejo de errores
        console.error('Error al guardar el producto:', error.message);
        mensaje.textContent = `❌ Falló la operación: ${error.message}`;
        mensaje.className = 'message error';
    } finally {
        submitBtn.disabled = false;
    }
}