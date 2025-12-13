// public/js/admin-usuarios.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Verificaciones y Selectores Globales ---
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    
    // Si no hay sesión, usamos replace para evitar volver con "Atrás"
    if (!authToken || !currentUser || (currentUser.rol !== 'admin' && currentUser.rol !== 'superadmin')) {
        window.location.replace('home.html');
        return;
    }

    // ==========================================================
    // ==== LÓGICA DE ESTILOS DINÁMICA ====
    // ==========================================================
    const manageStylesByRole = (rol) => {
        const adminLink = document.getElementById('admin-theme-link');
        const panelAdminLink = document.getElementById('panel-admin-theme-link');

        if (rol === 'superadmin') {
            if (adminLink) adminLink.disabled = false;
            if (panelAdminLink) panelAdminLink.disabled = true;
        } else if (rol === 'admin') {
            if (adminLink) adminLink.disabled = true;
            if (panelAdminLink) panelAdminLink.disabled = false;
        }
        
        const headerTitleElement = document.querySelector('.content-header div:first-child');
        if (headerTitleElement) {
            if (rol === 'superadmin') {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
            } else {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';
            }
        }
    };
    manageStylesByRole(currentUser.rol);


    // ==========================================================
    // ==== LÓGICA DE VALIDACIÓN ====
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
    
    const isValidCURP = (curp) => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]{2}$/.test(curp.toUpperCase());
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Elementos del DOM
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const adminGotoDashboardBtn = document.getElementById('admin-goto-dashboard-btn');
    const tableBody = document.getElementById('usuarios-table-body');
    const searchInput = document.getElementById('search-input');
    const exportPdfUsuariosBtn = document.getElementById('export-pdf-usuarios-btn'); // Botón PDF
    let allUsuarios = []; 

    // Modales
    const infoModal = document.getElementById('admin-info-modal');
    const infoModalTitle = document.getElementById('admin-info-title');
    const infoModalContent = document.getElementById('admin-info-content');
    const infoModalIcon = document.getElementById('admin-info-icon');
    const closeInfoModalBtn = document.getElementById('close-admin-info-btn');

    const logoutModal = document.getElementById('logout-modal');
    const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

    const editModal = document.getElementById('edit-usuario-modal');
    const editForm = document.getElementById('edit-usuario-form');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editUsuarioId = document.getElementById('edit-usuario-id');
    const editEmailInput = document.getElementById('edit-email');
    const editCurpInput = document.getElementById('edit-curp');
    const editPasswordInput = document.getElementById('edit-password');


    // --- FUNCIÓN REUTILIZABLE PARA MODALES ---
    const showInfoModal = (title, content, isSuccess = true, onConfirm = null) => {
        if (!infoModal) { alert(`${title}: ${content}`); return; }
        
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

    // --- MENÚ DE ADMIN ---
    if (adminEmailPlaceholder) { adminEmailPlaceholder.textContent = currentUser.email; }
    if (userMenuTrigger && userDropdown) {
        userMenuTrigger.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); });
    }
    window.addEventListener('click', () => { if (userDropdown && userDropdown.classList.contains('active')) { userDropdown.classList.remove('active'); } });

    // --- INFO ADMIN ---
    if (viewAdminInfoBtn) {
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
    if (infoModal) infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('visible'); });

    // --- LOGOUT ADMIN ---
    if (adminLogoutBtn && logoutModal) {
        adminLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); logoutModal.classList.add('visible'); });
        if (adminGotoDashboardBtn) adminGotoDashboardBtn.addEventListener('click', (e) => { e.preventDefault(); window.location.href = 'dashboard.html'; });
        const closeModal = () => logoutModal.classList.remove('visible');
        if(cancelLogoutBtn) cancelLogoutBtn.addEventListener('click', closeModal);
        logoutModal.addEventListener('click', (e) => { if (e.target === logoutModal) closeModal(); });
        
        if(confirmLogoutBtn) confirmLogoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            // Redirección segura
            window.location.replace('home.html');
        });
    }

    // --- LÓGICA DE TABLA (CORREGIDA) ---
    const formatFecha = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString('es-MX', { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', hour12: true 
            });
        } catch (e) { return dateString; }
    };
    
    const renderTabla = (usuarios) => {
        if(!tableBody) return;
        tableBody.innerHTML = '';
        // Ajustamos el colspan a 7 porque agregamos la columna de Descargar
        if (usuarios.length === 0) { tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No se encontraron usuarios.</td></tr>`; return; }

        usuarios.forEach(user => {
            const row = tableBody.insertRow();
            row.dataset.id = user.id;

            let editButtonDisabled = '';
            if (user.id === currentUser.id) { editButtonDisabled = 'disabled'; }
            if (currentUser.rol === 'admin' && user.rol === 'superadmin') { editButtonDisabled = 'disabled'; }

            // Estilo para el badge de rol
            let roleBadgeStyle = 'background-color: #6c757d; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.85em;';
            if (user.rol === 'superadmin') roleBadgeStyle = 'background-color: #6f42c1; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.85em;';
            if (user.rol === 'admin') roleBadgeStyle = 'background-color: #0d6efd; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.85em;';

            // HTML para el botón de PDF Individual
            const pdfButtonHtml = `
                <button class="btn-icon btn-download-user-pdf" data-id="${user.id}" title="Descargar Ficha de Usuario">
                    <i class="fas fa-file-pdf"></i>
                </button>
            `;

            row.innerHTML = `
                <td><strong>${user.id}</strong></td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.curp || 'N/A'}</td>
                <td><span style="${roleBadgeStyle}">${user.rol || 'N/A'}</span></td>
                <td>${formatFecha(user.creado_en)}</td>
                <td style="text-align: center;">${pdfButtonHtml}</td> <td>
                    <button class="btn-icon btn-edit-usuario" title="Editar" data-id="${user.id}" ${editButtonDisabled}>
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </td>
            `;
        });
    };

    const cargarUsuarios = async () => {
        try {
            const response = await fetch('/api/admin/usuarios', { headers: { 'Authorization': `Bearer ${authToken}` } });
             if (response.status === 403) { showInfoModal('Acceso Denegado', 'No tienes permisos para ver esta sección.', false, () => window.location.replace('admin.html')); return; }
            if (!response.ok) { throw new Error('No se pudieron cargar los usuarios.'); }
            allUsuarios = await response.json();
            renderTabla(allUsuarios);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
            // Ajuste de colspan a 7 en caso de error
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };

    if (searchInput && tableBody) {
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

    // --- VALIDACIÓN DE EDICIÓN ---
    const setupEditFormValidation = () => {
        if (editEmailInput) {
            editEmailInput.setAttribute('maxlength', 60);
            editEmailInput.addEventListener('input', (e) => {
                if (!e.target.value) showFeedback(e.target, 'El email es obligatorio.', false);
                else if (!isValidEmail(e.target.value)) showFeedback(e.target, 'Formato de correo incorrecto.', false);
                else showFeedback(e.target, 'Correo válido.', true);
            });
        }
        if (editCurpInput) {
            editCurpInput.setAttribute('maxlength', 18);
            editCurpInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (!e.target.value) showFeedback(e.target, 'La CURP es obligatoria.', false);
                else if (!isValidCURP(e.target.value)) showFeedback(e.target, 'Formato de CURP incorrecto.', false);
                else showFeedback(e.target, 'CURP válido.', true);
            });
        }
        if (editPasswordInput) {
            editPasswordInput.addEventListener('input', (e) => {
                const value = e.target.value.trim();
                if (value.length > 0 && value.length < 6) showFeedback(e.target, 'Mínimo 6 caracteres.', false);
                else if (value.length >= 6) showFeedback(e.target, 'Contraseña OK. Se actualizará al guardar.', true);
                else showFeedback(e.target, '', true);
            });
        }
    };
    setupEditFormValidation();


    // --- ACCIONES DE TABLA (EDICIÓN Y DESCARGA) ---
    const closeEditModal = () => { if (editModal) editModal.classList.remove('visible'); 
        editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
        editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');
        editForm.reset(); 
    };
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditModal);
    if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) closeEditModal(); });

    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            
            // --- NUEVA LÓGICA: DESCARGAR PDF INDIVIDUAL DE USUARIO ---
            const pdfButton = e.target.closest('button.btn-download-user-pdf');
            if (pdfButton) {
                if (pdfButton.disabled) return;

                const userId = pdfButton.dataset.id;
                const originalContent = pdfButton.innerHTML;
                
                // Feedback visual de carga
                pdfButton.disabled = true;
                pdfButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    // Llamamos a la ruta específica para la ficha de usuario
                    const response = await fetch(`/api/admin/usuario-pdf/${userId}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });

                    if (!response.ok) throw new Error('Error al descargar la ficha.');

                    // Manejo del Blob para descargar
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    
                    // Nombre del archivo desde el header o por defecto
                    let filename = `Usuario_${userId}.pdf`;
                    const disposition = response.headers.get('content-disposition');
                    if (disposition && disposition.includes('filename=')) {
                        filename = disposition.split('filename=')[1].replace(/['"]/g, '');
                    }
                    a.download = filename;
                    
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();

                } catch (error) {
                    console.error(error);
                    showInfoModal('Error', 'No se pudo generar el PDF del usuario.', false);
                } finally {
                    pdfButton.disabled = false;
                    pdfButton.innerHTML = originalContent;
                }
                return; // Importante detener aquí para no activar otras lógicas de la fila
            }
            // --- FIN LÓGICA PDF ---

            const button = e.target.closest('button.btn-edit-usuario');
            if (!button || button.disabled) return;

            const usuarioId = button.dataset.id;
            
            try {
                const response = await fetch(`/api/admin/usuarios/${usuarioId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!response.ok) throw new Error('No se pudieron obtener los datos del usuario.');
                const data = await response.json();

                if (editForm && editUsuarioId && editModal) {
                    editForm.elements.email.value = data.email || '';
                    editForm.elements.curp.value = data.curp || '';
                    editForm.elements.rol.value = data.rol || 'solicitante';
                    editForm.elements.password.value = ''; 
                    editUsuarioId.value = data.id;
                    
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

    // --- GUARDAR EDICIÓN ---
    if (editForm && editUsuarioId) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            editForm.querySelectorAll('input').forEach(input => input.dispatchEvent(new Event('input', { bubbles: true })));
            
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

    // ==========================================================
    // ==== EXPORTAR LISTA DE USUARIOS (BACKEND PDFKIT) ====
    // ==========================================================
    if (exportPdfUsuariosBtn) {
        exportPdfUsuariosBtn.addEventListener('click', async () => {
            const originalText = exportPdfUsuariosBtn.innerHTML;
            exportPdfUsuariosBtn.disabled = true;
            exportPdfUsuariosBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';

            try {
                // LLAMADA AL BACKEND
                const response = await fetch('/api/admin/download-reporte-usuarios', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (!response.ok) throw new Error('Error al generar el reporte.');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `Reporte_Usuarios_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                
                showInfoModal('Éxito', 'El reporte se ha descargado correctamente.', true);

            } catch (error) {
                console.error(error);
                showInfoModal('Error', 'No se pudo generar el reporte PDF desde el servidor.', false);
            } finally {
                exportPdfUsuariosBtn.disabled = false;
                exportPdfUsuariosBtn.innerHTML = originalText;
            }
        });
    }

    // Carga inicial
    cargarUsuarios();
});