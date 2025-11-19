// public/dashboard.js
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================
    // 1. DEFENSA EN PROFUNDIDAD (SEGURIDAD)
    // ==========================================================
    // Aunque auth-guard.js hace el trabajo pesado, validamos aquí también.
    // Si el usuario le da "Atrás" después de salir, esto asegura que
    // sea expulsado inmediatamente.
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;

    try {
        currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (e) {
        console.error("Error al leer sesión:", e);
        // Si hay error leyendo, forzamos logout
    }

    // SI NO HAY SESIÓN VÁLIDA:
    if (!authToken || !currentUser) {
        // Limpieza preventiva
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        
        // REDIRECCIÓN DESTRUCTIVA
        // Usamos replace() para que el Dashboard no se guarde en el historial
        // y el botón "Atrás" no pueda volver a mostrar esta pantalla.
        window.location.replace('/home.html');
        return; // Detenemos la ejecución del resto del script
    }

    // ==========================================================
    // 2. LÓGICA DE INTERFAZ (UI)
    // ==========================================================

    // Lógica para Modo Oscuro
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                if (themeIcon) {
                    themeIcon.classList.remove('fa-moon');
                    themeIcon.classList.add('fa-sun');
                }
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                if (themeIcon) {
                    themeIcon.classList.remove('fa-sun');
                    themeIcon.classList.add('fa-moon');
                }
                localStorage.setItem('theme', 'light');
            }
        };

        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    }

    // Animación de entrada
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        // Pequeño timeout para asegurar que la transición CSS se note
        setTimeout(() => {
            mainContent.classList.add('visible');
        }, 50);
    }

    // ==========================================================
    // 3. LÓGICA DE NAVEGACIÓN DEL DIAGRAMA DE FLUJO
    // ==========================================================
    const permisoCards = document.querySelectorAll('.flowchart-tier.tier-2 .option-card');
    const allLowerCards = document.querySelectorAll('.flowchart-tier.tier-3 .option-card, .flowchart-tier.tier-4 .option-card');

    // Estado inicial: tarjetas inferiores deshabilitadas
    allLowerCards.forEach(card => card.classList.add('disabled'));

    permisoCards.forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault(); // Prevenir navegación inmediata
            
            const destination = card.getAttribute('href'); // Usar getAttribute es más seguro a veces que .href directo
            
            // Efecto visual de selección
            permisoCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            // Habilitar/Deshabilitar ramas inferiores
            allLowerCards.forEach(lowerCard => {
                if (lowerCard.dataset.parent === card.dataset.option) {
                    lowerCard.classList.remove('disabled');
                } else {
                    lowerCard.classList.add('disabled');
                }
            });

            // Navegación retardada para ver la animación
            // Aquí usamos href normal porque es navegación interna válida
            if (destination && destination !== '#' && !destination.endsWith('#')) {
                setTimeout(() => {
                    window.location.href = destination;
                }, 400);
            }
        });
    });

    // Lógica para las tarjetas inferiores
    allLowerCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (card.classList.contains('disabled')) {
                e.preventDefault(); // Bloquear click si está deshabilitada
                return;
            }
            
            // Si tiene un href real, dejamos que navegue normalmente.
            // Si es solo informativo (ej: Guía de Pesca), mostramos alerta.
            const href = card.getAttribute('href');
            if (!href || href === '#') {
                e.preventDefault();
                alert("Navegando a la sección: " + card.textContent.trim());
            }
        });
    });
});