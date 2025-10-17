export type BalloonPoint = [number, number, number]; // [lat, lon, altitude]

export interface BalloonDataset {
  hour: number;
  points: BalloonPoint[];
  timestamp: Date;
  errorCount: number; // Number of invalid entries filtered out
}

export interface SatellitePoint {
  latitude: number;
  longitude: number;
  brightness: number;
  confidence: number;
  acq_date: string;
  acq_time: string;
  satellite?: string; // "ISS", "Starlink", etc.
}

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
