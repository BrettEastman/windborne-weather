# WindBorne Weather Balloon + Satellite Tracker

## Project Overview

Build a SvelteKit app that visualizes WindBorne's live weather balloon constellation data alongside orbital satellite data (ISS and Starlink) using Leaflet maps. This is a job application coding challenge for WindBorne Systems.

**Mission:** Demonstrate robust data handling, creative problem-solving, and ability to build something meaningful with real-time atmospheric and space-based data.

## Tech Stack

- SvelteKit with adapter-static
- Leaflet for mapping (not Mapbox, not other frameworks)
- TypeScript
- Standard CSS only (no Tailwind, no CSS frameworks)
- Deploy to Vercel

## Core Requirements

1. Fetch balloon data from `https://a.windbornesystems.com/treasure/XX.json` where XX is 00-23
   - 00.json = current, 23.json = 23 hours ago
   - Creates a 24-hour rolling window
2. Fetch satellite data from real-time APIs (ISS + Starlink constellation)
3. Robust error handling for corrupted balloon data (they warned us!)
4. Live updates via polling every 5-10 minutes
5. Stay well under 1000 requests/hour
6. Clean, responsive UI
7. Must be publicly accessible URL

## Data Structure & Critical Validation

### Balloon Data Format

- Each endpoint returns array of arrays: `[[lat, lon, altitude], ...]`
- Typical length: ~1000 entries per file
- **Data WILL be corrupted** - must validate every entry

### Validation Requirements

Each balloon entry must pass ALL checks:

- Is an array with exactly 3 elements
- All three are valid numbers (not NaN, not null)
- Latitude: -90 to 90
- Longitude: -180 to 180
- Altitude: 0 to 50000 (reasonable bounds in meters)

Filter out invalid entries and track how many were rejected per file. This shows you're handling corruption properly.

### Satellite Data

- ISS API: http://api.open-notify.org/iss-now.json (real-time ISS position)
- Starlink constellation: Generated based on realistic orbital mechanics patterns
- Returns real-time positions, brightness, confidence levels
- Creates beautiful orbital patterns when visualized

## Project Structure

```
src/
├── routes/
│   └── +page.svelte              # Main page with map
├── lib/
│   ├── stores/
│   │   ├── balloonData.ts        # Balloon fetching + state management
│   │   └── satelliteData.ts      # Satellite fetching + state management
│   ├── components/
│   │   ├── Map.svelte            # Leaflet map component
│   │   └── Legend.svelte         # Explain what user is seeing
│   ├── utils/
│   │   └── parseBalloons.ts      # Validation logic
│   └── types/
│       └── index.ts              # TypeScript types
├── app.css                       # Global styles
└── static/
```

## Implementation Guidelines

### Phase 1: Setup

- Create SvelteKit project with TypeScript
- Install: `leaflet`, `@types/leaflet`, `@sveltejs/adapter-static`
- Configure adapter-static for Vercel deployment

### Phase 2: Types

Define clean types for:

- `BalloonPoint`: [lat, lon, altitude] tuple
- `BalloonDataset`: { hour, points, timestamp, errorCount }
- `SatellitePoint`: { latitude, longitude, brightness, confidence, acq_date, acq_time }
- `FetchStatus`: { loading, error, lastUpdated }

### Phase 3: Balloon Data Store

Create a Svelte store that:

- Fetches all 24 endpoints in parallel
- Validates each entry using strict rules above
- Tracks validation errors per file
- Provides `startPolling()` method for automatic updates every 5 minutes
- Returns cleanup function to stop polling

**Key insight:** Use `Promise.all()` to fetch all hours simultaneously, then filter out failed requests gracefully.

### Phase 4: Satellite Data Store

Similar pattern to balloon store:

- Fetch ISS and Starlink constellation data
- Parse CSV/JSON response
- Poll every 10 minutes (orbital data updates less frequently)
- Handle fetch errors gracefully

### Phase 5: Map Component

- Use dynamic import for Leaflet to avoid SSR issues: `await import('leaflet')`
- Create two layer groups: one for balloons, one for satellites
- Balloon markers: color/opacity based on age (newer = brighter)
- Satellite markers: size based on brightness (ISS larger, Starlink smaller)
- Add popups with relevant data for each marker
- Use reactive statements (`$:`) to update markers when store data changes

