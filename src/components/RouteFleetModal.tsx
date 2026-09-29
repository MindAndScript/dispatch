'use client';

import React, { useMemo, useState } from 'react';
import { CabRoute, DispatchDataset, Employee } from '../types/dispatch';
import { DispatchType } from '../types/config';
import { evaluateCabSecurity } from '../utils/security';
import {
  X,
  Car,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Navigation,
  ExternalLink,
  UserPlus,
  KeyRound,
  Radio,
  Shield,
} from 'lucide-react';

interface RouteFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: DispatchDataset;
  dispatchType?: DispatchType;
  onSelectRouteOnMap: (routeNumber: string) => void;
  onAssignEmployeeRoute: (employeeId: string, routeNumber: string) => void;
  onToggleBoardingStatus?: (employeeId: string) => void;
}

export const RouteFleetModal: React.FC<RouteFleetModalProps> = ({
  isOpen,
  onClose,
  dataset,
  dispatchType = 'pickup',
  onSelectRouteOnMap,
  onAssignEmployeeRoute,
  onToggleBoardingStatus,
}) => {
  const [filterTab, setFilterTab] = useState<
    'all' | 'guarded' | 'violations' | 'full' | 'available' | 'unassigned'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAssignRoute, setQuickAssignRoute] = useState<{ [empId: string]: string }>({});

  const unassignedEmployees = useMemo(() => {
    return dataset.employees.filter((e) => !e.routeNumber);
  }, [dataset.employees]);

  // Filter routes based on search and tab
  const filteredCabs = useMemo(() => {
    let list = dataset.cabs;

    if (filterTab === 'guarded') {
      list = list.filter((c) => !!c.guard);
    } else if (filterTab === 'violations') {
      list = list.filter((c) => !evaluateCabSecurity(c, dispatchType).isCompliant);
    } else if (filterTab === 'full') {
      list = list.filter((c) => c.passengers.length === 3);
    } else if (filterTab === 'available') {
      list = list.filter((c) => c.passengers.length < 3);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.routeNumber.toLowerCase().includes(q) ||
          c.vehicleNumber.toLowerCase().includes(q) ||
          c.driver.name.toLowerCase().includes(q) ||
          (c.guard && c.guard.name.toLowerCase().includes(q)) ||
          c.passengers.some(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q) ||
              p.clusterArea.toLowerCase().includes(q)
          )
      );
    }

    return list;
  }, [dataset.cabs, filterTab, searchQuery, dispatchType]);

  const filteredUnassigned = useMemo(() => {
    let list = unassignedEmployees;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.clusterArea.toLowerCase().includes(q)
      );
    }
    return list;
  }, [unassignedEmployees, searchQuery]);

  // Summary counts
  const stats = useMemo(() => {
    let guardedCount = 0;
    let violationCount = 0;
    dataset.cabs.forEach((c) => {
      const sec = evaluateCabSecurity(c, dispatchType);
      if (sec.hasGuard) guardedCount++;
      if (!sec.isCompliant) violationCount++;
    });
    return { guardedCount, violationCount };
  }, [dataset.cabs, dispatchType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[92vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                Live Cab Fleet & Route Dispatch Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Driver telemetry • Security escorts • OTP boarding verification • Shift: {dispatchType === 'pickup' ? 'Login (To Office)' : 'Logout (From Office)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Operational Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-mono">
          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Active Cabs</span>
              <span className="text-sm font-bold text-yellow-400">{dataset.cabs.length} Cabs</span>
            </div>
            <Radio className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Guarded Cabs</span>
            <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {stats.guardedCount} Escorted
            </span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Safety Violations</span>
            <span className="text-sm font-bold text-amber-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> {stats.violationCount} Flagged
            </span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Passengers Boarded (OTP)</span>
            <span className="text-sm font-bold text-sky-400">
              {dataset.employees.filter((e) => e.boardingStatus === 'boarded').length} / {dataset.employees.length}
            </span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">Unassigned Pool</span>
            <span className="text-sm font-bold text-slate-300">{unassignedEmployees.length} Employees</span>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="p-3 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'all'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Cabs ({dataset.cabs.length})
            </button>

            <button
              onClick={() => setFilterTab('guarded')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                filterTab === 'guarded'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Guarded ({stats.guardedCount})</span>
            </button>

            <button
              onClick={() => setFilterTab('violations')}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1 ${
                filterTab === 'violations'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>Safety Flags ({stats.violationCount})</span>
            </button>

            <button
              onClick={() => setFilterTab('full')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'full'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Full 3/3
            </button>

            <button
              onClick={() => setFilterTab('available')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'available'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Available (&lt;3)
            </button>

            <button
              onClick={() => setFilterTab('unassigned')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterTab === 'unassigned'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Unassigned ({unassignedEmployees.length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search cab, driver, passenger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 text-xs font-mono"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {filterTab === 'unassigned' ? (
            /* Unassigned Pool */
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Unassigned Employees Requiring Cab Allocation ({filteredUnassigned.length})</span>
                <span className="text-amber-400 text-[11px]">Assign route number to add passenger to cab</span>
              </div>

              {filteredUnassigned.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-mono">
                  All employees are assigned to a cab route!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredUnassigned.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{emp.name}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            emp.gender === 'female'
                              ? 'bg-pink-950 text-pink-300 border border-pink-700/50'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {emp.gender}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {emp.id} • {emp.clusterArea}
                      </div>

                      {/* Quick Assign Form */}
                      <div className="pt-2 border-t border-slate-700 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Route (e.g. R-01)"
                          value={quickAssignRoute[emp.id] || ''}
                          onChange={(e) =>
                            setQuickAssignRoute((prev) => ({
                              ...prev,
                              [emp.id]: e.target.value.toUpperCase(),
                            }))
                          }
                          className="flex-1 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-white uppercase font-mono focus:border-sky-500 focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            const val = (quickAssignRoute[emp.id] || '').trim();
                            if (val) {
                              onAssignEmployeeRoute(emp.id, val);
                              setQuickAssignRoute((prev) => ({ ...prev, [emp.id]: '' }));
                            }
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>Assign</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Active Cab Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCabs.map((cab) => {
                const count = cab.passengers.length;
                const isFull = count === 3;
                const isOver = count > 3;
                const sec = evaluateCabSecurity(cab, dispatchType);

                return (
                  <div
                    key={cab.routeNumber}
                    className={`rounded-xl border p-3.5 space-y-3 transition shadow-lg ${
                      !sec.isCompliant
                        ? 'bg-amber-950/15 border-amber-800/80 ring-1 ring-amber-700/50'
                        : isOver
                        ? 'bg-rose-950/20 border-rose-800'
                        : isFull
                        ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-800/60 border-slate-700/80'
                    }`}
                  >
                    {/* Cab Card Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center font-bold font-mono text-xs ${
                            sec.hasGuard
                              ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400'
                              : !sec.isCompliant
                              ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400'
                              : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                          }`}
                        >
                          {cab.routeNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white font-mono">
                              {cab.vehicleNumber}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {cab.cabModel}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold block ${
                            isFull
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {count} / 3 Seats
                        </span>

                        {sec.hasGuard && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" /> Guarded
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Security Escort Card (if assigned) */}
                    {cab.guard && (
                      <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60 text-xs font-mono space-y-1">
                        <div className="flex items-center justify-between text-emerald-300 text-[11px]">
                          <span className="font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Escort: {cab.guard.name}</span>
                          </span>
                          <span className="text-[10px] text-emerald-400">{cab.guard.badgeNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>{cab.guard.agency}</span>
                          <a href={`tel:${cab.guard.phone}`} className="text-emerald-400 hover:underline flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {cab.guard.phone}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Security Warning (if violated) */}
                    {!sec.isCompliant && (
                      <div className="p-2 rounded bg-amber-950/50 border border-amber-700 text-amber-300 text-[11px] flex items-start gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Security Violation Flag:</div>
                          <div className="text-[10px] text-amber-200">{sec.violationReason}</div>
                        </div>
                      </div>
                    )}

                    {/* Driver Card & Telemetry */}
                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300 text-[11px]">
                        <span>Driver: <strong className="text-white">{cab.driver.name}</strong></span>
                        <a
                          href={`tel:${cab.driver.phone}`}
                          className="text-sky-400 hover:underline text-[10px] flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" /> {cab.driver.phone}
                        </a>
                      </div>

                      {cab.nextStop && (
                        <div className="text-[10px] text-yellow-300 flex items-center justify-between pt-1 border-t border-slate-800/80">
                          <span className="flex items-center gap-1 truncate max-w-[170px]">
                            <Navigation className="w-3 h-3 flex-shrink-0" />
                            <span>Next: {cab.nextStop.employeeName}</span>
                          </span>
                          <span className="text-slate-400">ETA ~{cab.nextStop.etaMinutes}m</span>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 flex justify-between">
                        <span>{cab.metrics.coveredKm} km covered</span>
                        <span>{cab.metrics.remainingKm} km left</span>
                      </div>
                    </div>

                    {/* Passenger Stops with OTP Status */}
                    <div className="space-y-1.5 text-xs">
                      {cab.passengers.map((p, idx) => {
                        const isBoarded = p.boardingStatus === 'boarded';
                        return (
                          <div
                            key={p.id}
                            className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-[9px] flex items-center justify-center border border-slate-700">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="font-medium text-slate-200 text-[11px] leading-tight flex items-center gap-1">
                                  <span>{p.name}</span>
                                  <span
                                    className={`text-[8px] font-bold uppercase px-1 rounded ${
                                      p.gender === 'female'
                                        ? 'bg-pink-950 text-pink-300 border border-pink-800'
                                        : 'text-slate-400'
                                    }`}
                                  >
                                    {p.gender === 'female' ? '♀' : '♂'}
                                  </span>
                                </div>
                                <div className="text-[9px] text-slate-400 truncate max-w-[140px]">
                                  {p.clusterArea}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onToggleBoardingStatus && onToggleBoardingStatus(p.id)}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold flex items-center gap-1 transition ${
                                  isBoarded
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                    : 'bg-amber-950 text-amber-300 border border-amber-700'
                                }`}
                                title="Click to verify OTP and toggle boarded state"
                              >
                                {isBoarded ? '✓ Boarded' : 'OTP Await'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Footer */}
                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <span className={`text-[10px] font-mono flex items-center gap-1 ${
                        sec.hasGuard ? 'text-emerald-400' : !sec.isCompliant ? 'text-amber-400' : 'text-slate-400'
                      }`}>
                        {sec.hasGuard ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Escort Protected</span>
                          </>
                        ) : !sec.isCompliant ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Guard Required</span>
                          </>
                        ) : (
                          <span>Standard Cab</span>
                        )}
                      </span>

                      <button
                        onClick={() => {
                          onSelectRouteOnMap(cab.routeNumber);
                          onClose();
                        }}
                        className="text-[11px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
                      >
                        <span>View on Map</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>FLEET OPERATIONS DISPATCH CONSOLE • REAL-TIME TELEMETRY</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close Overview
          </button>
        </div>
      </div>
    </div>
  );
};
