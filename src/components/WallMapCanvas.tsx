'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BoundingBox,
  CabRoute,
  ClusterNode,
  Coordinate,
  DispatchDataset,
  Employee,
  ProjectionContext,
  SosAlert,
  WallMapTheme,
} from '../types/dispatch';
import { DispatchType } from '../types/config';
import {
  calculateBoundingBox,
  calculateGridLines,
  createProjection,
  groupIntoClusters,
} from '../utils/projection';
import { evaluateCabSecurity } from '../utils/security';
import {
  Building2,
  Users,
  Car,
  Navigation,
  Radio,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface WallMapCanvasProps {
  dataset: DispatchDataset;
  theme: WallMapTheme;
  gridDensity: 'sparse' | 'normal' | 'dense';
  filterGender: 'all' | 'female' | 'male';
  filterRoute: string;
  dispatchType: DispatchType;
  highlightOverlapsOnly: boolean;
  searchQuery: string;
  selectedCluster: ClusterNode | null;
  activeSosAlert?: SosAlert | null;
  onSelectCluster: (cluster: ClusterNode | null) => void;
  onSelectRoute?: (routeNumber: string) => void;
  onHoverCluster?: (cluster: ClusterNode | null) => void;
  onOpenRouteDetails?: (routeNumber: string) => void;
  onOpenSosModal?: () => void;
  onClearSearch?: () => void;
}

export const WallMapCanvas: React.FC<WallMapCanvasProps> = ({
  dataset,
  theme,
  gridDensity,
  filterGender,
  filterRoute,
  dispatchType,
  highlightOverlapsOnly,
  searchQuery,
  selectedCluster,
  activeSosAlert,
  onSelectCluster,
  onSelectRoute,
  onHoverCluster,
  onOpenRouteDetails,
  onOpenSosModal,
  onClearSearch,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredCluster, setHoveredCluster] = useState<ClusterNode | null>(null);
  const [hoveredCab, setHoveredCab] = useState<CabRoute | null>(null);
  const [blossomedClusterId, setBlossomedClusterId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1000, height: 700 });
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Pulse animation frame for radar effect
  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    let animId: number;
    const animate = () => {
      setPulsePhase((p) => (p + 0.05) % (Math.PI * 2));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  // Filter employees based on active filters or search
  // REQUIREMENT: When searching an employee name, clear the screen, only show that employee and its route
  const filteredEmployees = useMemo(() => {
    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      return dataset.employees.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q)
      );
    }

    let list = dataset.employees;

    if (filterGender !== 'all') {
      list = list.filter((e) => e.gender === filterGender);
    }

    if (filterRoute === 'unassigned') {
      list = list.filter((e) => !e.routeNumber);
    } else if (filterRoute !== 'all') {
      list = list.filter((e) => e.routeNumber === filterRoute);
    }

    return list;
  }, [dataset.employees, isSearching, searchQuery, filterGender, filterRoute]);

  // Set of route numbers belonging to searched employees
  const searchedRoutes = useMemo(() => {
    if (!isSearching) return null;
    const set = new Set<string>();
    filteredEmployees.forEach((e) => {
      if (e.routeNumber) set.add(e.routeNumber);
    });
    return set;
  }, [isSearching, filteredEmployees]);

  // Routes serving the currently clicked map cluster node
  const selectedClusterRoutes = useMemo(() => {
    if (!selectedCluster || selectedCluster.isOffice) return null;
    const set = new Set<string>();
    selectedCluster.employees.forEach((e) => {
      if (e.routeNumber) set.add(e.routeNumber);
    });
    return set;
  }, [selectedCluster]);

  // Compute bounding box covering office + all employees
  const bbox: BoundingBox = useMemo(() => {
    const points: Coordinate[] = [
      { lat: dataset.office.lat, lng: dataset.office.lng },
      ...dataset.employees.map((e) => ({ lat: e.lat, lng: e.lng })),
    ];
    return calculateBoundingBox(points, 0.14);
  }, [dataset.office, dataset.employees]);

  // Static Projection context
  const projection: ProjectionContext = useMemo(() => {
    return createProjection(bbox, dimensions.width, dimensions.height, 46);
  }, [bbox, dimensions]);

  // Group employees into cluster nodes (only contains searched employees when searching!)
  const clusters: ClusterNode[] = useMemo(() => {
    return groupIntoClusters(filteredEmployees, dataset.office, projection.toScreen, 12);
  }, [filteredEmployees, dataset.office, projection]);

  const blossomedNode = useMemo(() => {
    if (!blossomedClusterId) return null;
    return clusters.find((c) => c.id === blossomedClusterId) || null;
  }, [clusters, blossomedClusterId]);

  // Filter cabs based on: Search -> Clicked Map Node -> Selected Route
  const cabsToRender = useMemo(() => {
    // 1. Search employee query (highest priority)
    if (isSearching) {
      if (!searchedRoutes || searchedRoutes.size === 0) return [];
      return dataset.cabs.filter((c) => searchedRoutes.has(c.routeNumber));
    }

    // 2. Clicked node on map: auto filter routes accordingly!
    if (selectedClusterRoutes && selectedClusterRoutes.size > 0) {
      if (filterRoute !== 'all' && selectedClusterRoutes.has(filterRoute)) {
        return dataset.cabs.filter((c) => c.routeNumber === filterRoute);
      }
      return dataset.cabs.filter((c) => selectedClusterRoutes.has(c.routeNumber));
    }

    // 3. Explicit route filter
    return filterRoute === 'all'
      ? dataset.cabs
      : dataset.cabs.filter((c) => c.routeNumber === filterRoute);
  }, [isSearching, searchedRoutes, selectedClusterRoutes, filterRoute, dataset.cabs]);

  // Active highlighted route
  const activeHighlightedRoute = useMemo(() => {
    if (isSearching && searchedRoutes && searchedRoutes.size > 0) {
      return Array.from(searchedRoutes)[0];
    }
    if (filterRoute !== 'all' && filterRoute !== 'unassigned') {
      return filterRoute;
    }
    if (hoveredCab) {
      return hoveredCab.routeNumber;
    }
    if (selectedClusterRoutes && selectedClusterRoutes.size > 0) {
      return Array.from(selectedClusterRoutes)[0];
    }
    const current = selectedCluster || hoveredCluster;
    if (current && !current.isOffice) {
      const firstWithRoute = current.employees.find((e) => e.routeNumber);
      return firstWithRoute?.routeNumber || null;
    }
    return null;
  }, [isSearching, searchedRoutes, filterRoute, selectedClusterRoutes, selectedCluster, hoveredCluster, hoveredCab]);

  const activeCab = useMemo(() => {
    if (!activeHighlightedRoute) return null;
    return dataset.cabs.find((c) => c.routeNumber === activeHighlightedRoute) || null;
  }, [activeHighlightedRoute, dataset.cabs]);

  // Handle ResizeObserver
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions({ width: clientWidth, height: clientHeight });
        }
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Theme palettes
  const palette = useMemo(() => {
    switch (theme) {
      case 'blueprint':
        return {
          bg: '#0a1d33',
          gridLine: 'rgba(56, 189, 248, 0.16)',
          gridLineSub: 'rgba(56, 189, 248, 0.07)',
          gridText: '#38bdf8',
          officeColor: '#38bdf8',
          officeGlow: 'rgba(56, 189, 248, 0.35)',
          singleNode: '#67e8f9',
          multiNodeBg: '#0284c7',
          multiNodeRing: '#38bdf8',
          multiNodeText: '#ffffff',
          blossomFilament: 'rgba(125, 211, 252, 0.6)',
          crosshair: 'rgba(56, 189, 248, 0.4)',
          cornerBorder: '#38bdf8',
          routeLine: '#38bdf8',
          cabMarker: '#facc15',
        };
      case 'minimal-light':
        return {
          bg: '#f8fafc',
          gridLine: 'rgba(100, 116, 139, 0.22)',
          gridLineSub: 'rgba(100, 116, 139, 0.08)',
          gridText: '#475569',
          officeColor: '#0284c7',
          officeGlow: 'rgba(2, 132, 199, 0.25)',
          singleNode: '#0f172a',
          multiNodeBg: '#0284c7',
          multiNodeRing: '#0369a1',
          multiNodeText: '#ffffff',
          blossomFilament: 'rgba(15, 23, 42, 0.4)',
          crosshair: 'rgba(100, 116, 139, 0.35)',
          cornerBorder: '#94a3b8',
          routeLine: '#0284c7',
          cabMarker: '#d97706',
        };
      case 'dark-radar':
      default:
        return {
          bg: '#080d1a',
          gridLine: 'rgba(255, 255, 255, 0.12)',
          gridLineSub: 'rgba(255, 255, 255, 0.04)',
          gridText: '#94a3b8',
          officeColor: '#38bdf8',
          officeGlow: 'rgba(56, 189, 248, 0.4)',
          singleNode: '#e2e8f0',
          multiNodeBg: '#2563eb',
          multiNodeRing: '#60a5fa',
          multiNodeText: '#ffffff',
          blossomFilament: 'rgba(96, 165, 250, 0.65)',
          crosshair: 'rgba(255, 255, 255, 0.25)',
          cornerBorder: '#475569',
          routeLine: '#38bdf8',
          cabMarker: '#facc15',
        };
    }
  }, [theme]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const width = dimensions.width;
    const height = dimensions.height;

    // 1. Background
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    // 2. Sub-grid texture
    ctx.strokeStyle = palette.gridLineSub;
    ctx.lineWidth = 1;
    const subStep = 30;
    for (let x = 0; x < width; x += subStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += subStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Coordinate Grid Lines
    const gridLines = calculateGridLines(projection, gridDensity);
    ctx.font = '10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

    gridLines.lngs.forEach((lngItem) => {
      ctx.strokeStyle = palette.gridLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lngItem.x, 24);
      ctx.lineTo(lngItem.x, height - 24);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = palette.gridText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(lngItem.label, lngItem.x, 8);

      ctx.textBaseline = 'bottom';
      ctx.fillText(lngItem.label, lngItem.x, height - 8);
    });

    gridLines.lats.forEach((latItem) => {
      ctx.strokeStyle = palette.gridLine;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(35, latItem.y);
      ctx.lineTo(width - 35, latItem.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = palette.gridText;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(latItem.label, 8, latItem.y);

      ctx.textAlign = 'right';
      ctx.fillText(latItem.label, width - 8, latItem.y);
    });

    // Grid Crosshairs
    ctx.strokeStyle = palette.crosshair;
    ctx.lineWidth = 1;
    gridLines.lngs.forEach((lngItem) => {
      gridLines.lats.forEach((latItem) => {
        ctx.beginPath();
        ctx.moveTo(lngItem.x - 4, latItem.y);
        ctx.lineTo(lngItem.x + 4, latItem.y);
        ctx.moveTo(lngItem.x, latItem.y - 4);
        ctx.lineTo(lngItem.x + 4, latItem.y);
        ctx.stroke();
      });
    });

    // 4. Outer Border
    const margin = 26;
    ctx.strokeStyle = activeSosAlert ? '#ef4444' : palette.cornerBorder;
    ctx.lineWidth = activeSosAlert ? 2 : 1;
    ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

    const bracketSize = 14;
    ctx.beginPath();
    ctx.moveTo(margin, margin + bracketSize);
    ctx.lineTo(margin, margin);
    ctx.lineTo(margin + bracketSize, margin);

    ctx.moveTo(width - margin - bracketSize, margin);
    ctx.lineTo(width - margin, margin);
    ctx.lineTo(width - margin, margin + bracketSize);

    ctx.moveTo(margin, height - margin - bracketSize);
    ctx.lineTo(margin, height - margin);
    ctx.lineTo(margin + bracketSize, height - margin);

    ctx.moveTo(width - margin - bracketSize, height - margin);
    ctx.lineTo(width - margin, height - margin);
    ctx.lineTo(width - margin, height - margin - bracketSize);
    ctx.stroke();

    // 5. Route Trajectory Lines
    // When searching or when a cluster node is clicked, draw route lines for matching cabs; otherwise for activeCab
    const routesToDraw = isSearching || (selectedClusterRoutes && selectedClusterRoutes.size > 0)
      ? cabsToRender
      : activeCab
      ? [activeCab]
      : [];

    routesToDraw.forEach((cabToDraw) => {
      if (cabToDraw.passengers.length === 0) return;
      const officePt = projection.toScreen(dataset.office.lat, dataset.office.lng);
      const isSosCab = activeSosAlert?.cab.routeNumber === cabToDraw.routeNumber;

      ctx.save();
      ctx.strokeStyle = isSosCab ? '#ef4444' : dispatchType === 'drop' ? '#818cf8' : palette.routeLine;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      if (dispatchType === 'pickup') {
        const firstPt = projection.toScreen(cabToDraw.passengers[0].lat, cabToDraw.passengers[0].lng);
        ctx.moveTo(firstPt.x, firstPt.y);
        for (let i = 1; i < cabToDraw.passengers.length; i++) {
          const pt = projection.toScreen(cabToDraw.passengers[i].lat, cabToDraw.passengers[i].lng);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.lineTo(officePt.x, officePt.y);
      } else {
        ctx.moveTo(officePt.x, officePt.y);
        for (let i = 0; i < cabToDraw.passengers.length; i++) {
          const pt = projection.toScreen(cabToDraw.passengers[i].lat, cabToDraw.passengers[i].lng);
          ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw vector heading from live cab to next stop
      if (cabToDraw.currentLocation && cabToDraw.nextStop) {
        const cabPt = projection.toScreen(cabToDraw.currentLocation.lat, cabToDraw.currentLocation.lng);
        const targetPt = projection.toScreen(cabToDraw.nextStop.targetLat, cabToDraw.nextStop.targetLng);

        ctx.strokeStyle = isSosCab ? '#ef4444' : '#facc15';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cabPt.x, cabPt.y);
        ctx.lineTo(targetPt.x, targetPt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    // 6. Draw Employee Nodes / Clusters
    clusters.forEach((cluster) => {
      if (cluster.isOffice) return;

      const isHovered = hoveredCluster?.id === cluster.id;
      const isSelected = selectedCluster?.id === cluster.id;
      const isMulti = cluster.totalCount > 1;

      if (highlightOverlapsOnly && !isMulti) return;

      const { screenX: x, screenY: y } = cluster;
      const hasRoutePassenger =
        (selectedClusterRoutes && cluster.employees.some((e) => e.routeNumber && selectedClusterRoutes.has(e.routeNumber))) ||
        (activeHighlightedRoute && cluster.employees.some((e) => e.routeNumber === activeHighlightedRoute));

      const hasActiveFilter = (selectedClusterRoutes && selectedClusterRoutes.size > 0) || (filterRoute !== 'all');
      const isRelevant = isHovered || isSelected || hasRoutePassenger;

      ctx.save();
      // Dim unrelated nodes when a filter is active to make focused routes pop out
      if (hasActiveFilter && !isRelevant && !isSearching) {
        ctx.globalAlpha = 0.28;
      }

      if (isMulti) {
        const radius = Math.min(8 + Math.log2(cluster.totalCount) * 4, 18);

        if (isHovered || isSelected || hasRoutePassenger) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected ? '#60a5fa' : hasRoutePassenger ? '#38bdf8' : palette.officeGlow;
          ctx.lineWidth = isSelected ? 3.5 : 2.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#3b82f6' : palette.multiNodeBg;
        ctx.fill();

        ctx.strokeStyle = hasRoutePassenger ? '#38bdf8' : palette.multiNodeRing;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.stroke();

        ctx.fillStyle = palette.multiNodeText;
        ctx.font = `bold ${radius > 12 ? 10 : 9}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${cluster.totalCount}`, x, y);

        const hasBoarded = cluster.employees.some((e) => e.boardingStatus === 'boarded');
        if (hasBoarded) {
          ctx.beginPath();
          ctx.arc(x - radius * 0.7, y - radius * 0.7, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
        }

        if (cluster.femaleCount > 0) {
          ctx.beginPath();
          ctx.arc(x + radius * 0.7, y - radius * 0.7, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#ec4899';
          ctx.fill();
        }
      } else {
        const emp = cluster.employees[0];
        const isFemale = emp?.gender === 'female';
        const isBoarded = emp?.boardingStatus === 'boarded';
        const radius = isHovered || isSelected || hasRoutePassenger ? 6.5 : 3.8;

        if (isHovered || isSelected || hasRoutePassenger) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = isSelected
            ? '#60a5fa'
            : hasRoutePassenger
            ? '#38bdf8'
            : isFemale
            ? 'rgba(236, 72, 153, 0.6)'
            : palette.officeGlow;
          ctx.lineWidth = isSelected ? 3 : 2;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isBoarded ? '#10b981' : isFemale ? '#f472b6' : palette.singleNode;
        ctx.fill();

        ctx.strokeStyle = palette.bg;
        ctx.lineWidth = 1;
        ctx.stroke();

        // If searching and this is the matching employee, show name label above point
        if (isSearching) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.fillText(emp.name, x, y - 10);
        }
      }
      ctx.restore();
    });

    // 7. Radial Blossom Expansion for Multi-Tenant Clusters
    if (blossomedNode && !blossomedNode.isOffice && blossomedNode.totalCount > 1) {
      const { screenX: cx, screenY: cy, employees: petalEmps } = blossomedNode;
      const count = petalEmps.length;
      const blossomR = Math.max(28, count * 6.5);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, blossomR + 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 13, 26, 0.75)';
      ctx.fill();
      ctx.strokeStyle = palette.officeGlow;
      ctx.lineWidth = 1;
      ctx.stroke();

      petalEmps.forEach((emp, idx) => {
        const angle = (idx / count) * Math.PI * 2 - Math.PI / 2;
        const petX = cx + Math.cos(angle) * blossomR;
        const petY = cy + Math.sin(angle) * blossomR;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(petX, petY);
        ctx.strokeStyle = palette.blossomFilament;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        const isFemale = emp.gender === 'female';
        const isBoarded = emp.boardingStatus === 'boarded';
        ctx.beginPath();
        ctx.arc(petX, petY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = isBoarded ? '#10b981' : isFemale ? '#ec4899' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      ctx.restore();
    }

    // 8. Flight-Radar Live Cab Beacons (with Security & SOS Indicators)
    cabsToRender.forEach((cab) => {
      if (!cab.currentLocation) return;
      const pt = projection.toScreen(cab.currentLocation.lat, cab.currentLocation.lng);
      const isSelectedCab = activeHighlightedRoute === cab.routeNumber;

      const sec = evaluateCabSecurity(cab, dispatchType);
      const isSosCab = activeSosAlert?.cab.routeNumber === cab.routeNumber || cab.hasSosActive;

      // Pulse color
      const pulseColor = isSosCab
        ? '#ef4444'
        : sec.hasGuard
        ? '#10b981'
        : !sec.isCompliant
        ? '#f97316'
        : isSelectedCab
        ? '#facc15'
        : 'rgba(250, 204, 21, 0.45)';

      // Blinking / pulsing radar ring
      const pulseSize = isSosCab
        ? 18 + Math.sin(pulsePhase * 3) * 8
        : 10 + Math.sin(pulsePhase) * 4;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = pulseColor;
      ctx.lineWidth = isSosCab ? 2.5 : 1.5;
      ctx.stroke();

      // Heading directional chevron
      const sz = 6.5;
      ctx.save();
      ctx.translate(pt.x, pt.y);
      if (cab.currentLocation.headingDeg) {
        ctx.rotate((cab.currentLocation.headingDeg * Math.PI) / 180);
      }
      ctx.beginPath();
      ctx.moveTo(0, -sz * 1.3);
      ctx.lineTo(sz, sz * 0.9);
      ctx.lineTo(0, sz * 0.4);
      ctx.lineTo(-sz, sz * 0.9);
      ctx.closePath();
      ctx.fillStyle = isSosCab
        ? '#ef4444'
        : sec.hasGuard
        ? '#10b981'
        : !sec.isCompliant
        ? '#f97316'
        : '#facc15';
      ctx.fill();
      ctx.strokeStyle = '#080d1a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // Cab Beacon Label & Badges
      if (
        isSelectedCab ||
        cabsToRender.length <= 8 ||
        isSosCab ||
        sec.hasGuard ||
        !sec.isCompliant ||
        isSearching ||
        (selectedClusterRoutes && selectedClusterRoutes.size > 0)
      ) {
        ctx.fillStyle = isSosCab
          ? 'rgba(153, 27, 27, 0.95)'
          : 'rgba(8, 13, 26, 0.9)';
        ctx.strokeStyle = pulseColor;
        ctx.lineWidth = 1;

        let badgePrefix = '';
        if (isSosCab) badgePrefix = '🚨 SOS ';
        else if (sec.hasGuard) badgePrefix = '🛡️ ';
        else if (!sec.isCompliant) badgePrefix = '⚠️ ';

        const label = `${badgePrefix}${cab.routeNumber} (${cab.vehicleNumber.slice(-4)})`;
        ctx.font = 'bold 8px ui-monospace, monospace';
        const txtW = ctx.measureText(label).width;
        ctx.fillRect(pt.x + 8, pt.y - 7, txtW + 6, 14);
        ctx.strokeRect(pt.x + 8, pt.y - 7, txtW + 6, 14);

        ctx.fillStyle = isSosCab
          ? '#ffffff'
          : sec.hasGuard
          ? '#6ee7b7'
          : !sec.isCompliant
          ? '#fdba74'
          : '#facc15';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, pt.x + 11, pt.y);
      }
    });

    // 9. Destination or Source Office (Corporate HQ Depot)
    const officeCluster = clusters.find((c) => c.isOffice);
    if (officeCluster) {
      const ox = officeCluster.screenX;
      const oy = officeCluster.screenY;

      ctx.beginPath();
      ctx.arc(ox, oy, 26, 0, Math.PI * 2);
      ctx.strokeStyle = palette.officeGlow;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(ox, oy, 16, 0, Math.PI * 2);
      ctx.strokeStyle = palette.officeColor;
      ctx.lineWidth = 1;
      ctx.stroke();

      const size = 13;
      ctx.fillStyle = palette.officeColor;
      ctx.fillRect(ox - size / 2, oy - size / 2, size, size);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox - size / 2, oy - size / 2, size, size);

      ctx.strokeStyle = '#080d1a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox - 3, oy);
      ctx.lineTo(ox + 3, oy);
      ctx.moveTo(ox, oy - 3);
      ctx.lineTo(ox, oy + 3);
      ctx.stroke();

      const tagText =
        dispatchType === 'pickup'
          ? `DEST: ${dataset.office.code || 'HQ-HYD'}`
          : `ORIGIN: ${dataset.office.code || 'HQ-HYD'}`;

      ctx.font = 'bold 9px ui-monospace, monospace';
      const textWidth = ctx.measureText(tagText).width;

      const tagX = ox + 18;
      const tagY = oy - 8;

      ctx.fillStyle = 'rgba(8, 13, 26, 0.85)';
      ctx.fillRect(tagX - 4, tagY - 9, textWidth + 8, 16);
      ctx.strokeStyle = palette.officeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(tagX - 4, tagY - 9, textWidth + 8, 16);

      ctx.beginPath();
      ctx.moveTo(ox + size / 2, oy);
      ctx.lineTo(tagX - 4, tagY - 1);
      ctx.strokeStyle = palette.officeColor;
      ctx.stroke();

      ctx.fillStyle = palette.officeColor;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, tagX, tagY);
    }

    // 10. Emergency SOS Concentric Radar Pulse Strobe
    if (activeSosAlert) {
      const sosScreen = projection.toScreen(
        activeSosAlert.location.lat,
        activeSosAlert.location.lng
      );
      const strobeTime = pulsePhase * 3;

      const radii = [
        25 + Math.sin(strobeTime) * 15,
        55 + Math.sin(strobeTime + 1) * 20,
        90 + Math.sin(strobeTime + 2) * 30,
      ];

      radii.forEach((r, idx) => {
        ctx.beginPath();
        ctx.arc(sosScreen.x, sosScreen.y, Math.max(10, r), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.9 - idx * 0.25})`;
        ctx.lineWidth = 3 - idx * 0.8;
        ctx.stroke();
      });

      // Flashing alert badge over emergency location
      const sosLabel = `🚨 SOS CRITICAL: ${activeSosAlert.cab.routeNumber} (${activeSosAlert.employee.name})`;
      ctx.font = 'bold 10px ui-monospace, monospace';
      const labelW = ctx.measureText(sosLabel).width;

      ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
      ctx.fillRect(sosScreen.x - labelW / 2 - 8, sosScreen.y - 38, labelW + 16, 22);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sosScreen.x - labelW / 2 - 8, sosScreen.y - 38, labelW + 16, 22);

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sosLabel, sosScreen.x, sosScreen.y - 27);
    }
  }, [
    dimensions,
    palette,
    projection,
    clusters,
    gridDensity,
    hoveredCluster,
    selectedCluster,
    selectedClusterRoutes,
    blossomedClusterId,
    blossomedNode,
    highlightOverlapsOnly,
    dataset.office,
    dataset.cabs,
    activeHighlightedRoute,
    activeCab,
    pulsePhase,
    filterRoute,
    dispatchType,
    activeSosAlert,
    cabsToRender,
    isSearching,
  ]);

  // Mouse Movement & Hover Hit Detection
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setHoverPosition({ x: mouseX, y: mouseY });

      // Hit test cabs to render
      let foundCab: CabRoute | null = null;
      for (const cab of cabsToRender) {
        if (!cab.currentLocation) continue;
        const pt = projection.toScreen(cab.currentLocation.lat, cab.currentLocation.lng);
        if (Math.hypot(pt.x - mouseX, pt.y - mouseY) <= 18) {
          foundCab = cab;
          break;
        }
      }
      setHoveredCab(foundCab);

      let nearest: ClusterNode | null = null;
      let minDistance = 24;

      for (const cluster of clusters) {
        const hitRadius = cluster.isOffice
          ? 22
          : cluster.totalCount > 1
          ? Math.min(10 + Math.log2(cluster.totalCount) * 4, 22)
          : 14;

        const dist = Math.hypot(cluster.screenX - mouseX, cluster.screenY - mouseY);
        if (dist <= hitRadius && dist < minDistance) {
          nearest = cluster;
          minDistance = dist;
        }
      }

      setHoveredCluster(nearest);
      if (onHoverCluster) onHoverCluster(nearest);
    },
    [clusters, onHoverCluster, cabsToRender, projection]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredCluster(null);
    setHoveredCab(null);
    setHoverPosition(null);
    if (onHoverCluster) onHoverCluster(null);
  }, [onHoverCluster]);

  // Click handler:
  // REQUIREMENTS:
  // 1. "on clicking the blinking icon, open up the route details in sidebar"
  // 2. "when clicking on a map, auto filter the routes accordingly"
  // 3. "clicking empty map clears selection and restores all routes"
  const handleClick = useCallback(() => {
    // A. Clicked a cab beacon
    if (hoveredCab) {
      if (
        activeSosAlert &&
        (activeSosAlert.cab.routeNumber === hoveredCab.routeNumber || hoveredCab.hasSosActive)
      ) {
        if (onOpenSosModal) {
          onOpenSosModal();
          return;
        }
      }

      if (onSelectRoute) {
        onSelectRoute(hoveredCab.routeNumber);
      }
      if (onOpenRouteDetails) {
        onOpenRouteDetails(hoveredCab.routeNumber);
      }

      const cabEmp = dataset.employees.find((e) => e.routeNumber === hoveredCab.routeNumber);
      if (cabEmp) {
        const matchingCluster = clusters.find((c) =>
          c.employees.some((e) => e.id === cabEmp.id)
        );
        if (matchingCluster) {
          onSelectCluster(matchingCluster);
        }
      }
      return;
    }

    // B. Clicked a map node (cluster of employees or office)
    if (hoveredCluster) {
      onSelectCluster(hoveredCluster);
      if (hoveredCluster.totalCount > 1) {
        setBlossomedClusterId((prev) => (prev === hoveredCluster.id ? null : hoveredCluster.id));
      } else {
        setBlossomedClusterId(null);
      }

      if (hoveredCluster.isOffice) {
        if (onSelectRoute) onSelectRoute('all');
      } else {
        const clusterRouteList = Array.from(
          new Set(hoveredCluster.employees.map((e) => e.routeNumber).filter(Boolean))
        ) as string[];

        if (clusterRouteList.length === 1 && onSelectRoute) {
          onSelectRoute(clusterRouteList[0]);
        } else if (onSelectRoute) {
          onSelectRoute('all');
        }
      }
      return;
    }

    // C. Clicked empty space on map canvas -> reset filter and show all routes!
    onSelectCluster(null);
    setBlossomedClusterId(null);
    if (onSelectRoute) {
      onSelectRoute('all');
    }
  }, [
    hoveredCab,
    hoveredCluster,
    activeSosAlert,
    onOpenSosModal,
    onSelectRoute,
    onOpenRouteDetails,
    dataset.employees,
    clusters,
    onSelectCluster,
  ]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative overflow-hidden select-none transition-all duration-300 ${
        activeSosAlert
          ? 'ring-8 ring-red-600/90 shadow-[inset_0_0_120px_rgba(239,68,68,0.4)] animate-pulse'
          : ''
      }`}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`w-full h-full block ${hoveredCab || hoveredCluster ? 'cursor-pointer' : 'cursor-crosshair'}`}
      />

      {/* 1. Search Focus HUD Banner (REQUIREMENT: Only show that employee & route, clear the rest) */}
      {isSearching && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-sky-950/95 border border-sky-500/80 text-white font-mono text-xs flex items-center gap-3 shadow-[0_0_25px_rgba(56,189,248,0.35)] backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <span>
            SEARCH ISOLATION: <strong className="text-sky-300">&quot;{searchQuery}&quot;</strong> •{' '}
            {filteredEmployees.length} Employee{filteredEmployees.length === 1 ? '' : 's'} •{' '}
            {searchedRoutes && searchedRoutes.size > 0
              ? `Assigned Route: ${Array.from(searchedRoutes).join(', ')}`
              : 'Unassigned Route'}{' '}
            <span className="text-slate-400 text-[10px]">(All other routes cleared)</span>
          </span>
          <button
            onClick={() => onClearSearch && onClearSearch()}
            className="ml-2 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold border border-slate-600 transition"
          >
            Clear Search ✕
          </button>
        </div>
      )}

      {/* 2. Clicked Map Node Filter HUD Banner (REQUIREMENT: clicking map auto filters routes) */}
      {!isSearching && selectedCluster && !selectedCluster.isOffice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-blue-950/95 border border-blue-500/80 text-white font-mono text-xs flex items-center gap-3 shadow-[0_0_25px_rgba(59,130,246,0.35)] backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
          <span>
            LOCATION FILTER: <strong className="text-blue-300">{selectedCluster.employees[0]?.clusterArea || 'Selected Location'}</strong> •{' '}
            {selectedClusterRoutes && selectedClusterRoutes.size > 0
              ? `${selectedClusterRoutes.size} Route${selectedClusterRoutes.size > 1 ? 's' : ''} (${Array.from(selectedClusterRoutes).join(', ')})`
              : 'Unassigned Location'}{' '}
            • {selectedCluster.totalCount} Employee{selectedCluster.totalCount > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => {
              onSelectCluster(null);
              if (onSelectRoute) onSelectRoute('all');
            }}
            className="ml-2 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold border border-slate-600 transition"
          >
            Show All Routes ✕
          </button>
        </div>
      )}

      {/* 3. Selected Route Focus Banner (when no cluster selected and single route isolated) */}
      {!isSearching && (!selectedCluster || selectedCluster.isOffice) && filterRoute !== 'all' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-xl bg-sky-950/95 border border-sky-500/80 text-white font-mono text-xs flex items-center gap-3 shadow-[0_0_25px_rgba(56,189,248,0.35)] backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
          <span>
            ROUTE FOCUS: <strong className="text-sky-300">{filterRoute}</strong>
          </span>
          <button
            onClick={() => {
              if (onSelectRoute) onSelectRoute('all');
            }}
            className="ml-2 text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-bold border border-slate-600 transition"
          >
            Show All Routes ✕
          </button>
        </div>
      )}

      {/* Emergency Red Flashing Strobe Banner on Canvas */}
      {activeSosAlert && (
        <div
          onClick={() => onOpenSosModal && onOpenSosModal()}
          className="cursor-pointer absolute top-4 left-1/2 -translate-x-1/2 z-30 px-5 py-2 rounded-full bg-red-600/95 text-white font-mono text-xs font-black tracking-wider flex items-center gap-2.5 shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-bounce border-2 border-white hover:bg-red-500 transition"
          title="Click to view full emergency SOS incident HUD"
        >
          <span className="w-3 h-3 rounded-full bg-white animate-ping" />
          <span>
            CRITICAL SOS PANIC: {activeSosAlert.cab.routeNumber} ({activeSosAlert.cab.vehicleNumber}) • {activeSosAlert.employee.name} (Click to open)
          </span>
        </div>
      )}

      {/* Floating HUD Tooltip */}
      {hoverPosition && (hoveredCluster || hoveredCab) && (
        <div
          className="pointer-events-none absolute z-20 px-3 py-2.5 rounded-lg bg-slate-900/95 border border-slate-700/80 text-xs shadow-2xl backdrop-blur-md max-w-xs transition-transform duration-75"
          style={{
            left: Math.min(hoverPosition.x + 16, dimensions.width - 240),
            top: Math.min(hoverPosition.y + 16, dimensions.height - 230),
          }}
        >
          {hoveredCab ? (
            <div className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                <span className="font-bold text-yellow-400 flex items-center gap-1">
                  <Car className="w-3.5 h-3.5" /> {hoveredCab.routeNumber}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  LIVE GPS
                </span>
              </div>
              <div className="text-white font-semibold">{hoveredCab.vehicleNumber} ({hoveredCab.cabModel.split(' ')[0]})</div>
              <div className="text-[11px] text-slate-300">
                Driver: <span className="text-white font-medium">{hoveredCab.driver.name}</span> ({hoveredCab.driver.phone})
              </div>

              {/* Security Guard info in hover card */}
              {hoveredCab.guard ? (
                <div className="p-1.5 rounded bg-emerald-950/50 border border-emerald-700/50 text-[10px] text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Escort: <strong>{hoveredCab.guard.name}</strong> ({hoveredCab.guard.agency})</span>
                </div>
              ) : null}

              {/* Security Compliance badge */}
              {(() => {
                const sec = evaluateCabSecurity(hoveredCab, dispatchType);
                if (!sec.isCompliant) {
                  return (
                    <div className="p-1.5 rounded bg-amber-950/60 border border-amber-800 text-[10px] text-amber-300 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>{sec.violationReason}</span>
                    </div>
                  );
                }
                return null;
              })()}

              {hoveredCab.nextStop && (
                <div className="p-1.5 rounded bg-yellow-950/40 border border-yellow-800/40 text-[11px] space-y-0.5">
                  <div className="text-yellow-300 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>
                      {dispatchType === 'pickup' ? 'Pickup' : 'Drop'}: {hoveredCab.nextStop.employeeName}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    ETA: ~{hoveredCab.nextStop.etaMinutes} mins
                  </div>
                </div>
              )}

              <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Covered: {hoveredCab.metrics.coveredKm} km</span>
                <span>Remaining: {hoveredCab.metrics.remainingKm} km</span>
              </div>

              <div className="pt-1 text-[10px] text-sky-400 font-semibold text-center bg-sky-950/50 py-0.5 rounded border border-sky-800/40">
                👉 Click blinking cab to isolate on map & sidebar
              </div>
            </div>
          ) : hoveredCluster?.isOffice ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-400 font-bold tracking-wider uppercase text-[11px]">
                <Building2 className="w-3.5 h-3.5" />
                <span>
                  {dispatchType === 'pickup' ? 'Destination Facility (HQ)' : 'Departure Origin (HQ)'}
                </span>
              </div>
              <div className="font-medium text-slate-100">{dataset.office.name}</div>
              <div className="text-[11px] text-slate-400 leading-tight">
                {dataset.office.address}
              </div>
            </div>
          ) : hoveredCluster?.totalCount === 1 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">
                  {hoveredCluster.employees[0].name}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    hoveredCluster.employees[0].gender === 'female'
                      ? 'bg-pink-950 text-pink-300 border border-pink-700/50'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {hoveredCluster.employees[0].gender}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                {hoveredCluster.employees[0].boardingStatus === 'boarded' ? (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-mono">
                    ✓ {dispatchType === 'pickup' ? 'Boarded' : 'In Cab'} (OTP Verified)
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-mono">
                    ⏳ {dispatchType === 'pickup' ? 'Awaiting Cab' : 'Awaiting Drop'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <Car className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-400">Route:</span>
                {hoveredCluster.employees[0].routeNumber ? (
                  <span className="font-mono text-sky-300 font-bold">
                    {hoveredCluster.employees[0].routeNumber} (Stop #{hoveredCluster.employees[0].pickupSequence})
                  </span>
                ) : (
                  <span className="font-mono text-amber-400">Unassigned</span>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                Area: <span className="text-slate-200">{hoveredCluster.employees[0].clusterArea}</span>
              </div>

              <div className="pt-1 text-[10px] text-blue-400 font-semibold text-center bg-blue-950/40 py-0.5 rounded border border-blue-800/40">
                👉 Click to auto-filter routes for this location
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sky-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> Multi-Tenant Hub
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">
                  {hoveredCluster?.totalCount} Employees
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-medium">
                {hoveredCluster?.employees[0].clusterArea}
              </div>
              <div className="flex gap-2 text-[10px] text-slate-400">
                <span>♀ {hoveredCluster?.femaleCount} Female</span>
                <span>♂ {hoveredCluster?.maleCount} Male</span>
              </div>
              <div className="pt-1 text-[10px] text-blue-400 font-semibold text-center bg-blue-950/40 py-0.5 rounded border border-blue-800/40">
                👉 Click to auto-filter routes for this location
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Left Static HUD Header */}
      <div className="absolute top-4 left-4 pointer-events-none z-10 flex items-center gap-3">
        <div className="px-3 py-1.5 rounded-md bg-slate-950/85 border border-slate-700/70 backdrop-blur-md flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-xs text-slate-300 font-semibold uppercase tracking-wider">
            {dataset.region.state} • {dataset.region.city}
          </span>
        </div>
        <div className="px-2.5 py-1.5 rounded-md bg-slate-950/85 border border-slate-700/70 backdrop-blur-md text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-yellow-400 animate-pulse" />
          <span className="uppercase">
            {dispatchType === 'pickup' ? 'Shift: Morning Login' : 'Shift: Evening Logout'}
          </span>
        </div>
      </div>

      {/* Active Route Telemetry Banner (Top Right) */}
      {activeCab && (
        <div
          onClick={() => {
            if (onSelectRoute) onSelectRoute(activeCab.routeNumber);
            if (onOpenRouteDetails) onOpenRouteDetails(activeCab.routeNumber);
          }}
          className="cursor-pointer absolute top-4 right-4 z-20 px-3 py-2 rounded-lg bg-slate-950/95 border border-sky-500/50 backdrop-blur-md flex flex-col gap-1 shadow-2xl font-mono text-xs hover:border-sky-400 transition"
          title="Click to isolate this route"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-yellow-400 font-bold flex items-center gap-1.5">
              <Car className="w-4 h-4" /> {activeCab.routeNumber} • {activeCab.vehicleNumber}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              {activeCab.passengers.length}/3 Seats
            </span>
          </div>

          <div className="text-[11px] text-slate-300">
            Driver: <span className="text-white font-medium">{activeCab.driver.name}</span> ({activeCab.driver.phone})
          </div>

          {activeCab.guard && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Escort: {activeCab.guard.name} ({activeCab.guard.agency})</span>
            </div>
          )}

          {activeCab.nextStop && (
            <div className="text-[11px] text-yellow-300/90 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              <span>
                {dispatchType === 'pickup' ? 'Pickup' : 'Drop'}: {activeCab.nextStop.employeeName} (ETA ~{activeCab.nextStop.etaMinutes}m)
              </span>
            </div>
          )}
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 flex justify-between">
            <span>{activeCab.metrics.coveredKm} km covered</span>
            <span>{activeCab.metrics.remainingKm} km left</span>
          </div>

          <div className="pt-1 text-[9px] text-sky-400 flex items-center justify-center gap-1">
            <span>Isolating in Sidebar →</span>
          </div>
        </div>
      )}

      {/* Legend / Status Overlay (Bottom Left) */}
      <div className="absolute bottom-4 left-4 pointer-events-none z-10 flex flex-wrap items-center gap-3 bg-slate-950/85 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-lg text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-sky-400 border border-white inline-block"></span>
          <span>Corporate HQ ({dispatchType === 'pickup' ? 'Dest' : 'Origin'})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-yellow-400 rotate-45 inline-block"></span>
          <span>Live Cab GPS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">🛡️</span>
          <span>Guard Escort</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 font-bold">⚠️</span>
          <span>Guard Required</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
          <span>OTP Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-400 inline-block"></span>
          <span>Female</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-200 inline-block"></span>
          <span>Male</span>
        </div>
      </div>
    </div>
  );
};
