// public/js/admin-integrantes.js

// ==========================================================
// ==== 1. LÓGICA DE INTERFAZ POR ROL ====
// ==========================================================
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

        // Si es un ADMIN normal
        if (rol === 'admin') {
            if (navCuentas) navCuentas.style.display = 'none';
            if (navSolicitantes) navSolicitantes.href = 'panel-admin.html';
            if (adminTheme) adminTheme.disabled = true;
            if (panelAdminTheme) panelAdminTheme.disabled = false;

        // Si es SUPERADMIN
        } else if (rol === 'superadmin') {
            if (navCuentas) navCuentas.style.display = 'block'; 
            if (navSolicitantes) navSolicitantes.href = 'admin.html';
            if (adminTheme) adminTheme.disabled = false;
            if (panelAdminTheme) panelAdminTheme.disabled = true;
        }
        
        const headerTitleElement = document.querySelector('.content-header div:first-child');
        if (headerTitleElement) {
            if (rol === 'superadmin') {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-shield" style="margin-right: 10px;"></i> Panel de Administración';
            } else {
                 headerTitleElement.innerHTML = '<i class="fas fa-user-cog" style="margin-right: 10px;"></i> Panel de Gestión';
            }
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
        if (currentUserJSON) {
            currentUser = JSON.parse(currentUserJSON);
        }
    } catch (error) {
        console.error("Error parsing currentUser:", error);
    }

    if (!authToken || !currentUser) {
        window.location.href = 'home.html';
        return;
    }

    ajustarUIporRol();

    // --- HELPERS ---
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


    // --- MODAL INFO ---
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
        infoModalIcon.classList.add(isSuccess ? 'fa-check-circle' : 'fa-times-circle', isSuccess ? 'success' : 'error');
        infoModal.classList.add('visible');
        const confirmHandler = () => {
            infoModal.classList.remove('visible');
            if (onConfirm) onConfirm();
            closeInfoModalBtn.removeEventListener('click', confirmHandler);
        };
        closeInfoModalBtn.addEventListener('click', confirmHandler, { once: true });
    };


    // --- TABLA Y DATOS ---
    const tableBody = document.getElementById('integrantes-table-body');
    const searchInput = document.getElementById('search-input');
    
    // Controles de fecha
    const dateStartInput = document.getElementById('filter-date-start');
    const dateEndInput = document.getElementById('filter-date-end');
    const btnFilterDate = document.getElementById('btn-filter-date');
    const btnClearDate = document.getElementById('btn-clear-date');
    const quickFilterButtons = document.querySelectorAll('.btn-chip');

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
                </td>
            `;
        });
    };

    // --- BUSCADOR CLIENT-SIDE ---
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

    // --- CARGA DE DATOS (CON FILTROS AL SERVIDOR) ---
    const cargarDatosIniciales = async (startDate = '', endDate = '') => {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Cargando datos...</td></tr>';
        try {
            // CORRECCIÓN AQUÍ: Usar '/api/integrantes' en lugar de '/api/admin/integrantes'
            let url = '/api/integrantes'; 
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            
            if (startDate || endDate) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('Failed to load data.');
            
            allIntegrantes = await response.json();
            renderTabla(allIntegrantes);
            
            // Reaplicar filtro de texto local si existe
            if (searchInput && searchInput.value.trim() !== '') {
                searchInput.dispatchEvent(new Event('input'));
            }

        } catch (error) {
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">${error.message}</td></tr>`;
        }
    };
    
    // Carga inicial
    cargarDatosIniciales();


    // --- LÓGICA DE FILTROS ---
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

    if (btnClearDate) {
        btnClearDate.addEventListener('click', clearFilters);
    }

    quickFilterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            quickFilterButtons.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const rangeType = e.target.dataset.range;
            const today = getTodayDate();
            let start = '';
            let end = today; 

            if (rangeType === 'today') {
                start = today;
            } else if (rangeType === 'week') {
                start = getDaysAgoDate(7);
            } else if (rangeType === 'month') {
                start = getFirstDayOfMonth();
            }

            dateStartInput.value = start;
            dateEndInput.value = end;

            cargarDatosIniciales(start, end);
        });
    });


    // --- MODAL DE EDICIÓN ---
    const editModal = document.getElementById('edit-integrante-modal');
    const editForm = document.getElementById('edit-integrante-form');
    const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
    const editErrorMsg = document.getElementById('edit-error-msg');
    const editIdField = document.getElementById('edit-integrante-id');
    const fields = ['nombre_completo', 'rfc', 'curp', 'telefono', 'municipio', 'actividad_desempena'];
    const editFormFields = {};
    fields.forEach(f => editFormFields[f] = document.getElementById(`edit-${f}`));

    // Validación
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
            // CORRECCIÓN AQUÍ TAMBIÉN:
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
                // CORRECCIÓN AQUÍ:
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
        const pdfBtn = e.target.closest('.btn-download-integrante-pdf');
        if (pdfBtn && !pdfBtn.disabled) {
            const id = pdfBtn.dataset.id;
            const original = pdfBtn.innerHTML;
            pdfBtn.disabled = true;
            pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            try {
                // CORRECCIÓN AQUÍ: Ruta de exportación individual (si existe en tu router)
                // Si no tienes una ruta individual específica en router, verifica. 
                // Asumo que en router.js tienes algo como: router.get('/integrantes/pdf/:id', ...)
                // Si usabas '/api/admin/integrante-pdf/:id', cámbialo a lo que tengas configurado.
                // Basado en tu código anterior, parece que usabas una ruta admin. 
                // Si esa ruta admin no tiene filtros, no importa para descarga individual.
                // Pero si quieres estandarizar, usa:
                const res = await fetch(`/api/admin/integrante-pdf/${id}`, { // Esta ruta admin parece ser la que genera el PDF individual
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
                pdfBtn.disabled = false;
                pdfBtn.innerHTML = original;
            }
            return;
        }

        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) openEditModal(editBtn.dataset.id);
    });


    // --- MENÚ Y NAVEGACIÓN ---
    const adminEmailPlaceholder = document.getElementById('admin-email-placeholder');
    const userMenuTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-dropdown');
    const viewAdminInfoBtn = document.getElementById('view-admin-info');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const adminGotoDashboardBtn = document.getElementById('admin-goto-dashboard-btn');

    if (adminEmailPlaceholder) adminEmailPlaceholder.textContent = currentUser.email;
    
    if (userMenuTrigger) {
        userMenuTrigger.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            userDropdown?.classList.toggle('active'); 
        });
    }
    window.addEventListener('click', () => { 
        if (userDropdown?.classList.contains('active')) userDropdown.classList.remove('active'); 
    });

    if (adminGotoDashboardBtn) {
        adminGotoDashboardBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'dashboard.html';
        });
    }

    if (viewAdminInfoBtn) {
        viewAdminInfoBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const r = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
                const p = await r.json();
                const infoHtml = `<div class="info-row"><label>Nombre:</label> <span>${p.nombre || 'N/A'}</span></div><div class="info-row"><label>Email:</label><span>${p.correo_electronico}</span></div>`;
                showInfoModal('Información', infoHtml, true);
            } catch (e) { showInfoModal('Error', 'No se pudo cargar perfil', false); }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'home.html';
        });
    }


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

                // CORRECCIÓN AQUÍ: Usar ruta estandarizada
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