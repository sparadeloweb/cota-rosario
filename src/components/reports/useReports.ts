"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { REPORT_TYPES, type Report, type ReportType } from "@/lib/reportTypes";
import { escapeHtml } from "@/lib/html";
import { loadLeaflet } from "@/lib/leaflet";

const API = "/api/reports";
const REFRESH_MS = 60_000;
const MARKER_SIZE = 26;

export interface ReportDraft {
  lat: number;
  lon: number;
  type: ReportType;
  description: string;
}

export interface ReportsState {
  reports: Report[];
  placing: boolean;
  draft: ReportDraft | null;
  sending: boolean;
  error: string | null;
  available: boolean | null;
  confirmed: string[];
  confirming: string | null;
  startPlacing: () => void;
  cancel: () => void;
  updateDraft: (changes: Partial<ReportDraft>) => void;
  submit: () => Promise<void>;
  confirm: (id: string) => Promise<void>;
}

export function howLongAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) {
    return "recién";
  }
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  return `hace ${hours} h`;
}

export async function fetchReports(): Promise<Report[]> {
  const response = await fetch(API, { cache: "no-store" });
  const data = (await response.json()) as { ok: boolean; reports?: Report[] };
  if (!response.ok || !data.ok || !Array.isArray(data.reports)) throw new Error("Reportes no disponibles");
  return data.reports;
}

function markerHtml(type: ReportType): string {
  const color = REPORT_TYPES[type].color;
  return `<svg viewBox="0 0 24 24" width="${MARKER_SIZE}" height="${MARKER_SIZE}" aria-hidden="true"><path d="M12 2.5c3.6 4.6 6.5 8.3 6.5 12a6.5 6.5 0 1 1-13 0c0-3.7 2.9-7.4 6.5-12Z" fill="${color}" stroke="#0b0c0e" stroke-width="1.5"/></svg>`;
}

export function useReports(mapRef: RefObject<import("leaflet").Map | null>, mapReady: boolean): ReportsState {
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const draftMarkerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [placing, setPlacing] = useState(false);
  const [draft, setDraft] = useState<ReportDraft | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);
  const confirmationPending = useRef(false);

  useEffect(() => {
    let active = true;
    const load = () =>
      fetchReports()
        .then((list) => {
          if (active) {
            setReports(list);
            setAvailable(true);
            setError((current) => current === "No se pudieron cargar los reportes de vecinos." ? null : current);
          }
        })
        .catch(() => {
          if (active) {
            setError("No se pudieron cargar los reportes de vecinos.");
            setAvailable(false);
            setReports([]);
          }
        });
    load();
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) {
      return;
    }
    loadLeaflet().then((L) => {
      if (!layerRef.current) {
        layerRef.current = L.layerGroup().addTo(map);
      }
      layerRef.current.clearLayers();
      for (const report of reports) {
        const icon = L.divIcon({ className: "report-marker", html: markerHtml(report.type), iconSize: [MARKER_SIZE, MARKER_SIZE], iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE] });
        const detail = report.description ? `<br/><span class="report-desc">${escapeHtml(report.description)}</span>` : "";
        const confirmations = report.confirmations > 0 ? ` · ${report.confirmations} confirm.` : "";
        L.marker([report.lat, report.lon], { icon })
          .bindTooltip(`<strong>${REPORT_TYPES[report.type].label}</strong> · ${howLongAgo(report.createdAt)}${confirmations}${detail}`, { direction: "top", offset: [0, -MARKER_SIZE] })
          .addTo(layerRef.current);
      }
    });
  }, [mapRef, mapReady, reports]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || !placing) {
      return undefined;
    }
    const container = map.getContainer();
    container.style.cursor = "crosshair";
    const onClick = (event: import("leaflet").LeafletMouseEvent) => {
      const { lat, lng } = event.latlng;
      setDraft((current) => ({ lat, lon: lng, type: current?.type ?? "street", description: current?.description ?? "" }));
      loadLeaflet().then((L) => {
        draftMarkerRef.current?.remove();
        draftMarkerRef.current = L.circleMarker([lat, lng], { radius: 9, color: "#eceef1", weight: 2, fillColor: "#5f9bb8", fillOpacity: 0.9 }).addTo(map);
      });
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      container.style.cursor = "";
    };
  }, [mapRef, mapReady, placing]);

  const clearDraft = useCallback(() => {
    draftMarkerRef.current?.remove();
    draftMarkerRef.current = null;
    setDraft(null);
  }, []);

  const startPlacing = useCallback(() => {
    setError(null);
    setPlacing(true);
  }, []);

  const cancel = useCallback(() => {
    setPlacing(false);
    clearDraft();
  }, [clearDraft]);

  const updateDraft = useCallback((changes: Partial<ReportDraft>) => {
    setDraft((current) => (current ? { ...current, ...changes } : current));
  }, []);

  const submit = useCallback(async () => {
    if (!draft) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      const response = await fetch(API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, web: "" }) });
      const data = (await response.json()) as { ok: boolean; error?: string; report?: Report };
      if (!data.ok || !data.report) {
        setError(data.error ?? "No se pudo enviar el reporte.");
        return;
      }
      setReports((current) => [data.report as Report, ...current]);
      setPlacing(false);
      clearDraft();
    } catch {
      setError("No se pudo enviar el reporte. Probá de nuevo.");
    } finally {
      setSending(false);
    }
  }, [draft, clearDraft]);

  const confirm = useCallback(async (id: string) => {
    if (confirmationPending.current || confirmed.includes(id)) return;
    confirmationPending.current = true;
    setConfirming(id);
    try {
      const response = await fetch(`${API}/${id}/confirm`, { method: "POST" });
      const data = (await response.json()) as { ok: boolean; error?: string; report?: Report };
      if (!data.ok || !data.report) {
        setError(data.error ?? "No se pudo confirmar.");
        return;
      }
      setReports((current) => current.map((report) => (report.id === id ? (data.report as Report) : report)));
      setConfirmed((current) => [...current, id]);
    } catch {
      setError("No se pudo confirmar. Probá de nuevo.");
    } finally {
      confirmationPending.current = false;
      setConfirming(null);
    }
  }, [confirmed]);

  return { reports, placing, draft, sending, error, available, confirmed, confirming, startPlacing, cancel, updateDraft, submit, confirm };
}
