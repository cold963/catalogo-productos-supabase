document.addEventListener('DOMContentLoaded', () => {
    // Menú Responsive
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');

    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            navList.classList.toggle('active');
            // Cambiar ícono del botón de menú
            const icon = menuToggle.querySelector('i');
            if (navList.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times'); // Ícono de cerrar
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars'); // Ícono de hamburguesa
            }
        });

        // Ocultar el menú al hacer clic en un enlace (para móviles)
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navList.classList.contains('active')) {
                    navList.classList.remove('active');
                    const icon = menuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // Animación de aparición de elementos (si se desea más control que el CSS)
    // Esto es un ejemplo, las animaciones CSS @keyframes ya están funcionando
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated'); // Agrega una clase para activar la animación
                observer.unobserve(entry.target); // Deja de observar una vez que ha animado
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observar secciones para animaciones
    const sectionsToAnimate = document.querySelectorAll('.featured-products, .cta-section');
    sectionsToAnimate.forEach(section => {
        observer.observe(section);
    });

    // Pequeña animación para los productos al cargar la página
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.15}s`; // Retraso escalonado
        card.style.animationName = 'fadeIn'; // Usar la animación fadeIn
        card.style.animationDuration = '0.8s';
        card.style.animationFillMode = 'both';
    });

    // Puedes añadir más lógica aquí, como un carrusel para el hero banner
    // o un contador de artículos en el carrito
});