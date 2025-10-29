// public/js/admin.js (Versión Final con todas las funciones y botón PDF)
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
    let allSolicitantes = []; // Para guardar datos originales

    // Modales y sus controles
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

    const backupDbBtn = document.getElementById('backup-db-btn');

    // =======================================================
    // === FUNCIÓN REUTILIZABLE PARA MODALES DE INFO/ERROR ===
    // =======================================================
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

    // =======================================================
    // === OBTENER ID DEL ADMIN Y LÓGICA DEL MENÚ ===
    // =======================================================
    let superAdminSolicitanteId = null; // Renombrado para claridad
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
    if (userMenuTrigger && userDropdown) {
        userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); });
    }
    window.addEventListener('click', () => { if (userDropdown && userDropdown.classList.contains('active')) { userDropdown.classList.remove('active'); } });

    if (viewAdminInfoBtn && adminInfoModal && adminInfoContent) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                if(adminInfoModalTitle) adminInfoModalTitle.textContent = 'Información del Superadministrador';
                adminInfoContent.innerHTML = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre||'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc||'N/A'}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio||'N/A'}</span></div>`;
                adminInfoModal.classList.add('visible');
            } catch (err) {
                showInfoModal('Error', err.message, false);
            }
        });
    }

    if (adminInfoModal) {
        adminInfoModal.addEventListener('click', (e) => {
            if (e.target === adminInfoModal) adminInfoModal.classList.remove('visible');
        });
    }

    if (closeAdminModalBtn) {
        closeAdminModalBtn.addEventListener('click', () => {
            if(adminInfoModal) adminInfoModal.classList.remove('visible');
        });
    }

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

    // --- FUNCIÓN PARA RENDERIZAR LA TABLA (CON PDF) ---
    const renderTabla = (solicitantes) => {
        if(!tableBody) return;
        tableBody.innerHTML = '';

        if (solicitantes.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No hay solicitantes.</td></tr>`;
            return;
        }

        solicitantes.forEach(sol => {
            const row = tableBody.insertRow();
            row.dataset.id = sol.solicitante_id;

            const nombreCompleto = [sol.nombre, sol.apellido_paterno, sol.apellido_materno].filter(Boolean).join(' ') || 'No registrado';

            // --- Lógica para deshabilitar botones (Superadmin puede todo menos borrarse a sí mismo) ---
            let deleteButtonDisabled = '';
            const isCurrentUser = (sol.solicitante_id === superAdminSolicitanteId);

            if (isCurrentUser) {
                deleteButtonDisabled = 'disabled';
            }
            // --- Fin lógica deshabilitar ---

            // Añadimos 6 celdas
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
                <td> <button class="btn-icon btn-download-pdf" data-id="${sol.solicitante_id}" title="Descargar PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </td>
            `;
        });
    };

    // --- FUNCIÓN PARA CARGAR SOLICITANTES ---
    const cargarSolicitantes = async () => {
        try {
            const response = await fetch('/api/admin/solicitantes', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
             if (response.status === 403) { showInfoModal('Acceso Denegado', 'No tienes permisos.', false, () => window.location.href = 'dashboard.html'); return; }
            if (!response.ok) {
                throw new Error('No se pudieron cargar los solicitantes.');
            }
            allSolicitantes = await response.json();
            renderTabla(allSolicitantes);
        } catch (error) {
            console.error("Error al cargar solicitantes:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
        }
    };


    // --- LÓGICA DE BÚSQUEDA ---
    if (searchInput && tableBody) { // Asegurarse que tableBody existe
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            // Filtrar desde los datos originales en memoria
            const filteredSolicitantes = allSolicitantes.filter(s => {
                const nombreCompleto = [s.nombre, s.apellido_paterno, s.apellido_materno].filter(Boolean).join(' ').toLowerCase();
                const rfc = (s.rfc || '').toLowerCase();
                const curp = (s.curp || '').toLowerCase();
                return nombreCompleto.includes(searchTerm) || rfc.includes(searchTerm) || curp.includes(searchTerm);
            });
            renderTabla(filteredSolicitantes); // Re-renderiza con los datos filtrados
        });
    }


    // =======================================================
    // === LÓGICA PARA ACCIONES DE LA TABLA (EDITAR, ELIMINAR, DESCARGAR, NAVEGAR) ===
    // =======================================================
    let solicitanteIdToDelete = null;
    const closeDeleteModal = () => { if (deleteConfirmModal) deleteConfirmModal.classList.remove('visible'); };
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteConfirmModal) deleteConfirmModal.addEventListener('click', (e) => { if (e.target === deleteConfirmModal) closeDeleteModal(); });

    const closeEditModal = () => { if (editModal) editModal.classList.remove('visible'); };
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const button = e.target.closest('button.btn-icon');
            const row = e.target.closest('tr');
            if (!row || !row.dataset.id) { // Si no hay fila o ID, no hacemos nada
                 return;
            }

            const id = row.dataset.id; // ID del solicitante de la fila

            // Si se hizo clic en un botón dentro de la fila
            if (button) {
                 if (button.disabled) return; // Salir si el botón está deshabilitado

                // ---- Lógica Editar ----
                if (button.classList.contains('btn-edit')) {
                    try {
                        const response = await fetch(`/api/admin/solicitantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                        const data = await response.json();

                        if (editForm && editSolicitanteId && editModal) {
                             // Asignar nombre completo al campo 'nombre' del formulario de edición
                            editForm.elements.nombre.value = [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' ');
                            editForm.elements.rfc.value = data.rfc || '';
                            editForm.elements.curp.value = data.curp || '';
                            editForm.elements.actividad.value = data.actividad || 'pesca';
                            editForm.elements.rol.value = data.rol || 'solicitante'; // Asignar el rol
                            editSolicitanteId.value = data.solicitante_id; // Guardamos el ID en el hidden input

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
                    const nombre = row.cells[0]?.textContent || 'Solicitante'; // Usar '?' por seguridad
                    if (deleteConfirmMessage && deleteConfirmModal) {
                        deleteConfirmMessage.innerHTML = `¿Estás seguro de que deseas eliminar a <strong>${nombre}</strong>? Esta acción no se puede deshacer.`;
                        deleteConfirmModal.classList.add('visible');
                    } else {
                         console.error("Elementos del modal de eliminación no encontrados.");
                    }
                }
                // ---- LÓGICA DESCARGAR PDF ----
                else if (button.classList.contains('btn-download-pdf')) {
                    console.log('Descargar PDF para solicitante ID:', id);
                    button.disabled = true;
                    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                    try {
                        const response = await fetch(`/api/admin/download-pdf/${id}`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${authToken}` }
                        });

                        if (!response.ok) {
                            let errorMsg = `Error ${response.status}: ${response.statusText}`;
                            try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (jsonError) {}
                            throw new Error(errorMsg);
                        }

                        const contentDisposition = response.headers.get('content-disposition');
                        let filename = `Registro_REPA_${id}.pdf`;
                        if (contentDisposition) {
                            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                            if (filenameMatch && filenameMatch.length > 1) filename = filenameMatch[1];
                        }

                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.style.display = 'none'; a.href = url; a.download = filename;
                        document.body.appendChild(a); a.click();
                        window.URL.revokeObjectURL(url); a.remove();

                    } catch (error) {
                        console.error("Error al descargar PDF:", error);
                        showInfoModal('Error de Descarga', `No se pudo descargar el PDF: ${error.message}`, false);
                    } finally {
                        button.disabled = false;
                        button.innerHTML = '<i class="fas fa-file-pdf"></i>';
                    }
                }
                 // ---- FIN LÓGICA PDF ----

            } else { // Si se hizo clic en la fila pero NO en un botón
                 console.log(`Navegando a los detalles del solicitante con ID: ${id}`);
                 window.location.href = `detalle-solicitante.html?id=${id}`;
            }
        });
    }


    // --- LÓGICA PARA CONFIRMAR BORRADO ---
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!solicitanteIdToDelete) return;

            try {
                const response = await fetch(`/api/admin/solicitantes/${solicitanteIdToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Error desconocido.');

                closeDeleteModal();
                showInfoModal('Éxito', result.message, true, () => {
                    cargarSolicitantes(); // Recargar la tabla
                });

            } catch (error) {
                console.error("Error en confirmDeleteBtn:", error);
                showInfoModal('Error al Eliminar', error.message, false);
            } finally {
                solicitanteIdToDelete = null;
            }
        });
    }

    // --- LÓGICA PARA ENVIAR EDICIÓN ---
    if (editForm && editSolicitanteId) { // Asegurarse que existen
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = editSolicitanteId.value;
            if (!id) {
                showInfoModal('Error', 'ID de solicitante no encontrado.', false);
                return;
            }

            // Separar nombre completo en partes (ajusta si es necesario)
             const nombreCompleto = editForm.elements.nombre.value.trim();
             const nombreParts = nombreCompleto.split(' ');
             const nombre_solo = nombreParts.shift() || '';
             const apellido_paterno = nombreParts.shift() || '';
             const apellido_materno = nombreParts.join(' ') || '';

            const data = {
                nombre: nombre_solo, // Enviar nombre separado si tu backend lo espera así
                apellido_paterno: apellido_paterno,
                apellido_materno: apellido_materno,
                // O si tu backend espera nombre completo: nombre: nombreCompleto,
                rfc: editForm.elements.rfc.value,
                curp: editForm.elements.curp.value,
                actividad: editForm.elements.actividad.value,
                rol: editForm.elements.rol.value // Enviar el rol
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
                if (!response.ok) throw new Error(result.message || 'Error desconocido.');

                closeEditModal();
                showInfoModal('Éxito', result.message, true, () => {
                   cargarSolicitantes(); // Recargar tabla
                });

            } catch (error) {
                console.error("Error en editForm.submit:", error);
                showInfoModal('Error al Actualizar', error.message, false);
            }
        });
    }


    // =======================================================
    // === LÓGICA PARA ZONA DE PELIGRO (RESPALDO Y RESETEO) ===
    // =======================================================

    // --- Lógica para el botón de Respaldo ---
    if (backupDbBtn) {
        backupDbBtn.addEventListener('click', async () => {
            showInfoModal('Procesando...', 'Generando el respaldo de la base de datos...', true);

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
                 // Cierra el modal de "Procesando" después de iniciar la descarga
                 if (adminInfoModal) adminInfoModal.classList.remove('visible');

            } catch (error) {
                console.error("Error al descargar el respaldo:", error);
                showInfoModal('Error', `No se pudo descargar el respaldo: ${error.message}`, false);
            }
        });
    }

    // --- Lógica para el botón de Reseteo ---
    if (resetModal && resetDbBtn && cancelResetBtn && confirmResetBtn && masterPasswordInput && resetErrorMessage && resetModalTitle && resetModalMessage && resetModalInputGroup) {
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

    // --- CARGA INICIAL DE LA TABLA ---
    cargarSolicitantes();

}); // Fin de DOMContentLoaded