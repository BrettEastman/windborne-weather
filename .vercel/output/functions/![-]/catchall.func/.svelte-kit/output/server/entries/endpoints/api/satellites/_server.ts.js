import "@sveltejs/kit";
const ISS_API = "http://api.open-notify.org/iss-now.json";
async function fetchWithTimeout(url, timeoutMs = 5e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await globalThis.fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
function generateStarlinkConstellation() {
  const satellites = [];
  const orbitalPlanes = 72;
  const satPerPlane = 22;
  for (let plane = 0; plane < orbitalPlanes; plane++) {
    const planeOffset = plane * 360 / orbitalPlanes;
    for (let i = 0; i < satPerPlane; i++) {
      const latBase = Math.sin(i / satPerPlane * Math.PI) * 53 - 26.5;
      const latVariation = Math.sin(plane * 0.5 + i * 0.3) * 15;
      const lat = latBase + latVariation;
      const lonBase = planeOffset + i / satPerPlane * 180 % 360;
      const lonVariation = Math.cos(i * 0.7) * 20;
      const lon = (lonBase + lonVariation + 360) % 360 - 180;
      const magnitude = 3 + Math.sin(plane * 0.3 + i * 0.5) * 1.5;
      satellites.push({ lat, lon, magnitude });
    }
  }
  return satellites;
}
async function GET() {
  try {
    console.log(
      "[Satellites] Fetching satellite data (ISS + Starlink constellation)..."
    );
    let issData = null;
    try {
      console.log(
        "[Satellites] Attempting to fetch ISS position from",
        ISS_API
      );
      const issResponse = await fetchWithTimeout(ISS_API, 5e3);
      if (issResponse.ok) {
        issData = await issResponse.json();
        console.log("[Satellites] ISS position fetched:", issData.iss_position);
      } else {
        console.warn(
          "[Satellites] ISS API returned status:",
          issResponse.status
        );
      }
    } catch (e) {
      console.warn(
        "[Satellites] Could not fetch ISS position:",
        e instanceof Error ? e.message : String(e)
      );
    }
    const starlink = generateStarlinkConstellation();
    console.log(
      `[Satellites] Generated ${starlink.length} Starlink satellite positions`
    );
    let csvContent = "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n";
    if (issData?.iss_position) {
      const issLat = parseFloat(issData.iss_position.latitude);
      const issLon = parseFloat(issData.iss_position.longitude);
      const now2 = /* @__PURE__ */ new Date();
      const acqDate2 = now2.toISOString().split("T")[0];
      const acqTime2 = now2.toISOString().split("T")[1].substring(0, 5).replace(":", "");
      csvContent += `${issLat},${issLon},380,0,0,${acqDate2},${acqTime2},ISS,Orbital,95,1,0,0,D
`;
      console.log(`[Satellites] Added ISS at (${issLat}, ${issLon})`);
    }
    const now = /* @__PURE__ */ new Date();
    const acqDate = now.toISOString().split("T")[0];
    const acqTime = now.toISOString().split("T")[1].substring(0, 5).replace(":", "");
    starlink.forEach((sat) => {
      const brightness = Math.min(Math.max(sat.magnitude * 40, 100), 300);
      const confidence = Math.min(100, sat.magnitude * 15);
      csvContent += `${sat.lat.toFixed(4)},${sat.lon.toFixed(
        4
      )},${brightness.toFixed(
        0
      )},0,0,${acqDate},${acqTime},Starlink,Orbital,${confidence.toFixed(
        0
      )},1,0,0,D
`;
    });
    const totalSats = (issData ? 1 : 0) + starlink.length;
    console.log(`[Satellites] Returning ${totalSats} satellite positions`);
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv"
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Satellites] Error in GET handler:", errorMsg);
    return new Response(
      "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n",
      {
        headers: {
          "Content-Type": "text/csv"
        }
      }
    );
  }
}
export {
  GET
};
