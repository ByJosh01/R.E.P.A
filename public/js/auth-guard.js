// public/js/auth-guard.js
// (VERSIÓN CORREGIDA)

// Este script se ejecuta síncronamente en el <head>
// y AHORA REVISA AMBAS CONDICIONES (token y sesión).
// Esta es la única fuente de verdad para la autenticación.

(function() {
    const token = localStorage.getItem('authToken');
    const userSession = sessionStorage.getItem('currentUser');

    // Si FALTA CUALQUIERA de los dos, la sesión es inválida.
    if (!token || !userSession) {
        
        // Limpiamos todo por si acaso (estado inconsistente)
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        
        // Redirigimos a home.html usando replace()
        // para que esta página (dashboard) no quede en el historial.
        window.location.replace('/home.html');
    }

    // Si AMBOS existen, el script termina y permite
    // que la página protegida (dashboard.js, admin.js, etc.) se cargue.
})();