'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { SAMPLE_POIS, POI_CONFIG, type POI, type POIType } from '@/data/pois';
import { SAMPLE_HAZARDS, HAZARD_CONFIG, type Hazard, type HazardType } from '@/data/hazards';
import { DEPTH_ZONES, DEPTH_GEOJSON } from '@/data/depth-zones';
import { findWaterRoute, type RouteResult } from '@/lib/water-router';
import {
  IconNavigation, IconGps, IconWaves, IconWarning, IconPin,
  IconAlert, IconCamera, IconChat, IconCheck, IconFlag, IconX, IconPlus, IconLayers,
  POI_ICONS, HAZARD_ICONS,
} from '@/components/Icons';

const LANIER_CENTER: [number, number] = [-84.035, 34.195];
const LANIER_ZOOM = 12;
const FULL_POOL = 1071.0;

// SVG icon strings for map markers (can't use React components in DOM elements)
const MARKER_SVG: Record<string, string> = {
  boat_ramp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M2 21l3-3h4l3-9 3 9h4l3 3"/><path d="M12 3v6"/></svg>',
  marina: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="8" x2="12" y2="22"/><path d="M5 12H2a10 10 0 0020 0h-3"/></svg>',
  dock: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="4" y="8" width="16" height="4" rx="1"/><line x1="6" y1="12" x2="6" y2="20"/><line x1="18" y1="12" x2="18" y2="20"/></svg>',
  rope_swing: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M6 2c4 0 4 4 4 8"/><circle cx="10" cy="14" r="4"/></svg>',
  beach: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M17.5 19c-2.5 0-2.5 2-5 2s-2.5-2-5-2"/><circle cx="16" cy="5" r="3"/><line x1="16" y1="8" x2="16" y2="19"/></svg>',
  island: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M12 3c-1 4-4 6-4 10a4 4 0 008 0c0-4-3-6-4-10z"/><path d="M4 20c3-1 6-1 8-1s5 0 8 1"/></svg>',
  fishing: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M18 2l-2 8h4l-2-8z"/><path d="M18 10v8a4 4 0 01-8 0"/><circle cx="10" cy="20" r="2"/></svg>',
  fuel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="6" width="12" height="16" rx="1"/><path d="M15 10h2a2 2 0 012 2v4a2 2 0 002 2 2 2 0 002-2V9l-3-3"/></svg>',
  restaurant: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>',
  submerged_tree: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M12 22V8"/><path d="M5 12l7-8 7 8"/></svg>',
  rock: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><polygon points="2 18 6 10 10 14 14 6 18 10 22 18 2 18"/></svg>',
  shallow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>',
  stump_field: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="6" y="8" width="12" height="14" rx="2"/><path d="M8 8V5a4 4 0 018 0v3"/></svg>',
  debris: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="6" rx="1"/><path d="M12 3v8"/></svg>',
  no_wake: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
  campground: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 20h20L12 2z"/><path d="M12 10v4"/></svg>',
  park: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M12 22V8"/><path d="M5 12l7-8 7 8"/><path d="M3 22h18"/></svg>',
};

interface WaterLevelData { elevation_ft: number | null; full_pool_ft: number; below_full_pool_ft: number | null; status: string; timestamp: string | null; site_name: string; }
interface NavWaypoint { lng: number; lat: number; name?: string; }
interface PendingPin { lng: number; lat: number; type: 'poi' | 'hazard'; }
type CreatePinMode = null | 'poi' | 'hazard';

function formatTime(iso: string | null): string { if (!iso) return '--'; return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }); }

function haversineNM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3440.065; const dLat = ((lat2 - lat1) * Math.PI) / 180; const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function calcBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos((lat2 * Math.PI) / 180);
  const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) - Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
function bearingToCompass(d: number) { return ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(d / 22.5) % 16]; }

