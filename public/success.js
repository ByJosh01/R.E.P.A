// public/success.js
document.addEventListener('DOMContentLoaded', () => {

    // Lógica de Modo Oscuro (sin cambios)
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    if(themeToggle) {
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

    // Lógica para mostrar correo (ACTUALIZADA)
    const registrationEmail = sessionStorage.getItem('registrationEmail');
    const userIdentifier = document.getElementById('user-identifier');
    const emailPlaceholder = document.getElementById('user-email-placeholder');

    if (registrationEmail && userIdentifier && emailPlaceholder) {
        userIdentifier.textContent = registrationEmail;
        emailPlaceholder.textContent = registrationEmail;
        // Es importante borrarlo para que no se pueda volver a esta página
        sessionStorage.removeItem('registrationEmail');
    } else {
        // Si alguien llega aquí sin un correo, lo redirigimos
        console.warn("No se encontró email de registro, redirigiendo a home.");
        window.location.href = "home.html";
    }
});