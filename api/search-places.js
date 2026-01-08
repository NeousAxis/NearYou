export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { latitude, longitude, query, category, radius = 50000, osmTags: providedOsmTags } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Missing latitude or longitude' });
        }

        // Map category to OpenStreetMap tags (English + French support)
        // Map category to OpenStreetMap tags (English + French support)
        const categoryMap = {
            // Electronics
            'electronics': ['shop=electronics', 'shop=computer', 'shop=radiotechnics', 'shop=vacuum_cleaner'],
            'phone': ['shop=mobile_phone', 'shop=electronics', 'shop=telecommunication'],
            'mobile': ['shop=mobile_phone', 'shop=electronics'],
            'téléphone': ['shop=mobile_phone', 'shop=electronics'],
            'ordinateur': ['shop=computer', 'shop=electronics'],

            // Food & Drink / Groceries
            'coffee': ['amenity=cafe', 'shop=coffee'],
            'cafe': ['amenity=cafe', 'shop=coffee'],
            'café': ['amenity=cafe', 'shop=coffee'],
            'restaurant': ['amenity=restaurant', 'amenity=food_court', 'amenity=fast_food'],
            'bakery': ['shop=bakery', 'shop=pastry'],
            'boulangerie': ['shop=bakery', 'shop=pastry'],
            'supermarket': ['shop=supermarket', 'shop=convenience', 'shop=department_store', 'shop=general', 'shop=variety_store'],
            'supermarché': ['shop=supermarket', 'shop=convenience', 'shop=department_store', 'shop=general', 'shop=variety_store'],
            'grocery': ['shop=supermarket', 'shop=convenience', 'shop=greengrocer', 'shop=food'],
            'alimentation': ['shop=supermarket', 'shop=convenience', 'shop=food', 'shop=general'],
            'food': ['shop=supermarket', 'shop=convenience', 'shop=food'],

            // Toiletry / Hygiene
            'dentifrice': ['shop=supermarket', 'amenity=pharmacy', 'shop=chemist', 'shop=convenience', 'shop=variety_store', 'shop=department_store', 'shop=drugstore'],
            'toothpaste': ['shop=supermarket', 'amenity=pharmacy', 'shop=chemist', 'shop=convenience', 'shop=variety_store', 'shop=department_store', 'shop=drugstore'],
            'shampoo': ['shop=supermarket', 'amenity=pharmacy', 'shop=chemist', 'shop=convenience', 'shop=beauty', 'shop=drugstore'],

            // Services
            'bank': ['amenity=bank'],
            'banque': ['amenity=bank'],
            'atm': ['amenity=atm'],
            'distributeur': ['amenity=atm'],
            'pharmacy': ['amenity=pharmacy', 'shop=chemist', 'shop=drugstore'],
            'pharmacie': ['amenity=pharmacy', 'shop=chemist', 'shop=drugstore'],
            'hospital': ['amenity=hospital', 'amenity=clinic'],
            'hôpital': ['amenity=hospital', 'amenity=clinic'],
            'hotel': ['tourism=hotel', 'tourism=guest_house', 'tourism=hostel'],
            'hôtel': ['tourism=hotel', 'tourism=guest_house', 'tourism=hostel'],

            // Fashion & Shoes
            'shoe': ['shop=shoes', 'shop=sports', 'shop=clothes', 'shop=department_store', 'shop=fashion'],
            'shoes': ['shop=shoes', 'shop=sports', 'shop=clothes', 'shop=department_store', 'shop=fashion'],
            'footwear': ['shop=shoes', 'shop=sports', 'shop=clothes', 'shop=department_store'],
            'sneaker': ['shop=shoes', 'shop=sports', 'shop=clothes', 'shop=department_store', 'shop=fashion'],
            'basket': ['shop=shoes', 'shop=sports', 'shop=clothes', 'shop=department_store', 'shop=fashion'],
            'chaussure': ['shop=shoes', 'shop=clothes', 'shop=sports', 'shop=department_store', 'shop=fashion'],
            'clothing': ['shop=clothes', 'shop=department_store', 'shop=boutique', 'shop=fashion'],
            'clothes': ['shop=clothes', 'shop=department_store', 'shop=boutique', 'shop=fashion'],
            'vêtement': ['shop=clothes', 'shop=department_store', 'shop=boutique'],
            'fashion': ['shop=clothes', 'shop=department_store', 'shop=fashion'],
            'mode': ['shop=clothes', 'shop=department_store', 'shop=fashion'],
            'apparel': ['shop=clothes', 'shop=department_store'],
            'sport': ['shop=sports', 'shop=outdoor'],

            // Retail & Misc
            'convenience': ['shop=convenience', 'shop=supermarket', 'shop=variety_store'],
            'retail': ['shop=general', 'shop=department_store', 'shop=variety_store', 'shop=mall'],
            'motorcycle': ['shop=motorcycle'],
            'moto': ['shop=motorcycle'],
            'scooter': ['shop=motorcycle'],
            'car': ['shop=car'],
            'voiture': ['shop=car'],
            'automotive': ['shop=car', 'shop=car_parts'],
            'bicycle': ['shop=bicycle', 'shop=sports'],
            'bike': ['shop=bicycle', 'shop=sports'],
            'vélo': ['shop=bicycle', 'shop=sports'],
            'book': ['shop=books', 'shop=newsagent'],
            'livre': ['shop=books', 'shop=newsagent'],
            'librairie': ['shop=books', 'shop=stationery'],
            'library': ['amenity=library', 'shop=books'],
            'toy': ['shop=toys', 'shop=department_store', 'shop=gift'],
            'jouet': ['shop=toys', 'shop=department_store', 'shop=gift'],
            'game': ['shop=toys', 'shop=video_games'],
            'beauty': ['shop=beauty', 'shop=cosmetics', 'amenity=pharmacy', 'shop=drugstore'],
            'beauté': ['shop=beauty', 'shop=cosmetics', 'amenity=pharmacy', 'shop=drugstore'],
            'cosmetic': ['shop=beauty', 'shop=cosmetics', 'amenity=pharmacy', 'shop=drugstore', 'shop=department_store'],
            'cosmétique': ['shop=beauty', 'shop=cosmetics', 'amenity=pharmacy', 'shop=department_store'],
            'perfume': ['shop=perfumery', 'shop=beauty', 'shop=cosmetics', 'shop=department_store'],
            'parfum': ['shop=perfumery', 'shop=beauty', 'shop=cosmetics', 'shop=department_store'],
            'jewelry': ['shop=jewelry', 'shop=watches', 'shop=fashion'],
            'bijou': ['shop=jewelry', 'shop=fashion_accessories'],
            'watch': ['shop=watches', 'shop=jewelry'],
            'montre': ['shop=watches', 'shop=jewelry'],
            'gift': ['shop=gift', 'shop=souvenir'],
            'cadeau': ['shop=gift', 'shop=souvenir'],
            'flower': ['shop=florist', 'shop=garden_centre'],
            'florist': ['shop=florist'],
            'fleur': ['shop=florist'],
            'garden': ['shop=garden_centre', 'shop=doityourself'],
            'jardin': ['shop=garden_centre', 'shop=doityourself'],
            'hardware': ['shop=doityourself', 'shop=hardware', 'shop=trade'],
            'bricolage': ['shop=doityourself', 'shop=hardware'],
            'furniture': ['shop=furniture', 'shop=department_store', 'shop=home_center'],
            'meuble': ['shop=furniture', 'shop=department_store'],
            'pet': ['shop=pet'],
            'animal': ['shop=pet']
        };

        // Find OSM tags
        let osmTags = [];

        // STRATEGY A: Use AI-provided tags (Smartest)
        if (providedOsmTags && Array.isArray(providedOsmTags) && providedOsmTags.length > 0) {
            osmTags = providedOsmTags;
            console.log(`Using AI-provided tags for "${category}":`, osmTags);
        } else if (category) {
            // STRATEGY B: Fallback to static map (Legacy/Backup)
            const lowerCategory = category.toLowerCase();
            for (const [keyword, tags] of Object.entries(categoryMap)) {
                if (lowerCategory.includes(keyword)) {
                    osmTags = Array.isArray(tags) ? tags : [tags];
                    break;
                }
            }
        }

        // Fallback to generic shop if no tag found
        if (osmTags.length === 0) {
            console.log(`No specific tag found for category "${category}", defaulting to shop=yes`);
            osmTags = ['shop=yes'];
        }

        const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

        // Helper to fetch from Overpass
        const fetchOverpass = async (filterQuery, searchRadius, limit = 100) => {
            const overpassQuery = `
                [out:json][timeout:25];
                (
                    ${filterQuery}
                );
                out center ${limit};
            `;

            try {
                const response = await fetch(OVERPASS_URL, {
                    method: 'POST',
                    body: overpassQuery
                });
                const data = await response.json();
                return data.elements || [];
            } catch (e) {
                console.warn(`Overpass fetch failed for radius ${searchRadius}`, e);
                return [];
            }
        };

        const buildQueryPart = (tags, searchRadius, queryStr = null) => {
            let parts = '';
            tags.forEach(tag => {
                const [tKey, tValue] = tag.split('=');
                if (queryStr) {
                    parts += `
                        node["${tKey}"="${tValue}"]["name"~"${queryStr}",i](around:${searchRadius},${latitude},${longitude});
                        way["${tKey}"="${tValue}"]["name"~"${queryStr}",i](around:${searchRadius},${latitude},${longitude});
                        node["${tKey}"="${tValue}"]["brand"~"${queryStr}",i](around:${searchRadius},${latitude},${longitude});
                        way["${tKey}"="${tValue}"]["brand"~"${queryStr}",i](around:${searchRadius},${latitude},${longitude});
                     `;
                } else {
                    parts += `
                        node["${tKey}"="${tValue}"](around:${searchRadius},${latitude},${longitude});
                        way["${tKey}"="${tValue}"](around:${searchRadius},${latitude},${longitude});
                     `;
                }
            });
            return parts;
        };

        // --- EXECUTE SEARCH STRATEGY ---

        const queries = [];

        // 1. TIER 1: Specific Name/Brand Search (If query exists)
        // We look far (50km) because specific shops might be rare.
        if (query && query.length > 2) {
            const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const filterTier1 = buildQueryPart(osmTags, radius, safeQuery);
            queries.push(fetchOverpass(filterTier1, radius, 50));
        }

        // 2. TIER 2 (LOCAL): Generic Category Search (High Priority)
        // Search strictly nearby (3km) first to ensure we catch the shop "in front of the user".
        const filterLocal = buildQueryPart(osmTags, 3000);
        queries.push(fetchOverpass(filterLocal, 3000, 100));

        // Execute parallel
        const resultsArrays = await Promise.all(queries);

        // Merge results
        let combined = resultsArrays.flat();

        // 3. TIER 2 (EXPANDED): If we didn't find enough local generic results, expand.
        // This solves the "Toothpaste" issue where maybe the nearest supermarkets are > 3km (rural).
        // Check if unique generic items < 10
        const uniqueIds = new Set(combined.map(el => el.id));
        if (uniqueIds.size < 5) { // Reduced threshold from 10 to 5 to avoid unnecessary expansion
            console.log('Few local results found, expanding generic search...');
            const filterExpanded = buildQueryPart(osmTags, 50000);

            // We fetch 100 to ensure we capture relevant ones
            const expandedResults = await fetchOverpass(filterExpanded, 50000, 100);
            combined = combined.concat(expandedResults);
        }

        // Process and Deduplicate
        const processedResults = combined.map(element => {
            const lat = element.lat || element.center?.lat || latitude;
            const lon = element.lon || element.center?.lon || longitude;
            const distance = getDistanceFromLatLonInKm(latitude, longitude, lat, lon);

            return {
                id: element.id.toString(),
                name: element.tags?.name || 'Commerce local',
                category: category || 'Commerce',
                address: element.tags?.['addr:street']
                    ? `${element.tags['addr:housenumber'] || ''} ${element.tags['addr:street']}`.trim()
                    : 'Adresse non disponible',
                lat: lat,
                lng: lon,
                distance: distance,
                price: estimatePriceLevel(element.tags?.name || ''),
                verified: false
            };
        });

        // Deduplicate by ID
        const uniqueResults = [];
        const seenIds = new Set();
        for (const item of processedResults) {
            if (!seenIds.has(item.id)) {
                seenIds.add(item.id);
                uniqueResults.push(item);
            }
        }

        // Sort by distance (ASC)
        uniqueResults.sort((a, b) => a.distance - b.distance);

        // Prepare response
        return res.status(200).json({
            results: uniqueResults.slice(0, 20),
            fallback_tier: uniqueResults.length > 0 ? 1 : 2, // Simplified tiering
            fallback_message: uniqueResults.length === 0 ? "Aucun résultat trouvé." : null
        });

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({
            error: 'Search failed',
            details: error.message
        });
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

