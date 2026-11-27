import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Map,
  Marker,
  NavigationControl,
  Popup,
  type StyleSpecification,
  type MapMouseEvent,
  type ErrorEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapCluster, type MapClusterItem } from "../../hooks/useMapCluster";
import type { ClusterProperties } from "supercluster";
import type { MemoryMapMarkerResponse } from "../../types";

export interface MapLibreMapProps {
  initialMarkers?: MemoryMapMarkerResponse[];
  onBoundsChange?: (bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }) => void;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  selectedCoords?: { latitude: number; longitude: number } | null;
  isPinMode?: boolean;
  className?: string;
  onMarkerClick?: (marker: MemoryMapMarkerResponse) => void;
}

// Vietnam Center and Bounds
const VIETNAM_CENTER: [number, number] = [106.5, 16.0];
const VIETNAM_ZOOM = 5.5;
const VIETNAM_MAX_BOUNDS: [[number, number], [number, number]] = [
  [95.0, 6.0],
  [118.0, 25.0],
];

const CARTO_POSITRON_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const OSM_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-raster-layer",
      type: "raster",
      source: "osm-raster",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

function isClusterFeature(
  feature: MapClusterItem
): feature is MapClusterItem & { properties: ClusterProperties } {
  return Boolean(
    feature.properties &&
      "cluster" in feature.properties &&
      feature.properties.cluster === true
  );
}

