
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import MapView, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';
import { FiMaximize2, FiMinimize2 } from 'react-icons/fi';
import { IoChevronBack, IoChevronForward, IoCloseSharp } from 'react-icons/io5';
import { apiFetch } from '@/shared/api/http'
import {
  formatStatusLabel,
  getOltRxColor,
  getOltTxColor,
  getOntRxColor,
} from '@/features/ont/lib/ftth-map-metric-colors'

import 'maplibre-gl/dist/maplibre-gl.css'

export interface FtthMapMarkerPoint {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  tone: 'green' | 'yellow' | 'orange' | 'red' | 'neutral';
  count?: number;
  address?: string;
  neighbors?: Array<{
    serial: string;
    address: string;
    addressBase: string;
    streetName: string;
    heightLabel: string;
    unitLabel: string;
    estado: string;
    ontRx: string;
    ontTx: string;
    oltRx: string;
    oltTx: string;
    oltVolt: string;
    ontTemp: string;
    ontVolt: string;
    ontBiasCurrent: string;
    oltBiasCurrent: string;
    portTemp: string;
  }>;
}

interface Props {
  points: FtthMapMarkerPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  center?: { latitude: number | null; longitude: number | null };
  fullHeight?: boolean;
  embedded?: boolean;
  singlePointZoom?: number;
  compactHeader?: boolean;
  mapHeightClassName?: string;
  /** Si está definido, muestra un botón X en el header para cerrar el panel del mapa. */
  onClose?: () => void;
  /**
   * No re-centrar ni re-zoom cuando cambian solo los puntos visibles
   * (p. ej. filtro por checkboxes de la tabla).
   */
  preserveViewportOnPointsChange?: boolean;
  /** Al cambiar, se vuelve a encuadrar la cámara (nueva consulta de datos). */
  viewportResetKey?: string;
  /**
   * El panel contenedor es visible (no `display:none`).
   * Si es false, no se pide streetImg hasta que el panel tenga tamaño real.
   */
  panelVisible?: boolean;
  /** Mismo estilo de título que las cards de la solapa Información (sin acento violeta en desktop). */
  screenTitle?: boolean;
}

const mapCardClassName =
  'shadow-sm rounded-lg p-4 bg-(--card) dark:border dark:border-white/15 dark:shadow-[0_10px_20px_rgb(0_0_0/0.45)] flex flex-col gap-3';

/** Zoom inicial para un solo punto (más bajo = vista más alejada). */
export const FTTH_MAP_DEFAULT_SINGLE_POINT_ZOOM = 15;
/** Tope al encuadrar varios puntos para no pegarse a nivel calle. */
const FTTH_MAP_FIT_BOUNDS_MAX_ZOOM = 17;
const FTTH_MAP_FIT_BOUNDS_PADDING = 64;
/**
 * A partir de este zoom se usa calle/FTTH (`streetImg`).
 * Por debajo, mapa de referencia con tiles para contexto país/región.
 */
export const FTTH_MAP_FTTH_STREET_MIN_ZOOM = 11;
const FTTH_MAP_CONTEXT_STYLE_LIGHT =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const FTTH_MAP_CONTEXT_STYLE_DARK =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

/** Sin tiles: solo fondo hasta que llegue la imagen `base` de la API (vista calle). */
const API_ONLY_MAP_STYLE_LIGHT = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'ftth-map-bg',
      type: 'background' as const,
      paint: { 'background-color': '#ececec' }
    }
  ]
};

const API_ONLY_MAP_STYLE_DARK = {
  version: 8 as const,
  sources: {},
  layers: [
    {
      id: 'ftth-map-bg',
      type: 'background' as const,
      paint: { 'background-color': '#2a2a2a' }
    }
  ]
};

interface StreetImgLayoutItem {
  name: string;
  img: string | null;
}

interface StreetImgResponse {
  baseImg?: string | null;
  layouts?: StreetImgLayoutItem[];
}

const _mapOverlayMinContainerPx = 100;
const _mapOverlayFetchDelayMs = 320;
const _streetBaseSourceId = 'street-img-base';
const _streetBaseLayerId = 'street-img-base-layer';
const _streetFtthSourceId = 'street-img-ftth';
const _streetFtthLayerId = 'street-img-ftth-layer';

interface OverlayState {
  baseImageUrl: string | null;
  ftthImageUrl: string | null;
  coordinates: [[number, number], [number, number], [number, number], [number, number]];
}

function getDocumentFullscreenElement(): Element | null {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return (
    document.fullscreenElement ??
    doc.webkitFullscreenElement ??
    doc.mozFullScreenElement ??
    doc.msFullscreenElement ??
    null
  );
}

async function toggleMapFullscreenContainer(container: HTMLElement): Promise<void> {
  const fsEl = getDocumentFullscreenElement();
  if (fsEl === container) {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => void;
    };
    if (document.exitFullscreen) {
      await document.exitFullscreen().catch(() => {});
    } else if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen().catch(() => {});
    } else if (doc.mozCancelFullScreen) {
      doc.mozCancelFullScreen();
    } else if (doc.msExitFullscreen) {
      doc.msExitFullscreen();
    }
    return;
  }

  const el = container as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>;
    mozRequestFullScreen?: () => Promise<void>;
    msRequestFullscreen?: () => void;
  };
  if (el.requestFullscreen) {
    await el.requestFullscreen().catch(() => {});
  } else if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen().catch(() => {});
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  }
}

