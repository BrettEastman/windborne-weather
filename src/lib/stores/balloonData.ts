import { writable } from "svelte/store";
import type { BalloonDataset, BalloonStore } from "$lib/types";
import { validateBalloonData } from "$lib/utils/parseBalloons";

const HOURS = 24; // Fetch 24 hours of data (00.json to 23.json)

function createBalloonStore() {
  const { subscribe, set, update } = writable<BalloonStore>({
    datasets: [],
    status: {
      loading: false,
      error: null,
      lastUpdated: null,
    },
  });

  let pollingInterval: number | null = null;

  /**
   * Fetch data for a single hour
   */
  async function fetchHour(hour: number): Promise<BalloonDataset | null> {
    const hourStr = hour.toString().padStart(2, "0");
    const url = `/api/balloons?hour=${hour}`;

    try {
      console.log(`[Store] Fetching balloon data from ${url}`);
      const response = await fetch(url);
      console.log(`[Store] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to fetch ${hourStr}.json: ${response.status}`,
          errorText
        );
        return null;
      }

      const rawData = await response.json();
      console.log(`[Store] Received data for ${hourStr}:`, rawData);

      // Validate data
      if (!Array.isArray(rawData)) {
        console.warn(`Invalid data format for ${hourStr}.json`);
        return null;
      }

      const { validPoints, errorCount } = validateBalloonData(rawData);

      console.log(
        `Hour ${hourStr}: ${validPoints.length} valid points, ${errorCount} errors filtered`
      );

      return {
        hour,
        points: validPoints,
        timestamp: new Date(),
        errorCount,
      };
    } catch (error) {
      console.error(`Error fetching ${hourStr}.json:`, error);
      return null;
    }
  }

  /**
   * Fetch all 24 hours of balloon data in parallel
   */
  async function fetchAll(): Promise<void> {
    // update store to show status as loading
    update((store) => ({
      ...store,
      status: { ...store.status, loading: true, error: null },
    }));

    try {
      // Create array of hour numbers: [0, 1, 2, ..., 23]
      const hours = Array.from({ length: HOURS }, (_, i) => i);

      // Fetch all hours in parallel
      const results = await Promise.all(hours.map((hour) => fetchHour(hour)));

      // Filter out failed requests
      const successfulDatasets = results.filter(
        (dataset): dataset is BalloonDataset => dataset !== null
      );

      // Update store with successful datasets
      update((store) => ({
        datasets: successfulDatasets,
        status: {
          loading: false,
          error: null,
          lastUpdated: new Date(),
        },
      }));

      console.log(
        `Successfully loaded ${successfulDatasets.length}/${HOURS} balloon datasets`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
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
   * Start polling for updates every 5 minutes
   * Returns cleanup function to stop polling
   */
  function startPolling(): () => void {
    // Initial fetch
    fetchAll();

    // Poll every 2 minutes
    pollingInterval = window.setInterval(() => {
      fetchAll();
    }, 2 * 60 * 1000);

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
    fetchAll,
    startPolling,
  };
}

export const balloonData = createBalloonStore();
