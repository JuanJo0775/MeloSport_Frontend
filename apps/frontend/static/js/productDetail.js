// productDetail.js — Detalle funcional con flechas, miniaturas y stock dinámico
const API_BASE_URL = "http://127.0.0.1:8000/api";

// ===== Helpers (alineados con apiService.js) =====
function safeText(x){ return (x===null||typeof x==="undefined") ? "" : x; }

function formatCOP(value){
  const v = Number(value) || 0;
  return `$${v.toLocaleString("es-CO",{minimumFractionDigits:0,maximumFractionDigits:0})} COP`;
}

function getImageUrlFromProduct(product){
  if(!product) return "https://via.placeholder.com/600x600?text=Sin+Imagen";
  if(product.main_image) return product.main_image;
  const backendBase = API_BASE_URL.replace("/api","");
  if(product.images && product.images.length){
    const main = product.images.find(i=>i.is_main) || product.images[0];
    const raw = main.image_url || main.image;
    if(!raw) return "https://via.placeholder.com/600x600?text=Sin+Imagen";
    return raw.startsWith("http") ? raw : backendBase + (raw.startsWith("/") ? raw : `/${raw}`);
  }
  if(product.image){
    return product.image.startsWith("http") ? product.image
      : backendBase + (product.image.startsWith("/") ? product.image : `/${product.image}`);
  }
  return "https://via.placeholder.com/600x600?text=Sin+Imagen";
}

