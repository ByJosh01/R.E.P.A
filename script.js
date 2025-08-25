document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const registerSuccess = document.getElementById('registerSuccess');
    const loginLoader = document.getElementById('loginLoader');
    const registerLoader = document.getElementById('registerLoader');
    const formTitle = document.getElementById('formTitle');
    const formSubtitle = document.getElementById('formSubtitle');
    
    // Alternar entre formularios de login y registro
    showRegisterBtn.addEventListener('click', function(e) {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        formTitle.textContent = 'Crear una cuenta de Google';
        formSubtitle.textContent = 'Continúa con YouTube, Gmail y Google Play';
    });
    
    showLoginBtn.addEventListener('click', function(e) {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        formTitle.textContent = 'Iniciar sesión';
        formSubtitle.textContent = 'Utiliza tu Cuenta de Google';
    });
    
    // Manejar el envío del formulario de login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Validación simple
        if (!email || !password) {
            loginError.textContent = 'Por favor, completa todos los campos.';
            loginError.style.display = 'block';
            return;
        }
        
        // Mostrar loader y ocultar errores
        loginLoader.style.display = 'inline-block';
        loginError.style.display = 'none';
        
        try {
            // Simular inicio de sesión con API
            const response = await simulateLoginApiCall('https://api.example.com/login', {
                email: email,
                password: password
            });
            
            // Ocultar loader
            loginLoader.style.display = 'none';
            
            if (response.success) {
                // Éxito en el login
                alert('Inicio de sesión exitoso. Bienvenido ' + response.userName);
                // Aquí normalmente redirigirías al usuario a su dashboard
            } else {
                // Error en el login
                loginError.textContent = response.message || 'Error en el inicio de sesión.';
                loginError.style.display = 'block';
            }
        } catch (error) {
            // Ocultar loader y mostrar error
            loginLoader.style.display = 'none';
            loginError.textContent = 'Error de conexión. Inténtalo de nuevo.';
            loginError.style.display = 'block';
        }
    });
    
    // Manejar el envío del formulario de registro
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('newEmail').value;
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validaciones
        registerError.style.display = 'none';
        registerSuccess.style.display = 'none';
        
        if (!name || !email || !password || !confirmPassword) {
            registerError.textContent = 'Por favor, completa todos los campos.';
            registerError.style.display = 'block';
            return;
        }
        
        if (password !== confirmPassword) {
            registerError.textContent = 'Las contraseñas no coinciden.';
            registerError.style.display = 'block';
            return;
        }
        
        if (password.length < 8) {
            registerError.textContent = 'La contraseña debe tener al menos 8 caracteres.';
            registerError.style.display = 'block';
            return;
        }
        
        // Mostrar loader
        registerLoader.style.display = 'inline-block';
        
        // Crear objeto con datos del usuario
        const userData = {
            name: name,
            email: email,
            password: password
        };
        
        try {
            // Enviar datos a la API (simulado)
            const response = await simulateApiCall('https://api.example.com/register', userData);
            
            // Ocultar loader
            registerLoader.style.display = 'none';
            
            if (response.success) {
                registerSuccess.textContent = response.message || '¡Cuenta creada con éxito!';
                registerSuccess.style.display = 'block';
                registerError.style.display = 'none';
                
                // Limpiar formulario después de registro exitoso
                registerForm.reset();
                
                // Volver al formulario de login después de 2 segundos
                setTimeout(() => {
                    registerForm.style.display = 'none';
                    loginForm.style.display = 'block';
                    formTitle.textContent = 'Iniciar sesión';
                    formSubtitle.textContent = 'Utiliza tu Cuenta de Google';
                }, 2000);
            } else {
                registerError.textContent = response.message || 'Error en el registro. Inténtalo de nuevo.';
                registerError.style.display = 'block';
            }
        } catch (error) {
            // Ocultar loader y mostrar error
            registerLoader.style.display = 'none';
            registerError.textContent = 'Error de conexión. Inténtalo de nuevo.';
            registerError.style.display = 'block';
        }
    });
    
    // Función para simular una llamada a la API de registro
    async function simulateApiCall(url, data) {
        // En una implementación real, usarías fetch o axios
        console.log('Enviando datos de registro a la API:', data);
        
        // Simulamos un retraso de red
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulamos una respuesta exitosa (en un caso real, esto vendría del servidor)
        return {
            success: true,
            message: 'Usuario registrado con éxito'
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
            userName: data.email.split('@')[0]
        };
    }
});