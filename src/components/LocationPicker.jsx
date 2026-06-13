import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ── Haritada yükleme + boşaltma noktası seçimi (anahtarsız OSM).
//    İlk tıklama = yükleme (yeşil), ikinci = boşaltma (kırmızı), üçüncü = sıfırla.

function Clicker({ onClick }) {
  useMapEvents({ click(e) { onClick([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

export default function LocationPicker({ pickup, dropoff, onChange }) {
  const handleClick = (pt) => {
    if (!pickup) onChange({ pickup: pt, dropoff });
    else if (!dropoff) onChange({ pickup, dropoff: pt });
    else onChange({ pickup: pt, dropoff: null }); // yeniden başla
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-navy-line" style={{ height: 300 }}>
      <MapContainer center={[39.3, 35.2]} zoom={6} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Clicker onClick={handleClick} />
        {pickup && (
          <CircleMarker center={pickup} radius={9} pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.9, weight: 2 }}>
            <Tooltip>Yükleme</Tooltip>
          </CircleMarker>
        )}
        {dropoff && (
          <CircleMarker center={dropoff} radius={9} pathOptions={{ color: "#dc2626", fillColor: "#ef4444", fillOpacity: 0.9, weight: 2 }}>
            <Tooltip>Boşaltma</Tooltip>
          </CircleMarker>
        )}
        {pickup && dropoff && <Polyline positions={[pickup, dropoff]} pathOptions={{ color: "#F5B301", weight: 3, dashArray: "6 6" }} />}
      </MapContainer>
    </div>
  );
}
