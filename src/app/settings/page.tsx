'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppConfig } from '../../types/config';
import {
  ArrowLeft,
  Save,
  Check,
  Radio,
  Server,
  Key,
  Globe,
  FileCode,
  Copy,
  Eye,
  EyeOff,
  Database,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load configuration from API / local file
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setConfig(data);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load config', err);
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save config', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyJson = (id: string, obj: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUpdateEndpointPath = (index: number, newPath: string) => {
    if (!config) return;
    const updated = [...config.endpoints];
    updated[index].configuredPath = newPath;
    setConfig({ ...config, endpoints: updated });
  };

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-mono">
        <div className="flex items-center gap-2 text-sky-400">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>LOADING SYSTEM CONFIGURATIONS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 font-sans flex flex-col overflow-y-auto">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Wall Map</span>
          </Link>

          <div>
            <h1 className="font-bold text-base text-white font-mono uppercase tracking-wide flex items-center gap-2">
              <span>Configurations & API Registry</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  config.mode === 'live'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                }`}
              >
                {config.mode === 'live' ? '🔴 LIVE API MODE' : '🟢 DEMO MODE'}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage data source modes, backend endpoints, and inspect required JSON payloads
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Saved to local apiConfig.json!</span>
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition shadow-lg disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </header>

      {/* Main Form Body with generous bottom padding for smooth scrolling */}
      <main className="max-w-5xl w-full mx-auto p-6 pb-24 space-y-8 flex-1">
        {/* Section 1: Operation Mode Switcher */}
        <section className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>1. Data Ingestion Mode</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle between standalone offline presentation demo and live backend API telemetry
              </p>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'demo' })}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  config.mode === 'demo'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Demo Mode (Dummy Data)
              </button>
              <button
                type="button"
                onClick={() => setConfig({ ...config, mode: 'live' })}
                className={`px-4 py-2 rounded-md font-semibold transition ${
                  config.mode === 'live'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live API Mode
              </button>
            </div>
          </div>

          <div
            className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
              config.mode === 'demo'
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>
                {config.mode === 'demo'
                  ? 'Currently Active: Demo Presentation Mode'
                  : 'Currently Active: Live API Mode'}
              </strong>
              <p className="text-slate-400 text-[11px]">
                {config.mode === 'demo'
                  ? 'The dispatch wall map will use the curated 100-passenger Telangana/Hyderabad dataset centered on the Corporate Facility (Aparna Technopolis). Ideal for product demonstrations without network dependencies.'
                  : 'The dispatch wall map will fetch real-time active dispatch rosters, GPS beacons, and OTP boarding states from your configured Base URL.'}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: API Gateway Credentials */}
        <section className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              <span>2. API Gateway & Authentication</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify your backend server URL and authorization credentials
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Base API Server URL</span>
              </label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                placeholder="https://api.yourdomain.com/v1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
              />
              <span className="text-[10px] text-slate-500 block font-mono">
                All endpoint paths below will be appended to this Base URL
              </span>
            </div>

            {/* Auth Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-yellow-400" />
                <span>Authorization Token (Bearer / API Key)</span>
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.authToken}
                  onChange={(e) => setConfig({ ...config, authToken: e.target.value })}
                  placeholder="Bearer token or secret key..."
                  className="w-full pl-3 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">
                Sent as Authorization: Bearer &lt;token&gt; header
              </span>
            </div>
          </div>
        </section>

        {/* Section 3: Endpoints & Payload Registry */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white font-mono uppercase flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              <span>3. API Endpoints Catalog & JSON Schemas</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure the specific path for each operation and inspect the required JSON contracts
            </p>
          </div>

          <div className="space-y-4">
            {config.endpoints.map((ep, idx) => (
              <div
                key={ep.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 shadow-lg"
              >
                {/* Endpoint Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                        ep.method === 'GET'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : ep.method === 'POST'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="font-bold text-sm text-white font-mono">{ep.name}</span>
                  </div>

                  {/* Configurable Path Input */}
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="text-slate-500 text-[11px]">{config.baseUrl}</span>
                    <input
                      type="text"
                      value={ep.configuredPath}
                      onChange={(e) => handleUpdateEndpointPath(idx, e.target.value)}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded text-sky-300 focus:outline-none focus:border-sky-500 font-mono text-xs w-48 sm:w-60"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{ep.description}</p>

                {/* Request Schema (if POST/PATCH) */}
                {ep.requestSchema && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Expected Request Payload (Body)</span>
                      <button
                        onClick={() => handleCopyJson(`${ep.id}-req`, ep.requestSchema)}
                        className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedId === `${ep.id}-req` ? 'Copied!' : 'Copy Schema'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40 leading-tight">
                      {JSON.stringify(ep.requestSchema, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Response Schema */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Expected API Response Schema</span>
                    <button
                      onClick={() => handleCopyJson(`${ep.id}-res`, ep.responseSchema)}
                      className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === `${ep.id}-res` ? 'Copied!' : 'Copy Schema'}</span>
                    </button>
                  </div>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto max-h-48 leading-tight">
                    {JSON.stringify(ep.responseSchema, null, 2)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Remote Database Sync Note */}
        <section className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-1.5 font-mono">
          <div className="text-slate-300 font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-sky-400" />
            <span>Persistence & Database Storage</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Changes made on this page are stored in the local <code className="text-slate-200">src/data/apiConfig.json</code> file.
            When connecting to a remote PostgreSQL / MongoDB database, the backend can sync this object through the <code className="text-sky-400">POST /config</code> endpoint listed above.
          </p>
        </section>
      </main>
    </div>
  );
}