**Visual approach:**

- Balloons: Small blue circles that fade with age (hour 0 = bright, hour 23 = faint)
- Satellites: Red circles (ISS larger, Starlink smaller)

### Phase 6: Main Page

- Initialize both stores on mount with `startPolling()`
- Clean up intervals on destroy
- Show loading states and errors gracefully
- Display stats: total balloon points, active satellites, last update time
- Include header with title and stats
- Include footer with data attribution and update frequency

### Phase 7: Legend

Position in bottom right corner showing:

- What balloon markers represent
- What satellite markers represent (ISS vs Starlink)
- Brief explanation of why this combination matters

## Styling Guidelines

- Clean, professional design
- Dark header with light content area
- Responsive (mobile-friendly)
- Map should fill available space
- No flashy animations - keep it functional
- Good contrast and readability

## Why Satellites?

This combination tells a story about WindBorne's mission:

- Weather balloons provide atmospheric data from Earth's atmosphere
- Orbital satellites (ISS and Starlink) provide complementary space-based perspectives
- Together they showcase different atmospheric and orbital monitoring capabilities
- Shows how WindBorne's network integrates with global space infrastructure

Include this reasoning in README and submission notes.

## Performance Constraints

**Request budget per hour:**

- Balloon data: 24 endpoints × 12 fetches/hour = 288 requests
- Satellite data: 1 endpoint × 6 fetches/hour = 6 requests
- **Total: 294 requests/hour** ✓ (well under 1000 limit)

## Testing Before Submission

- [ ] All 24 balloon endpoints fetching successfully
- [ ] Validation working (check console for error counts)
- [ ] Map renders with markers
- [ ] Live updates working (wait 5+ minutes and verify refresh)
- [ ] Responsive on mobile
- [ ] Deployment URL publicly accessible
- [ ] README complete with project explanation

## Deployment

1. Push to GitHub
2. Import to Vercel (auto-detects SvelteKit)
3. Add any needed environment variables (if needed)
4. Deploy and verify public access

## README Must Include

- Live deployment URL
- Brief description of what it does
- **Why you chose satellite data** (shows you understand their mission)
- Tech stack
- Data sources with links
- Local development instructions

## Submission

**For the `notes` field:**
Write one sentence about collaboration + one sentence about why satellites. Example:
"I enjoy collaborating through clear communication and building solutions that solve real problems. I chose satellite data because it showcases how WindBorne's atmospheric monitoring complements orbital infrastructure—demonstrating integrated Earth systems observation."

**POST request to** `https://windbornesystems.com/career_applications.json`:

```json
{
  "career_application": {
    "name": "Brett Eastman",
    "email": "brett.austin.eastman@gmail.com",
    "role": "Junior Web Developer",
    "notes": "I chose satellite data because it showcases how WindBorne's atmospheric monitoring complements orbital infrastructure—demonstrating integrated Earth systems observation.",
    "submission_url": "https://your-vercel-app.vercel.app",
    "portfolio_url": "https://www.bretteastman.dev/",
    "resume_url": "https://drive.google.com/file/d/1VOvlsPzH0N5xhieyJWyBuF5qD2-O2ip9/view?usp=drive_link"
  }
}
```

**Test first with curl:**

```bash
curl -X POST https://windbornesystems.com/career_applications.json \
  -H "Content-Type: application/json" \
  -d '{"career_application": {...your data...}}'
```

**Must return status 200!** Any other status means it wasn't accepted.

## Key Success Factors

1. **Robust validation** - They specifically mentioned corruption, show you handled it
2. **Visual polish** - Make it look professional and clean
3. **Clear reasoning** - Explain why satellites matter for their mission
4. **Working live updates** - Demonstrate it's truly dynamic
5. **Follow instructions exactly** - They're testing attention to detail

## Notes for Claude Code

- Leaflet requires dynamic imports in SvelteKit to avoid SSR issues
- Use Svelte stores for state management (not Context API or props drilling)
- Use Svelte 5 syntax: Use runes (`$state`, `$derived`, `$props`) for reactivity, prefer functional components
- Keep components focused and single-responsibility
- Error handling should be graceful and user-friendly
- The validation logic is CRITICAL - don't skip it
- Test the full flow before marking complete
