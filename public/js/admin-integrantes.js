// public/js/admin-integrantes.js

function ajustarUIporRol() {
    const userSession = sessionStorage.getItem('currentUser');
    if (!userSession) return; // El auth-guard ya debería haberlo sacado

    try {
        const user = JSON.parse(userSession);
        const rol = user.rol;

        const navSolicitantes = document.getElementById('nav-solicitantes');
        const navCuentas = document.getElementById('nav-cuentas');
        
        // IDs de los CSS
        const adminTheme = document.getElementById('admin-theme-link');
        const panelAdminTheme = document.getElementById('panel-admin-theme-link');

        // Si es un ADMIN normal
        if (rol === 'admin') {
            // 1. Ocultamos la pestaña "Cuentas"
            if (navCuentas) navCuentas.style.display = 'none';

            // 2. Arreglamos el link de "Solicitantes"
            if (navSolicitantes) navSolicitantes.href = 'panel-admin.html';
            
            // 3. Cambiamos el CSS
            if (adminTheme) adminTheme.disabled = true;
            if (panelAdminTheme) panelAdminTheme.disabled = false;

        // Si es SUPERADMIN
        } else if (rol === 'superadmin') {
            // 1. Mostramos la pestaña "Cuentas"
            if (navCuentas) navCuentas.style.display = 'block'; // O 'inline-block'

            // 2. Arreglamos el link de "Solicitantes"
            if (navSolicitantes) navSolicitantes.href = 'admin.html';
            
            // 3. Cambiamos el CSS
            if (adminTheme) adminTheme.disabled = false;
            if (panelAdminTheme) panelAdminTheme.disabled = true;
        }
    } catch (e) {
        console.error("Error al ajustar UI por rol:", e);
    }
}

// 1. Ejecutar la lógica de UI en PAGESHOW (para el botón "atrás")
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        ajustarUIporRol();
    }
});



