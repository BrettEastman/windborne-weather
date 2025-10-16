<script lang="ts">
  import { onMount } from "svelte";
  import type { Map as LeafletMap, LayerGroup, CircleMarker } from "leaflet";
  import type { BalloonDataset, SatellitePoint } from "$lib/types";

  // Props using Svelte 5 runes
  let {
    balloonDatasets = [],
    satellites = [],
  }: { balloonDatasets?: BalloonDataset[]; satellites?: SatellitePoint[] } =
    $props();

  let mapContainer: HTMLDivElement;
  let map: LeafletMap | null = null;
  let balloonLayer: LayerGroup | null = null;
  let satelliteLayer: LayerGroup | null = null;
  let leafletLoaded = $state(false);

  // Debug: Track prop changes
  $effect(() => {
    console.log("Props changed:", {
      balloonsCount: balloonDatasets.length,
      satellitesCount: satellites.length,
      leafletLoaded,
    });
  });

  onMount(() => {
    // Initialize map asynchronously
    (async () => {
      // Dynamic import to avoid SSR issues
      const L = await import("leaflet");

      // Initialize map centered on US
      map = L.map(mapContainer).setView([39.8283, -98.5795], 4);

      // Add OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Create layer groups
      balloonLayer = L.layerGroup().addTo(map);
      satelliteLayer = L.layerGroup().addTo(map);

      leafletLoaded = true;
    })();

    // Return cleanup function
    return () => {
      map?.remove();
    };
  });

  // Update balloon markers when data changes
  $effect(() => {
    if (!balloonLayer || !leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    balloonLayer.clearLayers();

    console.log(
      `Rendering ${balloonDatasets.length} balloon datasets with ${balloonDatasets.reduce((sum, ds) => sum + ds.points.length, 0)} total points`
    );

    // Add markers for each dataset
    balloonDatasets.forEach((dataset) => {
      const age = dataset.hour;
      const opacity = 1 - age / 24; // Fade with age

      dataset.points.forEach(([lat, lon, altitude]) => {
        const marker = L.circleMarker([lat, lon], {
          radius: 3,
          fillColor: "#3b82f6",
          color: "#1e40af",
          weight: 1,
          opacity: opacity,
          fillOpacity: opacity * 0.6,
        });

        marker.bindPopup(`
          <strong>Weather Balloon</strong><br/>
          Latitude: ${lat.toFixed(4)}°<br/>
          Longitude: ${lon.toFixed(4)}°<br/>
          Altitude: ${altitude.toFixed(0)}m<br/>
          Age: ${age} hour${age === 1 ? "" : "s"}
        `);

        balloonLayer!.addLayer(marker);
      });
    });

    console.log("Balloon markers rendered successfully");
  });

  // Update satellite markers when data changes
  $effect(() => {
    if (!satelliteLayer || !leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    satelliteLayer.clearLayers();

    console.log(`Rendering ${satellites.length} satellite points`);

    let issCount = 0;
    let starlinkCount = 0;

    // Add markers for each satellite
    satellites.forEach((sat) => {
      // For satellites: brightness determines size and visibility
      // ISS has brightness ~380, Starlink ~100-300
      let size = 5; // Default size
      let color = "#ef4444"; // Default bright red

      // Make ISS much more prominent
      if (sat.brightness > 350) {
        size = 14; // Much larger for ISS
        color = "#dc2626"; // Darker red for ISS
        issCount++;
      } else {
        size = Math.min(8, Math.max(4, sat.brightness / 50));
        color = "#f87171"; // Lighter red for Starlink
        starlinkCount++;
      }

      const marker = L.circleMarker([sat.latitude, sat.longitude], {
        radius: size,
        fillColor: color,
        color: "#7f1d1d", // Dark red border
        weight: 1.5,
        opacity: 1.0, // Fully opaque border
        fillOpacity: 0.95, // Very visible fill
      });

      // Show satellite type in popup
      const satelliteType = sat.brightness > 350 ? "ISS" : "Starlink";
      marker.bindPopup(`
        <strong>${satelliteType} Satellite</strong><br/>
        Latitude: ${sat.latitude.toFixed(4)}°<br/>
        Longitude: ${sat.longitude.toFixed(4)}°<br/>
        Brightness: ${sat.brightness.toFixed(0)}<br/>
        Confidence: ${sat.confidence}%<br/>
        Time: ${sat.acq_time}
      `);

      satelliteLayer!.addLayer(marker);
    });

    console.log(
      `Added satellite markers: ISS=${issCount}, Starlink=${starlinkCount}`
    );
  });
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
  }

  :global(.leaflet-container) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
  }

  /* Ensure satellite markers are visible */
  :global(.leaflet-pane) {
    z-index: 400;
  }

  :global(.leaflet-marker-pane) {
    z-index: 600;
  }

  /* Make circle markers more visible */
  :global(.leaflet-interactive) {
    cursor: pointer;
  }
</style>
