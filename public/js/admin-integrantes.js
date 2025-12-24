// public/js/admin-integrantes.js

// --- 1. LÓGICA DE INTERFAZ POR ROL ---
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

        // Rol ADMIN
        if (rol === 'admin') {
            if (navCuentas) navCuentas.style.display = 'none';
            if (navSolicitantes) navSolicitantes.href = 'panel-admin.html';
            if (adminTheme) adminTheme.disabled = true;
            if (panelAdminTheme) panelAdminTheme.disabled = false;
            if (headerTitleElement) headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';

        // Rol SUPERADMIN
        } else if (rol === 'superadmin') {
            if (navCuentas) navCuentas.style.display = 'block'; 
            if (navSolicitantes) navSolicitantes.href = 'admin.html';
            if (adminTheme) adminTheme.disabled = false;
            if (panelAdminTheme) panelAdminTheme.disabled = true;
            if (headerTitleElement) headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
        }
    } catch (e) {
        console.error("Error al ajustar UI por rol:", e);
    }
}

// --- UTILIDADES DE FECHA ---
const formatDateISO = (date) => {
    return date.toISOString().split('T')[0];
};

const getTodayDate = () => formatDateISO(new Date());

const getDaysAgoDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDateISO(date);
};

const getFirstDayOfMonth = () => {
    const date = new Date();
    date.setDate(1);
    return formatDateISO(date);
};

window.addEventListener('pageshow', (event) => {
    if (event.persisted) ajustarUIporRol();
});