export default function Home() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const gpsMarkerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const createPinModeRef = useRef<CreatePinMode>(null);

  const [poiFilters, setPoiFilters] = useState<Record<string, boolean>>(() => {
    const f: Record<string, boolean> = { hazards: true, depth: false };
    Object.keys(POI_CONFIG).forEach(k => f[k] = true);
    return f;
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<Hazard | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [waterLevel, setWaterLevel] = useState<WaterLevelData>({ elevation_ft: null, full_pool_ft: FULL_POOL, below_full_pool_ft: null, status: 'loading', timestamp: null, site_name: 'Lake Sidney Lanier' });
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsPosition, setGpsPosition] = useState<{ lat: number; lng: number; heading: number | null; speed: number | null } | null>(null);
  const [followMode, setFollowMode] = useState(false);
  const firstFixRef = useRef(false);
  const [navTarget, setNavTarget] = useState<NavWaypoint | null>(null);
  const [navInfo, setNavInfo] = useState<{ distance: string; bearing: string; eta: string } | null>(null);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [createPinMode, setCreatePinMode] = useState<CreatePinMode>(null);
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPinData, setNewPinData] = useState({ name: '', description: '', subtype: '' });
  const [allPOIs, setAllPOIs] = useState<POI[]>(SAMPLE_POIS);
  const [allHazards, setAllHazards] = useState<Hazard[]>(SAMPLE_HAZARDS);
  const [editMode, setEditMode] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const currentLevel = waterLevel.elevation_ft ?? FULL_POOL - 4.87;

  useEffect(() => { createPinModeRef.current = createPinMode; }, [createPinMode]);

  // Fetch live water level
  useEffect(() => {
    async function fetchWL() { try { const r = await fetch('/api/water-level'); const j = await r.json(); if (j.success && j.data.elevation_ft !== null) setWaterLevel(j.data); } catch {} }
    fetchWL(); const i = setInterval(fetchWL, 15 * 60 * 1000); return () => clearInterval(i);
  }, []);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const m = new maplibregl.Map({ container: mapContainer.current, style: { version: 8, sources: { 'esri-sat': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, maxzoom: 19, attribution: 'Esri, Maxar, Earthstar Geographics' } }, layers: [{ id: 'satellite', type: 'raster', source: 'esri-sat' }] }, center: LANIER_CENTER, zoom: LANIER_ZOOM, minZoom: 10, maxZoom: 18, pitch: 0 });
    m.on('load', () => {
      m.addSource('depth-zones', { type: 'geojson', data: DEPTH_GEOJSON });
      DEPTH_ZONES.forEach((zone) => {
        m.addLayer({ id: `depth-${zone.id}`, type: 'fill', source: 'depth-zones', filter: ['==', ['get', 'zone'], zone.id], paint: { 'fill-color': zone.color, 'fill-opacity': zone.opacity } });
        m.addLayer({ id: `depth-${zone.id}-outline`, type: 'line', source: 'depth-zones', filter: ['==', ['get', 'zone'], zone.id], paint: { 'line-color': zone.color, 'line-width': 1.2, 'line-opacity': 0.5 } });
      });
      m.addSource('nav-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} } });
      m.addLayer({ id: 'nav-route-glow', type: 'line', source: 'nav-route', paint: { 'line-color': '#22d3ee', 'line-width': 10, 'line-opacity': 0.12, 'line-blur': 4 } });
      m.addLayer({ id: 'nav-route-line', type: 'line', source: 'nav-route', paint: { 'line-color': '#22d3ee', 'line-width': 3, 'line-dasharray': [3, 2], 'line-opacity': 0.85 } });
      setMapLoaded(true);
    });
    m.on('click', (e) => {
      if (createPinModeRef.current) { setPendingPin({ lng: e.lngLat.lng, lat: e.lngLat.lat, type: createPinModeRef.current }); setShowCreateForm(true); }
    });
    m.on('dragstart', () => setFollowMode(false));
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => { if (map.current) map.current.getCanvas().style.cursor = createPinMode ? 'crosshair' : ''; }, [createPinMode]);

  // GPS
  const toggleGPS = useCallback(() => {
    if (gpsActive) {
      if (followMode) {
        // If already tracking but not following, re-enable follow
        // If already following, turn GPS off entirely
        if (!followMode) { setFollowMode(true); return; }
      }
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null; gpsMarkerRef.current?.remove(); gpsMarkerRef.current = null;
      setGpsActive(false); setGpsPosition(null); setFollowMode(false); firstFixRef.current = false;
    } else {
      if (!navigator.geolocation) return;
      setGpsActive(true); setFollowMode(true); firstFixRef.current = false;
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, heading, speed } = pos.coords;
          setGpsPosition({ lat, lng, heading, speed });
          if (map.current) {
            if (!gpsMarkerRef.current) {
              const el = document.createElement('div'); el.className = 'gps-marker';
              el.innerHTML = '<div class="gps-dot"><div class="gps-heading"></div></div><div class="gps-ring"></div>';
              gpsMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map.current);
            } else { gpsMarkerRef.current.setLngLat([lng, lat]); }
            if (heading !== null) { const h = gpsMarkerRef.current.getElement().querySelector('.gps-heading') as HTMLElement; if (h) h.style.transform = `rotate(${heading}deg)`; }
            // Apple Maps-style: first fix zooms in tight, then follows
            if (!firstFixRef.current) {
              firstFixRef.current = true;
              map.current.flyTo({ center: [lng, lat], zoom: 15.5, duration: 1200 });
            }
          }
        },
        () => setGpsActive(false),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
  }, [gpsActive, followMode]);

  // Apple Maps-style follow mode — smooth tracking
  useEffect(() => {
    if (!followMode || !gpsPosition || !map.current || !firstFixRef.current) return;
    map.current.easeTo({ center: [gpsPosition.lng, gpsPosition.lat], duration: 800, easing: (t) => t * (2 - t) });
  }, [gpsPosition, followMode]);

  // Navigate — uses water router
  const navigateTo = useCallback((t: NavWaypoint) => {
    setNavTarget(t); setSelectedPOI(null); setSelectedHazard(null); setShowFilters(false);
    // Compute water route from current position (or map center)
    const startLng = gpsPosition?.lng ?? map.current?.getCenter().lng ?? LANIER_CENTER[0];
    const startLat = gpsPosition?.lat ?? map.current?.getCenter().lat ?? LANIER_CENTER[1];
    const result = findWaterRoute(startLng, startLat, t.lng, t.lat, allHazards, currentLevel);
    setRouteResult(result);
    // Draw the water route on map
    if (map.current?.getSource('nav-route')) {
      (map.current.getSource('nav-route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: result.path }, properties: {}
      });
    }
    // Fit map to route
    if (map.current && result.path.length > 1) {
      const bounds = new maplibregl.LngLatBounds();
      result.path.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      map.current.fitBounds(bounds, { padding: { top: 120, bottom: 120, left: 40, right: 60 }, duration: 1000 });
    }
  }, [gpsPosition, allHazards, currentLevel]);

  // Update nav info when GPS moves
  useEffect(() => {
    if (!navTarget) { setNavInfo(null); return; }
    if (!gpsPosition) { setNavInfo({ distance: routeResult ? `${routeResult.distance_nm.toFixed(2)} nm` : '--', bearing: '--', eta: 'Enable GPS' }); return; }
    // Recompute route from new GPS position
    const result = findWaterRoute(gpsPosition.lng, gpsPosition.lat, navTarget.lng, navTarget.lat, allHazards, currentLevel);
    setRouteResult(result);
    if (map.current?.getSource('nav-route')) {
      (map.current.getSource('nav-route') as maplibregl.GeoJSONSource).setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: result.path }, properties: {}
      });
    }
    const brng = calcBearing(gpsPosition.lat, gpsPosition.lng, navTarget.lat, navTarget.lng);
    const speedKn = gpsPosition.speed ? gpsPosition.speed * 1.94384 : 15;
    const etaMin = (result.distance_nm / speedKn) * 60;
    setNavInfo({
      distance: result.distance_nm < 0.1 ? `${(result.distance_nm * 6076).toFixed(0)} ft` : `${result.distance_nm.toFixed(2)} nm`,
      bearing: `${brng.toFixed(0)}° ${bearingToCompass(brng)}`,
      eta: etaMin < 1 ? '<1 min' : `${Math.round(etaMin)} min`,
    });
  }, [gpsPosition, navTarget, allHazards, currentLevel]);

  // Markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    markersRef.current.forEach((m) => m.remove()); markersRef.current = [];
    if (true) {
      allPOIs.forEach((poi) => {
        if (!poiFilters[poi.type]) return; // skip filtered-out types
        const c = POI_CONFIG[poi.type]; const svg = MARKER_SVG[poi.type] || '';
        const el = document.createElement('div'); el.className = 'map-marker';
        el.innerHTML = `<div class="marker-icon" style="background:${c.color}${editMode ? ';box-shadow:0 0 8px rgba(34,211,238,0.6)' : ''}">${svg}</div>`;
        el.addEventListener('click', (e) => { e.stopPropagation(); setSelectedPOI(poi); setSelectedHazard(null); map.current?.flyTo({ center: [poi.lng, poi.lat], zoom: 14, duration: 800 }); });
        const marker = new maplibregl.Marker({ element: el, draggable: editMode }).setLngLat([poi.lng, poi.lat]).addTo(map.current!);
        if (editMode) {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            setAllPOIs(prev => prev.map(p => p.id === poi.id ? { ...p, lat: Math.round(lngLat.lat * 10000) / 10000, lng: Math.round(lngLat.lng * 10000) / 10000 } : p));
          });
        }
        markersRef.current.push(marker);
      });
    }
    if (poiFilters.hazards) {
      allHazards.forEach((h) => {
        const svg = MARKER_SVG[h.type] || ''; const isExp = currentLevel <= h.elevation_ft; const near = currentLevel - h.elevation_ft < 3;
        const bg = isExp ? 'rgba(239,68,68,0.9)' : near ? 'rgba(245,158,11,0.8)' : 'rgba(245,158,11,0.5)';
        const el = document.createElement('div'); el.className = 'map-marker';
        el.innerHTML = `<div class="hazard-marker-icon" style="background:${bg}">${svg}</div>`;
        el.addEventListener('click', (e) => { e.stopPropagation(); setSelectedHazard(h); setSelectedPOI(null); map.current?.flyTo({ center: [h.lng, h.lat], zoom: 15, duration: 800 }); });
        markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([h.lng, h.lat]).addTo(map.current!));
      });
    }
    if (navTarget) {
      const el = document.createElement('div');
      el.innerHTML = '<div style="width:20px;height:20px;border-radius:50%;background:#22d3ee;border:3px solid #fff;box-shadow:0 0 12px rgba(34,211,238,0.5)"></div>';
      markersRef.current.push(new maplibregl.Marker({ element: el }).setLngLat([navTarget.lng, navTarget.lat]).addTo(map.current!));
    }
  }, [mapLoaded, poiFilters, allPOIs, allHazards, currentLevel, navTarget, editMode]);

  // Depth visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    DEPTH_ZONES.forEach((z) => { const v = poiFilters.depth ? 'visible' : 'none'; if (map.current!.getLayer(`depth-${z.id}`)) { map.current!.setLayoutProperty(`depth-${z.id}`, 'visibility', v); map.current!.setLayoutProperty(`depth-${z.id}-outline`, 'visibility', v); } });
  }, [mapLoaded, poiFilters.depth]);

  const toggleFilter = useCallback((key: string) => setPoiFilters((p) => ({ ...p, [key]: !p[key] })), []);

  const handleCreatePin = useCallback(() => {
    if (!pendingPin || !newPinData.name || !newPinData.subtype) return;
    if (pendingPin.type === 'poi') {
      setAllPOIs((p) => [...p, { id: `u-${Date.now()}`, name: newPinData.name, type: newPinData.subtype as POIType, lat: pendingPin.lat, lng: pendingPin.lng, description: newPinData.description || 'User-added', reviews: 0 }]);
    } else {
      setAllHazards((p) => [...p, { id: `u-${Date.now()}`, type: newPinData.subtype as HazardType, lat: pendingPin.lat, lng: pendingPin.lng, description: newPinData.description || 'User-reported', elevation_ft: currentLevel - 2, severity: 'medium', reported_by: 'You', reported_at: new Date().toISOString().split('T')[0] }]);
    }
    setPendingPin(null); setShowCreateForm(false); setCreatePinMode(null); setNewPinData({ name: '', description: '', subtype: '' });
  }, [pendingPin, newPinData, currentLevel]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPOI) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('poi_id', selectedPOI.id);
      const res = await fetch('/api/photos', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) alert('Photo uploaded!');
      else alert(`Upload failed: ${data.error}`);
    } catch { alert('Upload failed — check your connection'); }
    e.target.value = '';
  }, [selectedPOI]);

  const exportPOIs = useCallback(() => {
    const data = allPOIs.map(p => `  { id: '${p.id}', name: '${p.name.replace(/'/g, "\\'")}', type: '${p.type}', lat: ${p.lat}, lng: ${p.lng} },`).join('\n');
    navigator.clipboard.writeText(data).then(() => alert(`${allPOIs.length} POI coordinates copied to clipboard`));
  }, [allPOIs]);

  const cancelNav = useCallback(() => {
    setNavTarget(null); setNavInfo(null); setRouteResult(null);
    if (map.current?.getSource('nav-route')) (map.current.getSource('nav-route') as maplibregl.GeoJSONSource).setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] }, properties: {} });
  }, []);

  const levelDiff = waterLevel.below_full_pool_ft ?? (FULL_POOL - currentLevel);
  const levelStatus = waterLevel.status;

  // Render icon component for detail panels
  const POIIcon = selectedPOI ? POI_ICONS[selectedPOI.type] : null;
  const HazardIcon = selectedHazard ? HAZARD_ICONS[selectedHazard.type] : null;

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />

      {/* ─── Top bar ─── */}
      <div className="top-bar">
        <div className="app-brand">
          <div className="app-logo" onContextMenu={(e) => { e.preventDefault(); setEditMode(true); }} onDoubleClick={() => setEditMode(true)}>LN</div>
          <div><div className="app-title">Lanier Nav</div><div className="app-subtitle">Lake Lanier</div></div>
        </div>
        <div className="water-level-badge">
          <div className="water-level-dot" style={{ background: levelStatus === 'normal' ? 'var(--accent-green)' : levelStatus === 'low' ? 'var(--accent-amber)' : levelStatus === 'loading' ? 'var(--text-muted)' : 'var(--accent-red)' }} />
          <div>
            <div className="water-level-text">USGS Live {waterLevel.timestamp ? <span style={{ opacity: 0.6 }}>{formatTime(waterLevel.timestamp)}</span> : ''}</div>
            <div className="water-level-value">{waterLevel.elevation_ft?.toFixed(2) ?? '---'} ft <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>({levelDiff > 0 ? `-${levelDiff.toFixed(2)}` : 'full'} ft)</span></div>
          </div>
        </div>
      </div>

      {/* ─── Nav HUD ─── */}
      {(gpsActive || navTarget) && (
        <div className="nav-hud">
          {gpsActive && gpsPosition && (
            <div className="hud-card">
              <div><div className="hud-stat-label">SPD</div><div className="hud-stat-value" style={{ color: 'var(--accent-teal)' }}>{gpsPosition.speed ? `${(gpsPosition.speed * 1.94384).toFixed(1)} kn` : '-- kn'}</div></div>
              <div><div className="hud-stat-label">HDG</div><div className="hud-stat-value" style={{ color: 'var(--accent-teal)' }}>{gpsPosition.heading ? `${gpsPosition.heading.toFixed(0)}°` : '--°'}</div></div>
            </div>
          )}
          {navTarget && navInfo && (
            <div className="hud-card nav">
              <IconNavigation size={14} color="var(--accent-teal)" />
              <span style={{ color: 'var(--accent-teal)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{navTarget.name || 'WPT'}</span>
              <div><div className="hud-stat-label">DST</div><div className="hud-stat-value">{navInfo.distance}</div></div>
              <div><div className="hud-stat-label">BRG</div><div className="hud-stat-value">{navInfo.bearing}</div></div>
              <div><div className="hud-stat-label">ETA</div><div className="hud-stat-value">{navInfo.eta}</div></div>
              <button onClick={cancelNav} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: 'var(--accent-red)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <IconX size={12} /> End
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── Filter sheet ─── */}
      {showFilters && (
        <div style={{ position: 'absolute', bottom: 'calc(var(--bottom-nav-h) + var(--sab))', left: 0, right: 0, zIndex: 18, background: 'var(--bg-card)', borderTop: '1px solid var(--border-primary)', borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0', padding: '16px 16px calc(16px)', maxHeight: '55vh', overflowY: 'auto', overscrollBehavior: 'contain' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Filter map</div>
            <button className="detail-close" onClick={() => setShowFilters(false)}><IconX size={16} /></button>
          </div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', marginBottom: 8 }}>Categories</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {Object.entries(POI_CONFIG).map(([key, cfg]) => {
              const Icon = POI_ICONS[key];
              const count = allPOIs.filter(p => p.type === key).length;
              return (
                <button key={key} onClick={() => toggleFilter(key)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 10px',
                  background: poiFilters[key] ? `${cfg.color}18` : 'var(--bg-tertiary)',
                  border: `1px solid ${poiFilters[key] ? `${cfg.color}40` : 'var(--border-primary)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  color: poiFilters[key] ? cfg.color : 'var(--text-muted)', fontSize: 12, transition: 'all 0.15s',
                  minHeight: 42,
                }}>
                  {Icon && <Icon size={15} />}
                  <span style={{ flex: 1, textAlign: 'left' }}>{cfg.label}</span>
                  <span style={{ fontSize: 10, opacity: 0.6 }}>{count}</span>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)', margin: '14px 0 8px' }}>Overlays</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => toggleFilter('hazards')} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px',
              background: poiFilters.hazards ? 'var(--accent-red-dim)' : 'var(--bg-tertiary)',
              border: `1px solid ${poiFilters.hazards ? 'rgba(239,68,68,0.3)' : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              color: poiFilters.hazards ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: 12, minHeight: 42,
            }}>
              <IconWarning size={15} /> Hazards <span style={{ fontSize: 10, opacity: 0.6, marginLeft: 'auto' }}>{allHazards.length}</span>
            </button>
            <button onClick={() => toggleFilter('depth')} style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px',
              background: poiFilters.depth ? 'var(--accent-teal-dim)' : 'var(--bg-tertiary)',
              border: `1px solid ${poiFilters.depth ? 'rgba(34,211,238,0.3)' : 'var(--border-primary)'}`,
              borderRadius: 'var(--radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
              color: poiFilters.depth ? 'var(--accent-teal)' : 'var(--text-muted)', fontSize: 12, minHeight: 42,
            }}>
              <IconWaves size={15} /> Depth contours
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setPoiFilters(p => { const n: Record<string,boolean> = {}; Object.keys(p).forEach(k => n[k] = true); return n; })} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}>Show all</button>
            <button onClick={() => setPoiFilters(p => { const n: Record<string,boolean> = {}; Object.keys(p).forEach(k => n[k] = false); return n; })} className="btn btn-secondary" style={{ flex: 1, fontSize: 12 }}>Hide all</button>
          </div>
        </div>
      )}

      {/* ─── Route warnings ─── */}
      {routeResult && routeResult.warnings.length > 0 && (
        <div className="route-warnings">
          {routeResult.warnings.map((w, i) => (
            <div key={i} className={`route-warning-item ${w.includes('Shallow') || w.includes('hazard') ? 'caution' : 'danger'}`}>
              <IconWarning size={14} /> {w}
            </div>
          ))}
        </div>
      )}

      {/* ─── Create pin mode ─── */}
      {createPinMode && !showCreateForm && (
        <div className="create-pin-overlay" style={{ borderColor: createPinMode === 'hazard' ? 'rgba(239,68,68,0.3)' : 'rgba(34,211,238,0.3)', border: '1px solid' }}>
          {createPinMode === 'hazard' ? <IconAlert size={28} color="var(--accent-red)" /> : <IconPin size={28} color="var(--accent-teal)" />}
          <div style={{ fontSize: 14, fontWeight: 500, margin: '8px 0 4px' }}>Tap map to place</div>
          <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 16px', minHeight: 36 }} onClick={() => { setCreatePinMode(null); setPendingPin(null); }}>Cancel</button>
        </div>
      )}

      {/* ─── Create pin form ─── */}
      {showCreateForm && pendingPin && (
        <div className="create-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              {pendingPin.type === 'hazard' ? <><IconAlert size={20} color="var(--accent-red)" /> Report hazard</> : <><IconPin size={20} color="var(--accent-teal)" /> Add new spot</>}
            </div>
            <button className="detail-close" onClick={() => { setShowCreateForm(false); setPendingPin(null); setCreatePinMode(null); }}><IconX size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div><label className="form-label">Type</label>
              <select className="form-select" value={newPinData.subtype} onChange={(e) => setNewPinData((p) => ({ ...p, subtype: e.target.value }))}>
                <option value="">Select type...</option>
                {pendingPin.type === 'poi' ? Object.entries(POI_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>) : Object.entries(HAZARD_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="form-label">Name</label><input className="form-input" type="text" value={newPinData.name} onChange={(e) => setNewPinData((p) => ({ ...p, name: e.target.value }))} placeholder={pendingPin.type === 'hazard' ? 'e.g. Submerged tree near cove' : 'e.g. Hidden beach spot'} /></div>
            <div><label className="form-label">Description</label><textarea className="form-textarea" value={newPinData.description} onChange={(e) => setNewPinData((p) => ({ ...p, description: e.target.value }))} placeholder="Details, tips, warnings..." rows={3} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowCreateForm(false); setPendingPin(null); setCreatePinMode(null); }}>Cancel</button>
              <button className={`btn ${pendingPin.type === 'hazard' ? 'btn-danger' : 'btn-primary'}`} style={{ flex: 2 }} disabled={!newPinData.name || !newPinData.subtype} onClick={handleCreatePin}>
                {pendingPin.type === 'hazard' ? <><IconFlag size={14} /> Report</> : <><IconCheck size={14} /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Depth legend removed — no real bathymetric data yet ─── */}

      {/* ─── POI detail ─── */}
      <div className={`detail-overlay ${selectedPOI && !showCreateForm ? 'open' : ''}`}>
        {selectedPOI && (<>
          <div className="detail-handle"><div className="detail-handle-bar" /></div>
          <div className="detail-header">
            <div>
              <div className="detail-type-badge" style={{ background: `${POI_CONFIG[selectedPOI.type].color}20`, color: POI_CONFIG[selectedPOI.type].color }}>
                {POIIcon && <POIIcon size={14} />} {POI_CONFIG[selectedPOI.type].label}
              </div>
              <div className="detail-name">{selectedPOI.name}</div>
            </div>
            <button className="detail-close" onClick={() => setSelectedPOI(null)}><IconX size={16} /></button>
          </div>
          <div className="detail-description">{selectedPOI.description}</div>
          {selectedPOI.details && <div className="detail-meta">{Object.entries(selectedPOI.details).map(([k, v]) => <div key={k} className="meta-item"><div className="meta-label">{k}</div><div className="meta-value">{v}</div></div>)}</div>}
          <div className="detail-actions">
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => photoInputRef.current?.click()}><IconCamera size={14} /> Photo</button>
            <button className="btn btn-secondary" style={{ flex: 1 }}><IconChat size={14} /> Comment</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigateTo({ lng: selectedPOI.lng, lat: selectedPOI.lat, name: selectedPOI.name })}>
              <IconNavigation size={14} /> Navigate
            </button>
          </div>
        </>)}
      </div>

      {/* ─── Hazard detail ─── */}
      <div className={`detail-overlay hazard ${selectedHazard && !showCreateForm ? 'open' : ''}`}>
        {selectedHazard && (() => {
          const c = HAZARD_CONFIG[selectedHazard.type]; const isExp = currentLevel <= selectedHazard.elevation_ft; const depth = currentLevel - selectedHazard.elevation_ft;
          return (<>
            <div className="detail-handle"><div className="detail-handle-bar" /></div>
            <div className="detail-header">
              <div>
                <div className={`detail-type-badge severity-${selectedHazard.severity}`}>{HazardIcon && <HazardIcon size={14} />} {c.label} — {selectedHazard.severity}</div>
                <div className="detail-name" style={{ color: isExp ? 'var(--accent-red)' : 'var(--text-primary)' }}>{isExp ? 'EXPOSED — DANGER' : `${depth.toFixed(1)}ft below surface`}</div>
              </div>
              <button className="detail-close" onClick={() => setSelectedHazard(null)}><IconX size={16} /></button>
            </div>
            <div className="detail-description">{selectedHazard.description}</div>
            <div className="detail-meta">
              <div className="meta-item"><div className="meta-label">Elevation</div><div className="meta-value">{selectedHazard.elevation_ft} ft</div></div>
              <div className="meta-item"><div className="meta-label">Current depth</div><div className="meta-value" style={{ color: isExp ? 'var(--accent-red)' : depth < 3 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>{isExp ? 'Exposed' : `${depth.toFixed(1)} ft`}</div></div>
              {selectedHazard.reported_by && <div className="meta-item"><div className="meta-label">Reporter</div><div className="meta-value">{selectedHazard.reported_by}</div></div>}
            </div>
            <div className="detail-actions">
              <button className="btn btn-danger-outline" style={{ flex: 1 }}><IconFlag size={14} /> Confirm</button>
              <button className="btn btn-secondary" style={{ flex: 1 }}><IconCheck size={14} /> Cleared</button>
              <button className="btn btn-secondary" style={{ flex: 1 }}><IconCamera size={14} /> Photo</button>
            </div>
          </>);
        })()}
      </div>

      {/* Hidden photo input */}
      <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoUpload} />

      {/* Edit mode banner */}
      {editMode && (
        <div style={{ position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 20, background: 'rgba(34,211,238,0.15)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 'var(--radius-lg)', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'var(--accent-teal)', backdropFilter: 'blur(12px)' }}>
          <span style={{ fontWeight: 600 }}>EDIT MODE</span> — drag pins to reposition
          <button onClick={exportPOIs} style={{ background: 'rgba(34,211,238,0.2)', border: '1px solid rgba(34,211,238,0.3)', borderRadius: 6, color: 'var(--accent-teal)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Copy coords</button>
          <button onClick={() => setEditMode(false)} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: 'var(--accent-red)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Done</button>
        </div>
      )}

      {/* ─── Bottom nav ─── */}
      <div className="bottom-nav">
        <button className={`bottom-nav-btn ${gpsActive ? 'active' : ''}`} onClick={() => {
          if (gpsActive && !followMode) { setFollowMode(true); if (gpsPosition && map.current) map.current.flyTo({ center: [gpsPosition.lng, gpsPosition.lat], zoom: 15.5, duration: 800 }); }
          else toggleGPS();
        }}>
          <IconGps size={22} /><span className="bottom-nav-label">{gpsActive ? (followMode ? 'Following' : 'Re-center') : 'GPS'}</span>
        </button>
        <button className={`bottom-nav-btn ${showFilters ? 'active' : ''}`} onClick={() => { setShowFilters(!showFilters); setSelectedPOI(null); setSelectedHazard(null); }}>
          <IconLayers size={22} /><span className="bottom-nav-label">Filter</span>
        </button>
        <button className="bottom-nav-btn" onClick={() => { setCreatePinMode('poi'); setSelectedPOI(null); setSelectedHazard(null); setShowFilters(false); }}>
          <IconPlus size={22} /><span className="bottom-nav-label">Add spot</span>
        </button>
        <button className="bottom-nav-btn" style={{ color: 'var(--accent-red)' }} onClick={() => { setCreatePinMode('hazard'); setSelectedPOI(null); setSelectedHazard(null); setShowFilters(false); }}>
          <IconAlert size={22} /><span className="bottom-nav-label">Hazard</span>
        </button>
        {navTarget && (
          <button className="bottom-nav-btn active" onClick={cancelNav}>
            <IconNavigation size={22} /><span className="bottom-nav-label">End nav</span>
          </button>
        )}
      </div>
    </div>
  );
}