// =======================================================
// CONFIGURACIÓN DE SUPABASE (Tus claves)
// =======================================================
const SUPABASE_URL = 'https://jmccyspvktlcywffqtlk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptY2N5c3B2a3RsY3l3ZmZxdGxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjA3NjUsImV4cCI6MjA4MDI5Njc2NX0.2nw0wSS3JZ9c0i9lEB76JIxHZhSyFnN9o1IhWu2myZg'; 

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY); 

// Variable para guardar todos los productos cargados (necesario para el buscador)
let allLoadedProducts = []; 

// =======================================================
// 📚 FUNCIÓN PARA CARGAR TODOS LOS PRODUCTOS
// =======================================================

async function loadAllProducts(targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    container.innerHTML = '<p>Cargando productos...</p>';
    
    // 1. Consulta SIN filtro de categoría
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true }); 

    if (error) {
        console.error('Error al cargar productos:', error.message);
        container.innerHTML = '<p class="error">Error al cargar productos: ' + error.message + '</p>';
        return;
    }

    // 2. Guardar los productos en la variable global
    allLoadedProducts = productos;

    // 3. Renderizar y luego inicializar
    renderProducts(productos, container); 
    initCartLogic(); 
}


// =======================================================
// 📚 FUNCIÓN DE CARGAR PRODUCTOS POR CATEGORÍA (Mantenida)
// Se usará en páginas secundarias (ej: maquillaje.html)
// =======================================================

async function loadProductsByCategory(categoryName, targetElementId) {
    const container = document.getElementById(targetElementId);
    if (!container) return;

    container.innerHTML = '<p>Cargando productos de ' + categoryName.replace('_', ' ') + '...</p>';
    
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .eq('categoria', categoryName) 
        .order('nombre', { ascending: true }); 

    if (error) {
        console.error('Error al cargar productos:', error.message);
        container.innerHTML = '<p class="error">Error al cargar productos: ' + error.message + '</p>';
        return;
    }

    allLoadedProducts = productos; // También guardamos los productos filtrados aquí
    renderProducts(productos, container);
    initCartLogic(); 
}

// =======================================================
// 🎨 FUNCIÓN DE RENDERIZADO COMÚN
// =======================================================