function getProductIdFromUrl(){
  const m = window.location.pathname.match(/\/productos\/(\d+)\//);
  return m ? m[1] : null;
}

// ===== Estado de galería =====
let galleryImages = [];
let galleryIndex = 0;

function buildThumb(url, idx){
  const img = document.createElement("img");
  img.src = url;
  img.className = "img-thumbnail";
  img.style.width = "72px";
  img.style.height = "72px";
  img.style.objectFit = "cover";
  img.style.cursor = "pointer";
  img.dataset.index = idx;
  return img;
}

function setActiveThumb(idx){
  document.querySelectorAll("#thumbGallery .img-thumbnail").forEach(el=>{
    el.style.borderWidth = (Number(el.dataset.index)===idx) ? "2px" : "1px";
    el.style.borderColor = (Number(el.dataset.index)===idx) ? "#0d6efd" : "#dee2e6";
  });
}

function showImage(idx){
  const mainImageEl = document.getElementById("mainImage");
  if(!galleryImages.length){
    mainImageEl.src = "https://via.placeholder.com/600x600?text=Sin+Imagen";
    return;
  }
  galleryIndex = (idx + galleryImages.length) % galleryImages.length;
  mainImageEl.src = galleryImages[galleryIndex];
  setActiveThumb(galleryIndex);
}

// ===== Carga del producto =====
async function loadProductDetail(){
  const id = getProductIdFromUrl();
  if(!id) return;

  try{
    const r = await fetch(`${API_BASE_URL}/products/${id}/`);
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    const product = await r.json();
    renderProductDetail(product);
  }catch(e){
    console.error("❌ Detalle producto:", e);
    const root = document.getElementById("product-detail");
    if(root){
      root.innerHTML = `<div class="alert alert-danger">No pudimos cargar este producto.</div>`;
    }
  }
}

// ===== Render =====
function renderProductDetail(product){
  // --- refs ---
  const mainImageEl = document.getElementById("mainImage");
  const thumbGalleryEl = document.getElementById("thumbGallery");
  const prevBtn = document.getElementById("prevImage");
  const nextBtn = document.getElementById("nextImage");

  const nameEl = document.getElementById("productName");
  const categoryEl = document.getElementById("productCategory");
  const absoluteCategoryEl = document.getElementById("absoluteCategory");
  const descriptionEl = document.getElementById("productDescription");
  const sizesEl = document.getElementById("sizesContainer");
  const variantsEl = document.getElementById("variantsContainer");
  const priceEl = document.getElementById("productPrice");
  const stockEl = document.getElementById("productStock");
  const whatsappBtn = document.getElementById("whatsappButton");

  // --- imágenes (flechas + miniaturas) ---
  const backendBase = API_BASE_URL.replace("/api","");
  galleryImages = (product.images || [])
    .map(i => i.image_url || i.image)
    .filter(Boolean)
    .map(u => u.startsWith("http") ? u : backendBase + (u.startsWith("/") ? u : `/${u}`));

  if(!galleryImages.length){
    galleryImages = [ getImageUrlFromProduct(product) ];
  }

  // pintar thumbs
  thumbGalleryEl.innerHTML = "";
  galleryImages.forEach((url, idx)=>{
    const t = buildThumb(url, idx);
    t.addEventListener("click", ()=> showImage(idx));
    thumbGalleryEl.appendChild(t);
  });

  showImage(0); // setea main y activa thumb

  prevBtn.onclick = ()=> showImage(galleryIndex - 1);
  nextBtn.onclick = ()=> showImage(galleryIndex + 1);

  // --- info básica ---
  nameEl.textContent = safeText(product.name);

  // categorías → badges
  if (Array.isArray(product.categories) && product.categories.length > 0) {
    categoryEl.innerHTML = product.categories
      .map(cat => `<span class="badge bg-secondary me-1">${safeText(cat.name)}</span>`)
      .join("");
  } else {
    categoryEl.textContent = "Sin categoría";
  }

  if(product.absolute_category?.nombre){
    absoluteCategoryEl.textContent = product.absolute_category.nombre;
    absoluteCategoryEl.classList.remove("d-none");
  }
  descriptionEl.textContent = safeText(product.description);
  priceEl.textContent = formatCOP(product.price);

  // --- variantes / tallas ---
  const sizes = [...new Set((product.variants || []).map(v=>v.size).filter(Boolean))];
  const colors = [...new Set((product.variants || []).map(v=>v.color).filter(Boolean))];

  const sizesSection = sizesEl.closest(".mb-3");
  const colorsSection = variantsEl.closest(".mb-3");

  // stock base + total de variantes
  const variantsStock = (product.variants || []).reduce((s,v)=> s + (Number(v.stock)||0), 0);
  const baseStock = Number(product.stock ?? product.total_stock ?? 0);
  const totalStock = variantsStock > 0 ? variantsStock : baseStock;

  let selectedSize  = sizes.length===1  ? sizes[0]  : null;
  let selectedColor = colors.length===1 ? colors[0] : null;

  function computeStock(){
    let filtered = Array.isArray(product.variants) ? [...product.variants] : [];
    if(selectedSize)  filtered = filtered.filter(v => v.size  === selectedSize);
    if(selectedColor) filtered = filtered.filter(v => v.color === selectedColor);
    const stockFiltered = filtered.length
      ? filtered.reduce((s,v)=> s + (Number(v.stock)||0), 0)
      : totalStock;
    stockEl.innerHTML = `<strong>Stock:</strong> ${stockFiltered} unidades (total: ${totalStock})`;
  }

  // tallas
  if(sizes.length===0){
    sizesSection.style.display = "none";
  }else if(sizes.length===1){
    sizesEl.innerHTML = `<span><strong>${sizes[0]}</strong></span>`;
  }else{
    sizesEl.innerHTML = sizes.map(s=>`<span class="size-box" data-size="${s}">${s}</span>`).join("");
    sizesEl.querySelectorAll(".size-box").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if(selectedSize === btn.dataset.size){
          selectedSize = null;
          btn.classList.remove("active");
        }else{
          selectedSize = btn.dataset.size;
          sizesEl.querySelectorAll(".size-box").forEach(b=>b.classList.remove("active"));
          btn.classList.add("active");
        }
        computeStock();
        updateWhatsappLink();
      });
    });
  }

  // colores
  if(colors.length===0){
    colorsSection.style.display = "none";
  }else if(colors.length===1){
    variantsEl.innerHTML = `<span><strong>${colors[0]}</strong></span>`;
  }else{
    variantsEl.innerHTML = colors.map(c=>`<span class="variant-box" data-color="${c}">${c}</span>`).join("");
    variantsEl.querySelectorAll(".variant-box").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if(selectedColor === btn.dataset.color){
          selectedColor = null;
          btn.classList.remove("active");
        }else{
          selectedColor = btn.dataset.color;
          variantsEl.querySelectorAll(".variant-box").forEach(b=>b.classList.remove("active"));
          btn.classList.add("active");
        }
        computeStock();
        updateWhatsappLink();
      });
    });
  }

  computeStock();

  // WhatsApp
const phone = "3122308133"; // <-- pon aquí tu número

    function updateWhatsappLink(){
      let msg =
    `Hola, me interesa este producto:
    
    Producto: ${product.name}`;

      if (selectedSize) {
        msg += `\nTalla: ${selectedSize}`;
      }
      if (selectedColor) {
        msg += `\nColor: ${selectedColor}`;
      }

      msg += `\nPrecio: ${formatCOP(product.price)}`;

      msg += `\n\n¿Podrías darme más información?`;

      // encodeURIComponent preserva los saltos de línea correctamente
      whatsappBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }
  updateWhatsappLink();
}

document.addEventListener("DOMContentLoaded", loadProductDetail);
