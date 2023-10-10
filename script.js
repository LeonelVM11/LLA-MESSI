document.addEventListener("DOMContentLoaded", () => {
    const timesheetForm = document.getElementById("timesheet-form");
    const timesheetTable = document.getElementById("timesheet-table");
    const totalHoursElement = document.getElementById("total-hours");

    // Función para cargar los registros desde el servidor
    function cargarRegistros() {
        fetch("/api/timesheet")
            .then((response) => response.json())
            .then((data) => {
                // Limpiar la tabla antes de agregar los registros
                timesheetTable.innerHTML = `
                     <thead>
                         <tr>
                             <th>Tarea</th>
                             <th>Horas Trabajadas</th>
                         </tr>
                     </thead>
                     <tbody>
                     </tbody>
                 `;

                // Iterar sobre los registros y agregarlos a la tabla
                data.forEach((registro) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                         <td>${registro.tarea}</td>
                         <td>${registro.horas_trabajadas}</td>
                     `;
                    timesheetTable.querySelector("tbody").appendChild(row);
                });

                // Recalcular y mostrar las horas totales
                calcularHorasTotales();
            })
            .catch((error) => {
                console.error("Error al cargar los registros:", error);
            });
    }

    // Llamar a la función para cargar registros al cargar la página
    cargarRegistros();

    timesheetForm.addEventListener("submit", (e) => {
        console.log("pedro> " + horas_trabajadas);
        e.preventDefault();
        const tarea = document.getElementById("tarea").value;
        const horasTrabajadas = document.getElementById("horas_trabajadas").value;
        horas_trabajadas = horasTrabajadas;
        console.log("pedro> " + horas_trabajadas);
        if (tarea && horasTrabajadas > 0) {
            const formData = { tarea, horas_trabajadas };

            fetch("/api/timesheet", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.message) {
                        // Limpiar el formulario después de enviar
                        timesheetForm.reset();
                        // Volver a cargar los registros después de agregar uno nuevo
                        cargarRegistros();
                    } else if (data.error) {
                        alert(data.error);
                    }
                })
                .catch((error) => {
                    console.error("Error al enviar el formulario:", error);
                });
        } else {
            alert("Por favor, complete el formulario correctamente.");
        }
    });

    // Función para calcular y mostrar las horas totales
    function calcularHorasTotales() {
        let totalHoras = 0;

        for (let i = 1; i < timesheetTable.rows.length; i++) {
            const horasTexto = timesheetTable.rows[i].cells[1].innerText;
            const horas = parseFloat(horasTexto.replace(',', '.')); // Reemplaza comas por puntos y convierte a número

            if (!isNaN(horas)) {
                totalHoras += horas;
            }
        }

        totalHoursElement.innerText = Math.floor(totalHoras).toString(); // Redondea hacia abajo y convierte a cadena
    }

    // Inicializar la tabla calculando las horas totales al cargar la página
    calcularHorasTotales();


});
// En script.js

