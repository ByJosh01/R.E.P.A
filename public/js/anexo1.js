// public/js/anexo1.js
import { showFeedback, isValidRFC, isValidCURP, isValidEmail } from './utils.js';

/**
 * Carga los datos existentes del Anexo 1 en el formulario.
 * @param {string} authToken - El token de autenticación del usuario.
 */
export async function cargarDatosAnexo1(authToken) {
    const anexoForm1 = document.getElementById('solicitante-form');
    if (!anexoForm1) return;
    try {
        const response = await fetch('/api/perfil', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!response.ok) return; 
        
        const perfil = await response.json();
        if (!perfil) return;
        
        // ==========================================================
        // == INICIO DEL CAMBIO: AQUÍ ESTÁ LA SOLUCIÓN ==
        // ==========================================================
        // Si no existe una fecha de actualización en el perfil,
        // le asignamos la fecha de hoy por defecto.
        if (!perfil.fecha_actualizacion_formateada) {
            const today = new Date();
            // Formateamos la fecha a YYYY-MM-DD para el input[type="date"]
            perfil.fecha_actualizacion_formateada = today.toISOString().split('T')[0];
        }
        // ==========================================================
        // == FIN DEL CAMBIO
        // ==========================================================
        
        const mapping = {
            nombre: 'nombre', apellidoPaterno: 'apellido_paterno', apellidoMaterno: 'apellido_materno',
            rfc: 'rfc', curp: 'curp', telefono: 'telefono', email: 'correo_electronico',
            representanteLegal: 'nombre_representante_legal', entidad: 'entidad_federativa',
            municipio: 'municipio', localidad: 'localidad', colonia: 'colonia', cp: 'codigo_postal',
            calle: 'calle', numExterior: 'no_exterior', numInterior: 'no_interior', numIntegrantes: 'numero_integrantes',
            fecha: 'fecha_actualizacion_formateada' 
        };

        for (const formKey in mapping) {
            const dbKey = mapping[formKey];
            const element = anexoForm1.elements[formKey];
            if (element && perfil[dbKey] != null) {
                element.value = perfil[dbKey];
            }
        }
        if (perfil.actividad) {
            const radio = anexoForm1.querySelector(`input[name="actividad"][value="${perfil.actividad}"]`);
            if (radio) radio.checked = true;
        }
    } catch (error) {
        console.error('Error al cargar datos del Anexo 1:', error);
    }
}

/**
 * Inicializa toda la lógica de validación y envío para el formulario del Anexo 1.
 */
