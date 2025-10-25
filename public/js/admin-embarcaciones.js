// public/js/admin-embarcaciones.js (Versión Robusta)
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    let currentUser = null; // Inicializar como null

    try {
        const currentUserJSON = sessionStorage.getItem('currentUser');
        if (currentUserJSON) {
            currentUser = JSON.parse(currentUserJSON);
        }
    } catch (error) {
        console.error("Error al parsear currentUser desde sessionStorage:", error);
    }

    if (!authToken || !currentUser) {
        console.error("Falta authToken o currentUser, redirigiendo a home.");
        window.location.href = 'home.html';
        return;
    }

    // --- INICIO: LÓGICA PARA AJUSTAR NAVEGACIÓN (con verificaciones) ---
    const navSolicitantes = document.getElementById('nav-solicitantes');
    const navCuentas = document.getElementById('nav-cuentas');
    const headerTitleElement = document.querySelector('.content-header div:first-child'); // Target first div

    if (navSolicitantes && navCuentas) {
        if (currentUser.rol === 'superadmin') {
            navSolicitantes.href = 'admin.html';
            navCuentas.style.display = 'inline-block'; // O 'block'
            if(headerTitleElement) {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
            }
        } else {
            navSolicitantes.href = 'panel-admin.html';
            navCuentas.style.display = 'none';
            if(headerTitleElement) {
                headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';
            }
        }
    } else {
        console.warn("No se encontraron los elementos de navegación 'nav-solicitantes' o 'nav-cuentas'.");
    }
    // --- FIN: LÓGICA PARA AJUSTAR NAVEGACIÓN ---


    const tableBody = document.getElementById('embarcaciones-table-body');
    if (!tableBody) {
        console.error("Elemento 'embarcaciones-table-body' no encontrado en el DOM.");
        return;
    }

    try {
        const response = await fetch('/api/admin/embarcaciones', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.status === 403) {
             tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: orange;">Acceso denegado.</td></tr>`;
             return;
        }
        if (!response.ok) {
             let errorMsg = `Error del servidor (${response.status})`;
             try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch (e) {}
            throw new Error(`No se pudieron cargar los datos: ${errorMsg}`);
        }

        const embarcaciones = await response.json();
        tableBody.innerHTML = '';

        if (embarcaciones.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay embarcaciones registradas en el sistema.</td></tr>';
        } else {
            embarcaciones.forEach(e => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${e.nombre_embarcacion || 'N/A'}</td>
                    <td>${e.matricula || 'N/A'}</td>
                    <td>${e.tonelaje_neto || 'N/A'}</td>
                    <td>${e.marca || 'N/A'}</td>
                    <td>${e.potencia_hp || 'N/A'}</td>
                    <td>${e.puerto_base || 'N/A'}</td>
                `;
            });
        }
    } catch (error) {
         console.error("Error al cargar embarcaciones:", error);
         tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">${error.message}</td></tr>`;
    }

    // --- LÓGICA DEL MENÚ DE USUARIO ---
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const adminInfoModal = document.getElementById('admin-info-modal');
    const adminInfoContent = document.getElementById('admin-info-content');
    const adminInfoModalTitle = adminInfoModal ? adminInfoModal.querySelector('h2') : null;
    const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');

     if (adminEmailPlaceholder) {
        adminEmailPlaceholder.textContent = currentUser.email;
    }

    if (userMenuTrigger) {
        userMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown?.classList.toggle('active');
        });
    }
    window.addEventListener('click', () => {
        if (userDropdown?.classList.contains('active')) {
            userDropdown.classList.remove('active');
        }
    });

     if (viewAdminInfoBtn && adminInfoModal && adminInfoContent && adminInfoModalTitle) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                adminInfoModalTitle.textContent = currentUser.rol === 'superadmin' ? 'Info Superadmin' : 'Info Admin';
                adminInfoContent.innerHTML = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre || 'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc || 'N/A'}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio || 'N/A'}</span></div>`;
                adminInfoModal.classList.add('visible');
            } catch (err) {
                 console.error("Error getting profile info:", err);
                 alert('Error al obtener información del perfil.');
            }
        });
        adminInfoModal.addEventListener('click', (e) => {
             if (e.target === adminInfoModal) adminInfoModal.classList.remove('visible');
        });
        if (closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', () => adminInfoModal.classList.remove('visible'));
    }


    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'home.html';
        });
    }
    // --- FIN LÓGICA MENÚ USUARIO ---
});