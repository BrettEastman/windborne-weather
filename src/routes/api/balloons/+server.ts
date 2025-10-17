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
    const response = await fetch(fetchUrl);

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
    return json({ error: `Failed to fetch: ${errorMsg}` }, { status: 500 });
  }
}
