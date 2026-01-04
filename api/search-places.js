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
        const { latitude, longitude, query, category, radius = 50000 } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Missing latitude or longitude' });
        }

        // Map category to OpenStreetMap tags
        const categoryMap = {
            'electronics': 'shop=electronics',
            'phone': 'shop=mobile_phone',
            'mobile': 'shop=mobile_phone',
            'coffee': 'amenity=cafe',
            'cafe': 'amenity=cafe',
            'restaurant': 'amenity=restaurant',
            'bank': 'amenity=bank',
            'atm': 'amenity=atm',
            'pharmacy': 'amenity=pharmacy',
            'hospital': 'amenity=hospital',
            'hotel': 'tourism=hotel',
            'supermarket': 'shop=supermarket',
            'bakery': 'shop=bakery',
            'shoe': 'shop=shoes',
            'footwear': 'shop=shoes',
            'sneaker': 'shop=shoes',
            'trainers': 'shop=shoes',
            'boots': 'shop=shoes',
            'heels': 'shop=shoes',
            'clothing': 'shop=clothes',
            'fashion': 'shop=clothes',
            'apparel': 'shop=clothes',
            'sport': 'shop=sports',
            'convenience': 'shop=convenience',
            'retail': 'shop=general',
            'motorcycle': 'shop=motorcycle',
            'scooter': 'shop=motorcycle',
            'car': 'shop=car',
            'automotive': 'shop=car',
            'bicycle': 'shop=bicycle',
            'bike': 'shop=bicycle',
            'book': 'shop=books',
            'library': 'shop=books',
            'toy': 'shop=toys',
            'game': 'shop=toys',
            'beauty': 'shop=beauty',
            'cosmetic': 'shop=beauty',
            'perfume': 'shop=perfumery',
            'jewelry': 'shop=jewelry',
            'watch': 'shop=watches',
            'gift': 'shop=gift',
            'flower': 'shop=florist',
            'florist': 'shop=florist',
            'garden': 'shop=garden_centre',
            'hardware': 'shop=doityourself',
            'furniture': 'shop=furniture',
            'pet': 'shop=pet'
        };

        let fallbackTier = 1;
        let fallbackMessage = null;
        let allResults = [];

        // Find OSM tag for category
        let osmTag = null;
        if (category) {
            const lowerCategory = category.toLowerCase();
            for (const [keyword, tag] of Object.entries(categoryMap)) {
                if (lowerCategory.includes(keyword)) {
                    osmTag = tag;
                    break;
                }
            }
        }

        // Fallback: If no specific category matched, use generic shop
        if (!osmTag) {
            console.log(`No specific tag found for category "${category}", defaulting to shop=yes`);
            osmTag = 'shop=yes'; // Matches any shop
        }

        // URL for Faster Mirror (Kumi Systems often faster)
        const OVERPASS_URL = 'https://overpass.kumi.systems/api/interpreter';

        // Tier 1: Strict Search (Name OR Brand OR Operator)
        if (osmTag) {
            console.log(`Tier 1: Searching ${osmTag} with query "${query}"`);

            // Extract the key/value for the tag
            const [tKey, tValue] = osmTag.split('=');
            const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Build filter: Matches Name OR Brand OR Operator
            const filter = `
                (
                    node["${tKey}"="${tValue}"]["name"~"${safeQuery}",i](around:${radius},${latitude},${longitude});
                    way["${tKey}"="${tValue}"]["name"~"${safeQuery}",i](around:${radius},${latitude},${longitude});
                    node["${tKey}"="${tValue}"]["brand"~"${safeQuery}",i](around:${radius},${latitude},${longitude});
                    way["${tKey}"="${tValue}"]["brand"~"${safeQuery}",i](around:${radius},${latitude},${longitude});
                    node["${tKey}"="${tValue}"]["operator"~"${safeQuery}",i](around:${radius},${latitude},${longitude});
                    way["${tKey}"="${tValue}"]["operator"~"${safeQuery}",i](around:${radius},${latitude},${longitude});
                );
            `;

            const query1 = `[out:json][timeout:15];${filter}out center 20;`;

            try {
                const response1 = await fetch(OVERPASS_URL, {
                    method: 'POST',
                    body: query1
                });
                const data1 = await response1.json();
                if (data1.elements && data1.elements.length > 0) {
                    allResults = data1.elements;
                }
            } catch (e) {
                console.warn('Tier 1 search failed (trying fallback)', e);
            }
        }

        // TIER 1.5: Relaxed Query (First word -> Brand/Name)
        if (allResults.length === 0 && osmTag && query && query.includes(' ')) {
            const firstWord = query.split(' ')[0];
            if (firstWord.length > 2) {
                console.log(`Tier 1.5: Searching ${osmTag} with first word "${firstWord}"`);

                const [tKey, tValue] = osmTag.split('=');
                const safeWord = firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const filter = `
                    (
                        node["${tKey}"="${tValue}"]["name"~"${safeWord}",i](around:${radius},${latitude},${longitude});
                        way["${tKey}"="${tValue}"]["name"~"${safeWord}",i](around:${radius},${latitude},${longitude});
                        node["${tKey}"="${tValue}"]["brand"~"${safeWord}",i](around:${radius},${latitude},${longitude});
                        way["${tKey}"="${tValue}"]["brand"~"${safeWord}",i](around:${radius},${latitude},${longitude});
                    );
                `;

                const query15 = `[out:json][timeout:15];${filter}out center 20;`;

                try {
                    const response15 = await fetch(OVERPASS_URL, {
                        method: 'POST',
                        body: query15
                    });
                    const data15 = await response15.json();
                    if (data15.elements && data15.elements.length > 0) {
                        allResults = data15.elements;
                    }
                } catch (e) {
                    console.warn('Tier 1.5 search failed', e);
                }
            }
        }

        // TIER 2: Category Match Only (Fallback)
        if (allResults.length === 0 && osmTag && query) {
            console.log(`Tier 2: Searching ${osmTag} without name filter`);
            fallbackTier = 2;
            fallbackMessage = `Aucun distributeur "${query}" identifié. Voici les magasins de ce type à proximité.`;

            const [tKey, tValue] = osmTag.split('=');

            const query2 = `
                [out:json][timeout:15];
                (
                    node["${tKey}"="${tValue}"](around:${radius},${latitude},${longitude});
                    way["${tKey}"="${tValue}"](around:${radius},${latitude},${longitude});
                );
                out center 20;
            `;

            const response2 = await fetch(OVERPASS_URL, {
                method: 'POST',
                body: query2
            });

            const data2 = await response2.json();
            if (data2.elements && data2.elements.length > 0) {
                allResults = data2.elements;
            }
        }

        // TIER 3 DISABLED: Was returning too many irrelevant results
        // Better to show "no results" than food stores for shoe searches

        // Transform OSM results
        const results = allResults.map(element => {
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

        // Sort by distance
        results.sort((a, b) => a.distance - b.distance);

        return res.status(200).json({
            results: results.slice(0, 20),
            fallback_tier: fallbackTier,
            fallback_message: fallbackMessage
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
