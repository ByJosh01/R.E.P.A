// public/js/anexo4.js
import { showFeedback } from './utils.js';

const configurarLogicaAnexo4Activos = (anexoForm4) => {
    if (!anexoForm4) return;
    const prefijosActivos = [
        'estanque_rustico', 'estanque_geomembrana', 'estanque_concreto',
        'instrumento_temperatura', 'instrumento_oxigeno', 'instrumento_ph',
        'conservacion_hielera', 'conservacion_refrigerador', 'conservacion_cuartofrio',
        'transporte_lancha', 'transporte_camioneta', 'transporte_cajafria',
        'embarcacion_madera', 'embarcacion_fibra_vidrio', 'embarcacion_metal',
        'hidraulica_bomba', 'hidraulica_aireador'
    ];
    prefijosActivos.forEach(prefijo => {
        const grupoRadios = anexoForm4.querySelectorAll(`input[name="${prefijo}_opcion"]`);
        const radioNo = anexoForm4.querySelector(`input[name="${prefijo}_opcion"][value="no"]`);
        const inputsAsociados = anexoForm4.querySelectorAll(`input[name^="${prefijo}_cantidad"], input[name^="${prefijo}_dimensiones"]`);
        if (grupoRadios.length > 0 && inputsAsociados.length > 0 && radioNo) {
            const actualizarEstado = () => {
                const debeDeshabilitar = radioNo.checked;
                inputsAsociados.forEach(input => {
                    input.disabled = debeDeshabilitar;
                    if (debeDeshabilitar) {
                        input.value = '';
                        input.classList.remove('invalid', 'valid');
                        showFeedback(input, '', true);
                    }
                });
            };
            grupoRadios.forEach(radio => radio.addEventListener('change', actualizarEstado));
            actualizarEstado();
        }
    });
};

