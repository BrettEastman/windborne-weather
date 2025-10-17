# WindBorne Weather Balloon & Satellite Tracker

A real-time artistic display of WindBorne Systems' weather balloon constellation data alongside orbital satellite network data including the ISS and Starlink constellation.

## Live Demo

[Deployment URL will be added here after Vercel deployment]

## What It Does

This application visualizes two critical datasets:

1. **WindBorne Weather Balloons**: Live positions from WindBorne's 24-hour rolling constellation of atmospheric monitoring balloons
2. **Orbital Satellites**: Real-time positions of the International Space Station (ISS) and Starlink constellation from Open-Notify API

## Tech Stack

- **SvelteKit**
- **TypeScript**
- **Standard CSS**
- **Vite**

## Data Sources

- **Balloon Data** - WindBorne's balloon constellation measures atmospheric conditions globally: [WindBorne Systems Treasure Hunt API](https://a.windbornesystems.com/treasure/)

  - 24 hourly endpoints (00.json through 23.json)
  - Each contains ~1000 balloon positions [lat, lon, altitude]
  - Robust validation filters corrupted entries

- **Satellite Data** - ISS and Starlink represent humanity's space-based monitoring and communication network: [Open-Notify API](http://open-notify.org/Open-Notify-API/ISS-Location-Now/) (ISS) & Starlink Constellation Data
  - International Space Station (ISS) real-time position (represented as a star shape)
  - Starlink constellation positions (generated based on orbital mechanics)
  - Includes brightness and timestamp data

## Features

- **Data Validation**: Filters invalid balloon data points based on strict validation rules
- **Live Updates**: Polls every 2 minutes for balloons, 3 minutes for satellites
- **Real-time Statistics**: Shows active data counts and error tracking
- **Interactive Map**: Click markers for detailed information about each point

## Data Validation

The application implements strict validation for balloon data to handle potential corruption:

- Must be an array with exactly 3 elements
- All values must be valid numbers (not NaN, not null)
- Latitude: -90 to 90
- Longitude: -180 to 180
- Altitude: 0 to 50,000 meters

Invalid entries are filtered out and counted to demonstrate robust error handling.

## Deployment

Deployed on Vercel with automatic deployments from the main branch.

## Author

Brett Eastman

- Portfolio: [bretteastman.dev](https://www.bretteastman.dev/)
- Email: brett.austin.eastman@gmail.com

## License

Built as a coding challenge for WindBorne Systems.