document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;
    let allIntegrantes = []; 

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

    // ==========================================================
    // ==== LÓGICA DE ESTILOS DINÁMICA (NUEVA) ====
    // ==========================================================
    const manageStylesByRole = (rol) => {
        // Usamos los IDs del HTML
        const adminLink = document.getElementById('admin-theme-link');
        const panelAdminLink = document.getElementById('panel-admin-theme-link');

        if (rol === 'superadmin') {
            // Activa admin.css (Tema Azul Pizarra)
            if (adminLink) adminLink.disabled = false;
            // Desactiva panel-admin.css
            if (panelAdminLink) panelAdminLink.disabled = true;
        } else if (rol === 'admin') {
            // Activa panel-admin.css (Tu tema secundario)
            if (adminLink) adminLink.disabled = true;
            // Desactiva admin.css
            if (panelAdminLink) panelAdminLink.disabled = false;
        }
        
        // El icono del header debe reflejar el rol
        const headerTitleElement = document.querySelector('.content-header div:first-child');
        if (headerTitleElement) {
            if (rol === 'superadmin') {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
            } else {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';
            }
        }
    };
    
    // Ejecutar gestión de estilos al inicio
    manageStylesByRole(currentUser.rol);
    // ==========================================================
    // ==== FIN LÓGICA DE ESTILOS DINÁMICA ====
    // ==========================================================


    // --- FUNCIÓN DE FEEDBACK (Recreada de utilidades) ---
    const showFeedback = (inputElement, message, isValid) => {
        let feedbackElement = inputElement.nextElementSibling;
        if (!feedbackElement || !feedbackElement.classList.contains('feedback-message')) {
            const parent = inputElement.closest('.anexo-field, .input-group');
            if (parent) feedbackElement = parent.querySelector('.feedback-message');
        }

        if (!feedbackElement) { 
             feedbackElement = document.createElement('div');
             feedbackElement.className = 'feedback-message';
             inputElement.closest('.anexo-field, .input-group')?.appendChild(feedbackElement);
        }

        inputElement.classList.remove('valid', 'invalid');
        feedbackElement.classList.remove('valid', 'invalid');
        
        if (message) {
            inputElement.classList.add(isValid ? 'valid' : 'invalid');
            feedbackElement.classList.add(isValid ? 'valid' : 'invalid');
            feedbackElement.textContent = message;
        } else {
            feedbackElement.textContent = '';
        }
    };
    
    // --- FUNCIONES DE VALIDACIÓN DE FORMATO (Recreadas de utilidades) ---
    const isValidRFC = (rfc) => /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/.test(rfc.toUpperCase()) && rfc.length >= 12;
    const isValidCURP = (curp) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp.toUpperCase());
    // ----------------------------------------------------------------------


    // --- LÓGICA DE NAVEGACIÓN ---
    const navSolicitantes = document.getElementById('nav-solicitantes');
    const navCuentas = document.getElementById('nav-cuentas');
    // Navegación se ajusta en base al rol
    if (navSolicitantes && navCuentas) {
        if (currentUser.rol === 'superadmin') {
            navSolicitantes.href = 'admin.html';
            navCuentas.style.display = 'inline-block';
        } else {
            navSolicitantes.href = 'panel-admin.html';
            navCuentas.style.display = 'none';
        }
    }

    // --- LÓGICA DE MODAL DE INFO ---
    const infoModal = document.getElementById('admin-info-modal');
    const infoModalTitle = document.getElementById('admin-info-title');
    const infoModalContent = document.getElementById('admin-info-content');
    const infoModalIcon = document.getElementById('admin-info-icon');
    const closeInfoModalBtn = document.getElementById('close-admin-info-btn');

    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        if (!infoModal || !infoModalTitle || !infoModalContent || !infoModalIcon || !closeInfoModalBtn) {
            console.error("Elementos del modal de información no encontrados.");
            alert(`${title}: ${content}`);
            return;
        }
        infoModalTitle.textContent = title;
        infoModalContent.innerHTML = content.startsWith('<div') ? content : `<p style="text-align: center;">${content}</p>`;
        infoModalIcon.className = 'modal-icon fas';
        infoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        infoModal.classList.add('visible');
        const confirmHandler = () => {
            infoModal.classList.remove('visible');
            if (onConfirm) onConfirm();
            closeInfoModalBtn.removeEventListener('click', confirmHandler);
        };
        closeInfoModalBtn.addEventListener('click', confirmHandler, { once: true });
    };

    // --- LÓGICA DE TABLA Y BÚSQUEDA ---
    const tableBody = document.getElementById('integrantes-table-body');
    const searchInput = document.getElementById('search-input');
    
    const renderTabla = (integrantes) => { 
        tableBody.innerHTML = '';
        if (integrantes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron integrantes.</td></tr>';
            return;
        }
        integrantes.forEach(integrante => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${integrante.nombre_completo || 'N/A'}</td>
                <td>${integrante.rfc || 'N/A'}</td>
                <td>${integrante.curp || 'N/A'}</td>
                <td>${integrante.telefono || 'N/A'}</td>
                <td>${integrante.municipio || 'N/A'}</td>
                <td>${integrante.actividad_desempeña || 'N/A'}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" data-id="${integrante.id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i> 
                    </button>
                </td>
            `;
        });
    };

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredIntegrantes = allIntegrantes.filter(integrante => {
            const nombre = (integrante.nombre_completo || '').toLowerCase();
            const rfc = (integrante.rfc || '').toLowerCase();
            const curp = (integrante.curp || '').toLowerCase();
            return nombre.includes(searchTerm) || rfc.includes(searchTerm) || curp.includes(searchTerm);
        });
        renderTabla(filteredIntegrantes);
    });

    const cargarDatosIniciales = async () => {
        try {
            const response = await fetch('/api/admin/integrantes', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('Failed to load data.');
            allIntegrantes = await response.json();
            renderTabla(allIntegrantes);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };
    cargarDatosIniciales();
    // --- FIN LÓGICA DE TABLA Y BÚSQUEDA ---

    // --- LÓGICA DE VALIDACIÓN DEL MODAL ---
    const editModal = document.getElementById('edit-integrante-modal');
    const editForm = document.getElementById('edit-integrante-form');

    const setupFormValidation = (form) => {
        const fieldRules = {
            'edit-nombre_completo': { type: 'text', maxLength: 100, required: true },
            'edit-rfc': { type: 'rfc', maxLength: 13, required: false },
            'edit-curp': { type: 'curp', maxLength: 18, required: false },
            'edit-telefono': { type: 'telefono', maxLength: 10, required: false },
            'edit-municipio': { type: 'text', maxLength: 50, required: false },
            'edit-actividad_desempena': { type: 'text', maxLength: 50, required: false }
        };

        for (const fieldId in fieldRules) {
            const input = document.getElementById(fieldId);
            if (!input) continue;
            
            const rule = fieldRules[fieldId];
            input.setAttribute('maxlength', rule.maxLength);
            if(rule.required) input.setAttribute('required', 'required');

            input.addEventListener('input', () => {
                switch (rule.type) {
                    case 'text':
                        input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                        break;
                    case 'telefono':
                        input.value = input.value.replace(/[^0-9]/g, '');
                        break;
                    case 'rfc':
                    case 'curp':
                        input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        break;
                }

                let isValid = true;
                let message = 'Correcto.';

                if (rule.required && !input.value.trim()) {
                    isValid = false;
                    message = 'Este campo es obligatorio.';
                } else if (rule.type === 'rfc' && input.value.length > 0 && !isValidRFC(input.value)) {
                    isValid = false;
                    message = 'Formato de RFC incorrecto.';
                } else if (rule.type === 'curp' && input.value.length > 0 && !isValidCURP(input.value)) {
                    isValid = false;
                    message = 'Formato de CURP incorrecto.';
                } else if (rule.type === 'telefono' && input.value.length > 0 && input.value.length < 10) {
                    isValid = false;
                    message = 'Debe tener 10 dígitos.';
                }
                
                if (input.value.length > 0 || rule.required) {
                    showFeedback(input, message, isValid);
                } else {
                    showFeedback(input, '', true);
                }
            });
        }
    };
    setupFormValidation(editForm);

    // --- LÓGICA DE EDICIÓN Y ENVÍO ---
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const editErrorMsg = document.getElementById('edit-error-msg');
    const editIdField = document.getElementById('edit-integrante-id');
    const fields = [
        'nombre_completo', 'rfc', 'curp', 'telefono', 'municipio', 'actividad_desempena'
    ];
    const editFormFields = {};
    fields.forEach(f => editFormFields[f] = document.getElementById(`edit-${f}`));

    const openEditModal = async (id) => {
        editErrorMsg.style.display = 'none';
        editForm.reset(); 
        editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
        editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');

        try {
            const res = await fetch(`/api/integrantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!res.ok) throw new Error('No se pudo cargar la info.');
            const integrante = await res.json();
            editIdField.value = integrante.id;
            
            fields.forEach(f => {
                const element = editFormFields[f];
                if(element) {
                    element.value = integrante[f] || integrante[f.replace('_desempena', '_desempeña')] || '';
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });
            editModal.classList.add('visible');
        } catch (error) { alert(error.message); }
    };

    tableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.btn-edit');
        if (editButton) openEditModal(editButton.dataset.id);
    });

    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('visible'));
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.remove('visible'); });

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Disparar validación final
            editForm.querySelectorAll('input').forEach(input => input.dispatchEvent(new Event('input', { bubbles: true })));
            
            const firstInvalidElement = editForm.querySelector('.invalid');
            if (firstInvalidElement) {
                showInfoModal('Formulario Incompleto', 'Por favor, revisa y corrige los campos marcados en rojo.', false);
                firstInvalidElement.focus();
                return;
            }

            const id = editIdField.value;
            const submitButton = editModal.querySelector('button[type="submit"]');

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Guardando...';
            }
            editErrorMsg.style.display = 'none';
            const data = {};
            fields.forEach(f => data[f] = editFormFields[f].value);

            try {
                const res = await fetch(`/api/integrantes/${id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(data)
                });
                const resData = await res.json();
                if (!res.ok) throw new Error(resData.message || 'Error al guardar los cambios.');
                
                const index = allIntegrantes.findIndex(i => i.id == id);
                if (index !== -1) {
                    allIntegrantes[index] = { ...allIntegrantes[index], ...data };
                    allIntegrantes[index].actividad_desempeña = data.actividad_desempena;
                }
                searchInput.dispatchEvent(new Event('input'));

                editModal.classList.remove('visible');
                showInfoModal('Éxito', resData.message, true); 

            } catch (error) {
                editErrorMsg.textContent = error.message;
                editErrorMsg.style.display = 'block';
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Guardar Cambios';
                }
            }
        });
    }

    // --- LÓGICA DEL MENÚ DE USUARIO (Omitida por brevedad) ---
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');

    if (adminEmailPlaceholder) adminEmailPlaceholder.textContent = currentUser.email;
    if (userMenuTrigger) userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown?.classList.toggle('active'); });
    window.addEventListener('click', () => { if (userDropdown?.classList.contains('active')) userDropdown.classList.remove('active'); });

    if (viewAdminInfoBtn && infoModal && infoModalContent) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                const infoHtml = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre || 'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc || 'N/A'}</span></div><div class="info-row"><label>Email:</label><span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio || 'N/A'}</span></div>`;
                const title = currentUser.rol === 'superadmin' ? 'Info Superadmin' : 'Info Admin';
                showInfoModal(title, infoHtml, true);
            } catch (err) {
                showInfoModal('Error', 'Error al obtener información del perfil.', false);
            }
        });
        infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('visible'); });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'home.html';
        });
    }

    const adminGotoDashboardBtn = document.getElementById('admin-goto-dashboard-btn');
    if (adminGotoDashboardBtn) {
        adminGotoDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }
});