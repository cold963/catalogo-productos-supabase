// ===============================================
// 1. CONFIGURACIÓN DE SUPABASE
// ¡¡REEMPLAZA ESTAS CLAVES CON LAS TUYAS!!
// ===============================================
const SUPABASE_URL = 'TU_URL_DE_SUPABASE'; 
const SUPABASE_ANON_KEY = 'TU_CLAVE_ANON_DE_SUPABASE';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    
    // Limpiar el mensaje después de 5 segundos
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
        .order('nombre', { ascending: true }); // Ordena por nombre

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

    // Construcción de la tabla
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
        // 🚨 IMPORTANTE: Usamos el 'nombre' como data-id para las operaciones de CRUD
        // 💡 Añadimos data-label para que el modo responsive del CSS funcione
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
    attachEventListeners(); // Adjunta listeners a los nuevos botones
}

// ===============================================
// 4. CRUD: CREATE (AGREGAR PRODUCTOS)
// ===============================================

async function addProduct() {
    const productName = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('price').value);
    const stock = parseInt(document.getElementById('stock').value);
    const urlImagen = document.getElementById('urlImagen').value.trim();
    const categoria = document.getElementById('categoria').value; // <-- NUEVA LÍNEA

    // Validación básica de formulario
    if (!productName || isNaN(price) || isNaN(stock) || !urlImagen || !categoria) {
        showMessage('Por favor, completa todos los campos y selecciona una categoría.', 'error');
        return;
    }

    const { error } = await supabase
        .from('productos')
        .insert([
            { 
                nombre: productName, 
                precio: price, 
                stock: stock, 
                url_imagen: urlImagen,
                categoria: categoria // <-- ENVÍO DE LA CATEGORÍA
            }
        ]);

    if (error) {
        console.error('Error al agregar producto:', error.message);
        showMessage(`Fallo al agregar producto: ${error.message}`, 'error');
        return;
    }

    showMessage('✅ Producto agregado correctamente.', 'success');
    document.getElementById('productForm').reset(); // Limpia el formulario
    renderProducts(); // Vuelve a cargar la lista
}

// Escucha el evento submit del formulario de agregar
document.getElementById('productForm').addEventListener('submit', function(event) {
    event.preventDefault();
    addProduct();
});

// ===============================================
// 5. CRUD: UPDATE (EDITAR PRODUCTOS)
// ===============================================

/** Inicia el modo de edición para una fila */
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

    // 2. Habilitar edición y guardar valores originales
    row.querySelectorAll('.editable').forEach(span => {
        const field = span.dataset.field;
        
        // ⚠️ Solo hacemos editables PRECIO y STOCK. 
        // El nombre (identificador) y la categoría se mantienen fijos para evitar problemas de RLS/Filtrado.
        if (field === 'nombre' || field === 'categoria') {
            originalValues[productName + field] = span.textContent;
            return; // Salta al siguiente elemento sin crear un input
        }
        
        originalValues[productName + field] = span.textContent; 
        
        const input = document.createElement('input');
        input.type = (field === 'precio' || field === 'stock') ? 'number' : 'text'; 
        input.value = span.textContent.replace('$', ''); // Remueve el signo $ para edición de precio
        input.dataset.field = field; 
        
        span.replaceWith(input);
    });
}

/** Guarda los cambios editados en Supabase */
async function saveEdit(row) {
    const productName = row.dataset.id;
    const updateData = {};
    let hasChanged = false;

    // 1. Recoger nuevos valores
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
        endEditMode(row, true); // Vuelve al modo normal sin actualizar
        return;
    }

    // 2. Enviar a Supabase
    const { error } = await supabase
        .from('productos')
        .update(updateData)
        .eq('nombre', productName); // Filtramos por el nombre original

    if (error) {
        console.error('Error al actualizar producto:', error.message);
        showMessage(`Fallo al actualizar: ${error.message}`, 'error');
        endEditMode(row, true); // Finaliza con los valores originales
        return;
    }

    showMessage('✅ Producto actualizado correctamente.', 'success');
    renderProducts(); // Recarga para reflejar los cambios (incluido el formato de precio)
}

/** Cancela la edición o finaliza el modo edición */
function endEditMode(row, useOriginalValues = false) {
    const productName = row.dataset.id;
    
    // 1. Reemplazar inputs con spans y restaurar botones
    row.querySelectorAll('input').forEach(input => {
        const field = input.dataset.field;
        
        const span = document.createElement('span');
        span.className = 'editable';
        span.dataset.field = field;
        
        // Determinar el contenido: valor original o valor del input (si se guardó)
        let content = useOriginalValues ? originalValues[productName + field] : input.value;
        
        // Restaurar formato de precio si aplica
        if (field === 'precio' && content && !isNaN(parseFloat(content))) {
            span.textContent = `$${parseFloat(content).toFixed(2)}`;
        } else {
            span.textContent = content;
        }

        input.replaceWith(span);
    });
    
    // 2. Restaurar botones
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

    const { error } = await supabase
        .from('productos')
        .delete()
        .eq('nombre', productName); // Filtramos por la columna 'nombre'

    if (error) {
        console.error('Error al eliminar producto:', error.message);
        alert(`Fallo al eliminar: ${error.message}`);
        return;
    }

    showMessage(`🗑️ Producto "${productName}" eliminado correctamente.`, 'success');
    renderProducts(); // Vuelve a cargar la lista
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