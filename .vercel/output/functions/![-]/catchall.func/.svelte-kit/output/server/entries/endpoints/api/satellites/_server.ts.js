import "@sveltejs/kit";
const ISS_API = "https://api.open-notify.org/iss-now.json";
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
    console.log("Fetching satellite data (ISS + Starlink constellation)...");
    let issData = null;
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout after 10 seconds")), 1e4);
      });
      const issResponse = await Promise.race([
        fetch(ISS_API, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WindBorne-Weather-App/1.0)",
            "Accept": "application/json, text/plain, */*",
            "Cache-Control": "no-cache"
          }
        }),
        timeoutPromise
      ]);
      if (issResponse.ok) {
        issData = await issResponse.json();
        console.log("ISS position fetched:", issData.iss_position);
      }
    } catch (e) {
      console.warn("Could not fetch ISS position:", e);
    }
    const starlink = generateStarlinkConstellation();
    console.log(`Generated ${starlink.length} Starlink satellite positions`);
    let csvContent = "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n";
    if (issData?.iss_position) {
      const issLat = parseFloat(issData.iss_position.latitude);
      const issLon = parseFloat(issData.iss_position.longitude);
      const now2 = /* @__PURE__ */ new Date();
      const acqDate2 = now2.toISOString().split("T")[0];
      const acqTime2 = now2.toISOString().split("T")[1].substring(0, 5).replace(":", "");
      csvContent += `${issLat},${issLon},380,0,0,${acqDate2},${acqTime2},ISS,Orbital,95,1,0,0,D
`;
      console.log(`Added ISS at (${issLat}, ${issLon})`);
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
    console.log(`Returning ${totalSats} satellite positions`);
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv"
      }
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching satellite data:", errorMsg);
    let userMessage = "Failed to fetch satellite data";
    if (errorMsg.includes("fetch")) {
      if (errorMsg.includes("ECONNREFUSED")) {
        userMessage = "Connection refused - external satellite API may be down or blocking requests";
      } else if (errorMsg.includes("ENOTFOUND")) {
        userMessage = "DNS resolution failed - check if satellite API domain is accessible";
      } else if (errorMsg.includes("timeout")) {
        userMessage = "Request timed out - satellite API may be slow or unresponsive";
      } else {
        userMessage = "Network error - unable to reach satellite API";
      }
    }
    console.error(`Satellite API error: ${userMessage}`);
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
