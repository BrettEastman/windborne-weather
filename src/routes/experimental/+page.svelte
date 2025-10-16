<script lang="ts">
  import { onMount } from "svelte";
  import { balloonData } from "$lib/stores/balloonData";
  import { wildfireData } from "$lib/stores/wildfireData";

  let cleanupBalloons: (() => void) | null = null;
  let cleanupSatellites: (() => void) | null = null;

  onMount(() => {
    cleanupBalloons = balloonData.startPolling();
    cleanupSatellites = wildfireData.startPolling();

    return () => {
      cleanupBalloons?.();
      cleanupSatellites?.();
    };
  });

  // Simple mercator projection
  function projectPoint(
    lat: number,
    lon: number,
    width: number,
    height: number
  ) {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }
</script>

<div class="container">
  <h1>Experimental: Satellite & Balloon Tracker (SVG)</h1>
  <div class="stats">
    <div>
      Balloons: {$balloonData.datasets.reduce(
        (sum, ds) => sum + ds.points.length,
        0
      )}
    </div>
    <div>Satellites: {$wildfireData.fires.length}</div>
  </div>

  <svg class="map" viewBox="0 0 1000 600">
    <!-- Background -->
    <rect width="1000" height="600" fill="#e8f4f8" />

    <!-- Balloons (blue dots) -->
    {#each $balloonData.datasets as dataset}
      {#each dataset.points as [lat, lon, alt]}
        {@const { x, y } = projectPoint(lat, lon, 1000, 600)}
        <circle
          cx={x}
          cy={y}
          r="2"
          fill="#3b82f6"
          opacity={1 - dataset.hour / 24}
          title="Balloon: {lat.toFixed(2)}, {lon.toFixed(2)}"
        />
      {/each}
    {/each}

    <!-- Satellites (red dots) -->
    {#each $wildfireData.fires as sat}
      {@const { x, y } = projectPoint(sat.latitude, sat.longitude, 1000, 600)}
      {@const size = sat.brightness > 350 ? 8 : 4}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill="#dc2626"
        opacity="0.9"
        title="Satellite: {sat.latitude.toFixed(2)}, {sat.longitude.toFixed(2)}"
      />
    {/each}
  </svg>

  <p class="info">
    Blue dots = Balloons (fade with age) | Red dots = Satellites (larger = ISS,
    smaller = Starlink)
  </p>
</div>

<style>
  .container {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    color: #1e3a8a;
    margin-bottom: 20px;
  }

  .stats {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    font-size: 16px;
    font-weight: 600;
  }

  .map {
    width: 100%;
    border: 2px solid #3b82f6;
    background: white;
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .info {
    text-align: center;
    color: #666;
    font-size: 14px;
  }
</style>
