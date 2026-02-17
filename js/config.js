// config.js - The User's Configuration File
const CONFIG = {
    // 1. BRANDING
    STORE_NAME_EN: "Pabba Jewellers",
    STORE_NAME_TE: "పబ్బా జ్యువెలర్స్",
    ESTABLISHED_YEAR: 2026,
    
    // 2. DATA SOURCE (The Apps Script URL)
    // Replace with your deployed Web App URL
    SCRIPT_URL: "https://script.google.com/macros/s/YOUR_APPS_SCRIPT_ID/exec",

    // 3. UI SETTINGS
    DEFAULT_LANG: "en", // 'en' or 'te'
    CURRENCY_SYMBOL: "₹",
    ITEMS_PER_PAGE: 12,

    // 4. CONTACT & SOCIAL
    WHATSAPP_NUMBER: "918978569063",
    CONTACT_EMAIL: "info@pabbajewellers.com",
    INSTAGRAM_URL: "https://instagram.com/pabbajewellers",
    
    // 5. CACHE SETTINGS
    CACHE_EXPIRATION: 3600 // In seconds (1 hour)
};

// Freeze the object so logic files don't accidentally overwrite settings
Object.freeze(CONFIG);
