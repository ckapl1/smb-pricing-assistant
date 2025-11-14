// Get form and button elements
const form = document.getElementById('pricingForm');
const generateBtn = document.getElementById('generateBtn');
const responseSection = document.getElementById('responseSection');
const tableSection = document.getElementById('tableSection');
const aiResponse = document.getElementById('aiResponse');
const lowPrice = document.getElementById('lowPrice');
const basePrice = document.getElementById('basePrice');
const highPrice = document.getElementById('highPrice');

// Gemini API Configuration
const GEMINI_API_KEY = "YOUR_API_KEY_HERE";

// Build the prompt for Gemini
function buildPrompt(product, cost, competitorPrice) {
    return `You are a pricing advisor for small business owners.

Inputs:
Product name: ${product}
Cost per unit: ${cost}
Competitor price: ${competitorPrice}

Task:
Recommend a selling price that balances margin, fairness, and competitiveness. Return:
1. Recommended price
2. Estimated margin percent
3. A short, friendly explanation that a non technical owner can understand.

Keep the tone conversational. Keep the response under 180 words.`;
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

    // Update table cells with price and margin
    lowPrice.textContent = `$${lowPriceValue.toFixed(2)} (${lowMargin.toFixed(1)}% margin)`;
    basePrice.textContent = `$${basePriceValue.toFixed(2)} (${baseMargin.toFixed(1)}% margin)`;
    highPrice.textContent = `$${highPriceValue.toFixed(2)} (${highMargin.toFixed(1)}% margin)`;
}

// Add event listener to form submission
form.addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent form from submitting
    
    // Disable button during API call
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        // Read values from inputs
        const productName = document.getElementById('productName').value;
        const costPerUnit = parseFloat(document.getElementById('costPerUnit').value);
        const competitorPrice = parseFloat(document.getElementById('competitorPrice').value);
        
        // Log values to console
        console.log('Product Name:', productName);
        console.log('Cost per Unit:', costPerUnit);
        console.log('Competitor Price:', competitorPrice);
        
        // Build prompt
        const promptText = buildPrompt(productName, costPerUnit, competitorPrice);
        console.log('Prompt:', promptText);
        
        // Call Gemini API
        const aiResponseText = await callGemini(promptText);
        console.log('AI Response:', aiResponseText);
        
        // Display AI response in chat bubble
        aiResponse.innerHTML = `<p>${aiResponseText.replace(/\n/g, '<br>')}</p>`;
        
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
        
        // Show response section
        responseSection.style.display = 'block';
        
        // Scroll to response section
        responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
    } catch (error) {
        console.error('Error:', error);
        // Show error message to user
        aiResponse.innerHTML = `<p style="color: #e74c3c;"><strong>Error:</strong> ${error.message}. Please check your API key and try again.</p>`;
        responseSection.style.display = 'block';
    } finally {
        // Re-enable button
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate price recommendation';
    }
});

