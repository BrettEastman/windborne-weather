<script lang="ts">
  import { onMount } from "svelte";
  import { balloonData } from "$lib/stores/balloonData";
  import { satelliteData } from "$lib/stores/satelliteData";

  let cleanupBalloons: (() => void) | null = null;
  let cleanupSatellites: (() => void) | null = null;

  onMount(() => {
    cleanupBalloons = balloonData.startPolling();
    cleanupSatellites = satelliteData.startPolling();

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

  // Generate deterministic animation delay based on position (0-2 seconds)
  function getAnimationDelay(x: number, y: number): number {
    const seed = Math.sin(x * 0.01) * Math.cos(y * 0.01);
    return ((seed + 1) / 2) * 2; // Maps to 0-2 seconds
  }

  // Calculate radius based on altitude (0-50000m range) using logarithmic scaling
  function getRadiusFromAltitude(altitude: number): number {
    // Add 1 to avoid log(0), then use log scale for better visibility of variations
    const logAlt = Math.log(altitude + 1);
    const maxLog = Math.log(50001);
    const normalized = logAlt / maxLog;
    return 1 + normalized * 7; // Maps to 1-8px radius
  }
</script>

<svelte:head>
  <title>WindBorne Weather Balloon & Satellite Live Imagery</title>
  <meta
    name="description"
    content="Real-time artistic visualization of WindBorne's weather balloon constellation and orbital satellite network"
  />
</svelte:head>

<div class="container">
  <h1>WindBorne Weather Balloon & Satellite Live Imagery</h1>
  <div class="stats">
    <div>
      Balloons: {$balloonData.datasets.reduce(
        (sum, ds) => sum + ds.points.length,
        0
      )}
    </div>
    <div>Satellites: {$satelliteData.satellites.length}</div>
  </div>

  <div class="map-wrapper">
    <svg class="map" viewBox="0 0 1000 600">
      <!-- Background -->
      <rect width="1000" height="600" fill="none" />

      <!-- Balloons (blue dots) -->
      {#each $balloonData.datasets as dataset}
        {#each dataset.points as [lat, lon, alt]}
          {@const { x, y } = projectPoint(lat, lon, 1000, 600)}
          {@const delay = getAnimationDelay(x, y)}
          <g>
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 1,0.75; -0.75,1; 0.75,-1; 0,0"
              dur="12s"
              begin="{delay}s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1"
            />
            <circle
              cx={x}
              cy={y}
              r={getRadiusFromAltitude(alt)}
              fill="#3b82f6"
              opacity={1 - dataset.hour / 24}
            />
          </g>
        {/each}
      {/each}

      <!-- Satellites (red dots) -->
      {#each $satelliteData.satellites as sat}
        {@const { x, y } = projectPoint(sat.latitude, sat.longitude, 1000, 600)}
        {@const size = sat.brightness > 350 ? 8 : 4}
        {@const delay = getAnimationDelay(x, y)}
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 1,0.75; -0.75,1; 0.75,-1; 0,0"
            dur="12s"
            begin="{delay}s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1"
          />
          <circle cx={x} cy={y} r={size} fill="#dc2626" opacity="0.9" />
        </g>
      {/each}
    </svg>
  </div>

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

  .map-wrapper {
    position: relative;
    width: 100%;
    height: 700px; /* Adjust height as needed */
    overflow: hidden;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    margin-bottom: 20px;
    background: linear-gradient(-45deg, #e8f4f8, #87ceeb, #4a5fe1, #6b46c1);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .map {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .info {
    text-align: center;
    color: #666;
    font-size: 14px;
  }
</style>
