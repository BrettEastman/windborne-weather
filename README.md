# WindBorne Weather Balloon & Satellite Tracker

A real-time visualization tool that displays WindBorne Systems' weather balloon constellation data alongside orbital satellite network data including the ISS and Starlink constellation.

## Live Demo

[Deployment URL will be added here after Vercel deployment]

## What It Does

This application visualizes two critical datasets:

1. **WindBorne Weather Balloons**: Live positions from WindBorne's 24-hour rolling constellation of atmospheric monitoring balloons
2. **Orbital Satellites**: Real-time positions of the International Space Station (ISS) and Starlink constellation from Open-Notify API

## Why Satellites?

This combination tells an important story about monitoring Earth's systems. Weather balloons provide crucial atmospheric data, while orbital satellites provide connectivity and positioning infrastructure. Together they represent:

- **Atmospheric Monitoring**: WindBorne's balloon constellation measures atmospheric conditions globally
- **Orbital Infrastructure**: ISS and Starlink represent humanity's space-based monitoring and communication network
- **Integrated Earth Systems**: Combining atmospheric and orbital data creates a comprehensive picture of Earth observation capabilities

By visualizing both datasets together, this app demonstrates how WindBorne's network complements global space infrastructure.

## Tech Stack

- **SvelteKit** - Framework with adapter-static for deployment
- **TypeScript** - Type-safe development
- **Leaflet** - Interactive mapping (no Mapbox or other frameworks)
- **Standard CSS** - Clean styling without frameworks
- **Vite** - Build tooling

## Data Sources

- **Balloon Data**: [WindBorne Systems Treasure Hunt API](https://a.windbornesystems.com/treasure/)

  - 24 hourly endpoints (00.json through 23.json)
  - Each contains ~1000 balloon positions [lat, lon, altitude]
  - Robust validation filters corrupted entries

- **Wildfire Data**: [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/)
  - MODIS Near Real-Time (NRT) active fire detections
  - Last 24 hours of global wildfire activity
  - Includes brightness, confidence, and timestamp data

## Features

- **Robust Data Validation**: Filters invalid balloon data points based on strict validation rules
- **Live Updates**: Polls every 5 minutes for balloons, 10 minutes for wildfires
- **Performance Optimized**: Uses ~294 requests/hour (well under 1000 limit)
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Statistics**: Shows active data counts and error tracking
- **Interactive Map**: Click markers for detailed information about each point

## Local Development

### Prerequisites

- Node.js 18+ and npm

### Installation

\`\`\`bash

# Install dependencies

npm install

# Start development server

npm run dev

# Open browser to http://localhost:5173

\`\`\`

### Build for Production

\`\`\`bash

# Build static site

npm run build

# Preview production build

npm run preview
\`\`\`

## Project Structure

\`\`\`
src/
├── routes/
│ └── +page.svelte # Main page with map and stats
├── lib/
│ ├── stores/
│ │ ├── balloonData.ts # Balloon fetching + polling
│ │ └── wildfireData.ts # Wildfire fetching + polling
│ ├── components/
│ │ ├── Map.svelte # Leaflet map with markers
│ │ └── Legend.svelte # Map legend and explanation
│ ├── utils/
│ │ └── parseBalloons.ts # Data validation logic
│ └── types/
│ └── index.ts # TypeScript types
└── app.css # Global styles
\`\`\`

## Data Validation

The application implements strict validation for balloon data to handle potential corruption:

- Must be an array with exactly 3 elements
- All values must be valid numbers (not NaN, not null)
- Latitude: -90 to 90
- Longitude: -180 to 180
- Altitude: 0 to 50,000 meters

Invalid entries are filtered out and counted to demonstrate robust error handling.

## Performance

**Request Budget (per hour):**

- Balloon endpoints: 24 files × 12 requests/hour = 288 requests
- Wildfire endpoint: 1 file × 6 requests/hour = 6 requests
- **Total: 294 requests/hour** ✅ (well under 1000 limit)

## Deployment

Deployed on Vercel with automatic deployments from the main branch.

## Author

Brett Eastman

- Portfolio: [bretteastman.dev](https://www.bretteastman.dev/)
- Email: brett.austin.eastman@gmail.com

## License

Built as a coding challenge for WindBorne Systems.
