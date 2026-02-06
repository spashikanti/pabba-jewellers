
/* --- GLOBAL STATE --- */
let currentLang = localStorage.getItem('preferredLang') || 'en';
let allProducts = []; // Stores the full JSON list
let filteredProducts = []; // Stores items currently being displayed

/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLanguageToggle();
    initScrollEffects();
    applyLanguage();
    
    // Check which page we are on and load appropriate data
    if (document.getElementById('collectionsGrid')) {
        // We MUST wait for the data to load before starting the slider
        loadCollectionsHome().then(() => {
            initCollectionSlider(); // Now it knows how many items exist!
        });
        loadTestimonials();
    }
    
    if (document.getElementById('catalogGrid')) {
        loadCatalogPage();
    }

    // Initialize Counter Observer
    const trustSection = document.querySelector('.trust');
    if (trustSection) trustObserver.observe(trustSection);
});

/* --- NAVIGATION & UI --- */
function initNavigation() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    const closeBtn = document.getElementById('close-menu');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            navLinks.classList.add('active');
            menuToggle.style.visibility = 'hidden'; // Better than opacity 0 for accessibility
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.style.visibility = 'visible';
            });
        }
    }
}

function initScrollEffects() {
    const nav = document.querySelector('.navbar');
    const backToTopBtn = document.getElementById('backToTop');

    window.addEventListener('scroll', () => {
        // Sticky Navbar Effect
        if (window.scrollY > 50) nav.classList.add('scrolled');
        else nav.classList.remove('scrolled');

        // Back to Top Visibility
        if (backToTopBtn) {
            if (window.pageYOffset > 400) backToTopBtn.classList.add('show');
            else backToTopBtn.classList.remove('show');
        }
    });

    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/* --- LANGUAGE TOGGLE --- */
function initLanguageToggle() {
    const langBtn = document.getElementById('lang-toggle');
    if (!langBtn) return;

    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'te' : 'en';
        // SAVE to browser memory
        localStorage.setItem('preferredLang', currentLang);
        applyLanguage();
    });
}
function applyLanguage() {
    const langBtn = document.getElementById('lang-toggle');
    
    // 1. Update Static Text (data-en / data-te)
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });

    // 2. Update Toggle Button Label
    if (langBtn) {
        langBtn.textContent = currentLang === 'en' ? 'తెలుగు' : 'English';
    }

    // 3. Update dynamic grids if they exist
    if (document.getElementById('catalogGrid')) renderCatalog(filteredProducts);
    if (document.getElementById('collectionsGrid')) loadCollectionsHome();
}

/* --- HOME PAGE: COLLECTIONS --- */
function loadCollectionsHome() {
    return fetch("collections.json")
        .then(r => r.json())
        .then(cols => {
            const grid = document.getElementById("collectionsGrid");
            if (!grid) return;
            grid.innerHTML = cols.map(c => `
                <a href="catalog.html?category=${c.id}" class="card">
                    <img src="images/${c.image}" alt="${c.name_en}">
                    <h3 class="gold">${currentLang === 'en' ? c.name_en : c.name_te}</h3>
                </a>
            `).join('');
        })
        .catch(err => console.error("Error loading collections:", err));
}

/* --- CATALOG PAGE: LOGIC --- */
async function loadCatalogPage() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json();
        
        const params = new URLSearchParams(window.location.search);
        const categoryFilter = params.get('category');

        // BUILD THE BREADCRUMB
        updateBreadcrumbs(categoryFilter);
        
        if (categoryFilter) {
            const titleEl = document.getElementById('categoryTitle');
            if (titleEl) titleEl.innerText = categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1) + " Collection";
            filteredProducts = allProducts.filter(p => p.category === categoryFilter);
        } else {
            filteredProducts = allProducts;
        }

        renderCatalog(filteredProducts);
    } catch (err) {
        console.error("Catalog Loading Error:", err);
    }
}

