import './style.css'

// Translations
const TRANSLATIONS = {
  fr: {
    heroTitle: "Trouvez ce que<br>vous cherchez.",
    heroSubtitle: "Scannez n'importe quel objet pour découvrir les meilleures adresses autour de vous.",
    analyzing: "Analyse intelligente...",
    nearby: "À proximité",
    sortDistance: "Proche",
    sortPrice: "Prix",
    detected: "Détecté :",
    newSearch: "Nouvelle recherche",
    alertGeo: "📍 Veuillez autoriser la géolocalisation dans Réglages → Safari → Position",
    alertError: "❌ Une erreur s'est produite. Veuillez réessayer.",
    choiceTitle: "Que cherchez-vous ?",
    choiceDetected: "Nous avons détecté :",
    categories: {
      "Fournitures de bureau": "Fournitures de bureau",
      "Alimentation": "Alimentation"
    },
    physical: "Physique",
    online: "En ligne"
  },
  en: {
    heroTitle: "Find what<br>you need.",
    heroSubtitle: "Scan any object to discover the best places around you.",
    analyzing: "Smart analyzing...",
    nearby: "Nearby",
    sortDistance: "Closest",
    sortPrice: "Price",
    detected: "Detected:",
    newSearch: "New Search",
    alertGeo: "📍 Please allow location access in Settings → Safari → Location",
    alertError: "❌ An error occurred. Please try again.",
    choiceTitle: "What are you looking for?",
    choiceDetected: "We detected:",
    categories: {
      "Fournitures de bureau": "Office Supplies",
      "Alimentation": "Food & Drink"
    },
    physical: "Physical",
    online: "Online"
  },
  vi: {
    heroTitle: "Tìm những gì<br>bạn cần.",
    heroSubtitle: "Quét bất kỳ đồ vật nào để khám phá những địa điểm tốt nhất xung quanh bạn.",
    analyzing: "Đang phân tích...",
    nearby: "Gần đây",
    sortDistance: "Gần nhất",
    sortPrice: "Giá",
    detected: "Đã phát hiện:",
    newSearch: "Tìm kiếm mới",
    alertGeo: "Vui lòng cho phép định vị.",
    choiceTitle: "Bạn đang tìm kiếm gì?",
    choiceDetected: "Chúng tôi đã phát hiện:",
    categories: {
      "Fournitures de bureau": "Văn phòng phẩm",
      "Alimentation": "Thực phẩm & Đồ uống"
    }
  },
  es: {
    heroTitle: "Encuentra lo que<br>buscas.",
    heroSubtitle: "Escanea cualquier objeto para descubrir los mejores lugares a tu alrededor.",
    analyzing: "Analizando...",
    nearby: "Cerca de ti",
    sortDistance: "Cercanía",
    sortPrice: "Precio",
    detected: "Detectado:",
    newSearch: "Nueva búsqueda",
    alertGeo: "Por favor permite la geolocalización.",
    choiceTitle: "¿Qué estás buscando?",
    choiceDetected: "Detectamos:",
    categories: {
      "Fournitures de bureau": "Artículos de oficina",
      "Alimentation": "Alimentación"
    }
  },
  de: {
    heroTitle: "Finde, was<br>du suchst.",
    heroSubtitle: "Scanne ein Objekt, um die besten Orte in deiner Nähe zu entdecken.",
    analyzing: "Analysieren...",
    nearby: "In der Nähe",
    sortDistance: "Entfernung",
    sortPrice: "Preis",
    detected: "Erkannt:",
    newSearch: "Neue Suche",
    alertGeo: "Bitte Standortfreigabe aktivieren.",
    choiceTitle: "Wonach suchst du?",
    choiceDetected: "Wir haben erkannt:",
    categories: {
      "Fournitures de bureau": "Bürobedarf",
      "Alimentation": "Lebensmittel"
    }
  },
  it: {
    heroTitle: "Trova ciò che<br>cerchi.",
    heroSubtitle: "Scansiona qualsiasi oggetto per scoprire i posti migliori intorno a te.",
    analyzing: "Analisi in corso...",
    nearby: "Nelle vicinanze",
    sortDistance: "Vicinanza",
    sortPrice: "Prezzo",
    detected: "Rilevato:",
    newSearch: "Nuova ricerca",
    alertGeo: "Si prega di consentire la geolocalizzazione.",
    choiceTitle: "Cosa stai cercando?",
    choiceDetected: "Abbiamo rilevato:",
    categories: {
      "Fournitures de bureau": "Forniture per ufficio",
      "Alimentation": "Alimentari"
    }
  }
};

