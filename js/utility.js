/**
 * Utility Module
 * Handles Data Fetching, Caching, and Global UI Sync
*/

/**
 * Generates HTML for a <picture> element with AVIF/WebP support.
 * Assumes the optimizer moves files to images/dist/ and adds extensions.
**/
function getPictureHtml(imagePath, altText, className = "") {
    if (!imagePath) return "";

    // Extract filename: "Products_Images/gold_ring.jpg" -> "gold_ring"
    const fileName = imagePath.replace(/\.[^/.]+$/, "");
    
    return `
        <picture class="${className}">
            <source srcset="${fileName}.avif" type="image/avif">
            <source srcset="${fileName}.webp" type="image/webp">
            <img src="${imagePath}" 
                 alt="${altText}" 
                 class="${className}" 
                 loading="lazy" 
                 decoding="async">
        </picture>
    `;
}

/**
 * 2. SMART DATA FETCHING
 * Uses ETag (fingerprinting) and LocalStorage for near-instant loads.
**/
async function fetchWithSmartCache(url) {
    const cacheKey = `data_${url}`;
    const etagKey = `etag_${url}`;
    
    // 1. Get stored data and ETag from localStorage
    const cachedData = localStorage.getItem(cacheKey);
    const cachedEtag = localStorage.getItem(etagKey);

    // 1. Check if user is offline and we have no cache
    if (!navigator.onLine && !cachedData) {
        showNoConnectionMessage();
        return []; // Return empty array to prevent code crashes
    }

    const headers = {};
    if (cachedEtag) {
        // Tell the server: "Only give me data if it doesn't match this fingerprint"
        headers['If-None-Match'] = cachedEtag;
    }

    try {
        const response = await fetch(url, { 
            headers,
            cache: 'no-cache' // Ensures we always check GitHub for the latest version
        });

        // Status 304 means the file hasn't changed!
        if (response.status === 304 && cachedData) {
            console.log(`%c [Smart Cache] No changes detected for ${url}. Using local copy.`, "color: blue");
            return JSON.parse(cachedData);
        }

        // Status 200 means there's a new version or first-time load
        if (response.ok) {
            const freshData = await response.json();
            const newEtag = response.headers.get('ETag');

            // Update localStorage
            localStorage.setItem(cacheKey, JSON.stringify(freshData));
            if (newEtag) localStorage.setItem(etagKey, newEtag);

            console.log(`%c [Network] New version of ${url} loaded and cached.`, "color: orange");
            return freshData;
        }
    } catch (err) {
        console.error("Smart Cache Error:", err);
        console.warn(`Network fetch failed for ${url}, attempting cache fallback.`, err);
        // 2. Final Fallback: If network is jittery/down, return cache even if expired
        // Fallback to cache if network fails entirely
        return cachedData ? JSON.parse(cachedData) : [];
    }
}

/**
 * 3. GLOBAL UI SYNC
 * Fills all titles, links, and brand names from CONFIG.js
 */
function syncGlobalUI() {
    const isTe = (currentLang === 'te');
    const storeName = isTe ? CONFIG.STORE_NAME_TE : CONFIG.STORE_NAME_EN;
    // A. Browser Tab Title
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category') || "";
    document.title = `${storeName} ${category ? '- ' + category : ''}`;

    // B. Brand Names (Navbar & Footer)
    const brandText = currentLang === 'te' ? CONFIG.STORE_NAME_TE : CONFIG.STORE_NAME_EN;
    document.querySelectorAll('.brand-name').forEach(el => el.innerText = brandText);

    // C. Phone Links (Footer & Nav)
    document.querySelectorAll('.config-phone-link').forEach(el => {
        el.innerText = CONFIG.WHATSAPP_NUMBER;
        // Clean the number of any + or spaces before adding one +
        const cleanPhone = CONFIG.WHATSAPP_NUMBER.replace(/\D/g, '');
        el.href = `tel:+${cleanPhone}`;
    });

    // D. Social Media
    const fbLink = document.getElementById('facebookLink');
    const igLink = document.getElementById('instagramLink');
    if (fbLink) fbLink.href = CONFIG.FACEBOOK_URL;
    if (igLink) igLink.href = CONFIG.INSTAGRAM_URL;

    // E. Footer Copyright
    const footerCredit = document.getElementById('footerCredit');
    if (footerCredit) {
        const year = new Date().getFullYear();
        // B. Brand Names (Navbar & Footer)
        const footerStoreText = currentLang === 'te' ? CONFIG.STORE_NAME_TE : CONFIG.STORE_NAME_EN;
        const footerReservationText = currentLang === 'te' ? CONFIG.RESERVATION_TE : CONFIG.RESERVATION_EN;
        footerCredit.innerHTML = `&copy; ${CONFIG.ESTABLISHED_YEAR} - ${year} ${footerStoreText} ${footerReservationText}`;
    }
}

