// public/js/admin-embarcaciones.js
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'home.html';
        return;
    }

    const tableBody = document.getElementById('embarcaciones-table-body');

    try {
        const response = await fetch('/api/admin/embarcaciones', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar los datos de las embarcaciones.');
        }

        const embarcaciones = await response.json();
        tableBody.innerHTML = '';

        if (embarcaciones.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay embarcaciones registradas en el sistema.</td></tr>';
        } else {
            embarcaciones.forEach(e => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${e.nombre_embarcacion || 'N/A'}</td>
                    <td>${e.matricula || 'N/A'}</td>
                    <td>${e.tonelaje_neto || 'N/A'}</td>
                    <td>${e.marca || 'N/A'}</td>
                    <td>${e.potencia_hp || 'N/A'}</td>
                    <td>${e.puerto_base || 'N/A'}</td>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar embarcaciones:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">${error.message}</td></tr>`;
    }
});