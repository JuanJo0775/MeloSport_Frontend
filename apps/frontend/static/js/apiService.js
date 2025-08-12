// ===============================
// API Service - MeloSport Public
// ===============================

// Cambia la URL base al dominio real del backoffice
const API_BASE_URL = "https://backoffice.example.com/api";

// --- Obtener carrusel ---
async function fetchCarousel() {
    try {
        const response = await fetch(`${API_BASE_URL}/carousel/`);
        if (!response.ok) throw new Error("Error al obtener el carrusel");
        const data = await response.json();
        renderCarousel(data);
    } catch (error) {
        console.error("❌ Error cargando el carrusel:", error);
    }
}

// --- Renderizar carrusel dinámicamente ---
function renderCarousel(items) {
    const indicatorsContainer = document.querySelector("#promocionesCarousel .carousel-indicators");
    const innerContainer = document.querySelector("#promocionesCarousel .carousel-inner");

    if (!indicatorsContainer || !innerContainer) return;

    indicatorsContainer.innerHTML = "";
    innerContainer.innerHTML = "";

    items.forEach((item, index) => {
        // Botones de indicador
        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.setAttribute("data-bs-target", "#promocionesCarousel");
        indicator.setAttribute("data-bs-slide-to", index);
        indicator.setAttribute("aria-label", `Promoción ${index + 1}`);
        if (index === 0) indicator.classList.add("active");
        indicatorsContainer.appendChild(indicator);

        // Elemento del carrusel
        const carouselItem = document.createElement("div");
        carouselItem.classList.add("carousel-item", ...(index === 0 ? ["active"] : []));

        carouselItem.innerHTML = `
            <div class="bg-primary text-white py-5" style="min-height: 400px;">
                <div class="container">
                    <div class="row align-items-center">
                        <div class="col-lg-6">
                            <h1 class="display-4 fw-bold">${item.custom_title || item.product_name}</h1>
                            <p class="lead">${item.custom_subtitle || ''}</p>
                            <a href="/productos/${item.product_id}" class="btn btn-light btn-lg">Ver Producto</a>
                        </div>
                        <div class="col-lg-6 text-center">
                            <i class="fas fa-futbol display-1 opacity-50"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;

        innerContainer.appendChild(carouselItem);
    });
}

// --- Enviar mensaje de contacto ---
async function sendContactMessage(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/contacto/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error("Error al enviar el mensaje");
        alert("✅ Mensaje enviado correctamente.");
    } catch (error) {
        console.error("❌ Error enviando mensaje de contacto:", error);
        alert("❌ Ocurrió un error al enviar el mensaje. Intenta de nuevo.");
    }
}

// --- Inicializar ---
document.addEventListener("DOMContentLoaded", () => {
    fetchCarousel();

    const contactForm = document.querySelector("#contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = {
                name: contactForm.name.value,
                email: contactForm.email.value,
                phone: contactForm.phone.value,
                message: contactForm.message.value
            };
            sendContactMessage(formData);
        });
    }
});
