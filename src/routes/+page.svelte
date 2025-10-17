<script lang="ts">
  import { onMount } from "svelte";
  import { balloonData } from "$lib/stores/balloonData";
  import { satelliteData } from "$lib/stores/satelliteData";

  let cleanupBalloons: (() => void) | null = null;
  let cleanupSatellites: (() => void) | null = null;

  // Window dimensions
  let windowWidth = 0;
  let windowHeight = 0;

  // Tooltip state
  let tooltip: { visible: boolean; x: number; y: number; content: string } = {
    visible: false,
    x: 0,
    y: 0,
    content: "",
  };

  onMount(() => {
    // Set initial dimensions
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    // Handle resize
    const handleResize = () => {
      windowWidth = window.innerWidth;
      windowHeight = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    cleanupBalloons = balloonData.startPolling();
    cleanupSatellites = satelliteData.startPolling();

    return () => {
      window.removeEventListener("resize", handleResize);
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

  // Handle hover for balloons
  function handleBalloonHover(
    e: MouseEvent,
    lat: number,
    lon: number,
    alt: number,
    hour: number
  ) {
    const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
    tooltip = {
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `Lat: ${lat.toFixed(2)}° | Lon: ${lon.toFixed(2)}° | Alt: ${(alt / 1000).toFixed(1)}km | Age: ${hour}h`,
    };
  }

  // Handle hover for satellites
  function handleSatelliteHover(
    e: MouseEvent,
    lat: number,
    lon: number,
    brightness: number
  ) {
    const rect = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
    tooltip = {
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: `Lat: ${lat.toFixed(2)}° | Lon: ${lon.toFixed(2)}° | Brightness: ${brightness}`,
    };
  }

  // Hide tooltip
  function hideTooltip() {
    tooltip.visible = false;
  }

  // Generate SVG path for a star shape
  function generateStarPath(cx: number, cy: number, r: number): string {
    const points = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5;
      const radius = i % 2 === 0 ? r : r * 0.4;
      const x = cx + Math.cos(angle - Math.PI / 2) * radius;
      const y = cy + Math.sin(angle - Math.PI / 2) * radius;
      points.push(`${x},${y}`);
    }
    return `M${points.join(" L")} Z`;
  }
</script>

<svelte:head>
  <title>WindBorne Weather Balloon & Satellite Live Imagery</title>
  <meta
    name="description"
    content="Real-time artistic visualization of WindBorne's weather balloon constellation and orbital satellite network"
  />
</svelte:head>

<div class="fullscreen-container">
  <div class="map-wrapper">
    <svg class="map" viewBox="0 0 1000 600" preserveAspectRatio="none">
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
              values="0,0; 1.25,0.9375; -0.9375,1.25; 0.9375,-1.25; 0,0"
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
              class="data-point balloon-point"
              role="button"
              tabindex="0"
              on:mouseenter={(e) =>
                handleBalloonHover(e, lat, lon, alt, dataset.hour)}
              on:mouseleave={hideTooltip}
            />
          </g>
        {/each}
      {/each}

      <!-- Satellites (red dots) -->
      {#each $satelliteData.satellites as sat}
        {@const { x, y } = projectPoint(sat.latitude, sat.longitude, 1000, 600)}
        {@const size = sat.brightness > 350 ? 8 : 4}
        {@const delay = getAnimationDelay(x, y)}
        {@const isISS = sat.satellite === "ISS"}
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
          {#if isISS}
            <!-- ISS rendered as a golden star -->
            <path
              d={generateStarPath(x, y, 8)}
              fill="#FFD700"
              opacity="1"
              class="data-point satellite-point iss-point"
              role="button"
              tabindex="0"
              on:mouseenter={(e) =>
                handleSatelliteHover(
                  e,
                  sat.latitude,
                  sat.longitude,
                  sat.brightness
                )}
              on:mouseleave={hideTooltip}
            />
          {:else}
            <!-- Other satellites as red circles -->
            <circle
              cx={x}
              cy={y}
              r={size}
              fill="#dc2626"
              opacity="0.9"
              class="data-point satellite-point"
              role="button"
              tabindex="0"
              on:mouseenter={(e) =>
                handleSatelliteHover(
                  e,
                  sat.latitude,
                  sat.longitude,
                  sat.brightness
                )}
              on:mouseleave={hideTooltip}
            />
          {/if}
        </g>
      {/each}
    </svg>
  </div>

  <div class="overlay-content">
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
  </div>

  <div class="footer">
    <div class="footer-left">
      <div class="credits">
        <div><strong>Data Sources:</strong></div>
        <div>
          Weather Balloons: <a
            href="https://windbornesystems.com"
            target="_blank"
            rel="noopener noreferrer">WindBorne Systems</a
          >
        </div>
        <div>
          ISS: <a
            href="https://api.open-notify.org/"
            target="_blank"
            rel="noopener noreferrer">Open-Notify API</a
          >
        </div>
        <div>Starlink Constellation: Generated orbital patterns</div>
      </div>
    </div>
    <div class="github-link">
      <a
        href="https://github.com/BrettEastman/windborne-weather"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span>GitHub</span>
      </a>
    </div>
  </div>
</div>

{#if tooltip.visible}
  <div class="tooltip" style="left: {tooltip.x}px; top: {tooltip.y}px">
    {tooltip.content}
  </div>
{/if}

<style>
  .fullscreen-container {
    position: relative;
    width: 100%;
    height: 100vh; /* Full viewport height */
    overflow: hidden;
    background: linear-gradient(-45deg, #e8f4f8, #87ceeb, #4a5fe1, #6b46c1);
    background-size: 400% 400%;
    animation: gradientShift 15s ease infinite;
    box-sizing: border-box;
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

  .map-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* Ensure map is behind overlays */
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .overlay-content {
    position: absolute;
    top: 20px; /* Adjust as needed */
    left: 20px; /* Adjust as needed */
    z-index: 2; /* Ensure overlays are above map */
    color: white;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    max-width: 50%;
  }

  h1 {
    font-size: 1.5em;
    margin-bottom: 3px;
  }

  .stats {
    font-size: 0.75em;
    font-weight: 400;
  }

  /* Hover effects for data points */
  .data-point {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .data-point:hover {
    filter: brightness(1.4);
  }

  .balloon-point:hover {
    r: 5;
  }

  .satellite-point:hover {
    r: 8;
  }

  /* ISS star specific hover effect */
  .iss-point:hover {
    filter: brightness(1.4) drop-shadow(0 0 6px #ffd700);
  }

  /* Tooltip styling */
  .tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 1000;
    transform: translate(-50%, -100%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    font-family: monospace;
  }

  /* Footer styling */
  .footer {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: white;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.7);
    font-size: 0.75em;
    gap: 12px;
    max-width: 45%;
  }

  .credits {
    flex: 1;
    text-align: left;
  }

  .credits div {
    margin: 4px 0;
    line-height: 1.4;
  }

  .credits a {
    color: #c1dbfb;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .credits a:hover {
    color: #e7ecf3;
    text-decoration: underline;
  }

  .footer-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .screen-dimensions {
    font-size: 0.75em;
    color: rgba(255, 255, 255, 0.8);
  }

  .github-link a {
    display: inline-block;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    color: white;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .github-link a:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.6);
    color: #60a5fa;
  }
</style>
