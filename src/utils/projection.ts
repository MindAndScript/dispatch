import { BoundingBox, ClusterNode, Coordinate, Employee, OfficeLocation, ProjectionContext } from '../types/dispatch';

const DEG_TO_RAD = Math.PI / 180;

/**
 * Calculates geographic distance in kilometers using the Haversine formula
 */
export function haversineDistance(c1: Coordinate, c2: Coordinate): number {
  const R = 6371; // Earth's radius in km
  const dLat = (c2.lat - c1.lat) * DEG_TO_RAD;
  const dLng = (c2.lng - c1.lng) * DEG_TO_RAD;
  const lat1 = c1.lat * DEG_TO_RAD;
  const lat2 = c2.lat * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate dynamic bounding box containing all points with configurable padding
 */
export function calculateBoundingBox(points: Coordinate[], paddingRatio = 0.08): BoundingBox {
  if (points.length === 0) {
    return {
      minLat: 17.2,
      maxLat: 17.6,
      minLng: 78.2,
      maxLng: 78.6,
      centerLat: 17.4,
      centerLng: 78.4,
      spanLat: 0.4,
      spanLng: 0.4,
    };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const pt of points) {
    if (pt.lat < minLat) minLat = pt.lat;
    if (pt.lat > maxLat) maxLat = pt.lat;
    if (pt.lng < minLng) minLng = pt.lng;
    if (pt.lng > maxLng) maxLng = pt.lng;
  }

  const rawSpanLat = Math.max(maxLat - minLat, 0.01);
  const rawSpanLng = Math.max(maxLng - minLng, 0.01);

  const padLat = rawSpanLat * paddingRatio;
  const padLng = rawSpanLng * paddingRatio;

  const paddedMinLat = minLat - padLat;
  const paddedMaxLat = maxLat + padLat;
  const paddedMinLng = minLng - padLng;
  const paddedMaxLng = maxLng + padLng;

  return {
    minLat: paddedMinLat,
    maxLat: paddedMaxLat,
    minLng: paddedMinLng,
    maxLng: paddedMaxLng,
    centerLat: (paddedMinLat + paddedMaxLat) / 2,
    centerLng: (paddedMinLng + paddedMaxLng) / 2,
    spanLat: paddedMaxLat - paddedMinLat,
    spanLng: paddedMaxLng - paddedMinLng,
  };
}

/**
 * Creates projection from geographical Lat/Lng to Canvas Screen coordinates
 * Preserves geographical aspect ratio using latitude correction factor cos(midLat).
 */
export function createProjection(
  bbox: BoundingBox,
  width: number,
  height: number,
  margin = 40
): ProjectionContext {
  const usableWidth = Math.max(width - margin * 2, 50);
  const usableHeight = Math.max(height - margin * 2, 50);

  const cosLat = Math.cos(bbox.centerLat * DEG_TO_RAD);

  // Projected width and height in geographical aspect ratio
  const geoWidth = bbox.spanLng * cosLat;
  const geoHeight = bbox.spanLat;

  // Compute uniform scale to fit into usable canvas area
  const scaleX = usableWidth / geoWidth;
  const scaleY = usableHeight / geoHeight;
  const scale = Math.min(scaleX, scaleY);

  // Center the map in the canvas
  const projectedWidth = geoWidth * scale;
  const projectedHeight = geoHeight * scale;

  const offsetX = margin + (usableWidth - projectedWidth) / 2;
  const offsetY = margin + (usableHeight - projectedHeight) / 2;

  const toScreen = (lat: number, lng: number) => {
    const normX = (lng - bbox.minLng) * cosLat;
    const x = offsetX + normX * scale;

    const normY = bbox.maxLat - lat;
    const y = offsetY + normY * scale;

    return { x, y };
  };

  const toLatLng = (x: number, y: number) => {
    const normX = (x - offsetX) / scale;
    const lng = bbox.minLng + normX / cosLat;

    const normY = (y - offsetY) / scale;
    const lat = bbox.maxLat - normY;

    return { lat, lng };
  };

  return {
    bbox,
    width,
    height,
    padding: margin,
    scale,
    offsetX,
    offsetY,
    toScreen,
    toLatLng,
  };
}

function getNiceStep(span: number, targetCount: number): number {
  const rawStep = span / targetCount;
  const power = Math.floor(Math.log10(rawStep));
  const fraction = rawStep / Math.pow(10, power);

  let niceFraction: number;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * Math.pow(10, power);
}

export interface GridLinesResult {
  lats: { lat: number; y: number; label: string }[];
  lngs: { lng: number; x: number; label: string }[];
}

export function calculateGridLines(
  proj: ProjectionContext,
  density: 'sparse' | 'normal' | 'dense' = 'normal'
): GridLinesResult {
  const countMultiplier = density === 'sparse' ? 4 : density === 'dense' ? 12 : 7;

  const latStep = getNiceStep(proj.bbox.spanLat, countMultiplier);
  const lngStep = getNiceStep(proj.bbox.spanLng, countMultiplier);

  const lats: GridLinesResult['lats'] = [];
  const lngs: GridLinesResult['lngs'] = [];

  const firstLat = Math.ceil(proj.bbox.minLat / latStep) * latStep;
  for (let lat = firstLat; lat <= proj.bbox.maxLat; lat += latStep) {
    const { y } = proj.toScreen(lat, proj.bbox.centerLng);
    lats.push({
      lat,
      y,
      label: `${lat.toFixed(3)}°N`,
    });
  }

  const firstLng = Math.ceil(proj.bbox.minLng / lngStep) * lngStep;
  for (let lng = firstLng; lng <= proj.bbox.maxLng; lng += lngStep) {
    const { x } = proj.toScreen(proj.bbox.centerLat, lng);
    lngs.push({
      lng,
      x,
      label: `${lng.toFixed(3)}°E`,
    });
  }

  return { lats, lngs };
}

export function groupIntoClusters(
  employees: Employee[],
  office: OfficeLocation,
  toScreen: (lat: number, lng: number) => { x: number; y: number },
  thresholdPx = 10
): ClusterNode[] {
  const officeScreen = toScreen(office.lat, office.lng);
  const officeNode: ClusterNode = {
    id: 'OFFICE_NODE',
    lat: office.lat,
    lng: office.lng,
    screenX: officeScreen.x,
    screenY: officeScreen.y,
    employees: [],
    isOffice: true,
    officeDetails: office,
    totalCount: 0,
    femaleCount: 0,
    maleCount: 0,
  };

  const clusters: ClusterNode[] = [officeNode];

  for (const emp of employees) {
    const pt = toScreen(emp.lat, emp.lng);

    let matchedCluster: ClusterNode | null = null;
    for (let i = 1; i < clusters.length; i++) {
      const c = clusters[i];
      const dx = c.screenX - pt.x;
      const dy = c.screenY - pt.y;
      if (Math.hypot(dx, dy) <= thresholdPx) {
        matchedCluster = c;
        break;
      }
    }

    if (matchedCluster) {
      matchedCluster.employees.push(emp);
      matchedCluster.totalCount += 1;
      if (emp.gender === 'female') matchedCluster.femaleCount += 1;
      else matchedCluster.maleCount += 1;
    } else {
      clusters.push({
        id: `CLUSTER_${emp.id}`,
        lat: emp.lat,
        lng: emp.lng,
        screenX: pt.x,
        screenY: pt.y,
        employees: [emp],
        isOffice: false,
        totalCount: 1,
        femaleCount: emp.gender === 'female' ? 1 : 0,
        maleCount: emp.gender === 'female' ? 0 : 1,
      });
    }
  }

  return clusters;
}
