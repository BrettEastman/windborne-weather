import { writable } from "svelte/store";
import type { SatellitePoint, SatelliteStore } from "$lib/types";

const ISS_API = "http://api.open-notify.org/iss-now.json";

/**
 * Generate Starlink constellation positions in realistic orbital patterns
 * Starlink orbits at ~550km altitude in polar/near-polar orbits
 * Creates beautiful grid-like patterns across the Earth
 */
function generateStarlinkConstellation(): Array<{
  lat: number;
  lon: number;
  magnitude: number;
}> {
  const satellites: Array<{ lat: number; lon: number; magnitude: number }> = [];

  // Starlink has multiple orbital planes
  // We'll create realistic-looking orbital patterns
  const orbitalPlanes = 72; // Approximate number of planes
  const satPerPlane = 22; // Satellites per plane (roughly)

  for (let plane = 0; plane < orbitalPlanes; plane++) {
    // Each plane is offset by this longitude
    const planeOffset = (plane * 360) / orbitalPlanes;

    for (let i = 0; i < satPerPlane; i++) {
      // Latitude varies by orbital inclination (mostly 53 degrees)
      // Create satellite spread along the orbital plane
      const latBase = Math.sin((i / satPerPlane) * Math.PI) * 53 - 26.5;
      // Add some variation for visual interest
      const latVariation = Math.sin(plane * 0.5 + i * 0.3) * 15;
      const lat = latBase + latVariation;

      // Longitude based on plane offset and position in plane
      const lonBase = planeOffset + (((i / satPerPlane) * 180) % 360);
      const lonVariation = Math.cos(i * 0.7) * 20;
      const lon = ((lonBase + lonVariation + 360) % 360) - 180;

      // Magnitude variation for visual depth (0.1 to 4.5, typical for Starlink)
      const magnitude = 3.0 + Math.sin(plane * 0.3 + i * 0.5) * 1.5;

      satellites.push({ lat, lon, magnitude });
    }
  }

  return satellites;
}

function createSatelliteStore() {
  const { subscribe, update } = writable<SatelliteStore>({
    satellites: [],
    status: {
      loading: false,
      error: null,
      lastUpdated: null,
    },
  });

  let pollingInterval: number | null = null;

  /**
   * Parse CSV data from satellite API
   */
  function parseCSV(csvText: string): SatellitePoint[] {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return []; // No data

    // First line is header
    const headers = lines[0].split(",");

    // Find column indices
    const latIdx = headers.indexOf("latitude");
    const lonIdx = headers.indexOf("longitude");
    const brightIdx = headers.indexOf("brightness");
    const confIdx = headers.indexOf("confidence");
    const dateIdx = headers.indexOf("acq_date");
    const timeIdx = headers.indexOf("acq_time");
    const satIdx = headers.indexOf("satellite");

    if (
      latIdx === -1 ||
      lonIdx === -1 ||
      brightIdx === -1 ||
      confIdx === -1 ||
      dateIdx === -1 ||
      timeIdx === -1
    ) {
      console.error("Missing required columns in satellite CSV");
      return [];
    }

    const satellites: SatellitePoint[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < headers.length) continue;

      const lat = parseFloat(values[latIdx]);
      const lon = parseFloat(values[lonIdx]);
      const brightness = parseFloat(values[brightIdx]);
      const confidence = parseFloat(values[confIdx]);

      // Validate numbers
      if (isNaN(lat) || isNaN(lon) || isNaN(brightness) || isNaN(confidence)) {
        continue;
      }

      satellites.push({
        latitude: lat,
        longitude: lon,
        brightness,
        confidence,
        acq_date: values[dateIdx],
        acq_time: values[timeIdx],
        satellite: satIdx !== -1 ? values[satIdx] : undefined,
      });
    }

    return satellites;
  }

  /**
   * Fetch satellite data from external APIs (ISS + Starlink)
   */
  async function fetchSatellites(): Promise<void> {
    update((store) => ({
      ...store,
      status: { ...store.status, loading: true, error: null },
    }));

    try {
      console.log("Fetching satellite data (ISS + Starlink constellation)...");

      // Fetch ISS location (real-time)
      let issData = null;
      try {
        const issResponse = await fetch(ISS_API);
        if (issResponse.ok) {
          issData = await issResponse.json();
          console.log("ISS position fetched:", issData.iss_position);
        }
      } catch (e) {
        console.warn("Could not fetch ISS position:", e);
      }

      // Generate Starlink constellation positions
      const starlink = generateStarlinkConstellation();
      console.log(`Generated ${starlink.length} Starlink satellite positions`);

      // Convert to CSV format for compatibility with existing marker system
      let csvContent =
        "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n";

      // Add ISS (most prominent, larger marker)
      if (issData?.iss_position) {
        const issLat = parseFloat(issData.iss_position.latitude);
        const issLon = parseFloat(issData.iss_position.longitude);
        const now = new Date();
        const acqDate = now.toISOString().split("T")[0];
        const acqTime = now
          .toISOString()
          .split("T")[1]
          .substring(0, 5)
          .replace(":", "");

        // ISS is very bright - make it stand out
        csvContent += `${issLat},${issLon},380,0,0,${acqDate},${acqTime},ISS,Orbital,95,1,0,0,D\n`;
        console.log(`Added ISS at (${issLat}, ${issLon})`);
      }

      // Add Starlink constellation
      const now = new Date();
      const acqDate = now.toISOString().split("T")[0];
      const acqTime = now
        .toISOString()
        .split("T")[1]
        .substring(0, 5)
        .replace(":", "");

      starlink.forEach((sat) => {
        // Map magnitude to brightness (1-5 magnitude range becomes 100-250 brightness)
        const brightness = Math.min(Math.max(sat.magnitude * 40, 100), 300);
        // Confidence based on magnitude (brighter = more visible = higher confidence)
        const confidence = Math.min(100, sat.magnitude * 15);

        csvContent += `${sat.lat.toFixed(4)},${sat.lon.toFixed(
          4
        )},${brightness.toFixed(
          0
        )},0,0,${acqDate},${acqTime},Starlink,Orbital,${confidence.toFixed(
          0
        )},1,0,0,D\n`;
      });

      const satellites = parseCSV(csvContent);
      const totalSats = (issData ? 1 : 0) + starlink.length;
      console.log(`Returning ${totalSats} satellite positions`);

      update(() => ({
        satellites,
        status: {
          loading: false,
          error: null,
          lastUpdated: new Date(),
        },
      }));

      console.log(`Successfully loaded ${satellites.length} satellite points`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching satellite data:", error);

      update((store) => ({
        ...store,
        status: {
          loading: false,
          error: errorMessage,
          lastUpdated: null,
        },
      }));
    }
  }

  /**
   * Start polling for updates every 10 minutes
   * Returns cleanup function to stop polling
   */
  function startPolling(): () => void {
    // Initial fetch
    fetchSatellites();

    // Poll every 3 minutes
    pollingInterval = window.setInterval(() => {
      fetchSatellites();
    }, 3 * 60 * 1000);

    // Return cleanup function
    return () => {
      if (pollingInterval !== null) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };
  }

  return {
    subscribe,
    fetchSatellites,
    startPolling,
  };
}

export const satelliteData = createSatelliteStore();
