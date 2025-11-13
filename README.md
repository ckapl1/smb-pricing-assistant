# SMB Pricing Assistant

## Project Overview

The SMB Pricing Assistant is a web application that helps small business owners determine optimal pricing for their products. It leverages Google's Gemini AI model (via Google AI Studio and an API key) to generate intelligent price recommendations based on product cost and competitor pricing data. The application provides AI-powered insights along with a sensitivity analysis table showing how different price points affect profit margins.

## Features

- **AI-powered pricing recommendation** - Uses Gemini AI to analyze cost and competitor data and provide personalized pricing advice
- **Dynamic text response section** - Displays AI-generated recommendations in a clean, readable format
- **Automatic price extraction** - Intelligently extracts the recommended price from the AI response using pattern matching
- **Sensitivity table (low/base/high)** - Shows three pricing scenarios (±5% from base recommendation) with calculated margin percentages
- **Clean, responsive UI with modern styling** - Professional gradient design with smooth animations and mobile-friendly layout
- **Client-side JavaScript API call** - All API interactions happen directly from the browser
- **No backend required** - Fully client-side application that runs entirely in the browser
- **Runs locally in any browser** - Simply open the HTML file to use the application

## How to Run the Project

1. **Clone the repo**
   ```bash
   git clone https://github.com/ckapl1/smb-pricing-assistant.git
   cd smb-pricing-assistant
   ```

2. **Insert API key inside script.js at the GEMINI_API_KEY constant**
   - Open `script.js` in a text editor
   - Locate the line: `const GEMINI_API_KEY = "YOUR_API_KEY_HERE";`
   - Replace `YOUR_API_KEY_HERE` with your Google AI Studio API key
   - Save the file

3. **Open index.html in any browser**
   - Double-click `index.html` or open it from your browser's File menu
   - The application will load and be ready to use

4. **Everything works locally**
   - No server setup required
   - No build process needed
   - All functionality runs directly in your browser

## File Structure

- **index.html** - Main HTML structure containing the form, response section, and sensitivity table
- **style.css** - Complete styling with modern design system, responsive breakpoints, and smooth animations
- **script.js** - Core JavaScript logic including API calls, price extraction, sensitivity calculations, and form handling
- **listmodels.html** - Utility page for testing and listing available Gemini models via the API

## Technical Details

### Model Used
The application uses the **"models/gemini-2.5-flash"** model via the Google Generative Language API. This model is accessed through the `generateContent` endpoint.

### API Integration
- **Endpoint**: `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent`
- **Method**: POST request with JSON payload containing the prompt
- **Authentication**: API key passed as a query parameter

### Input Validation
The form validates that:
- Product name is provided (required field)
- Cost per unit is a positive number (step: 0.01, min: 0)
- Competitor price is a positive number (step: 0.01, min: 0)

### Price Extraction Logic
The application uses multiple regex patterns to extract the recommended price from the AI response:
1. First attempts to find lines containing "Recommended Price:" or similar patterns
2. Falls back to searching for price patterns like "$X.xx" or "price: $X.xx"
3. Validates that extracted prices are positive numbers
4. If extraction fails, uses a fallback calculation (cost × 1.5)

### Sensitivity Analysis Formulas
The sensitivity table calculates three scenarios based on the recommended price:
- **Low**: `recommendedPrice × 0.95` (5% below base)
- **Base**: `recommendedPrice` (AI recommendation)
- **High**: `recommendedPrice × 1.05` (5% above base)

Margin calculation for each scenario:
```
margin = ((price - cost) / price) × 100
```

### Frontend-Only Architecture
- All processing happens client-side using vanilla JavaScript
- No server-side code or backend infrastructure required
- Direct API calls from the browser using the Fetch API
- State management handled through DOM manipulation
- No build tools or dependencies needed

## Use of AI in This Project

This project was developed using a combination of manual coding and generative AI assistance. I used Cursor AI and ChatGPT to help with:  
• writing starter code for the HTML/CSS/JavaScript  
• debugging API errors related to Google Gemini model naming  
• generating the listmodels endpoint output  
• helping redesign portions of the UI  
• helping write the README documentation  

All AI-generated code was reviewed, tested, and fully understood before being included in the final submission. The logic for pricing, margin computation, and sensitivity analysis was verified independently. No part of the assignment was completed in a fully automated fashion; AI was used as a tool for productivity, not as a replacement for learning.

## Academic Integrity Statement

I verify that I personally directed all development decisions and understand every line of code in this project. AI was used only within the guidelines of the course and institutional academic integrity policies.

## Future Improvements

- Add backend authentication for secure API key management
- Save user inputs and pricing history to a database
- Batch pricing mode for analyzing multiple products at once
- Add charts and data visualization for margin trends and competitor analysis

## AI Disclosure

> **AI Disclosure**  
> Portions of this README and parts of this project were created with the assistance of AI tools (Cursor AI and ChatGPT). I provided specific instructions, context, and project requirements, and the AI generated draft text, code suggestions, and debugging guidance. All AI-generated material was reviewed, edited, and approved by me. I fully understand every component of this project, and no content was included without my explicit oversight.

## Prompting Summary

> **Prompting Summary**  
> Throughout the development of this project, I used structured prompts to guide AI tools in generating code, debugging API errors, and refining documentation. Examples of how prompting was used include:  
> - Asking AI Studio and Cursor to generate the initial HTML, CSS, and JavaScript structure for the pricing tool  
> - Using targeted prompts to debug the Google Gemini API model error and switch to the correct `gemini-2.0-flash-001` endpoint  
> - Prompting Cursor to restyle and clean the UI for a polished prototype  
> - Using prompts to help draft and edit the README and PRD structure  
>  
> Prompts were iterative: I provided context → reviewed the output → refined the request. This ensured the final implementation matched the assignment requirements and that I understood all generated material.

