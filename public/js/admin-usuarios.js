// public/js/admin-usuarios.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Verificaciones y Selectores Globales ---
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!authToken || !currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin')) {
        window.location.href = 'home.html';
        return;
    }

    // ==========================================================
    // ==== LÓGICA DE VALIDACIÓN (EXTRAÍDA DE ANEXOS) ====
    // ==========================================================
    const showFeedback = (inputElement, message, isValid) => {
        let feedbackElement = inputElement.nextElementSibling;
        while (feedbackElement && !feedbackElement.classList.contains('feedback-message')) {
            feedbackElement = feedbackElement.nextElementSibling;
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
    const isValidCURP = (curp) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp.toUpperCase());
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    // ==========================================================
    // ==== FIN LÓGICA DE VALIDACIÓN ====
    // ==========================================================

    // Elementos del DOM
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const tableBody = document.getElementById('usuarios-table-body');
    const searchInput = document.getElementById('search-input');
    let allUsuarios = []; // Para guardar datos originales

    // Modales de Info/Error
    const infoModal = document.getElementById('admin-info-modal');
    const infoModalTitle = document.getElementById('admin-info-title');
    const infoModalContent = document.getElementById('admin-info-content');
    const infoModalIcon = document.getElementById('admin-info-icon');
    const closeInfoModalBtn = document.getElementById('close-admin-info-btn');

    // Modales de Logout
    const logoutModal = document.getElementById('logout-modal');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

    // Modales de Edición
    const editModal = document.getElementById('edit-usuario-modal');
    const editForm = document.getElementById('edit-usuario-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editUsuarioId = document.getElementById('edit-usuario-id');
    const editEmailInput = document.getElementById('edit-email');
    const editCurpInput = document.getElementById('edit-curp');
    const editPasswordInput = document.getElementById('edit-password');


    // --- FUNCIÓN REUTILIZABLE PARA MODALES DE INFO/ERROR ---
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        if (!infoModal || !infoModalTitle || !infoModalContent || !infoModalIcon || !closeInfoModalBtn) {
            console.error("Elementos del modal de información no encontrados.");
            alert(`${title}: ${content}`);
            return;
        }
        infoModalTitle.textContent = title;
        if (content.startsWith('<div')) {
            infoModalContent.innerHTML = content;
        } else {
             infoModalContent.innerHTML = `<p style="text-align: center;">${content}</p>`;
        }
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

    // --- LÓGICA DEL MENÚ DE ADMIN ---
    if (adminEmailPlaceholder) { adminEmailPlaceholder.textContent = currentUser.email; }
    if (userMenuTrigger && userDropdown) {
        userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); });
    }
    window.addEventListener('click', () => { if (userDropdown && userDropdown.classList.contains('active')) { userDropdown.classList.remove('active'); } });

    // --- Ver Info Admin ---
    if (viewAdminInfoBtn && infoModal && infoModalContent) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!r.ok) throw new Error('No se pudo obtener la info.');
                const p = await r.json();
                const infoHtml = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre||'N/A'}</span></div><div class="info-row"><label>CURP:</label> <span>${p.curp}</span></div><div class="info-row"><label>RFC:</label> <span>${p.rfc||'N/A'}</span></div><div class="info-row"><label>Email:</label> <span>${p.correo_electronico}</span></div><div class="info-row"><label>Municipio:</label> <span>${p.municipio||'N/A'}</span></div>`;
                showInfoModal('Información del Administrador', infoHtml, true);
            } catch (err) {
                showInfoModal('Error', err.message, false);
            }
        });
    }
    if (infoModal) {
        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) infoModal.classList.remove('visible');
        });
    }

    // --- Logout Admin ---
    if (adminLogoutBtn && logoutModal) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('visible');
        });
        const closeModal = () => logoutModal.classList.remove('visible');
        if(cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeModal);
        logoutModal.addEventListener('click', (e) => { if (e.target === logoutModal) closeModal(); });
        if(confirmLogoutBtn) confirmLogoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            window.location.href = 'home.html';
        });
    }


    // --- LÓGICA PARA CARGAR LA TABLA Y BUSCADOR ---
    const formatFecha = (dateString) => { /* ... (Implementación de formatFecha) ... */
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-MX', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', hour12: true 
            });
        } catch (e) {
            return dateString;
        }
    };
    
    const renderTabla = (usuarios) => { /* ... (Implementación de renderTabla) ... */
        if(!tableBody) return;
        tableBody.innerHTML = '';
        if (usuarios.length === 0) { tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No se encontraron usuarios.</td></tr>`; return; }

        usuarios.forEach(user => {
            const row = tableBody.insertRow();
            row.dataset.id = user.id;

            let editButtonDisabled = '';
            if (user.id === currentUser.id) { editButtonDisabled = 'disabled'; }
            if (currentUser.rol === 'admin' && user.rol === 'superadmin') { editButtonDisabled = 'disabled'; }

            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.curp || 'N/A'}</td>
                <td>${user.rol || 'N/A'}</td>
                <td>${formatFecha(user.creado_en)}</td>
                <td>
                    <button class="btn-icon btn-edit-usuario" title="Editar" data-id="${user.id}" ${editButtonDisabled}>
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    </td>
            `;
        });
    };

    const cargarUsuarios = async () => { /* ... (Implementación de cargarUsuarios) ... */
        try {
            const response = await fetch('/api/admin/usuarios', { headers: { 'Authorization': `Bearer ${authToken}` } });
             if (response.status === 403) { showInfoModal('Acceso Denegado', 'No tienes permisos para ver esta sección.', false, () => window.location.href = 'admin.html'); return; }
            if (!response.ok) { throw new Error('No se pudieron cargar los usuarios.'); }
            allUsuarios = await response.json();
            renderTabla(allUsuarios);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };

    if (searchInput && tableBody) { /* ... (Implementación de búsqueda) ... */
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const filteredUsuarios = allUsuarios.filter(u => {
                const email = (u.email || '').toLowerCase();
                const curp = (u.curp || '').toLowerCase();
                return email.includes(searchTerm) || curp.includes(searchTerm);
            });
            renderTabla(filteredUsuarios);
        });
    }

    // =======================================================
    // === VALIDACIÓN EN TIEMPO REAL DEL FORMULARIO DE EDICIÓN ===
    // =======================================================
    const setupEditFormValidation = () => {
        
        // Validar Email
        if (editEmailInput) {
            editEmailInput.setAttribute('maxlength', 60);
            editEmailInput.addEventListener('input', (e) => {
                if (!e.target.value) showFeedback(e.target, 'El email es obligatorio.', false);
                else if (!isValidEmail(e.target.value)) showFeedback(e.target, 'Formato de correo incorrecto.', false);
                else showFeedback(e.target, 'Correo válido.', true);
            });
        }
        
        // Validar CURP
        if (editCurpInput) {
            editCurpInput.setAttribute('maxlength', 18);
            editCurpInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (!e.target.value) showFeedback(e.target, 'La CURP es obligatoria.', false);
                else if (!isValidCURP(e.target.value)) showFeedback(e.target, 'Formato de CURP incorrecto.', false);
                else showFeedback(e.target, 'CURP válido.', true);
            });
        }
        
        // Validar Contraseña (si se ingresa)
        if (editPasswordInput) {
            editPasswordInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value.length > 0 && value.length < 6) showFeedback(e.target, 'Mínimo 6 caracteres.', false);
                else if (value.length >= 6) showFeedback(e.target, 'Contraseña OK. Se actualizará al guardar.', true);
                else showFeedback(e.target, '', true); // Si está vacío, es opcional y válido.
            });
        }
    };
    setupEditFormValidation();


    // --- LÓGICA PARA ACCIONES DE LA TABLA (EDITAR) ---
    
    // --- Cerrar Modal de Edición ---
    const closeEditModal = () => { if (editModal) editModal.classList.remove('visible'); 
        editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid')); // Limpia feedback
        editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');
        editForm.reset(); // Limpia campos
    };
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    // --- Abrir Modal de Edición (Disparar validación al abrir) ---
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            const button = e.target.closest('button.btn-edit-usuario');
            if (!button || button.disabled) return;

            const usuarioId = button.dataset.id;
            
            try {
                // 1. Obtener datos
                const response = await fetch(`/api/admin/usuarios/${usuarioId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                const data = await response.json();

                // 2. Rellenar y disparar validación
                if (editForm && editUsuarioId && editModal) {
                    editForm.elements.email.value = data.email || '';
                    editForm.elements.curp.value = data.curp || '';
                    editForm.elements.rol.value = data.rol || 'solicitante';
                    editForm.elements.password.value = ''; 
                    editUsuarioId.value = data.id;
                    
                    // Disparar eventos input para activar la validación y mostrar el feedback
                    editEmailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    editCurpInput.dispatchEvent(new Event('input', { bubbles: true }));
                    editPasswordInput.dispatchEvent(new Event('input', { bubbles: true })); 
                    
                    editModal.classList.add('visible');
                } 
            } catch(error) {
                showInfoModal('Error', error.message, false);
            }
        });
    }

    // --- Enviar Formulario de Edición (Chequear validación final) ---
    if (editForm && editUsuarioId) {
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
            
            const id = editUsuarioId.value;
            const data = {
                email: editForm.elements.email.value,
                curp: editForm.elements.curp.value.toUpperCase(),
                rol: editForm.elements.rol.value,
                password: editForm.elements.password.value 
            };
            if (!data.password || data.password.trim() === '') {
                delete data.password;
            }

            try {
                const response = await fetch(`/api/admin/usuarios/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.message || 'Error desconocido.');

                closeEditModal();
                showInfoModal('Éxito', result.message, true, () => {
                   cargarUsuarios(); 
                });

            } catch (error) {
                console.error("Error al actualizar usuario:", error);
                showInfoModal('Error al Actualizar', error.message, false);
            }
        });
    }

    // --- CARGA INICIAL ---
    cargarUsuarios();

}); // Fin de DOMContentLoaded