// Configuración (REMPLAZA CON TUS DATOS)
const SHEETDB_API = 'https://sheetdb.io/api/v1/3vbm7owp7uckp';

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
        
        // Validación
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

        // Preparar datos
        const data = {
            nombre: form.nombre.value.trim(),
            email: form.email.value.trim() || 'No especificado',
            comentario: form.comentario.value.trim(),
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

            if (response.ok) {
                showMessage('✅ Gracias! Tu opinión será revisada antes de publicarse.', 'success');
                form.reset();
                resetStars();
                loadOpiniones();
            } else {
                throw new Error('Error en la API');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage('❌ Error al enviar. Por favor intenta nuevamente.', 'error');
        } finally {
            toggleLoading(false);
        }
    });

    // Cargar opiniones desde SheetDB
    async function loadOpiniones() {
    try {
        const response = await fetch(`${SHEETDB_API}?validado=SI`);
        const opiniones = await response.json();
        
        console.log("Datos recibidos:", opiniones); // Para diagnóstico
        
        if (!opiniones || opiniones.length === 0) {
            opinionesList.innerHTML = `
                <div class="md:col-span-2 text-center py-12">
                    <p class="text-gray-400">No hay opiniones publicadas aún.</p>
                </div>`;
            return;
        }

        // Filtra por si acaso hay algún null
        const opinionesValidadas = opiniones.filter(op => 
            op.validado && op.validado.toString().trim().toUpperCase() === "SI"
        );

        if (opinionesValidadas.length === 0) {
            opinionesList.innerHTML = `
                <div class="md:col-span-2 text-center py-12">
                    <p class="text-gray-400">No hay opiniones aprobadas aún.</p>
                </div>`;
            return;
        }

        // Ordenar y mostrar...
        opinionesValidadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
        
        opinionesList.innerHTML = opinionesValidadas.map(op => `
            <div class="bg-white p-6 rounded-lg shadow-md">
                <div class="flex items-center mb-2">
                    <div class="text-yellow-400 mr-2">
                        ${'★'.repeat(op.puntuacion)}${'☆'.repeat(5 - op.puntuacion)}
                    </div>
                    <span class="text-sm text-gray-500 ml-auto">
                        ${formatDate(op.fecha)}
                    </span>
                </div>
                <p class="text-gray-600 mb-4 italic">"${op.comentario}"</p>
                <div class="flex items-center">
                    <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                        ${op.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-bold text-gray-800">${op.nombre}</h4>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error cargando opiniones:", error);
        opinionesList.innerHTML = `
            <div class="md:col-span-2 text-center py-12">
                <p class="text-red-400">Error al cargar opiniones. Recarga la página.</p>
            </div>`;
    }
}

    // Helper: Formatear fecha
    function formatDate(isoString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(isoString).toLocaleDateString('es-ES', options);
    }

    // Helper: Mostrar mensajes
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

    // Helper: Estado de carga
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

    // Helper: Resetear estrellas
    function resetStars() {
        starInputs.forEach(input => {
            input.checked = false;
            const label = document.querySelector(`label[for="${input.id}"]`);
            label.classList.remove('text-yellow-400');
            label.classList.add('text-gray-300');
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
        });
    });
});
