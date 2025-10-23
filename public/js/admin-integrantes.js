// public/js/admin-integrantes.js
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'home.html';
        return;
    }

    const tableBody = document.getElementById('integrantes-table-body');

    try {
        const response = await fetch('/api/admin/integrantes', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar los datos de los integrantes.');
        }

        const integrantes = await response.json();
        tableBody.innerHTML = '';

        if (integrantes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay integrantes registrados en el sistema.</td></tr>';
        } else {
            integrantes.forEach(integrante => {
                const row = tableBody.insertRow();
                row.innerHTML = `
                    <td>${integrante.nombre_completo || 'N/A'}</td>
                    <td>${integrante.rfc || 'N/A'}</td>
                    <td>${integrante.curp || 'N/A'}</td>
                    <td>${integrante.telefono || 'N/A'}</td>
                    <td>${integrante.municipio || 'N/A'}</td>
                    <td>${integrante.actividad_desempeña || 'N/A'}</td>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar integrantes:", error);
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: red;">${error.message}</td></tr>`;
    }
});