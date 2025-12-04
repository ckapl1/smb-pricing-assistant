// Get form and button elements
const form = document.getElementById('pricingForm');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoading = generateBtn.querySelector('.btn-loading');
const resultsContainer = document.getElementById('resultsContainer');
const responseSection = document.getElementById('responseSection');
const tableSection = document.getElementById('tableSection');
const competitorSection = document.getElementById('competitorSection');
const heatmapSection = document.getElementById('heatmapSection');
const aiResponse = document.getElementById('aiResponse');
const competitorList = document.getElementById('competitorList');
const heatmapContainer = document.getElementById('heatmapContainer');
const lowPrice = document.getElementById('lowPrice');
const basePrice = document.getElementById('basePrice');
const highPrice = document.getElementById('highPrice');
const businessLocation = document.getElementById('businessLocation');
const competitorPriceInput = document.getElementById('competitorPrice');

// Gemini API Configuration
const GEMINI_API_KEY = "GITHUB_SECRET_API_KEY_PLACEHOLDER";

// Search for multiple competitors with their pricing
async function searchMultipleCompetitors(productName, storeType, location) {
    const searchPrompt = `You are a market research assistant. Find at least 5-8 specific competitors selling "${productName}" in "${location}" for a ${storeType} business.

For each competitor, provide:
- Competitor name
- Their location/neighborhood (be specific)
- Their price for this product

Format your response as a JSON array like this:
[
  {"name": "Competitor Name", "location": "Neighborhood, City", "price": 25.99},
  {"name": "Another Store", "location": "Different Area, City", "price": 28.50}
]

Return ONLY valid JSON, no additional text. Include competitors from different neighborhoods/areas if possible.`;

    try {
        const responseText = await callGemini(searchPrompt);
        // Try to extract JSON from response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const competitors = JSON.parse(jsonMatch[0]);
            return competitors.filter(c => c.name && c.location && c.price);
        }
        return null;
    } catch (error) {
        console.error('Error searching for competitors:', error);
        return null;
    }
}

// Get pricing data for multiple areas/neighborhoods
async function getAreaPricingData(productName, storeType, baseLocation, competitors) {
    // Extract unique areas from competitors
    const areas = [...new Set(competitors.map(c => c.location))];
    
    // For each area, get average pricing
    const areaData = [];
    for (const area of areas.slice(0, 8)) { // Limit to 8 areas
        const areaCompetitors = competitors.filter(c => c.location === area);
        if (areaCompetitors.length > 0) {
            const avgPrice = areaCompetitors.reduce((sum, c) => sum + parseFloat(c.price), 0) / areaCompetitors.length;
            areaData.push({
                area: area,
                averagePrice: avgPrice,
                competitorCount: areaCompetitors.length,
                prices: areaCompetitors.map(c => parseFloat(c.price))
            });
        }
    }
    
    return areaData;
}

// Build the prompt for Gemini
function buildPrompt(product, cost, competitorPrices, storeType, location) {
    const priceList = competitorPrices.length > 0 
        ? competitorPrices.map((p, i) => `${i + 1}. ${p.name} (${p.location}): $${p.price.toFixed(2)}`).join('\n')
        : 'No specific competitor data available';
    
    const avgPrice = competitorPrices.length > 0
        ? (competitorPrices.reduce((sum, p) => sum + p.price, 0) / competitorPrices.length).toFixed(2)
        : 'N/A';
    
    return `You are a pricing advisor for small business owners.

Business Details:
- Product name: ${product}
- Store type: ${storeType}
- Business location: ${location}
- Cost per unit: $${cost}

Competitor Analysis (${competitorPrices.length} competitors found):
${priceList}
Average competitor price: $${avgPrice}

Task:
Analyze the competitor pricing data and recommend a selling price that balances:
1. Profit margin (your cost is $${cost})
2. Market competitiveness (considering ${competitorPrices.length} competitors)
3. Local market conditions in ${location}

Return:
1. Recommended price
2. Estimated margin percent
3. A short, friendly explanation (2-3 sentences) that considers the competitive landscape and helps a small business owner understand the pricing strategy.

Keep the tone conversational and supportive. Keep the response under 200 words.`;
}