function renderCatalog(items) {
    const grid = document.getElementById('catalogGrid');
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;"><h3 class="gold">Collection Not Found</h3></div>`;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="product-card" onclick="openProductModal(${item.id})">
            <img src="images/${item.image}" alt="${item.title_en}" loading="lazy">
            <div class="product-info">
                <h4>${currentLang === 'en' ? item.title_en : item.title_te}</h4>
                <p class="price-tag">${item.price || 'Price on Request'}</p>
                <button class="view-btn">View Details</button>
            </div>
        </div>
    `).join('');

    const countEl = document.getElementById('itemCount');
    if (countEl) countEl.innerText = `${items.length} Items Found`;
}

/* --- MODAL LOGIC --- */
let currentSlideIndex = 0;
let totalSlides = 0;

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
// Carousel Navigation Functions
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

/* --- TESTIMONIALS --- */
async function loadTestimonials() {
    const container = document.getElementById('testimonial-container');
    if (!container) return;

    try {
        const response = await fetch('./testimonials.json');
        const data = await response.json();
        
        container.innerHTML = data.map((item, index) => `
            <div class="testimonial" style="display: ${index === 0 ? 'block' : 'none'}; opacity: ${index === 0 ? '1' : '0'}">
                <p class="testimonial-text">"${item.text}"</p>
                <h4 class="testimonial-author">- ${item.name}</h4>
                <div class="stars">${item.rating}</div>
            </div>
        `).join('');

        if (data.length > 1) startCarousel();
    } catch (error) {
        container.innerHTML = "<p>Trusted by families since 2026.</p>";
    }
}

function startCarousel() {
    let current = 0;
    const items = document.querySelectorAll('.testimonial');
    if (items.length === 0) return;

    setInterval(() => {
        items[current].style.opacity = '0';
        setTimeout(() => {
            items[current].style.display = 'none';
            current = (current + 1) % items.length;
            items[current].style.display = 'block';
            setTimeout(() => { items[current].style.opacity = '1'; }, 50);
        }, 500);
    }, 5000);
}

/* --- COUNTER ANIMATION --- */
function animateCounters() {
    const counters = [
        { id: 'customerCount', target: 483, suffix: '+', decimals: 0 },
        { id: 'ratingCount', target: 4.3, suffix: '★', decimals: 1 }
    ];

    counters.forEach(counter => {
        const element = document.getElementById(counter.id);
        if (!element) return;

        let start = 0;
        const duration = 2000;
        const totalSteps = duration / 16;
        const increment = counter.target / totalSteps;

        const updateCount = () => {
            start += increment;
            if (start < counter.target) {
                element.innerText = start.toFixed(counter.decimals) + counter.suffix;
                requestAnimationFrame(updateCount);
            } else {
                // Final catch to ensure exact number
                element.innerText = counter.target.toFixed(counter.decimals) + counter.suffix;
                //element.innerText = counter.target + counter.suffix;
            }
        };
        updateCount();
    });
}

const trustObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            trustObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

/* --- GLOBAL INITIALIZATION (Bottom of file) --- */
// Update your popstate to be more specific
window.addEventListener('popstate', (event) => {
    // Only close if the state is NOT modalOpen (meaning we went back)
    if (!event.state || !event.state.modalOpen) {
        const modal = document.getElementById('productModal');
        if (modal) {
            document.body.classList.remove('modal-open');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
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

function initCollectionSlider() {
    const grid = document.getElementById('collectionsGrid');
    const nextBtn = document.getElementById('colNext');
    const prevBtn = document.getElementById('colPrev');
    
    // If buttons don't exist in HTML, stop JS to prevent errors
    if (!grid || !nextBtn || !prevBtn) return;

    let currentIndex = 0;
    const items = grid.children;
    const totalItems = items.length;

    // 1. Determine how many items are visible at once based on screen width
    function getVisibleCount() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3; // Desktop
    }

    function updateSlider() {
        const visibleCount = getVisibleCount();
        
        // Hide arrows if we have fewer items than the screen can show
        if (totalItems <= visibleCount) {
            nextBtn.style.display = 'none';
            prevBtn.style.display = 'none';
            grid.style.transform = `translateX(0)`;
            return;
        } else {
            // Use flex on desktop/tablet, hide on mobile if you prefer swipe
            nextBtn.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
            prevBtn.style.display = window.innerWidth <= 768 ? 'none' : 'flex';
        }

        // Calculate the slide percentage
        // We use 100 / visibleCount to move exactly one 'frame'
        const movePercentage = -(currentIndex * (100 / visibleCount));
        grid.style.transform = `translateX(${movePercentage}%)`;
    }

    // Explicitly clear existing listeners to prevent double-sliding
    nextBtn.onclick = () => {
        const visibleCount = getVisibleCount();
        if (currentIndex >= totalItems - visibleCount) {
            currentIndex = 0;
        } else {
            currentIndex++;
        }
        updateSlider();
    };

    prevBtn.onclick = () => {
        const visibleCount = getVisibleCount();
        if (currentIndex <= 0) {
            currentIndex = totalItems - visibleCount;
        } else {
            currentIndex--;
        }
        updateSlider();
    };

    // 2. Auto-slide Logic with "Pause on Hover"
    let autoSlideInterval = setInterval(() => nextBtn.click(), 5000);

    // Pause on hover
    grid.onmouseenter = () => clearInterval(autoSlideInterval);
    grid.onmouseleave = () => {
        clearInterval(autoSlideInterval); // Clear first to be safe
        autoSlideInterval = setInterval(() => nextBtn.click(), 5000);
    };

    // 3. Handle Screen Resizing (Switching from Mobile to Desktop)
    window.addEventListener('resize', () => {
        currentIndex = 0; // Reset to avoid math errors during resize
        updateSlider();
    });

    updateSlider(); // Initial call
}

if (document.getElementById('fullCollectionsGrid')) {
    loadFullCollections();
}

function loadFullCollections() {
    const grid = document.getElementById("fullCollectionsGrid");
    if (!grid) return;

    fetch("collections.json")
        .then(r => r.json())
        .then(cols => {
            grid.innerHTML = cols.map(c => `
                <div class="collection-card" onclick="window.location.href='catalog.html?category=${c.id}'">
                    <img src="images/${c.image}" alt="${c.name_en}">
                    <div class="card-overlay">
                        <h3>${currentLang === 'en' ? c.name_en : c.name_te}</h3>
                        <span class="view-all-btn">Explore Collection</span>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => console.error("Error loading full collections:", err));
}

function updateBreadcrumbs(categoryID) {
    const trail = document.getElementById('breadcrumb-trail');
    if (!trail) return;

    const isTelugu = (currentLang === 'te');
    
    // 1. Start with Home
    let html = `<a href="index.html">${isTelugu ? 'హోమ్' : 'Home'}</a>`;
    html += `<span class="separator">/</span>`;
    
    // 2. Add "All Collections" Link
    html += `<a href="collections.html">${isTelugu ? 'అన్ని సేకరణలు' : 'All Collections'}</a>`;
    
    // 3. If a specific category is selected, add it as the final "Current" item
    if (categoryID) {
        html += `<span class="separator">/</span>`;
        // Capitalize category ID for display
        const displayID = categoryID.charAt(0).toUpperCase() + categoryID.slice(1);
        html += `<span class="current-page">${displayID}</span>`;
    }

    trail.innerHTML = html;
}

