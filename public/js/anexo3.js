// public/js/anexo3.js
import { showFeedback } from './utils.js';

/**
 * Configura la lógica para habilitar/deshabilitar inputs de cantidad en la tabla de activos.
 */
const configurarLogicaAnexo3Activos = (anexoForm3) => {
    if (!anexoForm3) return;
    const prefijosActivos = [
        'embarcacion_madera', 'embarcacion_fibra', 'embarcacion_metal',
        'motores',
        'conservacion_hielera', 'conservacion_refrigerador', 'conservacion_cuartofrio',
        'transporte_camioneta', 'transporte_cajafria', 'transporte_camion'
    ];

    prefijosActivos.forEach(prefijo => {
        const nombreGrupoRadios = `${prefijo}_opcion`;
        const nombreInputCantidad = `${prefijo}_cantidad`;
        const radios = anexoForm3.querySelectorAll(`input[name="${nombreGrupoRadios}"]`);
        const inputCantidad = anexoForm3.querySelector(`input[name="${nombreInputCantidad}"]`);
        const radioNo = anexoForm3.querySelector(`input[name="${nombreGrupoRadios}"][value="no"]`);

        if (radios.length > 0 && inputCantidad && radioNo) {
            const actualizarEstado = () => {
                const debeDeshabilitar = radioNo.checked;
                inputCantidad.disabled = debeDeshabilitar;
                if (debeDeshabilitar) {
                    inputCantidad.value = '';
                    inputCantidad.classList.remove('invalid', 'valid');
                    const feedback = inputCantidad.closest('.cantidad-cell').querySelector('.feedback-message');
                    if(feedback) feedback.textContent = '';
                }
            };
            radios.forEach(radio => radio.addEventListener('change', actualizarEstado));
            actualizarEstado();
        }
    });
};

/**
 * Carga los datos existentes del Anexo 3 en el formulario.
 * @param {string} authToken - El token de autenticación.
 */
