// CLAVES DE CONEXIÓN
// *******************************************************************
const SUPABASE_URL = 'https://jmccyspvktlcywffqtlk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TdVcoZbtjLStF4Oi2XkMMA_CXjcehoN';
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
        const { data: uploadData, error: storageError } = await supabase.storage
             .from(BUCKET_NAME)
             .upload(filePath, imagenFile);

        // FORZAMOS LA REVISIÓN DEL ERROR DE STORAGE
        if (storageError) {
             console.error("Error de Subida a Storage:", storageError);
             throw new Error(`❌ Storage Falló: ${storageError.message}`);
        }

        // 2. OBTENER LA URL PÚBLICA (Ya no debería fallar)
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

        // FORZAMOS LA REVISIÓN DEL ERROR DE BASE DE DATOS
        if (dbError) {
             console.error("Error de Inserción DB:", dbError);
             throw new Error(`❌ Base de Datos Falló: ${dbError.message}`);
        }

        // Éxito
        mensaje.textContent = `✅ Producto "${nombre}" guardado con éxito.`;
        mensaje.className = 'message success';
        form.reset();

    } catch (error) {
        // Manejo de errores
        console.error('Error General de Operación:', error); // Muestra el objeto completo en F12
        
        // Muestra el mensaje de error EXACTO en la página
        let displayMessage = error.message || "Error desconocido. Revisa la Consola (F12).";
        
        mensaje.textContent = `🚨 Falló la operación: ${displayMessage}`;
        mensaje.className = 'message error';
    } finally {
        submitBtn.disabled = false;
    }
}