// public/js/panel-admin.js

/**
 * Función que maneja la carga dinámica de estilos según el rol.
 * Para el rol 'admin' (Panel de Gestión), asegura que solo 'panel-admin.css' esté activo.
 */
function manageStylesByRole() {
    // 1. Deshabilitar el estilo de superadmin (admin.css)
    const adminLink = document.querySelector('link[href="css/admin.css"]');
    if (adminLink) {
        adminLink.disabled = true;
    }

    // 2. Asegurar que el estilo de panel-admin.css esté habilitado
    const panelAdminLink = document.querySelector('link[href="css/panel-admin.css"]');
    if (panelAdminLink) {
        panelAdminLink.disabled = false;
    }
}


/**
 * Función de chequeo de rol para el Admin.
 * Se asegura de que solo el 'admin' pueda estar aquí.
 */
function checkPanelAdminRole() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    // Esta página es EXCLUSIVAMENTE para el rol 'admin'.
    if (!currentUser || currentUser.rol !== 'admin') {
        console.warn(`Acceso denegado: Rol '${currentUser ? currentUser.rol : 'null'}' no autorizado para 'panel-admin.html'. Redirigiendo...`);
        
        if (currentUser && currentUser.rol === 'superadmin') {
            window.location.replace('/admin.html');
        } else {
            window.location.replace('/dashboard.html');
        }
        return false;
    }
    
    return true;
}

// 1. Ejecutar la lógica de rol en PAGESHOW
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        checkPanelAdminRole();
    }
});

