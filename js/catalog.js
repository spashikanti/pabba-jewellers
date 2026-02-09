// Global Modal State
let currentSlideIndex = 0;
let totalSlides = 0;

document.addEventListener('DOMContentLoaded', () => {
    alert('DOMContentLoaded');
    if (document.getElementById('catalogGrid')) {
        alert('catalogGrid loaded');
        loadCatalogPage();
    }
    
    // Modal Close Listeners
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
    window.onclick = (e) => { if (e.target === document.getElementById('productModal')) closeModal(); };
});

async function loadCatalogPage() {
    const params = new URLSearchParams(window.location.search);
    const categoryID = params.get('category');
    alert(categoryID);
    try {
        const [collRes, prodRes] = await Promise.all([fetch('collections.json'), fetch('products.json')]);
        const allCollections = await collRes.json();
        const allProductsData = await prodRes.json();
        allProducts = allProductsData;

        if (categoryID) {
            const currentCollection = allCollections.find(c => String(c.id) === String(categoryID));
            if (currentCollection) {
                updateBreadcrumbs(currentCollection.name_en, currentCollection.name_te);
                document.getElementById('categoryTitle').textContent = currentLang === 'te' ? currentCollection.name_te : currentCollection.name_en;
            }
            filteredProducts = allProducts.filter(p => String(p.id) === String(categoryID));
        } else {
            updateBreadcrumbs();
            filteredProducts = allProducts;
        }
        renderCatalog(filteredProducts);
    } catch (err) { console.error("Catalog Loading Error:", err); }
}

function renderCatalog(items) {
    alert('renderCatalog :' + items);
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;"><h3 class="gold">No Items Found in this Collection</h3></div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        // IT Standard: Ensure we handle the folder path correctly
        // If image_name1 is "Products_Images/xyz.jpg", the URL becomes images/Products_Images/xyz.jpg
        const fullImagePath = `images/${item.image_name1}`;
        const displayName = currentLang === 'en' ? item.name_en : item.name_te;

        return `
            <div class="product-card" onclick="openProductModal('${item.id}')">
                <img src="${fullImagePath}" alt="${displayName}" loading="lazy">
                <div class="product-info">
                    <h4 data-en="${item.name_en}" data-te="${item.name_te}">${displayName}</h4>
                    <p class="price-tag">${item.price || 'Price on Request'}</p>
                    <button class="view-btn" data-en="View Details" data-te="వివరాలు చూడండి">
                        ${currentLang === 'en' ? 'View Details' : 'వివరాలు చూడండి'}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    const countEl = document.getElementById('itemCount');
    if (countEl) {
        const countTextEn = `${items.length} Items Found`;
        const countTextTe = `${items.length} వస్తువులు కనుగొనబడ్డాయి`;
        countEl.innerText = currentLang === 'en' ? countTextEn : countTextTe;
    }
}

function updateBreadcrumbs(categoryEn, categoryTe) {
    const trail = document.getElementById('breadcrumb-trail');
    if (!trail) return;

    // 1. Build the path using bilingual attributes
    // This allows your language toggle to switch them instantly without a reload
    let html = `
        <a href="index.html" data-en="Home" data-te="హోమ్">Home</a>
        <span class="separator">/</span>
        <a href="collections.html" data-en="Collections" data-te="సేకరణలు">Collections</a>
    `;

    // 2. Add the specific category if provided
    if (categoryEn && categoryTe) {
        html += `
            <span class="separator">/</span>
            <span class="current-page" data-en="${categoryEn}" data-te="${categoryTe}">${categoryEn}</span>
        `;
    }

    trail.innerHTML = html;

    // 3. Trigger your existing language sync if necessary
    // This ensures that if the user is already in Telugu mode, the new links show Telugu
    if (typeof applyLanguage === "function") {
        applyLanguage(currentLang); 
    }
}

function openProductModal(id) {
    // 1. Setup UI Elements & Data
    const product = allProducts.find(p => p.id === id);
    if (!product) {
        console.error("Product not found for ID:", id);
        return;
    }

    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.querySelector('.nav-arrow.prev');
    const nextBtn = document.querySelector('.nav-arrow.next');

    // 2. Initial Reset
    currentSlideIndex = 0;
    track.style.transition = 'none'; 
    track.style.transform = `translateX(0%)`;
    track.innerHTML = "";
    dotsContainer.innerHTML = "";

    // 3. Image & Dot Injection
    const imageList = (product.images && product.images.length > 0) ? [...product.images] : [product.image];
    totalSlides = imageList.length;

    imageList.forEach((imgName, index) => {
        const container = document.createElement('div');
        container.className = 'slide-container'; // Ensures relative positioning for loader
        container.innerHTML = '<div class="loader"></div>';
        
        const img = document.createElement('img');
        const cleanPath = imgName.startsWith('images/') ? imgName : `images/${imgName}`;
        img.src = cleanPath;
        img.alt = product.title_en;
        
        // Hide loader once image is ready
        img.onload = () => {
            const loader = container.querySelector('.loader');
            if (loader) loader.remove();
        };
        
        img.onclick = (e) => e.currentTarget.classList.toggle('zoomed');
        track.appendChild(img);
        track.appendChild(container);

        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    initSwipe();

    // 4. Navigation Controls Logic
    if (prevBtn && nextBtn) {
        if (totalSlides <= 1) {
            prevBtn.classList.add('hidden');
            nextBtn.classList.add('hidden');
            dotsContainer.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
            nextBtn.classList.remove('hidden');
            dotsContainer.classList.remove('hidden');
            prevBtn.onclick = (e) => { e.stopPropagation(); moveSlide(-1); };
            nextBtn.onclick = (e) => { e.stopPropagation(); moveSlide(1); };
        }
    }

    // 5. Details & Specs (Language Aware)
    const isTelugu = (currentLang === 'te');
    document.getElementById('modalTitle').innerText = isTelugu ? product.title_te : product.title_en;
    document.getElementById('modalDesc').innerText = isTelugu ? product.desc_te : product.desc_en;

    const specsGrid = document.getElementById('modalSpecs');
    specsGrid.innerHTML = "";

    if (product.specs) {
        // A. Handle Standard Specs (Purity & Weight)
        const purityLabel = isTelugu ? 'ప్యూరిటీ' : 'PURITY';
        const weightLabel = isTelugu ? 'బరువు' : 'WEIGHT';
        
        specsGrid.innerHTML = `
            <div class="spec-item">
                <span class="spec-label">${purityLabel}</span>
                <span class="spec-value">${product.specs.purity || '22K'}</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">${weightLabel}</span>
                <span class="spec-value">${product.specs.weight || 'N/A'}</span>
            </div>
        `;

        // B. Handle Stones as a Full Row (The requested fix)
        const stonesVal = isTelugu ? product.specs.stones_te : product.specs.stones_en;
        if (stonesVal && stonesVal.toLowerCase() !== "none") {
            const stonesLabel = isTelugu ? "రాళ్ళు (Stones)" : "STONES";
            specsGrid.innerHTML += `
                <div class="spec-item full-row">
                    <span class="spec-label">${stonesLabel}</span>
                    <span class="spec-value">${stonesVal}</span>
                </div>
            `;
        }
        specsGrid.style.display = 'grid';
    } else {
        specsGrid.style.display = 'none';
    }

    // 6. WhatsApp Link
    const msg = `Enquiry for ${product.title_en} (ID: ${product.id})`;
    document.getElementById('whatsappBtn').href = `https://wa.me/918978569063?text=${encodeURIComponent(msg)}`;

    // 7. Show Modal & Browser History Management (DO ONCE)
    document.getElementById('productModal').style.display = 'flex';
    document.body.classList.add('modal-open');
    document.body.style.overflow = 'hidden'; // iPhone scroll fix
    document.getElementById('backToTop').style.display = 'none';
    window.history.pushState({ modalOpen: true }, "");

    // 8. Re-enable transitions for user sliding
    setTimeout(() => {
        track.style.transition = 'transform 0.4s ease-out';
    }, 50);
}

