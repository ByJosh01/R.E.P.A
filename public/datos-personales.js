// public/datos-personales.js
document.addEventListener('DOMContentLoaded', () => {
    // --- LÓGICA DE LA INTERFAZ (UI) ---
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    if (themeToggle) {
        const themeIcon = themeToggle.querySelector('i');
        const applyTheme = (theme) => {
            if (theme === 'dark') {
                body.classList.add('dark-mode');
                if (themeIcon) { themeIcon.classList.remove('fa-moon'); themeIcon.classList.add('fa-sun'); }
                localStorage.setItem('theme', 'dark');
            } else {
                body.classList.remove('dark-mode');
                if (themeIcon) { themeIcon.classList.remove('fa-sun'); themeIcon.classList.add('fa-moon'); }
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
    const openBtn = document.getElementById('sidebar-open-btn');
    const closeBtn = document.getElementById('sidebar-close-btn');
    const overlay = document.getElementById('sidebar-overlay');
    if (window.innerWidth > 992) { document.body.classList.add('sidebar-open'); }
    if (openBtn && closeBtn && overlay) {
        openBtn.addEventListener('click', () => { document.body.classList.toggle('sidebar-open'); });
        closeBtn.addEventListener('click', () => { document.body.classList.remove('sidebar-open'); });
        overlay.addEventListener('click', () => { document.body.classList.remove('sidebar-open'); });
    }

    // --- LÓGICA DE AUTENTICACIÓN Y DATOS ---
    const authToken = localStorage.getItem('authToken');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

    if (!authToken || !currentUser) {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'home.html';
        return;
    }

    const logoutBtn = document.getElementById('logout-btn-sidebar');
    const logoutModal = document.getElementById('logout-modal');
    if (logoutBtn && logoutModal) {
        const cancelLogoutBtn = document.getElementById('cancel-logout-btn');
        const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('visible');
        });

        const closeModal = () => {
            logoutModal.classList.remove('visible');
        };

        cancelLogoutBtn.addEventListener('click', closeModal);
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                closeModal();
            }
        });

        confirmLogoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            window.location.href = 'home.html';
        });
    }

    document.getElementById('sidebar-user-name').textContent = currentUser.email || 'Cargando...';
    document.getElementById('user-email-summary').textContent = currentUser.email || 'Cargando...';
    document.getElementById('user-curp-summary').textContent = currentUser.curp || 'Cargando...';
    
    const cargarDatosDelPerfil = async () => {
        try {
            const response = await fetch('/api/perfil', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!response.ok) throw new Error('No se pudieron cargar los datos del perfil.');
            
            const perfil = await response.json();

            if (!perfil) {
                console.log("Perfil no encontrado para el usuario.");
                return;
            }

            const nombreCompleto = [perfil.nombre, perfil.apellido_paterno, perfil.apellido_materno].filter(Boolean).join(' ');
            
            document.getElementById('sidebar-user-name').textContent = perfil.correo_electronico || currentUser.email;
            document.getElementById('user-email-summary').textContent = perfil.correo_electronico || currentUser.email;
            document.getElementById('user-curp-summary').textContent = perfil.curp || currentUser.curp;
            
            document.getElementById('razon-social-summary').textContent = nombreCompleto || 'No registrado';
            document.getElementById('municipio-summary').textContent = perfil.municipio || 'No registrado';
            
            actualizarEstadoAnexos(perfil);

        } catch (error) {
            alert(error.message);
            console.error("Fallo al cargar perfil completo:", error);
        }
    };

    const actualizarEstadoAnexos = (perfil) => {
        const anexo1Card = document.getElementById('anexo1-card');
        const anexo2Card = document.getElementById('anexo2-card');
        const anexo3Card = document.getElementById('anexo3-card');
        const anexo4Card = document.getElementById('anexo4-card');
        const anexo5Card = document.getElementById('anexo5-card');

        const anexo1Badge = anexo1Card.querySelector('.status-badge');
        const anexo2Badge = anexo2Card.querySelector('.status-badge');
        const anexo3Badge = anexo3Card.querySelector('.status-badge');
        const anexo4Badge = anexo4Card.querySelector('.status-badge');
        const anexo5Badge = anexo5Card.querySelector('.status-badge');

        const setStatus = (card, badge, text, statusClass, isEnabled) => {
            badge.textContent = text;
            badge.className = 'status-badge'; 
            if (statusClass) {
                badge.classList.add(statusClass);
            }

            if (isEnabled) {
                card.classList.remove('disabled');
            } else {
                card.classList.add('disabled');
            }
        };

        const actividad = perfil.actividad;
        
        if (anexo3Card) anexo3Card.style.display = 'block';
        if (anexo4Card) anexo4Card.style.display = 'block';

        if (actividad === 'pesca') {
            if (anexo4Card) anexo4Card.style.display = 'none';
        } else if (actividad === 'acuacultura') {
            if (anexo3Card) anexo3Card.style.display = 'none';
        }
        
        if (perfil.anexo1_completo) {
            setStatus(anexo1Card, anexo1Badge, 'Completo', 'status-complete', true);
            
            setStatus(anexo2Card, anexo2Badge, 'Disponible', 'status-available', true);
            setStatus(anexo3Card, anexo3Badge, 'Disponible', 'status-available', true);
            setStatus(anexo4Card, anexo4Badge, 'Disponible', 'status-available', true);
            setStatus(anexo5Card, anexo5Badge, 'Disponible', 'status-available', true);

        } else {
            setStatus(anexo1Card, anexo1Badge, 'Incompleto', 'status-incomplete', true);
            setStatus(anexo2Card, anexo2Badge, 'Bloqueado', '', false);
            setStatus(anexo3Card, anexo3Badge, 'Bloqueado', '', false);
            setStatus(anexo4Card, anexo4Badge, 'Bloqueado', '', false);
            setStatus(anexo5Card, anexo5Badge, 'Bloqueado', '', false);
        }
    };
    
    cargarDatosDelPerfil();
});