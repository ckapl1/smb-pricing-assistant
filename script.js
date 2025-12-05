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
    const searchPrompt = `You are a market research assistant. Find competitors selling "${productName}" in "${location}" for a ${storeType} business.

IMPORTANT: Return ONLY a valid JSON array. No explanations, no markdown, no code blocks. Just the JSON array.

Format your response EXACTLY like this (use real competitor names and realistic prices):
[
  {"name": "Store Name 1", "location": "Area Name, ${location}", "price": 25.99},
  {"name": "Store Name 2", "location": "Different Area, ${location}", "price": 28.50},
  {"name": "Store Name 3", "location": "Another Area, ${location}", "price": 27.00}
]

If you cannot find real competitors, create realistic example competitors with varied prices between $10-$100. Include at least 3-5 competitors.`;

    try {
        const responseText = await callGemini(searchPrompt);
        console.log('Raw Gemini response:', responseText);
        
        // Try multiple methods to extract JSON
        let jsonText = responseText.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Try to find JSON array
        let jsonMatch = jsonText.match(/\[[\s\S]*\]/);
        
        if (!jsonMatch) {
            // Try to find any JSON structure
            jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        }
        
        if (jsonMatch) {
            try {
                const competitors = JSON.parse(jsonMatch[0]);
                // Handle if it's a single object instead of array
                const competitorArray = Array.isArray(competitors) ? competitors : [competitors];
                const validCompetitors = competitorArray.filter(c => 
                    c && 
                    (c.name || c.competitor || c.store) && 
                    (c.location || c.area || c.neighborhood) && 
                    (c.price || c.pricing || c.cost)
                ).map(c => ({
                    name: c.name || c.competitor || c.store || 'Unknown Store',
                    location: c.location || c.area || c.neighborhood || location,
                    price: parseFloat(c.price || c.pricing || c.cost || 0)
                })).filter(c => c.price > 0);
                
                if (validCompetitors.length > 0) {
                    console.log('Parsed competitors:', validCompetitors);
                    return validCompetitors;
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError, 'Text:', jsonMatch[0]);
            }
        }
        
        // Fallback: create sample competitors if parsing fails
        console.warn('Could not parse competitors, creating sample data');
        return [
            {name: 'Sample Competitor 1', location: `${location}`, price: 25.00},
            {name: 'Sample Competitor 2', location: `${location}`, price: 28.50},
            {name: 'Sample Competitor 3', location: `${location}`, price: 30.00}
        ];
    } catch (error) {
        console.error('Error searching for competitors:', error);
        // Return sample data as fallback
        return [
            {name: 'Sample Competitor 1', location: location, price: 25.00},
            {name: 'Sample Competitor 2', location: location, price: 28.50},
            {name: 'Sample Competitor 3', location: location, price: 30.00}
        ];
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
    
    const minCompetitorPrice = competitorPrices.length > 0
        ? Math.min(...competitorPrices.map(p => p.price)).toFixed(2)
        : 'N/A';
    
    const maxCompetitorPrice = competitorPrices.length > 0
        ? Math.max(...competitorPrices.map(p => p.price)).toFixed(2)
        : 'N/A';
    
    // Calculate reasonable price range
    const reasonableMin = cost * 1.2; // 20% markup minimum
    const reasonableMax = competitorPrices.length > 0 
        ? Math.max(avgPrice * 1.1, cost * 2.5) // 10% above average or 2.5x cost, whichever is higher
        : cost * 2.5;
    
    return `You are a pricing advisor for small business owners.

Business Details:
- Product name: ${product}
- Store type: ${storeType}
- Business location: ${location}
- Cost per unit: $${cost.toFixed(2)}

Competitor Analysis (${competitorPrices.length} competitors found):
${priceList}
Average competitor price: $${avgPrice}
Price range: $${minCompetitorPrice} - $${maxCompetitorPrice}

IMPORTANT PRICING CONSTRAINTS:
- Your cost is $${cost.toFixed(2)}, so the selling price MUST be higher than this
- Recommended price should be between $${reasonableMin.toFixed(2)} and $${reasonableMax.toFixed(2)}
- Aim for a margin between 20% and 60% (typical for ${storeType} businesses)
- Price should be competitive with the average competitor price of $${avgPrice}
- Do NOT recommend prices that are unreasonably high (more than 3x the average competitor price)

Task:
Recommend a realistic, competitive selling price that:
1. Ensures profitability (price > cost of $${cost.toFixed(2)})
2. Is competitive with the market (considering average of $${avgPrice})
3. Provides a reasonable margin (20-60% is typical)

Format your response EXACTLY like this:
Recommended Price: $XX.XX
Margin: XX%
Explanation: [2-3 sentences explaining the pricing strategy]

Keep the explanation conversational and supportive. The recommended price should be realistic and competitive.`;
}