function renderProducts(products, container) {
    if (products.length === 0) {
        container.innerHTML = '<p>No hay productos disponibles.</p>';
        return;
    }

    let htmlContent = '';
    products.forEach(product => {
        // Usamos la columna 'stock' para deshabilitar la compra
        const isOutOfStock = product.stock <= 0;
        const buttonText = isOutOfStock ? 'Agotado' : 'Agregar al Carrito';
        
        htmlContent += `
            <div class="product-card" data-nombre="${product.nombre}">
                <img src="${product.url_imagen}" alt="${product.nombre}">
                <div class="card-body">
                    <h3>${product.nombre}</h3>
                    <p class="price">$${product.precio.toFixed(2)}</p>
                    <p class="stock">Stock: ${isOutOfStock ? '0' : product.stock}</p>
                    <button class="add-to-cart-btn" 
                            data-id="${product.nombre}" 
                            data-price="${product.precio}"
                            data-stock="${product.stock}"
                            data-name="${product.nombre}"
                            ${isOutOfStock ? 'disabled' : ''}>
                        ${buttonText}
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}

// =======================================================
// 🔎 FUNCIÓN DE BÚSQUEDA / FILTRADO
// =======================================================

function filterProducts() {
    const searchInput = document.getElementById('search-input');
    const container = document.getElementById('product-container');
    
    if (!searchInput || !container) return;

    const searchTerm = searchInput.value.toLowerCase();
    
    // Filtrar la lista completa de productos cargados
    const filteredProducts = allLoadedProducts.filter(product => {
        // Busca si el nombre o la categoría incluye el término de búsqueda
        return product.nombre.toLowerCase().includes(searchTerm) || 
               product.categoria.toLowerCase().includes(searchTerm);
    });

    renderProducts(filteredProducts, container);
    initCartLogic(); // Re-adjuntar listeners de carrito a los nuevos botones renderizados
}


// =======================================================
// 🧭 FUNCIÓN DE SLIDER PARA CATEGORÍAS
// =======================================================

function scrollCategories(direction) {
    const list = document.getElementById('categories-list');
    if (list) {
        // Desplaza 250px en la dirección indicada (-1: izquierda, 1: derecha)
        list.scrollBy({ left: direction * 250, behavior: 'smooth' });
    }
}

// Hacer que la función de scroll esté disponible globalmente
window.scrollCategories = scrollCategories; 
window.filterProducts = filterProducts; 


// =======================================================
// 🛒 LÓGICA DEL CARRITO DE COMPRAS (Mantenida de la respuesta anterior)
// Puedes dejar el resto de las funciones de carrito (getCart, saveCart, addToCart, etc.)
// tal como te las di en la respuesta anterior, ya que esa lógica es independiente
// del HTML del catálogo, solo necesitas que se ejecute initCartLogic() al final.
// (Aquí iría todo el código de carrito que ya te proporcioné)
// =======================================================


const CART_KEY = 'shopping_cart';

function getCart() {
    const cartJson = localStorage.getItem(CART_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartDisplay();
}

function updateCartCount(cart) {
    const cartCountElement = document.getElementById('cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0); 
    cartCountElement.textContent = totalItems;
}

function addToCart(productData) {
    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === productData.id);

    if (productData.stock <= 0) {
        alert('Este producto está agotado temporalmente.');
        return;
    }

    if (existingItemIndex > -1) {
        const existingItem = cart[existingItemIndex];
        if (existingItem.quantity < existingItem.stock) {
            existingItem.quantity += 1;
        } else {
             alert(`Solo quedan ${existingItem.stock} unidades de este producto.`);
             return;
        }
    } else {
        cart.push({
            id: productData.id,
            name: productData.name,
            price: productData.price,
            stock: parseInt(productData.stock),
            quantity: 1
        });
    }

    saveCart(cart);
}

function removeProductFromCart(productId) {
    const cart = getCart();
    const newCart = cart.filter(item => item.id !== productId);
    saveCart(newCart);
    renderCartModal();
}

function changeItemQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);

    if (item) {
        const newQuantity = item.quantity + delta;
        
        if (newQuantity <= 0) {
            removeProductFromCart(productId);
            return;
        } 
        
        if (newQuantity > item.stock) {
            alert(`Solo puedes agregar ${item.stock} unidades, es el stock disponible.`);
            return;
        }

        item.quantity = newQuantity;
        saveCart(cart);
        renderCartModal();
    }
}

function clearCart() {
    if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
        saveCart([]);
        renderCartModal();
    }
}

function renderCartModal() {
    const cart = getCart();
    const listContainer = document.getElementById('cart-items-list');
    const totalElement = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');
    let total = 0;
    
    if (cart.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #6c757d;">El carrito está vacío.</p>';
        totalElement.textContent = '$0.00';
        checkoutButton.disabled = true;
        return;
    }
    
    checkoutButton.disabled = false;
    
    let html = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-info">
                    <strong>${item.name}</strong>
                    <p>$${item.price.toFixed(2)} c/u</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn decrease-btn" data-id="${item.id}" data-delta="-1">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-id="${item.id}" data-delta="1">+</button>
                    <button class="remove-btn" data-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
                <p style="width: 80px; text-align: right;">$${itemTotal.toFixed(2)}</p>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
    totalElement.textContent = `$${total.toFixed(2)}`;

    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            const delta = parseInt(btn.dataset.delta);
            changeItemQuantity(id, delta);
        };
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.onclick = () => removeProductFromCart(btn.dataset.id);
    });
}

function updateCartDisplay() {
    const cart = getCart();
    updateCartCount(cart);
}


function initCartLogic() {
    // 1. Listeners para agregar productos (en las tarjetas)
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        // Primero, limpiamos cualquier listener previo si la función fue llamada por el buscador
        button.onclick = null; 
        
        button.addEventListener('click', (e) => {
            const dataset = e.target.dataset;
            addToCart({
                id: dataset.id,
                name: dataset.name,
                price: parseFloat(dataset.price),
                stock: parseInt(dataset.stock)
            });
            alert(`"${dataset.name}" añadido al carrito!`);
        });
    });

    // 2. Lógica del Modal del Carrito
    const modal = document.getElementById('cart-modal');
    const btn = document.getElementById('cart-button');
    const span = document.getElementsByClassName('close-button')[0];
    const clearBtn = document.getElementById('clear-cart-button');
    const checkoutBtn = document.getElementById('checkout-button');

    if(btn) btn.onclick = function() {
        modal.style.display = 'block';
        renderCartModal();
    }

    if(span) span.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }
    
    if(clearBtn) clearBtn.onclick = clearCart;
    if(checkoutBtn) checkoutBtn.onclick = () => alert('¡Procesando compra! (Falta implementar la pasarela de pago)');

    // 3. Cargar la cuenta del carrito al iniciar la página
    updateCartDisplay(); 
}