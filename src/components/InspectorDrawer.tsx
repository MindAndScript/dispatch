'use client';

import React, { useMemo, useState } from 'react';
import { CabRoute, ClusterNode, DispatchDataset, Employee } from '../types/dispatch';
import { DispatchType } from '../types/config';
import { evaluateCabSecurity } from '../utils/security';
import {
  X,
  MapPin,
  Car,
  Phone,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Edit2,
  Check,
  Shield,
  Search,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';

interface InspectorDrawerProps {
  office: DispatchDataset['office'];
  allEmployees: Employee[];
  cabs: CabRoute[];
  dispatchType?: DispatchType;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  selectedRoute: string;
  onSelectRoute: (routeNumber: string) => void;
  selectedCluster: ClusterNode | null;
  onSelectCluster: (cluster: ClusterNode | null) => void;
  onUpdateEmployeeRoute: (employeeId: string, newRoute: string | null) => void;
  onToggleBoardingStatus?: (employeeId: string) => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  office,
  allEmployees,
  cabs,
  dispatchType = 'pickup',
  searchQuery,
  onChangeSearchQuery,
  selectedRoute,
  onSelectRoute,
  selectedCluster,
  onSelectCluster,
  onUpdateEmployeeRoute,
  onToggleBoardingStatus,
}) => {
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [inputRoute, setInputRoute] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'guarded' | 'violations' | 'full'>('all');

  const isSearching = searchQuery.trim().length > 0;

  // Routes associated with the currently clicked map cluster node
  const clusterRoutes = useMemo(() => {
    if (!selectedCluster || selectedCluster.isOffice) return null;
    const set = new Set<string>();
    selectedCluster.employees.forEach((e) => {
      if (e.routeNumber) set.add(e.routeNumber);
    });
    return set;
  }, [selectedCluster]);

  // Set of employee IDs belonging to the clicked cluster for in-card highlighting
  const clickedClusterEmpIds = useMemo(() => {
    if (!selectedCluster || selectedCluster.isOffice) return new Set<string>();
    return new Set(selectedCluster.employees.map((e) => e.id));
  }, [selectedCluster]);

  // Unassigned employees at the clicked cluster node (if any)
  const unassignedClusterEmps = useMemo(() => {
    if (!selectedCluster || selectedCluster.isOffice) return [];
    return selectedCluster.employees.filter((e) => !e.routeNumber);
  }, [selectedCluster]);

  // Filter cabs based on: Search -> Clicked Map Node -> Selected Route -> Category Tab
  const displayedCabs = useMemo(() => {
    let list = cabs;

    // 1. Search employee query (highest priority)
    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      return list.filter((cab) =>
        cab.passengers.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q)
        )
      );
    }

    // 2. Clicked node on map: auto filter routes accordingly!
    if (clusterRoutes && clusterRoutes.size > 0) {
      if (selectedRoute !== 'all' && clusterRoutes.has(selectedRoute)) {
        return list.filter((cab) => cab.routeNumber === selectedRoute);
      }
      return list.filter((cab) => clusterRoutes.has(cab.routeNumber));
    }

    // 3. Explicitly selected route (e.g. clicking cab beacon)
    if (selectedRoute !== 'all') {
      const single = list.filter((cab) => cab.routeNumber === selectedRoute);
      if (single.length > 0) return single;
    }

    // 4. Category quick filter chips
    if (categoryFilter === 'guarded') {
      list = list.filter((c) => !!c.guard);
    } else if (categoryFilter === 'violations') {
      list = list.filter((c) => !evaluateCabSecurity(c, dispatchType).isCompliant);
    } else if (categoryFilter === 'full') {
      list = list.filter((c) => c.passengers.length === 3);
    }

    return list;
  }, [cabs, isSearching, searchQuery, clusterRoutes, selectedRoute, categoryFilter, dispatchType]);

  // Overall security stats
  const securityCounts = useMemo(() => {
    let guarded = 0;
    let violations = 0;
    cabs.forEach((c) => {
      const sec = evaluateCabSecurity(c, dispatchType);
      if (sec.hasGuard) guarded++;
      if (!sec.isCompliant) violations++;
    });
    return { guarded, violations };
  }, [cabs, dispatchType]);

  // Handle manual route editing
  const handleStartEdit = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setInputRoute(emp.routeNumber || '');
  };

  const handleSaveRoute = (empId: string) => {
    const trimmed = inputRoute.trim().toUpperCase();
    const finalRoute = trimmed === '' || trimmed === 'NONE' ? null : trimmed;
    onUpdateEmployeeRoute(empId, finalRoute);
    setEditingEmpId(null);
  };

  const isMapNodeActive = selectedCluster !== null && !selectedCluster.isOffice;
  const isDetailedMode = selectedCluster !== null || (selectedRoute !== 'all' && !isSearching);

  return (
    <div className="w-84 md:w-96 flex-shrink-0 h-full flex flex-col bg-slate-900 border-l border-slate-800 text-slate-100 overflow-hidden shadow-2xl transition-all duration-200">
      
      {/* 1. Top Fixed Header with Employee Search Bar */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-sky-400" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Fleet Routes ({displayedCabs.length} / {cabs.length} Cabs)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
            {dispatchType === 'pickup' ? 'Login: To Office' : 'Logout: From Office'}
          </span>
        </div>

        {/* Search Bar to Search an Employee */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onChangeSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Isolation Indicator */}
        {isSearching && (
          <div className="p-1.5 rounded bg-sky-950/80 border border-sky-800/60 text-[10px] font-mono text-sky-300 flex items-center justify-between">
            <span className="truncate">
              Focus: &quot;{searchQuery}&quot; ({displayedCabs.length} route match)
            </span>
            <button
              onClick={() => onChangeSearchQuery('')}
              className="text-slate-400 hover:text-white font-bold ml-1"
            >
              Clear ✕
            </button>
          </div>
        )}

        {/* Clicked Map Node Filter Indicator */}
        {!isSearching && isMapNodeActive && (
          <div className="p-1.5 rounded bg-blue-950/90 border border-blue-700/70 text-[10px] font-mono text-blue-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 animate-bounce" />
              <span className="truncate">
                Map Node: <strong>{selectedCluster?.employees[0]?.clusterArea || 'Location'}</strong> ({clusterRoutes?.size || 0} route{(clusterRoutes?.size || 0) === 1 ? '' : 's'})
              </span>
            </div>
            <button
              onClick={() => {
                onSelectCluster(null);
                onSelectRoute('all');
              }}
              className="text-slate-400 hover:text-white font-bold ml-1 px-1.5 py-0.2 rounded bg-slate-800 flex-shrink-0"
              title="Clear map filter and show all routes"
            >
              All Routes ✕
            </button>
          </div>
        )}
      </div>

      {/* 2. Sub-Header: Back Navigation OR Category Filter Chips */}
      {isDetailedMode && !isMapNodeActive ? (
        <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs font-mono">
          <button
            onClick={() => {
              onSelectRoute('all');
              onSelectCluster(null);
            }}
            className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-bold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Show All Routes</span>
          </button>
          <span className="text-[11px] text-slate-400">
            {selectedCluster?.isOffice
              ? 'Facility HQ'
              : selectedRoute !== 'all'
              ? `Route ${selectedRoute}`
              : 'Selected Node'}
          </span>
        </div>
      ) : (
        /* Category Quick Filter Chips */
        <div className="px-3 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => {
              setCategoryFilter('all');
              onSelectCluster(null);
              onSelectRoute('all');
            }}
            className={`px-2 py-0.5 rounded transition ${
              categoryFilter === 'all' && !isMapNodeActive && selectedRoute === 'all'
                ? 'bg-sky-600 text-white font-bold'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All ({cabs.length})
          </button>
          <button
            onClick={() => {
              setCategoryFilter('guarded');
              onSelectCluster(null);
              onSelectRoute('all');
            }}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
              categoryFilter === 'guarded'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-emerald-400/90 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>Guarded ({securityCounts.guarded})</span>
          </button>
          <button
            onClick={() => {
              setCategoryFilter('violations');
              onSelectCluster(null);
              onSelectRoute('all');
            }}
            className={`px-2 py-0.5 rounded flex items-center gap-1 transition ${
              categoryFilter === 'violations'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-amber-400/90 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Flags ({securityCounts.violations})</span>
          </button>
        </div>
      )}

      {/* 3. Panel Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        
        {/* A. If viewing Destination Office (Corporate HQ) */}
        {selectedCluster && selectedCluster.isOffice ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/50 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                Primary Facility Depot
              </span>
              <div className="text-sm font-bold text-sky-100">{office.name}</div>
              <div className="text-slate-300 leading-relaxed text-[11px]">{office.address}</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="text-slate-300 font-semibold">Live Fleet Hub Status</div>
              <div className="grid grid-cols-2 gap-2 text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Facility Code</span>
                  <span className="font-mono text-slate-200">{office.code}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Capacity Rule</span>
                  <span className="text-emerald-400 font-bold font-mono">Max 3 / Cab</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* B. Routes List (Auto-filtered by Map click or Search) */
          <div className="space-y-3">
            {/* Clicked Location Summary Card (When node is selected on map) */}
            {isMapNodeActive && selectedCluster && (
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-300 font-bold font-mono text-xs">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>{selectedCluster.employees[0]?.clusterArea || 'Location Stop'}</span>
                  </div>
                  <button
                    onClick={() => {
                      onSelectCluster(null);
                      onSelectRoute('all');
                    }}
                    className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                  >
                    All Routes ✕
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                  <span>{selectedCluster.totalCount} Employees at this stop</span>
                  <span>•</span>
                  <span className="text-pink-400 font-bold">♀ {selectedCluster.femaleCount}</span>
                  <span className="text-sky-400 font-bold">♂ {selectedCluster.maleCount}</span>
                </div>
              </div>
            )}

            {/* Unassigned Employees at this Location (if any) */}
            {isMapNodeActive && unassignedClusterEmps.length > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/70 space-y-2">
                <div className="flex items-center justify-between text-amber-300 font-mono font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Unassigned ({unassignedClusterEmps.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {unassignedClusterEmps.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-2 rounded bg-slate-900 border border-slate-700/60 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-white font-medium">{emp.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{emp.id}</div>
                      </div>
                      {editingEmpId === emp.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="R-01"
                            value={inputRoute}
                            onChange={(e) => setInputRoute(e.target.value)}
                            className="w-16 px-1.5 py-0.5 text-xs bg-slate-800 border border-slate-600 rounded text-white font-mono uppercase"
                          />
                          <button
                            onClick={() => handleSaveRoute(emp.id)}
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartEdit(emp)}
                          className="px-2 py-0.5 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-700 text-[10px] font-mono flex items-center gap-1"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Assign Cab
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {displayedCabs.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs space-y-2">
                <div>No routes found matching current filter</div>
                <button
                  onClick={() => {
                    onChangeSearchQuery('');
                    onSelectCluster(null);
                    onSelectRoute('all');
                  }}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition"
                >
                  Show all 32 routes
                </button>
              </div>
            ) : (
              displayedCabs.map((cab) => {
                const sec = evaluateCabSecurity(cab, dispatchType);
                const isSelected = selectedRoute === cab.routeNumber;
                const isFull = cab.passengers.length === 3;

                return (
                  <div
                    key={cab.routeNumber}
                    className={`rounded-xl border p-3 space-y-2.5 transition duration-150 ${
                      isSelected
                        ? 'bg-slate-800/90 border-sky-500 ring-1 ring-sky-500 shadow-xl'
                        : isMapNodeActive
                        ? 'bg-slate-800/70 border-blue-500/70 shadow-md'
                        : !sec.isCompliant
                        ? 'bg-slate-900/90 border-amber-800/80 hover:border-amber-600'
                        : sec.hasGuard
                        ? 'bg-slate-900/90 border-emerald-800/70 hover:border-emerald-600'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Route Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-md font-mono font-bold text-xs flex items-center justify-center ${
                            sec.hasGuard
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
                              : !sec.isCompliant
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/40'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {cab.routeNumber}
                        </span>

                        <div>
                          <div className="font-mono font-bold text-white text-xs">
                            {cab.vehicleNumber}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {cab.cabModel.split(' ')[0]} {cab.cabModel.split(' ')[1] || ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            isFull
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {cab.passengers.length}/3 Seats
                        </span>

                        {sec.hasGuard && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Guarded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Escort Guard (if assigned) */}
                    {cab.guard && (
                      <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/50 text-[10px] font-mono text-emerald-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Escort: <strong>{cab.guard.name.split(' ')[0]}</strong> ({cab.guard.agency.split(' ')[0]})</span>
                        </span>
                        <a href={`tel:${cab.guard.phone}`} className="text-emerald-400 hover:underline">
                          {cab.guard.phone}
                        </a>
                      </div>
                    )}

                    {/* Security Violation Flag (if missing guard) */}
                    {!sec.isCompliant && (
                      <div className="p-1.5 rounded bg-amber-950/50 border border-amber-800 text-[10px] font-mono text-amber-300 flex items-start gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Security Flag: </span>
                          <span>{sec.violationReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Driver details */}
                    <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span>Driver: <strong className="text-white">{cab.driver.name}</strong></span>
                      <a href={`tel:${cab.driver.phone}`} className="text-sky-400 hover:underline flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" /> {cab.driver.phone}
                      </a>
                    </div>

                    {/* Passenger Roster with OTP Verification Buttons */}
                    <div className="space-y-1 pt-1">
                      {cab.passengers.map((p, pIdx) => {
                        const isMatch = isSearching && (
                          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        const isAtClickedNode = clickedClusterEmpIds.has(p.id);
                        const isBoarded = p.boardingStatus === 'boarded';

                        return (
                          <div
                            key={p.id}
                            className={`p-1.5 rounded flex items-center justify-between text-[11px] ${
                              isMatch
                                ? 'bg-sky-950 border border-sky-500'
                                : isAtClickedNode
                                ? 'bg-blue-950/90 border border-blue-500/80'
                                : 'bg-slate-950/70 border border-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-800 text-slate-300 text-[9px] font-mono flex items-center justify-center font-bold">
                                {pIdx + 1}
                              </span>
                              <div className="truncate">
                                <span className={`font-medium truncate ${isMatch || isAtClickedNode ? 'text-sky-200 font-bold' : 'text-slate-200'}`}>
                                  {p.name}
                                </span>
                                {isAtClickedNode && (
                                  <span className="ml-1 text-[8px] text-blue-300 font-mono bg-blue-900 px-1 rounded">
                                    Map Pick
                                  </span>
                                )}
                              </div>
                              <span className={`text-[8px] font-bold ${p.gender === 'female' ? 'text-pink-400' : 'text-slate-400'}`}>
                                {p.gender === 'female' ? '♀' : '♂'}
                              </span>
                            </div>

                            {/* OTP Boarding Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleBoardingStatus) onToggleBoardingStatus(p.id);
                              }}
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold flex items-center gap-1 transition ${
                                isBoarded
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700'
                              }`}
                              title="Click to toggle OTP verified state"
                            >
                              {isBoarded ? '✓ Boarded' : 'OTP Verify'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Footer / Map Selection Button */}
                    <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-400">
                        {cab.metrics.coveredKm} km done • {cab.metrics.remainingKm} km left
                      </span>

                      <button
                        onClick={() => {
                          onSelectRoute(cab.routeNumber);
                          // Select passenger node for map sync
                          const firstEmp = cab.passengers[0];
                          if (firstEmp) {
                            const key = `${firstEmp.lat.toFixed(5)},${firstEmp.lng.toFixed(5)}`;
                            const empsAtLoc = allEmployees.filter(
                              (e) => `${e.lat.toFixed(5)},${e.lng.toFixed(5)}` === key
                            );
                            onSelectCluster({
                              id: `node-${key}`,
                              lat: firstEmp.lat,
                              lng: firstEmp.lng,
                              screenX: 0,
                              screenY: 0,
                              employees: empsAtLoc,
                              totalCount: empsAtLoc.length,
                              femaleCount: empsAtLoc.filter((e) => e.gender === 'female').length,
                              maleCount: empsAtLoc.filter((e) => e.gender === 'male').length,
                            });
                          }
                        }}
                        className={`font-semibold flex items-center gap-0.5 transition ${
                          isSelected ? 'text-sky-300 underline font-bold' : 'text-sky-400 hover:text-sky-300'
                        }`}
                      >
                        <span>{isSelected ? 'Isolating on Map' : 'Select Route'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom Technical Status Bar in Sidepanel */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
        <span>32 CABS • MAX 3 / CAB</span>
        <button
          onClick={() => {
            onSelectRoute('all');
            onChangeSearchQuery('');
            onSelectCluster(null);
          }}
          className="text-sky-400 hover:underline font-bold"
        >
          Reset All Filters
        </button>
      </div>
    </div>
  );
};
