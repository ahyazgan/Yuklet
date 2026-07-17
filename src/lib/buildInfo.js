// ── Derleme damgası ─────────────────────────────────────────────────
// Değerler vite.config.js'teki define ile DERLEME ANINDA gömülür.
// Cihazdaki paketin hangi commit'ten çıktığını kanıtlar (Profil + BootLoader).
/* global __APP_COMMIT__, __APP_BUILT_AT__ */

export const APP_COMMIT = typeof __APP_COMMIT__ !== "undefined" ? __APP_COMMIT__ : "dev";
export const APP_BUILT_AT = typeof __APP_BUILT_AT__ !== "undefined" ? __APP_BUILT_AT__ : "";
export const BUILD_STAMP = `${APP_COMMIT}${APP_BUILT_AT ? " · " + APP_BUILT_AT : ""}`;