// State Management
const STATE_KEY = 'nearyou_state_v1';

function getInitialState() {
  const defaultState = {
    userLocation: null,
    sortBy: 'distance', // distance, price
    searchMode: 'physical', // physical, online
    results: [],
    detectedCategory: null,
    language: getInitialLanguage(),
    pendingAnalysis: null,
    currentView: 'search',
    actualSearchTerm: null,
    fallbackInfo: null
  };

  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge saved state with default to ensure all keys exist
      return { ...defaultState, ...parsed, pendingAnalysis: null };
    }
  } catch (e) {
    console.error('Error loading state:', e);
  }

  return defaultState;
}

const state = getInitialState();

function saveState() {
  try {
    const stateToSave = {
      ...state,
      pendingAnalysis: null // Don't save large base64/blob data
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Error saving state:', e);
  }
}

// Scenarios & Categories
const SCENARIOS = {
  STATIONERY: {
    label: "Fournitures de bureau",
    categories: [
      { name: "Papeterie", type: "Bureau", images: ["https://images.unsplash.com/photo-1531346878377-a513bc950634?w=200&h=200&fit=crop", "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&h=200&fit=crop"] },
      { name: "Librairie", type: "Culture", images: ["https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=200&h=200&fit=crop"] },
      { name: "Supermarché", type: "Alimentation", images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop"] }
    ]
  },
  FOOD: {
    label: "Alimentation",
    categories: [
      { name: "Café", type: "Détente", images: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop"] },
      { name: "Boulangerie", type: "Alimentation", images: ["https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop"] },
      { name: "Restaurant", type: "Repas", images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"] }
    ]
  }
};

const PREFIXES = ["City", "Royal", "Corner", "Express", "Golden", "Star", "Local", "Office", "Paper"];
const SUFFIXES = ["Shop", "Store", "Mart", "Center", "Hub", "Place", "Depot"];
const STREET_NAMES = ["Rue de la Paix", "Avenue de la Liberté", "Boulevard Central", "Chemin des Fleurs", "Place du Marché", "Rue Principale", "Avenue Victor Hugo", "Rue du Commerce"];

// DOM Elements
const fileInput = document.getElementById('file-input');
const scanBtn = document.getElementById('scan-btn');
const logoBtn = document.getElementById('logo-btn');
const searchView = document.getElementById('search-view');
const loadingView = document.getElementById('loading-view');
const choiceView = document.getElementById('choice-view');
const resultsView = document.getElementById('results-view');
const resultsGrid = document.getElementById('results-grid');
const resetBtn = document.getElementById('reset-btn');
const sortChips = document.querySelectorAll('.chip');
const detectedBadge = document.getElementById('detected-badge');
const detectedLabel = document.getElementById('detected-label');
const langSelect = document.getElementById('lang-select');
const detectedItem = document.getElementById('detected-item');
const choiceBtn1 = document.getElementById('choice-btn-1');
const choiceBtn2 = document.getElementById('choice-btn-2');
const choiceBtn3 = document.getElementById('choice-btn-3');
const modeToggle = document.getElementById('mode-toggle');
const labelPhysical = document.getElementById('label-physical');
const labelOnline = document.getElementById('label-online');
const sortControls = document.getElementById('sort-controls');

// Init Language
langSelect.value = state.language;
updateLanguage(state.language);

// Event Listeners
// Event Listeners
scanBtn.addEventListener('click', () => fileInput.click());
logoBtn.addEventListener('click', () => {
  state.results = [];
  state.detectedCategory = null;
  switchView('search');
});

// Restore State on Load
if (state.currentView === 'results' && state.results.length > 0) {
  if (state.searchMode === 'online') {
    modeToggle.checked = true;
    labelOnline.classList.add('active');
    labelPhysical.classList.remove('active');
  } else {
    modeToggle.checked = false;
    labelOnline.classList.remove('active');
    labelPhysical.classList.add('active');
  }

  // Sort chips restoration
  sortChips.forEach(c => {
    c.classList.toggle('active', c.dataset.sort === state.sortBy);
  });

  renderResults();
  switchView('results');
} else if (state.currentView) {
  switchView(state.currentView);
}

// Helpers
function getInitialLanguage() {
  // 1. Check localStorage
  const saved = localStorage.getItem('nearyou_lang');
  if (saved && TRANSLATIONS[saved]) return saved;

  // 2. Default to English (as requested)
  return 'en';
}

function updateLanguage(lang) {
  state.language = lang;
  localStorage.setItem('nearyou_lang', lang);

  const t = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.innerHTML = t[key];
  });

  // Update detected label if visible
  if (state.detectedCategory) {
    const catLabel = TRANSLATIONS[lang].categories[state.detectedCategory] || state.detectedCategory;
    detectedLabel.textContent = catLabel;
  }
}

function getPriceSymbol(level) {
  return '€'.repeat(level);
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

function generateRandomName(category) {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${prefix} ${category.name} ${suffix}`;
}

function generateRandomAddress() {
  const number = Math.floor(Math.random() * 150) + 1;
  const street = STREET_NAMES[Math.floor(Math.random() * STREET_NAMES.length)];
  return `${number} ${street}`;
}

function generateResults(userLat, userLng, scenarioKey) {
  const results = [];
  const numResults = 8 + Math.floor(Math.random() * 4);
  const scenario = SCENARIOS[scenarioKey];

  for (let i = 0; i < numResults; i++) {
    const randomCat = scenario.categories[Math.floor(Math.random() * scenario.categories.length)];
    results.push(createMockPlace(userLat, userLng, randomCat));
  }

  return results.sort((a, b) => a.distance - b.distance);
}

function createMockPlace(userLat, userLng, category) {
  const latOffset = (Math.random() - 0.5) * 0.09;
  const lngOffset = (Math.random() - 0.5) * 0.09;

  const placeLat = userLat + latOffset;
  const placeLng = userLng + lngOffset;

  const distance = getDistanceFromLatLonInKm(userLat, userLng, placeLat, placeLng);

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: generateRandomName(category),
    category: category.type,
    address: generateRandomAddress(),
    image: category.images[Math.floor(Math.random() * category.images.length)],
    price: estimatePrice(generateRandomName(category), category.type),
    distance: distance,
    lat: placeLat,
    lng: placeLng
  };
}

function renderResults() {
  resultsGrid.innerHTML = '';

  if (state.searchMode === 'online') {
    renderOnlineResults();
    sortControls.classList.add('hidden');
    return;
  }

  sortControls.classList.remove('hidden');

  if (state.detectedCategory) {
    const lang = state.language;
    const catLabel = TRANSLATIONS[lang].categories[state.detectedCategory] || state.detectedCategory;
    detectedLabel.textContent = catLabel;
    detectedBadge.classList.remove('hidden');
  } else {
    detectedBadge.classList.add('hidden');
  }

  let displayData = [...state.results];

  if (state.sortBy === 'distance') {
    displayData.sort((a, b) => a.distance - b.distance);
  } else if (state.sortBy === 'price') {
    displayData.sort((a, b) => a.price - b.price);
  }

  if (displayData.length === 0) {
    const { latitude, longitude } = state.userLocation;
    const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    resultsGrid.innerHTML = `
      <div class="no-results">
        <p>Aucun lieu trouvé pour "${state.actualSearchTerm || state.detectedCategory}".</p>
        <div style="font-size: 12px; color: #666; margin-top: 10px; text-align: left; background: #f5f5f5; padding: 10px; border-radius: 8px;">
            <p><strong>Debug Info:</strong></p>
            <p>📍 Position: <a href="${mapsLink}" target="_blank" style="color: blue; text-decoration: underline;">${latitude.toFixed(5)}, ${longitude.toFixed(5)}</a> (Cliquez pour vérifier)</p>
            <p>🔍 Recherche: ${state.actualSearchTerm || 'Générique'}</p>
            <p>📂 Catégorie: ${state.detectedCategory || 'Inconnue'}</p>
            <p>📏 Rayon: 50 km</p>
        </div>
        <p class="sub" style="margin-top: 15px;">Essayez une autre recherche ou élargissez la zone.</p>
      </div>
    `;
    return;
  }

  // Clear grid and add fallback notification if applicable
  resultsGrid.innerHTML = '';

  if (state.fallbackInfo && state.fallbackInfo.tier > 1 && state.fallbackInfo.message) {
    const banner = document.createElement('div');
    banner.style.cssText = 'background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin-bottom: 20px; border-radius: 8px; grid-column: 1 / -1;';
    banner.innerHTML = `<p style="margin: 0; color: #856404; font-size: 14px;">ℹ️ ${state.fallbackInfo.message}</p>`;
    resultsGrid.appendChild(banner);
  }

  displayData.forEach((place, index) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`;

    const card = document.createElement('div');
    card.className = 'place-card';
    card.innerHTML = `
      <img src="${place.image}" alt="${place.name}" class="place-image">
      <div class="place-details">
        <div class="place-category">${place.category}</div>
        <div class="place-name">${place.name}</div>
        <div class="place-address">${place.address}</div>
        <div class="place-footer">
          <a href="${googleMapsUrl}" target="_blank" class="place-distance" title="Voir l'itinéraire">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            ${place.distance.toFixed(1)} km
          </a>
          <div class="place-price">${getPriceSymbol(place.price)}</div>
        </div>
      </div>
    `;
    resultsGrid.appendChild(card);

    // Insert ad after every 2 items (except after the last item when there are multiple results)
    if ((index + 1) % 2 === 0 && index !== displayData.length - 1) {
      const adCard = document.createElement('div');
      adCard.className = 'place-card ad-card';
      adCard.innerHTML = `
        <div class="ad-label">Publicité</div>
        <ins class="adsbygoogle"
             style="display:block"
           data-ad-client="ca-pub-9057470154911774"
             data-ad-slot="9453283378"
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      `;
      resultsGrid.appendChild(adCard);
    }
  });

  // If there is only a single result, add an ad below it
  if (displayData.length === 1) {
    const adCard = document.createElement('div');
    adCard.className = 'place-card ad-card';
    adCard.innerHTML = `
      <div class="ad-label">Publicité</div>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-9057470154911774"
           data-ad-slot="9453283378"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    `;
    resultsGrid.appendChild(adCard);
  }
}

function switchView(view) {
  searchView.classList.add('hidden');
  loadingView.classList.add('hidden');
  choiceView.classList.add('hidden');
  resultsView.classList.add('hidden');

  if (view === 'search') {
    searchView.classList.remove('hidden');
  } else if (view === 'loading') {
    loadingView.classList.remove('hidden');
  } else if (view === 'choice') {
    choiceView.classList.remove('hidden');
  } else if (view === 'results') {
    resultsView.classList.remove('hidden');
  }

  state.currentView = view;
  saveState();
}

// Event Listeners
langSelect.addEventListener('change', (e) => {
  updateLanguage(e.target.value);
  saveState();
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleImageUpload(e.target.files[0]);
  }
});

