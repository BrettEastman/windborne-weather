<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Map from "$lib/components/Map.svelte";
  import Legend from "$lib/components/Legend.svelte";
  import { balloonData } from "$lib/stores/balloonData";
  import { satelliteData } from "$lib/stores/satelliteData";

  let cleanupBalloons: (() => void) | null = null;
  let cleanupSatellites: (() => void) | null = null;

  onMount(() => {
    // Start polling for both data sources
    cleanupBalloons = balloonData.startPolling();
    cleanupSatellites = satelliteData.startPolling();
  });

  onDestroy(() => {
    // Clean up polling intervals
    cleanupBalloons?.();
    cleanupSatellites?.();
  });

  // Calculate total balloon points
  let totalBalloonPoints = $derived(
    $balloonData.datasets.reduce((sum, ds) => sum + ds.points.length, 0)
  );

  // Calculate total errors filtered
  let totalErrors = $derived(
    $balloonData.datasets.reduce((sum, ds) => sum + ds.errorCount, 0)
  );

  // Format last updated time
  function formatTime(date: Date | null): string {
    if (!date) return "Never";
    return date.toLocaleTimeString();
  }
</script>

<svelte:head>
  <title>WindBorne Weather Balloon & Satellite Tracker</title>
  <meta
    name="description"
    content="Real-time visualization of WindBorne's weather balloon constellation and orbital satellite network"
  />
</svelte:head>

<div class="app">
  <header>
    <div class="header-content">
      <h1>WindBorne Weather Balloon & Satellite Tracker</h1>
      <p class="subtitle">
        Visualizing atmospheric monitoring data alongside orbital infrastructure
      </p>
    </div>
  </header>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">Balloon Datasets</div>
      <div class="stat-value">{$balloonData.datasets.length} / 24</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Total Balloon Points</div>
      <div class="stat-value">{totalBalloonPoints.toLocaleString()}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Active Satellites</div>
      <div class="stat-value">
        {$satelliteData.satellites.length.toLocaleString()}
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Invalid Points Filtered</div>
      <div class="stat-value">{totalErrors.toLocaleString()}</div>
    </div>
  </div>

  {#if $balloonData.status.loading || $satelliteData.status.loading}
    <div class="loading-banner">Loading data...</div>
  {/if}

  {#if $balloonData.status.error || $satelliteData.status.error}
    <div class="error-banner">
      {$balloonData.status.error || $satelliteData.status.error}
    </div>
  {/if}

  <div class="map-wrapper">
    <Map
      balloonDatasets={$balloonData.datasets}
      satellites={$satelliteData.satellites}
    />
    <Legend />
  </div>

  <footer>
    <div class="footer-content">
      <div class="data-sources">
        <strong>Data Sources:</strong>
        <a
          href="https://windbornesystems.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          WindBorne Systems
        </a>
        •
        <a
          href="https://api.open-notify.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          ISS/Open-Notify
        </a>
      </div>
      <div class="update-info">
        Last updated: Balloons {formatTime($balloonData.status.lastUpdated)} • Satellites
        {formatTime($satelliteData.status.lastUpdated)}
        <br />
        Updates every 5 min (balloons) / 10 min (satellites)
      </div>
    </div>
  </footer>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  header {
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    color: white;
    padding: 24px 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    margin: 0 0 8px 0;
    font-size: 28px;
    font-weight: 700;
  }

  .subtitle {
    margin: 0;
    font-size: 16px;
    opacity: 0.95;
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 20px;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
  }

  .stat-card {
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    text-align: center;
  }

  .stat-label {
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1f2937;
  }

  .loading-banner,
  .error-banner {
    padding: 12px 20px;
    text-align: center;
    font-weight: 500;
  }

  .loading-banner {
    background: #dbeafe;
    color: #1e40af;
  }

  .error-banner {
    background: #fee2e2;
    color: #991b1b;
  }

  .map-wrapper {
    position: relative;
    flex: 1;
    min-height: 0;
  }

  footer {
    background: #1f2937;
    color: #d1d5db;
    padding: 16px 20px;
    font-size: 13px;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .data-sources a {
    color: #60a5fa;
    text-decoration: none;
  }

  .data-sources a:hover {
    text-decoration: underline;
  }

  .update-info {
    text-align: right;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 22px;
    }

    .subtitle {
      font-size: 14px;
    }

    .stats {
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      padding: 16px;
    }

    .footer-content {
      flex-direction: column;
      text-align: center;
    }

    .update-info {
      text-align: center;
    }
  }
</style>
