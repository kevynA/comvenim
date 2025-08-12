// Configuración de la API (reemplaza con tus datos reales)
const SHEETDB_API = 'https://sheetdb.io/api/v1/o07pzxtgsqgqw';

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const form = document.getElementById('opinion-form');
    const opinionesList = document.getElementById('opiniones-list');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const formMessage = document.getElementById('form-message');
    const starInputs = document.querySelectorAll('.rating-stars input[type="radio"]');

    // Cargar opiniones al iniciar
    loadOpiniones();

    // Enviar formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validación básica
        if (!form.nombre.value.trim() || !form.comentario.value.trim()) {
            showMessage('Por favor completa los campos obligatorios', 'error');
            return;
        }

        // Validar puntuación
        const puntuacion = form.querySelector('input[name="puntuacion"]:checked');
        if (!puntuacion) {
            showMessage('Por favor selecciona una puntuación', 'error');
            return;
        }

        // Preparar datos con validación
        const data = {
            nombre: sanitizeInput(form.nombre.value.trim()),
            email: validateEmail(form.email.value.trim()) || 'No especificado',
            comentario: sanitizeInput(form.comentario.value.trim()),
            puntuacion: puntuacion.value,
            fecha: new Date().toISOString(),
            validado: "NO" // Moderación manual
        };

        // Enviar a SheetDB
        toggleLoading(true);
        
        try {
            const response = await fetch(SHEETDB_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const responseData = await response.text();
            
            // Verificar si la respuesta es JSON válido
            try {
                const jsonResponse = JSON.parse(responseData);
                if (response.ok) {
                    showMessage('✅ Gracias! Tu opinión será revisada antes de publicarse.', 'success');
                    form.reset();
                    resetStars();
                    loadOpiniones();
                } else {
                    throw new Error(jsonResponse.error || 'Error en la API');
                }
            } catch (parseError) {
                throw new Error(`Respuesta inválida de la API: ${responseData.substring(0, 100)}`);
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('❌ Error al enviar. Por favor intenta nuevamente.', 'error');
        } finally {
            toggleLoading(false);
        }
    });

    // Cargar opiniones desde SheetDB con manejo robusto de errores
    async function loadOpiniones() {
        try {
            const response = await fetch(`${SHEETDB_API}?validado=SI&cache=${Date.now()}`);
            const responseText = await response.text();
            
            // Depuración
            console.log("Respuesta cruda:", responseText);
            
            let opiniones;
            try {
                opiniones = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`La API no devolvió JSON válido: ${responseText.substring(0, 100)}...`);
            }

            // Verificar estructura de datos
            if (!Array.isArray(opiniones)) {
                throw new Error("La respuesta no es un array");
            }

            // Filtrar y validar opiniones
            const opinionesValidadas = opiniones.filter(op => {
                try {
                    return op.validado && String(op.validado).trim().toUpperCase() === "SI" &&
                           op.nombre && op.comentario && op.puntuacion;
                } catch {
                    return false;
                }
            });

            // Mostrar resultados
            if (opinionesValidadas.length === 0) {
                opinionesList.innerHTML = `
                    <div class="md:col-span-2 text-center py-12">
                        <p class="text-gray-400">No hay opiniones aprobadas aún.</p>
                    </div>`;
                return;
            }

            // Ordenar por fecha (con manejo de errores)
            opinionesValidadas.sort((a, b) => {
                try {
                    return (new Date(b.fecha) || 0 - (new Date(a.fecha) || 0;
                } catch {
                    return 0;
                }
            });

            // Generar HTML de opiniones
            opinionesList.innerHTML = opinionesValidadas.map(op => {
                const puntuacion = Math.min(Math.max(parseInt(op.puntuacion) || 1, 5);
                const nombre = sanitizeInput(op.nombre || 'Anónimo');
                const inicial = nombre.charAt(0).toUpperCase();
                const comentario = sanitizeInput(op.comentario || 'Sin comentario');
                const fecha = formatDate(op.fecha);

                return `
                <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <div class="flex items-center mb-2">
                        <div class="text-yellow-400 mr-2">
                            ${'★'.repeat(puntuacion)}${'☆'.repeat(5 - puntuacion)}
                        </div>
                        <span class="text-sm text-gray-500 ml-auto">${fecha}</span>
                    </div>
                    <p class="text-gray-600 mb-4 italic">"${comentario}"</p>
                    <div class="flex items-center">
                        <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            ${inicial}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800">${nombre}</h4>
                            ${op.email && op.email !== 'No especificado' ? 
                              `<p class="text-xs text-gray-500">${validateEmail(op.email) || ''}</p>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');

        } catch (error) {
            console.error("Error cargando opiniones:", error);
            opinionesList.innerHTML = `
                <div class="md:col-span-2 text-center py-12">
                    <p class="text-red-400">Error al cargar opiniones. Recarga la página.</p>
                    <p class="text-sm text-gray-500 mt-2">${error.message}</p>
                </div>`;
        }
    }

    // Funciones auxiliares mejoradas
    function formatDate(isoString) {
        if (!isoString) return "Fecha no disponible";
        try {
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            const date = new Date(isoString);
            return isNaN(date) ? "Fecha inválida" : date.toLocaleDateString('es-ES', options);
        } catch {
            return "Fecha inválida";
        }
    }

    function validateEmail(email) {
        if (!email) return null;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) ? email : null;
    }

    function sanitizeInput(input) {
        return input ? input.toString()
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .substring(0, 500) : '';
    }

    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = `mt-4 p-3 rounded-lg text-center ${
            type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`;
        formMessage.classList.remove('hidden');
        
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
    }

    function toggleLoading(loading) {
        if (loading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            submitBtn.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            submitBtn.disabled = false;
        }
    }

    function resetStars() {
        starInputs.forEach(input => {
            input.checked = false;
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) {
                label.classList.remove('text-yellow-400');
                label.classList.add('text-gray-300');
            }
        });
    }

    // Event listeners para estrellas
    starInputs.forEach(input => {
        input.addEventListener('change', function() {
            const labels = document.querySelectorAll('.rating-stars label');
            labels.forEach(label => {
                label.classList.remove('text-yellow-400');
                label.classList.add('text-gray-300');
            });
            
            const checkedInput = document.querySelector('input[name="puntuacion"]:checked');
            if (checkedInput) {
                const checkedLabel = document.querySelector(`label[for="${checkedInput.id}"]`);
                if (checkedLabel) {
                    checkedLabel.classList.remove('text-gray-300');
                    checkedLabel.classList.add('text-yellow-400');
                    
                    // Marcar también las estrellas anteriores
                    let prevSibling = checkedLabel.previousElementSibling;
                    while (prevSibling && prevSibling.tagName === 'LABEL') {
                        prevSibling.classList.remove('text-gray-300');
                        prevSibling.classList.add('text-yellow-400');
                        prevSibling = prevSibling.previousElementSibling;
                    }
                }
            }
        });
    });
});
