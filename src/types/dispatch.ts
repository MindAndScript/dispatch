export interface Coordinate {
  lat: number;
  lng: number;
}

export type Gender = 'female' | 'male' | 'other';

export type BoardingStatus = 'awaiting_cab' | 'arrived' | 'boarded' | 'dropped';

export interface DriverDetails {
  name: string;
  phone: string;
  rating?: number;
}

export interface SecurityGuard {
  name: string;
  phone: string;
  agency: string;
  badgeNumber: string;
  verified: boolean;
}

export interface CabTelemetry {
  lat: number;
  lng: number;
  headingDeg?: number;
  lastUpdated?: string;
}

export interface RouteMetrics {
  coveredKm: number;
  remainingKm: number;
  totalEstimatedKm: number;
  etaMinutes?: number;
}

export interface NextStopDestination {
  employeeId: string;
  employeeName: string;
  type: 'pickup' | 'drop';
  etaMinutes: number;
  targetLat: number;
  targetLng: number;
}

export interface Employee {
  id: string;
  name: string;
  gender: Gender;
  lat: number;
  lng: number;
  clusterArea: string;
  shift?: 'login' | 'logout' | 'general';
  department?: string;
  address?: string;
  phone?: string;
  routeNumber?: string | null;
  pickupSequence?: number | null;
  boardingStatus: BoardingStatus;
  otpCode?: string;
}

export interface CabRoute {
  routeNumber: string;
  vehicleNumber: string;
  cabModel: string;
  driver: DriverDetails;
  guard?: SecurityGuard | null;
  currentStatus: 'scheduled' | 'en_route_pickup' | 'in_transit' | 'completed';
  currentLocation?: CabTelemetry;
  nextStop?: NextStopDestination;
  metrics: RouteMetrics;
  passengers: Employee[];
  hasSosActive?: boolean;
}

export interface SosAlert {
  incidentId: string;
  timestamp: string;
  employee: Employee;
  cab: CabRoute;
  location: {
    lat: number;
    lng: number;
    area: string;
  };
  status: 'active' | 'silenced' | 'acknowledged' | 'resolved';
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

export interface OfficeLocation {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  address: string;
}

export interface DispatchDataset {
  region: {
    state: string;
    city: string;
    description?: string;
  };
  office: OfficeLocation;
  employees: Employee[];
  cabs: CabRoute[];
}

export interface ClusterNode {
  id: string;
  lat: number;
  lng: number;
  screenX: number;
  screenY: number;
  employees: Employee[];
  isOffice?: boolean;
  officeDetails?: OfficeLocation;
  totalCount: number;
  femaleCount: number;
  maleCount: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
  spanLat: number;
  spanLng: number;
}

export interface ProjectionContext {
  bbox: BoundingBox;
  width: number;
  height: number;
  padding: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  toScreen: (lat: number, lng: number) => { x: number; y: number };
  toLatLng: (x: number, y: number) => { lat: number; lng: number };
}

export type WallMapTheme = 'dark-radar' | 'blueprint' | 'minimal-light';
