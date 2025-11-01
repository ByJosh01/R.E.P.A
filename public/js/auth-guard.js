// public/js/auth-guard.js
(function() {

    /**
     * Esta función revisa la autenticación (si está logueado)
     * Y la autorización (si tiene el rol correcto).
     * Se ejecuta en la carga inicial Y al usar el botón "atrás" (pageshow).
     */
    function checkAuthAndRole() {
        const token = localStorage.getItem('authToken');
        const userSession = sessionStorage.getItem('currentUser');
        const currentPage = window.location.pathname; // Ej: "/admin.html"

        // ---
        // PARTE 1: (LO QUE PEDISTE) EL GUARDIA DE LOGOUT
        // ---
        // Si falta el token O la sesión, es un usuario NO logueado.
        // Esto captura el "botón atrás" después de cerrar sesión.
        if (!token || !userSession) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            
            // ¡ADIÓS! Lo mandamos al home.
            // Usamos replace() para que esta página (ej. /admin.html)
            // no se quede en el historial del navegador.
            window.location.replace('/home.html');
            return; // Detiene la ejecución del script
        }

        // ---
        // PARTE 2: (SEGURIDAD EXTRA) EL GUARDIA DE ROL
        // ---
        // Si llegamos aquí, el usuario SÍ está logueado.
        // Ahora verificamos si tiene el ROL correcto para la página actual.
        try {
            const user = JSON.parse(userSession);
            const rol = user.rol;

            // --- REGLAS DE ACCESO ---

            // A. Páginas de SUPERADMIN (admin.html, admin-usuarios.html)
            const superAdminPages = ['/admin.html', '/admin-usuarios.html'];
            if (superAdminPages.includes(currentPage) && rol !== 'superadmin') {
                // Es un 'admin' o 'solicitante' intentando ver una pág. de Superadmin
                alert('Acceso no autorizado para tu rol. Redirigiendo...');
                if (rol === 'admin') {
                    window.location.replace('/panel-admin.html');
                } else {
                    window.location.replace('/dashboard.html');
                }
                return;
            }

            // B. Página de ADMIN (panel-admin.html)
            if (currentPage.includes('/panel-admin.html') && (rol !== 'admin' && rol !== 'superadmin')) {
                // Es un 'solicitante' intentando ver la pág. de Admin
                alert('Acceso no autorizado.');
                window.location.replace('/dashboard.html');
                return;
            }

            // C. Páginas COMPARTIDAS (integrantes, embarcaciones)
            const sharedPages = ['/admin-integrantes.html', '/admin-embarcaciones.html'];
            if (sharedPages.includes(currentPage) && (rol !== 'admin' && rol !== 'superadmin')) {
                // Es un 'solicitante' intentando ver una pág. compartida
                alert('Acceso no autorizado.');
                window.location.replace('/dashboard.html');
                return;
            }
            
            // Si no falló ninguna regla, el usuario es válido para esta página.
            // El script termina y permite que la página se cargue.

        } catch (e) {
            // Si la sesión está corrupta, lo tratamos como no logueado
            console.error("Error al leer la sesión, limpiando...", e);
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.replace('/home.html');
        }
    } // --- Fin de la función checkAuthAndRole ---


    // 1. Ejecutamos la validación en la CARGA INICIAL de la página
    checkAuthAndRole();

    // 2. ¡LA CLAVE! Ejecutamos la validación CADA VEZ que la página se muestra
    //    (especialmente al usar el botón "atrás" - bfcache).
    window.addEventListener('pageshow', (event) => {
        // event.persisted es 'true' si la página se cargó desde la caché
        if (event.persisted) {
            checkAuthAndRole();
        }
    });

})();