export async function cargarDatosAnexo3(authToken) {
    const anexoForm3 = document.getElementById('anexo3-pesca-form');
    if (!anexoForm3) return;
    try {
        const response = await fetch('/api/anexo3', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!response.ok) throw new Error('No se pudieron cargar los datos del Anexo 3.');
        
        const data = await response.json();
        
        anexoForm3.reset();
        anexoForm3.querySelectorAll('input[type=checkbox]').forEach(chk => chk.checked = false);
        anexoForm3.querySelectorAll('input[name*="_opcion"][value="no"]').forEach(radio => radio.checked = true);
        
        const tecnicos = data.datos_tecnicos || {};
        if (Object.keys(tecnicos).length > 0) {
            anexoForm3.elements['lugar_captura'].value = tecnicos.lugar || '';
            anexoForm3.elements['localidad_captura'].value = tecnicos.localidad_captura || '';
            anexoForm3.elements['municipio_captura'].value = tecnicos.municipio_captura || '';
            anexoForm3.elements['sitio_desembarque'].value = tecnicos.sitio_desembarque || '';
            anexoForm3.elements['localidad_desembarque'].value = tecnicos.localidad_desembarque || '';
            anexoForm3.elements['municipio_desembarque'].value = tecnicos.municipio_desembarque || '';
            if (tecnicos.tipo_pesqueria) {
                const radioTipo = anexoForm3.querySelector(`input[name="tipo_pesqueria"][value="${tecnicos.tipo_pesqueria}"]`);
                if (radioTipo) radioTipo.checked = true;
            }
            const fillCheckboxes = (fieldName, dbValue) => {
                if (!dbValue) return;
                dbValue.split(',').forEach(val => {
                    const checkbox = anexoForm3.querySelector(`input[name="${fieldName}[]"][value="${val}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            };
            fillCheckboxes('pesqueria', tecnicos.pesqueria);
            fillCheckboxes('especies_objetivo', tecnicos.especies_objetivo);
            fillCheckboxes('certificados', tecnicos.certificados_solicitantes);

            if (tecnicos.arte_pesca) {
                tecnicos.arte_pesca.split(',').forEach(item => {
                    if (!item) return;
                    const [nombre, cantidad] = item.split(':');
                    const chk = anexoForm3.querySelector(`input[name="artes_pesca[]"][value="${nombre}"]`);
                    if (chk) {
                        chk.checked = true;
                        const cantInputName = `cantidad_${nombre.toLowerCase().replace(/ /g, '_')}`;
                        if (anexoForm3.elements[cantInputName]) anexoForm3.elements[cantInputName].value = cantidad;
                    }
                });
            }

            if (tecnicos.nivel_produccion_anual) {
                const [cantidad, ...unidadParts] = tecnicos.nivel_produccion_anual.split(' ');
                const unidad = unidadParts.join(' ');
                anexoForm3.elements['nivel_produccion_anual'].value = cantidad;
                if (unidad) {
                    const radioUnidad = anexoForm3.querySelector(`input[name="produccion_unidad"][value="${unidad}"]`);
                    if (radioUnidad) radioUnidad.checked = true;
                }
            }
        }
        
        const unidad = data.unidad_pesquera || {};
        if (Object.keys(unidad).length > 0) {
             const setActivoFields = (dbColPrefix, formNamePrefix, items) => {
                items.forEach(item => {
                    const optionCol = `${dbColPrefix}_${item}`;
                    const qtyCol = `${optionCol}_cantidad`;
                    const radioValue = unidad[optionCol] ? 'si' : 'no';
                    const radio = anexoForm3.querySelector(`input[name="${formNamePrefix}_${item}_opcion"][value="${radioValue}"]`);
                    if(radio) radio.checked = true;
                    
                    const cantInput = anexoForm3.querySelector(`input[name="${formNamePrefix}_${item}_cantidad"]`);
                    if (cantInput) {
                        cantInput.value = unidad[qtyCol] || 0;
                    }
                });
            };
            const motorRadioVal = unidad.motores ? 'si' : 'no';
            const motorRadio = anexoForm3.querySelector(`input[name="motores_opcion"][value="${motorRadioVal}"]`);
            if(motorRadio) motorRadio.checked = true;
            
            const motorCantInput = anexoForm3.querySelector(`input[name="motores_cantidad"]`);
            if(motorCantInput) motorCantInput.value = unidad.motores_cantidad || 0;
            
            setActivoFields('emb', 'embarcacion', ['madera', 'fibra', 'metal']);
            setActivoFields('cons', 'conservacion', ['hielera', 'refrigerador', 'cuartofrio']);
            setActivoFields('trans', 'transporte', ['camioneta', 'cajafria', 'camion']);
        }
        
        configurarLogicaAnexo3Activos(anexoForm3);
    } catch (error) {
        console.error("Error al cargar datos del Anexo 3:", error);
    }
}

/**
 * Inicializa la lógica del Anexo 3.
 * @param {string} authToken 
 * @param {Function} showInfoModal 
 */
export function initAnexo3(authToken, showInfoModal) {
    const anexoForm3 = document.getElementById('anexo3-pesca-form');
    if (!anexoForm3) return;

    // --- 1. FUNCIÓN DE AUTO-REPARACIÓN DEL FORMULARIO ---
    anexoForm3.querySelectorAll('.anexo-field input[type="text"], .anexo-field input[type="number"], .cantidad-cell input[type="number"]').forEach(input => {
        const parent = input.closest('.anexo-field, .cantidad-cell');
        if (parent && !parent.querySelector('.feedback-message')) {
            const feedbackDiv = document.createElement('div');
            feedbackDiv.className = 'feedback-message';
            parent.appendChild(feedbackDiv);
        }
    });

    // --- 2. LÍMITES Y VALIDACIONES EN TIEMPO REAL ---
    const fieldLimitsAnexo3 = {
        lugar_captura: 25,
        localidad_captura: 25,
        municipio_captura: 25,
        sitio_desembarque: 25,
        localidad_desembarque: 50,
        municipio_desembarque: 50,
        nivel_produccion_anual: 4, // Límite establecido en 4
        cantidad_arte: 3,
        cantidad_activo: 3
    };

    const addAnexo3Validation = (element, validationLogic) => {
        if(element) {
            element.oninput = () => validationLogic(element);
            element.addEventListener('input', element.oninput);
        }
    };

    ['lugar_captura', 'localidad_captura', 'municipio_captura', 'sitio_desembarque', 'localidad_desembarque', 'municipio_desembarque'].forEach(name => {
        const input = anexoForm3.elements[name];
        if (input) {
            input.setAttribute('maxlength', fieldLimitsAnexo3[name]);
            addAnexo3Validation(input, (el) => {
                el.value = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                if (el.value.trim()) showFeedback(el, 'Correcto.', true);
                else showFeedback(el, '', false);
            });
        }
    });
    
    // ===== INICIO DEL CAMBIO =====
    const nivelProdInput = anexoForm3.elements['nivel_produccion_anual'];
    if (nivelProdInput) {
        nivelProdInput.setAttribute('maxlength', fieldLimitsAnexo3.nivel_produccion_anual);
        addAnexo3Validation(nivelProdInput, (input) => {
            input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            
            // LÍNEA AÑADIDA: Forzar el límite de caracteres
            if (input.value.length > fieldLimitsAnexo3.nivel_produccion_anual) {
                input.value = input.value.slice(0, fieldLimitsAnexo3.nivel_produccion_anual);
            }

            if (parseFloat(input.value) > 0) showFeedback(input, 'Correcto.', true);
            else if (input.value.length > 0) showFeedback(input, 'Debe ser un número mayor a cero.', false);
            else showFeedback(input, '', false);
        });
    }
    // ===== FIN DEL CAMBIO =====

    const validateNumericQuantity = (input, maxLength) => {
        input.value = input.value.replace(/[^0-9]/g, ''); 
        if (input.value.length > maxLength) {
            showFeedback(input, `Máximo ${maxLength} dígitos.`, false);
        } else if (input.value.length > 0) {
            showFeedback(input, 'Válido.', true);
        } else {
            showFeedback(input, '', false);
        }
    };
    
    anexoForm3.querySelectorAll('.arte-pesca-item input[type="number"]').forEach(input => {
        input.setAttribute('maxlength', fieldLimitsAnexo3.cantidad_arte);
        addAnexo3Validation(input, el => validateNumericQuantity(el, fieldLimitsAnexo3.cantidad_arte));
    });
    
    anexoForm3.querySelectorAll('.cantidad-cell input[type="number"]').forEach(input => {
        input.setAttribute('maxlength', fieldLimitsAnexo3.cantidad_activo);
        addAnexo3Validation(input, el => validateNumericQuantity(el, fieldLimitsAnexo3.cantidad_activo));
    });

    configurarLogicaAnexo3Activos(anexoForm3);

    anexoForm3.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        anexoForm3.querySelectorAll('input').forEach(input => {
            if (!input.disabled && typeof input.oninput === 'function') {
                input.oninput();
            }
        });
        
        const firstInvalid = anexoForm3.querySelector('.invalid');
        if (firstInvalid) {
            showInfoModal('Formulario Incompleto', 'Por favor, revisa y corrige los campos marcados en rojo.', false);
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const formData = new FormData(anexoForm3);
        const dataToSend = {
            datos_tecnicos: {
                lugar_captura: formData.get('lugar_captura'),
                localidad_captura: formData.get('localidad_captura'),
                municipio_captura: formData.get('municipio_captura'),
                sitio_desembarque: formData.get('sitio_desembarque'),
                localidad_desembarque: formData.get('localidad_desembarque'),
                municipio_desembarque: formData.get('municipio_desembarque'),
                tipo_pesqueria: formData.get('tipo_pesqueria'),
                nivel_produccion_anual: formData.get('nivel_produccion_anual'),
                produccion_unidad: formData.get('produccion_unidad'),
                pesqueria: formData.getAll('pesqueria[]'),
                arte_pesca_string: formData.getAll('artes_pesca[]').map(arte => `${arte}:${(formData.get(`cantidad_${arte.toLowerCase().replace(/ /g, '_')}`) || '0').slice(0, fieldLimitsAnexo3.cantidad_arte)}`).join(','),
                especies_objetivo_string: formData.getAll('especies_objetivo[]').join(','),
                certificados_string: formData.getAll('certificados[]').join(',')
            },
            unidad_pesquera: {
                embarcaciones: {
                    madera: { opcion: formData.get('embarcacion_madera_opcion'), cantidad: (formData.get('embarcacion_madera_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                    fibra: { opcion: formData.get('embarcacion_fibra_opcion'), cantidad: (formData.get('embarcacion_fibra_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                    metal: { opcion: formData.get('embarcacion_metal_opcion'), cantidad: (formData.get('embarcacion_metal_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) }
                },
                motores: { opcion: formData.get('motores_opcion'), cantidad: (formData.get('motores_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                sistema_conservacion: {
                    hielera: { opcion: formData.get('conservacion_hielera_opcion'), cantidad: (formData.get('conservacion_hielera_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                    refrigerador: { opcion: formData.get('conservacion_refrigerador_opcion'), cantidad: (formData.get('conservacion_refrigerador_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                    cuarto: { opcion: formData.get('conservacion_cuartofrio_opcion'), cantidad: (formData.get('conservacion_cuartofrio_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) }
                },
                equipo_transporte: {
                    camioneta: { opcion: formData.get('transporte_camioneta_opcion'), cantidad: (formData.get('transporte_camioneta_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                    caja: { opcion: formData.get('transporte_cajafria_opcion'), cantidad: (formData.get('transporte_cajafria_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) },
                    camion: { opcion: formData.get('transporte_camion_opcion'), cantidad: (formData.get('transporte_camion_cantidad') || '0').slice(0, fieldLimitsAnexo3.cantidad_activo) }
                }
            }
        };
        
        try {
            const response = await fetch('/api/anexo3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(dataToSend)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            showInfoModal('¡Éxito!', result.message, true);
        } catch (error) {
            showInfoModal('Error al Guardar', error.message, false);
        }
    });
}