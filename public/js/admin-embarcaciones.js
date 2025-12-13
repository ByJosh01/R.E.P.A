// public/js/admin-embarcaciones.js

// --- 1. FUNCIONES AUXILIARES GLOBALES ---

const insertOrdinalChar = (inputElement) => {
    const charToInsert = 'ª';
    const startPos = inputElement.selectionStart;
    const endPos = inputElement.selectionEnd;
    const currentValue = inputElement.value;
    inputElement.value = currentValue.substring(0, startPos) + charToInsert + currentValue.substring(endPos);
    const newCursorPos = startPos + charToInsert.length;
    inputElement.selectionStart = newCursorPos;
    inputElement.selectionEnd = newCursorPos;
    inputElement.focus();
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
};

const showFeedback = (inputElement, message, isValid) => {
    let feedbackElement = inputElement.nextElementSibling;
    if (!feedbackElement || !feedbackElement.classList.contains('feedback-message')) {
        const wrapper = inputElement.closest('.input-wrapper');
        if (wrapper) {
            feedbackElement = wrapper.nextElementSibling;
        } else {
            const parent = inputElement.closest('.anexo-field');
            if (parent) feedbackElement = parent.querySelector('.feedback-message');
        }
    }

    if (feedbackElement && feedbackElement.classList.contains('feedback-message')) {
        inputElement.classList.remove('valid', 'invalid');
        feedbackElement.classList.remove('valid', 'invalid');
        
        if (message) {
            inputElement.classList.add(isValid ? 'valid' : 'invalid');
            feedbackElement.classList.add(isValid ? 'valid' : 'invalid');
            feedbackElement.textContent = message;
        } else {
            feedbackElement.textContent = '';
        }
    }
};

function ajustarUIporRol() {
    const userSession = sessionStorage.getItem('currentUser');
    if (!userSession) return;

    try {
        const user = JSON.parse(userSession);
        const rol = user.rol;
        const navSolicitantes = document.getElementById('nav-solicitantes');
        const navCuentas = document.getElementById('nav-cuentas');
        const adminTheme = document.getElementById('admin-theme-link');
        const panelAdminTheme = document.getElementById('panel-admin-theme-link');
        const headerTitleElement = document.querySelector('.content-header div:first-child');

        if (rol === 'admin') {
            if (navCuentas) navCuentas.style.display = 'none';
            if (navSolicitantes) navSolicitantes.href = 'panel-admin.html';
            if (adminTheme) adminTheme.disabled = true;
            if (panelAdminTheme) panelAdminTheme.disabled = false;
            if (headerTitleElement) headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';

        } else if (rol === 'superadmin') {
            if (navCuentas) navCuentas.style.display = 'inline-block';
            if (navSolicitantes) navSolicitantes.href = 'admin.html';
            if (adminTheme) adminTheme.disabled = false;
            if (panelAdminTheme) panelAdminTheme.disabled = true;
            if (headerTitleElement) headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
        }
    } catch (e) {
        console.error("Error al ajustar UI por rol:", e);
    }
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) ajustarUIporRol();
});

