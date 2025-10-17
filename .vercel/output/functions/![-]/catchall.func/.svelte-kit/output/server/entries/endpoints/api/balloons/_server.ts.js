import { json } from "@sveltejs/kit";
const BASE_URL = "https://a.windbornesystems.com/treasure";
async function fetchWithTimeout(url, timeoutMs = 8e3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}
async function GET({ url }) {
  const hour = url.searchParams.get("hour");
  if (hour === null) {
    return json({ error: "Missing hour parameter" }, { status: 400 });
  }
  const hourStr = hour.toString().padStart(2, "0");
  const fetchUrl = `${BASE_URL}/${hourStr}.json`;
  console.log(`[Balloons] Fetching ${hourStr}.json from ${fetchUrl}`);
  try {
    const response = await fetchWithTimeout(fetchUrl, 8e3);
    if (!response.ok) {
      console.warn(
        `[Balloons] API returned ${response.status} for hour ${hourStr}`
      );
      return json(
        { error: `API returned ${response.status} for hour ${hourStr}` },
        { status: response.status }
      );
    }
    const data = await response.json();
    console.log(
      `[Balloons] Successfully fetched ${hourStr}.json with ${Array.isArray(data) ? data.length : 0} entries`
    );
    return json(data);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Balloons] Error fetching ${hourStr}.json:`, errorMsg);
    return json({ error: `Failed to fetch: ${errorMsg}` }, { status: 500 });
  }
}
export {
  GET
};
