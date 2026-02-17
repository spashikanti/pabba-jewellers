// Global Modal State
let currentSlideIndex = 0;
let totalSlides = 0;

async function loadCatalogPage() {
    const params = new URLSearchParams(window.location.search);
    const categoryID = params.get('category');
    try {
        const [allCollections, allProductsData] = await Promise.all([fetchWithSmartCache('collections.json'), fetchWithSmartCache('products.json')]);
        //const allCollections = await collRes.json();
        //const allProductsData = await prodRes.json();
        allProducts = allProductsData;

        if (categoryID) {
            //const currentCollection = allCollections.find(c => String(c.id) === String(categoryID));
            // 2. Match using gallery_id (String) instead of id (Number)
            const currentCollection = allCollections.find(c => c.gallery_id === categoryID);
            
            if (currentCollection) {
                updateBreadcrumbs(currentCollection.name_en, currentCollection.name_te);
                document.getElementById('categoryTitle').textContent = currentLang === 'te' ? currentCollection.name_te : currentCollection.name_en;
            }
            // filteredProducts = allProducts.filter(p => String(p.category_id) === String(categoryID));
            // 3. Filter products using the string-based category_id
            filteredProducts = allProducts.filter(p => p.category_id === categoryID);
        } else {
            updateBreadcrumbs();
            filteredProducts = allProducts;
        }
        renderCatalog(filteredProducts);
    } catch (err) { console.error("Catalog Loading Error:", err); }
}

function renderCatalog(items) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;"><h3 class="gold">No Items Found in this Collection</h3></div>`;
        return;
    }

    grid.innerHTML = items.map(item => {
        // IT Standard: Ensure we handle the folder path correctly
        // If image_name1 is "Products_Images/xyz.jpg", the URL becomes images/Products_Images/xyz.jpg

        if (item.image) {        
            const fullImagePath = `images/${item.image}`;
            const displayName = currentLang === 'en' ? item.title_en : item.title_te;
            const picHtml = getPictureHtml(item.image, displayName);
    
            return `
                <div class="product-card" onclick="openProductModal('${item.id}')">
                    ${picHtml}
                    <div class="product-info">
                        <h4 data-en="${item.title_en}" data-te="${item.title_te}">${displayName}</h4>
                        <p class="price-tag">${item.price || 'Price on Request'}</p>
                        <button class="view-btn" data-en="View Details" data-te="వివరాలు చూడండి">
                            ${currentLang === 'en' ? 'View Details' : 'వివరాలు చూడండి'}
                        </button>
                    </div>
                </div>
            `;
        }
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
    const product = allProducts.find(p => String(p.id) === String(id));
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
        
        /*
        const img = document.createElement('img');
        const cleanPath = imgName.startsWith('images/') ? imgName : `images/${imgName}`;
        img.src = cleanPath;
        img.alt = product.title_en;        
        
        // Hide loader once image is ready
        img.onload = () => {
            const loader = container.querySelector('.loader');
            if (loader) loader.remove();
        };*/
        
        // Generate the Picture HTML
        const displayName = currentLang === 'en' ? product.title_en : product.title_te;
        const picHtmlString = getPictureHtml(imgName, displayName, "");

        
        // Convert string to real DOM element
        const wrapper = document.createElement('div');
        wrapper.innerHTML = picHtmlString.trim();
        const picHtml = wrapper.firstElementChild;

        //console.log(picHtml);

        // Grab the actual <img> tag from inside the <picture> for logic
        const img = picHtml.querySelector('img');

        // Remove loader when image loads
        img.onload = () => {
            const loader = container.querySelector('.loader');
            if (loader) loader.remove();
        };
        
        img.onclick = (e) => e.currentTarget.classList.toggle('zoomed');
       
        //track.appendChild(picHtml);
        container.appendChild(picHtml);
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

const track = document.querySelector('.carousel-track');
let touchStartX = 0;
let touchEndX = 0;

function initSwipe() {
    track.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const swipeThreshold = 50; 
    if (touchStartX - touchEndX > swipeThreshold) {
        moveSlide(1); // Changed from moveNext()
    } else if (touchEndX - touchStartX > swipeThreshold) {
        moveSlide(-1); // Changed from movePrev()
    }
}

// Search Block
let searchTimeout = null;

function initSearch() {
    const searchInput = document.getElementById('catalogSearch');
    const clearBtn = document.getElementById('clearSearch');
    if (!searchInput || !clearBtn) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        // Toggle Clear Button visibility
        clearBtn.style.display = query.length > 0 ? 'block' : 'none';
        // Debounce search logic
        clearTimeout(searchTimeout);

        // 1. Debounce the search for better performance
        searchTimeout = setTimeout(() => {
            performSearch(query);
            // 2. Log the search for the future Admin Dashboard
            if (query.length > 2) {
                logSearchQuery(query);
            }
        }, 300);
    });
    
    // Handle Clear Button click
    clearBtn.addEventListener('click', () => {
        searchInput.value = "";
        clearBtn.style.display = 'none';
        searchInput.focus();
        performSearch(""); // Reset catalog
    });
}

function performSearch(query) {
    // 1. Determine the 'Pool' of products to search from
    // Use the already filtered category list if it exists, otherwise use all products
    const searchPool = (typeof filteredProducts !== 'undefined' && filteredProducts.length > 0) 
                       ? filteredProducts 
                       : allProducts;

    if (query === "") {
        renderCatalog(searchPool); 
        return;
    }

    const filtered = searchPool.filter(item => {
        const titleEn = (item.title_en || "").toLowerCase();
        const titleTe = (item.title_te || "").toLowerCase();
        const id = String(item.id || "").toLowerCase();
        //Also search by tags!
        const tags = (item.search_tags || "").toLowerCase();
        return titleEn.includes(query) || titleTe.includes(query) || id.includes(query) || tags.includes(query);
    });

    renderCatalog(filtered);

    // UI Update: Show "Searching in [Category]"
    const countEl = document.getElementById('itemCount');
    if (query !== "" && countEl) {
        countEl.innerHTML += ` (filtered for "${query}")`;
    }
}

function logSearchQuery(query) {
    console.log(`Admin Logging: User searched for "${query}"`);
    
    // Future Development:
    // fetch('YOUR_APPS_SCRIPT_WEBHOOK_URL', {
    //   method: 'POST',
    //   body: JSON.stringify({ searchQuery: query, timestamp: new Date() })
    // });
}

