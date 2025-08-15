console.log("publicHome.js cargado correctamente");

// Inicializar variables globales si no existen (comparten con apiService.js)
window.categoriasSeleccionadas = window.categoriasSeleccionadas || [];
window.absolutasSeleccionadas = window.absolutasSeleccionadas || [];

// ======================== API ========================

function getCategoriasTree() {
  return fetch(`${API_BASE_URL}/categories-tree/`)
    .then(res => {
      if (!res.ok) throw new Error("Error al obtener categorías padre/hija");
      return res.json();
    });
}

// ======================== Selección de categorías ========================

function toggleCategoria(id, element) {
  id = parseInt(id);
  if (window.categoriasSeleccionadas.includes(id)) {
    window.categoriasSeleccionadas = window.categoriasSeleccionadas.filter(c => c !== id);
    element.classList.remove('active');
  } else {
    window.categoriasSeleccionadas.push(id);
    element.classList.add('active');
  }
}

// ======================== Render de categorías en modal ========================

function renderCategorias(cats) {
  const cont = document.getElementById('listaCategorias');
  if (!cont) return;
  cont.innerHTML = '';

  cats.forEach(parent => {
    const padreDiv = document.createElement('div');
    padreDiv.className = 'option-box';
    padreDiv.dataset.id = parent.id;
    padreDiv.dataset.nombre = parent.nombre;
    padreDiv.textContent = parent.nombre;
    padreDiv.onclick = () => toggleCategoria(parent.id, padreDiv);
    cont.appendChild(padreDiv);

    parent.hijas.forEach(h => {
      const hijaDiv = document.createElement('div');
      hijaDiv.className = 'option-box';
      hijaDiv.dataset.id = h.id;
      hijaDiv.dataset.nombre = h.nombre;
      hijaDiv.textContent = h.nombre;
      hijaDiv.onclick = () => toggleCategoria(h.id, hijaDiv);
      cont.appendChild(hijaDiv);
    });
  });
}

// ======================== Filtro del buscador ========================

document.addEventListener('DOMContentLoaded', function () {
  const modalCategorias = document.getElementById('modalCategorias');

  if (modalCategorias) {
    modalCategorias.addEventListener('shown.bs.modal', function () {
      getCategoriasTree()
        .then(data => {
          console.log("Categorías desde backend:", data);
          renderCategorias(data);
        })
        .catch(err => console.error("Error cargando categorías:", err));
    });
  }

// Buscador en modal
const searchInput = document.getElementById('buscarCategoria'); // ID corregido
if (searchInput) {
  searchInput.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('#listaCategorias .option-box').forEach(box => {
      const nombre = box.dataset.nombre || box.textContent;
      if (!box.dataset.nombre) box.dataset.nombre = nombre;

      if (nombre.toLowerCase().includes(term)) {
        box.style.display = '';
        box.innerHTML = term
          ? nombre.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>')
          : nombre;
      } else {
        box.style.display = 'none';
      }
    });
  });
}

  

  const aplicarBtn = document.getElementById('aplicarCategorias');
  if (aplicarBtn) {
    aplicarBtn.addEventListener('click', aplicarFiltroCategorias);
  }

  const limpiarBtn = document.getElementById('limpiarCategorias');
  if (limpiarBtn) {
    limpiarBtn.addEventListener('click', () => {
      window.categoriasSeleccionadas = [];
      document.querySelectorAll('.option-box.active').forEach(el => el.classList.remove('active'));
      cargarProductos();
    });
  }
});


// ======================== Aplicar filtro y cargar productos ========================

function aplicarFiltroCategorias() {
  cargarProductos();
}

async function cargarProductos() {
  let url = `${API_BASE_URL}/products/?page=1`;

  if (window.categoriasSeleccionadas.length) {
    url += `&categories=${window.categoriasSeleccionadas.join(',')}`;
  }

  if (window.absolutasSeleccionadas.length) {
    url += `&absolute_categories=${window.absolutasSeleccionadas.join(',')}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Error al obtener productos: ${res.status}`);
    const data = await res.json();

    if (typeof renderProducts === 'function') {
      renderProducts(data.results);
    } else {
      console.warn("⚠️ No se encontró la función renderProducts, mostrando datos en consola:");
      console.log(data.results);
    }
  } catch (err) {
    console.error('Error en cargarProductos:', err);
  }
}

// ======================== Render genérico de productos ========================

function renderProductosGenerico(productos) {
  const contenedor = document.getElementById('productosContainer');
  if (!contenedor) {
    console.warn("⚠️ No se encontró contenedor de productos");
    return;
  }

  contenedor.innerHTML = '';

  if (!productos.length) {
    contenedor.innerHTML = '<p>No se encontraron productos.</p>';
    return;
  }

  productos.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'card m-2';
    card.style.width = '14rem';
    card.innerHTML = `
      <img src="${prod.images && prod.images.length ? prod.images[0].image : '/static/img/no-image.png'}" 
           class="card-img-top" alt="${prod.name}">
      <div class="card-body">
        <h5 class="card-title">${prod.name}</h5>
        <p class="card-text">$${prod.price}</p>
        <a href="/producto/${prod.id}/" class="btn btn-primary">Ver</a>
      </div>
    `;
    contenedor.appendChild(card);
  });
}
