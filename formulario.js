// CLAVES DE CONEXIÓN
// *******************************************************************
const SUPABASE_URL = 'https://jmccyspvktlcywffqtlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptY2N5c3B2a3RsY3l3ZmZxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjA3NjUsImV4cCI6MjA4MDI5Njc2NX0.2nw0wSS3JZ9c0i9lEB76JIxHZhSyFnN9o1IhWu2myZg'; 
// *******************************************************************

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

const form = document.getElementById('productForm');
const mensaje = document.getElementById('mensaje');
const submitBtn = document.getElementById('submitBtn');
const productList = document.getElementById('productList'); // Nuevo
const loadingMessage = document.getElementById('loadingMessage'); // Nuevo

const BUCKET_NAME = 'imagenes-catalogo-base-480102'; 

form.addEventListener('submit', handleFormSubmit);

// *******************************************************************
// 🔄 INICIALIZACIÓN: Cargar productos al iniciar la página
// *******************************************************************

// Llama a la función de carga de productos inmediatamente
fetchProducts(); 

// *******************************************************************
// 🛠️ FUNCIONES DE GESTIÓN (CREATE)
// *******************************************************************

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // ... (Tu lógica de guardado de producto actual, que ya funciona) ...
    
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

        if (storageError) {
             console.error("Error de Subida a Storage:", storageError);
             throw new Error(`❌ Storage Falló: ${storageError.message}`); 
        }

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

        if (dbError) {
             console.error("Error de Inserción DB:", dbError);
             throw new Error(`❌ Base de Datos Falló: ${dbError.message}`);
        }

        // Éxito
        mensaje.textContent = `✅ Producto "${nombre}" guardado con éxito.`;
        mensaje.className = 'message success';
        form.reset();

        // 🟢 NUEVO: Actualizar la lista después de crear un producto
        fetchProducts(); 

    } catch (error) {
        // Manejo de errores 
        console.error('Error General de Operación:', error); 
        
        let displayMessage = error.message || "Error desconocido. Revisa la Consola (F12).";
        
        mensaje.textContent = `🚨 Falló la operación: ${displayMessage}`;
        mensaje.className = 'message error';
    } finally {
        submitBtn.disabled = false;
    }
}

// *******************************************************************
// 👁️ FUNCIONES DE LECTURA Y VISUALIZACIÓN (READ)
// *******************************************************************

async function fetchProducts() {
    loadingMessage.textContent = 'Cargando productos...';
    
    const { data, error } = await supabase
        .from('productos')
        .select('*') // Selecciona todas las columnas
        .order('id', { ascending: false }); // Ordenar por ID descendente (los más nuevos primero)

    if (error) {
        console.error('Error al cargar productos:', error.message);
        loadingMessage.textContent = `Error al cargar productos: ${error.message}`;
        return;
    }

    loadingMessage.style.display = 'none'; // Ocultar el mensaje de carga
    renderProducts(data);
}

function renderProducts(products) {
    if (products.length === 0) {
        productList.innerHTML = '<p>No hay productos en el inventario.</p>';
        return;
    }

    let html = '<table><thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Imagen</th><th>Acciones</th></tr></thead><tbody>';
    
    products.forEach(product => {
        html += `
            <tr data-id="${product.id}">
                <td>${product.id}</td>
                <td><span class="editable" data-field="nombre">${product.nombre}</span></td>
                <td>$<span class="editable" data-field="precio">${product.precio}</span></td>
                <td><span class="editable" data-field="stock">${product.stock}</span></td>
                <td><img src="${product.url_imagen}" alt="${product.nombre}" style="width: 50px; height: auto;"></td>
                <td>
                    <button class="edit-btn" data-id="${product.id}">Editar</button>
                    <button class="delete-btn" data-id="${product.id}">Eliminar</button>
                    <button class="save-btn" data-id="${product.id}" style="display:none;">Guardar</button>
                    <button class="cancel-btn" data-id="${product.id}" style="display:none;">Cancelar</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    productList.innerHTML = html;
    
    // Añadir listeners para los nuevos botones
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteProduct(e.target.dataset.id));
    });
    
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', startEditMode);
    });
}

// *******************************************************************
// ❌ FUNCIÓN DE ELIMINACIÓN (DELETE)
// *******************************************************************

async function deleteProduct(productId) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto con ID: ${productId}?`)) {
        return;
    }

    // ⚠️ Importante: Aquí solo eliminamos el registro de la DB. 
    // Si quieres eliminar el archivo de imagen de Storage, se necesita un paso adicional de Supabase Functions.

    const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', productId);

    if (error) {
        console.error('Error al eliminar producto:', error.message);
        alert(`Fallo al eliminar: ${error.message}`);
        return;
    }

    // Actualizar la lista después de eliminar
    alert(`✅ Producto con ID ${productId} eliminado con éxito.`);
    fetchProducts();
}