function estimatePriceLevel(name) {
    const nameLower = name.toLowerCase();

    const cheapKeywords = [
        '7-eleven', 'circle k', 'lawson', 'family mart', 'mini mart', 'shop & go',
        'lidl', 'aldi', 'carrefour', 'tesco', 'walmart', 'costco', 'target', 'auchan', 'spar',
        'mcdonald', 'kfc', 'burger king', 'subway', 'domino', 'pizza hut', 'taco bell', 'wendy',
        'discount', 'outlet', 'factory', 'market', 'flea', 'dollar', 'express'
    ];

    if (cheapKeywords.some(kw => nameLower.includes(kw))) return 1;

    const expensiveKeywords = [
        'starbucks', 'whole foods', 'waitrose', 'marks & spencer', 'apple store',
        'gucci', 'louis vuitton', 'chanel', 'hermes', 'rolex', 'cartier', 'dior', 'prada', 'fendi', 'versace', 'burberry',
        'hotel', 'resort', 'sofitel', 'sheraton', 'marriott', 'intercontinental', 'hilton', 'hyatt', 'ritz', 'fourseasons', 'mandarin oriental',
        'luxury', 'fine dining', 'gourmet', 'premium', 'palace', 'plaza', 'boutique', 'jewel', 'diamond'
    ];

    if (expensiveKeywords.some(kw => nameLower.includes(kw))) return 3;

    return 2;
}
