// HamTed — İlanlar Haritası (SAHA marka dili)
// Açık (light) Leaflet haritası + SAHA stilinde marker/zoom/önizleme kartı.
// Marker'lar divIcon ile mono rozet (İL · adet) — 2px ink çerçeve, küçük ok ucu.
// Leaflet tile/davranışına dokunulmaz; props (listings, onPickIl) korunur.

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IL_COORDS } from "../data/ilCoords";

// ── SAHA token'ları ──
const C = {
  ink: "#0A0A0A",
  yellow: "#FACC15",
  green: "#16803C",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'Archivo', sans-serif";

const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();
const COORD_KEYS = Object.keys(IL_COORDS);

const fmtPrice = (l) =>
  l && l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : null;

// ── SAHA mono rozet marker (divIcon — görsel asset gerektirmez) ──
function sahaIcon(il, count, active) {
  const bg = active ? C.yellow : C.ink;
  const fg = active ? C.ink : C.yellow;
  const badge = `${il.toLocaleUpperCase("tr-TR")} · ${count}`;
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <div style="
        font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:0.04em;
        white-space:nowrap;padding:3px 8px;background:${bg};color:${fg};
        border:2px solid ${C.ink};border-radius:5px;
        box-shadow:2px 2px 0 rgba(10,10,10,0.25);">
        ${badge}
      </div>
      <div style="
        width:0;height:0;margin-top:-1px;
        border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:7px solid ${C.ink};"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "saha-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 26],
  });
}

// ── SAHA zoom kontrolleri (Leaflet API'sini kullanır, kendi butonumuz) ──
function ZoomControls() {
  const map = useMap();
  const btn = {
    width: 36,
    height: 36,
    background: C.card,
    border: `2px solid ${C.ink}`,
    color: C.ink,
    fontFamily: HEAD,
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "2px 2px 0 rgba(10,10,10,0.2)",
      }}
    >
      <button
        type="button"
        aria-label="Yakınlaştır"
        onClick={() => map.zoomIn()}
        style={{ ...btn, borderBottom: "none" }}
      >
        +
      </button>
      <button
        type="button"
        aria-label="Uzaklaştır"
        onClick={() => map.zoomOut()}
        style={btn}
      >
        −
      </button>
    </div>
  );
}

export default function ListingsMap({ listings = [], onPickIl }) {
  // Seçili il (alttaki önizleme kartı için) — marker tıklama hâlâ onPickIl çağırır.
  const [selected, setSelected] = useState(null);

  const groups = useMemo(() => {
    const g = {};
    for (const l of listings) {
      const key = COORD_KEYS.find((k) => fold(k) === fold(l.il));
      if (key) (g[key] = g[key] || []).push(l);
    }
    return g;
  }, [listings]);

  const selArr = selected && groups[selected] ? groups[selected] : null;
  const preview = selArr ? selArr[0] : null;
  const isH = preview && preview.cat === "hafriyat";
  const fixed = fmtPrice(preview);

  return (
    <div
      style={{
        position: "relative",
        height: 460,
        borderRadius: 6,
        overflow: "hidden",
        border: `2px solid ${C.ink}`,
        boxShadow: "6px 6px 0 rgba(10,10,10,0.12)",
      }}
    >
      <MapContainer
        center={[39.3, 35.2]}
        zoom={5}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.entries(groups).map(([il, arr]) => (
          <Marker
            key={il}
            position={IL_COORDS[il]}
            icon={sahaIcon(il, arr.length, selected === il)}
            eventHandlers={{
              click: () => {
                setSelected(il);
                onPickIl?.(il);
              },
            }}
          />
        ))}
        <ZoomControls />
      </MapContainer>

      {/* ── Seçili ilan önizleme kartı (altta) ── */}
      {preview && (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 500,
            display: "flex",
            background: C.card,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "4px 4px 0 rgba(10,10,10,0.2)",
          }}
        >
          {/* sol dikey şerit */}
          <span
            style={{
              width: 6,
              flexShrink: 0,
              background: isH ? C.yellow : C.ink,
            }}
          />
          <div style={{ flex: 1, minWidth: 0, padding: "9px 11px" }}>
            {/* HMT kodu + durum/adet */}
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.muted }}>
                {selected.toLocaleUpperCase("tr-TR")} · {selArr.length} İLAN
              </span>
              {preview.status === "eslesti" ? (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: C.green,
                    color: "#fff",
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  ● EŞLEŞTİ
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: C.yellow,
                    color: C.ink,
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  ● AKTİF
                </span>
              )}
            </div>
            {/* başlık */}
            <div
              className="truncate"
              style={{
                fontFamily: HEAD,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              {preview.title}
            </div>
            {/* yer · ton + fiyat */}
            <div className="flex items-center justify-between gap-2" style={{ marginTop: 5 }}>
              <span
                className="truncate"
                style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.sub }}
              >
                {preview.il}
                {preview.amount ? ` · ${preview.amount} ${(preview.unit || "").toLocaleUpperCase("tr-TR")}` : ""}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  color: fixed ? C.green : C.sub,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {fixed || "TEKLİFE AÇIK"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
