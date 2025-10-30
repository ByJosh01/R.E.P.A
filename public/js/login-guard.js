// public/js/login-guard.js
// (VERSIÓN CORREGIDA CON 'pageshow' PARA EL BOTÓN "ATRÁS")

/**
 * Esta función revisa si el usuario ya está logueado
 * y lo patea a su panel correspondiente.
 */
function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    const userSession = sessionStorage.getItem('currentUser');

    // Solo continuamos si AMBOS existen
    if (token && userSession) {
        
        try {
            const rol = JSON.parse(userSession).rol;
            
            // Redirigimos a la página correcta USANDO replace()
            // para que esta redirección no quede en el historial.
            if (rol === 'superadmin') {
                window.location.replace('/admin.html');
            } else if (rol === 'admin') {
                window.location.replace('/panel-admin.html');
            } else {
                // Todos los demás (ej. 'solicitante') van al dashboard
                window.location.replace('/dashboard.html');
            }

        } catch (e) {
            // Si hay un error, es más seguro no hacer nada
            console.error("Error al parsear sesión en login-guard:", e);
        }
    }
    // Si NO hay token o sesión, el script no hace nada
    // y permite que se muestre home.html (la página de login).
}

// 1. Ejecutamos el chequeo DE INMEDIATO en la carga inicial de la página.
checkLoginStatus();

// 2. ¡LA SOLUCIÓN! Añadimos un listener para el evento 'pageshow'.
// Esto se dispara CADA VEZ que la página se vuelve visible,
// especialmente cuando usas el botón "Atrás".
window.addEventListener('pageshow', (event) => {
    // 'event.persisted' es 'true' si la página se cargó desde la
    // caché de retroceso (bfcache), que es lo que queremos detectar.
    if (event.persisted) {
        checkLoginStatus();
    }
});