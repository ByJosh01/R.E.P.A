// public/js/admin-integrantes.js
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;

    try {
        const currentUserJSON = sessionStorage.getItem('currentUser');
        if (currentUserJSON) {
            currentUser = JSON.parse(currentUserJSON);
        }
    } catch (error) {
        console.error("Error parsing currentUser:", error);
    }

    if (!authToken || !currentUser) {
        console.error("Auth token or user info missing.");
        window.location.href = 'home.html';
        return;
    }

    // --- LÓGICA PARA AJUSTAR NAVEGACIÓN ---
    const navSolicitantes = document.getElementById('nav-solicitantes');
    const navCuentas = document.getElementById('nav-cuentas');
    const headerTitleElement = document.querySelector('.content-header div:first-child'); // Target first div specifically

    if (navSolicitantes && navCuentas) {
        if (currentUser.rol === 'superadmin') {
            navSolicitantes.href = 'admin.html';
            navCuentas.style.display = 'inline-block'; // Or 'block'
            if (headerTitleElement) {
                headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
            }
        } else {
            navSolicitantes.href = 'panel-admin.html';
            navCuentas.style.display = 'none';
            if (headerTitleElement) {
                headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';
            }
        }
    } else {
        console.warn("Navigation elements not found.");
    }
    // --- FIN LÓGICA NAVEGACIÓN ---

    const tableBody = document.getElementById('integrantes-table-body');
    if (!tableBody) {
        console.error("Table body 'integrantes-table-body' not found.");
        return;
    }

    try {
        const response = await fetch('/api/admin/integrantes', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.status === 403) {
             tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: orange;">Acceso denegado.</td></tr>`;
             return;
        }
        if (!response.ok) {
             let errorMsg = `Error del servidor (${response.status})`;
             try { const errData = await response.json(); errorMsg = errData.message || errorMsg; } catch (e) {}
            throw new Error(`Failed to load data: ${errorMsg}`);
        }

        const integrantes = await response.json();
        tableBody.innerHTML = '';

        if (integrantes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay integrantes registrados en el sistema.</td></tr>';
        } else {
            integrantes.forEach(integrante => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${integrante.nombre_completo || 'N/A'}</td>
                    <td>${integrante.rfc || 'N/A'}</td>
                    <td>${integrante.curp || 'N/A'}</td>
                    <td>${integrante.telefono || 'N/A'}</td>
                    <td>${integrante.municipio || 'N/A'}</td>
                    <td>${integrante.actividad_desempeña || 'N/A'}</td>
                `;
            });
        }
    } catch (error) {
        console.error("Error loading integrantes:", error);
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