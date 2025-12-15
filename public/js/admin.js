// public/js/admin.js

function checkSuperAdminRole() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser || currentUser.rol !== 'superadmin') {
        console.warn(`Acceso denegado: Rol '${currentUser ? currentUser.rol : 'null'}' no autorizado.`);
        if (currentUser && currentUser.rol === 'admin') {
            window.location.replace('/panel-admin.html');
        } else {
            window.location.replace('/dashboard.html');
        }
        return false;
    }
    return true;
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) checkSuperAdminRole();
});

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkSuperAdminRole()) return;

    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // --- UTILIDADES DE FECHA ---
    const formatDateISO = (date) => date.toISOString().split('T')[0];
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

    // --- LÓGICA DE VALIDACIÓN ---
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

    // Elementos del DOM
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const adminGoToDashboardBtn = document.getElementById('admin-goto-dashboard-btn');
    const tableBody = document.getElementById('solicitantes-table-body');
    const searchInput = document.getElementById('search-input');
    
    // Filtros de fecha
    const dateStartInput = document.getElementById('filter-date-start');
    const dateEndInput = document.getElementById('filter-date-end');
    const btnFilterDate = document.getElementById('btn-filter-date');
    const btnClearDate = document.getElementById('btn-clear-date');
    const quickFilterButtons = document.querySelectorAll('.btn-chip');

    let allSolicitantes = [];

    // Modales y controles
    const adminInfoModal = document.getElementById('admin-info-modal');
    const adminInfoContent = document.getElementById('admin-info-content');
    const adminInfoModalTitle = adminInfoModal?.querySelector('h2');
    const adminInfoModalIcon = adminInfoModal?.querySelector('.modal-icon');
    const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
    const resetDbBtn = document.getElementById('reset-db-btn');
    const resetModal = document.getElementById('reset-modal');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const masterPasswordInput = document.getElementById('master-password-input');
    const resetErrorMessage = document.getElementById('reset-error-message');
    const resetModalTitle = resetModal?.querySelector('h2');
    const resetModalMessage = resetModal?.querySelector('p');
    const resetModalInputGroup = resetModal?.querySelector('.input-group');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const deleteConfirmMessage = document.getElementById('delete-confirm-message');
    const editModal = document.getElementById('edit-solicitante-modal');
    const editForm = document.getElementById('edit-solicitante-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editSolicitanteId = document.getElementById('edit-solicitante-id');
    const editNombreInput = document.getElementById('edit-nombre');
    const editRfcInput = document.getElementById('edit-rfc');
    const editCurpInput = document.getElementById('edit-curp');
    const backupDbBtn = document.getElementById('backup-db-btn');
    const btnDownloadGeneralReport = document.getElementById('btn-download-general-report');


    // --- FUNCIÓN PARA MOSTRAR MODALES DE INFO ---
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        if (!adminInfoModal) { alert(`${title}: ${content}`); return; }
        adminInfoModalTitle.textContent = title;
        adminInfoContent.innerHTML = `<p style="text-align: center;">${content}</p>`;
        adminInfoModalIcon.className = 'modal-icon fas';
        adminInfoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        adminInfoModal.classList.add('visible');
        const confirmHandler = () => {
            adminInfoModal.classList.remove('visible');
            if (onConfirm) onConfirm();
            if(closeAdminModalBtn) closeAdminModalBtn.removeEventListener('click', confirmHandler);
        };
        if(closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', confirmHandler, { once: true });
    };

    // --- MENÚ ADMIN ---
    let superAdminSolicitanteId = null;
    try {
        const profileResponse = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (profileResponse.ok) {
            const adminProfile = await profileResponse.json();
            superAdminSolicitanteId = adminProfile.solicitante_id;
        }
    } catch (e) { console.error("Error perfil admin:", e); }

    if (adminEmailPlaceholder) adminEmailPlaceholder.textContent = currentUser.email;
    if (userMenuTrigger) userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); });
    window.addEventListener('click', () => { if (userDropdown?.classList.contains('active')) userDropdown.classList.remove('active'); });
    if (adminGoToDashboardBtn) adminGoToDashboardBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });

    if (viewAdminInfoBtn) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                const p = await r.json();
                const nombreCompletoAdmin = [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ') || 'N/A';
                if(adminInfoModalTitle) adminInfoModalTitle.textContent = 'Información del Superadministrador';
                adminInfoContent.innerHTML = `<div class="info-row"><label>Nombre:</label> <span>${nombreCompletoAdmin}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div>`;
                adminInfoModal.classList.add('visible');
            } catch (err) { showInfoModal('Error', err.message, false); }
        });
    }
    if(adminLogoutBtn) adminLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); localStorage.clear(); sessionStorage.clear(); window.location.href = 'home.html'; });

    // --- VALIDACIÓN EDICIÓN ---
    const setupEditFormValidation = () => {
        if (editNombreInput) {
            editNombreInput.setAttribute('maxlength', 150);
            editNombreInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if (e.target.value.trim().length > 0) showFeedback(e.target, 'Correcto.', true);
                else showFeedback(e.target, 'El nombre es obligatorio.', false);
            });
        }
        if (editRfcInput) {
             editRfcInput.setAttribute('maxlength', 13);
             editRfcInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (e.target.value.length > 0 && !isValidRFC(e.target.value)) showFeedback(e.target, 'Formato incorrecto.', false);
                else showFeedback(e.target, 'RFC válido (o vacío opcional).', true);
            });
        }
        if (editCurpInput) {
            editCurpInput.setAttribute('maxlength', 18);
            editCurpInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (e.target.value.length > 0 && !isValidCURP(e.target.value)) showFeedback(e.target, 'Formato incorrecto.', false);
                else if (e.target.value.length === 0) showFeedback(e.target, 'Requerido.', false); 
                else showFeedback(e.target, 'CURP válido.', true);
            });
        }
    };
    setupEditFormValidation(); 

    // --- CARGAR DATOS (Con Filtros) ---
    const renderTabla = (solicitantes) => {
        if(!tableBody) return;
        tableBody.innerHTML = '';
        if (solicitantes.length === 0) { tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No se encontraron solicitantes para el filtro seleccionado.</td></tr>`; return; }

        solicitantes.forEach(sol => {
            const row = tableBody.insertRow();
            row.dataset.id = sol.solicitante_id;
            const nombreCompleto = [sol.nombre, sol.apellido_paterno, sol.apellido_materno].filter(Boolean).join(' ') || 'No registrado';
            let deleteButtonDisabled = (sol.solicitante_id === superAdminSolicitanteId) ? 'disabled' : '';

            row.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>${sol.rfc || 'N/A'}</td>
                <td>${sol.curp || 'N/A'}</td>
                <td>${sol.actividad || 'N/A'}</td>
                <td>
                    <button class="btn-icon btn-edit" title="Editar" data-id="${sol.solicitante_id}">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn-icon btn-delete" title="Eliminar" data-id="${sol.solicitante_id}" ${deleteButtonDisabled}>
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
                <td>
                    <button class="btn-icon btn-download-pdf" data-id="${sol.solicitante_id}" title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </td>
            `;
        });
    };

    const cargarSolicitantes = async (startDate = '', endDate = '') => {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Cargando datos...</td></tr>`;
        try {
            let url = '/api/admin/solicitantes';
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            
            if (startDate || endDate) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } });
             if (response.status === 403) { showInfoModal('Acceso Denegado', 'No tienes permisos.', false, () => window.location.href = 'dashboard.html'); return; }
            if (!response.ok) { throw new Error('No se pudieron cargar los solicitantes.'); }
            
            allSolicitantes = await response.json();
            renderTabla(allSolicitantes);
            
            // Reaplicar búsqueda de texto
            if (searchInput && searchInput.value.trim() !== '') {
                searchInput.dispatchEvent(new Event('input'));
            }

        } catch (error) {
            console.error("Error al cargar solicitantes:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
        }
    };

    if (searchInput && tableBody) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const filteredSolicitantes = allSolicitantes.filter(s => {
                const nombreCompleto = [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ').toLowerCase();
                const rfc = (s.rfc || '').toLowerCase();
                const curp = (s.curp || '').toLowerCase();
                return nombreCompleto.includes(searchTerm) || rfc.includes(searchTerm) || curp.includes(searchTerm);
            });
            renderTabla(filteredSolicitantes);
        });
    }

    // --- FILTROS DE FECHA ---
    if (btnFilterDate) {
        btnFilterDate.addEventListener('click', () => {
            quickFilterButtons.forEach(btn => btn.classList.remove('active'));
            const start = dateStartInput.value;
            const end = dateEndInput.value;
            cargarSolicitantes(start, end);
        });
    }
    if (btnClearDate) {
        btnClearDate.addEventListener('click', () => {
            dateStartInput.value = '';
            dateEndInput.value = '';
            quickFilterButtons.forEach(btn => btn.classList.remove('active'));
            cargarSolicitantes();
        });
    }
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
            cargarSolicitantes(start, end);
        });
    });


    // --- MANEJO DE MODALES ---
    let solicitanteIdToDelete = null;
    const closeDeleteModal = () => { if (deleteConfirmModal) deleteConfirmModal.classList.remove('visible'); };
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteConfirmModal) deleteConfirmModal.addEventListener('click', (e) => { if (e.target === deleteConfirmModal) closeDeleteModal(); });

    const closeEditModal = () => { 
        if (editModal) editModal.classList.remove('visible'); 
        editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid')); 
        editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');
    };
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const button = e.target.closest('button.btn-icon');
            const row = e.target.closest('tr');
            if (!row || !row.dataset.id) { 
                 if (row && row.dataset.id && !e.target.closest('button')) {
                    const id = row.dataset.id;
                    window.location.href = `detalle-solicitante.html?id=${id}`;
                 }
                 return;
            }
            const id = row.dataset.id; 

            if (button) {
                 if (button.disabled) return;

                // Edit
                if (button.classList.contains('btn-edit')) {
                    try {
                        const response = await fetch(`/api/admin/solicitantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!response.ok) throw new Error('No se pudieron obtener los datos.');
                        const data = await response.json();
                        if (editForm && editSolicitanteId && editModal) {
                            const nombreCompleto = [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ');
                            editForm.elements.nombre.value = nombreCompleto;
                            editForm.elements.rfc.value = data.rfc || '';
                            editForm.elements.curp.value = data.curp || '';
                            editForm.elements.actividad.value = data.actividad || 'pesca';
                            editForm.elements.rol.value = data.rol || 'solicitante';
                            editSolicitanteId.value = data.solicitante_id;
                            editNombreInput.dispatchEvent(new Event('input', { bubbles: true }));
                            editRfcInput.dispatchEvent(new Event('input', { bubbles: true }));
                            editCurpInput.dispatchEvent(new Event('input', { bubbles: true }));
                            editModal.classList.add('visible');
                        }
                    } catch(error) { showInfoModal('Error', error.message, false); }
                }
                // Delete
                else if (button.classList.contains('btn-delete')) {
                    solicitanteIdToDelete = id;
                    const nombre = row.cells[0]?.textContent || 'Solicitante';
                    if (deleteConfirmMessage) deleteConfirmMessage.innerHTML = `¿Eliminar a <strong>${nombre}</strong>? Permanente.`;
                    deleteConfirmModal.classList.add('visible');
                }
                // Download PDF
                else if (button.classList.contains('btn-download-pdf')) {
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    try {
                        const response = await fetch(`/api/admin/download-pdf/${id}`, { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!response.ok) throw new Error('Falló la descarga.');
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = `Registro_REPA_${id}.pdf`;
                        document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
                    } catch (error) { showInfoModal('Error', error.message, false); }
                    finally { button.disabled = false; button.innerHTML = '<i class="fas fa-file-pdf"></i>'; }
                }
            } else { 
                 window.location.href = `detalle-solicitante.html?id=${id}`;
            }
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!solicitanteIdToDelete) return;
            try {
                const response = await fetch(`/api/admin/solicitantes/${solicitanteIdToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                closeDeleteModal();
                showInfoModal('Éxito', result.message, true, () => { cargarSolicitantes(); });
            } catch (error) { showInfoModal('Error', error.message, false); }
            finally { solicitanteIdToDelete = null; }
        });
    }

    if (editForm && editSolicitanteId) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            editForm.querySelectorAll('input').forEach(input => input.dispatchEvent(new Event('input', { bubbles: true })));
            if (editForm.querySelector('.invalid')) { showInfoModal('Formulario Incompleto', 'Corrige los campos rojos.', false); return; }

            const id = editSolicitanteId.value;
            const nombreCompleto = editForm.elements.nombre.value.trim();
            const nombreParts = nombreCompleto.split(' ');
            let nombre_solo = '', apellido_paterno = '', apellido_materno = '';

            if (nombreParts.length === 1) { nombre_solo = nombreParts[0]; }
            else if (nombreParts.length === 2) { nombre_solo = nombreParts[0]; apellido_paterno = nombreParts[1]; }
            else if (nombreParts.length >= 3) {
                 apellido_materno = nombreParts.pop();
                 apellido_paterno = nombreParts.pop();
                 nombre_solo = nombreParts.join(' ');
            }

            const data = {
                nombre: nombre_solo, apellido_paterno, apellido_materno,
                rfc: editForm.elements.rfc.value,
                curp: editForm.elements.curp.value,
                actividad: editForm.elements.actividad.value,
                rol: editForm.elements.rol.value 
            };

            try {
                const response = await fetch(`/api/admin/solicitantes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify(data) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                closeEditModal();
                showInfoModal('Éxito', result.message, true, () => { cargarSolicitantes(); });
            } catch (error) { showInfoModal('Error', error.message, false); }
        });
    }

    // --- ZONA PELIGRO Y REPORTE GENERAL ---
    if (backupDbBtn) {
        backupDbBtn.addEventListener('click', async () => {
            showInfoModal('Procesando...', 'Generando respaldo...', true);
            try { 
                const response = await fetch('/api/admin/backup-database', { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!response.ok) throw new Error('Falló el respaldo.');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = 'repa_backup.sql';
                document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); a.remove();
                if (adminInfoModal) adminInfoModal.classList.remove('visible');
            } catch (error) { showInfoModal('Error', error.message, false); }
        });
    }

    if (resetModal && resetDbBtn) {
        let resetStep = 'password';
        resetDbBtn.addEventListener('click', () => { 
            resetStep = 'password'; resetModalTitle.textContent = 'Confirmación'; resetModalMessage.textContent = 'Ingrese contraseña maestra.'; 
            masterPasswordInput.value = ''; resetErrorMessage.textContent = ''; resetModalInputGroup.style.display = 'block'; confirmResetBtn.textContent = 'Confirmar';
            resetModal.classList.add('visible'); 
        });
        cancelResetBtn.addEventListener('click', () => resetModal.classList.remove('visible'));
        confirmResetBtn.addEventListener('click', async () => {
            if (resetStep === 'password') { 
                if (!masterPasswordInput.value) { resetErrorMessage.textContent = 'Campo vacío.'; return; }
                resetStep = 'final'; resetModalTitle.textContent = 'ADVERTENCIA'; resetModalMessage.innerHTML = '¿BORRAR TODO?'; resetModalInputGroup.style.display = 'none'; confirmResetBtn.textContent = 'SÍ, BORRAR';
            } else {
                resetModal.classList.remove('visible');
                try {
                    const res = await fetch('/api/admin/reset-database', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify({ masterPassword: masterPasswordInput.value }) });
                    const r = await res.json();
                    if(!res.ok) throw new Error(r.message);
                    showInfoModal('Éxito', r.message, true, () => window.location.reload());
                } catch(e) { showInfoModal('Error', e.message, false); }
            }
        });
    }

    if (btnDownloadGeneralReport) {
        btnDownloadGeneralReport.addEventListener('click', async () => {
            const original = btnDownloadGeneralReport.innerHTML;
            btnDownloadGeneralReport.disabled = true;
            btnDownloadGeneralReport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            try {
                // Filtros para el reporte
                const start = dateStartInput.value;
                const end = dateEndInput.value;
                let url = '/api/admin/download-reporte-general';
                const params = new URLSearchParams();
                if (start) params.append('startDate', start);
                if (end) params.append('endDate', end);
                if (start || end) url += `?${params.toString()}`;

                const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!response.ok) throw new Error('Falló la generación.');
                const blob = await response.blob();
                const urlBlob = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.style.display = 'none'; a.href = urlBlob; a.download = 'Reporte_General_Solicitantes.pdf';
                document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(urlBlob); a.remove();
            } catch (error) { showInfoModal('Error', error.message, false); } 
            finally { btnDownloadGeneralReport.disabled = false; btnDownloadGeneralReport.innerHTML = original; }
        });
    }

    // Carga inicial
    cargarSolicitantes();

}); // Fin de DOMContentLoaded