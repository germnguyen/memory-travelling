import { useMemo, useCallback } from "react";
import Supercluster, {
  type PointFeature,
  type ClusterFeature,
  type Options,
  type AnyProps,
} from "supercluster";
import type { BBox, GeoJsonProperties } from "geojson";
import type { MemoryMapMarkerResponse } from "../types";

export interface UseMapClusterOptions {
  radius?: number;
  maxZoom?: number;
  minPoints?: number;
}

export type MapClusterItem<P extends GeoJsonProperties = MemoryMapMarkerResponse & GeoJsonProperties> =
  | ClusterFeature<AnyProps>
  | PointFeature<P>;

export interface UseMapClusterResult<P extends GeoJsonProperties = MemoryMapMarkerResponse & GeoJsonProperties> {
  clusters: MapClusterItem<P>[];
  supercluster: Supercluster<P, AnyProps> | null;
  getClusterExpansionZoom: (clusterId: number) => number;
}

export function useMapCluster<P extends MemoryMapMarkerResponse & GeoJsonProperties = MemoryMapMarkerResponse & GeoJsonProperties>(
  markers: P[],
  bounds: [number, number, number, number] | null,
  zoom: number,
  options?: UseMapClusterOptions
): UseMapClusterResult<P> {
  const points: PointFeature<P>[] = useMemo(() => {
    return markers
      .filter(
        (m) =>
          typeof m.latitude === "number" &&
          typeof m.longitude === "number" &&
          !isNaN(m.latitude) &&
          !isNaN(m.longitude)
      )
      .map((marker) => ({
        type: "Feature" as const,
        properties: {
          cluster: false,
          ...marker,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [marker.longitude, marker.latitude],
        },
      }));
  }, [markers]);

  const supercluster = useMemo(() => {
    const scOptions: Options<P, AnyProps> = {
      radius: options?.radius ?? 50,
      maxZoom: options?.maxZoom ?? 16,
      minPoints: options?.minPoints ?? 2,
    };
    const cluster = new Supercluster<P, AnyProps>(scOptions);
    cluster.load(points);
    return cluster;
  }, [points, options?.radius, options?.maxZoom, options?.minPoints]);

  const clusters = useMemo(() => {
    if (!supercluster) return [];
    const bbox: BBox =
      bounds && bounds.length === 4
        ? (bounds as BBox)
        : [-180, -85, 180, 85];

    const currentZoom = Math.max(0, Math.min(22, Math.round(zoom)));
    return supercluster.getClusters(bbox, currentZoom);
  }, [supercluster, bounds, zoom]);

  const getClusterExpansionZoom = useCallback(
    (clusterId: number): number => {
      if (!supercluster) {
        return Math.min(Math.round(zoom) + 2, 18);
      }
      try {
        return supercluster.getClusterExpansionZoom(clusterId);
      } catch {
        return Math.min(Math.round(zoom) + 2, 18);
      }
    },
    [supercluster, zoom]
  );

  return {
    clusters,
    supercluster,
    getClusterExpansionZoom,
  };
}
