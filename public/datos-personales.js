// public/datos-personales.js

// SI usaste la configuración de módulos (type="module") en tu HTML, 
// descomenta la siguiente línea:
// import { logoutUser } from './utils.js'; 

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

    // Verificación inicial: Si no hay datos, ¡fuera!
    if (!authToken || !currentUser) {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        window.location.replace('/home.html'); // <--- CAMBIO: Usar replace aquí también
        return;
    }

    // --- MODAL DE CERRAR SESIÓN (AQUÍ ESTÁ EL CAMBIO CLAVE) ---
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

        // ▼▼▼ ESTA ES LA PARTE QUE CORRIGE EL PROBLEMA DEL "ATRÁS" ▼▼▼
        confirmLogoutBtn.addEventListener('click', () => {
            // 1. Borramos credenciales
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('authToken');
            
            // 2. REDIRECCIÓN DESTRUCTIVA
            // .replace() borra la página actual del historial.
            // Si el usuario intenta dar "Atrás", no volverá aquí.
            window.location.replace('/home.html'); 
        });
        // ▲▲▲ FIN DE LA CORRECCIÓN ▲▲▲
    }

    document.getElementById('sidebar-user-name').textContent = currentUser.email || 'Cargando...';
    document.getElementById('user-email-summary').textContent = currentUser.email || 'Cargando...';
    document.getElementById('user-curp-summary').textContent = currentUser.curp || 'Cargando...';

    const actualizarEstadoAnexos = (perfil) => {
        const anexoCards = {
            anexo1: document.getElementById('anexo1-card'),
            anexo2: document.getElementById('anexo2-card'),
            anexo3: document.getElementById('anexo3-card'),
            anexo4: document.getElementById('anexo4-card'),
            anexo5: document.getElementById('anexo5-card'),
        };
        const anexoBadges = {
            anexo1: anexoCards.anexo1?.querySelector('.status-badge'),
            anexo2: anexoCards.anexo2?.querySelector('.status-badge'),
            anexo3: anexoCards.anexo3?.querySelector('.status-badge'),
            anexo4: anexoCards.anexo4?.querySelector('.status-badge'),
            anexo5: anexoCards.anexo5?.querySelector('.status-badge'),
        };

        const anexoMap = {
            anexo1_completo: { card: anexoCards.anexo1, badge: anexoBadges.anexo1 },
            anexo2_completo: { card: anexoCards.anexo2, badge: anexoBadges.anexo2 },
            anexo3_completo: { card: anexoCards.anexo3, badge: anexoBadges.anexo3 },
            anexo4_completo: { card: anexoCards.anexo4, badge: anexoBadges.anexo4 },
            anexo5_completo: { card: anexoCards.anexo5, badge: anexoBadges.anexo5 },
        };

        const setStatus = (card, badge, text, statusClass, isEnabled) => {
            if (!card || !badge) return; 
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

        const anexo1Completo = perfil.anexo1_completo === true;

        setStatus(
            anexoMap.anexo1_completo.card,
            anexoMap.anexo1_completo.badge,
            anexo1Completo ? 'Completo' : 'Incompleto',
            anexo1Completo ? 'status-complete' : 'status-incomplete',
            true 
        );

        for (const key in anexoMap) {
            if (key === 'anexo1_completo') continue;
            const { card, badge } = anexoMap[key];
            if (!card || !badge) continue; 

            const isAnexoCompleto = perfil[key] === true; 

            if (anexo1Completo) {
                setStatus(
                    card,
                    badge,
                    isAnexoCompleto ? 'Completo' : 'Disponible',
                    isAnexoCompleto ? 'status-complete' : 'status-available',
                    true 
                );
            } else {
                setStatus(
                    card,
                    badge,
                    'Bloqueado',
                    '', 
                    false 
                );
            }
        }

        const actividad = perfil.actividad;
        if (anexoCards.anexo3) anexoCards.anexo3.style.display = 'block';
        if (anexoCards.anexo4) anexoCards.anexo4.style.display = 'block';

        if (actividad === 'pesca') {
            if (anexoCards.anexo4) anexoCards.anexo4.style.display = 'none';
        } else if (actividad === 'acuacultura') {
            if (anexoCards.anexo3) anexoCards.anexo3.style.display = 'none';
        }
    };

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
            // Si falla la carga, no necesariamente cerramos sesión, pero mostramos alerta.
            // Podrías redirigir si es error 401 (No autorizado)
            console.error("Fallo al cargar perfil completo:", error);
        }
    };

    cargarDatosDelPerfil();

});