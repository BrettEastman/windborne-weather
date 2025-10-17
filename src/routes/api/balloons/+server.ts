import { json } from "@sveltejs/kit";

const BASE_URL = "https://a.windbornesystems.com/treasure";

export async function GET({ url }) {
  const hour = url.searchParams.get("hour");

  if (hour === null) {
    return json({ error: "Missing hour parameter" }, { status: 400 });
  }

  const hourStr = hour.toString().padStart(2, "0");
  const fetchUrl = `${BASE_URL}/${hourStr}.json`;

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Request timeout after 10 seconds")),
        10000
      );
    });

    // Race between fetch and timeout
    const response = (await Promise.race([
      fetch(fetchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; WindBorne-Weather-App/1.0)",
          Accept: "application/json, text/plain, */*",
          "Cache-Control": "no-cache",
        },
      }),
      timeoutPromise,
    ])) as Response;

    if (!response.ok) {
      console.warn(
        `API returned ${response.status} for hour ${hourStr} at ${fetchUrl}`
      );
      return json(
        { error: `API returned ${response.status} for hour ${hourStr}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`Error fetching balloon data for hour ${hourStr}:`, errorMsg);

    // Provide more specific error messages based on error type
    let statusCode = 500;
    let userMessage = `Failed to fetch: ${errorMsg}`;

    if (errorMsg.includes("fetch")) {
      if (errorMsg.includes("ECONNREFUSED")) {
        userMessage =
          "Connection refused - external API may be down or blocking requests";
      } else if (errorMsg.includes("ENOTFOUND")) {
        userMessage =
          "DNS resolution failed - check if the API domain is accessible";
      } else if (errorMsg.includes("timeout")) {
        userMessage =
          "Request timed out - external API may be slow or unresponsive";
      } else {
        userMessage = "Network error - unable to reach external API";
      }
    }

    return json({ error: userMessage }, { status: statusCode });
  }
}
