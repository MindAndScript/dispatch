'use client';

import React, { useEffect, useState } from 'react';
import { SosAlert } from '../types/dispatch';
import { playEmergencySiren, stopEmergencySiren } from '../utils/soundAlert';
import {
  AlertOctagon,
  Phone,
  PhoneCall,
  Volume2,
  VolumeX,
  CheckCircle,
  MapPin,
  Car,
  User,
  Shield,
  Clock,
  Radio,
  ShieldAlert,
  BellOff,
  CheckCheck,
} from 'lucide-react';

interface SosEmergencyModalProps {
  alert: SosAlert | null;
  onSilence: () => void;
  onAcknowledge: () => void;
  onResolve: () => void;
}

export const SosEmergencyModal: React.FC<SosEmergencyModalProps> = ({
  alert,
  onSilence,
  onAcknowledge,
  onResolve,
}) => {
  const [sirenMuted, setSirenMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Play siren audio on alert trigger if not yet acknowledged/silenced
  useEffect(() => {
    if (alert && alert.status === 'active') {
      playEmergencySiren();

      const timer = setInterval(() => {
        setElapsedSeconds((sec) => sec + 1);
      }, 1000);

      return () => {
        clearInterval(timer);
        stopEmergencySiren();
      };
    } else {
      stopEmergencySiren();
    }
  }, [alert]);

  const toggleSiren = () => {
    if (sirenMuted) {
      playEmergencySiren();
      setSirenMuted(false);
    } else {
      stopEmergencySiren();
      setSirenMuted(true);
      onSilence();
    }
  };

  const handleAcknowledge = () => {
    stopEmergencySiren();
    setSirenMuted(true);
    onAcknowledge();
  };

  const handleResolve = () => {
    stopEmergencySiren();
    onResolve();
  };

  if (!alert) return null;

  const { employee, cab, location, incidentId, timestamp, status, acknowledgedAt } = alert;
  const isAcknowledged = status === 'acknowledged' || status === 'silenced';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-red-950/40 backdrop-blur-md animate-in fade-in duration-200">
      {/* Blinking Red Emergency HUD Card */}
      <div className="w-full max-w-2xl bg-slate-950 border-2 border-red-500 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.5)] overflow-hidden flex flex-col text-slate-100 ring-4 ring-red-600/30">
        
        {/* Emergency Header */}
        <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <AlertOctagon className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-widest font-black bg-black/30 px-2 py-0.5 rounded">
                  PRIORITY 1 CRITICAL
                </span>
                <span className="text-xs font-mono opacity-90">ID: {incidentId}</span>
              </div>
              <h2 className="text-lg font-black tracking-wide uppercase font-mono">
                🚨 IN-CAB SOS PANIC ALARM ACTIVATED
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSiren}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm ${
                sirenMuted
                  ? 'bg-amber-500 hover:bg-amber-400 text-black'
                  : 'bg-black/40 hover:bg-black/60 text-white'
              }`}
              title="Toggle emergency audio siren"
            >
              {sirenMuted ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Unmute Siren</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 animate-pulse text-amber-300" />
                  <span>Silence Siren</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Status / Acknowledged Banner */}
        <div className={`px-5 py-2.5 flex items-center justify-between text-xs font-mono border-b ${
          isAcknowledged
            ? 'bg-emerald-950/80 border-emerald-900/60 text-emerald-200'
            : 'bg-red-950/80 border-red-900/60 text-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {isAcknowledged ? (
              <>
                <CheckCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">
                  ALARM SUPPRESSED & ACKNOWLEDGED BY ADMIN {acknowledgedAt ? `(${acknowledgedAt})` : ''}
                </span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-red-400 animate-ping" />
                <span>Incident Live: {elapsedSeconds}s elapsed • Urgent Action Required</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>Reported: {timestamp}</span>
          </div>
        </div>

        {/* Incident Details Grid */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Passenger in Distress Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-red-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Passenger in Distress (SOS Sender)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-red-950 text-red-300 border border-red-800">
                {employee.gender} • Boarded
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <div className="text-base font-bold text-white">{employee.name}</div>
                <div className="text-xs text-slate-400 font-mono">
                  {employee.id} • {employee.department || 'Identity Resolution'}
                </div>
                <div className="text-xs text-slate-300 mt-1 truncate">
                  Address: {employee.address || employee.clusterArea}
                </div>
              </div>

              <div className="flex flex-col justify-center sm:items-end gap-1.5 font-mono text-xs">
                <a
                  href={`tel:${employee.phone || '+919848011223'}`}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold flex items-center gap-1.5 transition shadow"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Passenger ({employee.phone || '+91 98480...'})</span>
                </a>
              </div>
            </div>
          </div>

          {/* Vehicle & Driver Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cab Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-yellow-400 font-bold flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Transport Vehicle
              </span>
              <div>
                <div className="text-sm font-mono font-bold text-yellow-300">
                  {cab.vehicleNumber} ({cab.routeNumber})
                </div>
                <div className="text-xs text-slate-300">{cab.cabModel}</div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  Speed/Telemetry: Active • Next: {cab.nextStop?.employeeName || 'HQ'}
                </div>
              </div>
            </div>

            {/* Driver Card */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Designated Driver
              </span>
              <div>
                <div className="text-sm font-bold text-white">{cab.driver.name}</div>
                <div className="text-xs text-slate-400 font-mono">Rating: {cab.driver.rating || 4.8} ★</div>
                <a
                  href={`tel:${cab.driver.phone}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950 text-sky-300 hover:bg-sky-900 border border-sky-800 font-mono text-xs transition"
                >
                  <PhoneCall className="w-3 h-3 text-sky-400" />
                  <span>Call Driver: {cab.driver.phone}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Security Guard & Telemetry Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Guard Status */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Security Guard Escort
              </span>
              {cab.guard ? (
                <div>
                  <div className="text-sm font-bold text-emerald-300">{cab.guard.name}</div>
                  <div className="text-xs text-slate-300">
                    {cab.guard.agency} • Badge: <span className="font-mono text-white">{cab.guard.badgeNumber}</span>
                  </div>
                  <a
                    href={`tel:${cab.guard.phone}`}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono hover:underline"
                  >
                    <Phone className="w-3 h-3" /> Call Guard: {cab.guard.phone}
                  </a>
                </div>
              ) : (
                <div className="text-xs text-amber-300 flex items-center gap-1.5 bg-amber-950/40 p-2 rounded border border-amber-800/40">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>No security guard assigned to this cab</span>
                </div>
              )}
            </div>

            {/* GPS Telemetry */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Live GPS Coordinates
              </span>
              <div>
                <div className="text-sm font-mono font-bold text-white">
                  {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E
                </div>
                <div className="text-xs text-slate-300 truncate">
                  Near: {location.area || employee.clusterArea}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Accuracy: ±3m • Real-time GPS stream
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Footer (with Suppress/Acknowledge Button) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
            {/* Dial Police */}
            <a
              href="tel:112"
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>POLICE (112)</span>
            </a>

            {/* Suppress & Acknowledge Button */}
            <button
              onClick={handleAcknowledge}
              className={`px-3.5 py-2 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-1.5 border transition ${
                isAcknowledged
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                  : 'bg-amber-600 hover:bg-amber-500 text-black border-amber-500 shadow-md'
              }`}
              title="Silence siren audio and acknowledge receipt of the emergency panic alert"
            >
              {isAcknowledged ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span>Acknowledged & Suppressed</span>
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4" />
                  <span>Suppress & Acknowledge Alert</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleResolve}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>RESOLVE & CLEAR ALARM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
