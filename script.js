document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');
    const loginLoader = document.getElementById('loginLoader');
    const registerLoader = document.getElementById('registerLoader');
    
    // Cambiar entre pestañas de login y registro
    loginTab.addEventListener('click', function() {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        clearMessages();
    });
    
    registerTab.addEventListener('click', function() {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        clearMessages();
    });
    
    function clearMessages() {
        loginError.style.display = 'none';
        registerError.style.display = 'none';
        registerSuccess.style.display = 'none';
    }
    
    // Manejar el envío del formulario de login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validación
        if (!email || !password) {
            showError(loginError, 'Por favor, completa todos los campos.');
            return;
        }
        
        // Mostrar loader
        loginLoader.style.display = 'block';
        loginForm.querySelector('span').textContent = '';
        
        try {
            // Simular inicio de sesión con API
            const response = await simulateLoginApiCall('https://api.sistemaembarques.com/login', {
                email: email,
                password: password
            });
            
            // Ocultar loader
            loginLoader.style.display = 'none';
            loginForm.querySelector('span').textContent = 'Iniciar Sesión';
            
            if (response.success) {
                // Guardar datos de usuario (en un caso real usarías métodos seguros)
                localStorage.setItem('user', JSON.stringify({
                    name: response.userName,
                    email: email,
                    company: response.company
                }));
                
                // Redirigir al dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Error en el login
                showError(loginError, response.message || 'Error en el inicio de sesión. Verifica tus credenciales.');
            }
        } catch (error) {
            // Ocultar loader y mostrar error
            loginLoader.style.display = 'none';
            loginForm.querySelector('span').textContent = 'Iniciar Sesión';
            showError(loginError, 'Error de conexión. Inténtalo de nuevo.');
        }
    });
    
    // Manejar el envío del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const company = document.getElementById('company').value;
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const terms = document.getElementById('terms').checked;
        
        // Validaciones
        clearMessages();
        
        if (!name || !company || !email || !password || !confirmPassword) {
            showError(registerError, 'Por favor, completa todos los campos.');
            return;
        }
        
        if (!terms) {
            showError(registerError, 'Debes aceptar los términos y condiciones.');
            return;
        }
        
        if (password !== confirmPassword) {
            showError(registerError, 'Las contraseñas no coinciden.');
            return;
        }
        
        if (password.length < 8) {
            showError(registerError, 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        
        // Mostrar loader
        registerLoader.style.display = 'block';
        registerForm.querySelector('span').textContent = '';
        
        // Crear objeto con datos del usuario
        const userData = {
            name: name,
            company: company,
            email: email,
            password: password
        };
        
        try {
            // Enviar datos a la API (simulado)
            const response = await simulateApiCall('https://api.sistemaembarques.com/register', userData);
            
            // Ocultar loader
            registerLoader.style.display = 'none';
            registerForm.querySelector('span').textContent = 'Crear Cuenta';
            
            if (response.success) {
                // Mostrar mensaje de éxito
                showSuccess(registerSuccess, response.message || '¡Cuenta creada con éxito! Ahora puedes iniciar sesión.');
                
                // Limpiar formulario después de registro exitoso
                registerForm.reset();
                
                // Cambiar a pestaña de login después de 2 segundos
                setTimeout(() => {
                    loginTab.click();
                }, 2000);
            } else {
                showError(registerError, response.message || 'Error en el registro. Inténtalo de nuevo.');
            }
        } catch (error) {
            // Ocultar loader y mostrar error
            registerLoader.style.display = 'none';
            registerForm.querySelector('span').textContent = 'Crear Cuenta';
            showError(registerError, 'Error de conexión. Inténtalo de nuevo.');
        }
    });
    
    function showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    function showSuccess(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }
    
    // Función para simular una llamada a la API de registro
    async function simulateApiCall(url, data) {
        // En una implementación real, usarías fetch o axios
        console.log('Enviando datos de registro a la API:', data);
        
        // Simulamos un retraso de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulamos una respuesta exitosa (en un caso real, esto vendría del servidor)
        return {
            success: true,
            message: 'Usuario registrado con éxito. Bienvenido al Sistema de Embarques.'
        };
    }
    
    // Función para simular una llamada a la API de login
    async function simulateLoginApiCall(url, data) {
        // En una implementación real, usarías fetch o axios
        console.log('Enviando datos de login a la API:', data);
        
        // Simulamos un retraso de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulamos una respuesta exitosa (en un caso real, esto vendría del servidor)
        return {
            success: true,
            message: 'Login exitoso',
            userName: data.email.split('@')[0],
            company: 'Empresa de Embarques Ejemplo'
        };
    }
});