export async function cargarDatosAnexo4(authToken) {
    const anexoForm4 = document.getElementById('anexo4-acuacultura-form');
    if (!anexoForm4) return;
    try {
        const response = await fetch('/api/anexos/acuacultura', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!response.ok) throw new Error('No se pudieron obtener los datos.');
        const data = await response.json();
        if (!data) {
            configurarLogicaAnexo4Activos(anexoForm4); 
            return;
        }
    
        const setInputValue = (name, value) => {
            if (anexoForm4.elements[name]) {
                anexoForm4.elements[name].value = value || '';
            }
        };
        const setRadioValue = (name, value) => {
            const valueToSelect = value ? 'si' : 'no';
            const radio = anexoForm4.querySelector(`input[name="${name}"][value="${valueToSelect}"]`);
            if (radio) radio.checked = true;
        };
        const setRadioValueWithString = (name, dbValue) => {
            if (dbValue === null || dbValue === undefined) return;
            const radio = anexoForm4.querySelector(`input[name="${name}"][value="${dbValue}"]`);
            if (radio) radio.checked = true;
        };
    
        setRadioValue('instalacionPropia', data.instalacion_propia === 'si');
        setInputValue('contratoArrendamientoAnos', data.contrato_arrendamiento_anios);
        setInputValue('dimensionesUnidad', data.dimensiones_unidad_produccion);
        setRadioValueWithString('tipo', data.tipo);
        setRadioValueWithString('tipoInstalacion', data.tipo_instalacion);
        setRadioValueWithString('sistemaProduccion', data.sistema_produccion);
        setInputValue('produccionAnualValor', data.produccion_anual_valor);
        setRadioValueWithString('produccionAnualUnidad', data.produccion_anual_unidad);

        if (data.especies) {
            let parsedEspecies = typeof data.especies === 'string' ? JSON.parse(data.especies) : data.especies || {};
            if (parsedEspecies.seleccionadas && Array.isArray(parsedEspecies.seleccionadas)) {
                parsedEspecies.seleccionadas.forEach(val => {
                    const chk = anexoForm4.querySelector(`input[name="especies"][value="${val}"]`);
                    if (chk) chk.checked = true;
                });
            }
            setInputValue('especiesOtras', parsedEspecies.otras || '');
        }

        if (data.certificados) {
            let parsedCerts = typeof data.certificados === 'string' ? JSON.parse(data.certificados) : data.certificados || {};

            anexoForm4.querySelectorAll('input[name="certificados"]').forEach(chk => chk.checked = false);

            if (parsedCerts.hasOwnProperty('ninguno')) {
                const ningunoChk = anexoForm4.querySelector('input[name="certificados"][value="ninguno"]');
                if (ningunoChk) ningunoChk.checked = true;
            } else {
                for (const key in parsedCerts) {
                    if (parsedCerts[key]) {
                        const chk = anexoForm4.querySelector(`input[name="certificados"][value="${key}"]`);
                        if (chk) chk.checked = true;
                    }
                }
            }

            setInputValue('certificadoSanidadCual', parsedCerts.sanidad);
            setInputValue('certificadoInocuidadCual', parsedCerts.inocuidad);
            setInputValue('certificadoBuenasPracticasCual', parsedCerts.buenas_practicas);
            setInputValue('certificadoOtrosCual', parsedCerts.otros);
        }
        
        setRadioValue('estanque_rustico_opcion', data.rustico); setInputValue('estanque_rustico_cantidad', data.rustico_cantidad); setInputValue('estanque_rustico_dimensiones', data.rustico_dimensiones);
        setRadioValue('estanque_geomembrana_opcion', data.geomembrana); setInputValue('estanque_geomembrana_cantidad', data.geomembrana_cantidad); setInputValue('estanque_geomembrana_dimensiones', data.geomembrana_dimensiones);
        setRadioValue('estanque_concreto_opcion', data.concreto); setInputValue('estanque_concreto_cantidad', data.concreto_cantidad); setInputValue('estanque_concreto_dimensiones', data.concreto_dimensiones);
        setRadioValue('instrumento_temperatura_opcion', data.instrumento_temperatura); setInputValue('instrumento_temperatura_cantidad', data.instrumento_temperatura_cantidad);
        setRadioValue('instrumento_oxigeno_opcion', data.instrumento_oxigeno); setInputValue('instrumento_oxigeno_cantidad', data.instrumento_oxigeno_cantidad);
        setRadioValue('instrumento_ph_opcion', data.instrumento_ph); setInputValue('instrumento_ph_cantidad', data.instrumento_ph_cantidad);
        setRadioValue('conservacion_hielera_opcion', data.conservacion_hielera); setInputValue('conservacion_hielera_cantidad', data.conservacion_hielera_cantidad);
        setRadioValue('conservacion_refrigerador_opcion', data.conservacion_refrigerado); setInputValue('conservacion_refrigerador_cantidad', data.conservacion_refrigerado_cantidad);
        setRadioValue('conservacion_cuartofrio_opcion', data.conservacion_cuartofrio); setInputValue('conservacion_cuartofrio_cantidad', data.conservacion_cuartofrio_cantidad);
        setRadioValue('transporte_lancha_opcion', data.transporte_lancha); setInputValue('transporte_lancha_cantidad', data.transporte_lancha_cantidad);
        setRadioValue('transporte_camioneta_opcion', data.transporte_camioneta); setInputValue('transporte_camioneta_cantidad', data.transporte_camioneta_cantidad);
        setRadioValue('transporte_cajafria_opcion', data.transporte_cajafria); setInputValue('transporte_cajafria_cantidad', data.transporte_cajafria_cantidad);
        setRadioValue('embarcacion_madera_opcion', data.embarcacion_madera); setInputValue('embarcacion_madera_cantidad', data.embarcacion_madera_cantidad);
        setRadioValue('embarcacion_fibra_vidrio_opcion', data.embarcacion_fibra_vidrio); setInputValue('embarcacion_fibra_vidrio_cantidad', data.embarcacion_fibra_vidrio_cantidad);
        setRadioValue('embarcacion_metal_opcion', data.embarcacion_metal); setInputValue('embarcacion_metal_cantidad', data.embarcacion_metal_cantidad);
        setRadioValue('hidraulica_bomba_opcion', data.hidraulica_bomba_agua); setInputValue('hidraulica_bomba_cantidad', data.hidraulica_bomba_agua_cantidad);
        setRadioValue('hidraulica_aireador_opcion', data.hidraulica_aireador); setInputValue('hidraulica_aireador_cantidad', data.hidraulica_aireador_cantidad);

        configurarLogicaAnexo4Activos(anexoForm4);

    } catch (error) {
        console.error("Error al cargar datos del Anexo 4:", error);
    }
}

