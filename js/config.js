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
    CONTACT_EMAIL: "pabbajewellers916@gmail.com",
    INSTAGRAM_URL: "https://instagram.com/pabbajewellers",
    CONTACT_NUMBER: "918978569063",
    
    // 5. CACHE SETTINGS
    CACHE_EXPIRATION: 3600, // In seconds (1 hour)
    
    STORE_ADDRESS_EN: "H.No, 3, 12-12/B, Ganesh Nagar, Ramanthapur, Hyderabad, Telangana 500013, India",
    STORE_ADDRESS_TE: "హెచ్. నెం. 3, 12-12/B, గణేష్ నగర్, రామంతాపూర్, హైదరాబాద్, తెలంగాణ 500013, భారత్",

    // Google Maps
    GOOGLE_MAPS_EMBED_URL: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3445.4409025845193!2d78.52809857462714!3d17.39564920256807!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9905184fe753%3A0x5df8cf5942aa41ad!2sPabba%20Jewellers%20%26%20Co.!5e1!3m2!1sen!2sus!4v1771431248249!5m2!1sen!2sus",
    GOOGLE_MAPS_URL: "https://maps.app.goo.gl/LFFWMCc9XKCnGGK77" // For the clickable button
};

// Freeze the object so logic files don't accidentally overwrite settings
Object.freeze(CONFIG);