// --- 2. INICIO DOM CONTENT LOADED ---
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;
    let allEmbarcaciones = []; 

    try {
        const currentUserJSON = sessionStorage.getItem('currentUser');
        if (currentUserJSON) currentUser = JSON.parse(currentUserJSON);
    } catch (error) { console.error("Error parse user:", error); }

    if (!authToken || !currentUser) {
        window.location.replace('home.html');
        return;
    }

    ajustarUIporRol();

    // --- MODAL DE INFO (GENÉRICO) ---
    const infoModal = document.getElementById('admin-info-modal');
    const infoModalTitle = document.getElementById('admin-info-title');
    const infoModalContent = document.getElementById('admin-info-content');
    const infoModalIcon = document.getElementById('admin-info-icon');
    const closeInfoModalBtn = document.getElementById('close-admin-info-btn');
    
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        if (!infoModal) { alert(`${title}: ${content}`); return; }
        infoModalTitle.textContent = title;
        infoModalContent.innerHTML = content.startsWith('<div') ? content : `<p style="text-align: center;">${content}</p>`;
        infoModalIcon.className = 'modal-icon fas';
        infoModalIcon.classList.remove('fa-check-circle', 'fa-times-circle', 'success', 'error'); // Limpiar clases previas
        infoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        infoModal.classList.add('visible');
        
        const confirmHandler = () => {
            infoModal.classList.remove('visible');
            if (onConfirm) onConfirm();
            closeInfoModalBtn.removeEventListener('click', confirmHandler);
        };
        closeInfoModalBtn.addEventListener('click', confirmHandler, { once: true });
    };

    // --- TABLA Y BÚSQUEDA ---
    const tableBody = document.getElementById('embarcaciones-table-body');
    const searchInput = document.getElementById('search-input'); 

    const renderTabla = (embarcaciones) => { 
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
            // Se asume que el backend usa '/api/embarcaciones' como prefijo para estas rutas
            const response = await fetch('/api/embarcaciones', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('No se pudieron cargar los datos.');
            allEmbarcaciones = await response.json(); 
            renderTabla(allEmbarcaciones); 
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };
    cargarDatosIniciales();

    // ============================================================
    // === LÓGICA DEL MODAL DE EDICIÓN ===
    // ============================================================
    
    const editModal = document.getElementById('edit-embarcacion-modal');
    const editForm = document.getElementById('edit-embarcacion-form');
    const editIdField = document.getElementById('edit-embarcacion-id');
    const editErrorMsg = document.getElementById('edit-error-msg');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn'); 
    
    const fields = [
        'nombre_embarcacion', 'matricula', 'tonelaje_neto', 
        'marca', 'numero_serie', 'potencia_hp', 'puerto_base'
    ];
    
    const editFormFields = {};
    fields.forEach(f => editFormFields[f] = document.getElementById(`edit-${f}`));

    // 1. BOTONES DE AYUDA Y MATRÍCULA
    const btnEditOrdinal = document.getElementById('btn-insert-ordinal-edit');
    const btnHelpEdit = document.getElementById('btn-help-matricula-edit');
    const matriculaHelpModal = document.getElementById('matricula-help-modal');
    const closeMatriculaHelpBtn = document.getElementById('close-matricula-help-btn');
    const inputEditMatricula = document.getElementById('edit-matricula');

    if (btnEditOrdinal && inputEditMatricula) {
        btnEditOrdinal.addEventListener('click', (e) => {
            e.preventDefault();
            insertOrdinalChar(inputEditMatricula);
        });
    }

    if (btnHelpEdit && matriculaHelpModal) {
        btnHelpEdit.addEventListener('click', (e) => {
            e.preventDefault();
            matriculaHelpModal.classList.add('visible');
        });
    }

    if (closeMatriculaHelpBtn && matriculaHelpModal) {
        closeMatriculaHelpBtn.addEventListener('click', () => matriculaHelpModal.classList.remove('visible'));
        matriculaHelpModal.addEventListener('click', (e) => {
            if(e.target === matriculaHelpModal) matriculaHelpModal.classList.remove('visible');
        });
    }

    // 2. VALIDACIÓN (Tu lógica original)
    const setupFormValidation = (form) => {
        const matriculaRegex = /^6ª\s[A-Z]{2}-\d{1}-\d{1,4}-\d{2}$/;
        const fieldRules = {
            'edit-nombre_embarcacion': { type: 'text', required: true, maxLength: 40 },
            'edit-matricula': { type: 'matricula', required: false, maxLength: 20 }, 
            'edit-tonelaje_neto': { type: 'decimal', required: true, maxLength: 10 },
            'edit-marca': { type: 'text', required: false, maxLength: 40 },
            'edit-numero_serie': { type: 'alphanum', required: false, maxLength: 40 },
            'edit-potencia_hp': { type: 'numeric', required: true, maxLength: 5 },
            'edit-puerto_base': { type: 'text', required: false, maxLength: 40 }
        };

        for (const fieldId in fieldRules) {
            const input = document.getElementById(fieldId);
            if (!input) continue;
            const rule = fieldRules[fieldId];
            input.setAttribute('maxlength', rule.maxLength);
            if(rule.required) input.setAttribute('required', 'required');

            input.addEventListener('input', () => {
                switch (rule.type) {
                    case 'text': input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''); break;
                    case 'numeric': input.value = input.value.replace(/[^0-9]/g, ''); break;
                    case 'decimal': input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); break;
                    case 'alphanum': input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''); break;
                    case 'matricula': input.value = input.value.toUpperCase().replace(/[^A-Z0-9ª-\s]/g, ''); break;
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
    if (editForm) setupFormValidation(editForm);

    // 3. ABRIR MODAL
    const openEditModal = async (id) => {
        editErrorMsg.style.display = 'none';
        editForm.reset(); 
        editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
        editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');

        try {
            // Aseguramos la ruta correcta con el ID
            const res = await fetch(`/api/embarcaciones/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!res.ok) throw new Error('No se pudo cargar la información.');
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
        } catch (error) { 
            alert(error.message); 
        }
    };

    tableBody.addEventListener('click', (e) => {
        const editButton = e.target.closest('.btn-edit');
        if (editButton) openEditModal(editButton.dataset.id);
    });

    // 4. CERRAR MODAL
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', () => {
            editModal.classList.remove('visible');
        });
    }
    
    if (editModal) {
        editModal.addEventListener('click', (e) => { 
            if (e.target === editModal) editModal.classList.remove('visible'); 
        });
    }

    // 5. GUARDAR CAMBIOS
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            editForm.querySelectorAll('input').forEach(input => input.dispatchEvent(new Event('input', { bubbles: true })));
            
            const firstInvalidElement = editForm.querySelector('.invalid');
            if (firstInvalidElement) {
                editErrorMsg.textContent = 'Por favor, revisa y corrige los campos marcados en rojo.';
                editErrorMsg.style.display = 'block';
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
                const res = await fetch(`/api/embarcaciones/${id}`, {
                    method: 'PUT', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(data)
                });

                const resData = await res.json();
                if (!res.ok) throw new Error(resData.message || 'Error al guardar.');
                
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

    // --- MENÚ DE USUARIO ---
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const adminGotoDashboardBtn = document.getElementById('admin-goto-dashboard-btn');

    if (adminEmailPlaceholder && currentUser) adminEmailPlaceholder.textContent = currentUser.email;
    
    if (userMenuTrigger) {
        userMenuTrigger.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            userDropdown?.classList.toggle('active'); 
        });
    }
    
    window.addEventListener('click', () => { 
        if (userDropdown?.classList.contains('active')) userDropdown.classList.remove('active'); 
    });

    if (viewAdminInfoBtn) {
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
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.replace('home.html');
        });
    }

    if (adminGotoDashboardBtn) {
        adminGotoDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    // ==========================================================
    // ==== LÓGICA: BOTÓN EXPORTAR PDF (AGREGADA AL FINAL) ====
    // ==========================================================
    const btnExportarPdf = document.getElementById('btn-exportar-pdf');
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', async () => {
            try {
                const originalContent = btnExportarPdf.innerHTML;
                btnExportarPdf.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
                btnExportarPdf.disabled = true;

                // URL limpia usando el prefijo '/api/embarcaciones' definido en server.js
                const response = await fetch('/api/embarcaciones/exportar-pdf', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${authToken}`
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Lista_Embarcaciones_${new Date().toISOString().slice(0,10)}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } else {
                    const errorData = await response.json();
                    showInfoModal('Error', 'Error al descargar PDF: ' + (errorData.message || 'Error desconocido'), false);
                }
            } catch (error) {
                console.error('Error exportando PDF:', error);
                showInfoModal('Error', 'Ocurrió un error de red al intentar exportar.', false);
            } finally {
                btnExportarPdf.innerHTML = '<i class="fas fa-file-pdf"></i> Exportar Lista PDF';
                btnExportarPdf.disabled = false;
            }
        });
    }
});