// List available Gemini models
async function listAvailableModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`
    );
    const data = await response.json();
    console.log('Available models response:', data);
    if (response.ok && data.models) {
      const available = data.models
        .filter(m => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes('generateContent');
        })
        .map(m => {
          // Handle both "models/gemini-pro" and "gemini-pro" formats
          const name = m.name || '';
          // Remove "models/" prefix if present
          const cleanName = name.replace(/^models\//, '');
          console.log(`Found model: ${name} -> ${cleanName}`);
          return cleanName;
        })
        .filter(name => name && name.length > 0); // Remove empty names
      
      console.log('Available models for generateContent:', available);
      return available.length > 0 ? available : null;
    } else {
      console.error('Error listing models:', data);
      return null;
    }
  } catch (error) {
    console.warn('Could not list models:', error);
    return null;
  }
}

// Call Gemini API
async function callGemini(promptText) {
  // Check if API key placeholder wasn't replaced (for local testing)
  // Only show warning, don't throw - the key might be replaced by GitHub Actions
  if (GEMINI_API_KEY === "GITHUB_SECRET_API_KEY_PLACEHOLDER") {
    console.warn('API key placeholder detected - if this is deployed, check GitHub Actions workflow');
  }

  // Try to get available models first
  let modelsToTry = await listAvailableModels();
  
  // Fallback to common model names if listing fails or returns empty
  if (!modelsToTry || modelsToTry.length === 0) {
    console.warn('Model listing failed or returned no models, using fallback list');
    modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest'
    ];
  } else {
    // Use the first available model from the API
    console.log('Using models from API:', modelsToTry);
  }

  console.log('Will try models in this order:', modelsToTry);

  let lastError = null;
  let lastErrorDetails = null;

  for (const model of modelsToTry) {
    try {
      // Use the exact format: models/{model-name}:generateContent
      const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent`;
      const url = `${endpoint}?key=${GEMINI_API_KEY}`;
      
      console.log(`Trying model: ${model} at ${endpoint}`);
      
      const response = await fetch(url, {
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

      if (response.ok) {
        console.log(`✅ Successfully used model: ${model}`);
        const result = data.candidates?.[0]?.content?.parts?.[0]?.text || "The model did not return any text.";
        return result;
      } else {
        // Log the full error for debugging
        console.error(`❌ Model ${model} failed:`, {
          status: response.status,
          error: data.error,
          fullResponse: data
        });
        
        // If it's a 404 (model not found), try next model
        if (response.status === 404) {
          lastError = data.error?.message || `Model ${model} not found`;
          lastErrorDetails = data.error;
          continue;
        }
        // For other errors, throw immediately
        const errorMessage = data.error?.message || data.error || `HTTP ${response.status}`;
        const errorCode = data.error?.code;
        const fullError = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;
        
        throw new Error(`API Error: ${fullError}`);
      }
    } catch (error) {
      // If it's a network error or non-404, throw it
      if (error.message && !error.message.includes('404') && !error.message.includes('not found')) {
        throw error;
      }
      lastError = error.message || 'Unknown error';
    }
  }

  // If all models failed, provide detailed error
  const errorMsg = `API Error: Could not find a working model. Tried: ${modelsToTry.join(', ')}. Last error: ${lastError}`;
  console.error('All models failed:', errorMsg, lastErrorDetails);
  throw new Error(errorMsg);
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
            if (price > 0 && price < 10000) { // Sanity check: price should be reasonable
                return price;
            }
        }
    }
    
    // Try more specific patterns
    const pricePatterns = [
        /(?:recommended|suggested|recommend)\s+price[:\s]*\$?(\d+\.?\d*)/i,
        /price[:\s]*\$?(\d+\.?\d*)/i,
        /\$(\d+\.?\d*)/,
    ];

    const foundPrices = [];
    for (const pattern of pricePatterns) {
        const matches = aiResponseText.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
            const price = parseFloat(match[1]);
            if (price > 0 && price < 10000) {
                foundPrices.push(price);
            }
        }
    }
    
    // Return the first reasonable price found
    if (foundPrices.length > 0) {
        // Prefer prices that look like recommendations (not in explanations)
        const firstPrice = foundPrices[0];
        return firstPrice;
    }

    // If no price found, return null
    console.warn('Could not extract price from AI response:', aiResponseText.substring(0, 200));
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
        let recommendedPrice = extractRecommendedPrice(aiResponseText);
        
        if (recommendedPrice) {
            // Validate the price is reasonable
            const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
            const maxReasonablePrice = Math.max(avgCompetitorPrice * 1.5, costPerUnit * 3);
            const minReasonablePrice = Math.max(costPerUnit * 1.1, avgCompetitorPrice * 0.8);
            
            if (recommendedPrice > maxReasonablePrice) {
                console.warn(`Extracted price $${recommendedPrice} seems too high. Capping at $${maxReasonablePrice.toFixed(2)}`);
                recommendedPrice = maxReasonablePrice;
            } else if (recommendedPrice < minReasonablePrice) {
                console.warn(`Extracted price $${recommendedPrice} seems too low. Setting to $${minReasonablePrice.toFixed(2)}`);
                recommendedPrice = minReasonablePrice;
            }
            
            console.log('Extracted Recommended Price:', recommendedPrice);
            // Render sensitivity table
            renderSensitivityTable(recommendedPrice, costPerUnit);
            tableSection.style.display = 'block';
        } else {
            console.warn('Could not extract price from AI response');
            // Calculate a reasonable fallback price based on competitors and cost
            const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
            const fallbackPrice = Math.max(costPerUnit * 1.3, avgCompetitorPrice * 0.9);
            renderSensitivityTable(fallbackPrice, costPerUnit);
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