resetBtn.addEventListener('click', () => {
  state.results = [];
  state.detectedCategory = null;
  state.actualSearchTerm = null;
  state.fallbackInfo = null;
  switchView('search'); // This calls saveState
});

modeToggle.addEventListener('change', (e) => {
  state.searchMode = e.target.checked ? 'online' : 'physical';
  saveState();

  // Update labels style
  if (state.searchMode === 'online') {
    labelOnline.classList.add('active');
    labelPhysical.classList.remove('active');
  } else {
    labelOnline.classList.remove('active');
    labelPhysical.classList.add('active');
  }

  renderResults();
});

sortChips.forEach(chip => {
  chip.addEventListener('click', () => {
    sortChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.sortBy = chip.dataset.sort;
    renderResults();
  });
});

async function handleImageUpload(file) {
  switchView('loading');

  try {
    // 1. Get User Location
    console.log('Step 1: Getting location...');
    const position = await getUserLocation();
    const { latitude, longitude } = position.coords;
    state.userLocation = { latitude, longitude };
    console.log('✓ Location obtained:', latitude, longitude);

    // Debug: Show coordinates immediately
    const debugEl = document.getElementById('debug-coords');
    if (debugEl) {
      debugEl.innerText = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
    }

    // 2. Compress Image
    console.log('Step 2: Compressing image...');
    const compressedBlob = await compressImage(file);
    console.log('✓ Image compressed');

    // 3. Convert Image to Base64
    console.log('Step 3: Converting to base64...');
    const base64Data = await fileToBase64(compressedBlob);
    console.log('✓ Image converted, size:', base64Data.length);

    // 4. Call Secure API
    console.log('Step 4: Calling OpenAI API...');
    const analysis = await analyzeWithAPI(base64Data, 'image/jpeg');
    console.log('✓ Analysis received:', analysis);

    // 5. Store analysis and show choice
    state.pendingAnalysis = analysis;
    showChoiceView(analysis);

  } catch (error) {
    console.error("❌ Error details:", error);
    console.error("Error stack:", error.stack);

    // Check if it's a geolocation error
    if (error.code === 1 || error.message?.includes('geolocation') || error.message?.includes('location')) {
      alert(TRANSLATIONS[state.language].alertGeo);
    } else {
      // Show more specific error message
      const errorMsg = error.message || 'Unknown error';
      alert(`${TRANSLATIONS[state.language].alertError}\n\nDetails: ${errorMsg}`);
    }

    switchView('search');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
}

// Compress image to reduce payload size
function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB`);
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// Helper to get country for API
function getContextCountry() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz.includes('Ho_Chi_Minh')) return 'Vietnam';
  if (tz.includes('Paris')) return 'France';
  if (tz.includes('Berlin')) return 'Germany';
  if (tz.includes('New_York') || tz.includes('Los_Angeles')) return 'USA';
  if (tz.includes('Stockholm')) return 'Sweden';
  return 'Global';
}

async function analyzeWithAPI(base64Image, mimeType) {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType,
        language: state.language,
        userCountry: getContextCountry()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('analyzeWithAPI error:', error);
    throw error;
  }
}

function showChoiceView(analysis) {
  detectedItem.textContent = analysis.item;

  choiceBtn1.querySelector('.choice-label').textContent = analysis.option1.label;
  choiceBtn2.querySelector('.choice-label').textContent = analysis.option2.label;

  // Handle 3rd option
  if (analysis.option3) {
    choiceBtn3.classList.remove('hidden');
    choiceBtn3.querySelector('.choice-label').textContent = analysis.option3.label;
  } else {
    choiceBtn3.classList.add('hidden');
  }

  // Store AI recommendations for later use
  if (analysis.online_recommendations) {
    state.aiRecommendations = analysis.online_recommendations;
  } else {
    state.aiRecommendations = null;
  }

  switchView('choice');
}

async function handleChoice(optionNumber) {
  const analysis = state.pendingAnalysis;
  let selectedOption;

  if (optionNumber === 1) selectedOption = analysis.option1;
  else if (optionNumber === 2) selectedOption = analysis.option2;
  else selectedOption = analysis.option3; // Option 3

  const isSpecific = optionNumber === 1; // Only option 1 is the specific model

  state.detectedCategory = selectedOption.category;

  // Clean search term (remove .com, .vn, www, etc.)
  let cleanSearchTerm = selectedOption.search_term;
  if (cleanSearchTerm) {
    cleanSearchTerm = cleanSearchTerm
      .replace(/(https?:\/\/)?(www\.)?/gi, '') // Remove http://, www.
      .replace(/\.(com|vn|net|org|edu|gov)(\.vn)?/gi, '') // Remove extensions
      .trim();
  }

  // Show loading while fetching real places
  switchView('loading');

  const { latitude, longitude } = state.userLocation;

  // Debug: Show coordinates on screen
  const debugEl = document.getElementById('debug-coords');
  if (debugEl) {
    debugEl.innerText = `Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)}`;
  }

  // Store the actual search term used for debug display
  state.actualSearchTerm = cleanSearchTerm || 'Générique';

  const searchData = await generateDynamicResults(
    latitude,
    longitude,
    selectedOption.category,
    analysis.item,
    cleanSearchTerm,
    isSpecific
  );

  state.results = searchData.results || [];
  state.fallbackInfo = searchData.fallbackInfo;

  renderResults();
  switchView('results'); // Saves state
}

// Event listeners for choice buttons
choiceBtn1.addEventListener('click', () => handleChoice(1));
choiceBtn2.addEventListener('click', () => handleChoice(2));
choiceBtn3.addEventListener('click', () => handleChoice(3));

// Map category names to OpenStreetMap tags
function getCategoryOSMTags(categoryName) {
  const lowerCategory = categoryName.toLowerCase();

  // Common mappings (expand as needed)
  if (lowerCategory.includes('coffee') || lowerCategory.includes('café') || lowerCategory.includes('cafe')) {
    return ['amenity=cafe'];
  }
  if (lowerCategory.includes('restaurant') || lowerCategory.includes('pizzeria')) {
    return ['amenity=restaurant'];
  }
  if (lowerCategory.includes('stationery') || lowerCategory.includes('papeterie') || lowerCategory.includes('office supply')) {
    return ['shop=stationery'];
  }
  if (lowerCategory.includes('grocery') || lowerCategory.includes('supermarket') || lowerCategory.includes('alimentation')) {
    return ['shop=supermarket'];
  }
  if (lowerCategory.includes('bakery') || lowerCategory.includes('boulangerie')) {
    return ['shop=bakery'];
  }
  if (lowerCategory.includes('sport') || lowerCategory.includes('luggage') || lowerCategory.includes('backpack')) {
    return ['shop=sports'];
  }
  if (lowerCategory.includes('electronics') || lowerCategory.includes('phone') || lowerCategory.includes('mobile')) {
    return ['shop=electronics', 'shop=mobile_phone'];
  }
  if (lowerCategory.includes('kitchenware') || lowerCategory.includes('home goods')) {
    return ['shop=houseware'];
  }

  // New Categories
  if (lowerCategory.includes('bank') || lowerCategory.includes('banque')) {
    return ['amenity=bank'];
  }
  if (lowerCategory.includes('atm') || lowerCategory.includes('distributeur')) {
    return ['amenity=atm'];
  }
  if (lowerCategory.includes('pharmacy') || lowerCategory.includes('pharmacie')) {
    return ['amenity=pharmacy'];
  }
  if (lowerCategory.includes('hospital') || lowerCategory.includes('hôpital')) {
    return ['amenity=hospital'];
  }
  if (lowerCategory.includes('fast food') || lowerCategory.includes('snack')) {
    return ['amenity=fast_food'];
  }
  if (lowerCategory.includes('hotel') || lowerCategory.includes('hôtel')) {
    return ['tourism=hotel'];
  }

  // Default fallback
  return ['shop=general'];
}

async function generateDynamicResults(userLat, userLng, categoryName, itemName, searchTerm, isSpecific) {
  try {
    // Prepare search parameters
    const searchParams = {
      latitude: userLat,
      longitude: userLng,
      category: categoryName,
      radius: 50000 // 50km
    };

    // Add specific search term if provided
    if (isSpecific && searchTerm && searchTerm.length > 2) {
      searchParams.query = searchTerm;
    }

    // Call our Foursquare API endpoint
    const response = await fetch('/api/search-places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchParams)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search API Error:', errorText);
      throw new Error(`Search failed (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    // Store fallback info for display
    const fallbackInfo = {
      tier: data.fallback_tier || 1,
      message: data.fallback_message
    };

    // Transform results to match our format
    const results = data.results.map(place => ({
      id: place.id,
      name: place.name,
      category: place.category,
      address: place.address,
      image: `https://source.unsplash.com/200x200/?${encodeURIComponent(categoryName)}&sig=${place.id}`,
      price: place.price,
      distance: place.distance,
      lat: place.lat,
      lng: place.lng
    }));

    // Sort by distance and limit
    const sortedResults = results.sort((a, b) => a.distance - b.distance).slice(0, 20);

    return { results: sortedResults, fallbackInfo };

  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

function getUserLocation() {
  console.log('Requesting geolocation...');
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased to 15s
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('Geolocation success (High Accuracy):', pos.coords.latitude, pos.coords.longitude);
        resolve(pos);
      },
      (err) => {
        console.warn('High accuracy geolocation failed, trying low accuracy...', err);
        // Fallback to low accuracy
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Geolocation success (Low Accuracy):', pos.coords.latitude, pos.coords.longitude);
            resolve(pos);
          },
          (finalErr) => {
            console.error('Geolocation failed completely:', finalErr);
            reject(finalErr);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
        );
      },
      options
    );
  });
}

