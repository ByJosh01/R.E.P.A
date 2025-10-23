// public/js/admin-usuarios.js
document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'home.html';
        return;
    }

    const tableBody = document.getElementById('usuarios-table-body');

    try {
        const response = await fetch('/api/admin/usuarios', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            throw new Error('No se pudieron cargar los datos de los usuarios.');
        }

        const usuarios = await response.json();
        tableBody.innerHTML = '';

        if (usuarios.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay usuarios registrados.</td></tr>';
        } else {
            usuarios.forEach(user => {
                const row = tableBody.insertRow();
                // Formateamos la fecha para que sea más legible
                const fechaCreacion = new Date(user.creado_en).toLocaleString('es-MX');

                row.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.email}</td>
                    <td>${user.curp}</td>
                    <td>${user.rol}</td>
                    <td>${fechaCreacion}</td>
                `;
            });
        }
    } catch (error) {
        console.error("Error al cargar usuarios:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">${error.message}</td></tr>`;
    }
});