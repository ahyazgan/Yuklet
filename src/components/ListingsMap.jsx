import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { IL_COORDS } from "../data/ilCoords";

// ── İlanları il merkezlerinde balon (CircleMarker) olarak gösteren harita.
//    Görsel asset (marker ikonu) gerektirmez → bundler sorunsuz.

const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();
const COORD_KEYS = Object.keys(IL_COORDS);

export default function ListingsMap({ listings = [], onPickIl }) {
  const groups = {};
  for (const l of listings) {
    const key = COORD_KEYS.find((k) => fold(k) === fold(l.il));
    if (key) (groups[key] = groups[key] || []).push(l);
  }
  const counts = Object.values(groups).map((g) => g.length);
  const maxN = counts.length ? Math.max(...counts) : 1;

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm" style={{ height: 460 }}>
      <MapContainer center={[39.3, 35.2]} zoom={5} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {Object.entries(groups).map(([il, arr]) => (
          <CircleMarker
            key={il}
            center={IL_COORDS[il]}
            radius={9 + (arr.length / maxN) * 16}
            pathOptions={{ color: "#F5B301", weight: 2, fillColor: "#FACC15", fillOpacity: 0.78 }}
            eventHandlers={{ click: () => onPickIl?.(il) }}
          >
            <Tooltip direction="top">{il} · {arr.length} ilan</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
