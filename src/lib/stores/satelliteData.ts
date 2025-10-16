import { writable } from "svelte/store";
import type { SatellitePoint, FetchStatus } from "$lib/types";

interface SatelliteStore {
  satellites: SatellitePoint[];
  status: FetchStatus;
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
      });
    }

    return satellites;
  }

  /**
   * Fetch satellite data from API
   */
  async function fetchSatellites(): Promise<void> {
    update((store) => ({
      ...store,
      status: { ...store.status, loading: true, error: null },
    }));

    try {
      const response = await fetch("/api/satellites");

      if (!response.ok) {
        throw new Error(`Satellite API returned ${response.status}`);
      }

      const csvText = await response.text();
      const satellites = parseCSV(csvText);

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

    // Poll every 10 minutes (600000ms)
    pollingInterval = window.setInterval(() => {
      fetchSatellites();
    }, 10 * 60 * 1000);

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
