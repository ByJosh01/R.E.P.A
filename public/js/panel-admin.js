// public/js/panel-admin.js
// Versión simplificada de admin.js para el rol 'admin' (CORREGIDA y con botones deshabilitados)
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
        adminInfoModalTitle.textContent = title;
        adminInfoContent.innerHTML = `<p style="text-align: center;">${content}</p>`;
        adminInfoModalIcon.className = 'modal-icon fas';
        adminInfoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        adminInfoModal.classList.add('visible');

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
    if (userMenuTrigger) { userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); }); }
    window.addEventListener('click', () => { if (userDropdown && userDropdown.classList.contains('active')) { userDropdown.classList.remove('active'); } });

    if (viewAdminInfoBtn) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                adminInfoModalTitle.textContent = 'Información del Administrador';
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
            adminInfoModal.classList.remove('visible');
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

                // --- Lógica para deshabilitar botones ---
                let deleteButtonDisabled = '';
                let editButtonDisabled = '';
                const isCurrentUser = (sol.solicitante_id === adminSolicitanteId); // ¿Es el usuario actual?

                // Deshabilitar si:
                // 1. El usuario actual es 'admin' Y la fila es de un 'superadmin'
                // O 2. Si la fila corresponde al usuario logueado actualmente
                if ((currentUser.rol === 'admin' && sol.rol === 'superadmin') || isCurrentUser) {
                    deleteButtonDisabled = 'disabled';
                }
                // Deshabilitar solo edición si el usuario actual es 'admin' Y la fila es de un 'superadmin'
                if (currentUser.rol === 'admin' && sol.rol === 'superadmin') {
                    editButtonDisabled = 'disabled';
                }
                // --- Fin lógica deshabilitar ---

                row.innerHTML = `
                    <td>${sol.nombre || 'N/A'}</td>
                    <td>${sol.rfc || 'N/A'}</td>
                    <td>${sol.curp || 'N/A'}</td>
                    <td>${sol.actividad || 'N/A'}</td>
                    <td>
                        <button class="btn-icon btn-edit" title="Editar" ${editButtonDisabled}><i class="fas fa-pencil-alt"></i></button>
                        <button class="btn-icon btn-delete" title="Eliminar" ${deleteButtonDisabled}><i class="fas fa-trash-alt"></i></button>
                    </td>`;
            });
        }
    } catch (err) {
        console.error("Error al cargar solicitantes:", err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">Error al cargar datos: ${err.message}</td></tr>`;
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = tableBody.querySelectorAll('tr');
            rows.forEach(row => {
                const nombre = row.cells[0] ? row.cells[0].textContent.toLowerCase() : '';
                const rfc = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
                const curp = row.cells[2] ? row.cells[2].textContent.toLowerCase() : '';
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
            if (!row || !row.dataset.id) return;

            const id = row.dataset.id;

            if (button) {
                // Prevenir acción si el botón está deshabilitado
                if (button.disabled) return; 

                const nombre = row.cells[0] ? row.cells[0].textContent : 'Solicitante';
                if (button.classList.contains('btn-edit')) {
                    try {
                        const response = await fetch(`/api/admin/solicitantes/${id}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                        const data = await response.json();

                        editForm.elements.nombre.value = data.nombre || '';
                        editForm.elements.rfc.value = data.rfc || '';
                        editForm.elements.curp.value = data.curp || '';
                        editForm.elements.actividad.value = data.actividad || 'pesca';
                        editSolicitanteId.value = data.solicitante_id;

                        editModal.classList.add('visible');
                    } catch (error) {
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
                    window.location.reload();
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

            const id = editSolicitanteId.value;
            if (!id) {
                showInfoModal('Error', 'ID de solicitante no encontrado.', false);
                return;
            }

            const data = {
                nombre: editForm.elements.nombre.value,
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
                    window.location.reload();
                });

            } catch (error) {
                console.error("Error en editForm.submit:", error);
                showInfoModal('Error al Actualizar', error.message, false);
            }
        });
    }
});