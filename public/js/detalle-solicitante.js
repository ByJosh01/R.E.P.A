// public/js/detalle-solicitante.js
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'home.html';
        return;
    }

    // 1. Obtenemos el ID del solicitante desde la URL
    const params = new URLSearchParams(window.location.search);
    const solicitanteId = params.get('id');

    if (!solicitanteId) {
        document.body.innerHTML = '<h1>Error: No se especificó un ID de solicitante.</h1>';
        return;
    }

    // Selectores de los contenedores donde mostraremos la info
    const perfilContainer = document.getElementById('perfil-details');
    const integrantesTableBody = document.getElementById('integrantes-details-body');
    const embarcacionesTableBody = document.getElementById('embarcaciones-details-body');
    const anexo3Card = document.getElementById('anexo3-card-details');
    const anexo3Container = document.getElementById('anexo3-details');
    const anexo4Card = document.getElementById('anexo4-card-details');
    const anexo4Container = document.getElementById('anexo4-details');

    try {
        // 2. Hacemos la llamada a la API que ya probaste
        const response = await fetch(`/api/admin/solicitante-detalles/${solicitanteId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar los detalles del solicitante.');
        }

        const data = await response.json();
        
        // 3. Llenamos la sección de Datos Personales
        const perfil = data.perfil;
        perfilContainer.innerHTML = `
            <div class="info-row"><label>Nombre Completo:</label> <span>${perfil.nombre || ''} ${perfil.apellido_paterno || ''} ${perfil.apellido_materno || ''}</span></div>
            <div class="info-row"><label>RFC:</label> <span>${perfil.rfc || 'N/A'}</span></div>
            <div class="info-row"><label>CURP:</label> <span>${perfil.curp || 'N/A'}</span></div>
            <div class="info-row"><label>Teléfono:</label> <span>${perfil.telefono || 'N/A'}</span></div>
            <div class="info-row"><label>Email:</label> <span>${perfil.correo_electronico || 'N/A'}</span></div>
            <div class="info-row"><label>Actividad:</label> <span>${perfil.actividad || 'N/A'}</span></div>
            <div class="info-row"><label>Municipio:</label> <span>${perfil.municipio || 'N/A'}</span></div>
        `;

        // 4. Llenamos la tabla de Integrantes
        integrantesTableBody.innerHTML = '';
        if (data.integrantes && data.integrantes.length > 0) {
            data.integrantes.forEach(i => {
                const row = integrantesTableBody.insertRow();
                row.innerHTML = `
                    <td>${i.nombre_completo || 'N/A'}</td>
                    <td>${i.rfc || 'N/A'}</td>
                    <td>${i.curp || 'N/A'}</td>
                    <td>${i.telefono || 'N/A'}</td>
                    <td>${i.actividad_desempeña || 'N/A'}</td>
                `;
            });
        } else {
            integrantesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Este solicitante no tiene integrantes registrados.</td></tr>';
        }

        // 5. Llenamos la tabla de Embarcaciones
        embarcacionesTableBody.innerHTML = '';
        if (data.embarcaciones && data.embarcaciones.length > 0) {
            data.embarcaciones.forEach(e => {
                const row = embarcacionesTableBody.insertRow();
                row.innerHTML = `
                    <td>${e.nombre_embarcacion || 'N/A'}</td>
                    <td>${e.matricula || 'N/A'}</td>
                    <td>${e.tonelaje_neto || 'N/A'}</td>
                    <td>${e.marca || 'N/A'}</td>
                    <td>${e.puerto_base || 'N/A'}</td>
                `;
            });
        } else {
            embarcacionesTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Este solicitante no tiene embarcaciones registradas.</td></tr>';
        }

        // 6. Decidimos qué tarjetas de Anexos Técnicos mostrar
        if (perfil.actividad === 'pesca' || perfil.actividad === 'ambas') {
            anexo3Card.style.display = 'block';
        }
        if (perfil.actividad === 'acuacultura' || perfil.actividad === 'ambas') {
            anexo4Card.style.display = 'block';
        }

        // 7. Llenamos la tarjeta del Anexo 3 si hay datos
        if (data.anexo3) {
            const a3 = data.anexo3;
            anexo3Container.innerHTML = `
                <div class="info-row"><label>Lugar de Captura:</label> <span>${a3.lugar || 'N/A'}</span></div>
                <div class="info-row"><label>Sitio de Desembarque:</label> <span>${a3.sitio_desembarque || 'N/A'}</span></div>
                <div class="info-row"><label>Tipo de Pesquería:</label> <span>${a3.tipo_pesqueria || 'N/A'}</span></div>
                <div class="info-row"><label>Especies Objetivo:</label> <span>${a3.especies_objetivo || 'N/A'}</span></div>
                <div class="info-row"><label>Nivel Producción Anual:</label> <span>${a3.nivel_produccion_anual || 'N/A'}</span></div>
            `;
        } else {
            anexo3Container.innerHTML = '<p>Este solicitante no tiene datos registrados para el Anexo 3.</p>';
        }

        // 8. Llenamos la tarjeta del Anexo 4 si hay datos
        if (data.anexo4) {
            const a4 = data.anexo4;
            let especiesTexto = 'N/A';
            if (a4.especies) {
                try {
                    // El campo 'especies' es un JSON, necesitamos procesarlo
                    const especiesObj = JSON.parse(a4.especies);
                    if (especiesObj.seleccionadas && especiesObj.seleccionadas.length > 0) {
                        especiesTexto = especiesObj.seleccionadas.join(', ');
                    }
                } catch(e) { console.error("Error al procesar JSON de especies:", e); }
            }

            anexo4Container.innerHTML = `
                <div class="info-row"><label>Tipo de Instalación:</label> <span>${a4.tipo_instalacion || 'N/A'}</span></div>
                <div class="info-row"><label>Sistema de Producción:</label> <span>${a4.sistema_produccion || 'N/A'}</span></div>
                <div class="info-row"><label>Especies:</label> <span>${especiesTexto}</span></div>
                <div class="info-row"><label>Producción Anual:</label> <span>${a4.produccion_anual_valor || ''} ${a4.produccion_anual_unidad || ''}</span></div>
            `;
        } else {
            anexo4Container.innerHTML = '<p>Este solicitante no tiene datos registrados para el Anexo 4.</p>';
        }

    } catch (error) {
        console.error("Error al cargar detalles:", error);
        document.body.innerHTML = `<h1>Error: ${error.message}</h1><a href="admin.html">Volver a la lista</a>`;
    }
});