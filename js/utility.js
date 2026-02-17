/**
 * Generates HTML for a <picture> element with AVIF/WebP support.
 * Assumes the optimizer moves files to images/dist/ and adds extensions.
 */
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

async function fetchWithCache(url, expirationInSeconds = 3600) {
    const cacheKey = `cache_${url}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = (Date.now() - timestamp) > (expirationInSeconds * 1000);

        if (!isExpired) {
            console.log(`%c [Cache Hit] Loading ${url} from storage`, "color: green");
            return data;
        }
    }

    // If no cache or expired, fetch fresh data
    console.log(`%c [Cache Miss] Fetching ${url} from network`, "color: orange");
    const response = await fetch(url);
    const freshData = await response.json();

    // Store in localStorage with current timestamp
    localStorage.setItem(cacheKey, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
    }));

    return freshData;
}

async function fetchWithSmartCache(url) {
    const cacheKey = `data_${url}`;
    const etagKey = `etag_${url}`;
    
    // 1. Get stored data and ETag from localStorage
    const cachedData = localStorage.getItem(cacheKey);
    const cachedEtag = localStorage.getItem(etagKey);

    const headers = {};
    if (cachedEtag) {
        // Tell the server: "Only give me data if it doesn't match this fingerprint"
        headers['If-None-Match'] = cachedEtag;
    }

    try {
        const response = await fetch(url, { headers });

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
        // Fallback to cache if network fails entirely
        return cachedData ? JSON.parse(cachedData) : null;
    }
}