function moveSlide(step) {
    // IMPORTANT: Remove zoom before sliding so the image doesn't look cut off
    const zoomedImg = document.querySelector('.carousel-track img.zoomed');
    if (zoomedImg) zoomedImg.classList.remove('zoomed');

    currentSlideIndex += step;
    if (currentSlideIndex >= totalSlides) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = totalSlides - 1;
    updateCarousel();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateCarousel();
}

function updateCarousel() {
    const track = document.getElementById('carouselTrack');
    const dots = document.querySelectorAll('.dot');
    
    // Slide the track: 0%, -100%, -200%, etc.
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    
    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlideIndex);
    });
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (!modal || modal.style.display === 'none') return;

    // Reset UI state
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.body.style.overflow = 'auto'; // Re-enable scroll
    const btt = document.getElementById('backToTop');
    if (btt) btt.style.display = 'flex';
    
    // Clean up zoom
    const track = document.getElementById('carouselTrack');
    if (track) {
        track.querySelectorAll('.zoomed').forEach(el => el.classList.remove('zoomed'));
    }

    // Remove Arrow Listeners to prevent "ghost" clicks
    const prevBtn = document.querySelector('.nav-arrow.prev');
    const nextBtn = document.querySelector('.nav-arrow.next');
    if (prevBtn) prevBtn.onclick = null;
    if (nextBtn) nextBtn.onclick = null;

    if (window.history.state && window.history.state.modalOpen) {
        window.history.back();
    }
}

// Safety check: Only add listener if the button exists (Catalog Page)
const modalCloseBtn = document.getElementById('modalCloseBtn');
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
}

// Close modal when clicking outside content
window.addEventListener('click', (event) => {
    const modal = document.getElementById('productModal');
    if (event.target === modal) {
        closeModal();
    }
});
