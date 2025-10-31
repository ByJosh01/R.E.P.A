// public/js/detalle-solicitante.js

/**
 * ▼▼▼ FUNCIÓN 1: GESTIONAR ESTILOS (A TU MANERA) ▼▼▼
 * Habilita/deshabilita los CSS según el rol.
 */
function manageStylesByRole(currentUser) {
    const adminLink = document.querySelector('link[href="css/admin.css"]');
    const panelAdminLink = document.querySelector('link[href="css/panel-admin.css"]');

    if (!adminLink || !panelAdminLink) {
        console.warn("No se encontraron los archivos CSS 'admin.css' o 'panel-admin.css' en el <head>.");
        return;
    }

    if (currentUser && currentUser.rol === 'superadmin') {
        // SUPERADMIN: Usa admin.css (el principal) y style.css
        // Deshabilitamos el 'rojizo'
        adminLink.disabled = false;
        panelAdminLink.disabled = true;
        console.log("Estilo Superadmin aplicado (admin.css).");

    } else if (currentUser && currentUser.rol === 'admin') {
        // ADMIN: Usa panel-admin.css (el 'rojizo')
        // Deshabilitamos el 'principal' de superadmin
        adminLink.disabled = true;
        panelAdminLink.disabled = false;
        console.log("Estilo Admin aplicado (panel-admin.css).");
        
    } else {
        // Si hay un error o no se reconoce el rol, dejamos el de superadmin por defecto
        adminLink.disabled = false;
        panelAdminLink.disabled = true;
    }
}

/**
 * ▼▼▼ FUNCIÓN 2: VERIFICAR ROL Y TOKEN (Igual que antes) ▼▼▼
 */
function checkRoleAndToken(authToken, currentUser) {
    if (!authToken || !currentUser) {
        window.location.replace('home.html');
        return false;
    }
    if (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin') {
        console.warn(`Acceso denegado: Rol '${currentUser.rol}' no autorizado.`);
        if (currentUser.rol === 'solicitante') {
            window.location.replace('/dashboard.html');
        } else {
            window.location.replace('/home.html');
        }
        return false;
    }
    return true;
}

/**
 * ▼▼▼ FUNCIÓN 3: CONFIGURAR MENÚ DE USUARIO (Igual que antes) ▼▼▼
 */
function setupUserMenu(currentUser) {
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');

    if (adminEmailPlaceholder) {
        adminEmailPlaceholder.textContent = currentUser.email;
    }
    if (userMenuTrigger && userDropdown) {
        userMenuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
    }
    window.addEventListener('click', () => {
        if (userDropdown && userDropdown.classList.contains('active')) {
            userDropdown.classList.remove('active');
        }
    });
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'home.html';
        });
    }
}


