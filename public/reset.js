// public/reset.js
document.addEventListener('DOMContentLoaded', () => {
    
    // Lógica de UI (sin cambios)
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('visible');
    }
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

    // Lógica del Formulario de Reseteo (ACTUALIZADA)
    const resetForm = document.getElementById('reset-form');
    if (!resetForm) return;

    // Obtenemos el token directamente de la URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        alert('Enlace de recuperación inválido. No se encontró el token.');
        window.location.href = 'home.html';
        return;
    }

    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!newPassword) {
            return alert('La contraseña no puede estar vacía.');
        }
        if (newPassword !== confirmPassword) {
            return alert('Las contraseñas no coinciden.');
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token, newPassword }), // Enviamos el token de la URL
            });
            const result = await response.json();
            
            alert(result.message); // Muestra el mensaje del servidor

            if (response.ok) {
                window.location.href = 'home.html';
            }
        } catch (error) {
            alert('Error al conectar con el servidor.');
        }
    });
});