// *******************************************************************
// ✏️ FUNCIONES DE EDICIÓN (UPDATE)
// *******************************************************************

// Estado temporal para guardar los valores originales antes de editar
let originalValues = {};

function startEditMode(e) {
    const row = e.target.closest('tr');
    const productId = row.dataset.id;
    
    // 1. Mostrar/Ocultar botones
    row.querySelector('.edit-btn').style.display = 'none';
    row.querySelector('.delete-btn').style.display = 'none';
    row.querySelector('.save-btn').style.display = 'inline-block';
    row.querySelector('.cancel-btn').style.display = 'inline-block';

    // 2. Habilitar edición y guardar valores originales
    row.querySelectorAll('.editable').forEach(span => {
        const field = span.dataset.field;
        originalValues[field] = span.textContent; // Guardar valor original
        
        const input = document.createElement('input');
        input.type = (field === 'precio' || field === 'stock') ? 'number' : 'text';
        input.value = span.textContent;
        input.dataset.field = field; // Para identificarlo en el guardado
        
        span.replaceWith(input);
    });
    
    // 3. Añadir listener de Guardar
    row.querySelector('.save-btn').addEventListener('click', () => saveChanges(productId, row));
    row.querySelector('.cancel-btn').addEventListener('click', () => cancelEdit(row, productId));
}

function cancelEdit(row, productId) {
    row.querySelectorAll('input').forEach(input => {
        const span = document.createElement('span');
        span.className = 'editable';
        span.dataset.field = input.dataset.field;
        span.textContent = originalValues[input.dataset.field]; // Restaurar valor
        input.replaceWith(span);
    });
    
    // Ocultar/Mostrar botones
    row.querySelector('.edit-btn').style.display = 'inline-block';
    row.querySelector('.delete-btn').style.display = 'inline-block';
    row.querySelector('.save-btn').style.display = 'none';
    row.querySelector('.cancel-btn').style.display = 'none';
    delete originalValues[productId];
}


async function saveChanges(productId, row) {
    let updates = {};
    let hasChanges = false;
    
    row.querySelectorAll('input').forEach(input => {
        const field = input.dataset.field;
        let newValue = input.value;
        
        // Convertir tipos de dato
        if (field === 'precio') {
            newValue = parseFloat(newValue);
        } else if (field === 'stock') {
            newValue = parseInt(newValue);
        }

        // Comprobar si realmente hubo un cambio
        if (newValue !== originalValues[field]) {
            updates[field] = newValue;
            hasChanges = true;
        }
    });

    if (!hasChanges) {
        alert("No se detectaron cambios.");
        cancelEdit(row, productId);
        return;
    }

    const { error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', productId);

    if (error) {
        console.error('Error al actualizar producto:', error.message);
        alert(`Fallo al actualizar: ${error.message}`);
        return;
    }

    alert('✅ Producto actualizado con éxito.');
    // Limpiar el modo edición y recargar la lista para mostrar el resultado
    fetchProducts();
}