function estimatePrice(name, category) {
  const nameLower = name.toLowerCase();

  // 1. Cheap / Affordable (Price Level 1)
  const cheapKeywords = [
    // Global/C-stores
    '7-eleven', 'circle k', 'lawson', 'family mart', 'mini mart', 'shop & go',
    // Supermarkets (Global/EU/US)
    'lidl', 'aldi', 'carrefour', 'tesco', 'walmart', 'costco', 'target', 'auchan', 'spar',
    // Fast Food
    'mcdonald', 'kfc', 'burger king', 'subway', 'domino', 'pizza hut', 'taco bell', 'wendy',
    // Generic Budget Terms
    'discount', 'outlet', 'factory', 'market', 'flea', 'dollar', 'express'
  ];

  if (cheapKeywords.some(kw => nameLower.includes(kw))) return 1;

  // 2. Expensive / Premium (Price Level 3)
  const expensiveKeywords = [
    // Premium Brands & Retail
    'starbucks', 'whole foods', 'waitrose', 'marks & spencer', 'apple store',
    // Luxury Fashion
    'gucci', 'louis vuitton', 'chanel', 'hermes', 'rolex', 'cartier', 'dior', 'prada', 'fendi', 'versace', 'burberry',
    // Hospitality
    'hotel', 'resort', 'sofitel', 'sheraton', 'marriott', 'intercontinental', 'hilton', 'hyatt', 'ritz', 'fourseasons', 'mandarin oriental',
    // Keywords
    'luxury', 'fine dining', 'gourmet', 'premium', 'palace', 'plaza', 'boutique', 'jewel', 'diamond'
  ];

  if (expensiveKeywords.some(kw => nameLower.includes(kw))) return 3;

  // 3. Default to Medium (Price Level 2)
  return 2;
}