// ============ INICIO DE EJECUCIÓN ============
document.addEventListener('DOMContentLoaded', async () => {
    
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // --- 1. Ejecutamos las funciones de gestión ---
    
    // ►►► CAMBIO: Se llama a tu función de estilos PRIMERO
    manageStylesByRole(currentUser); 
    
    if (!checkRoleAndToken(authToken, currentUser)) {
        return; // Detenemos la ejecución si el rol o token no son válidos
    }

    setupUserMenu(currentUser);
    // --- Fin de las funciones de gestión ---


    // ▼▼▼ TU CÓDIGO (Botón volver, carga de datos, etc.) ▼▼▼
    // (Esto se mantiene exactamente igual que como lo tenías)

    const btnVolver = document.getElementById('btn-volver-admin');
    if (btnVolver) {
        if (currentUser.rol === 'superadmin') {
            btnVolver.href = 'admin.html';
        } else {
            btnVolver.href = 'panel-admin.html';
        }
    }

    const params = new URLSearchParams(window.location.search);
    const solicitanteId = params.get('id');

    if (!solicitanteId) {
        document.body.innerHTML = '<h1>Error: No se especificó un ID de solicitante.</h1>';
        return;
    }

    const perfilContainer = document.getElementById('perfil-details');
    const integrantesTableBody = document.getElementById('integrantes-details-body');
    const embarcacionesTableBody = document.getElementById('embarcaciones-details-body');
    const anexo3Card = document.getElementById('anexo3-card-details');
    const anexo3Container = document.getElementById('anexo3-details');
    const anexo4Card = document.getElementById('anexo4-card-details');
    const anexo4Container = document.getElementById('anexo4-details');

    try {
        const response = await fetch(`/api/admin/solicitante-detalles/${solicitanteId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar los detalles del solicitante.');
        }

        const data = await response.json();
        
        const perfil = data.perfil;
        if (perfil) {
            perfilContainer.innerHTML = `
                <div class="info-row"><label>Nombre Completo:</label> <span>${perfil.nombre || ''} ${perfil.apellido_paterno || ''} ${perfil.apellido_materno || ''}</span></div>
                <div class="info-row"><label>RFC:</label> <span>${perfil.rfc || 'N/A'}</span></div>
                <div class="info-row"><label>CURP:</label> <span>${perfil.curp || 'N/A'}</span></div>
                <div class="info-row"><label>Teléfono:</label> <span>${perfil.telefono || 'N/A'}</span></div>
                <div class="info-row"><label>Email:</label> <span>${perfil.correo_electronico || 'N/A'}</span></div>
                <div class="info-row"><label>Actividad:</label> <span>${perfil.actividad || 'N/A'}</span></div>
                <div class="info-row"><label>Municipio:</label> <span>${perfil.municipio || 'N/A'}</span></div>
            `;
        } else {
             perfilContainer.innerHTML = '<p>No hay datos de perfil para mostrar.</p>';
        }

        integrantesTableBody.innerHTML = '';
        if (data.integrantes && data.integrantes.length > 0) {
            data.integrantes.forEach(i => {
                const row = integrantesTableBody.insertRow();
                row.innerHTML = `
                    <td>${i.nombre_completo || 'N/A'}</td>
                    <td>${i.rfc || 'N/A'}</td>
                    <td>${i.curp || 'N/A'}</td>
                    <td>${i.telefono || 'N/A'}</td>
                    <td>${i.actividad_desempeña || 'N/A'}</td>
                `;
            });
        } else {
            integrantesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Este solicitante no tiene integrantes registrados.</td></tr>';
        }

        embarcacionesTableBody.innerHTML = '';
        if (data.embarcaciones && data.embarcaciones.length > 0) {
            data.embarcaciones.forEach(e => {
                const row = embarcacionesTableBody.insertRow();
                row.innerHTML = `
                    <td>${e.nombre_embarcacion || 'N/A'}</td>
                    <td>${e.matricula || 'N/A'}</td>
                    <td>${e.tonelaje_neto || 'N/A'}</td>
                    <td>${e.marca || 'N/A'}</td>
                    <td>${e.puerto_base || 'N/A'}</td>
                `;
            });
        } else {
            embarcacionesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Este solicitante no tiene embarcaciones registradas.</td></tr>';
        }

        if (perfil && (perfil.actividad === 'pesca' || perfil.actividad === 'ambas')) {
            anexo3Card.style.display = 'block';
        }
        if (perfil && (perfil.actividad === 'acuacultura' || perfil.actividad === 'ambas')) {
            anexo4Card.style.display = 'block';
        }

        if (data.anexo3) {
            const a3 = data.anexo3;
            anexo3Container.innerHTML = `
                <div class="info-row"><label>Lugar de Captura:</label> <span>${a3.lugar || 'N/A'}</span></div>
                <div class="info-row"><label>Sitio de Desembarque:</label> <span>${a3.sitio_desembarque || 'N/A'}</span></div>
                <div class="info-row"><label>Tipo de Pesquería:</label> <span>${a3.tipo_pesqueria || 'N/A'}</span></div>
                <div class="info-row"><label>Especies Objetivo:</label> <span>${a3.especies_objetivo || 'N/A'}</span></div>
                <div class="info-row"><label>Nivel Producción Anual:</label> <span>${a3.nivel_produccion_anual || 'N/A'}</span></div>
            `;
        } else {
            anexo3Container.innerHTML = '<p>Este solicitante no tiene datos registrados para el Anexo 3.</p>';
        }

        if (data.anexo4) {
            const a4 = data.anexo4;
            let especiesTexto = 'N/A';
            if (a4.especies) {
                try {
                    const especiesObj = JSON.parse(a4.especies);
                    if (especiesObj.seleccionadas && especiesObj.seleccionadas.length > 0) {
                        especiesTexto = especiesObj.seleccionadas.join(', ');
                    }
                } catch(e) { console.error("Error al procesar JSON de especies:", e); }
            }

            anexo4Container.innerHTML = `
                <div class="info-row"><label>Tipo de Instalación:</label> <span>${a4.tipo_instalacion || 'N/A'}</span></div>
                <div class="info-row"><label>Sistema de Producción:</label> <span>${a4.sistema_produccion || 'N/A'}</span></div>
                <div class="info-row"><label>Especies:</label> <span>${especiesTexto}</span></div>
                <div class="info-row"><label>Producción Anual:</label> <span>${a4.produccion_anual_valor || ''} ${a4.produccion_anual_unidad || ''}</span></div>
            `;
        } else {
            anexo4Container.innerHTML = '<p>Este solicitante no tiene datos registrados para el Anexo 4.</p>';
        }

    } catch (error) {
        console.error("Error al cargar detalles:", error);
        document.body.innerHTML = `<h1>Error: ${error.message}</h1><a href="admin.html">Volver a la lista</a>`;
    }
});