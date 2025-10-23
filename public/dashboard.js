// public/dashboard.js
document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA DE AUTENTICACIÓN (ACTUALIZADA) ---
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // Si falta el token o los datos del usuario, la sesión no es válida.
    if (!authToken || !currentUser) {
        localStorage.removeItem('authToken'); // Limpiamos por si acaso
        sessionStorage.removeItem('currentUser');
        alert('Acceso denegado. Por favor, inicie sesión.');
        window.location.href = 'home.html';
        return; // Detenemos la ejecución del resto del script
    }
    // --- FIN DE LA ACTUALIZACIÓN ---

    // Lógica para Modo Oscuro (sin cambios)
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
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

    // Animación de Página (sin cambios)
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('visible');
    }

    // LÓGICA DEL DASHBOARD INTERACTIVO (sin cambios)
    const permisoCards = document.querySelectorAll('.flowchart-tier.tier-2 .option-card');
    const allLowerCards = document.querySelectorAll('.flowchart-tier.tier-3 .option-card, .flowchart-tier.tier-4 .option-card');

    allLowerCards.forEach(card => card.classList.add('disabled'));

    permisoCards.forEach(card => {
        card.addEventListener('click', (event) => {
            event.preventDefault();
            const destination = card.href;
            permisoCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            allLowerCards.forEach(lowerCard => {
                if (lowerCard.dataset.parent === card.dataset.option) {
                    lowerCard.classList.remove('disabled');
                } else {
                    lowerCard.classList.add('disabled');
                }
            });
            if (destination && !destination.endsWith('#')) {
                setTimeout(() => {
                    window.location.href = destination;
                }, 400);
            }
        });
    });

    const guiaPescaCard = document.querySelector('[data-option="guia-pesca"]');
    allLowerCards.forEach(card => {
        card.addEventListener('click', (e) => {
            if (!card.classList.contains('disabled')) {
                e.preventDefault();
                alert("Navegando a la sección: " + card.textContent.trim());
            }
        });
    });
});