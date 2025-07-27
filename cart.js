<script>
        // ===================================
        // DATOS (Planes y Productos) - Estos pueden estar en un archivo aparte
        // ===================================
        const plans = [
            { id: 1, name: 'Plan Básico', price: 99.00, type: 'plan' },
            { id: 2, name: 'Plan Estándar', price: 199.00, type: 'plan' },
            { id: 3, name: 'Plan Premium', price: 399.00, type: 'plan' }
        ];

        const products = [
            { id: 101, name: 'Página Web', description: 'Página con secciones a preferencia. (Inicio, Servicios, Planes, Productos y Contacto) (Tiempo estimado de entrega 7 días hábiles)', price: 59.99, image: 'Página Web.png' },
            { id: 102, name: 'Tienda Web', description: '5 secciones más botón de carrito. (Gestión de ventas por WhatsApp)', price: 79.99, image: 'una_tienda_web_gestionada_por_whatsapp_con.jpeg' },
            { id: 103, name: 'Mantenimiento de Equipos', description: 'Duración del proceso 2 días hábiles. (Opciones de repontenciación puede aumentar el tiempo de entrega y el valor)', price: 29.99, image: 'Mantenimiento de computadora.jpeg' },
            { id: 104, name: 'Soporte Técnico', description: 'Detección de problemas. (El tiempo de entrega  y valor agregado dependerá de la gravedad del problema)', price: 5.00, image: 'Soporte Técnico.jpeg' }
        ];

        // Cargar carrito desde localStorage o inicializar vacío
        let cartItems = JSON.parse(localStorage.getItem('comvenimCart')) || [];

        document.addEventListener('DOMContentLoaded', function () {
            // ===================================
            // RENDERIZADO INICIAL
            // ===================================
            const productListContainer = document.getElementById('product-list');

            function renderProducts() {
                if (!productListContainer) return;
                productListContainer.innerHTML = products.map(product => `
                    <div class="card flex flex-col text-center">
                        <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                        <div class="p-6 flex flex-col flex-grow">
                            <h3 class="text-xl font-bold mb-2">${product.name}</h3>
                            <p class="text-gray-600 text-sm flex-grow mb-4">${product.description}</p>
                            <p class="text-2xl font-bold text-blue-600 mb-4">$${product.price.toFixed(2)}</p>
                            <button onclick="addItemToCart(${product.id}, 'product')" class="w-full btn-secondary mt-auto">Añadir al carrito</button>
                        </div>
                    </div>
                `).join('');
            }
            
            renderProducts();

            // ===================================
            // FUNCIONALIDAD DEL CARRITO (Modificada para usar localStorage)
            // ===================================
            const cartModal = document.getElementById('cart-modal');
            const cartContainer = document.getElementById('cart-container');
            const closeCartButton = document.getElementById('close-cart-button');
            const cartButton = document.getElementById('cart-button');
            const cartButtonMobile = document.getElementById('cart-button-mobile');
            const cartItemsContainer = document.getElementById('cart-items');
            const cartTotalEl = document.getElementById('cart-total');
            const cartCountEls = [document.getElementById('cart-count'), document.getElementById('cart-count-mobile')];
            const checkoutButton = document.getElementById('checkout-button-whatsapp');

            // Función para guardar el carrito en localStorage
            function saveCartToStorage() {
                localStorage.setItem('comvenimCart', JSON.stringify(cartItems));
            }

            // Función para actualizar la UI del carrito
            function updateCart() {
                cartItemsContainer.innerHTML = '';
                if (cartItems.length === 0) {
                    cartItemsContainer.innerHTML = '<p class="text-gray-500 text-center">Tu carrito está vacío.</p>';
                } else {
                    cartItems.forEach(item => {
                        const itemEl = document.createElement('div');
                        itemEl.className = 'flex justify-between items-center mb-4 cart-item-animation';
                        itemEl.innerHTML = `
                            <div class="flex-grow">
                                <p class="font-bold">${item.name} ${item.quantity > 1 ? `(x${item.quantity})`: ''}</p>
                                <p class="text-sm text-gray-600">$${item.price.toFixed(2)}${item.type === 'plan' ? '/mes' : ''}</p>
                            </div>
                            <span class="font-bold w-24 text-right">$${(item.price * item.quantity).toFixed(2)}</span>
                            <button onclick="removeItemFromCart(${item.id})" class="ml-4 text-red-500 hover:text-red-700 font-bold">&times;</button>
                        `;
                        cartItemsContainer.appendChild(itemEl);
                    });
                }

                const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                cartTotalEl.textContent = `$${total.toFixed(2)}`;

                const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
                cartCountEls.forEach(el => {
                    el.textContent = totalItems;
                    el.classList.toggle('hidden', totalItems === 0);
                });

                // Guardar en localStorage cada vez que se actualiza
                saveCartToStorage();
            }

            // Funciones globales para manipular el carrito
            window.addItemToCart = function(itemId, itemType) {
                const sourceArray = itemType === 'plan' ? plans : products;
                const itemToAdd = sourceArray.find(item => item.id === itemId);

                if (itemToAdd) {
                    const existingItem = cartItems.find(item => item.id === itemId);
                    if (existingItem) {
                        existingItem.quantity++;
                    } else {
                        cartItems.push({ ...itemToAdd, quantity: 1 });
                    }
                    showCartNotification(itemToAdd.name);
                    updateCart();
                }
            };
            
            window.removeItemFromCart = function(itemId) {
                cartItems = cartItems.filter(item => item.id !== itemId);
                updateCart();
            };

            function showCartNotification(itemName) {
                const notification = document.createElement('div');
                notification.className = 'fixed top-24 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg fade-in';
                notification.textContent = `"${itemName}" añadido al carrito!`;
                document.body.appendChild(notification);
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            }

            function toggleCart() {
                const isHidden = cartModal.classList.contains('hidden');
                if (isHidden) {
                    cartModal.classList.remove('hidden');
                    setTimeout(() => cartContainer.classList.remove('translate-x-full'), 10);
                } else {
                    cartContainer.classList.add('translate-x-full');
                    setTimeout(() => cartModal.classList.add('hidden'), 300);
                }
            }

            // ========= FUNCIÓN PARA ENVIAR PEDIDO A WHATSAPP =========
            function sendOrderToWhatsApp() {
                if (cartItems.length === 0) {
                    alert("Tu carrito está vacío. Añade productos antes de enviar tu pedido.");
                    return;
                }

                let message = '¡Hola COMVENIM! 👋\n\nQuisiera solicitar un presupuesto para los siguientes servicios/productos:\n\n';

                cartItems.forEach(item => {
                    message += `*- ${item.name}*\n`;
                    message += `  Cantidad: ${item.quantity}\n`;
                    message += `  Precio Unitario: $${item.price.toFixed(2)}${item.type === 'plan' ? '/mes' : ''}\n\n`;
                });

                const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                message += `*Total Estimado: $${total.toFixed(2)}*\n\n`;
                message += 'Espero su pronta respuesta para coordinar. ¡Gracias!';

                const phoneNumber = '593992648781'; 
                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

                window.open(whatsappUrl, '_blank');
            }

            // Event listeners
            checkoutButton.addEventListener('click', sendOrderToWhatsApp);
            [cartButton, cartButtonMobile, closeCartButton].forEach(btn => btn.addEventListener('click', toggleCart));
            cartModal.addEventListener('click', (e) => e.target === cartModal && toggleCart());

            // ===================================
            // OTRAS FUNCIONALIDADES
            // ===================================
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
            
            // Inicializar el carrito al cargar la página
            updateCart();

            // Sincronización entre pestañas
            window.addEventListener('storage', (e) => {
                if (e.key === 'comvenimCart') {
                    cartItems = JSON.parse(e.newValue) || [];
                    updateCart();
                }
            });
        });
    </script>
