    // Almacenaremos los datos y el ID de edición aquí para que las funciones puedan acceder a ellos
    let embarcacionesData = [];
    let embarcacionEditId = null;
    let authToken; // Se inicializará desde el archivo principal
    let showInfoModal; // Referencia a la función de modales

    // --- SELECTORES DE ELEMENTOS DEL ANEXO 5 ---
    const addEmbarcacionForm = document.getElementById('add-embarcacion-form');
    const embarcacionesTableBody = document.getElementById('embarcaciones-table-body');
    const editEmbarcacionModal = document.getElementById('edit-embarcacion-modal');
    const editEmbarcacionForm = document.getElementById('edit-embarcacion-form');
    const deleteEmbarcacionModal = document.getElementById('delete-embarcacion-modal');
    // ▼▼▼ NUEVOS SELECTORES ▼▼▼
    const matriculaHelpModal = document.getElementById('matricula-help-modal'); 
    // ▲▲▲ FIN NUEVOS SELECTORES ▲▲▲


    // =========================================================================
    // == INICIO: LÓGICA DE VALIDACIÓN ROBUSTA
    // =========================================================================

    const showFeedback = (inputElement, message, isValid) => {
        let feedbackElement = inputElement.nextElementSibling;
        if (!feedbackElement || !feedbackElement.classList.contains('feedback-message')) {
            const parent = inputElement.closest('.anexo-field');
            if (parent) feedbackElement = parent.querySelector('.feedback-message');
        }

        if (feedbackElement && feedbackElement.classList.contains('feedback-message')) {
            inputElement.classList.remove('valid', 'invalid');
            feedbackElement.classList.remove('valid', 'invalid');
            if (message) {
                inputElement.classList.add(isValid ? 'valid' : 'invalid');
                feedbackElement.classList.add(isValid ? 'valid' : 'invalid');
                feedbackElement.textContent = message;
            } else {
                feedbackElement.textContent = '';
            }
        }
    };

    const clearAllFeedback = (form) => {
        form.querySelectorAll('.feedback-message').forEach(el => el.textContent = '');
        form.querySelectorAll('.valid, .invalid').forEach(el => el.classList.remove('valid', 'invalid'));
    };

    const setupValidationUI = (form) => {
        form.querySelectorAll('.anexo-field input').forEach(input => {
            let feedbackDiv = input.nextElementSibling;
            while (feedbackDiv && !feedbackDiv.classList.contains('feedback-message')) {
                feedbackDiv = feedbackDiv.nextElementSibling;
            }

            if (!feedbackDiv) {
                feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'feedback-message';
                input.closest('.anexo-field').appendChild(feedbackDiv);
            }
        });
    };

    const fieldLimitsAnexo5 = {
        nombre_embarcacion: 40,
        matricula: 20, 
        tonelaje_neto: 10,
        marca: 40,
        numero_serie: 40,
        potencia_hp: 5,
        puerto_base: 40
    };

    const setupFormValidation = (form) => {
        const addValidation = (fieldName, validationLogic) => {
            const input = form.elements[fieldName];
            if (input) {
                if (fieldLimitsAnexo5[fieldName]) {
                    input.setAttribute('maxlength', fieldLimitsAnexo5[fieldName]);
                }
                input.oninput = () => validationLogic(input);
                input.addEventListener('input', input.oninput);
            }
        };

        ['nombre_embarcacion', 'marca', 'puerto_base'].forEach(name => {
            addValidation(name, (input) => {
                input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if (input.required && !input.value.trim()) {
                    showFeedback(input, 'Este campo es obligatorio.', false);
                } else if (input.value.trim().length > 0) {
                    showFeedback(input, 'Correcto.', true);
                } else {
                    showFeedback(input, '', false);
                }
            });
        });

        ['numero_serie'].forEach(name => {
            addValidation(name, (input) => {
                input.value = input.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                if (input.required && !input.value.trim()) {
                    showFeedback(input, 'Este campo es obligatorio.', false);
                } else if (input.value.trim().length > 0) {
                    showFeedback(input, 'Correcto.', true);
                } else {
                    showFeedback(input, '', false);
                }
            });
        });

        addValidation('matricula', (input) => {
            const matriculaRegex = /^6ª\s[A-Z]{2}-\d{1}-\d{1,4}-\d{2}$/;
            const valor = input.value.trim();

            if (input.required && !valor) {
                showFeedback(input, 'Este campo es obligatorio.', false);
            } else if (valor && matriculaRegex.test(valor.toUpperCase())) { 
                showFeedback(input, 'Formato de matrícula válido.', true);
            } else if (valor) {
                showFeedback(input, 'Formato incorrecto. Ejemplo: 6ª BA-2-53-21', false);
            } else {
                showFeedback(input, '', false);
            }
        });

        addValidation('potencia_hp', (input) => {
            input.value = input.value.replace(/[^0-9]/g, '');
            const valueAsNumber = parseInt(input.value, 10);
            if (input.required && !input.value.trim()) {
                showFeedback(input, 'Este campo es obligatorio.', false);
            } else if (input.value.trim() && valueAsNumber <= 0) {
                showFeedback(input, 'Debe ser un número mayor a cero.', false);
            } else if (valueAsNumber > 0) {
                showFeedback(input, 'Correcto.', true);
            } else {
                showFeedback(input, '', false);
            }
        });
        
        addValidation('tonelaje_neto', (input) => {
            input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            const valueAsNumber = parseFloat(input.value);
            if (input.required && !input.value.trim()) {
                showFeedback(input, 'Este campo es obligatorio.', false);
            } else if (input.value.trim() && valueAsNumber <= 0) {
                showFeedback(input, 'Debe ser un número mayor a cero.', false);
            } else if (valueAsNumber > 0) {
                showFeedback(input, 'Correcto.', true);
            } else {
                showFeedback(input, '', false);
            }
        });
    };

    const insertOrdinalChar = (inputElement) => {
        const charToInsert = 'ª';
        const startPos = inputElement.selectionStart;
        const endPos = inputElement.selectionEnd;
        const currentValue = inputElement.value;
        inputElement.value = currentValue.substring(0, startPos) + charToInsert + currentValue.substring(endPos);
        const newCursorPos = startPos + charToInsert.length;
        inputElement.selectionStart = newCursorPos;
        inputElement.selectionEnd = newCursorPos;
        inputElement.focus();
        if (inputElement.oninput) {
            inputElement.oninput();
        }
    };

    // =========================================================================
    // == FIN: LÓGICA DE VALIDACIÓN
    // =========================================================================


    // --- FUNCIÓN PARA CARGAR Y MOSTRAR LAS EMBARCACIONES ---
    export const cargarEmbarcaciones = async () => {
        if (!embarcacionesTableBody) return;
        try {
            const response = await fetch('/api/embarcaciones', { headers: { 'Authorization': `Bearer ${authToken}` } });
            if (!response.ok) throw new Error('No se pudieron cargar las embarcaciones.');
            
            embarcacionesData = await response.json();
            
            embarcacionesTableBody.innerHTML = '';
            if (embarcacionesData.length === 0) {
                embarcacionesTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Aún no hay embarcaciones registradas.</td></tr>';
            } else {
                embarcacionesData.forEach(emb => {
                    const row = document.createElement('tr');
                    row.dataset.id = emb.id;
                    row.innerHTML = `
                        <td>${emb.nombre_embarcacion || ''}</td>
                        <td>${emb.matricula || ''}</td>
                        <td>${emb.tonelaje_neto || ''}</td>
                        <td>${emb.marca || ''}</td>
                        <td>${emb.numero_serie || ''}</td>
                        <td>${emb.potencia_hp || ''}</td>
                        <td>${emb.puerto_base || ''}</td>
                        <td>
                            <button class="btn-icon btn-edit-embarcacion"><i class="fas fa-pencil-alt"></i></button>
                            <button class="btn-icon btn-delete-embarcacion"><i class="fas fa-trash-alt"></i></button>
                        </td>`;
                    embarcacionesTableBody.appendChild(row);
                });
            }
        } catch (error) {
            console.error(error.message);
            embarcacionesTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 20px;">Error al cargar las embarcaciones.</td></tr>';
        }
    };

    // --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN DEL ANEXO 5 ---
    export function initAnexo5(token, modalFunction) {
        authToken = token;
        showInfoModal = modalFunction;

        // --- LÓGICA PARA AÑADIR UNA EMBARCACIÓN ---
        if(addEmbarcacionForm) {
            setupValidationUI(addEmbarcacionForm);
            setupFormValidation(addEmbarcacionForm);

            const btnAddOrdinal = document.getElementById('btn-insert-ordinal-a-add');
            const inputAddMatricula = addEmbarcacionForm.elements['matricula'];
            if (btnAddOrdinal && inputAddMatricula) {
                btnAddOrdinal.addEventListener('click', (e) => {
                    e.preventDefault();
                    insertOrdinalChar(inputAddMatricula);
                });
            }
            
            // ▼▼▼ NUEVO: Lógica del botón de AYUDA para AÑADIR ▼▼▼
            const btnHelpAdd = document.getElementById('btn-help-matricula-add');
            if (btnHelpAdd && matriculaHelpModal) {
                btnHelpAdd.addEventListener('click', (e) => {
                    e.preventDefault();
                    matriculaHelpModal.classList.add('visible');
                });
            }
            // ▲▲▲ FIN NUEVO ▲▲▲

            addEmbarcacionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                addEmbarcacionForm.querySelectorAll('input').forEach(input => {
                    if(input.oninput) input.oninput({ target: input });
                });

                const firstInvalidElement = addEmbarcacionForm.querySelector('.invalid');
                if (firstInvalidElement) {
                    const fieldLabels = {
                        nombre_embarcacion: 'Nombre de la Embarcación',
                        matricula: 'Matrícula',
                        tonelaje_neto: 'Tonelaje Neto',
                        marca: 'Marca del Motor',
                        numero_serie: 'Número de Serie',
                        potencia_hp: 'Potencia (HP)',
                        puerto_base: 'Puerto Base'
                    };
                    const fieldName = firstInvalidElement.name;
                    const fieldLabel = fieldLabels[fieldName] || 'un campo incorrecto';
                    const errorMessage = `Por favor, revisa y corrige el campo: "${fieldLabel}".`;

                    showInfoModal('Formulario Incompleto', errorMessage, false);
                    firstInvalidElement.focus();
                    firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }

                const data = Object.fromEntries(new FormData(addEmbarcacionForm).entries());
                try {
                    const response = await fetch('/api/embarcaciones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    
                    showInfoModal('¡Éxito!', result.message, true);
                    addEmbarcacionForm.reset();
                    clearAllFeedback(addEmbarcacionForm);
                    cargarEmbarcaciones();
                } catch (error) { 
                    showInfoModal('Error', error.message, false);
                }
            });
        }

        // --- LÓGICA PARA EDITAR Y ELIMINAR (usando la tabla) ---
        if(embarcacionesTableBody) {
            embarcacionesTableBody.addEventListener('click', (e) => {
                const target = e.target.closest('button');
                if (!target) return;
                const row = target.closest('tr');
                const id = row.dataset.id;

                if (target.classList.contains('btn-edit-embarcacion')) {
                    const embarcacion = embarcacionesData.find(emb => emb.id == id);
                    if (embarcacion) {
                        clearAllFeedback(editEmbarcacionForm);
                        embarcacionEditId = id;
                        editEmbarcacionForm.elements['nombre_embarcacion'].value = embarcacion.nombre_embarcacion || '';
                        editEmbarcacionForm.elements['matricula'].value = embarcacion.matricula || '';
                        editEmbarcacionForm.elements['tonelaje_neto'].value = embarcacion.tonelaje_neto || '';
                        editEmbarcacionForm.elements['marca'].value = embarcacion.marca || '';
                        editEmbarcacionForm.elements['numero_serie'].value = embarcacion.numero_serie || '';
                        editEmbarcacionForm.elements['potencia_hp'].value = embarcacion.potencia_hp || '';
                        editEmbarcacionForm.elements['puerto_base'].value = embarcacion.puerto_base || '';
                        editEmbarcacionModal.classList.add('visible');
                    }
                }

                if (target.classList.contains('btn-delete-embarcacion')) {
                    deleteEmbarcacionModal.classList.add('visible');
                    const confirmBtn = document.getElementById('confirm-delete-embarcacion-btn');
                    const denyBtn = document.getElementById('deny-delete-embarcacion-btn');
                    
                    const handleConfirmDelete = async () => {
                        try {
                            const response = await fetch(`/api/embarcaciones/${id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${authToken}` }
                            });
                            const result = await response.json();
                            if (!response.ok) throw new Error(result.message);
                            
                            showInfoModal('¡Éxito!', result.message, true);
                            cargarEmbarcaciones();
                        } catch (error) {
                            showInfoModal('Error', error.message, false);
                        }
                        closeDeleteModal();
                    };

                    const closeDeleteModal = () => {
                        deleteEmbarcacionModal.classList.remove('visible');
                        confirmBtn.removeEventListener('click', handleConfirmDelete);
                    };

                    confirmBtn.addEventListener('click', handleConfirmDelete, { once: true });
                    denyBtn.addEventListener('click', closeDeleteModal, { once: true });
                    deleteEmbarcacionModal.addEventListener('click', (ev) => {
                        if(ev.target === deleteEmbarcacionModal) closeDeleteModal();
                    }, { once: true });
                }
            });
        }
        
        // --- LÓGICA DEL MODAL DE EDICIÓN DE EMBARCACIÓN ---
        const closeEditEmbarcacionModal = () => {
            editEmbarcacionModal.classList.remove('visible');
            editEmbarcacionForm.reset();
            clearAllFeedback(editEmbarcacionForm);
            embarcacionEditId = null;
        };

        if(editEmbarcacionModal) {
            setupValidationUI(editEmbarcacionForm);
            setupFormValidation(editEmbarcacionForm);

            const btnEditOrdinal = document.getElementById('btn-insert-ordinal-a-edit');
            const inputEditMatricula = editEmbarcacionForm.elements['matricula'];
            if (btnEditOrdinal && inputEditMatricula) {
                btnEditOrdinal.addEventListener('click', (e) => {
                    e.preventDefault();
                    insertOrdinalChar(inputEditMatricula);
                });
            }
            
            // ▼▼▼ NUEVO: Lógica del botón de AYUDA para EDITAR ▼▼▼
            const btnHelpEdit = document.getElementById('btn-help-matricula-edit');
            if (btnHelpEdit && matriculaHelpModal) {
                btnHelpEdit.addEventListener('click', (e) => {
                    e.preventDefault();
                    matriculaHelpModal.classList.add('visible');
                });
            }
            // ▲▲▲ FIN NUEVO ▲▲▲

            document.getElementById('cancel-edit-embarcacion-btn').addEventListener('click', closeEditEmbarcacionModal);
            editEmbarcacionModal.addEventListener('click', e => { if(e.target === editEmbarcacionModal) closeEditEmbarcacionModal(); });
            
            editEmbarcacionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                if(!embarcacionEditId) return;
                
                editEmbarcacionForm.querySelectorAll('input').forEach(input => {
                    if(input.oninput) input.oninput({ target: input });
                });

                const firstInvalidElement = editEmbarcacionForm.querySelector('.invalid');
                if (firstInvalidElement) {
                    const fieldLabels = {
                        nombre_embarcacion: 'Nombre de la Embarcación',
                        matricula: 'Matrícula',
                        tonelaje_neto: 'Tonelaje Neto',
                        marca: 'Marca del Motor',
                        numero_serie: 'Número de Serie',
                        potencia_hp: 'Potencia (HP)',
                        puerto_base: 'Puerto Base'
                    };
                    const fieldName = firstInvalidElement.name;
                    const fieldLabel = fieldLabels[fieldName] || 'un campo incorrecto';
                    const errorMessage = `Por favor, revisa y corrige el campo: "${fieldLabel}".`;

                    showInfoModal('Formulario Incompleto', errorMessage, false);
                    firstInvalidElement.focus();
                    return;
                }

                const data = Object.fromEntries(new FormData(editEmbarcacionForm).entries());
                try {
                    const response = await fetch(`/api/embarcaciones/${embarcacionEditId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    
                    showInfoModal('¡Éxito!', 'Embarcación actualizada correctamente.', true);
                    closeEditEmbarcacionModal();
                    cargarEmbarcaciones();
                } catch (error) {
                    showInfoModal('Error', error.message, false);
                }
            });
        }

        // ▼▼▼ NUEVO: Lógica para CERRAR el modal de ayuda ▼▼▼
        if (matriculaHelpModal) {
            const closeBtn = document.getElementById('close-matricula-help-btn');
            closeBtn.addEventListener('click', () => {
                matriculaHelpModal.classList.remove('visible');
            });

            matriculaHelpModal.addEventListener('click', (e) => {
                if (e.target === matriculaHelpModal) {
                    matriculaHelpModal.classList.remove('visible');
                }
            });
        }
        // ▲▲▲ FIN NUEVO ▲▲▲
    }