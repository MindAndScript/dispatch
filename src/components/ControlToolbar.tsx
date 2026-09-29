'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { DispatchDataset, SosAlert, WallMapTheme } from '../types/dispatch';
import { DispatchType, OperationMode } from '../types/config';
import { evaluateCabSecurity } from '../utils/security';
import {
  Compass,
  Layers,
  FileJson,
  Users,
  Car,
  LayoutGrid,
  Settings,
  Building,
  Home,
  ArrowRight,
  Radio,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface ControlToolbarProps {
  dataset: DispatchDataset;
  theme: WallMapTheme;
  onChangeTheme: (theme: WallMapTheme) => void;
  gridDensity: 'sparse' | 'normal' | 'dense';
  onChangeGridDensity: (density: 'sparse' | 'normal' | 'dense') => void;
  filterGender: 'all' | 'female' | 'male';
  onChangeFilterGender: (gender: 'all' | 'female' | 'male') => void;
  filterRoute?: string;
  onChangeFilterRoute?: (route: string) => void;
  dispatchType: DispatchType;
  onChangeDispatchType: (type: DispatchType) => void;
  operationMode: OperationMode;
  highlightOverlapsOnly: boolean;
  onToggleHighlightOverlaps: () => void;
  searchQuery?: string;
  onChangeSearchQuery?: (query: string) => void;
  onOpenJsonModal: () => void;
  onOpenFleetModal: () => void;
  totalUniqueNodes: number;
  multiOccupantNodes: number;
  activeSosAlert?: SosAlert | null;
  onTriggerDemoSos?: () => void;
  onOpenSosModal?: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  dataset,
  theme,
  onChangeTheme,
  gridDensity,
  onChangeGridDensity,
  filterGender,
  onChangeFilterGender,
  filterRoute,
  onChangeFilterRoute,
  dispatchType,
  onChangeDispatchType,
  operationMode,
  highlightOverlapsOnly,
  onToggleHighlightOverlaps,
  searchQuery,
  onChangeSearchQuery,
  onOpenJsonModal,
  onOpenFleetModal,
  totalUniqueNodes,
  multiOccupantNodes,
  activeSosAlert,
  onTriggerDemoSos,
  onOpenSosModal,
}) => {
  const distinctRoutes = useMemo(() => {
    const set = new Set<string>();
    dataset.employees.forEach((e) => {
      if (e.routeNumber) set.add(e.routeNumber);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [dataset.employees]);

  // Security calculations
  const securityStats = useMemo(() => {
    let guarded = 0;
    let violations = 0;
    dataset.cabs.forEach((cab) => {
      const sec = evaluateCabSecurity(cab, dispatchType);
      if (sec.hasGuard) guarded++;
      if (!sec.isCompliant) violations++;
    });
    return { guarded, violations };
  }, [dataset.cabs, dispatchType]);

  return (
    <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-slate-200">
      {/* Title, Direction Toggle & Live/Demo Mode Flag */}
      <div className="flex items-center flex-wrap gap-3">
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold font-mono text-sm shadow-inner">
          <Compass className="w-5 h-5 animate-pulse" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-wide text-white font-mono uppercase">
              Dispatch Wall Map
            </h1>

            {/* Mode Flag */}
            <Link
              href="/settings"
              title="Click to change settings / toggle demo or live mode"
              className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border transition flex items-center gap-1 ${
                operationMode === 'live'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900'
                  : 'bg-emerald-950/80 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${operationMode === 'live' ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`} />
              <span>{operationMode === 'live' ? 'LIVE API' : 'DEMO MODE'}</span>
            </Link>
          </div>
          <p className="text-[11px] text-slate-400">
            {dataset.region.city} • <span className="text-sky-300 font-semibold">{dataset.office.name}</span>
          </p>
        </div>

        {/* High Level Tracking Direction (Pickup vs Drop off) */}
        {/* REQUIREMENT: In live mode, toggle is hidden as info comes from URL. Only shown in demo mode. */}
        {operationMode === 'demo' ? (
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 font-mono text-xs ml-0 sm:ml-2">
            <button
              onClick={() => onChangeDispatchType('pickup')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition ${
                dispatchType === 'pickup'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Pickup Dispatch: Employees coming TO office (Login shift)"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Login (To Office)</span>
            </button>

            <button
              onClick={() => onChangeDispatchType('drop')}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition ${
                dispatchType === 'drop'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Drop off Dispatch: Employees going FROM office (Logout shift)"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Logout (From Office)</span>
            </button>
          </div>
        ) : (
          /* Live Mode: Read-only shift badge parsed directly from URL */
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs ml-0 sm:ml-2 text-slate-300 shadow-inner">
            {dispatchType === 'pickup' ? (
              <>
                <Building className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-300 font-semibold text-[11px]">Shift: Login (To Office)</span>
              </>
            ) : (
              <>
                <Home className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-300 font-semibold text-[11px]">Shift: Logout (From Office)</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center Fleet Metrics & SOS Demo Trigger */}
      <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
        <button
          onClick={onOpenFleetModal}
          className="px-2.5 py-1 rounded-md bg-sky-950/80 hover:bg-sky-900 border border-sky-600/50 flex items-center gap-1.5 text-sky-300 transition shadow-sm font-semibold"
          title="Open Dedicated Fleet Routes Matrix"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-sky-400" />
          <span>Fleet Matrix ({distinctRoutes.length} Cabs)</span>
        </button>

        {/* Security Guard / Compliance summary chip */}
        <div
          onClick={onOpenFleetModal}
          className="cursor-pointer px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5"
          title={`${securityStats.guarded} cabs have assigned security escort guards. ${securityStats.violations} cabs require a guard.`}
        >
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> {securityStats.guarded}
          </span>
          <span className="text-slate-500">•</span>
          <span className={`font-bold flex items-center gap-1 ${securityStats.violations > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            <ShieldAlert className="w-3.5 h-3.5" /> {securityStats.violations} Flags
          </span>
        </div>

        {/* SOS Panic Alarm Trigger Button (Demo Mode Only, or Active in Live/Demo) */}
        {activeSosAlert ? (
          <button
            onClick={onOpenSosModal}
            className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-bounce border border-white"
            title="View Active Emergency Incident Details"
          >
            <AlertOctagon className="w-3.5 h-3.5 animate-spin" />
            <span>🚨 SOS ACTIVE ({activeSosAlert.cab.routeNumber})</span>
          </button>
        ) : operationMode === 'demo' ? (
          <button
            onClick={onTriggerDemoSos}
            className="px-2.5 py-1 rounded-md bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-700/60 font-mono text-xs flex items-center gap-1.5 transition font-semibold"
            title="Trigger an in-cab SOS Panic Alarm demo (siren, red strobe, popup)"
          >
            <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
            <span>🚨 Trigger SOS Demo</span>
          </button>
        ) : null}

        <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5" title="Total scheduled employees">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Roster:</span>
          <span className="font-bold text-white">{dataset.employees.length}</span>
        </div>
      </div>

      {/* Right Controls: Gender Filter, Overlaps & Settings */}
      <div className="flex items-center flex-wrap gap-2 text-xs">
        {/* Gender Filter */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={() => onChangeFilterGender('all')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              filterGender === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onChangeFilterGender('female')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              filterGender === 'female'
                ? 'bg-pink-950 text-pink-300 border border-pink-700/60 font-semibold'
                : 'text-slate-400 hover:text-pink-300'
            }`}
            title="Inspect female candidates (safety rules)"
          >
            ♀
          </button>
          <button
            onClick={() => onChangeFilterGender('male')}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              filterGender === 'male'
                ? 'bg-slate-800 text-slate-200 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ♂
          </button>
        </div>

        {/* Toggle Overlaps Only */}
        <button
          onClick={onToggleHighlightOverlaps}
          className={`px-2 py-1.5 rounded-md border text-[11px] font-medium transition flex items-center gap-1 ${
            highlightOverlapsOnly
              ? 'bg-blue-900/60 border-blue-500 text-blue-200'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Filter map to only show multi-occupant overlapping coordinates"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overlaps</span>
        </button>

        {/* Settings Page Link */}
        <Link
          href="/settings"
          className="px-2.5 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-mono flex items-center gap-1.5 transition"
          title="Configure API endpoints and switch Demo/Live mode"
        >
          <Settings className="w-3.5 h-3.5 text-sky-400" />
          <span>Settings</span>
        </Link>
      </div>
    </header>
  );
};
