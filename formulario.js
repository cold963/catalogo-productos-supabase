// ===============================================
// 1. CONFIGURACIÓN DE SUPABASE (CON TUS CLAVES)
// ===============================================
const SUPABASE_URL = 'https://jmccyspvktlcywffqtlk.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptY2N5c3B2a3RsY3l3ZmZxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjA3NjUsImV4cCI6MjA4MDI5Njc2NX0.2nw0wSS3JZ9c0i9lEB76JIxHZhSyFnN9o1IhWu2myZg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🚀 Bucket de almacenamiento. ¡Asegúrate de que este nombre sea correcto!
const STORAGE_BUCKET_NAME = 'imagenes-productos'; 

// Variable para guardar los valores originales al entrar en modo edición
const originalValues = {};

// ===============================================
// 2. FUNCIONES DE UTILIDAD
// ===============================================

/** Muestra mensajes de estado (éxito o error) */
function showMessage(msg, type) {
    const messageElement = document.getElementById('message');
    messageElement.textContent = msg;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

// ===============================================
// 3. CRUD: READ (LEER / OBTENER PRODUCTOS)
// ===============================================

/** Obtiene los productos de Supabase y los renderiza en la tabla */
async function renderProducts() {
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error al cargar productos:', error.message);
        showMessage('Error al cargar productos: ' + error.message, 'error');
        return;
    }

    const productListDiv = document.getElementById('productList');
    
    if (!productos || productos.length === 0) {
        productListDiv.innerHTML = '<p class="message success">No hay productos registrados.</p>';
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th> 
                    <th>Imagen</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productos.forEach(product => {
        html += `
            <tr data-id="${product.nombre}">
                <td data-label="Nombre:"><span class="editable" data-field="nombre">${product.nombre}</span></td>
                <td data-label="Precio:">$<span class="editable" data-field="precio">${product.precio}</span></td>
                <td data-label="Stock:"><span class="editable" data-field="stock">${product.stock}</span></td>
                <td data-label="Categoría:"><span class="editable" data-field="categoria">${product.categoria}</span></td>
                <td data-label="Imagen:"><img src="${product.url_imagen}" alt="${product.nombre}" style="width: 50px; height: auto;"></td>
                <td data-label="Acciones:">
                    <button class="edit-btn" data-id="${product.nombre}">Editar</button>
                    <button class="delete-btn" data-id="${product.nombre}">Eliminar</button>
                    <button class="save-btn" data-id="${product.nombre}" style="display:none;">Guardar</button>
                    <button class="cancel-btn" data-id="${product.nombre}" style="display:none;">Cancelar</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;

    productListDiv.innerHTML = html;
    attachEventListeners();
}

// ===============================================
// 4. CRUD: CREATE (AGREGAR PRODUCTOS CON SUBIDA)
// ===============================================

async function addProduct() {
    // 1. Recoger datos del formulario
    const productName = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const stock = parseInt(document.getElementById('stock').value);
    const categoria = document.getElementById('categoria').value;
    const imagenFile = document.getElementById('imagenFile').files[0];

    // Validación
    if (!productName || isNaN(price) || isNaN(stock) || !imagenFile || !categoria) {
        showMessage('Por favor, completa todos los campos y selecciona una imagen y categoría.', 'error');
        return;
    }
    
    // Deshabilitar botón para evitar doble subida
    const submitButton = document.querySelector('#productForm button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Subiendo...';


    // ===============================================
    // 2. SUBIR LA IMAGEN A SUPABASE STORAGE
    // ===============================================
    const fileExtension = imagenFile.name.split('.').pop();
    // Nombre de archivo único: NombreProducto_Timestamp.ext
    const filePath = `${productName.toLowerCase().replace(/\s/g, '_')}_${Date.now()}.${fileExtension}`;
    
    const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(filePath, imagenFile);

    if (uploadError) {
        console.error('Error al subir imagen:', uploadError.message);
        showMessage(`Fallo al subir imagen: ${uploadError.message}`, 'error');
        submitButton.disabled = false;
        submitButton.textContent = 'Agregar Producto';
        return;
    }

    // 3. Obtener la URL pública de la imagen
    const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(filePath);

    const urlImagen = publicUrlData.publicUrl;

    // ===============================================
    // 4. GUARDAR EL REGISTRO EN LA TABLA DE PRODUCTOS
    // ===============================================
    const { error: insertError } = await supabase
        .from('productos')
        .insert([
            { 
                nombre: productName, 
                precio: price, 
                stock: stock, 
                url_imagen: urlImagen,
                categoria: categoria 
            }
        ]);

    submitButton.disabled = false;
    submitButton.textContent = 'Agregar Producto';

    if (insertError) {
        // Opcional: Si falla la inserción en DB, podrías eliminar el archivo subido.
        console.error('Error al agregar producto en DB:', insertError.message);
        showMessage(`Fallo al agregar producto: ${insertError.message}`, 'error');
        return;
    }

    showMessage('✅ Producto agregado correctamente.', 'success');
    document.getElementById('productForm').reset();
    renderProducts();
}

// Escucha el evento submit del formulario de agregar
document.getElementById('productForm').addEventListener('submit', function(event) {
    event.preventDefault();
    addProduct();
});

// ===============================================
// 5. CRUD: UPDATE (EDITAR PRODUCTOS)
// ===============================================

function startEditMode(row) {
    const productName = row.dataset.id;
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');

    editBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';

    row.querySelectorAll('.editable').forEach(span => {
        const field = span.dataset.field;
        
        if (field === 'nombre' || field === 'categoria') {
            originalValues[productName + field] = span.textContent;
            return;
        }
        
        originalValues[productName + field] = span.textContent; 
        
        const input = document.createElement('input');
        input.type = (field === 'precio' || field === 'stock') ? 'number' : 'text'; 
        input.value = span.textContent.replace('$', ''); 
        input.dataset.field = field; 
        
        span.replaceWith(input);
    });
}

async function saveEdit(row) {
    const productName = row.dataset.id;
    const updateData = {};
    let hasChanged = false;

    row.querySelectorAll('input').forEach(input => {
        const field = input.dataset.field;
        let newValue = input.value;
        let originalValue = originalValues[productName + field];

        if (field === 'precio' || field === 'stock') {
            newValue = parseFloat(newValue);
            originalValue = parseFloat(originalValue);
        }
        
        if (newValue !== originalValue) {
            updateData[field] = newValue;
            hasChanged = true;
        }
    });

    if (!hasChanged) {
        showMessage('No se realizaron cambios.', 'error');
        endEditMode(row, true);
        return;
    }

    const { error } = await supabase
        .from('productos')
        .update(updateData)
        .eq('nombre', productName); 

    if (error) {
        console.error('Error al actualizar producto:', error.message);
        showMessage(`Fallo al actualizar: ${error.message}`, 'error');
        endEditMode(row, true); 
        return;
    }

    showMessage('✅ Producto actualizado correctamente.', 'success');
    renderProducts();
}

function endEditMode(row, useOriginalValues = false) {
    const productName = row.dataset.id;
    
    row.querySelectorAll('input').forEach(input => {
        const field = input.dataset.field;
        
        const span = document.createElement('span');
        span.className = 'editable';
        span.dataset.field = field;
        
        let content = useOriginalValues ? originalValues[productName + field] : input.value;
        
        if (field === 'precio' && content && !isNaN(parseFloat(content))) {
            span.textContent = `$${parseFloat(content).toFixed(2)}`;
        } else {
            span.textContent = content;
        }

        input.replaceWith(span);
    });
    
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    const saveBtn = row.querySelector('.save-btn');
    const cancelBtn = row.querySelector('.cancel-btn');

    editBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}


// ===============================================
// 6. CRUD: DELETE (ELIMINAR PRODUCTOS)
// ===============================================

async function deleteProduct(productName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto: ${productName}?`)) {
        return;
    }

    // Nota: Si quieres eliminar la imagen de Storage también, necesitarías 
    // guardar el nombre del archivo (no la URL) en la DB y usar supabase.storage.remove().
    // Por simplicidad, solo eliminamos el registro de la tabla.

    const { error } = await supabase
        .from('productos')
        .delete()
        .eq('nombre', productName);

    if (error) {
        console.error('Error al eliminar producto:', error.message);
        alert(`Fallo al eliminar: ${error.message}`);
        return;
    }

    showMessage(`🗑️ Producto "${productName}" eliminado correctamente.`, 'success');
    renderProducts();
}


// ===============================================
// 7. LISTENERS Y EJECUCIÓN INICIAL
// ===============================================

/** Adjunta los listeners de los botones de la tabla */
function attachEventListeners() {
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.onclick = (e) => startEditMode(e.target.closest('tr'));
    });

    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.onclick = (e) => saveEdit(e.target.closest('tr'));
    });

    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.onclick = (e) => endEditMode(e.target.closest('tr'), true);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = (e) => {
            const productName = e.target.dataset.id;
            deleteProduct(productName);
        };
    });
}

// Carga los productos al iniciar la página
document.addEventListener('DOMContentLoaded', renderProducts);