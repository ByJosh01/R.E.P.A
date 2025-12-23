// public/dashboard.js
document.addEventListener('DOMContentLoaded', () => {

    // --- SEGURIDAD: Verificar sesión ---
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;

    try {
        currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    } catch (e) {
        console.error("Error al leer sesión:", e);
    }

    if (!authToken || !currentUser) {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        window.location.replace('/home.html');
        return; 
    }

    // --- UI: MODO OSCURO ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                if(themeIcon) { themeIcon.classList.remove('fa-moon'); themeIcon.classList.add('fa-sun'); }
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                if(themeIcon) { themeIcon.classList.remove('fa-sun'); themeIcon.classList.add('fa-moon'); }
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

    // --- ANIMACIÓN DE ENTRADA ---
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        setTimeout(() => mainContent.classList.add('visible'), 50);
    }

    // --- NUEVO: BOTÓN DE SALIR (LOGOUT) ---
    const logoutBtn = document.getElementById('btn-logout-dashboard');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // 1. Borrar credenciales
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            // 2. Redirección destructiva (borra historial)
            window.location.replace('/home.html');
        });
    }

    // --- LÓGICA DEL DIAGRAMA (FLOWCHART) ---
    const permisoCards = document.querySelectorAll('.flowchart-tier.tier-2 .option-card');
    const allLowerCards = document.querySelectorAll('.flowchart-tier.tier-3 .option-card, .flowchart-tier.tier-4 .option-card');

    allLowerCards.forEach(card => card.classList.add('disabled'));

    permisoCards.forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault(); 
            const destination = card.getAttribute('href'); 
            
            permisoCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');

            allLowerCards.forEach(lowerCard => {
                if (lowerCard.dataset.parent === card.dataset.option) {
                    lowerCard.classList.remove('disabled');
                } else {
                    lowerCard.classList.add('disabled');
                }
            });

            if (destination && destination !== '#' && !destination.endsWith('#')) {
                setTimeout(() => window.location.href = destination, 400);
            }
        });
    });

    allLowerCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (card.classList.contains('disabled')) {
                e.preventDefault(); return;
            }
            const href = card.getAttribute('href');
            if (!href || href === '#') {
                e.preventDefault();
                alert("Navegando a la sección: " + card.textContent.trim());
            }
        });
    });
});