// public/js/panel-admin.js
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
    let allSolicitantes = []; // Para guardar los datos originales para filtrar

    // Modales y sus controles
    const adminInfoModal = document.getElementById('admin-info-modal');
    const adminInfoContent = document.getElementById('admin-info-content');
    const adminInfoModalTitle = adminInfoModal?.querySelector('h2'); // Usar '?' por si no existe
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

    // =======================================================
    // === FUNCIÓN REUTILIZABLE PARA MODALES DE INFO/ERROR ===
    // =======================================================
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        // Asegurarse de que los elementos existen antes de usarlos
        if (!adminInfoModal || !adminInfoModalTitle || !adminInfoContent || !adminInfoModalIcon || !closeAdminModalBtn) {
            console.error("Elementos del modal de información no encontrados.");
            alert(`${title}: ${content}`); // Fallback a alert simple
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
            // No intentar remover el listener si el botón no existe
            if(closeAdminModalBtn) closeAdminModalBtn.removeEventListener('click', confirmHandler);
        };
        // No añadir listener si el botón no existe
        if(closeAdminModalBtn) closeAdminModalBtn.addEventListener('click', confirmHandler, { once: true });
    };

    // =======================================================
    // === OBTENER ID DEL ADMIN Y LÓGICA DEL MENÚ ===
    // =======================================================
    let adminSolicitanteId = null;
    try {
        const profileResponse = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (profileResponse.ok) {
            const adminProfile = await profileResponse.json();
            adminSolicitanteId = adminProfile.solicitante_id;
        }
    } catch (e) {
        console.error("No se pudo obtener el perfil del admin:", e);
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
                if(adminInfoModalTitle) adminInfoModalTitle.textContent = 'Información del Administrador';
                adminInfoContent.innerHTML = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre || 'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc || 'N/A'}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio || 'N/A'}</span></div>`;
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

    if (adminLogoutBtn) {
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

    // --- FUNCIÓN PARA CARGAR Y MOSTRAR SOLICITANTES ---
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
            renderTabla(allSolicitantes); // Llama a la función que dibuja la tabla

        } catch (error) {
            console.error("Error al cargar solicitantes:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">Error al cargar datos.</td></tr>`;
        }
    };

    // --- FUNCIÓN PARA RENDERIZAR LA TABLA (AHORA CON PDF) ---
    const renderTabla = (solicitantes) => {
        if(!tableBody) return; // Salir si la tabla no existe
        tableBody.innerHTML = ''; // Limpia la tabla

        if (solicitantes.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No se encontraron solicitantes.</td></tr>`;
            return;
        }

        solicitantes.forEach(sol => {
            const row = tableBody.insertRow();
            row.dataset.id = sol.solicitante_id; // Guardamos el ID en la fila

            // Formatear nombre completo
            const nombreCompleto = [sol.nombre, sol.apellido_paterno, sol.apellido_materno].filter(Boolean).join(' ') || 'No registrado';

            // --- Lógica para deshabilitar botones ---
            let deleteButtonDisabled = '';
            let editButtonDisabled = '';
            const isCurrentUser = (sol.solicitante_id === adminSolicitanteId);

            if ((currentUser.rol === 'admin' && sol.rol === 'superadmin') || isCurrentUser) {
                deleteButtonDisabled = 'disabled';
            }
            if (currentUser.rol === 'admin' && sol.rol === 'superadmin') {
                editButtonDisabled = 'disabled';
            }
            // --- Fin lógica deshabilitar ---

            // Añadimos 6 celdas ahora
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

    // --- LÓGICA DE BÚSQUEDA ---
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
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
    // === LÓGICA PARA ACCIONES DE LA TABLA (EDITAR, ELIMINAR, DESCARGAR) ===
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
            const button = e.target.closest('button.btn-icon'); // Busca el botón clickeado
            const row = e.target.closest('tr'); // Busca la fila
            if (!button || !row || !row.dataset.id) { // Si no es un botón o no hay ID, salimos
                 // Si no es un botón, pero sí es una fila, navega a detalles
                 if (row && row.dataset.id && !e.target.closest('button')) {
                    const id = row.dataset.id;
                    console.log(`Navegando a los detalles del solicitante con ID: ${id}`);
                    window.location.href = `detalle-solicitante.html?id=${id}`;
                 }
                 return; // Salir si no se hizo clic en un botón válido o fila con ID
            }


            const id = row.dataset.id; // Obtenemos el ID desde la fila (data-id)

            // Prevenir acción si el botón está deshabilitado
            if (button.disabled) return;

            // ---- Lógica para Editar ----
            if (button.classList.contains('btn-edit')) {
                try {
                    const response = await fetch(`/api/admin/solicitantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                    if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                    const data = await response.json();

                    if (editForm && editSolicitanteId && editModal) {
                        editForm.elements.nombre.value = [data.nombre, data.apellido_paterno, data.apellido_materno].filter(Boolean).join(' '); // Nombre completo
                        editForm.elements.rfc.value = data.rfc || '';
                        editForm.elements.curp.value = data.curp || '';
                        editForm.elements.actividad.value = data.actividad || 'pesca';
                        editSolicitanteId.value = data.solicitante_id; // Guardamos el ID en el hidden input
                        editModal.classList.add('visible');
                    } else {
                        console.error("Elementos del modal de edición no encontrados.");
                    }
                } catch (error) {
                    showInfoModal('Error', error.message, false);
                }
            }
            // ---- Lógica para Eliminar ----
            else if (button.classList.contains('btn-delete')) {
                solicitanteIdToDelete = id;
                const nombre = row.cells[0] ? row.cells[0].textContent : 'Solicitante';
                if (deleteConfirmMessage && deleteConfirmModal) {
                    deleteConfirmMessage.innerHTML = `¿Estás seguro de que deseas eliminar a <strong>${nombre}</strong>? Esta acción no se puede deshacer.`;
                    deleteConfirmModal.classList.add('visible');
                } else {
                     console.error("Elementos del modal de eliminación no encontrados.");
                }
            }

            // ---- ▼▼▼ NUEVA LÓGICA PARA DESCARGAR PDF ▼▼▼ ----
            else if (button.classList.contains('btn-download-pdf')) {
                console.log('Descargar PDF para solicitante ID:', id);
                button.disabled = true; // Deshabilita mientras descarga
                button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Icono de carga

                try {
                    const response = await fetch(`/api/admin/download-pdf/${id}`, { // Usa el ID de la fila
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });

                    if (!response.ok) {
                        let errorMsg = `Error ${response.status}: ${response.statusText}`;
                        try {
                            const errorData = await response.json();
                            errorMsg = errorData.message || errorMsg;
                        } catch (jsonError) { /* Ignorar si no es JSON */ }
                        throw new Error(errorMsg);
                    }

                    const contentDisposition = response.headers.get('content-disposition');
                    let filename = `Registro_REPA_${id}.pdf`; // Nombre por defecto
                    if (contentDisposition) {
                        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                        if (filenameMatch && filenameMatch.length > 1) {
                            filename = filenameMatch[1];
                        }
                    }

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();

                } catch (error) {
                    console.error("Error al descargar PDF:", error);
                    showInfoModal('Error de Descarga', `No se pudo descargar el PDF: ${error.message}`, false);
                } finally {
                    // Restaura el botón
                    button.disabled = false;
                    button.innerHTML = '<i class="fas fa-file-pdf"></i>';
                }
            }
            // ---- ▲▲▲ FIN NUEVA LÓGICA PDF ▲▲▲ ----
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
                    cargarSolicitantes(); // Recargar la tabla en lugar de toda la página
                    // window.location.reload(); // Alternativa si prefieres recargar todo
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
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = editSolicitanteId.value; // Obtener ID del input hidden
            if (!id) {
                showInfoModal('Error', 'ID de solicitante no encontrado.', false);
                return;
            }

            const data = {
                 // Para el nombre, necesitamos separar nombre y apellidos si los guardas así
                 // Esto es un ejemplo, ajusta según cómo guardes el nombre en tu BD
                 // Quizás solo necesites enviar un campo 'nombre_completo' o mantenerlos separados
                nombre: editForm.elements.nombre.value, // Asumiendo que es nombre completo
                rfc: editForm.elements.rfc.value,
                curp: editForm.elements.curp.value,
                actividad: editForm.elements.actividad.value
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
                   // window.location.reload();
                });

            } catch (error) {
                console.error("Error en editForm.submit:", error);
                showInfoModal('Error al Actualizar', error.message, false);
            }
        });
    }

    // --- CARGA INICIAL ---
    cargarSolicitantes();

}); // Fin de DOMContentLoaded