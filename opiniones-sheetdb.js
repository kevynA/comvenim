// Configuración
const SHEETDB_API = 'https://sheetdb.io/api/v1/3vbm7owp7uckp';

document.addEventListener('DOMContentLoaded', function() {
    // ... (código previo permanece igual hasta loadOpiniones)

    async function loadOpiniones() {
        try {
            const response = await fetch(`${SHEETDB_API}?validado=SI&cache=${Date.now()}`);
            
            // Debug adicional
            console.log("Status de respuesta:", response.status);
            const rawData = await response.text();
            console.log("Respuesta cruda:", rawData);
            
            const opiniones = JSON.parse(rawData);
            console.log("Datos parseados:", opiniones);

            if (!Array.isArray(opiniones)) {
                throw new Error("La respuesta no es un array");
            }

            const opinionesValidadas = opiniones.filter(op => {
                const isValid = op.validado === "SI";
                if (!isValid) {
                    console.log("Opinión no validada:", op);
                }
                return isValid;
            });

            if (opinionesValidadas.length === 0) {
                opinionesList.innerHTML = `
                    <div class="md:col-span-2 text-center py-12">
                        <p class="text-gray-400">No hay opiniones aprobadas aún.</p>
                    </div>`;
                return;
            }

            // Ordenar por fecha (manejo seguro)
            opinionesValidadas.sort((a, b) => {
                try {
                    return new Date(b.fecha) - new Date(a.fecha);
                } catch {
                    return 0;
                }
            });

            opinionesList.innerHTML = opinionesValidadas.map(op => {
                // Manejo seguro de puntuación
                const puntuacion = Math.min(Math.max(parseInt(op.puntuacion) || 1, 5);
                
                return `
                <div class="bg-white p-6 rounded-lg shadow-md">
                    <div class="flex items-center mb-2">
                        <div class="text-yellow-400 mr-2">
                            ${'★'.repeat(puntuacion)}${'☆'.repeat(5 - puntuacion)}
                        </div>
                        <span class="text-sm text-gray-500 ml-auto">
                            ${formatDate(op.fecha)}
                        </span>
                    </div>
                    <p class="text-gray-600 mb-4 italic">"${op.comentario || 'Sin comentario'}"</p>
                    <div class="flex items-center">
                        <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            ${(op.nombre || ' ').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800">${op.nombre || 'Anónimo'}</h4>
                        </div>
                    </div>
                </div>`;
            }).join('');

        } catch (error) {
            console.error("Error crítico:", error);
            opinionesList.innerHTML = `
                <div class="md:col-span-2 text-center py-12">
                    <p class="text-red-400">Error técnico al cargar opiniones. Recarga la página.</p>
                    <p class="text-sm text-gray-500 mt-2">${error.message}</p>
                </div>`;
        }
    }

    // ... (resto del código permanece igual)
});
