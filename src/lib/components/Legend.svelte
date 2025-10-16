<div class="legend">
  <h3>Map Legend</h3>

  <div class="legend-section">
    <h4>Weather Balloons</h4>
    <div class="legend-item">
      <div class="marker balloon-marker bright"></div>
      <span>Recent balloon positions (brighter = newer)</span>
    </div>
    <div class="legend-item">
      <div class="marker balloon-marker faded"></div>
      <span>Older positions (up to 23 hours ago)</span>
    </div>
  </div>

  <div class="legend-section">
    <h4>Orbital Satellites</h4>
    <div class="legend-item">
      <div class="marker satellite-marker iss"></div>
      <span>ISS - International Space Station (real-time)</span>
    </div>
    <div class="legend-item">
      <div class="marker satellite-marker starlink"></div>
      <span>Starlink constellation (1,500+ satellites)</span>
    </div>
  </div>

  <div class="legend-info">
    <p>
      <strong>Why this matters:</strong> WindBorne's atmospheric monitoring network
      complements orbital infrastructure to create a comprehensive picture of Earth's
      systems - both atmospheric data from balloons and connectivity/positioning
      from the satellite network.
    </p>
  </div>
</div>

<style>
  .legend {
    position: absolute;
    bottom: 30px;
    right: 20px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    max-width: 280px;
    z-index: 1000;
    font-size: 14px;
  }

  .legend h3 {
    margin: 0 0 12px 0;
    font-size: 16px;
    font-weight: 600;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 8px;
  }

  .legend h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
  }

  .legend-section {
    margin-bottom: 16px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }

  .marker {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid;
    flex-shrink: 0;
  }

  .balloon-marker.bright {
    background-color: #3b82f6;
    border-color: #1e40af;
    opacity: 1;
  }

  .balloon-marker.faded {
    background-color: #3b82f6;
    border-color: #1e40af;
    opacity: 0.3;
  }

  .satellite-marker.iss {
    background-color: #dc2626;
    border-color: #7f1d1d;
    width: 14px;
    height: 14px;
    box-shadow: 0 0 4px rgba(220, 38, 38, 0.6);
  }

  .satellite-marker.starlink {
    background-color: #f87171;
    border-color: #7f1d1d;
    opacity: 0.8;
  }

  .legend-info {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e5e7eb;
  }

  .legend-info p {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: #4b5563;
  }

  @media (max-width: 768px) {
    .legend {
      position: relative;
      bottom: auto;
      right: auto;
      max-width: 100%;
      margin: 16px;
    }
  }
</style>
