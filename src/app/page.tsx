'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BoardingStatus,
  CabRoute,
  ClusterNode,
  DispatchDataset,
  Employee,
  SosAlert,
  WallMapTheme,
} from '../types/dispatch';
import { DispatchType, OperationMode } from '../types/config';
import { getTelanganaDataset } from '../data/mockTelanganaData';
import { WallMapCanvas } from '../components/WallMapCanvas';
import { ControlToolbar } from '../components/ControlToolbar';
import { InspectorDrawer } from '../components/InspectorDrawer';
import { DatasetModal } from '../components/DatasetModal';
import { RouteFleetModal } from '../components/RouteFleetModal';
import { SosEmergencyModal } from '../components/SosEmergencyModal';
import {
  Radio,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';

export default function DispatchWallMapPage() {
  const [dataset, setDataset] = useState<DispatchDataset>(() => getTelanganaDataset());
  const [theme, setTheme] = useState<WallMapTheme>('dark-radar');
  const [gridDensity, setGridDensity] = useState<'sparse' | 'normal' | 'dense'>('normal');
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');
  // Helper to parse direction from URL query parameters (?type=pickup, ?type=drop, ?direction=..., etc.)
  const parseDispatchTypeFromUrl = (): DispatchType | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const val = params.get('type') || params.get('direction') || params.get('shift');
    if (!val) return null;
    const lower = val.toLowerCase();
    if (lower === 'drop' || lower === 'from_office' || lower === 'logout' || lower === 'evening') {
      return 'drop';
    }
    if (lower === 'pickup' || lower === 'to_office' || lower === 'login' || lower === 'morning') {
      return 'pickup';
    }
    return null;
  };

  const [filterRoute, setFilterRoute] = useState<string>('all');
  const [dispatchType, setDispatchType] = useState<DispatchType>(() => {
    return parseDispatchTypeFromUrl() || 'pickup';
  });
  const [operationMode, setOperationMode] = useState<OperationMode>('demo');
  const [highlightOverlapsOnly, setHighlightOverlapsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<ClusterNode | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);

  // Emergency SOS State
  const [activeSosAlert, setActiveSosAlert] = useState<SosAlert | null>(null);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);

  // Load initial settings: URL query parameter takes priority, followed by config API
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((cfg) => {
        if (cfg.mode) setOperationMode(cfg.mode);
        const currentUrlType = parseDispatchTypeFromUrl();
        if (!currentUrlType && cfg.activeDispatchType) {
          setDispatchType(cfg.activeDispatchType);
        }
      })
      .catch((err) => console.log('Config API fallback', err));

    // Listen to browser forward/back button navigation
    const handlePopState = () => {
      const popped = parseDispatchTypeFromUrl();
      if (popped) setDispatchType(popped);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handler for changing dispatch type (in Demo mode, updates state and reflects into URL query params)
  const handleChangeDispatchType = (newType: DispatchType) => {
    setDispatchType(newType);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('type', newType);
      window.history.pushState({}, '', url.toString());
    }
  };

  // Group coordinates to get stats on overlaps
  const coordStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const emp of dataset.employees) {
      const key = `${emp.lat.toFixed(5)},${emp.lng.toFixed(5)}`;
      map.set(key, (map.get(key) || 0) + 1);
    }

    let multiCount = 0;
    map.forEach((count) => {
      if (count > 1) multiCount++;
    });

    return {
      totalUniqueLocations: map.size,
      multiOccupantLocations: multiCount,
    };
  }, [dataset.employees]);

  // Handler for manual route assignment by transport team
  const handleUpdateEmployeeRoute = (employeeId: string, newRoute: string | null) => {
    setDataset((prev) => {
      const updatedEmployees = prev.employees.map((emp) => {
        if (emp.id === employeeId) {
          if (!newRoute) {
            return { ...emp, routeNumber: null, pickupSequence: null };
          }
          const existingInRoute = prev.employees.filter(
            (e) => e.routeNumber === newRoute && e.id !== employeeId
          );
          const nextSeq = existingInRoute.length + 1;
          return {
            ...emp,
            routeNumber: newRoute,
            pickupSequence: nextSeq,
          };
        }
        return emp;
      });

      const updatedCabs = prev.cabs.map((cab) => {
        const cabPassengers = updatedEmployees.filter((e) => e.routeNumber === cab.routeNumber);
        return {
          ...cab,
          passengers: cabPassengers,
        };
      });

      return {
        ...prev,
        employees: updatedEmployees,
        cabs: updatedCabs,
      };
    });

    setSelectedCluster((prevCluster) => {
      if (!prevCluster || prevCluster.isOffice) return prevCluster;
      const updatedClusterEmployees = prevCluster.employees.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              routeNumber: newRoute,
              pickupSequence: newRoute ? 1 : null,
            }
          : e
      );
      return {
        ...prevCluster,
        employees: updatedClusterEmployees,
      };
    });
  };

  // Handler for OTP verification simulation
  const handleToggleBoardingStatus = (employeeId: string) => {
    setDataset((prev) => {
      const updatedEmployees = prev.employees.map((emp) => {
        if (emp.id === employeeId) {
          const nextStatus: BoardingStatus =
            emp.boardingStatus === 'boarded' ? 'awaiting_cab' : 'boarded';
          return {
            ...emp,
            boardingStatus: nextStatus,
          };
        }
        return emp;
      });

      const updatedCabs = prev.cabs.map((cab) => {
        const cabPassengers = updatedEmployees.filter((e) => e.routeNumber === cab.routeNumber);
        return {
          ...cab,
          passengers: cabPassengers,
        };
      });

      return {
        ...prev,
        employees: updatedEmployees,
        cabs: updatedCabs,
      };
    });

    setSelectedCluster((prevCluster) => {
      if (!prevCluster || prevCluster.isOffice) return prevCluster;
      const updatedClusterEmployees = prevCluster.employees.map((e) =>
        e.id === employeeId
          ? {
              ...e,
              boardingStatus: (e.boardingStatus === 'boarded' ? 'awaiting_cab' : 'boarded') as BoardingStatus,
            }
          : e
      );
      return {
        ...prevCluster,
        employees: updatedClusterEmployees,
      };
    });
  };

  // Handler to Trigger SOS Panic Alarm (Demo Mode Only)
  const handleTriggerSos = (customEmp?: Employee, customCab?: CabRoute) => {
    let victimCab = customCab;
    let victimEmp = customEmp;

    if (!victimCab || !victimEmp) {
      // Pick demo route: R-02 (all-female guarded) or R-04
      victimCab = dataset.cabs.find((c) => c.routeNumber === 'R-02') || dataset.cabs[0];
      victimEmp = victimCab.passengers.find((p) => p.boardingStatus === 'boarded') || victimCab.passengers[0];
    }

    const alert: SosAlert = {
      incidentId: `SOS-${Math.floor(1000 + Math.random() * 9000)}-HYD`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      employee: victimEmp,
      cab: victimCab,
      location: {
        lat: victimCab.currentLocation?.lat || victimEmp.lat,
        lng: victimCab.currentLocation?.lng || victimEmp.lng,
        area: victimEmp.clusterArea,
      },
      status: 'active',
    };

    setActiveSosAlert(alert);
    setIsSosModalOpen(true);

    // Mark cab as having active SOS
    setDataset((prev) => ({
      ...prev,
      cabs: prev.cabs.map((c) =>
        c.routeNumber === victimCab?.routeNumber
          ? { ...c, hasSosActive: true }
          : c
      ),
    }));
  };

  const handleSilenceSos = () => {
    if (activeSosAlert) {
      setActiveSosAlert((prev) => (prev ? { ...prev, status: 'silenced' } : null));
    }
  };

  const handleAcknowledgeSos = () => {
    if (activeSosAlert) {
      setActiveSosAlert((prev) =>
        prev
          ? {
              ...prev,
              status: 'acknowledged',
              acknowledgedAt: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
              acknowledgedBy: 'Transport Dispatch Admin',
            }
          : null
      );
    }
  };

  const handleResolveSos = () => {
    if (activeSosAlert) {
      const incidentCabRoute = activeSosAlert.cab.routeNumber;
      setDataset((prev) => ({
        ...prev,
        cabs: prev.cabs.map((c) =>
          c.routeNumber === incidentCabRoute
            ? { ...c, hasSosActive: false }
            : c
        ),
      }));
    }
    setActiveSosAlert(null);
    setIsSosModalOpen(false);
  };

  // Handler for clicking the blinking cab icon on the map: isolate in sidebar & map
  const handleOpenRouteDetails = (routeNumber: string) => {
    setFilterRoute(routeNumber);

    // Find the passenger node for this cab route and select it for the sidebar inspector
    const routeEmp = dataset.employees.find((e) => e.routeNumber === routeNumber);
    if (routeEmp) {
      const key = `${routeEmp.lat.toFixed(5)},${routeEmp.lng.toFixed(5)}`;
      const empsAtLocation = dataset.employees.filter(
        (e) => `${e.lat.toFixed(5)},${e.lng.toFixed(5)}` === key
      );
      setSelectedCluster({
        id: `node-${key}`,
        lat: routeEmp.lat,
        lng: routeEmp.lng,
        screenX: 0,
        screenY: 0,
        employees: empsAtLocation,
        totalCount: empsAtLocation.length,
        femaleCount: empsAtLocation.filter((e) => e.gender === 'female').length,
        maleCount: empsAtLocation.filter((e) => e.gender === 'male').length,
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Top Controls Header */}
      <ControlToolbar
        dataset={dataset}
        theme={theme}
        onChangeTheme={setTheme}
        gridDensity={gridDensity}
        onChangeGridDensity={setGridDensity}
        filterGender={filterGender}
        onChangeFilterGender={setFilterGender}
        filterRoute={filterRoute}
        onChangeFilterRoute={setFilterRoute}
        dispatchType={dispatchType}
        onChangeDispatchType={handleChangeDispatchType}
        operationMode={operationMode}
        highlightOverlapsOnly={highlightOverlapsOnly}
        onToggleHighlightOverlaps={() => setHighlightOverlapsOnly((prev) => !prev)}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenFleetModal={() => setIsFleetModalOpen(true)}
        totalUniqueNodes={coordStats.totalUniqueLocations}
        multiOccupantNodes={coordStats.multiOccupantLocations}
        activeSosAlert={activeSosAlert}
        onTriggerDemoSos={() => handleTriggerSos()}
        onOpenSosModal={() => setIsSosModalOpen(true)}
      />

      {/* Main Workspace Area (Fixed Right Sidepanel + Dynamic Wall Map) */}
      <div className="flex-1 flex relative overflow-hidden p-2.5 gap-2.5 bg-slate-950">
        {/* Wall Map Canvas Area (Fills remaining width) */}
        <div className="flex-1 h-full min-w-0 relative">
          <WallMapCanvas
            dataset={dataset}
            theme={theme}
            gridDensity={gridDensity}
            filterGender={filterGender}
            filterRoute={filterRoute}
            dispatchType={dispatchType}
            highlightOverlapsOnly={highlightOverlapsOnly}
            searchQuery={searchQuery}
            selectedCluster={selectedCluster}
            activeSosAlert={activeSosAlert}
            onSelectCluster={setSelectedCluster}
            onSelectRoute={(routeNum) => setFilterRoute(routeNum)}
            onOpenRouteDetails={handleOpenRouteDetails}
            onOpenSosModal={() => setIsSosModalOpen(true)}
            onClearSearch={() => setSearchQuery('')}
          />
        </div>

        {/* Fixed Right Sidepanel: Default All Routes List & Top Employee Search */}
        <InspectorDrawer
          office={dataset.office}
          allEmployees={dataset.employees}
          cabs={dataset.cabs}
          dispatchType={dispatchType}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          selectedRoute={filterRoute}
          onSelectRoute={(routeNum) => setFilterRoute(routeNum)}
          selectedCluster={selectedCluster}
          onSelectCluster={setSelectedCluster}
          onUpdateEmployeeRoute={handleUpdateEmployeeRoute}
          onToggleBoardingStatus={handleToggleBoardingStatus}
        />
      </div>

      {/* Bottom Technical Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-950 px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            <span className="uppercase">
              {dispatchType === 'pickup'
                ? 'LOGIN DISPATCH ACTIVE: HOMES ──▶ APARNA TECHNOPOLIS'
                : 'LOGOUT DISPATCH ACTIVE: APARNA TECHNOPOLIS ──▶ HOMES'}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-slate-300 border-l border-slate-800 pl-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {dispatchType === 'pickup'
                ? 'Rule: 1st pickup female requires security guard'
                : 'Rule: Last drop-off female requires security guard'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeSosAlert ? (
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="flex items-center gap-1.5 text-white bg-red-600 px-2.5 py-0.5 rounded font-bold animate-pulse"
            >
              <AlertOctagon className="w-3 h-3" />
              <span>INCIDENT LIVE: {activeSosAlert.cab.routeNumber}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-400/90 bg-emerald-950/40 px-2.5 py-0.5 rounded border border-emerald-800/40">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Security Protocols Active</span>
            </div>
          )}

          <span className="text-slate-500 font-mono">
            {operationMode === 'live' ? 'MODE: LIVE API' : 'MODE: DEMO'}
          </span>
        </div>
      </footer>

      {/* Emergency SOS Alarm HUD / Modal */}
      {activeSosAlert && isSosModalOpen && (
        <SosEmergencyModal
          alert={activeSosAlert}
          onSilence={handleSilenceSos}
          onAcknowledge={handleAcknowledgeSos}
          onResolve={handleResolveSos}
        />
      )}

      {/* Dataset / API Payload Modal */}
      <DatasetModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        currentDataset={dataset}
        onSaveDataset={(newDataset) => {
          setDataset(newDataset);
          setSelectedCluster(null);
        }}
      />

      {/* Fleet Routes Passenger Matrix Modal */}
      <RouteFleetModal
        isOpen={isFleetModalOpen}
        onClose={() => setIsFleetModalOpen(false)}
        dataset={dataset}
        dispatchType={dispatchType}
        onSelectRouteOnMap={(routeNum) => {
          setFilterRoute(routeNum);
        }}
        onAssignEmployeeRoute={(empId, routeNum) => {
          handleUpdateEmployeeRoute(empId, routeNum);
        }}
        onToggleBoardingStatus={(empId) => {
          handleToggleBoardingStatus(empId);
        }}
      />
    </div>
  );
}