// 2. Ejecutar la lógica de rol en la carga normal
document.addEventListener('DOMContentLoaded', async () => {
    
    // ANTES de cargar los datos, gestionamos el CSS
    manageStylesByRole(); 
    
    // Corremos el chequeo de rol. Si falla, detenemos todo.
    if (!checkPanelAdminRole()) {
        return; 
    }

    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // ==========================================================
    // ==== LÓGICA DE VALIDACIÓN (RECREADA DE ANEXO1.JS) ====
    // ==========================================================
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
    
    // FUNCIONES DE FORMATO (RECREADAS)
    const isValidRFC = (rfc) => /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/.test(rfc.toUpperCase()) && rfc.length >= 12;
    const isValidCURP = (curp) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp.toUpperCase());
    // ==========================================================
    // ==== FIN LÓGICA DE VALIDACIÓN ====
    // ==========================================================


    // Elementos del DOM
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminGotoDashboardBtn = document.getElementById('admin-goto-dashboard-btn');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const tableBody = document.getElementById('solicitantes-table-body');
    const searchInput = document.getElementById('search-input');
    let allSolicitantes = []; 

    const adminInfoModal = document.getElementById('admin-info-modal');
    const adminInfoContent = document.getElementById('admin-info-content');
    const adminInfoModalTitle = adminInfoModal?.querySelector('h2'); 
    const adminInfoModalIcon = adminInfoModal?.querySelector('.modal-icon');
    const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
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
    const btnDownloadGeneralReport = document.getElementById('btn-download-general-report');


    // --- FUNCIÓN PARA MOSTRAR MODALES DE INFO ---
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        if (!adminInfoModal || !adminInfoModalTitle || !adminInfoContent || !adminInfoModalIcon || !closeAdminModalBtn) {
            console.error("Elementos del modal de información no encontrados.");
            alert(`${title}: ${content}`);
            return;
        }
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

    // --- OBTENER ID DEL ADMIN Y LÓGICA DEL MENÚ ---
    let adminSolicitanteId = null;
    try {
        const profileResponse = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (profileResponse.ok) {
            const adminProfile = await profileResponse.json();
            adminSolicitanteId = adminProfile.solicitante_id;
        }
    } catch (e) { console.error("No se pudo obtener el perfil del admin:", e); }

    if (adminEmailPlaceholder) { adminEmailPlaceholder.textContent = currentUser.email; }
    if (userMenuTrigger && userDropdown) { userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); }); }
    window.addEventListener('click', () => { if (userDropdown && userDropdown.classList.contains('active')) { userDropdown.classList.remove('active'); } });

    if (viewAdminInfoBtn && adminInfoModal && adminInfoContent) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                if(adminInfoModalTitle) adminInfoModalTitle.textContent = 'Información del Administrador';
                adminInfoContent.innerHTML = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre || 'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc || 'N/A'}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio || 'N/A'}</span></div>`;
                adminInfoModal.classList.add('visible');
            } catch (err) {
                showInfoModal('Error', err.message, false);
            }
        });
    }
    if (adminInfoModal) { adminInfoModal.addEventListener('click', (e) => { if (e.target === adminInfoModal) adminInfoModal.classList.remove('visible'); }); }
    if (closeAdminModalBtn) { closeAdminModalBtn.addEventListener('click', () => { if(adminInfoModal) adminInfoModal.classList.remove('visible'); }); }

    if (adminGotoDashboardBtn) {
        adminGotoDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Esta página es solo para 'admin', así que su dashboard es 'dashboard.html'
            window.location.href = 'dashboard.html';
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'home.html';
        });
    }

    // --- LÓGICA DE TABLA Y BUSCADOR ---
    const renderTabla = (solicitantes) => {
        if(!tableBody) return;
        tableBody.innerHTML = '';
        if (solicitantes.length === 0) { tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No se encontraron solicitantes.</td></tr>`; return; }

        solicitantes.forEach(sol => {
            const row = tableBody.insertRow();
            row.dataset.id = sol.solicitante_id;
            const nombreCompleto = [sol.nombre, sol.apellido_paterno, sol.apellido_materno].filter(Boolean).join(' ') || 'No registrado';
            
            // Lógica para deshabilitar botones (Admin)
            const isCurrentUser = (sol.solicitante_id === adminSolicitanteId);
            let deleteButtonDisabled = ''; // Habilitado por defecto
            let editButtonDisabled = '';

            // REGLA 1: Admin NO puede editar a un superadmin.
            if (sol.rol === 'superadmin') {
                editButtonDisabled = 'disabled';
            }

            // REGLA 2: Admin NO puede borrarse a sí mismo, ni a otro admin, ni a un superadmin.
            // Solo puede borrar a 'solicitante'.
            if (isCurrentUser || sol.rol === 'admin' || sol.rol === 'superadmin') {
                deleteButtonDisabled = 'disabled';
            }
            
            row.innerHTML = `
                <td>${nombreCompleto}</td>
                <td>${sol.rfc || 'N/A'}</td>
                <td>${sol.curp || 'N/A'}</td>
                <td>${sol.actividad || 'N/A'}</td>
                <td>
                    <button class="btn-icon btn-edit" title="Editar" data-id="${sol.solicitante_id}" ${editButtonDisabled}>
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

    const cargarSolicitantes = async () => {
        try {
            const response = await fetch('/api/admin/solicitantes', { headers: { 'Authorization': `Bearer ${authToken}` } });
             if (response.status === 403) { showInfoModal('Acceso Denegado', 'No tienes permisos.', false, () => window.location.href = 'dashboard.html'); return; }
            if (!response.ok) { throw new Error('No se pudieron cargar los solicitantes.'); }
            allSolicitantes = await response.json();

            // Deshabilita la opción de Cuentas (Usuarios) en las otras vistas
            const navCuentas = document.getElementById('nav-cuentas');
            if(navCuentas) navCuentas.style.display = 'none';

            renderTabla(allSolicitantes);
        } catch (error) {
            console.error("Error al cargar solicitantes:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
        }
    };

    if (searchInput) {
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

    // =======================================================
    // === VALIDACIÓN EN TIEMPO REAL DEL FORMULARIO DE EDICIÓN ===
    // =======================================================
    const setupEditFormValidation = () => {
        
        // Validar Nombre Completo (solo texto y límites)
        if (editNombreInput) {
            editNombreInput.setAttribute('maxlength', 150);
            editNombreInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if (e.target.value.trim().length > 0) showFeedback(e.target, 'Correcto.', true);
                else showFeedback(e.target, 'El nombre es obligatorio.', false);
            });
        }
        
        // Validar RFC
        if (editRfcInput) {
             editRfcInput.setAttribute('maxlength', 13);
             editRfcInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (e.target.value.length > 0 && !isValidRFC(e.target.value)) showFeedback(e.target, 'Formato de RFC incorrecto.', false);
                else if (e.target.value.length === 0) showFeedback(e.target, '', true);
                else showFeedback(e.target, 'RFC válido.', true);
            });
        }
        
        // Validar CURP
        if (editCurpInput) {
            editCurpInput.setAttribute('maxlength', 18);
            editCurpInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (e.target.value.length > 0 && !isValidCURP(e.target.value)) showFeedback(e.target, 'Formato de CURP incorrecto.', false);
                else if (e.target.value.length === 0) showFeedback(e.target, 'La CURP es obligatoria.', false);
                else showFeedback(e.target, 'CURP válido.', true);
            });
        }
    };
    setupEditFormValidation();
    // =======================================================
    // === FIN VALIDACIÓN EN TIEMPO REAL ===
    // =======================================================

    // --- MANEJO DE MODALES DE EDICIÓN Y ELIMINACIÓN ---
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

                // ---- Lógica Editar ----
                if (button.classList.contains('btn-edit')) {
                    try {
                        const response = await fetch(`/api/admin/solicitantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                        const data = await response.json();

                        if (editForm && editSolicitanteId && editModal) {
                             // Rellenar y disparar evento input para validación
                            const nombreCompleto = [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ');
                            editForm.elements.nombre.value = nombreCompleto;
                            editForm.elements.rfc.value = data.rfc || '';
                            editForm.elements.curp.value = data.curp || '';
                            editForm.elements.actividad.value = data.actividad || 'pesca';
                            // NOTA: Se comenta esta línea, ya que el modal de panel-admin.html NO tiene el selector 'edit-rol'
                            // editForm.elements.rol.value = data.rol || 'solicitante'; 
                            editSolicitanteId.value = data.solicitante_id;

                            // Disparar eventos input para activar la validación y mostrar el feedback
                            editNombreInput.dispatchEvent(new Event('input', { bubbles: true }));
                            editRfcInput.dispatchEvent(new Event('input', { bubbles: true }));
                            editCurpInput.dispatchEvent(new Event('input', { bubbles: true }));

                            editModal.classList.add('visible');
                        } else {
                            console.error("Elementos del modal de edición no encontrados.");
                        }
                    } catch(error) {
                        showInfoModal('Error', error.message, false);
                    }
                }
                // ---- Lógica Eliminar ----
                else if (button.classList.contains('btn-delete')) {
                    solicitanteIdToDelete = id;
                    const nombre = row.cells[0]?.textContent || 'Solicitante';
                    if (deleteConfirmMessage && deleteConfirmModal) {
                        deleteConfirmMessage.innerHTML = `¿Estás seguro de que deseas eliminar a <strong>${nombre}</strong>? Esta acción no se puede deshacer.`;
                        deleteConfirmModal.classList.add('visible');
                    }
                }
                // ---- LÓGICA DESCARGAR PDF ----
                else if (button.classList.contains('btn-download-pdf')) {
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    try {
                        const response = await fetch(`/api/admin/download-pdf/${id}`, { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!response.ok) { throw new Error('Falló la descarga del PDF.'); }
                        const contentDisposition = response.headers.get('content-disposition');
                        let filename = `Registro_REPA_${id}.pdf`;
                        if (contentDisposition) {
                            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                            if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
                        }
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = filename;
                        document.body.appendChild(a); a.click();
                        window.URL.revokeObjectURL(url); a.remove();
                    } catch (error) {
                        showInfoModal('Error de Descarga', `No se pudo descargar el PDF: ${error.message}`, false);
                    } finally {
                        button.disabled = false;
                        button.innerHTML = '<i class="fas fa-file-pdf"></i>';
                    }
                }
            } else { 
                 window.location.href = `detalle-solicitante.html?id=${id}`;
            }
        });
    }

    // --- LÓGICA PARA CONFIRMAR BORRADO ---
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!solicitanteIdToDelete) return;
            try {
                const response = await fetch(`/api/admin/solicitantes/${solicitanteIdToDelete}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${authToken}` } });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Error desconocido.');
                closeDeleteModal();
                showInfoModal('Éxito', result.message, true, () => { cargarSolicitantes(); });
            } catch (error) {
                showInfoModal('Error al Eliminar', error.message, false);
            } finally { solicitanteIdToDelete = null; }
        });
    }

    // --- LÓGICA PARA ENVIAR EDICIÓN (con chequeo de validación) ---
    if (editForm && editSolicitanteId) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // 1. Disparar validación final
            editForm.querySelectorAll('input').forEach(input => input.dispatchEvent(new Event('input', { bubbles: true })));
            
            // 2. Chequear errores
            const firstInvalidElement = editForm.querySelector('.invalid');
            if (firstInvalidElement) {
                showInfoModal('Formulario Incompleto', 'Por favor, revisa y corrige los campos marcados en rojo.', false);
                firstInvalidElement.focus();
                return;
            }

            const id = editSolicitanteId.value;
            if (!id) { showInfoModal('Error', 'ID de solicitante no encontrado.', false); return; }
            
             // El backend espera el nombre separado (nombre, apellido_paterno, apellido_materno)
             const nombreCompleto = editForm.elements.nombre.value.trim();
             const nombreParts = nombreCompleto.split(' ');
             const nombre_solo = nombreParts.shift() || '';
             const apellido_paterno = nombreParts.shift() || '';
             const apellido_materno = nombreParts.join(' ') || '';

            const data = {
                nombre: nombre_solo, 
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno,
                rfc: editForm.elements.rfc.value,
                curp: editForm.elements.curp.value,
                actividad: editForm.elements.actividad.value,
                // NO enviamos el rol, ya que el admin regular no puede cambiar roles
            };

            try {
                const response = await fetch(`/api/admin/solicitantes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify(data) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Error desconocido.');

                closeEditModal();
                showInfoModal('Éxito', result.message, true, () => { cargarSolicitantes(); });
            } catch (error) {
                console.error("Error en editForm.submit:", error);
                showInfoModal('Error al Actualizar', error.message, false);
            }
        });
    }

    // --- LÓGICA DEL REPORTE GENERAL ---
    if (btnDownloadGeneralReport) {
        btnDownloadGeneralReport.addEventListener('click', async () => {
            btnDownloadGeneralReport.disabled = true;
            btnDownloadGeneralReport.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
            try {
                const response = await fetch(`/api/admin/download-reporte-general`, { method: 'GET', headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!response.ok) { throw new Error('Falló la generación del reporte.'); }
                
                const contentDisposition = response.headers.get('content-disposition');
                let filename = 'Reporte_General_Solicitantes.pdf'; 
                if (contentDisposition) {
                    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                    if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.style.display = 'none'; a.href = url; a.download = filename;
                document.body.appendChild(a); a.click();
                window.URL.revokeObjectURL(url); a.remove();
            } catch (error) {
                showInfoModal('Error de Descarga', `No se pudo descargar el reporte: ${error.message}`, false);
            } finally {
                btnDownloadGeneralReport.disabled = false;
                btnDownloadGeneralReport.innerHTML = '<i class="fas fa-file-pdf"></i> Descargar Reporte General';
            }
        });
    }

    // --- CARGA INICIAL ---
    cargarSolicitantes();

}); // Fin de DOMContentLoaded