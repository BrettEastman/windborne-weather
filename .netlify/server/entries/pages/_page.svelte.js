import { W as head, X as ensure_array_like, Y as store_get, Z as attr, _ as unsubscribe_stores, $ as stringify } from "../../chunks/index2.js";
import { w as writable } from "../../chunks/index.js";
import { e as escape_html } from "../../chunks/context.js";
function isValidBalloonPoint(entry) {
  if (!Array.isArray(entry)) return false;
  if (entry.length !== 3) return false;
  const [lat, lon, altitude] = entry;
  if (typeof lat !== "number" || isNaN(lat)) return false;
  if (typeof lon !== "number" || isNaN(lon)) return false;
  if (typeof altitude !== "number" || isNaN(altitude)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lon < -180 || lon > 180) return false;
  if (altitude < 0 || altitude > 5e4) return false;
  return true;
}
function validateBalloonData(data) {
  let errorCount = 0;
  const validPoints = [];
  for (const entry of data) {
    if (isValidBalloonPoint(entry)) {
      validPoints.push(entry);
    } else {
      errorCount++;
    }
  }
  return { validPoints, errorCount };
}
const HOURS = 24;
function createBalloonStore() {
  const { subscribe, set, update } = writable({
    datasets: [],
    status: {
      loading: false,
      error: null,
      lastUpdated: null
    }
  });
  let pollingInterval = null;
  async function fetchHour(hour) {
    const hourStr = hour.toString().padStart(2, "0");
    const url = `/api/balloons?hour=${hour}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${hourStr}.json: ${response.status}`);
        return null;
      }
      const rawData = await response.json();
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
        timestamp: /* @__PURE__ */ new Date(),
        errorCount
      };
    } catch (error) {
      console.error(`Error fetching ${hourStr}.json:`, error);
      return null;
    }
  }
  async function fetchAll() {
    update((store) => ({
      ...store,
      status: { ...store.status, loading: true, error: null }
    }));
    try {
      const hours = Array.from({ length: HOURS }, (_, i) => i);
      const results = await Promise.all(hours.map((hour) => fetchHour(hour)));
      const successfulDatasets = results.filter(
        (dataset) => dataset !== null
      );
      update((store) => ({
        datasets: successfulDatasets,
        status: {
          loading: false,
          error: null,
          lastUpdated: /* @__PURE__ */ new Date()
        }
      }));
      console.log(
        `Successfully loaded ${successfulDatasets.length}/${HOURS} balloon datasets`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      update((store) => ({
        ...store,
        status: {
          loading: false,
          error: errorMessage,
          lastUpdated: null
        }
      }));
    }
  }
  function startPolling() {
    fetchAll();
    pollingInterval = window.setInterval(() => {
      fetchAll();
    }, 2 * 60 * 1e3);
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
    startPolling
  };
}
const balloonData = createBalloonStore();
function createSatelliteStore() {
  const { subscribe, update } = writable({
    satellites: [],
    status: {
      loading: false,
      error: null,
      lastUpdated: null
    }
  });
  let pollingInterval = null;
  function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",");
    const latIdx = headers.indexOf("latitude");
    const lonIdx = headers.indexOf("longitude");
    const brightIdx = headers.indexOf("brightness");
    const confIdx = headers.indexOf("confidence");
    const dateIdx = headers.indexOf("acq_date");
    const timeIdx = headers.indexOf("acq_time");
    const satIdx = headers.indexOf("satellite");
    if (latIdx === -1 || lonIdx === -1 || brightIdx === -1 || confIdx === -1 || dateIdx === -1 || timeIdx === -1) {
      console.error("Missing required columns in satellite CSV");
      return [];
    }
    const satellites = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      if (values.length < headers.length) continue;
      const lat = parseFloat(values[latIdx]);
      const lon = parseFloat(values[lonIdx]);
      const brightness = parseFloat(values[brightIdx]);
      const confidence = parseFloat(values[confIdx]);
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
        satellite: satIdx !== -1 ? values[satIdx] : void 0
      });
    }
    return satellites;
  }
  async function fetchSatellites() {
    update((store) => ({
      ...store,
      status: { ...store.status, loading: true, error: null }
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
          lastUpdated: /* @__PURE__ */ new Date()
        }
      }));
      console.log(`Successfully loaded ${satellites.length} satellite points`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error fetching satellite data:", error);
      update((store) => ({
        ...store,
        status: {
          loading: false,
          error: errorMessage,
          lastUpdated: null
        }
      }));
    }
  }
  function startPolling() {
    fetchSatellites();
    pollingInterval = window.setInterval(() => {
      fetchSatellites();
    }, 3 * 60 * 1e3);
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
    startPolling
  };
}
const satelliteData = createSatelliteStore();
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    function projectPoint(lat, lon, width, height) {
      const x = (lon + 180) / 360 * width;
      const y = (90 - lat) / 180 * height;
      return { x, y };
    }
    function getAnimationDelay(x, y) {
      const seed = Math.sin(x * 0.01) * Math.cos(y * 0.01);
      return (seed + 1) / 2 * 2;
    }
    function getRadiusFromAltitude(altitude) {
      const logAlt = Math.log(altitude + 1);
      const maxLog = Math.log(50001);
      const normalized = logAlt / maxLog;
      return 1 + normalized * 7;
    }
    function generateStarPath(cx, cy, r) {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const angle = i * Math.PI / 5;
        const radius = i % 2 === 0 ? r : r * 0.4;
        const x = cx + Math.cos(angle - Math.PI / 2) * radius;
        const y = cy + Math.sin(angle - Math.PI / 2) * radius;
        points.push(`${x},${y}`);
      }
      return `M${points.join(" L")} Z`;
    }
    head($$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>WindBorne Weather Balloon &amp; Satellite Live Imagery</title>`);
      });
      $$renderer3.push(`<meta name="description" content="Real-time artistic visualization of WindBorne's weather balloon constellation and orbital satellite network" class="svelte-1uha8ag"/>`);
    });
    $$renderer2.push(`<div class="fullscreen-container svelte-1uha8ag"><div class="map-wrapper svelte-1uha8ag"><svg class="map svelte-1uha8ag" viewBox="0 0 1000 600" preserveAspectRatio="none"><rect width="1000" height="600" fill="none" class="svelte-1uha8ag"></rect><!--[-->`);
    const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$balloonData", balloonData).datasets);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let dataset = each_array[$$index_1];
      $$renderer2.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(dataset.points);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let [lat, lon, alt] = each_array_1[$$index];
        const { x, y } = projectPoint(lat, lon, 1e3, 600);
        const delay = getAnimationDelay(x, y);
        $$renderer2.push(`<g class="svelte-1uha8ag"><animateTransform attributeName="transform" type="translate" values="0,0; 1.25,0.9375; -0.9375,1.25; 0.9375,-1.25; 0,0" dur="12s"${attr("begin", `${stringify(delay)}s`)} repeatCount="indefinite" calcMode="spline" keySplines="0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1" class="svelte-1uha8ag"></animateTransform><circle${attr("cx", x)}${attr("cy", y)}${attr("r", getRadiusFromAltitude(alt))} fill="#3b82f6"${attr("opacity", 1 - dataset.hour / 24)} class="data-point balloon-point svelte-1uha8ag" role="button" tabindex="0"></circle></g>`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--><!--[-->`);
    const each_array_2 = ensure_array_like(store_get($$store_subs ??= {}, "$satelliteData", satelliteData).satellites);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let sat = each_array_2[$$index_2];
      const { x, y } = projectPoint(sat.latitude, sat.longitude, 1e3, 600);
      const size = sat.brightness > 350 ? 8 : 4;
      const delay = getAnimationDelay(x, y);
      const isISS = sat.satellite === "ISS";
      $$renderer2.push(`<g class="svelte-1uha8ag"><animateTransform attributeName="transform" type="translate" values="0,0; 1,0.75; -0.75,1; 0.75,-1; 0,0" dur="12s"${attr("begin", `${stringify(delay)}s`)} repeatCount="indefinite" calcMode="spline" keySplines="0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1; 0.42,0 0.58,1" class="svelte-1uha8ag"></animateTransform>`);
      if (isISS) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<path${attr("d", generateStarPath(x, y, 8))} fill="#FFD700" opacity="1" class="data-point satellite-point iss-point svelte-1uha8ag" role="button" tabindex="0"></path>`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<circle${attr("cx", x)}${attr("cy", y)}${attr("r", size)} fill="#dc2626" opacity="0.9" class="data-point satellite-point svelte-1uha8ag" role="button" tabindex="0"></circle>`);
      }
      $$renderer2.push(`<!--]--></g>`);
    }
    $$renderer2.push(`<!--]--></svg></div> <div class="overlay-content svelte-1uha8ag"><h1 class="svelte-1uha8ag">WindBorne Weather Balloon &amp; Satellite Live Imagery</h1> <div class="stats svelte-1uha8ag"><div class="svelte-1uha8ag">Balloons: ${escape_html(store_get($$store_subs ??= {}, "$balloonData", balloonData).datasets.reduce((sum, ds) => sum + ds.points.length, 0))}</div> <div class="svelte-1uha8ag">Satellites: ${escape_html(store_get($$store_subs ??= {}, "$satelliteData", satelliteData).satellites.length)}</div></div></div> <div class="footer svelte-1uha8ag"><div class="footer-left svelte-1uha8ag"><div class="credits svelte-1uha8ag"><div class="svelte-1uha8ag"><strong class="svelte-1uha8ag">Data Sources:</strong></div> <div class="svelte-1uha8ag">Weather Balloons: <a href="https://windbornesystems.com" target="_blank" rel="noopener noreferrer" class="svelte-1uha8ag">WindBorne Systems</a></div> <div class="svelte-1uha8ag">ISS: <a href="http://open-notify.org/Open-Notify-API/ISS-Location-Now/" target="_blank" rel="noopener noreferrer" class="svelte-1uha8ag">Open-Notify API</a></div> <div class="svelte-1uha8ag">Starlink Constellation: Generated orbital patterns</div></div></div> <div class="github-link svelte-1uha8ag"><a href="https://github.com/BrettEastman/windborne-weather" target="_blank" rel="noopener noreferrer" class="svelte-1uha8ag"><span class="svelte-1uha8ag">GitHub</span></a></div></div></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
