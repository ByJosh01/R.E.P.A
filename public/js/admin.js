// public/js/admin.js (Versión Final con todas las funciones)
document.addEventListener('DOMContentLoaded', async () => {
    // --- Verificaciones y Selectores Globales ---
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!authToken || !currentUser) {
        window.location.href = 'home.html';
        return;
    }

    // Elementos del DOM
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const tableBody = document.getElementById('solicitantes-table-body');
    const searchInput = document.getElementById('search-input');
    
    // Modales y sus controles
    const adminInfoModal = document.getElementById('admin-info-modal');
    const adminInfoContent = document.getElementById('admin-info-content');
    const adminInfoModalTitle = adminInfoModal.querySelector('h2');
    const adminInfoModalIcon = adminInfoModal.querySelector('.modal-icon');
    const closeAdminModalBtn = document.getElementById('close-admin-modal-btn');
    
    const resetDbBtn = document.getElementById('reset-db-btn');
    const resetModal = document.getElementById('reset-modal');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    const masterPasswordInput = document.getElementById('master-password-input');
    const resetErrorMessage = document.getElementById('reset-error-message');
    const resetModalTitle = resetModal.querySelector('h2');
    const resetModalMessage = resetModal.querySelector('p');
    const resetModalInputGroup = resetModal.querySelector('.input-group');

    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const deleteConfirmMessage = document.getElementById('delete-confirm-message');

    const editModal = document.getElementById('edit-solicitante-modal');
    const editForm = document.getElementById('edit-solicitante-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editSolicitanteId = document.getElementById('edit-solicitante-id');

    const backupDbBtn = document.getElementById('backup-db-btn');

    // =======================================================
    // === FUNCIÓN REUTILIZABLE PARA MODALES DE INFO/ERROR ===
    // =======================================================
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        adminInfoModalTitle.textContent = title;
        adminInfoContent.innerHTML = `<p style="text-align: center;">${content}</p>`;
        adminInfoModalIcon.className = 'modal-icon fas';
        adminInfoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        adminInfoModal.classList.add('visible');

        // Este listener 'once: true' es para acciones (como recargar la página)
        // y se ejecuta *además* del listener general de cierre.
        const confirmHandler = () => {
            adminInfoModal.classList.remove('visible');
            if (onConfirm) onConfirm();
            closeAdminModalBtn.removeEventListener('click', confirmHandler);
        };
        closeAdminModalBtn.addEventListener('click', confirmHandler, { once: true });
    };
    
    // =======================================================
    // === OBTENER ID DEL ADMIN Y LÓGICA DEL MENÚ ===
    // =======================================================
    let superAdminSolicitanteId = null;
    try {
        const profileResponse = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (profileResponse.ok) {
            const adminProfile = await profileResponse.json();
            superAdminSolicitanteId = adminProfile.solicitante_id;
        }
    } catch (e) {
        console.error("No se pudo obtener el perfil del superadmin:", e);
    }

    if (adminEmailPlaceholder) { adminEmailPlaceholder.textContent = currentUser.email; }
    if (userMenuTrigger) { userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); }); }
    window.addEventListener('click', () => { if (userDropdown && userDropdown.classList.contains('active')) { userDropdown.classList.remove('active'); } });
    
    // Listener para "Ver Información"
    if (viewAdminInfoBtn) { 
        viewAdminInfoBtn.addEventListener('click', async (e) => { 
            e.preventDefault(); 
            try { 
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } }); 
                if (!r.ok) throw new Error('No se pudo obtener la info.'); 
                const p = await r.json(); 
                adminInfoModalTitle.textContent = 'Información del Superadministrador'; 
                adminInfoContent.innerHTML = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre||'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc||'N/A'}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio||'N/A'}</span></div>`; 
                adminInfoModal.classList.add('visible'); 
            } catch (err) { 
                showInfoModal('Error', err.message, false); 
            } 
        }); 
    }
    
    // Listener para cerrar el modal si se hace clic fuera de él
    if (adminInfoModal) { 
        adminInfoModal.addEventListener('click', (e) => { 
            if (e.target === adminInfoModal) adminInfoModal.classList.remove('visible'); 
        }); 
    }

    // --- INICIO DE LA CORRECCIÓN ---
    // Listener general para el botón "CERRAR" del modal de información.
    // Esto soluciona el problema cuando se abre desde "Ver Información".
    if (closeAdminModalBtn) {
        closeAdminModalBtn.addEventListener('click', () => {
            adminInfoModal.classList.remove('visible');
        });
    }
    // --- FIN DE LA CORRECCIÓN ---

    // Listener para Cerrar Sesión
    if(adminLogoutBtn) { 
        adminLogoutBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            localStorage.removeItem('authToken'); 
            sessionStorage.removeItem('currentUser'); 
            window.location.href = 'home.html'; 
        }); 
    }

    // =======================================================
    // === LÓGICA PARA CARGAR LA TABLA Y BUSCADOR ===
    // =======================================================
    try { 
        const r = await fetch('/api/admin/solicitantes', { headers: { 'Authorization': `Bearer ${authToken}` } }); 
        if (r.status === 403) { showInfoModal('Acceso Denegado', 'No tienes permisos.', false, () => window.location.href = 'dashboard.html'); return; } 
        if (!r.ok) throw new Error('No se pudieron cargar datos.'); 
        
        const solicitantes = await r.json(); 
        tableBody.innerHTML = ''; 
        
        if (solicitantes.length === 0) { 
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay solicitantes.</td></tr>'; 
        } else { 
            solicitantes.forEach(sol => { 
                const row = tableBody.insertRow(); 
                row.dataset.id = sol.solicitante_id; 

                const isCurrentUser = (sol.solicitante_id === superAdminSolicitanteId);
                const deleteButtonDisabled = isCurrentUser ? 'disabled' : '';

                row.innerHTML = `
                    <td>${sol.nombre||'N/A'}</td>
                    <td>${sol.rfc||'N/A'}</td>
                    <td>${sol.curp||'N/A'}</td>
                    <td>${sol.actividad||'N/A'}</td>
                    <td>
                        <button class="btn-icon btn-edit" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-icon btn-delete" title="Eliminar" ${deleteButtonDisabled}><i class="fas fa-trash-alt"></i></button>
                    </td>`; 
            }); 
        } 
    } catch (err) { 
        console.error(err); 
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error: ${err.message}</td></tr>`; 
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const nombre = row.cells[0].textContent.toLowerCase();
                const rfc = row.cells[1].textContent.toLowerCase();
                const curp = row.cells[2].textContent.toLowerCase();
                if (nombre.includes(searchTerm) || rfc.includes(searchTerm) || curp.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }

    // =======================================================
    // === LÓGICA PARA ACCIONES DE LA TABLA (EDITAR, ELIMINAR, NAVEGAR) ===
    // =======================================================
    let solicitanteIdToDelete = null;
    const closeDeleteModal = () => deleteConfirmModal.classList.remove('visible');
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    deleteConfirmModal.addEventListener('click', (e) => { if (e.target === deleteConfirmModal) closeDeleteModal(); });
    
    const closeEditModal = () => editModal.classList.remove('visible');
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    tableBody.addEventListener('click', async (e) => { 
        const button = e.target.closest('button.btn-icon');
        const row = e.target.closest('tr');
        if (!row) return;

        const id = row.dataset.id;
        
        if (button) {
            const nombre = row.cells[0].textContent;
            if (button.classList.contains('btn-edit')) { 
                try {
                    const response = await fetch(`/api/admin/solicitantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                    if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                    const data = await response.json();
                    
                    editForm.elements.nombre.value = data.nombre || '';
                    editForm.elements.rfc.value = data.rfc || '';
                    editForm.elements.curp.value = data.curp || '';
                    editForm.elements.actividad.value = data.actividad || 'pesca';
                    editForm.elements.rol.value = data.rol || 'solicitante';
                    editSolicitanteId.value = data.solicitante_id;
                    
                    editModal.classList.add('visible');
                } catch(error) {
                    showInfoModal('Error', error.message, false);
                }
            } 
            if (button.classList.contains('btn-delete')) {
                solicitanteIdToDelete = id;
                deleteConfirmMessage.innerHTML = `¿Estás seguro de que deseas eliminar a <strong>${nombre}</strong>? Esta acción no se puede deshacer.`;
                deleteConfirmModal.classList.add('visible');
            } 
        } else {
            console.log(`Navegando a los detalles del solicitante con ID: ${id}`);
            window.location.href = `detalle-solicitante.html?id=${id}`;
        }
    });

    // --- LÓGICA PARA CONFIRMAR BORRADO ---
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!solicitanteIdToDelete) return; 

        try {
            const response = await fetch(`/api/admin/solicitantes/${solicitanteIdToDelete}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${authToken}` 
                }
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error desconocido del servidor.');
            }

            closeDeleteModal(); 
            
            showInfoModal('Éxito', result.message, true, () => {
                window.location.reload(); 
            });

        } catch (error) {
            console.error("Error en confirmDeleteBtn:", error);
            showInfoModal('Error al Eliminar', error.message, false);
        }
    });
    
    // --- LÓGICA PARA ENVIAR EDICIÓN ---
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const id = editSolicitanteId.value; 
        
        const data = {
            nombre: editForm.elements.nombre.value,
            rfc: editForm.elements.rfc.value,
            curp: editForm.elements.curp.value,
            actividad: editForm.elements.actividad.value,
            rol: editForm.elements.rol.value
        };

        try {
            const response = await fetch(`/api/admin/solicitantes/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(data) 
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error desconocido del servidor.');
            }

            closeEditModal(); 
            
            showInfoModal('Éxito', result.message, true, () => {
                window.location.reload();
            });

        } catch (error) {
            console.error("Error en editForm.submit:", error);
            showInfoModal('Error al Actualizar', error.message, false);
        }
    });


    // =======================================================
    // === LÓGICA PARA ZONA DE PELIGRO (RESPALDO Y RESETEO) ===
    // =======================================================

    // --- Lógica para el botón de Respaldo ---
    if (backupDbBtn) {
        backupDbBtn.addEventListener('click', async () => {
            showInfoModal('Procesando...', 'Generando el respaldo de la base de datos. La descarga comenzará en un momento.', true);

            try {
                const response = await fetch('/api/admin/backup-database', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (!response.ok) {
                    throw new Error('Falló la generación del respaldo en el servidor.');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;

                const contentDisposition = response.headers.get('content-disposition');
                let fileName = 'repa_backup.sql';
                if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(contentDisposition);
                    if (matches != null && matches[1]) {
                        fileName = matches[1].replace(/['"]/g, '');
                    }
                }
                a.download = fileName;

                document.body.appendChild(a);
                a.click();
                
                window.URL.revokeObjectURL(url);
                a.remove();

            } catch (error) {
                console.error("Error al descargar el respaldo:", error);
                showInfoModal('Error', error.message, false);
            }
        });
    }

    // --- Lógica para el botón de Reseteo ---
    if (resetModal && resetDbBtn) {
        let resetStep = 'password';
        let enteredPassword = '';
        const resetModalToStep1 = () => { resetStep = 'password'; resetModalTitle.textContent = 'Confirmación Requerida'; resetModalMessage.textContent = 'Para proceder, ingrese la contraseña maestra.'; masterPasswordInput.value = ''; resetErrorMessage.textContent = ''; resetModalInputGroup.style.display = 'block'; confirmResetBtn.textContent = 'Confirmar y Proceder'; };
        resetDbBtn.addEventListener('click', () => { resetModalToStep1(); resetModal.classList.add('visible'); });
        const closeResetModal = () => resetModal.classList.remove('visible');
        cancelResetBtn.addEventListener('click', closeResetModal);
        resetModal.addEventListener('click', (e) => { if (e.target === resetModal) closeResetModal(); });
        confirmResetBtn.addEventListener('click', async () => {
            if (resetStep === 'password') {
                enteredPassword = masterPasswordInput.value;
                if (!enteredPassword) { resetErrorMessage.textContent = 'El campo no puede estar vacío.'; return; }
                resetStep = 'final_confirm';
                resetModalTitle.textContent = 'ADVERTENCIA FINAL';
                resetModalMessage.innerHTML = '¿Estás <strong>COMPLETAMENTE SEGURO</strong> de que quieres borrar TODOS los datos? <br>Esta acción no se puede deshacer.';
                resetModalInputGroup.style.display = 'none';
                confirmResetBtn.textContent = 'Sí, Borrar Todo';
            } else if (resetStep === 'final_confirm') {
                closeResetModal();
                try {
                    const response = await fetch('/api/admin/reset-database', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }, body: JSON.stringify({ masterPassword: enteredPassword }) });
                    const result = await response.json();
                    if (!response.ok) { throw new Error(result.message); }
                    showInfoModal('Éxito', result.message, true, () => { window.location.reload(); });
                } catch (error) {
                    console.error("Error en el reseteo:", error);
                    showInfoModal('Error en el Reseteo', error.message, false);
                }
            }
        });
    }
});