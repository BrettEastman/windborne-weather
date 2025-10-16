// Balloon data types
export type BalloonPoint = [number, number, number]; // [lat, lon, altitude]

export interface BalloonDataset {
  hour: number; // 0-23, where 0 is current hour
  points: BalloonPoint[];
  timestamp: Date;
  errorCount: number; // Number of invalid entries filtered out
}

// Satellite data types
export interface SatellitePoint {
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

export interface BalloonStore {
  datasets: BalloonDataset[];
  status: FetchStatus;
}

export interface SatelliteStore {
  satellites: SatellitePoint[];
  status: FetchStatus;
}
