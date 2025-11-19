// public/js/auth-guard.js
(function() {

    /**
     * Esta función revisa la autenticación (si está logueado)
     * Y la autorización (si tiene el rol correcto).
     */
    function checkAuthAndRole() {
        const token = localStorage.getItem('authToken');
        const userSession = sessionStorage.getItem('currentUser');
        const currentPage = window.location.pathname; // Ej: "/admin.html"

        // ---
        // PARTE 1: EL GUARDIA DE LOGOUT
        // ---
        if (!token || !userSession) {
            // Limpieza redundante por seguridad
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            
            // Si NO estamos ya en el home, nos vamos.
            if (currentPage !== '/home.html' && currentPage !== '/') {
                window.location.replace('/home.html');
            }
            return; 
        }

        // ---
        // PARTE 2: EL GUARDIA DE ROL
        // ---
        try {
            const user = JSON.parse(userSession);
            const rol = user.rol;

            // A. Páginas de SUPERADMIN
            const superAdminPages = ['/admin.html', '/admin-usuarios.html'];
            if (superAdminPages.includes(currentPage) && rol !== 'superadmin') {
                alert('Acceso no autorizado para tu rol.');
                if (rol === 'admin') {
                    window.location.replace('/panel-admin.html');
                } else {
                    window.location.replace('/dashboard.html');
                }
                return;
            }

            // B. Página de ADMIN
            if (currentPage.includes('/panel-admin.html') && (rol !== 'admin' && rol !== 'superadmin')) {
                alert('Acceso no autorizado.');
                window.location.replace('/dashboard.html');
                return;
            }

            // C. Páginas COMPARTIDAS
            const sharedPages = ['/admin-integrantes.html', '/admin-embarcaciones.html'];
            if (sharedPages.includes(currentPage) && (rol !== 'admin' && rol !== 'superadmin')) {
                alert('Acceso no autorizado.');
                window.location.replace('/dashboard.html');
                return;
            }
            
            // Si llega aquí, todo está bien.

        } catch (e) {
            console.error("Error en sesión:", e);
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.replace('/home.html');
        }
    } 

    // 1. Ejecución Inmediata (Carga normal)
    checkAuthAndRole();

    // 2. Ejecución en Navegación (Botones Atrás/Adelante)
    // QUITAMOS el "if (event.persisted)" para que revise SIEMPRE.
    window.addEventListener('pageshow', (event) => {
        checkAuthAndRole();
    });

})();