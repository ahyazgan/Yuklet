// YÜKLET — Dönüş Yükü gerçek harita önizlemesi (SAHA marka dili)
// Ana sayfadaki "Boş Dönme" kartının koyu şematik zemini yerine gerçek
// Leaflet haritası: koyu CARTO tile (kartın #141414 zeminiyle uyumlu),
// sarı kesikli güzergah + SAHA nokta/halka işaretçileri.
// Etkileşimsiz önizlemedir (sürükleme/zoom kapalı) — chip'ler üstte kalır.

import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const YELLOW = "#FACC15";
const DARK = "#141414";

// Başlangıç: dolu sarı nokta (şematikteki r=8 daire karşılığı)
const originIcon = L.divIcon({
  className: "saha-marker",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${YELLOW};border:2.5px solid ${DARK};box-shadow:0 0 0 3px rgba(250,204,21,.25);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Hedef: sarı halka (şematikteki içi boş daire karşılığı)
const destIcon = L.divIcon({
  className: "saha-marker",
  html: `<div style="width:15px;height:15px;border-radius:50%;background:${DARK};border:3px solid ${YELLOW};"></div>`,
  iconSize: [15, 15],
  iconAnchor: [7.5, 7.5],
});

// Koordinatlar değişince görünümü yeniden çerçevele (MapContainer prop'ları
// mount sonrası güncellenmez — fit'i imperative yapıyoruz).
function FitRoute({ origin, dest }) {
  const map = useMap();
  useEffect(() => {
    if (origin && dest) {
      map.fitBounds(L.latLngBounds([origin, dest]), { padding: [30, 44] });
    } else if (origin) {
      map.setView(origin, 8);
    }
  }, [map, origin, dest]);
  return null;
}

export default function BackhaulMap({ origin, dest }) {
  if (!origin) return null;
  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      <MapContainer
        center={origin}
        zoom={8}
        style={{ height: "100%", width: "100%", background: DARK }}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        touchZoom={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
      >
        {/* Koyu tile — kartın radar/gece zeminiyle aynı dilde */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {dest && (
          <Polyline
            positions={[origin, dest]}
            pathOptions={{ color: YELLOW, weight: 3, dashArray: "1 9", lineCap: "round" }}
          />
        )}
        <Marker position={origin} icon={originIcon} interactive={false} />
        {dest && <Marker position={dest} icon={destIcon} interactive={false} />}
        <FitRoute origin={origin} dest={dest} />
      </MapContainer>
      {/* tile lisans ibaresi (attributionControl yerine SAHA'ya uygun küçük mono) */}
      <span
        className="absolute bottom-0.5 right-1"
        style={{ zIndex: 500, fontFamily: "'Space Mono',monospace", fontSize: 7, color: "rgba(255,255,255,.45)", pointerEvents: "none" }}
      >
        © OpenStreetMap · CARTO
      </span>
    </div>
  );
}
