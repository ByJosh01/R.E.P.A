// public/script.js
document.addEventListener('DOMContentLoaded', () => {

    // Lógica para Modo Oscuro (Sin cambios)
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
                localStorage.setItem('theme', 'light');
            }
        };
        const savedTheme = localStorage.getItem('theme') || 'light';
        applyTheme(savedTheme);
        themeToggle.addEventListener('click', () => {
            const currentTheme = body.classList.contains('dark-mode') ? 'light' : 'dark';
            applyTheme(currentTheme);
        });
    }

    // Prevenir Autocompletado (Sin cambios)
    const inputs = document.querySelectorAll('input[readonly]');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            input.readOnly = false;
        });
    });

    // ==========================================================
    // ==== INICIO DE LA MODIFICACIÓN (ANIMACIÓN DE PÁGINA) ====
    // ==========================================================
    const mainContent = document.querySelector('.main-content');
    
    // 1. Mostrar contenido en la carga inicial
    if (mainContent) {
        mainContent.classList.add('visible');
    }

    // 2. Lógica para los enlaces animados (CON MEJORA)
    const animatedLinks = document.querySelectorAll('.animated-link');
    animatedLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            
            // ¡MEJORA! Si el enlace es para una pestaña nueva (target="_blank"),
            // como tu "Aviso de Privacidad", no hacemos la animación.
            if (this.target === '_blank') {
                return; // Deja que el navegador abra la pestaña nueva.
            }

            // Si es un enlace normal, prevenimos la navegación...
            e.preventDefault();
            const destination = this.href;
            
            // ...ocultamos el contenido...
            if (mainContent) {
                mainContent.classList.remove('visible');
            }
            
            // ...y navegamos después de 500ms
            setTimeout(() => {
                window.location.href = destination;
            }, 500); // 500ms = 0.5s de tu animación
        });
    });

    // 3. ¡LA SOLUCIÓN PARA EL BOTÓN "ATRÁS"!
    // El evento 'pageshow' se dispara siempre que la página se muestra,
    // incluyendo cuando se carga desde la caché del botón "Atrás".
    window.addEventListener('pageshow', (event) => {
        // 'event.persisted' es 'true' si la página vino de esa caché
        if (event.persisted && mainContent) {
            // Si venimos del botón "Atrás", forzamos
            // a que el contenido sea visible de nuevo.
            mainContent.classList.add('visible');
        }
    });
    // ==========================================================
    // ==== FIN DE LA MODIFICACIÓN ====
    // ==========================================================


    // Cambio entre Formularios Login/Registro (Sin cambios)
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    if (showRegisterBtn && loginForm && registerForm) {
        showRegisterBtn.addEventListener('click', () => {
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
        });
    }
    if (showLoginBtn && loginForm && registerForm) {
        showLoginBtn.addEventListener('click', () => {
            registerForm.classList.remove('active');
            loginForm.classList.add('active');
        });
    }

    // Mostrar/Ocultar Contraseña (Sin cambios)
    const togglePasswordIcons = document.querySelectorAll('.toggle-password');
    togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
            const passwordInput = icon.previousElementSibling;
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    });

    // --- LÓGICA DE VALIDACIÓN EN TIEMPO REAL --- (Sin cambios)
    const curpInput = document.getElementById('curp-register');
    const emailInput = document.getElementById('email-register');
    const curpFeedback = document.getElementById('curp-feedback');
    const emailFeedback = document.getElementById('email-feedback');

    function debounce(func, delay = 500) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    const validateCurp = () => {
        if (!curpInput || !curpFeedback) return;
        const curp = curpInput.value.trim().toUpperCase();
        curpInput.value = curp;
        curpFeedback.textContent = '';
        curpInput.classList.remove('valid', 'invalid');
        curpFeedback.classList.remove('valid', 'invalid');
        if (curp.length === 0) return;
        if (curp.length === 18) {
            curpInput.classList.add('valid');
            curpFeedback.textContent = 'CURP válido.';
            curpFeedback.classList.add('valid');
        } else {
            curpInput.classList.add('invalid');
            curpFeedback.textContent = `El CURP debe tener 18 caracteres. (${curp.length}/18)`;
            curpFeedback.classList.add('invalid');
        }
    };

    const validateEmail = () => {
        if (!emailInput || !emailFeedback) return;
        const email = emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailFeedback.textContent = '';
        emailInput.classList.remove('valid', 'invalid');
        emailFeedback.classList.remove('valid', 'invalid');
        if (email.length === 0) return;
        if (emailRegex.test(email)) {
            emailInput.classList.add('valid');
            emailFeedback.textContent = 'Correo electrónico válido.';
            emailFeedback.classList.add('valid');
        } else {
            emailInput.classList.add('invalid');
            emailFeedback.textContent = 'Por favor, ingrese un correo válido.';
            emailFeedback.classList.add('invalid');
        }
    };
    
    if (curpInput) { curpInput.addEventListener('input', debounce(validateCurp)); }
    if (emailInput) { emailInput.addEventListener('input', debounce(validateEmail)); }

    const privacyCheckbox = document.getElementById('privacy-policy-checkbox');
    const registerSubmitBtn = document.getElementById('register-submit-btn');

    if (privacyCheckbox && registerSubmitBtn) {
        privacyCheckbox.addEventListener('change', () => {
            if (privacyCheckbox.checked) {
                registerSubmitBtn.disabled = false;
            } else {
                registerSubmitBtn.disabled = true;
            }
        });
    }

    // --- LÓGICA DE REGISTRO CON CONEXIÓN AL BACKEND --- (Sin cambios)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const curp = document.getElementById('curp-register').value.toUpperCase();
            const email = document.getElementById('email-register').value;
            const password = document.getElementById('password-register').value;

            if (!privacyCheckbox.checked) {
                return alert('Debe aceptar el Aviso de Privacidad para continuar.');
            }

            const recaptchaResponse = grecaptcha.getResponse();
            if (!recaptchaResponse) {
                return alert('Por favor, verifica que no eres un robot.');
            }

            if (curp.length !== 18 || !email || !password) {
                alert('Por favor, complete todos los campos correctamente.');
                return;
            }

            const userData = { curp, email, password, recaptchaToken: recaptchaResponse };

            try {
                const response = await fetch('/api/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData),
                });
                
                grecaptcha.reset();

                if (response.ok) {
                    sessionStorage.setItem('registrationEmail', email);
                    window.location.href = '/registro-exitoso.html';
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'Ocurrió un error en el servidor.');
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor. ¿Está encendido?');
            }
        });
    }

    // --- LÓGICA DE LOGIN CON CONEXIÓN AL BACKEND (ACTUALIZADA CON ROLES) --- (Sin cambios)
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const curp = document.getElementById('curp-login').value.toUpperCase();
            const password = document.getElementById('password-login').value;
            if (!curp || !password) {
                alert('Por favor, ingrese su CURP y contraseña.');
                return;
            }
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ curp, password }),
                });
                const result = await response.json();
                if (response.ok) {
                    // Guardamos el token y los datos del usuario
                    localStorage.setItem('authToken', result.token);
                    sessionStorage.setItem('currentUser', JSON.stringify(result.user));
                    
                    // Verificamos el rol que nos envió el backend
                    const rol = result.user.rol;

                    if (rol === 'superadmin') {
                        window.location.href = '/admin.html';
                    } else if (rol === 'admin') {
                        window.location.href = '/panel-admin.html';
                    } else {
                        window.location.href = '/dashboard.html';
                    }
                } else {
                    alert(result.message);
                }
            } catch (error) {
                alert('No se pudo conectar con el servidor. ¿Está encendido?');
            }
        });
    }

    // --- LÓGICA PARA EL FORMULARIO DE RECUPERAR CONTRASEÑA --- (Sin cambios)
    const recoverForm = document.getElementById('recover-form');
    if (recoverForm) {
        recoverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email-recover');
            const email = emailInput.value;
            if (!email) {
                alert('Por favor, ingresa tu correo electrónico.');
                return;
            }
            try {
                const response = await fetch('/api/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                if (response.ok) {
                    window.location.href = 'recuperar-exitoso.html';
                } else {
                    const errorData = await response.json();
                    alert(errorData.message || 'No se pudo procesar la solicitud.');
                }
            } catch (error) {
                console.error('Error de conexión:', error);
                alert('No se pudo conectar con el servidor. ¿Está encendido?');
            }
        });
    }
});