export function FtthSinglePointMapCard({
  points,
  title = 'Ubicación en mapa',
  subtitle,
  className = '',
  center,
  fullHeight = false,
  embedded = false,
  singlePointZoom = FTTH_MAP_DEFAULT_SINGLE_POINT_ZOOM,
  compactHeader = false,
  mapHeightClassName,
  onClose,
  preserveViewportOnPointsChange = false,
  viewportResetKey,
  panelVisible = true,
  screenTitle = false
}: Props) {
  const mapFrameRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapRef | null>(null);
  const hasAppliedInitialCameraRef = useRef(false);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [showFtthLayer, setShowFtthLayer] = useState(true);
  const [isOverlayLoading, setIsOverlayLoading] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [overlayState, setOverlayState] = useState<OverlayState | null>(null);
  const [mapZoom, setMapZoom] = useState<number | null>(null);
  const [viewportRevision, setViewportRevision] = useState(0);
  const [mapReadyRevision, setMapReadyRevision] = useState(0);
  const fetchTimerRef = useRef<number | null>(null);
  const overlayAbortRef = useRef<AbortController | null>(null);
  const overlayRequestRef = useRef(0);
  const hasCoordinates = points.length > 0;

  const refreshOverlayAfterCamera = useCallback((map: MaplibreMap) => {
    map.once('idle', () => {
      map.resize();
      setViewportRevision(previous => previous + 1);
    });
  }, []);

  // Memoized con primitivos para evitar que el efecto de centrado
  // dispare map.easeTo() en cada re-render y genere un bucle de actualizaciones.
  const defaultCenter = useMemo((): { latitude: number; longitude: number } | null => {
    const centerLat = center?.latitude;
    const centerLng = center?.longitude;
    if (
      typeof centerLat === 'number' &&
      Number.isFinite(centerLat) &&
      typeof centerLng === 'number' &&
      Number.isFinite(centerLng)
    ) {
      return { latitude: centerLat, longitude: centerLng };
    }
    if (points.length > 0) {
      return { latitude: points[0].latitude, longitude: points[0].longitude };
    }
    return null;
    // Dependemos de los valores primitivos, no de las referencias de los objetos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center?.latitude, center?.longitude, points[0]?.latitude, points[0]?.longitude, points.length]);
  const useFtthStreetMap =
    mapZoom !== null && mapZoom >= FTTH_MAP_FTTH_STREET_MIN_ZOOM;
  const initialViewState = buildInitialViewState(
    points,
    defaultCenter,
    singlePointZoom,
    FTTH_MAP_FIT_BOUNDS_MAX_ZOOM
  );

  const syncMapZoomFromInstance = useCallback(() => {
    const zoom = mapRef.current?.getMap()?.getZoom();
    if (typeof zoom !== 'number' || !Number.isFinite(zoom)) {
      return;
    }
    setMapZoom(previous => (previous !== null && Math.abs(previous - zoom) < 0.01 ? previous : zoom));
  }, []);
  const pointsBounds = useMemo(() => {
    if (points.length === 0) {
      return null;
    }
    return points.reduce(
      (acc, point) => {
        acc.minLng = Math.min(acc.minLng, point.longitude);
        acc.maxLng = Math.max(acc.maxLng, point.longitude);
        acc.minLat = Math.min(acc.minLat, point.latitude);
        acc.maxLat = Math.max(acc.maxLat, point.latitude);
        return acc;
      },
      {
        minLng: Number.POSITIVE_INFINITY,
        maxLng: Number.NEGATIVE_INFINITY,
        minLat: Number.POSITIVE_INFINITY,
        maxLat: Number.NEGATIVE_INFINITY
      }
    );
  }, [points]);
  const activePoint = useMemo(
    () => points.find(point => point.id === activeMarkerId) ?? null,
    [points, activeMarkerId]
  );
  const addressGroups = useMemo(
    () => groupNeighborsByAddress(activePoint?.neighbors ?? []),
    [activePoint?.neighbors]
  );
  const activeAddressGroup = useMemo(() => {
    if (!addressGroups.length) {
      return null;
    }
    if (!selectedAddress) {
      return addressGroups[0];
    }
    return addressGroups.find(group => group.addressBase === selectedAddress) ?? addressGroups[0];
  }, [addressGroups, selectedAddress]);
  const heightCarouselIndex = useMemo(() => {
    if (!addressGroups.length || !activeAddressGroup) {
      return 0;
    }
    const i = addressGroups.findIndex(g => g.addressBase === activeAddressGroup.addressBase);
    return i >= 0 ? i : 0;
  }, [addressGroups, activeAddressGroup]);
  const handleOpenMarker = (markerId: string) => {
    setSelectedAddress(null);
    if (!activeMarkerId || activeMarkerId === markerId) {
      setActiveMarkerId(markerId);
      return;
    }

    // Fuerza el reemplazo del popup abierto por el del marker clickeado.
    setActiveMarkerId(null);
    queueMicrotask(() => setActiveMarkerId(markerId));
  };

  const handleFtthLayerChange = (checked: boolean) => {
    setShowFtthLayer(checked);
    setShowLayersMenu(false);
  };

  useEffect(() => {
    if (!activeMarkerId) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (mapFrameRef.current?.contains(target)) {
        return;
      }

      setActiveMarkerId(null);
      setSelectedAddress(null);
      setShowLayersMenu(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [activeMarkerId]);

  useEffect(() => {
    if (!showLayersMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (mapFrameRef.current?.contains(target)) {
        return;
      }

      setShowLayersMenu(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [showLayersMenu]);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => setIsDarkMode(root.classList.contains('dm'));
    applyTheme();

    const observer = new MutationObserver(applyTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    hasAppliedInitialCameraRef.current = false;
    setMapZoom(null);
  }, [viewportResetKey]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || mapReadyRevision === 0) {
      return;
    }

    if (points.length === 0) {
      hasAppliedInitialCameraRef.current = false;
      return;
    }

    if (preserveViewportOnPointsChange && hasAppliedInitialCameraRef.current) {
      return;
    }

    if (points.length === 1 && defaultCenter) {
      const currentCenter = map.getCenter();
      const currentZoom = map.getZoom();
      const isSameCenter =
        Math.abs(currentCenter.lat - defaultCenter.latitude) < 0.000001 &&
        Math.abs(currentCenter.lng - defaultCenter.longitude) < 0.000001;
      const isSameZoom = Math.abs(currentZoom - singlePointZoom) < 0.01;
      if (isSameCenter && isSameZoom) {
        hasAppliedInitialCameraRef.current = true;
        refreshOverlayAfterCamera(map);
        return;
      }
      map.easeTo({
        center: [defaultCenter.longitude, defaultCenter.latitude],
        zoom: singlePointZoom,
        duration: 220
      });
      hasAppliedInitialCameraRef.current = true;
      refreshOverlayAfterCamera(map);
      return;
    }

    if (points.length > 1 && pointsBounds) {
      const bounds = pointsBounds;
      if (
        Number.isFinite(bounds.minLng) &&
        Number.isFinite(bounds.maxLng) &&
        Number.isFinite(bounds.minLat) &&
        Number.isFinite(bounds.maxLat)
      ) {
        const currentBounds = map.getBounds();
        const isSameBounds =
          Math.abs(currentBounds.getWest() - bounds.minLng) < 0.000001 &&
          Math.abs(currentBounds.getEast() - bounds.maxLng) < 0.000001 &&
          Math.abs(currentBounds.getSouth() - bounds.minLat) < 0.000001 &&
          Math.abs(currentBounds.getNorth() - bounds.maxLat) < 0.000001;
        if (isSameBounds) {
          hasAppliedInitialCameraRef.current = true;
          refreshOverlayAfterCamera(map);
          return;
        }
        map.fitBounds(
          [
            [bounds.minLng, bounds.minLat],
            [bounds.maxLng, bounds.maxLat]
          ],
          {
            padding: FTTH_MAP_FIT_BOUNDS_PADDING,
            maxZoom: FTTH_MAP_FIT_BOUNDS_MAX_ZOOM,
            duration: 220
          }
        );
        hasAppliedInitialCameraRef.current = true;
        refreshOverlayAfterCamera(map);
      }
    }
  }, [
    defaultCenter,
    mapReadyRevision,
    points.length,
    pointsBounds,
    preserveViewportOnPointsChange,
    refreshOverlayAfterCamera,
    singlePointZoom
  ]);

  useEffect(() => {
    if (!useFtthStreetMap) {
      setOverlayState(null);
      const map = mapRef.current?.getMap();
      if (map) {
        removeStreetImageOverlayFromMap(map);
      }
    }
  }, [useFtthStreetMap]);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsMapFullscreen(getDocumentFullscreenElement() === mapFrameRef.current);
      const id = window.requestAnimationFrame(() => {
        mapRef.current?.resize();
        setViewportRevision(prev => prev + 1);
      });
      return () => window.cancelAnimationFrame(id);
    };
    const cleanupSync = syncFullscreen();
    const onFullscreenChange = () => {
      cleanupSync?.();
      syncFullscreen();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
    document.addEventListener('mozfullscreenchange', onFullscreenChange as EventListener);
    return () => {
      cleanupSync?.();
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange as EventListener);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange as EventListener);
    };
  }, []);

  // El panel del mapa suele montarse oculto (split). Sin resize + nueva petición de
  // capas, el canvas queda en blanco aunque los markers sí se dibujan.
  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame || !hasCoordinates || !panelVisible) {
      return;
    }

    let resizeFrameId: number | null = null;

    const scheduleMapSync = () => {
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }
      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        if (
          frame.clientWidth < _mapOverlayMinContainerPx ||
          frame.clientHeight < _mapOverlayMinContainerPx
        ) {
          return;
        }
        mapRef.current?.resize();
        setViewportRevision(previous => previous + 1);
      });
    };

    const observer = new ResizeObserver(scheduleMapSync);
    observer.observe(frame);
    scheduleMapSync();

    return () => {
      observer.disconnect();
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }
    };
  }, [hasCoordinates, mapReadyRevision, panelVisible]);

  useEffect(() => {
    if (useFtthStreetMap) {
      return;
    }
    setIsOverlayLoading(false);
    setOverlayState(null);
    const map = mapRef.current?.getMap();
    if (map && mapReadyRevision > 0) {
      removeStreetImageOverlayFromMap(map);
    }
  }, [useFtthStreetMap, mapReadyRevision]);

  useEffect(() => {
    void viewportRevision;
    let loadingTimerId: number | null = null;
    let cancelled = false;

    if (!panelVisible || !hasCoordinates || !useFtthStreetMap) {
      return;
    }

    if (fetchTimerRef.current !== null) {
      window.clearTimeout(fetchTimerRef.current);
      fetchTimerRef.current = null;
    }

    loadingTimerId = window.setTimeout(() => {
      if (!cancelled) {
        setIsOverlayLoading(true);
      }
    }, 0);

    const runStreetImgFetch = (mapReadyAttempt = 0) => {
      if (cancelled) {
        return;
      }

      if (!mapRef.current) {
        if (mapReadyAttempt < 20) {
          window.setTimeout(() => runStreetImgFetch(mapReadyAttempt + 1), 80);
        } else if (!cancelled) {
          setIsOverlayLoading(false);
        }
        return;
      }

      const requestId = overlayRequestRef.current + 1;
      overlayRequestRef.current = requestId;

      const previous = overlayAbortRef.current;
      if (previous) {
        previous.abort();
        }
      const controller = new AbortController();
      overlayAbortRef.current = controller;

      void fetchStreetImageOverlay({
        mapRef: mapRef.current,
        includeFtth: showFtthLayer,
        onSuccess: state => {
          if (overlayRequestRef.current !== requestId || !state) {
            return;
          }
          setOverlayState(state);
          const map = mapRef.current?.getMap();
          if (map) {
            applyStreetImageOverlayToMap(map, state, showFtthLayer);
          }
        },
        signal: controller.signal
      }).finally(() => {
        if (overlayAbortRef.current === controller) {
          overlayAbortRef.current = null;
        }
        if (overlayRequestRef.current === requestId) {
          setIsOverlayLoading(false);
        }
      });
    };

    fetchTimerRef.current = window.setTimeout(() => runStreetImgFetch(), _mapOverlayFetchDelayMs);

    return () => {
      cancelled = true;
      if (loadingTimerId !== null) {
        window.clearTimeout(loadingTimerId);
      }
      if (fetchTimerRef.current !== null) {
        window.clearTimeout(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
      // No abortar en cleanup: viewportRevision cambia seguido y cortaba streetImg
      // aunque la API respondiera bien (layouts[].img).
    };
  }, [hasCoordinates, panelVisible, showFtthLayer, useFtthStreetMap, viewportRevision]);

  // Abortamos streetImg al desmontar.
  useEffect(() => {
    return () => {
      const controller = overlayAbortRef.current;
      if (!controller) {
        return;
      }
      controller.abort();
      overlayAbortRef.current = null;
    };
  }, []);

  // Capas raster vía API imperativa: react-map-gl a veces no pinta Source type=image al montar en split.
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || mapReadyRevision === 0 || !useFtthStreetMap) {
      return;
    }

    let cancelled = false;

    const syncOverlayLayers = () => {
      if (cancelled) {
        return;
      }
      if (!map.isStyleLoaded()) {
        map.once('styledata', syncOverlayLayers);
        return;
      }
      if (!overlayState?.baseImageUrl) {
        removeStreetImageOverlayFromMap(map);
        map.triggerRepaint();
        return;
      }
      try {
        applyStreetImageOverlayToMap(map, overlayState, showFtthLayer);
      } catch {
        map.once('idle', syncOverlayLayers);
      }
    };

    syncOverlayLayers();

    return () => {
      cancelled = true;
      map.off('styledata', syncOverlayLayers);
      map.off('idle', syncOverlayLayers);
    };
  }, [overlayState, showFtthLayer, useFtthStreetMap, mapReadyRevision]);

  useEffect(() => {
    return () => {
      const map = mapRef.current?.getMap();
      if (map) {
        removeStreetImageOverlayFromMap(map);
      }
    };
  }, []);

  return (
    <section
      className={`${
        embedded
          ? 'flex min-h-0 h-full flex-col gap-3 bg-transparent p-0 shadow-none border-0 rounded-none'
          : mapCardClassName
      } ${fullHeight ? 'h-full min-h-0' : ''} ${className}`.trim()}
    >
      <header className="flex items-start justify-between gap-3">
        <h2
          className={`m-0 font-semibold ${
            screenTitle
              ? 'text-lg leading-tight tracking-tight text-(--text-primary) md:text-[1.05rem]'
              : `text-(--primary-2) dark:text-(--secondary) ${
                  compactHeader ? 'text-lg' : 'text-xl'
                }`
          }`}
        >
          {title}
        </h2>
        <div className="flex items-start gap-2">
          <span
            className={`text-(--text-secondary) ${compactHeader ? 'max-w-[75%] text-[11px] leading-tight' : 'text-xs'}`}
          >
            {subtitle ?? `${points.length} punto${points.length === 1 ? '' : 's'} en mapa`}
          </span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel del mapa"
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-(--table-stroke) text-(--text-secondary) transition-colors hover:bg-(--table-header) hover:text-(--text-primary) dark:border-white/15 dark:hover:bg-white/8"
            >
              <IoCloseSharp className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </header>

      {hasCoordinates && defaultCenter ? (
        <div
          ref={mapFrameRef}
          className={`ftth-map-frame relative ${
            fullHeight ? 'min-h-[360px] h-full flex-1' : (mapHeightClassName ?? 'h-[280px]')
          } overflow-visible rounded-xl border border-(--outline) ${
            activePoint ? 'ftth-map-popup-open' : ''
          }`}
        >
          <div className="absolute left-3 top-3 z-30 flex max-w-[calc(100%-7rem)] flex-col items-start gap-2">
            <button
              type="button"
              className="rounded-lg border border-(--outline) bg-(--card) px-3 py-1.5 text-xs font-semibold text-(--text-primary) shadow-sm"
              onClick={() => setShowLayersMenu(prev => !prev)}
            >
              Capas
            </button>
            {showLayersMenu ? (
              <div className="rounded-lg border border-(--outline) bg-(--card) px-3 py-2 shadow-sm">
                {!useFtthStreetMap ? (
                  <p className="max-w-[220px] text-xs leading-snug text-(--text-secondary)">
                    Acercá un poco más el mapa para ver calles y red FTTH.
                  </p>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-(--text-primary)">
                    <input
                      type="checkbox"
                      checked={showFtthLayer}
                      onChange={event => handleFtthLayerChange(event.target.checked)}
                      className="size-4 shrink-0 cursor-pointer accent-(--primary) dark:accent-(--secondary)"
                    />
                    Mostrar red FTTH
                  </label>
                )}
              </div>
            ) : null}
            {useFtthStreetMap && isOverlayLoading ? (
              <div className="inline-flex items-center gap-2 rounded-lg border border-(--outline) bg-(--card) px-2.5 py-1 text-[11px] font-medium text-(--text-secondary) shadow-sm">
                <span
                  className={`h-3 w-3 animate-spin rounded-full border-2 border-(--outline) ${
                    isDarkMode ? 'border-t-(--secondary)' : 'border-t-(--primary)'
                  }`}
                />
                {showFtthLayer ? 'Cargando red FTTH...' : 'Cargando mapa...'}
              </div>
            ) : null}
          </div>

          <div className="absolute right-3 top-3 z-30">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-(--outline) bg-(--card) p-2 text-(--text-primary) shadow-sm"
              aria-pressed={isMapFullscreen}
              aria-label={
                isMapFullscreen ? 'Salir de pantalla completa' : 'Ver mapa en pantalla completa'
              }
              title={
                isMapFullscreen ? 'Salir de pantalla completa' : 'Ver mapa en pantalla completa'
              }
              onClick={() => {
                const el = mapFrameRef.current;
                if (!el) {
                  return;
                }
                void toggleMapFullscreenContainer(el);
              }}
            >
              {isMapFullscreen ? (
                <FiMinimize2 className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <FiMaximize2 className="h-4 w-4 shrink-0" aria-hidden />
              )}
            </button>
          </div>

          <div className="ftth-map-canvas-wrap absolute inset-0 z-0 min-h-0 overflow-hidden rounded-xl">
            <MapView
              ref={instance => {
                mapRef.current = instance;
              }}
              initialViewState={initialViewState}
              mapStyle={
                useFtthStreetMap
                  ? isDarkMode
                    ? API_ONLY_MAP_STYLE_DARK
                    : API_ONLY_MAP_STYLE_LIGHT
                  : isDarkMode
                    ? FTTH_MAP_CONTEXT_STYLE_DARK
                    : FTTH_MAP_CONTEXT_STYLE_LIGHT
              }
              reuseMaps={!embedded}
              style={{ width: '100%', height: '100%' }}
              scrollZoom={!activePoint}
              dragPan={!activePoint}
              dragRotate={false}
              touchPitch={false}
              attributionControl={false}
              onLoad={() => {
                mapRef.current?.resize();
                syncMapZoomFromInstance();
                setMapReadyRevision(prev => prev + 1);
                setViewportRevision(prev => prev + 1);
              }}
              onMoveEnd={() => {
                syncMapZoomFromInstance();
                setViewportRevision(prev => prev + 1);
              }}
            >
            <NavigationControl position="top-right" showCompass={false} />
            {points.map(point => (
              <Marker key={point.id} latitude={point.latitude} longitude={point.longitude} anchor="bottom">
                <button
                  type="button"
                  className="relative flex cursor-pointer flex-col items-center justify-end border-0 bg-transparent pb-1"
                  onClick={() => handleOpenMarker(point.id)}
                  title={point.label}
                  aria-label={`Ver detalle de ${point.label}`}
                >
                  <span
                    className="absolute bottom-0 h-3 w-3 rounded-full blur-[1px] opacity-35"
                    style={{ backgroundColor: toneToColor(point.tone) }}
                  />
                  <span
                    className="relative inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: toneToColor(point.tone) }}
                  >
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/95" />
                  </span>
                  <span
                    className="-mt-px h-0 w-0 border-x-[5px] border-t-[9px] border-x-transparent"
                    style={{ borderTopColor: toneToColor(point.tone) }}
                  />
                  {typeof point.count === 'number' && point.count > 1 ? (
                    <span className="absolute -right-2 -top-1 rounded-full bg-(--text-primary) px-1.5 py-0.5 text-[10px] leading-none font-semibold text-(--card)">
                      {point.count}
                    </span>
                  ) : null}
                </button>
              </Marker>
            ))}
            </MapView>
          </div>

          {activePoint ? (
            <div
              className="ftth-map-neighbors-panel pointer-events-auto absolute z-24 flex h-[min(210px,calc(100%-28px))] w-[min(16.5rem,calc(100%-8.5rem))] min-w-0 flex-col overflow-hidden rounded-[10px] border border-(--outline) bg-(--card) shadow-lg"
              style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
              role="dialog"
              aria-label="Detalle de vecinos en el mapa"
            >
              <div className="relative shrink-0 px-2.5 pt-2.5 pr-10">
                <button
                  type="button"
                  className="absolute right-0.5 top-0.5 flex h-8 w-8 items-center justify-center rounded-full text-(--text-secondary) hover:bg-[color-mix(in_srgb,var(--text-secondary)_14%,transparent)]"
                  aria-label="Cerrar panel de vecinos"
                  onClick={() => {
                    setActiveMarkerId(null);
                    setSelectedAddress(null);
                  }}
                >
                  <IoCloseSharp className="h-5 w-5" aria-hidden />
                </button>
                <p className="text-xs text-(--text-secondary)">
                  {activePoint.count ?? activePoint.neighbors?.length ?? 0} vecino
                  {(activePoint.count ?? activePoint.neighbors?.length ?? 0) === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-sm font-semibold text-(--text-primary)">
                  {activeAddressGroup?.streetName ?? activePoint.address ?? 'Dirección sin datos'}
                </p>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-1.5">
                {addressGroups.length > 1 ? (
                  <div className="flex shrink-0 items-stretch gap-1">
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--outline) bg-(--card) text-(--text-primary) shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Altura anterior"
                      disabled={heightCarouselIndex <= 0}
                      onClick={() => {
                        const prev = addressGroups[heightCarouselIndex - 1];
                        if (prev) {
                          setSelectedAddress(prev.addressBase);
                        }
                      }}
                    >
                      <IoChevronBack className="h-4 w-4" aria-hidden />
                    </button>
                    <div
                      className="flex min-w-0 flex-1 items-center justify-center rounded-full border px-2 py-1 text-center text-[11px] font-semibold leading-tight text-(--text-primary)"
                      style={{
                        borderColor: toneToColor(activeAddressGroup?.tone ?? 'neutral'),
                        backgroundColor: `color-mix(in srgb, ${toneToColor(activeAddressGroup?.tone ?? 'neutral')} 22%, transparent)`
                      }}
                      aria-live="polite"
                    >
                      <span className="truncate">
                        Altura {activeAddressGroup?.heightLabel} ({activeAddressGroup?.neighbors.length ?? 0})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--outline) bg-(--card) text-(--text-primary) shadow-sm disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Altura siguiente"
                      disabled={heightCarouselIndex >= addressGroups.length - 1}
                      onClick={() => {
                        const next = addressGroups[heightCarouselIndex + 1];
                        if (next) {
                          setSelectedAddress(next.addressBase);
                        }
                      }}
                    >
                      <IoChevronForward className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : addressGroups.length === 1 && activeAddressGroup ? (
                  <div
                    className="flex shrink-0 justify-center rounded-full border px-2.5 py-1 text-center text-[11px] font-semibold text-(--text-primary)"
                    style={{
                      borderColor: toneToColor(activeAddressGroup.tone),
                      backgroundColor: `color-mix(in srgb, ${toneToColor(activeAddressGroup.tone)} 22%, transparent)`
                    }}
                  >
                    Altura {activeAddressGroup.heightLabel} ({activeAddressGroup.neighbors.length})
                  </div>
                ) : null}

                <div className="ftth-map-popup-scroll mt-1.5 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {(activeAddressGroup?.neighbors ?? []).map((neighbor, index, list) => (
                    <div
                      key={neighbor.serial}
                      className="rounded-md border px-2 py-1.5"
                      style={{
                        borderColor: statusBorderColor(neighbor.estado),
                        backgroundColor: statusBackgroundColor(neighbor.estado)
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-(--text-primary)">{neighbor.serial}</p>
                        <span className="text-[10px] font-semibold text-(--text-secondary)">
                          Vecino {index + 1}/{list.length}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-(--text-secondary)">{neighbor.unitLabel}</p>
                      <p className="mt-1 text-[11px]">
                        <span className="text-(--text-secondary)">Estado: </span>
                        <span style={{ color: statusTextColor(neighbor.estado) }} className="font-semibold">
                          {formatStatusLabel(neighbor.estado)}
                        </span>
                      </p>
                      <p className="mt-1 text-[11px] text-(--text-secondary)">
                        ONT RX:{' '}
                        <span style={{ color: getOntRxColor(neighbor.ontRx) }} className="font-semibold">
                          {neighbor.ontRx}
                        </span>{' '}
                        · ONT TX: <span className="font-semibold text-(--text-primary)">{neighbor.ontTx}</span>
                      </p>
                      <p className="text-[11px] text-(--text-secondary)">
                        OLT RX:{' '}
                        <span style={{ color: getOltRxColor(neighbor.oltRx) }} className="font-semibold">
                          {neighbor.oltRx}
                        </span>{' '}
                        · OLT TX:{' '}
                        <span style={{ color: getOltTxColor(neighbor.oltTx) }} className="font-semibold">
                          {neighbor.oltTx}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex h-[180px] items-center justify-center rounded-xl text-sm text-(--text-secondary)">
          Sin coordenadas disponibles para mostrar en mapa.
        </div>
      )}
    </section>
  );
}

async function waitForMapReadyForOverlay(map: MaplibreMap): Promise<void> {
  if (!map.loaded()) {
    await new Promise<void>(resolve => {
      map.once('load', () => resolve());
    });
  }
  if (!map.isStyleLoaded()) {
    await new Promise<void>(resolve => {
      map.once('styledata', () => resolve());
    });
  }
  if (map.isMoving()) {
    await new Promise<void>(resolve => {
      map.once('idle', () => resolve());
    });
  }
}

async function fetchStreetImageOverlay({
  mapRef,
  includeFtth,
  onSuccess,
  signal
}: {
  mapRef: MapRef | null;
  includeFtth: boolean;
  onSuccess: (state: OverlayState | null) => void;
  signal?: AbortSignal;
}) {
  if (!mapRef) {
    return;
  }

  const map = mapRef.getMap();
  if (!map) {
    return;
  }

  await waitForMapReadyForOverlay(map);

  const bounds = map.getBounds();
  const container = map.getContainer();
  if (!bounds || !container) {
    return;
  }

  const west = bounds.getWest();
  const south = bounds.getSouth();
  const east = bounds.getEast();
  const north = bounds.getNorth();
  if (
    container.clientWidth < _mapOverlayMinContainerPx ||
    container.clientHeight < _mapOverlayMinContainerPx
  ) {
    return;
  }

  const spanLng = Math.abs(east - west);
  const spanLat = Math.abs(north - south);
  if (spanLng < 1e-9 || spanLat < 1e-9) {
    return;
  }

  const width = Math.min(2048, Math.round(container.clientWidth));
  const height = Math.min(2048, Math.round(container.clientHeight));

  const payload = {
    minLon: String(lonToWebMercatorX(west)),
    minLat: String(latToWebMercatorY(south)),
    maxLon: String(lonToWebMercatorX(east)),
    maxLat: String(latToWebMercatorY(north)),
    size: `${width},${height}`,
    rotation: '0.0000000000',
    layers: includeFtth ? ['base', 'ftth'] : ['base']
  };

  try {
    const response = await apiFetch('/api/maps/streetImg', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as StreetImgResponse;
    const layoutMap = new Map(
      (data.layouts ?? []).map(layout => [layout.name, layout.img] as const)
    );

    const base =
      toDataImageUrl(layoutMap.get('base')) ?? toDataImageUrl(data.baseImg ?? null);
    const ftth = toDataImageUrl(layoutMap.get('ftth'));
    if (!base) {
      return;
    }
    onSuccess({
      baseImageUrl: base,
      ftthImageUrl: ftth,
      coordinates: [
        [west, north],
        [east, north],
        [east, south],
        [west, south]
      ]
    });
  } catch {
    if (signal?.aborted) {
      return;
    }
    // Silencioso por ahora: mantenemos la última capa válida.
  }
}

function toDataImageUrl(image: string | null | undefined): string | null {
  if (!image) {
    return null;
  }
  const trimmed = image.trim();
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }
  return `data:image/png;base64,${trimmed}`;
}

function removeStreetImageOverlayFromMap(map: MaplibreMap) {
  if (map.getLayer(_streetFtthLayerId)) {
    map.removeLayer(_streetFtthLayerId);
  }
  if (map.getLayer(_streetBaseLayerId)) {
    map.removeLayer(_streetBaseLayerId);
  }
  if (map.getSource(_streetFtthSourceId)) {
    map.removeSource(_streetFtthSourceId);
  }
  if (map.getSource(_streetBaseSourceId)) {
    map.removeSource(_streetBaseSourceId);
  }
}

function applyStreetImageOverlayToMap(
  map: MaplibreMap,
  overlay: OverlayState,
  includeFtth: boolean
) {
  if (!overlay.baseImageUrl) {
    removeStreetImageOverlayFromMap(map);
    return;
  }

  removeStreetImageOverlayFromMap(map);

  map.addSource(_streetBaseSourceId, {
    type: 'image',
    url: overlay.baseImageUrl,
    coordinates: overlay.coordinates
  });
  map.addLayer({
    id: _streetBaseLayerId,
    type: 'raster',
    source: _streetBaseSourceId,
    paint: { 'raster-opacity': 1 }
  });

  if (includeFtth && overlay.ftthImageUrl) {
    map.addSource(_streetFtthSourceId, {
      type: 'image',
      url: overlay.ftthImageUrl,
      coordinates: overlay.coordinates
    });
    map.addLayer({
      id: _streetFtthLayerId,
      type: 'raster',
      source: _streetFtthSourceId,
      paint: { 'raster-opacity': 0.85 }
    });
  }

  map.triggerRepaint();
}

function lonToWebMercatorX(lon: number): number {
  const earthRadius = 6378137;
  return earthRadius * ((lon * Math.PI) / 180);
}

function latToWebMercatorY(lat: number): number {
  const earthRadius = 6378137;
  const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
  return earthRadius * Math.log(Math.tan(Math.PI / 4 + ((clamped * Math.PI) / 180) / 2));
}

export { FtthSinglePointMapCardLoading } from './FtthSinglePointMapCardLoading';

function statusTextColor(status: string): string {
  const normalized = normalizeStatus(status);
  if (normalized === 'GOOD') {
    return 'var(--state-01)';
  }
  if (isInterruptedOrSwitchedOffStatus(normalized)) {
    return 'var(--state-03)';
  }
  if (isDegradedStatus(normalized)) {
    return 'var(--state-02)';
  }
  return 'var(--text-secondary)';
}

function statusBorderColor(status: string): string {
  const normalized = normalizeStatus(status);
  if (normalized === 'GOOD') {
    return 'color-mix(in srgb, var(--state-01) 70%, var(--outline))';
  }
  if (isInterruptedOrSwitchedOffStatus(normalized)) {
    return 'color-mix(in srgb, var(--state-03) 75%, var(--outline))';
  }
  if (isDegradedStatus(normalized)) {
    return 'color-mix(in srgb, var(--state-02) 75%, var(--outline))';
  }
  return 'var(--outline)';
}

function statusBackgroundColor(status: string): string {
  const normalized = normalizeStatus(status);
  if (normalized === 'GOOD') {
    return 'color-mix(in srgb, var(--state-01) 10%, transparent)';
  }
  if (isInterruptedOrSwitchedOffStatus(normalized)) {
    return 'color-mix(in srgb, var(--state-03) 10%, transparent)';
  }
  if (isDegradedStatus(normalized)) {
    return 'color-mix(in srgb, var(--state-02) 12%, transparent)';
  }
  return 'transparent';
}

function groupNeighborsByAddress(neighbors: NonNullable<FtthMapMarkerPoint['neighbors']>) {
  const groups = new Map<string, typeof neighbors>();
  for (const neighbor of neighbors) {
    const key = neighbor.addressBase || 'Dirección sin datos';
    const list = groups.get(key);
    if (list) {
      list.push(neighbor);
    } else {
      groups.set(key, [neighbor]);
    }
  }
  return Array.from(groups.entries()).map(([addressBase, groupedNeighbors]) => ({
    addressBase,
    streetName: groupedNeighbors[0]?.streetName ?? 'Dirección sin datos',
    heightLabel: groupedNeighbors[0]?.heightLabel ?? 'S/N',
    neighbors: groupedNeighbors,
    tone: toneFromStatuses(groupedNeighbors.map(neighbor => neighbor.estado))
  }));
}

function toneFromStatuses(statuses: string[]): FtthMapMarkerPoint['tone'] {
  const normalized = statuses.map(status => normalizeStatus(status));
  const isGood = (value: string) => value === 'GOOD';

  if (normalized.length > 0 && normalized.every(isGood)) {
    return 'green';
  }
  if (normalized.length > 0 && normalized.every(isInterruptedOrSwitchedOffStatus)) {
    return 'red';
  }
  if (normalized.some(isGood)) {
    return 'yellow';
  }
  return 'orange';
}

function normalizeStatus(status: string): string {
  return status.trim().toUpperCase().replace(/\s+/g, '_');
}

function isInterruptedOrSwitchedOffStatus(value: string): boolean {
  return value === 'INTERRUPTED' || value === 'SWITCHED_OFF' || value === 'SWITCHEDOFF';
}

function isDegradedStatus(value: string): boolean {
  return value === 'REDUCED_ROBUSTNESS' || value === 'DEGRADED';
}

function toneToColor(tone: FtthMapMarkerPoint['tone']): string {
  switch (tone) {
    case 'green':
      return 'var(--card-green)';
    case 'yellow':
      return 'var(--card-yellow)';
    case 'orange':
      return 'var(--card-orange)';
    case 'red':
      return 'var(--card-red)';
    default:
      return 'var(--text-secondary)';
  }
}

function buildInitialViewState(
  points: FtthMapMarkerPoint[],
  fallbackCenter: { latitude: number; longitude: number } | null,
  singlePointZoom: number,
  fitBoundsMaxZoom: number
) {
  if (points.length === 0 || !fallbackCenter) {
    return {
      latitude: -34.6037,
      longitude: -58.3816,
      zoom: 11
    };
  }

  if (points.length === 1) {
    return {
      latitude: fallbackCenter.latitude,
      longitude: fallbackCenter.longitude,
      zoom: singlePointZoom
    };
  }

  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  }

  return {
    bounds: [
      [minLng, minLat],
      [maxLng, maxLat]
    ] as [[number, number], [number, number]],
    fitBoundsOptions: {
      padding: FTTH_MAP_FIT_BOUNDS_PADDING,
      maxZoom: fitBoundsMaxZoom
    }
  };
}
