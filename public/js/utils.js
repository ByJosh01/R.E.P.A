// public/js/utils.js

/**
 * Muestra retroalimentación visual (válido/inválido) para un campo de formulario.
 * @param {HTMLElement} inputElement - El campo del formulario.
 * @param {string} message - El mensaje a mostrar.
 * @param {boolean} isValid - True si es válido, false si es inválido.
 */
export function showFeedback(inputElement, message, isValid) {
    if (!inputElement) return;
    let feedbackElement = inputElement.nextElementSibling;
    
    if (!feedbackElement || !feedbackElement.classList.contains('feedback-message')) {
        const parent = inputElement.closest('.anexo-field, .cantidad-cell');
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
}

// Funciones de validación con Expresiones Regulares
export const isValidRFC = (rfc) => /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/.test(rfc);
export const isValidCURP = (curp) => /^[A-Z]{1}[AEIOU]{1}[A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])[HM]{1}(AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]{1}[0-9]{1}$/.test(curp);
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- NUEVA FUNCIÓN DE LOGOUT ---
/**
 * Cierra la sesión del usuario de manera segura y redirige.
 */
export function logoutUser() {
    // 1. Borrar credenciales
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');

    // 2. Redirección "Destructiva"
    // .replace() reemplaza la entrada actual en el historial.
    // Esto hace más difícil regresar con el botón "Atrás".
    window.location.replace('/home.html');
}