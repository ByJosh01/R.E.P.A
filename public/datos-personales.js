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

    // ▼▼▼ ESTA ES LA FUNCIÓN ACTUALIZADA ▼▼▼
    const actualizarEstadoAnexos = (perfil) => {
        // Selectores de los elementos HTML (las "tarjetas" y sus etiquetas de estado)
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

        // Mapa que conecta la clave del perfil con su tarjeta y etiqueta HTML
        const anexoMap = {
            anexo1_completo: { card: anexoCards.anexo1, badge: anexoBadges.anexo1 },
            anexo2_completo: { card: anexoCards.anexo2, badge: anexoBadges.anexo2 },
            anexo3_completo: { card: anexoCards.anexo3, badge: anexoBadges.anexo3 },
            anexo4_completo: { card: anexoCards.anexo4, badge: anexoBadges.anexo4 },
            anexo5_completo: { card: anexoCards.anexo5, badge: anexoBadges.anexo5 },
        };

        // Función auxiliar para poner el estado correcto en una tarjeta
        const setStatus = (card, badge, text, statusClass, isEnabled) => {
            if (!card || !badge) return; // Si el elemento no existe, no hacemos nada

            badge.textContent = text;
            badge.className = 'status-badge'; // Limpia clases anteriores
            if (statusClass) {
                badge.classList.add(statusClass);
            }

            if (isEnabled) {
                card.classList.remove('disabled');
            } else {
                card.classList.add('disabled');
            }
        };

        // ---- Lógica Principal de Actualización ----

        const anexo1Completo = perfil.anexo1_completo === true;

        // 1. Actualiza el Anexo 1
        setStatus(
            anexoMap.anexo1_completo.card,
            anexoMap.anexo1_completo.badge,
            anexo1Completo ? 'Completo' : 'Incompleto',
            anexo1Completo ? 'status-complete' : 'status-incomplete',
            true // Anexo 1 siempre está habilitado
        );

        // 2. Actualiza los Anexos 2 al 5
        for (const key in anexoMap) {
            // Saltamos el anexo 1 porque ya lo procesamos
            if (key === 'anexo1_completo') continue;

            const { card, badge } = anexoMap[key];
            if (!card || !badge) continue; // Si la tarjeta no existe, la saltamos

            const isAnexoCompleto = perfil[key] === true; // Verifica si ESTE anexo está completo

            if (anexo1Completo) {
                // Si Anexo 1 está completo, los demás pueden estar Completos o Disponibles
                setStatus(
                    card,
                    badge,
                    isAnexoCompleto ? 'Completo' : 'Disponible',
                    isAnexoCompleto ? 'status-complete' : 'status-available',
                    true // Habilitado
                );
            } else {
                // Si Anexo 1 NO está completo, los demás están Bloqueados
                setStatus(
                    card,
                    badge,
                    'Bloqueado',
                    '', // Sin clase de color específica para bloqueado
                    false // Deshabilitado
                );
            }
        }

        // 3. Oculta Anexos según la actividad (tu lógica existente)
        const actividad = perfil.actividad;
        if (anexoCards.anexo3) anexoCards.anexo3.style.display = 'block';
        if (anexoCards.anexo4) anexoCards.anexo4.style.display = 'block';

        if (actividad === 'pesca') {
            if (anexoCards.anexo4) anexoCards.anexo4.style.display = 'none';
        } else if (actividad === 'acuacultura') {
            if (anexoCards.anexo3) anexoCards.anexo3.style.display = 'none';
        }
    };
    // ▲▲▲ FIN DE LA FUNCIÓN ACTUALIZADA ▲▲▲


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

            // Llamamos a la función actualizada para poner los estados
            actualizarEstadoAnexos(perfil);

        } catch (error) {
            alert(error.message);
            console.error("Fallo al cargar perfil completo:", error);
        }
    };

    // --- Ejecutar la carga inicial ---
    cargarDatosDelPerfil();

}); // Fin de DOMContentLoaded