/**
 * 4. CONTACT SECTION SYNC
 * Specific to contact.html or footer contact area
**/
function setupContactSection() {
    // 1. Phone & Email
    const emailEl = document.getElementById('contactEmail');
    if (emailEl) {
        emailEl.innerText = CONFIG.CONTACT_EMAIL;
        emailEl.href = `mailto:${CONFIG.CONTACT_EMAIL}?subject=Enquiry`;
    }
    const phoneEl = document.getElementById('footerPhoneLink');
    if (phoneEl) {
        phoneEl.innerText = CONFIG.CONTACT_NUMBER;
        phoneEl.href = `tel:+${CONFIG.CONTACT_NUMBER}`;
    }    

    // 2. Address (Main & Footer)
    const addr = (currentLang === 'te') ? CONFIG.STORE_ADDRESS_TE : CONFIG.STORE_ADDRESS_EN;
    const addressElements = ['contactAddress', 'footerAddress'];
    addressElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = addr;
    });

    // 3. Map Links & Iframe
    const mapIframe = document.getElementById('googleMapIframe');
    if (mapIframe) mapIframe.src = CONFIG.GOOGLE_MAPS_EMBED_URL;

    const mapLinks = ['mapLink', 'footerMapLink'];
    mapLinks.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.href = CONFIG.GOOGLE_MAPS_URL;
    });
    
    // Run language attribute sync
    applyLanguage();
}

/**
 * 5. ERROR HANDLING
**/
function showNoConnectionMessage() {
    const grid = document.getElementById('catalogGrid') || document.getElementById('fullCollectionsGrid');
    if (grid) {
        grid.innerHTML = `<div style="text-align:center; padding:50px;">
            <p>⚠️ Offline Mode. Please check your connection.</p>
            <button onclick="location.reload()" class="gold-btn">Retry</button>
        </div>`;
    }
}

function syncFooter() {
    // 1. Address
    const footerAddr = document.getElementById('footerAddress');
    if (footerAddr) {
        footerAddr.innerText = (currentLang === 'te') ? CONFIG.STORE_ADDRESS_TE : CONFIG.STORE_ADDRESS_EN;
    }

    // 2. Map Link
    const footerMap = document.getElementById('footerMapLink');
    if (footerMap) footerMap.href = CONFIG.GOOGLE_MAPS_URL;

    // 3. Phone Link
    const footerPhone = document.getElementById('footerPhoneLink');
    if (footerPhone) {
        footerPhone.innerText = CONFIG.CONTACT_NUMBER;
        footerPhone.href = `tel:${CONFIG.CONTACT_NUMBER}`;
    }

    // 4. Social Links
    if (document.getElementById('footerFacebook')) document.getElementById('footerFacebook').href = CONFIG.FACEBOOK_URL;
    if (document.getElementById('footerInstagram')) document.getElementById('footerInstagram').href = CONFIG.INSTAGRAM_URL;
}

function updateCopyright() {
    const yearEl = document.getElementById('copyrightYear');
    if (yearEl) {
        const currentYear = new Date().getFullYear();
        const estYear = CONFIG.ESTABLISHED_YEAR;
        
        // If it's the same year, just show the year. 
        // If it's later, show the range (e.g., 1995 - 2026)
        yearEl.innerText = (currentYear > estYear) 
            ? `${estYear} - ${currentYear}` 
            : currentYear;
    }
}

/**
 * INIT
 */
document.addEventListener('DOMContentLoaded', () => {
    syncGlobalUI();
    syncFooter();
    updateCopyright();
});

