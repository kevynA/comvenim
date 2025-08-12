// Configuración (REMPLAZA CON TUS DATOS)
const SHEETDB_API = 'https://api.sheetdb.io/sheet/TU_ID_DE_API';

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const form = document.getElementById('opinion-form');
    const opinionesList = document.getElementById('opiniones-list');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const btnLoader = document.getElementById('btn-loader');
    const formMessage = document.getElementById('form-message');

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

        // Preparar datos
        const data = {
            nombre: form.nombre.value.trim(),
            email: form.email.value.trim() || 'No especificado',
            comentario: form.comentario.value.trim(),
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

            if (!opiniones || opiniones.length === 0) {
                opinionesList.innerHTML = `
                    <div class="md:col-span-2 text-center py-12">
                        <p class="text-gray-400">Aún no hay opiniones publicadas.</p>
                    </div>`;
                return;
            }

            // Ordenar por fecha (más recientes primero)
            opiniones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            opinionesList.innerHTML = opiniones.map(op => `
                <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <p class="text-gray-600 mb-4 italic">"${op.comentario}"</p>
                    <div class="flex items-center">
                        <div class="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                            ${op.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800">${op.nombre}</h4>
                            <p class="text-sm text-gray-500">${formatDate(op.fecha)}</p>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error cargando opiniones:', error);
            opinionesList.innerHTML = `
                <div class="md:col-span-2 text-center py-12">
                    <p class="text-red-400">Error cargando opiniones. Recarga la página.</p>
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
});