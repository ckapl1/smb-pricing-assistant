# Product Requirements Document (Final)
## Pricing Assistant

**Version:** Final  
**Date:** December 2024  
**Status:** Phase 2 Prototype - Production Ready

**Note:** This PRD was generated with AI assistance (Cursor AI) and reviewed/validated by the project owner.

---

## 1. Product Overview (Updated)

The Pricing Assistant is an AI-powered web application that helps small and medium business (SMB) owners generate data-informed pricing recommendations. The tool addresses a critical challenge faced by small business owners: determining optimal product pricing that balances profitability, market competitiveness, and local market conditions.

**Target Users:** Small business owners, entrepreneurs, and retail managers who need quick, informed pricing decisions without extensive market research capabilities.

**Current State:** The prototype is a fully functional web application deployed on GitHub Pages. It combines AI-powered competitor analysis with visual data presentation to provide comprehensive pricing insights. Users can input their product details and receive AI-generated recommendations, competitor pricing analysis, and geographic pricing heatmaps—all in a clean, professional interface inspired by Stripe's design language.

---

## 2. Core Features & Status

### Implemented Features ✅

**Input & Configuration:**
- Product name input field
- Business type selection (Retail, Restaurant, Service, E-commerce, Wholesale, Specialty, Other)
- Business location input (city, state, or ZIP code)
- Cost per unit input with dollar prefix
- Optional manual competitor price input
- Form validation and required field handling

**AI-Powered Analysis:**
- Automatic competitor discovery using location and product name *(AI-dependent)*
- Multi-competitor pricing analysis (searches for 5-8 competitors) *(AI-dependent)*
- AI-generated pricing recommendations with explanations *(AI-dependent)*
- Dynamic model discovery (automatically finds working Gemini model) *(AI-dependent)*

**Data Visualization:**
- Competitor list display with names, locations, and prices
- Price heatmap visualization with circular cells (color-coded by price intensity)
- Price sensitivity analysis table (Low/Base/High scenarios with margin percentages)
- Geographic area pricing breakdown

**User Experience:**
- Stripe-inspired clean, minimal UI design
- Card-based layout with clear visual hierarchy
- Responsive design for mobile and desktop
- Loading states and error handling
- Smooth animations and transitions

**Technical Infrastructure:**
- GitHub Actions workflow for automated deployment
- GitHub Secrets integration for secure API key management
- Price validation and sanity checks
- Robust error handling with fallback mechanisms

### Partially Implemented Features ⚠️

- **Competitor Search Reliability:** Works but may return sample data if real competitors aren't found
- **Price Extraction:** Generally works but may occasionally miss prices from unstructured AI responses
- **Model Compatibility:** Automatically tries multiple models, but requires API key with proper permissions

### Future Features 🔮

- Export/Save functionality for pricing reports
- Historical pricing tracking
- Multi-product comparison
- Advanced pricing elasticity modeling
- Backend proxy for enhanced API key security
- User accounts and saved pricing strategies

---

## 3. AI Specification (Final)

### What the AI Does

The AI performs three primary tasks in the user flow:

**Task 1: Competitor Discovery** *(AI-dependent)*
- **Input:** Product name, business type, location
- **Output:** JSON array of 5-8 competitors with names, locations, and prices
- **Model:** Google Gemini API (dynamically selected)
- **Location in Flow:** After form submission, before price recommendation
- **Prompt Strategy:** Structured JSON request with specific format requirements

**Task 2: Price Recommendation** *(AI-dependent)*
- **Input:** Product name, cost per unit, competitor pricing data, business type, location
- **Output:** Recommended price, estimated margin percentage, and conversational explanation
- **Model:** Google Gemini API (dynamically selected)
- **Location in Flow:** After competitor analysis, main recommendation display
- **Prompt Strategy:** Constrained prompt with explicit pricing bounds, margin targets, and competitive context

**Task 3: Geographic Area Analysis** *(Future - Currently uses competitor data)*
- **Input:** Competitor locations and prices
- **Output:** Grouped pricing by geographic area/neighborhood
- **Current

