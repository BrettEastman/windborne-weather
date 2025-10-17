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
    // Add a small delay to avoid rate limiting (different delay per hour to spread requests)
    const delay = parseInt(hourStr) * 100; // 0-2300ms delay based on hour
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry logic for failed requests
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              Accept: "application/json, text/plain, */*",
              "Accept-Language": "en-US,en;q=0.9",
              "Accept-Encoding": "gzip, deflate, br",
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
              Referer: "https://windbornesystems.com/",
              "Sec-Fetch-Dest": "empty",
              "Sec-Fetch-Mode": "cors",
              "Sec-Fetch-Site": "cross-site",
              "Sec-Ch-Ua":
                '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              "Sec-Ch-Ua-Mobile": "?0",
              "Sec-Ch-Ua-Platform": '"Windows"',
            },
          }),
          timeoutPromise,
        ])) as Response;

        if (response.ok) {
          const data = await response.json();
          return json(data);
        } else if (response.status === 429) {
          // Rate limited - wait longer before retry
          console.warn(
            `Rate limited for hour ${hourStr}, attempt ${attempt}/${maxRetries}`
          );
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
            continue;
          }
        } else if (response.status >= 500) {
          // Server error - retry with backoff
          console.warn(
            `Server error for hour ${hourStr} (${response.status}), attempt ${attempt}/${maxRetries}`
          );
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }

        // Non-retryable error
        console.warn(
          `API returned ${response.status} for hour ${hourStr} at ${fetchUrl}`
        );
        return json(
          { error: `API returned ${response.status} for hour ${hourStr}` },
          { status: response.status }
        );
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(
          `Attempt ${attempt}/${maxRetries} failed for hour ${hourStr}:`,
          lastError.message
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
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