export const MapLibreMap: React.FC<MapLibreMapProps> = ({
  initialMarkers = [],
  onBoundsChange,
  onLocationSelect,
  selectedCoords,
  isPinMode = false,
  className = "w-full h-full min-h-[460px]",
  onMarkerClick,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const activeMarkersRef = useRef<Marker[]>([]);
  const selectedPinMarkerRef = useRef<Marker | null>(null);
  const boundsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [mapZoom, setMapZoom] = useState<number>(VIETNAM_ZOOM);
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Client-side clustering with Supercluster
  const { clusters, getClusterExpansionZoom } = useMapCluster(
    initialMarkers,
    mapBounds,
    mapZoom,
    { radius: 55, maxZoom: 16, minPoints: 2 }
  );

  // Debounced bounds reporter
  const reportBoundsChange = useCallback(() => {
    if (!mapRef.current) return;
    const b = mapRef.current.getBounds();
    const boundsArray: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ];
    setMapBounds(boundsArray);
    setMapZoom(mapRef.current.getZoom());

    if (onBoundsChange) {
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
      boundsTimeoutRef.current = setTimeout(() => {
        onBoundsChange({
          minLng: boundsArray[0],
          minLat: boundsArray[1],
          maxLng: boundsArray[2],
          maxLat: boundsArray[3],
        });
      }, 300);
    }
  }, [onBoundsChange]);

  const onLocationSelectRef = useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const reportBoundsChangeRef = useRef(reportBoundsChange);
  useEffect(() => {
    reportBoundsChangeRef.current = reportBoundsChange;
  }, [reportBoundsChange]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let fallbackTriggered = false;
    const map = new Map({
      container: mapContainerRef.current,
      style: CARTO_POSITRON_STYLE,
      center: VIETNAM_CENTER,
      zoom: VIETNAM_ZOOM,
      minZoom: 4.2,
      maxZoom: 18,
      maxBounds: VIETNAM_MAX_BOUNDS,
      attributionControl: { compact: true },
    });

    mapRef.current = map;

    // Navigation controls: Zoom in/out, Compass
    map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");

    map.on("load", () => {
      setIsMapLoaded(true);
      reportBoundsChangeRef.current();
    });

    map.on("error", (e: ErrorEvent) => {
      // If vector style fails, gracefully fall back to OSM raster
      if (!fallbackTriggered && (e.error?.message?.includes("style") || !map.isStyleLoaded())) {
        fallbackTriggered = true;
        map.setStyle(OSM_FALLBACK_STYLE);
      }
    });

    map.on("moveend", () => {
      reportBoundsChangeRef.current();
    });

    map.on("zoomend", () => {
      reportBoundsChangeRef.current();
    });

    map.on("click", (e: MapMouseEvent) => {
      const coords = { latitude: e.lngLat.lat, longitude: e.lngLat.lng };
      if (onLocationSelectRef.current) {
        onLocationSelectRef.current(coords);
      }
    });

    // Resize observer to ensure full responsiveness
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (boundsTimeoutRef.current) {
        clearTimeout(boundsTimeoutRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update cursor based on pinMode
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.getCanvas().style.cursor = isPinMode ? "crosshair" : "";
  }, [isPinMode]);

  // Render selected coordinates pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (selectedPinMarkerRef.current) {
      selectedPinMarkerRef.current.remove();
      selectedPinMarkerRef.current = null;
    }

    if (selectedCoords) {
      const el = document.createElement("div");
      el.className = "travel-selected-pin flex flex-col items-center select-none cursor-pointer";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-orange-500/30 animate-ping"></div>
          <div class="w-8 h-8 rounded-full bg-[#ff4d1a] border-2 border-white shadow-xl flex items-center justify-center text-white text-sm font-bold">
            📍
          </div>
        </div>
        <div class="mt-1 bg-neutral-900 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
          Điểm đã chọn
        </div>
      `;

      const marker = new Marker({ element: el, anchor: "bottom" })
        .setLngLat([selectedCoords.longitude, selectedCoords.latitude])
        .addTo(map);

      selectedPinMarkerRef.current = marker;
    }
  }, [selectedCoords, isMapLoaded]);

  // Render clustered markers & points
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Clear existing markers
    activeMarkersRef.current.forEach((marker) => marker.remove());
    activeMarkersRef.current = [];

    // Add new markers from supercluster output
    clusters.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;

      if (isClusterFeature(feature)) {
        const clusterId = feature.properties.cluster_id;
        const count = feature.properties.point_count || 2;
        const countAbbrev = feature.properties.point_count_abbreviated || count;

        let sizeStyle = "w-10 h-10 text-xs";
        if (count > 50) {
          sizeStyle = "w-14 h-14 text-sm font-black";
        } else if (count > 10) {
          sizeStyle = "w-12 h-12 text-xs font-bold";
        }

        const el = document.createElement("div");
        el.className = "travel-cluster-node cursor-pointer select-none";
        el.innerHTML = `
          <div class="${sizeStyle} rounded-full bg-gradient-to-tr from-[#ff4d1a] to-[#ff7a45] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 ring-4 ring-white/90 hover:scale-110 active:scale-95 transition-all duration-200">
            <span>${countAbbrev}</span>
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const nextZoom = getClusterExpansionZoom(clusterId);
          map.easeTo({
            center: [lng, lat],
            zoom: Math.min(nextZoom, 18),
            duration: 500,
          });
        });

        const marker = new Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        activeMarkersRef.current.push(marker);
      } else {
        // Individual Memory Marker
        const markerProps = feature.properties as MemoryMapMarkerResponse;

        const el = document.createElement("div");
        el.className = "travel-point-node group relative flex items-center justify-center cursor-pointer select-none";
        el.innerHTML = `
          <div class="w-8 h-8 rounded-full bg-white border-2 border-[#ff4d1a] shadow-md flex items-center justify-center overflow-hidden hover:scale-110 active:scale-95 transition-all duration-200">
            ${
              markerProps.coverThumbnailUrl
                ? `<img src="${markerProps.coverThumbnailUrl}" alt="${markerProps.title || ""}" class="w-full h-full object-cover" />`
                : `<span class="text-xs">📸</span>`
            }
          </div>
          <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-neutral-900/85 backdrop-blur text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm z-20">
            ${markerProps.title || "Kỷ niệm"}
          </div>
        `;

        el.addEventListener("click", (e) => {
          e.stopPropagation();

          if (onMarkerClick) {
            onMarkerClick(markerProps);
          }

          const popupHtml = `
            <div class="p-3 max-w-[220px] font-sans text-neutral-800">
              ${
                markerProps.coverThumbnailUrl
                  ? `<div class="aspect-[16/10] w-full overflow-hidden rounded-lg mb-2 bg-neutral-100 shadow-inner">
                       <img src="${markerProps.coverThumbnailUrl}" alt="${markerProps.title || ""}" class="w-full h-full object-cover" />
                     </div>`
                  : ""
              }
              <h4 class="font-bold text-sm text-neutral-900 leading-snug line-clamp-1">${markerProps.title || "Kỷ niệm chuyến đi"}</h4>
              <p class="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                <span>📍</span> <span>${markerProps.provinceName || "Việt Nam"}</span>
              </p>
              ${
                markerProps.visitedAt
                  ? `<p class="text-[11px] text-neutral-400 mt-1">🗓️ ${markerProps.visitedAt}</p>`
                  : ""
              }
            </div>
          `;

          new Popup({
            offset: 16,
            closeButton: true,
            closeOnClick: true,
            className: "travel-marker-popup",
          })
            .setLngLat([lng, lat])
            .setHTML(popupHtml)
            .addTo(map);
        });

        const marker = new Marker({ element: el })
          .setLngLat([lng, lat])
          .addTo(map);

        activeMarkersRef.current.push(marker);
      }
    });
  }, [clusters, isMapLoaded, getClusterExpansionZoom, onMarkerClick]);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[460px]" />

      {/* Pin Mode Overlay Indicator */}
      {isPinMode && (
        <div className="absolute top-4 left-4 z-10 bg-neutral-900/90 backdrop-blur text-white text-xs px-3.5 py-1.5 rounded-full font-medium shadow-lg flex items-center gap-2 border border-white/10 animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#ff4d1a] animate-pulse"></span>
          <span>Chế độ ghim: Bấm vào vị trí trên bản đồ để chọn toạ độ</span>
        </div>
      )}
    </div>
  );
};

export default MapLibreMap;