document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    let currentUser = null;
    let allIntegrantes = []; 

    try {
        const currentUserJSON = sessionStorage.getItem('currentUser');
        if (currentUserJSON) currentUser = JSON.parse(currentUserJSON);
    } catch (error) { console.error("Error parse user:", error); }

    if (!authToken || !currentUser) {
        window.location.href = 'home.html';
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
        infoModalIcon.classList.remove('fa-check-circle', 'fa-times-circle', 'success', 'error'); 
        infoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        infoModal.classList.add('visible');
        
        const confirmHandler = () => {
            infoModal.classList.remove('visible');
            if (onConfirm) onConfirm();
            closeInfoModalBtn.removeEventListener('click', confirmHandler);
        };
        closeInfoModalBtn.addEventListener('click', confirmHandler, { once: true });
    };

    // --- HELPERS (Feedback) ---
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
    
    const isValidRFC = (rfc) => /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/.test(rfc.toUpperCase()) && rfc.length >= 12;
    const isValidCURP = (curp) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp.toUpperCase());

    // --- MENÚ DE USUARIO & INFO DINÁMICA ---
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
                // Fetch al servidor para obtener datos frescos
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                
                // Construcción del NOMBRE COMPLETO
                const nombreCompleto = [p.nombre, p.apellido_paterno, p.apellido_materno]
                    .filter(part => part && part.trim() !== '')
                    .join(' ') || 'N/A';

                // Construcción del HTML
                const infoHtml = `
                    <div class="info-row"><label>Nombre:</label> <span>${nombreCompleto}</span></div>
                    <div class="info-row"><label>CURP:</label> <span>${p.curp || 'N/A'}</span></div>
                    <div class="info-row"><label>RFC:</label> <span>${p.rfc || 'N/A'}</span></div>
                    <div class="info-row"><label>Email:</label><span>${p.correo_electronico}</span></div>
                    <div class="info-row"><label>Municipio:</label> <span>${p.municipio || 'N/A'}</span></div>
                `;
                
                const title = currentUser.rol === 'superadmin' ? 'Información del Administrador' : 'Info Admin';
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

    // --- CARGA DE DATOS ---
    const tableBody = document.getElementById('integrantes-table-body');
    const searchInput = document.getElementById('search-input');
    const dateStartInput = document.getElementById('filter-date-start');
    const dateEndInput = document.getElementById('filter-date-end');
    const btnFilterDate = document.getElementById('btn-filter-date');
    const btnClearDate = document.getElementById('btn-clear-date');
    const quickFilterButtons = document.querySelectorAll('.btn-chip');

    // --- RENDERIZADO DE TABLA (MODIFICADO: Botón Eliminar) ---
    const renderTabla = (integrantes) => { 
        tableBody.innerHTML = '';
        if (integrantes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No se encontraron integrantes para el criterio seleccionado.</td></tr>';
            return;
        }
        integrantes.forEach(integrante => {
            const row = tableBody.insertRow();
            const pdfButtonHtml = `
                <button class="btn-icon btn-download-integrante-pdf" data-id="${integrante.id}" title="Descargar Ficha Técnica">
                    <i class="fas fa-file-pdf"></i>
                </button>
            `;
            row.innerHTML = `
                <td>${integrante.nombre_completo || 'N/A'}</td>
                <td>${integrante.rfc || 'N/A'}</td>
                <td>${integrante.curp || 'N/A'}</td>
                <td>${integrante.telefono || 'N/A'}</td>
                <td>${integrante.municipio || 'N/A'}</td>
                <td>${integrante.actividad_desempeña || 'N/A'}</td>
                <td style="text-align: center;">${pdfButtonHtml}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit" data-id="${integrante.id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i> 
                    </button>
                    <button class="btn-icon btn-delete" data-id="${integrante.id}" title="Eliminar">
                        <i class="fas fa-trash-alt"></i> 
                    </button>
                </td>
            `;
        });
    };

    // Buscador
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const filtered = allIntegrantes.filter(i => {
                const n = (i.nombre_completo || '').toLowerCase();
                const r = (i.rfc || '').toLowerCase();
                const c = (i.curp || '').toLowerCase();
                const m = (i.municipio || '').toLowerCase();
                return n.includes(searchTerm) || r.includes(searchTerm) || c.includes(searchTerm) || m.includes(searchTerm);
            });
            renderTabla(filtered);
        });
    }

    const cargarDatosIniciales = async (startDate = '', endDate = '') => {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Cargando datos...</td></tr>';
        try {
            let url = '/api/integrantes'; 
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (startDate || endDate) url += `?${params.toString()}`;

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('Failed to load data.');
            
            allIntegrantes = await response.json();
            renderTabla(allIntegrantes);
            
            if (searchInput && searchInput.value.trim() !== '') {
                searchInput.dispatchEvent(new Event('input'));
            }
        } catch (error) {
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };
    
    cargarDatosIniciales();

    // Filtros
    if (btnFilterDate) {
        btnFilterDate.addEventListener('click', () => {
            quickFilterButtons.forEach(btn => btn.classList.remove('active'));
            const start = dateStartInput.value;
            const end = dateEndInput.value;
            cargarDatosIniciales(start, end);
        });
    }

    const clearFilters = () => {
        dateStartInput.value = '';
        dateEndInput.value = '';
        quickFilterButtons.forEach(btn => btn.classList.remove('active'));
        cargarDatosIniciales();
    };

    if (btnClearDate) btnClearDate.addEventListener('click', clearFilters);

    quickFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            quickFilterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const rangeType = e.target.dataset.range;
            const today = getTodayDate();
            let start = '', end = today; 
            if (rangeType === 'today') start = today;
            else if (rangeType === 'week') start = getDaysAgoDate(7);
            else if (rangeType === 'month') start = getFirstDayOfMonth();
            dateStartInput.value = start;
            dateEndInput.value = end;
            cargarDatosIniciales(start, end);
        });
    });

    // ============================================================
    // === LÓGICA DEL MODAL DE ELIMINACIÓN ===
    // ============================================================
    const deleteModal = document.getElementById('delete-confirmation-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let deleteTargetId = null;

    const openDeleteModal = (id) => {
        deleteTargetId = id;
        deleteModal.classList.add('visible');
    };

    const closeDeleteModal = () => {
        deleteTargetId = null;
        deleteModal.classList.remove('visible');
    };

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!deleteTargetId) return;
            
            // UI feedback
            const originalText = confirmDeleteBtn.textContent;
            confirmDeleteBtn.textContent = 'Eliminando...';
            confirmDeleteBtn.disabled = true;

            try {
                const response = await fetch(`/api/integrantes/${deleteTargetId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                const result = await response.json();

                if (!response.ok) throw new Error(result.message || 'Error al eliminar');

                // Éxito
                showInfoModal('Eliminado', 'El integrante ha sido eliminado correctamente.', true);
                
                // Actualizar tabla localmente
                allIntegrantes = allIntegrantes.filter(i => i.id != deleteTargetId);
                
                // Reaplicar búsqueda si existe
                if (searchInput && searchInput.value.trim() !== '') {
                    searchInput.dispatchEvent(new Event('input'));
                } else {
                    renderTabla(allIntegrantes);
                }

                closeDeleteModal();

            } catch (error) {
                showInfoModal('Error', error.message, false);
                closeDeleteModal();
            } finally {
                confirmDeleteBtn.textContent = originalText;
                confirmDeleteBtn.disabled = false;
            }
        });
    }

    // --- MODAL DE EDICIÓN ---
    const editModal = document.getElementById('edit-integrante-modal');
    const editForm = document.getElementById('edit-integrante-form');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const editErrorMsg = document.getElementById('edit-error-msg');
    const editIdField = document.getElementById('edit-integrante-id');
    const fields = ['nombre_completo', 'rfc', 'curp', 'telefono', 'municipio', 'actividad_desempena'];
    const editFormFields = {};
    fields.forEach(f => editFormFields[f] = document.getElementById(`edit-${f}`));

    const setupFormValidation = () => {
        const fieldRules = {
            'edit-nombre_completo': { type: 'text', maxLength: 100, required: true },
            'edit-rfc': { type: 'rfc', maxLength: 13, required: false },
            'edit-curp': { type: 'curp', maxLength: 18, required: false },
            'edit-telefono': { type: 'telefono', maxLength: 10, required: false },
            'edit-municipio': { type: 'text', maxLength: 50, required: false },
            'edit-actividad_desempena': { type: 'text', maxLength: 50, required: false }
        };
        for (const fId in fieldRules) {
            const input = document.getElementById(fId);
            if (!input) continue;
            const rule = fieldRules[fId];
            input.setAttribute('maxlength', rule.maxLength);
            if(rule.required) input.setAttribute('required', 'required');

            input.addEventListener('input', () => {
                if(rule.type === 'text') input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if(rule.type === 'telefono') input.value = input.value.replace(/[^0-9]/g, '');
                if(rule.type === 'rfc' || rule.type === 'curp') input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                
                let valid = true;
                let msg = 'Correcto.';
                if(rule.required && !input.value.trim()) { valid = false; msg = 'Requerido.'; }
                else if(rule.type === 'rfc' && input.value && !isValidRFC(input.value)) { valid = false; msg = 'RFC inválido'; }
                else if(rule.type === 'curp' && input.value && !isValidCURP(input.value)) { valid = false; msg = 'CURP inválido'; }
                else if(rule.type === 'telefono' && input.value && input.value.length < 10) { valid = false; msg = '10 dígitos'; }

                if(input.value || rule.required) showFeedback(input, msg, valid);
                else showFeedback(input, '', true);
            });
        }
    };
    if (editForm) setupFormValidation();

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
                const el = editFormFields[f];
                if(el) {
                    el.value = integrante[f] || integrante[f.replace('_desempena', '_desempeña')] || '';
                    el.dispatchEvent(new Event('input'));
                }
            });
            editModal.classList.add('visible');
        } catch (e) { alert(e.message); }
    };

    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => editModal.classList.remove('visible'));
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.remove('visible'); });

    // Guardar Cambios
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            editForm.querySelectorAll('input').forEach(i => i.dispatchEvent(new Event('input')));
            if(editForm.querySelector('.invalid')) {
                showInfoModal('Error', 'Corrige los campos en rojo.', false);
                return;
            }

            const id = editIdField.value;
            const btn = editModal.querySelector('button[type="submit"]');
            if(btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
            
            const data = {};
            fields.forEach(f => data[f] = editFormFields[f].value);

            try {
                const res = await fetch(`/api/integrantes/${id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(data)
                });
                const resData = await res.json();
                if(!res.ok) throw new Error(resData.message);

                const idx = allIntegrantes.findIndex(i => i.id == id);
                if(idx !== -1) {
                    allIntegrantes[idx] = { ...allIntegrantes[idx], ...data };
                    allIntegrantes[idx].actividad_desempeña = data.actividad_desempena;
                }
                if(searchInput) searchInput.dispatchEvent(new Event('input')); 
                
                editModal.classList.remove('visible');
                showInfoModal('Éxito', resData.message, true);
            } catch (e) {
                editErrorMsg.textContent = e.message;
                editErrorMsg.style.display = 'block';
            } finally {
                if(btn) { btn.disabled = false; btn.textContent = 'Guardar Cambios'; }
            }
        });
    }

    tableBody.addEventListener('click', async (e) => {
        const target = e.target.closest('button');
        if (!target) return;

        // Caso PDF
        if (target.classList.contains('btn-download-integrante-pdf')) {
            if (target.disabled) return;
            const id = target.dataset.id;
            const original = target.innerHTML;
            target.disabled = true;
            target.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                const res = await fetch(`/api/admin/integrante-pdf/${id}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if(!res.ok) throw new Error('Error al descargar');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Integrante_${id}.pdf`;
                document.body.appendChild(a); a.click(); a.remove();
                window.URL.revokeObjectURL(url);
            } catch (e) {
                showInfoModal('Error', 'No se pudo descargar la ficha.', false);
            } finally {
                target.disabled = false;
                target.innerHTML = original;
            }
            return;
        }

        // Caso Editar
        if (target.classList.contains('btn-edit')) {
            openEditModal(target.dataset.id);
            return;
        }

        // Caso Eliminar (NUEVO)
        if (target.classList.contains('btn-delete')) {
            openDeleteModal(target.dataset.id);
            return;
        }
    });

    // --- EXPORTAR LISTA PDF ---
    const btnExportarPdf = document.getElementById('btn-exportar-pdf');
    if (btnExportarPdf) {
        btnExportarPdf.addEventListener('click', async () => {
            const original = btnExportarPdf.innerHTML;
            try {
                const start = dateStartInput.value;
                const end = dateEndInput.value;

                btnExportarPdf.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
                btnExportarPdf.disabled = true;

                let url = '/api/integrantes/exportar-pdf';
                const params = new URLSearchParams();
                if (start) params.append('startDate', start);
                if (end) params.append('endDate', end);
                if (start || end) url += `?${params.toString()}`;

                const response = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const urlBlob = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = urlBlob;
                    a.download = `Lista_Integrantes_${new Date().toISOString().slice(0,10)}.pdf`;
                    document.body.appendChild(a); a.click(); a.remove();
                    window.URL.revokeObjectURL(urlBlob);
                } else {
                    throw new Error('Error servidor');
                }
            } catch (error) {
                showInfoModal('Error', 'No se pudo exportar la lista.', false);
            } finally {
                btnExportarPdf.innerHTML = original;
                btnExportarPdf.disabled = false;
            }
        });
    }
});