document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    
    // 1. Función para alternar el menú de navegación (Hamburguesa)
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active'); 
        });
    }

    // 2. LÓGICA PARA EL CARRUSEL DE CATEGORÍAS
    function setupCategoriesCarousel() {
        const carouselSelector = '.categorias-destacadas .categorias-carousel';
        const trackSelector = '.categorias-track';
        const prevBtnSelector = '.categorias-carousel .cat-btn.prev';
        const nextBtnSelector = '.categorias-carousel .cat-btn.next';

        const carousel = document.querySelector(carouselSelector);
        if (!carousel) {
            console.warn(`Carrusel no encontrado: ${carouselSelector}`);
            return;
        }

        const track = carousel.querySelector(trackSelector);
        const prevBtn = carousel.querySelector(prevBtnSelector);
        const nextBtn = carousel.querySelector(nextBtnSelector);
        
        if (!track || !prevBtn || !nextBtn) {
            console.error("Elementos del carrusel (track, prevBtn, nextBtn) no encontrados.");
            return;
        }

        // Función para calcular el paso de desplazamiento
        const calculateScrollStep = () => {
            const firstCard = track.querySelector('.categoria-card');
            // Si no hay tarjetas, usamos un valor por defecto.
            // Asegúrate de que el min-width y gap en tu CSS coincidan.
            const cardWidth = firstCard ? firstCard.offsetWidth : 250; 
            const gap = 30; // Asegúrate de que esto coincida con el 'gap' de tu CSS
            return cardWidth + gap;
        };

        // Función para verificar y actualizar el estado de los botones
        const checkButtonStates = () => {
            // Deshabilitar 'prev' si está al principio
            prevBtn.disabled = track.scrollLeft <= 0;
            
            // Deshabilitar 'next' si está al final
            // Usamos track.scrollWidth - track.clientWidth para saber cuánto falta para el final
            // Restamos 1 o 2 px para manejar posibles imprecisiones de flotantes en el navegador
            nextBtn.disabled = Math.ceil(track.scrollLeft) + track.clientWidth >= track.scrollWidth - 2; 
        };

        // Event listener para el botón 'prev'
        prevBtn.addEventListener('click', () => {
            track.scrollBy({
                left: -calculateScrollStep(),
                behavior: 'smooth'
            });
        });

        // Event listener para el botón 'next'
        nextBtn.addEventListener('click', () => {
            track.scrollBy({
                left: calculateScrollStep(),
                behavior: 'smooth'
            });
        });

        // Escuchar el evento de desplazamiento del track para actualizar el estado de los botones
        track.addEventListener('scroll', checkButtonStates);

        // Escuchar el evento de redimensionamiento de la ventana para recalcular y actualizar el estado
        window.addEventListener('resize', () => {
            // No necesitamos recalcular scrollStep aquí a menos que el ancho de la tarjeta cambie con el resize
            checkButtonStates();
        });

        // Llamar a checkButtonStates al cargar la página para establecer el estado inicial
        checkButtonStates();
    }

    // Inicializar el carrusel de categorías cuando el DOM esté listo
    setupCategoriesCarousel();

    // Nota: La función renderProductos() fue eliminada del HTML y JS porque la sección de productos fue quitada.
});