// Balloon data types
export type BalloonPoint = [number, number, number]; // [lat, lon, altitude]

export interface BalloonDataset {
	hour: number; // 0-23, where 0 is current hour
	points: BalloonPoint[];
	timestamp: Date;
	errorCount: number; // Number of invalid entries filtered out
}

// Wildfire data types
export interface WildfirePoint {
	latitude: number;
	longitude: number;
	brightness: number;
	confidence: number;
	acq_date: string;
	acq_time: string;
}

// Fetch status types
export interface FetchStatus {
	loading: boolean;
	error: string | null;
	lastUpdated: Date | null;
}