export function initAnexo4(authToken, showInfoModal) {
    const anexoForm4 = document.getElementById('anexo4-acuacultura-form');
    if (!anexoForm4) return;

    const setupAnexo4ValidationUI = () => {
        anexoForm4.querySelectorAll('.anexo-field input, .anexo-table input').forEach(input => {
            let parent = input.closest('td');
            if (!parent) parent = input.closest('.anexo-field');
            if (parent && !parent.querySelector('.feedback-message')) {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'feedback-message';
                parent.appendChild(feedbackDiv);
            }
        });
    };

    const fieldLimitsAnexo4 = {
        contratoArrendamientoAnos: 2,
        dimensionesUnidad: 100,
        produccionAnualValor: 15,
        especiesOtras: 100,
        certificadoCual: 100,
        cantidad: 3,
        dimensiones: 50
        
    };

    const addAnexo4Validation = (element, validationLogic) => {
        element.oninput = () => validationLogic(element);
        element.addEventListener('input', element.oninput);
    };
    
    ['dimensionesUnidad', 'especiesOtras', 'certificadoSanidadCual', 'certificadoInocuidadCual', 'certificadoBuenasPracticasCual', 'certificadoOtrosCual'].forEach(name => {
        const input = anexoForm4.elements[name];
        if (input) {
            const limit = name.includes('certificado') ? fieldLimitsAnexo4.certificadoCual : fieldLimitsAnexo4[name];
            input.setAttribute('maxlength', limit);
            addAnexo4Validation(input, el => {
                if (el.value.trim().length > 0) {
                     showFeedback(el, 'Correcto.', true);
                } else {
                     showFeedback(el, '', false);
                }
            });
        }
    });
    
    const validateNumeric = (input, maxLength, allowDecimal = false) => {
        input.value = allowDecimal ? input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1') : input.value.replace(/[^0-9]/g, '');
        if (input.value.length > maxLength) {
            input.value = input.value.slice(0, maxLength);
        }
        if (parseFloat(input.value) > 0) {
            showFeedback(input, 'Válido.', true);
        } else if (input.value.length > 0) {
            showFeedback(input, 'Debe ser > 0.', false);
        } else {
            showFeedback(input, '', false);
        }
    };
    
    const contratoInput = anexoForm4.elements['contratoArrendamientoAnos'];
    if (contratoInput) {
        contratoInput.setAttribute('maxlength', fieldLimitsAnexo4.contratoArrendamientoAnos);
        addAnexo4Validation(contratoInput, el => validateNumeric(el, fieldLimitsAnexo4.contratoArrendamientoAnos));
    }
    
    const produccionInput = anexoForm4.elements['produccionAnualValor'];
    if (produccionInput) {
        produccionInput.setAttribute('maxlength', fieldLimitsAnexo4.produccionAnualValor);
        addAnexo4Validation(produccionInput, el => validateNumeric(el, fieldLimitsAnexo4.produccionAnualValor, true));
    }
    
    anexoForm4.querySelectorAll('input[name*="_cantidad"]').forEach(input => {
        input.setAttribute('maxlength', fieldLimitsAnexo4.cantidad);
        addAnexo4Validation(input, el => validateNumeric(el, fieldLimitsAnexo4.cantidad));
    });

    anexoForm4.querySelectorAll('input[name*="_dimensiones"]').forEach(input => {
        input.setAttribute('maxlength', fieldLimitsAnexo4.dimensiones);
        addAnexo4Validation(input, (el) => {
            if (el.value.trim().length > 0) {
                showFeedback(el, 'Correcto.', true);
            } else {
                showFeedback(el, '', false);
            }
        });
    });

    const certCheckboxes = anexoForm4.querySelectorAll('input[name="certificados"]');
    const ningunoCheckbox = anexoForm4.querySelector('input[name="certificados"][value="ninguno"]');
    const otrosCertTextInputs = anexoForm4.querySelectorAll('input[name^="certificado"][name$="Cual"]');

    certCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const changedCheckbox = e.target;
            if (changedCheckbox === ningunoCheckbox && changedCheckbox.checked) {
                certCheckboxes.forEach(cb => {
                    if (cb !== ningunoCheckbox) cb.checked = false;
                });
                otrosCertTextInputs.forEach(input => input.value = '');
            } else if (changedCheckbox !== ningunoCheckbox && changedCheckbox.checked) {
                if (ningunoCheckbox) ningunoCheckbox.checked = false;
            }
        });
    });

    setupAnexo4ValidationUI();
    configurarLogicaAnexo4Activos(anexoForm4);

    anexoForm4.addEventListener('submit', async (e) => {
        e.preventDefault();

        anexoForm4.querySelectorAll('input').forEach(input => {
            if (!input.disabled && typeof input.oninput === 'function') {
               input.oninput();
            }
        });

        const firstInvalidElement = anexoForm4.querySelector('.invalid');
        if (firstInvalidElement) {
            showInfoModal('Formulario Incompleto', 'Por favor, revisa y corrige los campos marcados en rojo.', false);
            firstInvalidElement.focus();
            firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const formData = new FormData(anexoForm4);
        const dataToSend = Object.fromEntries(formData.entries());
        dataToSend.especies = formData.getAll('especies');
        dataToSend.certificados = formData.getAll('certificados');
        
        try {
            const response = await fetch('/api/anexos/acuacultura', {
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