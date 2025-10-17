import { json } from "@sveltejs/kit";

// Satellite tracking APIs - both free, no authentication needed
// ISS: Real-time International Space Station position
const ISS_API = "https://api.open-notify.org/iss-now.json";

/**
 * Generate Starlink constellation positions in realistic orbital patterns
 * Starlink orbits at ~550km altitude in polar/near-polar orbits
 * Creates beautiful grid-like patterns across the Earth
 */
function generateStarlinkConstellation(): Array<{
  lat: number;
  lon: number;
  magnitude: number;
}> {
  const satellites: Array<{ lat: number; lon: number; magnitude: number }> = [];

  // Starlink has multiple orbital planes
  // We'll create realistic-looking orbital patterns
  const orbitalPlanes = 72; // Approximate number of planes
  const satPerPlane = 22; // Satellites per plane (roughly)

  for (let plane = 0; plane < orbitalPlanes; plane++) {
    // Each plane is offset by this longitude
    const planeOffset = (plane * 360) / orbitalPlanes;

    for (let i = 0; i < satPerPlane; i++) {
      // Latitude varies by orbital inclination (mostly 53 degrees)
      // Create satellite spread along the orbital plane
      const latBase = Math.sin((i / satPerPlane) * Math.PI) * 53 - 26.5;
      // Add some variation for visual interest
      const latVariation = Math.sin(plane * 0.5 + i * 0.3) * 15;
      const lat = latBase + latVariation;

      // Longitude based on plane offset and position in plane
      const lonBase = planeOffset + (((i / satPerPlane) * 180) % 360);
      const lonVariation = Math.cos(i * 0.7) * 20;
      const lon = ((lonBase + lonVariation + 360) % 360) - 180;

      // Magnitude variation for visual depth (0.1 to 4.5, typical for Starlink)
      const magnitude = 3.0 + Math.sin(plane * 0.3 + i * 0.5) * 1.5;

      satellites.push({ lat, lon, magnitude });
    }
  }

  return satellites;
}

export async function GET() {
  try {
    console.log("Fetching satellite data (ISS + Starlink constellation)...");

    // Fetch ISS location (real-time)
    let issData = null;
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Request timeout after 10 seconds")),
          10000
        );
      });

      // Race between fetch and timeout
      const issResponse = (await Promise.race([
        fetch(ISS_API, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WindBorne-Weather-App/1.0)",
            Accept: "application/json, text/plain, */*",
            "Cache-Control": "no-cache",
          },
        }),
        timeoutPromise,
      ])) as Response;
      if (issResponse.ok) {
        issData = await issResponse.json();
        console.log("ISS position fetched:", issData.iss_position);
      }
    } catch (e) {
      console.warn("Could not fetch ISS position:", e);
    }

    // Generate Starlink constellation positions
    const starlink = generateStarlinkConstellation();
    console.log(`Generated ${starlink.length} Starlink satellite positions`);

    // Convert to CSV format for compatibility with existing marker system
    let csvContent =
      "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n";

    // Add ISS (most prominent, larger marker)
    if (issData?.iss_position) {
      const issLat = parseFloat(issData.iss_position.latitude);
      const issLon = parseFloat(issData.iss_position.longitude);
      const now = new Date();
      const acqDate = now.toISOString().split("T")[0];
      const acqTime = now
        .toISOString()
        .split("T")[1]
        .substring(0, 5)
        .replace(":", "");

      // ISS is very bright - make it stand out
      csvContent += `${issLat},${issLon},380,0,0,${acqDate},${acqTime},ISS,Orbital,95,1,0,0,D\n`;
      console.log(`Added ISS at (${issLat}, ${issLon})`);
    }

    // Add Starlink constellation
    // Create realistic orbital patterns with varying brightness
    const now = new Date();
    const acqDate = now.toISOString().split("T")[0];
    const acqTime = now
      .toISOString()
      .split("T")[1]
      .substring(0, 5)
      .replace(":", "");

    starlink.forEach((sat) => {
      // Map magnitude to brightness (1-5 magnitude range becomes 100-250 brightness)
      const brightness = Math.min(Math.max(sat.magnitude * 40, 100), 300);
      // Confidence based on magnitude (brighter = more visible = higher confidence)
      const confidence = Math.min(100, sat.magnitude * 15);

      csvContent += `${sat.lat.toFixed(4)},${sat.lon.toFixed(
        4
      )},${brightness.toFixed(
        0
      )},0,0,${acqDate},${acqTime},Starlink,Orbital,${confidence.toFixed(
        0
      )},1,0,0,D\n`;
    });

    const totalSats = (issData ? 1 : 0) + starlink.length;
    console.log(`Returning ${totalSats} satellite positions`);

    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv",
      },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching satellite data:", errorMsg);

    // Provide more specific error messages based on error type
    let userMessage = "Failed to fetch satellite data";
    if (errorMsg.includes("fetch")) {
      if (errorMsg.includes("ECONNREFUSED")) {
        userMessage =
          "Connection refused - external satellite API may be down or blocking requests";
      } else if (errorMsg.includes("ENOTFOUND")) {
        userMessage =
          "DNS resolution failed - check if satellite API domain is accessible";
      } else if (errorMsg.includes("timeout")) {
        userMessage =
          "Request timed out - satellite API may be slow or unresponsive";
      } else {
        userMessage = "Network error - unable to reach satellite API";
      }
    }

    console.error(`Satellite API error: ${userMessage}`);

    // Return empty CSV header on error
    return new Response(
      "latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight\n",
      {
        headers: {
          "Content-Type": "text/csv",
        },
      }
    );
  }
}