// Call Gemini API
async function callGemini(promptText) {
  const endpoint =
    "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

  const response = await fetch(`${endpoint}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error?.message || data.error || `HTTP ${response.status}`;
    throw new Error(`API Error: ${errorMessage}`);
  }

  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "The model did not return any text."
  );
}

// Extract recommended price from AI response text
function extractRecommendedPrice(aiResponseText) {
    // First, try to find lines starting with "Recommended Price:" or similar
    const lines = aiResponseText.split('\n');
    for (const line of lines) {
        // Look for patterns like "Recommended Price: $X.xx" or "Recommended price: $X.xx"
        const recommendedMatch = line.match(/recommended\s+price[:\s]*\$?(\d+\.?\d*)/i);
        if (recommendedMatch) {
            const price = parseFloat(recommendedMatch[1]);
            if (price > 0) {
                return price;
            }
        }
    }
    
    // If not found, try other patterns like "$X.xx", "price: $X.xx", etc.
    const pricePatterns = [
        /(?:price|selling\s+price)[:\s]*\$?(\d+\.?\d*)/i,
        /\$(\d+\.?\d*)/,
    ];

    for (const pattern of pricePatterns) {
        const match = aiResponseText.match(pattern);
        if (match) {
            const price = parseFloat(match[1]);
            if (price > 0) {
                return price;
            }
        }
    }

    // If no price found, return null
    return null;
}

// Render competitor list
function renderCompetitorList(competitors) {
    if (!competitors || competitors.length === 0) return;
    
    competitorList.innerHTML = competitors.map(competitor => `
        <div class="competitor-card">
            <div class="competitor-info">
                <div class="competitor-name">${competitor.name}</div>
                <div class="competitor-location">${competitor.location}</div>
            </div>
            <div class="competitor-price">$${parseFloat(competitor.price).toFixed(2)}</div>
        </div>
    `).join('');
    
    competitorSection.style.display = 'block';
}

// Render visual heatmap
function renderHeatmap(areaData) {
    if (!areaData || areaData.length === 0) return;
    
    // Find price range for color coding
    const prices = areaData.flatMap(a => a.prices);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Calculate color intensity based on price
    const getColorIntensity = (price) => {
        if (priceRange === 0) return 0.5; // If all prices are the same
        const ratio = (price - minPrice) / priceRange;
        return ratio; // 0 = lowest, 1 = highest
    };
    
    // Get color for price (green to yellow to red gradient)
    const getColor = (intensity) => {
        // Green (low) -> Yellow (medium) -> Red (high)
        if (intensity < 0.5) {
            // Green to Yellow
            const ratio = intensity * 2;
            const r = Math.round(34 + (255 - 34) * ratio);
            const g = Math.round(197 + (255 - 197) * ratio);
            const b = Math.round(34);
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            // Yellow to Red
            const ratio = (intensity - 0.5) * 2;
            const r = Math.round(255);
            const g = Math.round(255 - (255 - 0) * ratio);
            const b = Math.round(0);
            return `rgb(${r}, ${g}, ${b})`;
        }
    };
    
    // Sort areas by price for better visualization
    const sortedAreas = [...areaData].sort((a, b) => a.averagePrice - b.averagePrice);
    
    heatmapContainer.innerHTML = `
        <div class="visual-heatmap">
            <div class="heatmap-visualization">
                ${sortedAreas.map((area, index) => {
                    const intensity = getColorIntensity(area.averagePrice);
                    const color = getColor(intensity);
                    const opacity = 0.6 + (intensity * 0.4); // 0.6 to 1.0 opacity
                    const size = 60 + (intensity * 40); // Size based on price
                    
                    return `
                        <div class="heatmap-cell" 
                             style="background-color: ${color}; 
                                    opacity: ${opacity};
                                    width: ${size}px;
                                    height: ${size}px;
                                    box-shadow: 0 4px 12px rgba(0,0,0,0.15), 0 0 0 3px ${color}40;"
                             data-price="${area.averagePrice.toFixed(2)}"
                             data-area="${area.area}">
                            <div class="heatmap-cell-content">
                                <div class="heatmap-cell-area">${area.area.split(',')[0]}</div>
                                <div class="heatmap-cell-price">$${area.averagePrice.toFixed(2)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="heatmap-details">
                ${sortedAreas.map(area => {
                    const intensity = getColorIntensity(area.averagePrice);
                    const color = getColor(intensity);
                    return `
                        <div class="heatmap-detail-item" style="border-left: 4px solid ${color};">
                            <div class="detail-header">
                                <span class="detail-area">${area.area}</span>
                                <span class="detail-price">$${area.averagePrice.toFixed(2)}</span>
                            </div>
                            <div class="detail-info">
                                ${area.competitorCount} competitor${area.competitorCount !== 1 ? 's' : ''} • 
                                Range: $${Math.min(...area.prices).toFixed(2)} - $${Math.max(...area.prices).toFixed(2)}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="heatmap-legend-visual">
                <div class="legend-title">Price Intensity</div>
                <div class="legend-gradient">
                    <div class="legend-gradient-bar"></div>
                    <div class="legend-labels">
                        <span>$${minPrice.toFixed(2)}</span>
                        <span>$${((minPrice + maxPrice) / 2).toFixed(2)}</span>
                        <span>$${maxPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    heatmapSection.style.display = 'block';
}

// Render sensitivity table with Low, Base, High scenarios
function renderSensitivityTable(recommendedPrice, cost) {
    // Calculate ±5% scenarios
    const lowPriceValue = recommendedPrice * 0.95;
    const basePriceValue = recommendedPrice;
    const highPriceValue = recommendedPrice * 1.05;

    // Calculate margin percent for each scenario
    const calculateMargin = (price, cost) => {
        if (cost === 0) return 0;
        return ((price - cost) / price) * 100;
    };

    const lowMargin = calculateMargin(lowPriceValue, cost);
    const baseMargin = calculateMargin(basePriceValue, cost);
    const highMargin = calculateMargin(highPriceValue, cost);

    // Update scenario prices with margin info
    lowPrice.innerHTML = `$${lowPriceValue.toFixed(2)}<br><span style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 400;">${lowMargin.toFixed(1)}% margin</span>`;
    basePrice.innerHTML = `$${basePriceValue.toFixed(2)}<br><span style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 400;">${baseMargin.toFixed(1)}% margin</span>`;
    highPrice.innerHTML = `$${highPriceValue.toFixed(2)}<br><span style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 400;">${highMargin.toFixed(1)}% margin</span>`;
}

// Add event listener to form submission
form.addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form from submitting
    
    // Disable button during API call
    generateBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btnLoading.textContent = 'Analyzing...';
    
    try {
        // Read values from inputs
        const productName = document.getElementById('productName').value;
        const storeType = document.getElementById('storeType').value;
        const costPerUnit = parseFloat(document.getElementById('costPerUnit').value);
        const location = businessLocation.value.trim();
        const manualCompetitorPrice = competitorPriceInput.value ? parseFloat(competitorPriceInput.value) : null;
        
        if (!location) {
            throw new Error('Please enter your business location.');
        }
        
        // Search for multiple competitors
        btnLoading.textContent = 'Searching for competitors...';
        let competitors = await searchMultipleCompetitors(productName, storeType, location);
        
        if (!competitors || competitors.length === 0) {
            // Fallback: use manual price if provided, or estimate
            if (manualCompetitorPrice) {
                competitors = [{
                    name: 'Manual Entry',
                    location: location,
                    price: manualCompetitorPrice
                }];
            } else {
                throw new Error('Could not find competitors. Please try entering a competitor price manually or check your location.');
            }
        }
        
        // Convert price strings to numbers
        competitors = competitors.map(c => ({
            ...c,
            price: parseFloat(c.price) || 0
        })).filter(c => c.price > 0);
        
        console.log('Found competitors:', competitors);
        
        // Get area pricing data for heatmap
        btnLoading.textContent = 'Analyzing pricing by area...';
        const areaData = await getAreaPricingData(productName, storeType, location, competitors);
        console.log('Area pricing data:', areaData);
        
        // Render competitor list and heatmap
        renderCompetitorList(competitors);
        renderHeatmap(areaData);
        
        // Calculate average competitor price
        const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
        
        // Build prompt with all competitor data
        btnLoading.textContent = 'Generating recommendation...';
        const promptText = buildPrompt(productName, costPerUnit, competitors, storeType, location);
        console.log('Prompt:', promptText);
        
        // Call Gemini API
        const aiResponseText = await callGemini(promptText);
        console.log('AI Response:', aiResponseText);
        
        // Display AI response
        const responseDisplay = aiResponseText.replace(/\n/g, '<br>');
        aiResponse.innerHTML = `<p>${responseDisplay}</p>`;
        
        // Extract recommended price from response
        const recommendedPrice = extractRecommendedPrice(aiResponseText);
        
        if (recommendedPrice) {
            console.log('Extracted Recommended Price:', recommendedPrice);
            // Render sensitivity table
            renderSensitivityTable(recommendedPrice, costPerUnit);
            tableSection.style.display = 'block';
        } else {
            console.warn('Could not extract price from AI response');
            // Still show table with placeholder if price extraction fails
            renderSensitivityTable(costPerUnit * 1.5, costPerUnit);
            tableSection.style.display = 'block';
        }
        
        // Show all result sections
        responseSection.style.display = 'block';
        resultsContainer.style.display = 'flex';
        
        // Scroll to results
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    } catch (error) {
        console.error('Error:', error);
        // Show error message to user
        aiResponse.innerHTML = `<p style="color: #ef4444;"><strong>Error:</strong> ${error.message}</p>`;
        responseSection.style.display = 'block';
        resultsContainer.style.display = 'flex';
        competitorSection.style.display = 'none';
        heatmapSection.style.display = 'none';
        tableSection.style.display = 'none';
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
});

