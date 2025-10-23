// public/js/anexo2.js
import { showFeedback, isValidRFC, isValidCURP } from './utils.js';

let integrantesData = [];
let integranteEditId = null;
let activeGradoInput = null; // Variable para saber qué input de "Grado de Estudio" estamos editando

const getSexoTexto = (sexoValue) => {
    if (sexoValue == 1) return 'Masculino';
    if (sexoValue == 0) return 'Femenino';
    return 'Seleccione una opción';
};

export async function cargarIntegrantes(authToken) {
    const tableBody = document.getElementById('integrantes-table-body');
    if (!tableBody) return;
    try {
        const response = await fetch('/api/integrantes', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!response.ok) throw new Error('No se pudieron cargar los integrantes.');
        integrantesData = await response.json();
        
        tableBody.innerHTML = '';
        if (integrantesData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Aún no hay integrantes registrados.</td></tr>';
        } else {
            integrantesData.forEach(i => {
                const row = document.createElement('tr');
                row.dataset.id = i.id;
                row.innerHTML = `
                    <td>${i.nombre_completo || ''}</td>
                    <td>${i.rfc || ''}</td>
                    <td>${i.curp || ''}</td>
                    <td>${getSexoTexto(i.sexo)}</td> 
                    <td>${i.telefono || ''}</td>
                    <td>
                        <button type="button" class="btn-icon btn-edit"><i class="fas fa-pencil-alt"></i></button>
                        <button type="button" class="btn-icon btn-delete"><i class="fas fa-trash-alt"></i></button>
                    </td>`;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error(error.message);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Error al cargar integrantes.</td></tr>';
    }
}

export function initAnexo2(authToken, showInfoModal) {
    const addForm = document.getElementById('add-integrante-form');
    const editForm = document.getElementById('edit-integrante-form');
    const tableBody = document.getElementById('integrantes-table-body');
    const editModal = document.getElementById('edit-integrante-modal');
    const deleteModal = document.getElementById('delete-confirm-modal');
    const gradoEstudioModal = document.getElementById('grado-estudio-modal');
    const gradoEstudioOptions = document.getElementById('grado-estudio-options');
    const cancelGradoModalBtn = document.getElementById('cancel-grado-modal-btn');

    if (!addForm || !editForm || !tableBody || !editModal || !deleteModal || !gradoEstudioModal) return;

    // --- LÓGICA PARA MODAL DE GRADO DE ESTUDIO ---
    const openGradoEstudioModal = (inputElement) => {
        activeGradoInput = inputElement;
        gradoEstudioModal.classList.add('visible');
    };

    const inputGradoAdd = addForm.elements['ultimo_grado_estudio'];
    const inputGradoEdit = editForm.elements['ultimo_grado_estudio'];

    inputGradoAdd.addEventListener('click', () => openGradoEstudioModal(inputGradoAdd));
    inputGradoEdit.addEventListener('click', () => openGradoEstudioModal(inputGradoEdit));

    gradoEstudioOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('option-item') && activeGradoInput) {
            activeGradoInput.value = e.target.dataset.value;
            activeGradoInput.dispatchEvent(new Event('input', { bubbles: true }));
            gradoEstudioModal.classList.remove('visible');
            activeGradoInput = null;
        }
    });

    cancelGradoModalBtn.addEventListener('click', () => gradoEstudioModal.classList.remove('visible'));
    gradoEstudioModal.addEventListener('click', (e) => { if (e.target === gradoEstudioModal) gradoEstudioModal.classList.remove('visible'); });

    // --- LÓGICA PARA DROPDOWNS DE SEXO ---
    const inicializarDropdown = (dropdownElement) => {
        if (!dropdownElement) return;
        const selectedDisplay = dropdownElement.querySelector('.dropdown-selected');
        const hiddenInput = dropdownElement.querySelector('input[type="hidden"]');
        const optionsContainer = dropdownElement.querySelector('.dropdown-options');
        
        selectedDisplay.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                if(d !== dropdownElement) d.classList.remove('open');
            });
            dropdownElement.classList.toggle('open');
        });
        
        optionsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-option')) {
                selectedDisplay.querySelector('span').textContent = e.target.textContent;
                hiddenInput.value = e.target.dataset.value;
                dropdownElement.classList.remove('open');
            }
        });
    };
    
    inicializarDropdown(document.getElementById('sexo-dropdown'));
    inicializarDropdown(document.getElementById('edit-sexo-dropdown'));
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
    });

    // --- LÓGICA DE VALIDACIÓN ROBUSTA ---
    const setupFormValidation = (form) => {
        const fieldRules = {
            'nombre_completo': { type: 'text', maxLength: 35 },
            'ultimo_grado_estudio': { type: 'text', maxLength: 35 },
            'actividad_desempena': { type: 'text', maxLength: 35 },
            'localidad': { type: 'text', maxLength: 35 },
            'municipio': { type: 'text', maxLength: 35 },
            'rfc': { type: 'rfc', maxLength: 13 },
            'curp': { type: 'curp', maxLength: 18 },
            'telefono': { type: 'numeric', maxLength: 10 }
        };

        for (const fieldName in fieldRules) {
            const input = form.elements[fieldName];
            if (input) {
                const rule = fieldRules[fieldName];
                input.setAttribute('maxlength', rule.maxLength);

                input.addEventListener('input', () => {
                    switch (rule.type) {
                        case 'text':
                            input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                            break;
                        case 'numeric':
                            input.value = input.value.replace(/[^0-9]/g, '');
                            break;
                        case 'rfc':
                        case 'curp':
                            input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            break;
                    }

                    if (input.value.length > rule.maxLength) {
                        input.value = input.value.slice(0, rule.maxLength);
                    }

                    let isValid = true;
                    let message = 'Correcto.';

                    if (input.required && !input.value.trim()) {
                        isValid = false;
                        message = 'Este campo es obligatorio.';
                    } else if (rule.type === 'rfc' && input.value.length > 0 && !isValidRFC(input.value)) {
                        isValid = false;
                        message = 'Formato de RFC incorrecto.';
                    } else if (rule.type === 'curp' && input.value.length > 0 && !isValidCURP(input.value)) {
                        isValid = false;
                        message = 'Formato de CURP incorrecto.';
                    } else if (rule.type === 'telefono' && input.value.length > 0 && input.value.length < 10) {
                        isValid = false;
                        message = 'Debe tener 10 dígitos.';
                    }
                    
                    if (input.value.length > 0 || input.required) {
                        showFeedback(input, message, isValid);
                    } else {
                        showFeedback(input, '', true);
                    }
                });
            }
        }
    };

    setupFormValidation(addForm);
    setupFormValidation(editForm);

    // --- MANEJO DE LA TABLA (BOTONES EDITAR Y ELIMINAR) ---
    tableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button.btn-icon');
        if (!button) return;
        const row = button.closest('tr');
        const id = row.dataset.id;
        
        if (button.classList.contains('btn-edit')) {
            const integrante = integrantesData.find(i => i.id == id);
            if (!integrante) return;
            
            editForm.reset();
            editForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
            editForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');
            
            integranteEditId = id;
            editForm.elements['nombre_completo'].value = integrante.nombre_completo || '';
            editForm.elements['rfc'].value = integrante.rfc || '';
            editForm.elements['curp'].value = integrante.curp || '';
            editForm.elements['telefono'].value = integrante.telefono || '';
            editForm.elements['ultimo_grado_estudio'].value = integrante.ultimo_grado_estudio || '';
            editForm.elements['actividad_desempena'].value = integrante.actividad_desempeña || '';
            editForm.elements['localidad'].value = integrante.localidad || '';
            editForm.elements['municipio'].value = integrante.municipio || '';
            
            const sexoDropdown = document.getElementById('edit-sexo-dropdown');
            sexoDropdown.querySelector('input[name="sexo"]').value = integrante.sexo ?? '';
            sexoDropdown.querySelector('.dropdown-selected span').textContent = getSexoTexto(integrante.sexo);
            
            editForm.querySelectorAll('input').forEach(input => {
                 input.dispatchEvent(new Event('input', { bubbles: true }));
            });

            editModal.classList.add('visible');
        }

        if (button.classList.contains('btn-delete')) {
            deleteModal.classList.add('visible');
            const confirmBtn = document.getElementById('confirm-delete-btn');
            
            const newConfirmBtn = confirmBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

            newConfirmBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch(`/api/integrantes/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    showInfoModal('¡Éxito!', 'Integrante eliminado correctamente.', true);
                    deleteModal.classList.remove('visible');
                    cargarIntegrantes(authToken);
                } catch (error) {
                    showInfoModal('Error', error.message, false);
                }
            }, { once: true });
        }
    });

    // --- ENVÍO DE FORMULARIOS ---
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        addForm.querySelectorAll('input').forEach(input => {
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        if (addForm.querySelector('.invalid')) {
            const firstInvalid = addForm.querySelector('.invalid');
            const label = addForm.querySelector(`label[for="${firstInvalid.id}"]`);
            showInfoModal('Campo Incorrecto', `Por favor, revisa el campo "${label.textContent.replace(':', '')}".`, false);
            firstInvalid.focus();
            return;
        }

        const integranteData = Object.fromEntries(new FormData(addForm).entries());
        try {
            const response = await fetch('/api/integrantes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(integranteData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showInfoModal('¡Éxito!', 'Integrante añadido correctamente.', true);
            addForm.reset();
            addForm.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
            addForm.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');
            document.querySelector('#sexo-dropdown .dropdown-selected span').textContent = 'Seleccione una opción';
            cargarIntegrantes(authToken);
        } catch (error) {
            showInfoModal('Error al Guardar', error.message, false);
        }
    });

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!integranteEditId) return;

        editForm.querySelectorAll('input').forEach(input => {
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        if (editForm.querySelector('.invalid')) {
            const firstInvalid = editForm.querySelector('.invalid');
            const label = editForm.querySelector(`label[for="${firstInvalid.id}"]`);
            showInfoModal('Campo Incorrecto', `Por favor, revisa el campo "${label.textContent.replace(':', '')}".`, false);
            firstInvalid.focus();
            return;
        }

        const integranteData = Object.fromEntries(new FormData(editForm).entries());
        try {
            const response = await fetch(`/api/integrantes/${integranteEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(integranteData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showInfoModal('¡Éxito!', 'Integrante actualizado correctamente.', true);
            editModal.classList.remove('visible');
            cargarIntegrantes(authToken);
        } catch (error) {
            showInfoModal('Error al Actualizar', error.message, false);
        }
    });

    // --- LÓGICA PARA CERRAR MODALES ---
    document.getElementById('cancel-edit-modal-btn').addEventListener('click', () => editModal.classList.remove('visible'));
    editModal.addEventListener('click', e => { if (e.target === editModal) editModal.classList.remove('visible'); });
    document.getElementById('deny-delete-btn').addEventListener('click', () => deleteModal.classList.remove('visible'));
    deleteModal.addEventListener('click', (e) => { if(e.target === deleteModal) deleteModal.classList.remove('visible'); });
}