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
});

/* --- NAVIGATION & UI --- */
function initNavigation() {
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const closeBtn = document.getElementById('close-menu');

    // Open Menu
    if (menuToggle) {
        menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    // Close mobile menu on link click
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('active'));
    });

    // Close Menu with X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => navLinks.classList.remove('active'));
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
        });
}

/* --- CATALOG PAGE: LOGIC --- */
async function loadCatalogPage() {
    try {
        const response = await fetch('products.json');
        allProducts = await response.json();
        
        const params = new URLSearchParams(window.location.search);
        const categoryFilter = params.get('category');
        
        // Update Title and Breadcrumb based on category
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
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 50px 20px;">
                <h3 class="gold">Collection Not Found</h3>
                <p>We couldn't find any items in this specific category.</p>
                <br>
                <a href="catalog.html" class="view-btn" style="text-decoration:none; display:inline-block;">View All Collections</a>
            </div>
        `;
        const countEl = document.getElementById('itemCount');
        if (countEl) countEl.innerText = "0 Items Found";
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
function openProductModal(id) {
    const p = allProducts.find(item => item.id === id);
    if (!p) return;

    const modal = document.getElementById('productModal');
    
    document.getElementById('modalImg').src = "images/" + p.image;
    document.getElementById('modalTitle').innerText = currentLang === 'en' ? p.title_en : p.title_te;
    document.getElementById('modalDesc').innerText = currentLang === 'en' ? p.desc_en : p.desc_te;

    const waBtn = document.getElementById('waBtn');
    const message = encodeURIComponent(`Hi! I'm interested in: *${p.title_en}*\nCategory: ${p.category}\nCould you provide more details?`);
    
    waBtn.onclick = () => {
        window.open(`https://wa.me/918978569063?text=${message}`, '_blank');
    };

    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('productModal');
    if (modal) modal.style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('productModal');
    if (event.target == modal) closeModal();
};

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
        const increment = counter.target / (duration / 16);

        const updateCount = () => {
            start += increment;
            if (start < counter.target) {
                element.innerText = start.toFixed(counter.decimals) + counter.suffix;
                requestAnimationFrame(updateCount);
            } else {
                element.innerText = counter.target + counter.suffix;
                element.classList.add('sparkle-effect');
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

const trustSection = document.querySelector('.trust');
if (trustSection) trustObserver.observe(trustSection);
