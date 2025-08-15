import { fetchProductDetail } from "./apiService.js";

document.addEventListener("DOMContentLoaded", async () => {
    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const productId = pathParts[pathParts.length - 1]; // último segmento

    try {
        const product = await fetchProductDetail(productId);

        // Nombre y categoría
        document.getElementById("product-name").textContent = product.name;
        document.getElementById("product-category").textContent = product.category?.name || "Sin categoría";
        document.getElementById("product-price").textContent = parseFloat(product.price).toLocaleString();
        document.getElementById("product-description").textContent = product.description || "";
        document.getElementById("product-stock").textContent = `Stock disponible: ${product.stock ?? "N/D"}`;

        // Imagen principal
        const mainImage = document.getElementById("main-image");
        mainImage.src = product.main_image || "/static/img/no-image.png";

        // Miniaturas
        const thumbContainer = document.getElementById("thumbnail-container");
        thumbContainer.innerHTML = "";
        const thumbnails = [product.main_image, ...(product.additional_images || [])].filter(Boolean);

        thumbnails.forEach(img => {
            const thumb = document.createElement("img");
            thumb.src = img;
            thumb.classList.add("img-thumbnail");
            thumb.style.width = "80px";
            thumb.style.cursor = "pointer";
            thumb.addEventListener("click", () => {
                mainImage.src = img;
            });
            thumbContainer.appendChild(thumb);
        });

        // Tallas
        const sizesContainer = document.getElementById("product-sizes");
        sizesContainer.innerHTML = "";
        (product.sizes || []).forEach(size => {
            const sizeBox = document.createElement("span");
            sizeBox.textContent = size;
            sizeBox.classList.add("border", "px-2", "py-1", "rounded");
            sizesContainer.appendChild(sizeBox);
        });

        // Botón WhatsApp
        const whatsappBtn = document.getElementById("whatsapp-btn");
        whatsappBtn.href = `https://wa.me/573001234567?text=Hola,%20quiero%20información%20sobre%20${encodeURIComponent(product.name)}`;

    } catch (err) {
        console.error("Error cargando producto:", err);
        document.getElementById("product-detail").innerHTML =
            "<div class='alert alert-danger'>No se pudo cargar el producto.</div>";
    }
});
