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
        const { image, mimeType, language, userCountry } = req.body;

        if (!image || !mimeType) {
            return res.status(400).json({ error: 'Missing image or mimeType' });
        }

        // Language mapping for GPT
        const languageNames = {
            'fr': 'French',
            'en': 'English',
            'vi': 'Vietnamese',
            'es': 'Spanish',
            'de': 'German',
            'it': 'Italian'
        };
        const targetLanguage = languageNames[language] || 'English';
        const contextCountry = userCountry || 'Global';

        // Secure API key (MUST be set in Vercel environment variables)
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        if (!OPENAI_API_KEY) {
            return res.status(500).json({
                error: 'API key not configured',
                details: 'Please set OPENAI_API_KEY in Vercel environment variables'
            });
        }

        const prompt = `You are an intelligent Shopping Search Engine.
The user is located in: "${contextCountry}".
The user has scanned an image of an item and wants to BUY it immediately.

TASK:
1. Identify the SPECIFIC ITEM (Brand + Model).
2. Identify the BRAND.
3. Identify the BROAD CATEGORY (e.g. "Electronics Store", "Pharmacie").
4. Generate 3 Search Options for the user:
   - Option 1 (Specific): Label = "Find [Item]", BUT search_term = **BRAND ONLY** (e.g. "Apple", not "Airpods").
   - Option 2 (Brand): Label = "Find [Brand]", search_term = "[Brand]".
   - Option 3 (Category): Label = "Find [Category]", search_term = "[Category]".
5. Generate 4-6 SPECIFIC ONLINE BUYING LINKS.

CRITICAL RULES:
- **PHYSICAL SEARCH TERMS (options 1-3) MUST BE PHYSICAL PLACES.**
- **NEVER** use "Amazon", "eBay" or "Online" in options 1-3.
- **NEVER** use the Product Model (e.g. "Vision", "Airpods") as the \`search_term\`. Google Maps/OSM DOES NOT know product inventory. SEARCH FOR THE BRAND OR STORE TYPE.

Return ONLY a JSON object:
{
  "item": "Exact Product Name",
  "option1": { 
    "label": "Find [Product Name]", 
    "category": "ENGLISH Category", 
    "search_term": "BRAND NAME ONLY (e.g. 'Honda', 'Apple')" 
  },
  "option2": { 
    "label": "Find [Brand] Store", 
    "category": "ENGLISH Category", 
    "search_term": "BRAND NAME (e.g. 'Honda')" 
  },
  "option3": { 
    "label": "Find [Category]", 
    "category": "ENGLISH Category", 
    "search_term": "CATEGORY NAME (e.g. 'Motorcycle Dealer')" 
  },
  "online_recommendations": [
    {
      "name": "Merchant Name",
      "url": "https://...",
      "type": "New" or "Used",
      "price_level": "High" or "Medium" or "Low"
    }
  ]
}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY} `
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${image}` } }] }],
                max_tokens: 800,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            return res.status(response.status).json({
                error: 'OpenAI API failed',
                details: errorData.error?.message || 'Unknown error',
                status: response.status
            });
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
            console.error('Invalid OpenAI response:', data);
            return res.status(500).json({
                error: 'Invalid OpenAI response',
                details: 'No choices returned'
            });
        }

        const text = data.choices[0].message.content;
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonStr);

        return res.status(200).json(analysis);

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({
            error: 'Analysis failed',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