export function initAnexo1(authToken, showInfoModal) {
    const anexoForm1 = document.getElementById('solicitante-form');
    if (!anexoForm1) return;

    // ... (El resto del archivo initAnexo1 se queda exactamente igual)
    const fieldLimits = {
        expediente: 20, nombre: 50, apellidoPaterno: 50, apellidoMaterno: 50,
        rfc: 13, curp: 18, telefono: 10, email: 60,
        representanteLegal: 150, entidad: 50, municipio: 50,
        localidad: 50, colonia: 50, cp: 5, calle: 100,
        numExterior: 10, numInterior: 10, numIntegrantes: 3
    };

    for (const fieldName in fieldLimits) {
        const input = anexoForm1.elements[fieldName];
        if (input) {
            input.setAttribute('maxlength', fieldLimits[fieldName]);
        }
    }

    const addRealtimeValidation = (inputName, validationFn) => {
        const input = anexoForm1.elements[inputName];
        if (input) {
            input.oninput = () => validationFn(input); 
            input.addEventListener('input', input.oninput);
        }
    };

    ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'representanteLegal', 'entidad', 'municipio', 'localidad', 'colonia'].forEach(name => {
        addRealtimeValidation(name, (input) => {
            input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
            if (input.required && !input.value.trim()) showFeedback(input, 'Este campo es obligatorio.', false);
            else if (input.value.trim().length > 0) showFeedback(input, 'Correcto.', true);
            else showFeedback(input, '', false);
        });
    });
    
    addRealtimeValidation('calle', (input) => {
        input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, '');
        if (input.required && !input.value.trim()) showFeedback(input, 'Este campo es obligatorio.', false);
        else if (input.value.trim().length > 0) showFeedback(input, 'Correcto.', true);
        else showFeedback(input, '', false);
    });

    addRealtimeValidation('rfc', (input) => {
        input.value = input.value.toUpperCase();
        if (!input.value && input.required) showFeedback(input, 'Este campo es obligatorio.', false);
        else if (isValidRFC(input.value)) showFeedback(input, 'RFC válido.', true);
        else showFeedback(input, 'Formato de RFC incorrecto.', false);
    });

    addRealtimeValidation('curp', (input) => {
        input.value = input.value.toUpperCase();
        if (!input.value && input.required) showFeedback(input, 'Este campo es obligatorio.', false);
        else if (isValidCURP(input.value)) showFeedback(input, 'CURP válido.', true);
        else showFeedback(input, 'Formato de CURP incorrecto.', false);
    });

    addRealtimeValidation('email', (input) => {
        if (!input.value && input.required) showFeedback(input, 'Este campo es obligatorio.', false);
        else if (isValidEmail(input.value)) showFeedback(input, 'Correo válido.', true);
        else showFeedback(input, 'Formato de correo incorrecto.', false);
    });
    
    addRealtimeValidation('numExterior', (input) => {
        input.value = input.value.replace(/[^a-zA-Z0-9\s]/g, '');
        if (input.required && !input.value.trim()) showFeedback(input, 'Este campo es obligatorio.', false);
        else if (input.value.trim().length > 0) showFeedback(input, 'Correcto.', true);
        else showFeedback(input, '', false);
    });

    addRealtimeValidation('numInterior', (input) => {
        input.value = input.value.replace(/[^a-zA-Z0-9\s]/g, '');
    });

    addRealtimeValidation('telefono', (input) => {
        input.value = input.value.replace(/[^0-9]/g, '');
        if (input.value.length > 0 && input.value.length !== 10) showFeedback(input, 'El teléfono debe tener 10 dígitos.', false);
        else if (input.value.length === 10) showFeedback(input, 'Correcto.', true);
        else showFeedback(input, '', false);
    });

    addRealtimeValidation('cp', (input) => {
        input.value = input.value.replace(/[^0-9]/g, '');
        if (!input.value && input.required) showFeedback(input, 'Este campo es obligatorio.', false);
        else if (input.value.length > 0 && input.value.length !== 5) showFeedback(input, 'El C.P. debe tener 5 dígitos.', false);
        else if (input.value.length === 5) showFeedback(input, 'Correcto.', true);
        else showFeedback(input, '', false);
    });

    addRealtimeValidation('numIntegrantes', (input) => {
        input.value = input.value.replace(/[^0-9]/g, '');
        const valueAsNumber = parseInt(input.value, 10);
        if (input.value === '') showFeedback(input, '', false);
        else if (valueAsNumber === 0) showFeedback(input, 'No puede ser cero.', false);
        else showFeedback(input, 'Correcto.', true);
    });

    anexoForm1.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        anexoForm1.querySelectorAll('input').forEach(input => {
            if (typeof input.oninput === 'function') {
                input.oninput();
            }
        });
        
        const firstInvalidElement = anexoForm1.querySelector('.invalid');
        if (firstInvalidElement) {
            showInfoModal('Formulario Incompleto', 'Por favor, revisa y corrige los campos marcados en rojo.', false);
            firstInvalidElement.focus();
            firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const anexoData = Object.fromEntries(new FormData(anexoForm1).entries());
        try {
            const response = await fetch('/api/anexo1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(anexoData)
            });
            const result = await response.json();
            if (!response.ok) {
                showInfoModal(result.field || 'Error de Validación', result.message, false);
            } else {
                showInfoModal('¡Éxito!', result.message, true, () => { 
                    window.location.reload(); 
                });
            }
        } catch (networkError) {
            showInfoModal('Error de Conexión', 'No se pudo comunicar con el servidor.', false);
        }
    });
}