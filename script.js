/* --- GLOBAL STATE --- */
let currentLang = 'en';
let allProducts = []; // Stores the full JSON list
let filteredProducts = []; // Stores items currently being displayed

/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initLanguageToggle();
    initScrollEffects();
    
    // Check which page we are on and load appropriate data
    if (document.getElementById('collectionsGrid')) {
        loadCollectionsHome();
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
        // Open Menu
        menuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.classList.add('active');
            // FIX: Hide hamburger so it doesn't clash with the close 'X'
            menuToggle.style.opacity = '0';
            menuToggle.style.pointerEvents = 'none';
        });

        // Inside initNavigation function
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                navLinks.classList.remove('active');
                // FIX: Bring hamburger back
                menuToggle.style.opacity = '1';
                menuToggle.style.pointerEvents = 'auto';
            });
        }

        // Close mobile menu on link click
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => navLinks.classList.remove('active'));
            menuToggle.style.opacity = '1';
            menuToggle.style.pointerEvents = 'auto';
        });
        
    } else {
        console.error("Navigation IDs (mobile-menu or nav-links) not found in HTML.");
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
        
        // Update Static Text
        document.querySelectorAll('[data-en]').forEach(el => {
            el.textContent = el.getAttribute(`data-${currentLang}`);
        });

        // Update Button Text
        langBtn.textContent = currentLang === 'en' ? 'తెలుగు' : 'English';

        // Re-render dynamic content if on the page
        if (document.getElementById('catalogGrid')) renderCatalog(filteredProducts);
        if (document.getElementById('collectionsGrid')) loadCollectionsHome();
    });
}

/* --- HOME PAGE: COLLECTIONS --- */
function loadCollectionsHome() {
    fetch("collections.json")
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
    const product = allProducts.find(p => p.id === id);
    if (!product) {
        console.error("Product not found for ID:", id);
        return;
    }

    // Reset Carousel State
    currentSlideIndex = 0;
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('dotsContainer');
    const prevBtn = document.querySelector('.nav-arrow.prev');
    const nextBtn = document.querySelector('.nav-arrow.next');

    // 1. Setup Images & Dots
    track.innerHTML = "";
    dotsContainer.innerHTML = "";
    
    const imageList = product.images || [];
    totalSlides = imageList.length;

    imageList.forEach((imgName, index) => {
        // Inject Images (Adding the images/ folder path here)
        const img = document.createElement('img');
        img.src = `images/${imgName}`; 
        track.appendChild(img);

        // Inject Dots
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.onclick = () => goToSlide(index);
        dotsContainer.appendChild(dot);
    });

    // Hide arrows if only 1 image
    if (totalSlides <= 1) {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        dotsContainer.classList.add('hidden');
    } else {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
        dotsContainer.classList.remove('hidden');
    }

    // 2. Setup Details & Specs
    document.getElementById('modalTitle').innerText = currentLang === 'en' ? product.title_en : product.title_te;
    document.getElementById('modalDesc').innerText = currentLang === 'en' ? product.desc_en : product.desc_te;

    const specsGrid = document.getElementById('modalSpecs');
    specsGrid.innerHTML = "";
    if (product.specs) {
        for (const [key, value] of Object.entries(product.specs)) {
            specsGrid.innerHTML += `
                <div class="spec-item">
                    <span class="spec-label">${key}</span>
                    <span class="spec-value">${value}</span>
                </div>`;
        }
        specsGrid.style.display = 'grid';
    } else {
        specsGrid.style.display = 'none';
    }

    // 3. WhatsApp link
    const msg = `Enquiry for ${product.title_en} (ID: ${product.id})`;
    document.getElementById('whatsappBtn').href = `https://wa.me/91XXXXXXXXXX?text=${encodeURIComponent(msg)}`;

    goToSlide(0); // Reset to first slide
    document.getElementById('productModal').style.display = 'flex';
    
    /* --- ADD THIS LINE FOR IPHONE SCROLL FIX --- */
    document.body.style.overflow = 'hidden';
    // to handle the "Back" button
    window.history.pushState({ modalOpen: true }, "");
    // Add this listener at the bottom of your file
    window.addEventListener('popstate', () => {
        closeModal();
    });
}
// Carousel Navigation Functions
function moveSlide(step) {
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
    if (modal) {
        modal.style.display = 'none';
        /* --- ADD THIS LINE TO RESTORE SCROLLING --- */
        document.body.style.overflow = 'auto'; 
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
                element.innerText = counter.target + counter.suffix;
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
