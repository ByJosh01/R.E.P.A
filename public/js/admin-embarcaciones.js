// public/js/admin-embarcaciones.js (Versión con Edición y Filtro)
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;
    let allEmbarcaciones = []; 

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

    // --- FUNCIÓN DE FEEDBACK (Recreada de utilidades) ---
    const showFeedback = (inputElement, message, isValid) => {
        let feedbackElement = inputElement.nextElementSibling;
        if (!feedbackElement || !feedbackElement.classList.contains('feedback-message')) {
            const parent = inputElement.closest('.anexo-field, .input-group');
            if (parent) feedbackElement = parent.querySelector('.feedback-message');
        }

        if (!feedbackElement) { // Si no lo encuentra, lo creamos para el modal de edición
             feedbackElement = document.createElement('div');
             feedbackElement.className = 'feedback-message';
             inputElement.closest('.anexo-field, .input-group').appendChild(feedbackElement);
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
    
    // --- LÓGICA DE VALIDACIÓN DE FORMATO ESPECÍFICO (Recreada de anexo5.js) ---
    const matriculaRegex = /^6ª\s[A-Z]{2}-\d{1}-\d{1,4}-\d{2}$/;
    
    // --- LÓGICA DE NAVEGACIÓN Y MODAL DE INFO (Omitida por brevedad) ---
    const navSolicitantes = document.getElementById('nav-solicitantes');
    const navCuentas = document.getElementById('nav-cuentas');
    const headerTitleElement = document.querySelector('.content-header div:first-child'); 
    if (navSolicitantes && navCuentas) {
        if (currentUser.rol === 'superadmin') {
            navSolicitantes.href = 'admin.html';
            navCuentas.style.display = 'inline-block';
            if(headerTitleElement) headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
        } else {
            navSolicitantes.href = 'panel-admin.html';
            navCuentas.style.display = 'none';
            if(headerTitleElement) headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';
        }
    }
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
    // --- FIN LÓGICA DE NAVEGACIÓN Y MODAL DE INFO ---

    // --- LÓGICA DE TABLA Y BÚSQUEDA (Omitida por brevedad) ---
    const tableBody = document.getElementById('embarcaciones-table-body');
    const searchInput = document.getElementById('search-input'); 

    const renderTabla = (embarcaciones) => { /* ... (Función para renderizar) ... */
        tableBody.innerHTML = '';
        if (embarcaciones.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No se encontraron embarcaciones.</td></tr>';
            return;
        }

        embarcaciones.forEach(e => {
            const row = tableBody.insertRow();
            row.innerHTML = `
                <td>${e.nombre_embarcacion || 'N/A'}</td>
                <td>${e.matricula || 'N/A'}</td>
                <td>${e.tonelaje_neto || 'N/A'}</td>
                <td>${e.marca || 'N/A'}</td>
                <td>${e.potencia_hp || 'N/A'}</td>
                <td>${e.puerto_base || 'N/A'}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" data-id="${e.id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i> 
                    </button>
                </td>
            `;
        });
    };

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filteredEmbarcaciones = allEmbarcaciones.filter(e => {
            const nombre = (e.nombre_embarcacion || '').toLowerCase();
            const matricula = (e.matricula || '').toLowerCase();
            return nombre.includes(searchTerm) || matricula.includes(searchTerm);
        });
        renderTabla(filteredEmbarcaciones);
    });

    const cargarDatosIniciales = async () => {
        try {
            const response = await fetch('/api/admin/embarcaciones', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('No se pudieron cargar los datos.');
            allEmbarcaciones = await response.json();
            renderTabla(allEmbarcaciones);
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };
    cargarDatosIniciales();
    // --- FIN LÓGICA DE TABLA Y BÚSQUEDA ---

    // --- LÓGICA DE VALIDACIÓN DEL MODAL ---
    const editModal = document.getElementById('edit-embarcacion-modal');
    const editForm = document.getElementById('edit-embarcacion-form');

    const setupFormValidation = (form) => {
        const fieldRules = {
            'edit-nombre_embarcacion': { type: 'text', maxLength: 40, required: true },
            'edit-matricula': { type: 'matricula', maxLength: 20, required: false }, // Se puede requerir o no según tu DB
            'edit-tonelaje_neto': { type: 'decimal', maxLength: 10, required: true },
            'edit-marca': { type: 'text', maxLength: 40, required: false },
            'edit-potencia_hp': { type: 'numeric', maxLength: 5, required: true },
            'edit-puerto_base': { type: 'text', maxLength: 40, required: false }
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
                    case 'numeric':
                        input.value = input.value.replace(/[^0-9]/g, '');
                        break;
                    case 'decimal':
                        // Lógica de decimal (como en anexo5.js)
                        input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                        break;
                    case 'matricula':
                        // Permitir caracteres de matrícula
                        input.value = input.value.toUpperCase().replace(/[^A-Z0-9ª-\s]/g, '');
                        break;
                }

                let isValid = true;
                let message = 'Correcto.';

                if (rule.required && !input.value.trim()) {
                    isValid = false;
                    message = 'Este campo es obligatorio.';
                } else if (rule.type === 'matricula' && input.value.length > 0 && !matriculaRegex.test(input.value)) {
                    isValid = false;
                    message = 'Formato incorrecto. Ejemplo: 6ª BA-2-53-21';
                } else if ((rule.type === 'numeric' || rule.type === 'decimal') && input.value.length > 0 && parseFloat(input.value) <= 0) {
                    isValid = false;
                    message = 'Debe ser un número mayor a cero.';
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
    // --- FIN LÓGICA DE VALIDACIÓN DEL MODAL ---


    // --- LÓGICA DE EDICIÓN Y ENVÍO (Adaptada para usar validación) ---
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const editErrorMsg = document.getElementById('edit-error-msg');
    const editIdField = document.getElementById('edit-embarcacion-id');
    const fields = [
        'nombre_embarcacion', 'matricula', 'tonelaje_neto', 
        'marca', 'potencia_hp', 'puerto_base'
    ];
    const editFormFields = {};
    fields.forEach(f => editFormFields[f] = document.getElementById(`edit-${f}`));

    const openEditModal = async (id) => {
        editErrorMsg.style.display = 'none';
        editForm.reset(); 
        editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
        editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');

        try {
            const res = await fetch(`/api/admin/embarcaciones/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!res.ok) throw new Error('No se pudo cargar la información de la embarcación.');
            const embarcacion = await res.json();
            editIdField.value = embarcacion.id;
            
            fields.forEach(f => {
                const element = editFormFields[f];
                if(element) {
                    element.value = embarcacion[f] || '';
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
                const res = await fetch(`/api/admin/embarcaciones/${id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(data)
                });

                const resData = await res.json();
                if (!res.ok) throw new Error(resData.message || 'Error al guardar los cambios.');
                
                const index = allEmbarcaciones.findIndex(em => em.id == id);
                if (index !== -1) {
                    allEmbarcaciones[index] = { ...allEmbarcaciones[index], ...data };
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
    // --- FIN LÓGICA DE EDICIÓN Y ENVÍO ---

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
});