// Helper to detect country from Timezone (Proxy for Location)
function detectUserCountry() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Mapping Timezones to Country Codes
  if (tz.includes('Paris')) return 'FR';
  if (tz.includes('Berlin')) return 'DE';
  if (tz.includes('Rome')) return 'IT';
  if (tz.includes('Madrid')) return 'ES';
  if (tz.includes('London')) return 'GB';
  if (tz.includes('Stockholm')) return 'SE';
  if (tz.includes('Ho_Chi_Minh') || tz.includes('Bangkok')) return 'VN';
  if (tz.includes('New_York') || tz.includes('Los_Angeles') || tz.includes('Chicago')) return 'US';

  // Fallback using simple region detection from Lat/Long if available
  if (state.userLocation) {
    const { latitude, longitude } = state.userLocation;

    // Europe roughly
    if (latitude > 35 && latitude < 72 && longitude > -25 && longitude < 45) {
      return 'EU_GENERIC';
    }
    // North America roughly
    if (latitude > 25 && latitude < 72 && longitude > -170 && longitude < -50) {
      return 'US';
    }
  }

  return 'GLOBAL';
}

// Helper to get domain color or icon
function getSiteStyle(url, type) {
  const defaultColor = type === 'New' ? '#007AFF' : '#34C759'; // Blue for new, Green for used

  if (url.includes('shopee')) return { color: '#EE4D2D', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Shopee.svg' };
  if (url.includes('lazada')) return { color: '#0F1568', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Lazada_Logo.svg' };
  if (url.includes('amazon')) return { color: '#FF9900', icon: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg' };
  if (url.includes('tiki')) return { color: '#1A94FF', icon: 'https://upload.wikimedia.org/wikipedia/commons/archive/2/29/20210626071536%21Tiki_logo.png' };
  if (url.includes('ebay')) return { color: '#E53238', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg' };
  if (url.includes('facebook')) return { color: '#1877F2', icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/512px-2021_Facebook_icon.svg.png' };

  // Generic fallback based on domain first letter
  return { color: defaultColor, icon: null };
}

function renderOnlineResults() {
  const query = state.actualSearchTerm || state.detectedCategory || 'Produit';
  const displayQuery = query.charAt(0).toUpperCase() + query.slice(1);

  // 1. Detect Country based on Location
  const countryCode = detectUserCountry();

  resultsGrid.innerHTML = `
    <div style="padding: 10px; margin-bottom: 5px;">
      <h3 style="margin-bottom: 5px;">Offres en ligne pour "${displayQuery}"</h3>
      <p style="color: #666; font-size: 0.9rem;">
        🌍 Boutiques identifiées pour : <strong>${countryCode}</strong>
      </p>
    </div>
  `;

  // IF AI RESULTS EXIST: USE THEM EXCLUSIVELY
  if (state.aiRecommendations && state.aiRecommendations.length > 0) {
    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '12px';

    state.aiRecommendations.forEach(rec => {
      const style = getSiteStyle(rec.url, rec.type);
      const iconHtml = style.icon
        ? `<img src="${style.icon}" style="width:100%; height:100%; object-fit:contain;" alt="${rec.name}">`
        : `<div style="font-weight:bold; font-size:20px; color:${style.color}">${rec.name.charAt(0)}</div>`;

      const card = document.createElement('div');
      card.className = 'place-card online-result';
      card.style.borderLeft = `4px solid ${style.color}`;
      card.style.minHeight = '80px';

      let badgeColor = rec.type === 'New' ? '#007AFF' : '#34C759';
      let badgeText = rec.type === 'New' ? 'NEUF' : 'OCCASION';

      card.innerHTML = `
            <div style="width: 60px; height: 60px; flex-shrink:0; display: flex; align-items: center; justify-content: center; background: white; border-radius: 12px; padding: 5px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-right: 15px;">
               ${iconHtml}
            </div>
            <div class="place-details" style="flex:1;">
              <div class="place-name" style="font-size:1.05rem; margin-bottom:4px;">${rec.name}</div>
              <div class="place-address" style="font-size:0.85rem; color:#666;">Site marchand spécialisé</div>
              <div style="display:flex; align-items:center; justify-content:space-between; margin-top:8px;">
                 <span style="font-size:10px; font-weight:700; color:${badgeColor}; background:${badgeColor}15; padding:3px 8px; border-radius:4px;">${badgeText}</span>
                 <a href="${rec.url}" target="_blank" class="online-link-btn" style="background: ${style.color}; font-size:0.9rem; padding: 6px 16px; margin:0;">Voir l'offre</a>
              </div>
            </div>
          `;
      listContainer.appendChild(card);
    });

    resultsGrid.appendChild(listContainer);
  } else {
    // FALLBACK ONLY IF AI FAILED (Should not happen often with new prompt)
    resultsGrid.innerHTML += `
        <div style="text-align:center; padding:40px; color:#888;">
           <p>Aucune offre spécifique trouvée pour l'instant.</p>
           <button class="reset-fab" style="position:static; transform:none; margin-top:20px;" onclick="window.open('https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}', '_blank')">Chercher sur Google Shopping</button>
        </div>
      `;
  }

  // Add ad at the bottom
  const adCard = document.createElement('div');
  adCard.className = 'place-card ad-card';
  adCard.style.marginTop = '20px';
  adCard.innerHTML = `
      <div class="ad-label">Publicité</div>
      <ins class="adsbygoogle"
           style="display:block"
           data-ad-client="ca-pub-9057470154911774"
           data-ad-slot="9453283378"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
  `;
  resultsGrid.appendChild(adCard);
}
