import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  saveTheme, loadListings, saveListings, loadUser, saveUser,
  loadUsers, saveUsers, loadOffers, saveOffers, loadMessages, saveMessages,
  loadMsgSeen, saveMsgSeen, loadNotifSeen, saveNotifSeen, loadReviews, saveReviews, loadDocs, saveDocs,
  loadOnboarded, saveOnboarded, loadReports, saveReports, loadPricingConfig, loadSavedSearches,
  loadAuditLog, appendAudit, loadAnnouncement, saveAnnouncement, loadBlocked, saveBlocked,
  loadNotifPrefs, saveNotifPrefs, loadFleet, saveFleet, loadMolaPosts, saveMolaPosts,
  loadMolaThreads, saveMolaThreads, loadMolaReplies, saveMolaReplies,
} from "./utils/storage";
import { visibleReviewsFor } from "./utils/reviewGate";
import { newId, nowIso } from "./utils/id";
import { isAdmin } from "./utils/admin";
import { Capacitor } from "@capacitor/core";
import { isSupabaseConfigured } from "./lib/supabase";
import * as api from "./lib/api";
import { chargeToEscrow, releaseFromEscrow, refundEscrow } from "./lib/paymentProvider";
import { splitAmount, earlyPayout } from "./utils/payments";
import { PAYMENTS_ENABLED } from "./config/features";
import { buildNotifications } from "./utils/notifications";
import usePushNotifications from "./hooks/usePushNotifications";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary, NotFoundPage } from "./components/ErrorBoundary";
import { SkeletonGrid } from "./components/Skeleton";
import PageTransition from "./components/PageTransition";
import { initBackButton, initDeepLinks } from "./native/capacitor";

import MobileTabBar from "./components/MobileTabBar";
import AuthModal from "./components/AuthModal";
import NewPasswordModal from "./components/NewPasswordModal";
import RoleSelectModal from "./components/RoleSelectModal";
import OnboardingModal from "./components/OnboardingModal";
import InstallPrompt from "./components/InstallPrompt";
import OfflineBanner from "./components/OfflineBanner";
import UpdateBanner from "./components/UpdateBanner";

import { LISTINGS, DEMO_SELLER } from "./data/listings";

// Lazy loaded pages
const NakliyeHome = lazy(() => import("./pages/NakliyeHome"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const IlanDetayPage = lazy(() => import("./pages/IlanDetayPage"));
const TakipPage = lazy(() => import("./pages/TakipPage"));
const SozlesmePage = lazy(() => import("./pages/SozlesmePage"));
const CuzdanPage = lazy(() => import("./pages/CuzdanPage"));
const IlanVerPage = lazy(() => import("./pages/IlanVerPage"));
const IlanlarimPage = lazy(() => import("./pages/IlanlarimPage"));
const TekliflerimPage = lazy(() => import("./pages/TekliflerimPage"));
const MesajlarPage = lazy(() => import("./pages/MesajlarPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const SaticiProfilPage = lazy(() => import("./pages/SaticiProfilPage"));
const AliciProfilPage = lazy(() => import("./pages/AliciProfilPage"));
const NakliyeciProfilPage = lazy(() => import("./pages/NakliyeciProfilPage"));
const MolaYeriPage = lazy(() => import("./pages/MolaYeriPage"));
const MolaDetayPage = lazy(() => import("./pages/MolaDetayPage"));
const MolaPaylasPage = lazy(() => import("./pages/MolaPaylasPage"));
const MolaThreadPage = lazy(() => import("./pages/MolaThreadPage"));
const MolaBaslikAcPage = lazy(() => import("./pages/MolaBaslikAcPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MuteahhitPage = lazy(() => import("./pages/MuteahhitPage"));
const TedarikciPage = lazy(() => import("./pages/TedarikciPage"));
const NakliyeciPage = lazy(() => import("./pages/NakliyeciPage"));
const NasilCalisirPage = lazy(() => import("./pages/NasilCalisirPage"));
const HakkimizdaPage = lazy(() => import("./pages/HakkimizdaPage"));
const IletisimPage = lazy(() => import("./pages/IletisimPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
// const PiyasaNabziPage = lazy(() => import("./pages/PiyasaNabziPage")); // Piyasa Nabzı özelliği komple gizlendi
const BildirimlerPage = lazy(() => import("./pages/BildirimlerPage"));
const DispatchPage = lazy(() => import("./pages/DispatchPage"));
const TripHistoryPage = lazy(() => import("./pages/TripHistoryPage"));
const FiyatSimulasyonuPage = lazy(() => import("./pages/FiyatSimulasyonuPage"));
const FleetPage = lazy(() => import("./pages/FleetPage"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PageLoader() {
  return <div className="page-content"><SkeletonGrid count={6} /></div>;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  // Android donanım geri tuşu: alt sayfalarda geri git, kökte uygulamadan çık.
  useEffect(() => {
    let cleanup = () => {};
    initBackButton(navigate, () => window.location.pathname === "/").then((fn) => { cleanup = fn; });
    return () => cleanup();
  }, [navigate]);

  // Deep link: paylaşılan ilan bağlantısıyla uygulama açılınca ilgili rotaya git.
  useEffect(() => {
    let cleanup = () => {};
    initDeepLinks(navigate).then((fn) => { cleanup = fn; });
    return () => cleanup();
  }, [navigate]);

  // Tema: SAHA mobil app tek tema (light/manila). Dark mode kaldırıldı.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    saveTheme("light");
  }, []);

  // ── VERI KATMANI: Supabase yapilandirilmissa async DB, yoksa localStorage ──
  const SB = isSupabaseConfigured;
  const [sbHealth, setSbHealth] = useState(null); // { ok, code, message } — SB modunda tani

  // Ilanlar
  // SB modunda demo ilanlar veritabaninda (seed) oldugu icin LISTINGS eklenmez.
  const [userListings, setUserListings] = useState(() => (SB ? [] : loadListings()));
  useEffect(() => { if (!SB) saveListings(userListings); }, [userListings, SB]);
  // Kullanicilar + denetim kaydi (banli filtreleme listings'ten once gerektigi icin burada)
  const [users, setUsers] = useState(() => {                        // sadece localStorage modunda kullanilir
    const stored = loadUsers();
    if (SB) return stored;
    // Demo satici hesabini seed et (vitrin /satici/:id dolu gozuksun) — yoksa ekle.
    return stored.some((u) => String(u.id) === String(DEMO_SELLER.id)) ? stored : [...stored, DEMO_SELLER];
  });
  useEffect(() => { if (!SB) saveUsers(users); }, [users, SB]);
  const [audit, setAudit] = useState(() => loadAuditLog());
  const [announcement, setAnnouncement] = useState(() => loadAnnouncement());
  const [blocked, setBlocked] = useState(() => loadBlocked()); // { [blockerId]: [engellenenId] }
  const allListings = SB ? userListings : [...userListings, ...LISTINGS];
  const bannedIds = new Set(users.filter((u) => u.status === "banli").map((u) => String(u.id)));
  // Yaptirim: banli kullanicilarin ilanlari kamuya gizlenir (admin tum ilanlari gorur).
  const listings = bannedIds.size ? allListings.filter((l) => !bannedIds.has(String(l.ownerId))) : allListings;
  const reloadListings = async () => { try { setUserListings(await api.fetchListings()); } catch (e) { console.error(e); } };
  const publishListing = async (listing) => {
    if (user?.status === "banli") return null;   // yaptirim: banli kullanici ilan veremez
    if (SB) {
      // DB kaydı başarısızsa hata yukarı fırlatılır; UI sahte "yayında" göstermez.
      const saved = await api.createListing(listing, profile || user);
      await reloadListings();
      return saved; // gerçek DB id'li ilan
    }
    setUserListings(prev => [listing, ...prev]);
    return listing;
  };
  const updateListing = async (id, patch) => {
    if (SB) {
      try { await api.updateListing(id, patch); setUserListings(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l)); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Güncelleme başarısız." }; }
    }
    setUserListings(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
    return { ok: true };
  };
  const removeListing = async (id) => {
    if (SB) {
      try {
        await api.deleteListing(id);
        // DB cascade teklifleri de siler; yerel state'ten de düş (yoksa ~15sn boyunca
        // silinen ilana bağlı öksüz teklifler kalır — yerel modla tutarsız).
        setUserListings(prev => prev.filter(l => l.id !== id));
        setOffers(prev => prev.filter(o => String(o.listingId) !== String(id)));
        return { ok: true };
      }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Silme başarısız." }; }
    }
    setUserListings(prev => prev.filter(l => l.id !== id)); setOffers(prev => prev.filter(o => String(o.listingId) !== String(id)));
    return { ok: true };
  };

  // ── Ödeme / Escrow (emanet) — sağlayıcı (mock veya gerçek) + listing durumu ──
  const payToEscrow = async (listingId, amount) => {
    const split = splitAmount(amount, loadPricingConfig().feeRate ?? undefined);
    const res = await chargeToEscrow({ amount: split.total, listingId, payerId: (profile || user)?.id });
    if (!res?.ok) return { ok: false, error: res?.error || "Ödeme başarısız." };
    await updateListing(listingId, {
      paymentStatus: "bloke", paymentAmount: split.total, paymentFee: split.fee, paymentRef: res.providerRef,
    });
    return { ok: true, mock: res.mock, ...split };
  };
  const releasePayment = async (listing) => {
    const res = await releaseFromEscrow({ providerRef: listing.paymentRef, payoutTo: listing.ownerId });
    if (!res?.ok) return { ok: false, error: res?.error || "Serbest bırakma başarısız." };
    await updateListing(listing.id, { paymentStatus: "serbest" });
    return { ok: true, mock: res.mock };
  };
  // Anlaşmazlık → emanetteki parayı müteahhite iade et.
  const refundPayment = async (listing) => {
    const res = await refundEscrow({ providerRef: listing.paymentRef });
    if (!res?.ok) return { ok: false, error: res?.error || "İade başarısız." };
    await updateListing(listing.id, { paymentStatus: "iade" });
    return { ok: true, mock: res.mock };
  };
  // Hızlı Ödeme → teslim onaylı işte nakliyeci hakedişini anında alır (erken-ödeme ücreti kesilir).
  const earlyPayoutNakliyeci = async (listing) => {
    const split = splitAmount(listing.paymentAmount || 0);
    const early = earlyPayout(split.payout);
    const res = await releaseFromEscrow({ providerRef: listing.paymentRef, payoutTo: listing.acceptedById || listing.ownerId });
    if (!res?.ok) return { ok: false, error: res?.error || "Hızlı ödeme başarısız." };
    await updateListing(listing.id, { paymentStatus: "serbest", earlyPaid: true, earlyPayFee: early.fee });
    return { ok: true, mock: res.mock, ...early };
  };
  // Admin hakemi: itiraz edilen teslimi karara bağlar.
  // forNakliyeci=true → teslim onay + ödeme nakliyeciye serbest; false → müteahhite iade.
  const resolveDispute = async (listing, forNakliyeci) => {
    const proof = { ...(listing.deliveryProof || {}), status: forNakliyeci ? "onay" : "iade", adminResolved: true, resolvedAt: new Date().toISOString() };
    logAdmin("dispute", `${listing.title || listing.id}: ${forNakliyeci ? "nakliyeci lehine (ödeme)" : "alıcı lehine (iade)"}`);
    if (forNakliyeci) {
      await updateListing(listing.id, { deliveryProof: proof, phase: "teslim", status: "kapali" });
      return releasePayment(listing);
    }
    await updateListing(listing.id, { deliveryProof: proof });
    return refundPayment(listing);
  };

  // Teklifler
  const [offers, setOffers] = useState(() => (SB ? [] : loadOffers()));
  useEffect(() => { if (!SB) saveOffers(offers); }, [offers, SB]);
  const reloadOffers = async () => { try { setOffers(await api.fetchOffers()); } catch (e) { console.error(e); } };
  const addOffer = async (offer) => {
    if (user?.status === "banli") return { ok: false, error: "Hesabın askıya alındı." };   // yaptirim: banli kullanici teklif veremez
    if (SB) {
      try { await api.createOffer(offer, profile || user); await Promise.all([reloadOffers(), reloadListings()]); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Teklif gönderilemedi." }; }
    }
    setOffers(prev => [offer, ...prev]);
    return { ok: true };
  };
  const updateOffer = async (id, patch) => {
    if (SB) {
      try { await api.updateOffer(id, patch); setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o)); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Teklif güncellenemedi." }; }
    }
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch, ...(patch.status ? { updatedAt: new Date().toISOString() } : {}) } : o));
    return { ok: true };
  };
  // İlan-sahibi teklif kabul — ATOMİK (SB: accept_offer RPC; teklif 'kabul' + kardeşler
  // 'ret' + ilan 'eslesti' tek transaction). Eski iki-adımlı akış yarı-kalıp çift-kabule
  // yol açabiliyordu. Yerel modda sıralı ama tek cihaz olduğu için yaris yok.
  const acceptOffer = async (offer, listing) => {
    if (SB) {
      try {
        await api.acceptOfferRpc(offer.id);
        await Promise.all([reloadOffers(), reloadListings()]);
        return { ok: true };
      } catch (e) { console.error(e); return { ok: false, error: e?.message || "Teklif kabul edilemedi." }; }
    }
    const now = new Date().toISOString();
    setOffers(prev => prev.map(o =>
      o.id === offer.id ? { ...o, status: "kabul", updatedAt: now }
      : (String(o.listingId) === String(listing.id) && o.status === "beklemede") ? { ...o, status: "ret", updatedAt: now }
      : o));
    setUserListings(prev => prev.map(l => String(l.id) === String(listing.id) ? { ...l, status: "eslesti", acceptedById: offer.fromUserId } : l));
    return { ok: true };
  };
  // ── Doğrudan kabul ── (sabit fiyatlı iş ilanı): nakliyeci teklif vermeden işi
  // sabit fiyattan alır. Sonuç durum teklif-kabul ile birebir aynı: offer
  // status "kabul" + listing status "eslesti".
  // assignedVehicle (ops.): nakliyecinin filosundan bu işe atadığı araç+şoför.
  const acceptJob = async (listing, assignedVehicle = null) => {
    const me = profile || user;
    if (!me) return { ok: false, error: "Giriş gerekli." };
    if (me.status === "banli") return { ok: false, error: "Hesabın askıya alındı." };
    if (listing.status === "eslesti" || listing.status === "kapali") return { ok: false, error: "Bu iş artık uygun değil." };
    const av = assignedVehicle
      ? { plate: assignedVehicle.plate, vehicle: assignedVehicle.vehicle, capacity: assignedVehicle.capacity || "", driverName: assignedVehicle.driverName || "", driverPhone: assignedVehicle.driverPhone || "" }
      : null;
    const base = { listingId: listing.id, price: listing.price ?? null, message: "İş sabit fiyattan kabul edildi." };
    if (SB) {
      try {
        // Tek atomik RPC: teklif 'kabul' + ilan 'eslesti' + atanan araç (RLS-uyumlu).
        await api.acceptJobRpc({ listingId: listing.id, price: listing.price ?? null, vehicle: av });
        await Promise.all([reloadOffers(), reloadListings()]);
      } catch (e) { console.error(e); return { ok: false, error: e?.message || "İşlem başarısız." }; }
    } else {
      const offer = { id: newId(), ...base, fromUser: me.name, fromUserId: me.id, status: "kabul", direct: true, createdAt: nowIso(), updatedAt: nowIso() };
      setOffers(prev => [offer, ...prev]);
      // acceptedById: SB'deki accept_job RPC'si bunu yazar; yerel modda da yaz ki
      // erken ödeme/hakediş (payoutTo: acceptedById || ownerId) doğru tarafa gitsin.
      setUserListings(prev => prev.map(l => String(l.id) === String(listing.id) ? { ...l, status: "eslesti", acceptedById: me.id, ...(av ? { assignedVehicle: av } : {}) } : l));
    }
    return { ok: true };
  };

  // Mesajlar
  const [messages, setMessages] = useState(() => (SB ? [] : loadMessages()));
  useEffect(() => { if (!SB) saveMessages(messages); }, [messages, SB]);
  const reloadMessages = async () => { try { setMessages(await api.fetchMessages()); } catch (e) { console.error(e); } };
  const addMessage = async (msg) => {
    if (SB) {
      try { const saved = await api.sendMessage(msg); setMessages(prev => [...prev, saved]); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Mesaj gönderilemedi." }; }
    }
    setMessages(prev => [...prev, msg]);
    return { ok: true };
  };
  // Okundu: bir sohbeti açınca BANA gelen mesajlara read_at yaz. Karşı taraf bunu
  // "çift-tik (Okundu)" + "son görülme" olarak görür. Her iki modda per-mesaj readAt işler.
  const markThreadRead = async ({ listingId, offerId }) => {
    const me = profile || user;
    if (!me) return;
    const mine = (m) => String(m.toId) === String(me.id) && String(m.listingId) === String(listingId)
      && String(m.offerId ?? "") === String(offerId ?? "") && !m.readAt;
    if (!messages.some(mine)) return;   // okunacak yeni mesaj yok
    const at = new Date().toISOString();
    if (SB) {
      try { await api.markMessagesRead({ listingId, offerId, myId: me.id, at }); }
      catch (e) { console.error(e); return; }
    }
    setMessages(prev => prev.map(m => mine(m) ? { ...m, readAt: at } : m));
  };
  // "Goruldu" ve bildirim okundu durumu — yerel tercih, her modda localStorage'da kalir
  const [msgSeen, setMsgSeen] = useState(() => loadMsgSeen());
  useEffect(() => { saveMsgSeen(msgSeen); }, [msgSeen]);
  // Bildirim "okundu" durumu — bildirim merkezi açılınca güncellenir.
  const [notifSeen, setNotifSeen] = useState(() => loadNotifSeen());
  const markNotifSeen = () => {
    if (!user) return;
    const next = { ...notifSeen, [user.id]: new Date().toISOString() };
    setNotifSeen(next);
    saveNotifSeen(next);
  };
  // Bildirim tercihleri — kullanıcı hangi türleri alacağını seçer (yerel).
  const [notifPrefs, setNotifPrefs] = useState(() => loadNotifPrefs());
  const updateNotifPrefs = (patch) => {
    const next = { ...notifPrefs, ...patch };
    setNotifPrefs(next);
    saveNotifPrefs(next);
  };

  // Degerlendirmeler (puan + yorum)
  const [reviews, setReviews] = useState(() => (SB ? [] : loadReviews()));
  useEffect(() => { if (!SB) saveReviews(reviews); }, [reviews, SB]);
  const addReview = async (r) => {
    if (SB) {
      try { await api.addReview(r); setReviews(await api.fetchReviews()); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Değerlendirme gönderilemedi." }; }
    }
    setReviews(prev => [r, ...prev]);
    return { ok: true };
  };

  // Belgeler (K belgesi, ruhsat, vergi levhasi)
  const [docs, setDocs] = useState(() => (SB ? [] : loadDocs()));
  useEffect(() => { if (!SB) saveDocs(docs); }, [docs, SB]);
  // SB modunda admin panelinin gördüğü TÜM belgeler (herkesinki). Yerel modda docs
  // zaten herkesi içerir, o yüzden adminDocs = docs.
  const [adminDocs, setAdminDocs] = useState([]);
  const allDocs = SB ? adminDocs : docs;
  const addDoc = async (d) => {
    if (SB) {
      try { const saved = await api.addDoc({ ...d, ownerId: (profile || user)?.id }); setDocs(prev => [{ ...d, ...saved, ownerId: (profile || user)?.id }, ...prev]); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Belge yüklenemedi." }; }
    }
    setDocs(prev => [d, ...prev]);
    return { ok: true };
  };
  const removeDoc = async (id) => {
    if (SB) {
      // Yalnızca DB silme başarılıysa state'ten kaldır (hayalet silme önlenir).
      try { await api.removeDoc(id); } catch (e) { console.error(e); return { ok: false, error: e?.message || "Belge silinemedi." }; }
    }
    setDocs(prev => prev.filter(x => x.id !== id));
    return { ok: true };
  };

  // ── Filo (fleet) — nakliyecinin araçları. SB: DB, yerel: localStorage ──
  const [fleet, setFleet] = useState(() => (SB ? [] : loadFleet()));
  useEffect(() => { if (!SB) saveFleet(fleet); }, [fleet, SB]);
  // NOT: myFleet burada HESAPLANAMAZ — `user` state'i aşağıda (TDZ hatası: "Cannot
  // access 'user' before initialization" → siyah ekran). user tanımından SONRA hesaplanır.
  const addVehicle = async (v) => {
    if (user?.status === "banli") return { ok: false, error: "Hesabın askıya alındı." };
    if (SB) {
      try { const saved = await api.addFleetVehicle(user.id, v); setFleet(prev => [saved, ...prev]); return { ok: true, vehicle: saved }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Araç eklenemedi." }; }
    }
    const rec = { id: Date.now(), ownerId: user.id, ...v, active: v.active !== false, createdAt: new Date().toISOString() };
    setFleet(prev => [rec, ...prev]);
    return { ok: true, vehicle: rec };
  };
  const updateVehicle = async (id, patch) => {
    if (SB) {
      try { const saved = await api.updateFleetVehicle(id, patch); setFleet(prev => prev.map(v => v.id === id ? saved : v)); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Araç güncellenemedi." }; }
    }
    setFleet(prev => prev.map(v => v.id === id ? { ...v, ...patch } : v));
    return { ok: true };
  };
  const removeVehicle = async (id) => {
    if (SB) {
      try { await api.removeFleetVehicle(id); } catch (e) { console.error(e); return { ok: false, error: e?.message || "Araç silinemedi." }; }
    }
    setFleet(prev => prev.filter(v => v.id !== id));
    return { ok: true };
  };

  // ── Mola Yeri (mola_posts) — nakliyeci topluluk ilan panosu ──
  const [molaPosts, setMolaPosts] = useState(() => (SB ? [] : loadMolaPosts()));
  useEffect(() => { if (!SB) saveMolaPosts(molaPosts); }, [molaPosts, SB]);
  const addMolaPost = async (p) => {
    const cur = profile || user;
    if (cur?.status === "banli") return { ok: false, error: "Hesabın askıya alındı." };
    const meta = { ownerName: cur?.name || "", ownerVerified: Boolean(cur?.verified) };
    const { photos, ...rest } = p;   // photos: dataURL dizisi
    if (SB) {
      try {
        // Fotoğrafları Storage'a yükle → public URL dizisi; sonra ilanı kaydet.
        const images = (photos && photos.length) ? await api.uploadMolaImages(cur.id, photos) : [];
        const saved = await api.addMolaPost(cur.id, { ...rest, ...meta, images });
        setMolaPosts(prev => [saved, ...prev]);
        return { ok: true, post: saved };
      } catch (e) { console.error(e); return { ok: false, error: e?.message || "Gönderi paylaşılamadı." }; }
    }
    // Yerel mod: base64 dataURL'leri doğrudan sakla (Storage yok).
    const rec = { id: Date.now(), ownerId: cur.id, ...meta, ...rest, images: photos || [], status: "aktif", createdAt: new Date().toISOString() };
    setMolaPosts(prev => [rec, ...prev]);
    return { ok: true, post: rec };
  };
  const removeMolaPost = async (id) => {
    if (SB) {
      try { await api.removeMolaPost(id); } catch (e) { console.error(e); return { ok: false, error: e?.message || "Gönderi silinemedi." }; }
    }
    setMolaPosts(prev => prev.filter(p => p.id !== id));
    return { ok: true };
  };

  // ── Mola Forum (mola_threads / mola_replies) — başlık + yorumlar ──
  const [molaThreads, setMolaThreads] = useState(() => (SB ? [] : loadMolaThreads()));
  const [molaReplies, setMolaReplies] = useState(() => (SB ? [] : loadMolaReplies()));
  useEffect(() => { if (!SB) saveMolaThreads(molaThreads); }, [molaThreads, SB]);
  useEffect(() => { if (!SB) saveMolaReplies(molaReplies); }, [molaReplies, SB]);
  const ownerMeta = () => { const c = profile || user; return { ownerName: c?.name || "", ownerVerified: Boolean(c?.verified) }; };
  // Başlık aç (yalnız onaylı nakliyeci — UI + RLS korur).
  const addThread = async (t) => {
    const cur = profile || user;
    if (cur?.status === "banli") return { ok: false, error: "Hesabın askıya alındı." };
    if (SB) {
      try { const saved = await api.addThread(cur.id, { ...t, ...ownerMeta() }); setMolaThreads(prev => [saved, ...prev]); return { ok: true, thread: saved }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Başlık açılamadı." }; }
    }
    const rec = { id: Date.now(), ownerId: cur.id, ...ownerMeta(), ...t, replyCount: 0, lastReplyAt: new Date().toISOString(), status: "aktif", createdAt: new Date().toISOString() };
    setMolaThreads(prev => [rec, ...prev]);
    return { ok: true, thread: rec };
  };
  const removeThread = async (id) => {
    if (SB) { try { await api.removeThread(id); } catch (e) { console.error(e); return { ok: false, error: e?.message || "Başlık silinemedi." }; } }
    setMolaThreads(prev => prev.filter(t => t.id !== id));
    setMolaReplies(prev => prev.filter(r => String(r.threadId) !== String(id)));
    return { ok: true };
  };
  // Yorum yaz (tüm nakliyeci).
  const addReply = async (threadId, body) => {
    const cur = profile || user;
    if (cur?.status === "banli") return { ok: false, error: "Hesabın askıya alındı." };
    if (SB) {
      try {
        const saved = await api.addReply(cur.id, { threadId, body, ...ownerMeta() });
        setMolaReplies(prev => [...prev, saved]);
        // SB modunda reply_count'u DB TRIGGER'ı artırır (mola-forum.sql). Burada elle
        // +1 yaparsak ÇİFT sayılır (2 artar). Sadece lastReplyAt'i güncelle; gerçek
        // sayı sonraki fetchThreads ile gelir. (Yerel modda trigger yok → elle artırılır.)
        setMolaThreads(prev => prev.map(t => t.id === threadId ? { ...t, lastReplyAt: saved.createdAt } : t));
        return { ok: true, reply: saved };
      } catch (e) { console.error(e); return { ok: false, error: e?.message || "Yorum gönderilemedi." }; }
    }
    const rec = { id: Date.now(), threadId, ownerId: cur.id, ...ownerMeta(), body, createdAt: new Date().toISOString() };
    setMolaReplies(prev => [...prev, rec]);
    setMolaThreads(prev => prev.map(t => t.id === threadId ? { ...t, replyCount: (t.replyCount || 0) + 1, lastReplyAt: rec.createdAt } : t));
    return { ok: true, reply: rec };
  };
  const removeReply = async (id, threadId) => {
    if (SB) {
      // SB: reply_count'u DB trigger'ı azaltır → burada elle azaltma (çift olur).
      try { await api.removeReply(id); } catch (e) { console.error(e); return { ok: false, error: e?.message || "Yorum silinemedi." }; }
      setMolaReplies(prev => prev.filter(r => r.id !== id));
      return { ok: true };
    }
    setMolaReplies(prev => prev.filter(r => r.id !== id));
    setMolaThreads(prev => prev.map(t => t.id === threadId ? { ...t, replyCount: Math.max(0, (t.replyCount || 0) - 1) } : t));
    return { ok: true };
  };

  // Sikayet / uyusmazlik bildirimleri
  const [reports, setReports] = useState(() => (SB ? [] : loadReports()));
  useEffect(() => { if (!SB) saveReports(reports); }, [reports, SB]);
  const addReport = async (r) => {
    // ReportModal `desc` verir; DB kolonu ve AdminPage `description` bekler —
    // burada normalize edilmezse şikayet açıklaması sessizce boş kalıyordu.
    const rec = { ...r, description: r.description ?? r.desc ?? "" };
    delete rec.desc;
    if (SB) {
      try { await api.addReport({ ...rec, fromId: (profile || user)?.id, fromName: (profile || user)?.name }); return { ok: true }; }
      catch (e) { console.error(e); return { ok: false, error: e?.message || "Şikayet gönderilemedi." }; }
    }
    setReports(prev => [{ ...rec, id: newId(), createdAt: nowIso(), status: "acik" }, ...prev]);
    return { ok: true };
  };
  // Çift-kör: karşı taraf da puanlamadan (ya da süre dolmadan) yorum gizli kalır.
  const getUserRating = (userId) => {
    const rs = visibleReviewsFor(userId, reviews);
    if (!rs.length) return null;
    return { avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
  };

  // ── Admin / moderasyon (SB modunda RLS is_admin() ile DB'ye yazar) ──
  const setReportStatus = async (id, status) => {
    if (SB) { try { await api.updateReport(id, { status }); } catch (e) { console.error(e); return { ok: false, error: e?.message }; } }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    return { ok: true };
  };
  const reviewDoc = async (docId, decision) => {
    // decision: "dogrulandi" | "red". Onaylanırsa belge sahibini verified yap.
    // NOT: allDocs kullan — SB modunda docs yalnız admin'in KENDİ belgelerini tutar,
    // başka kullanıcının belgesi orada bulunamaz (o zaman sahibi doğrulanamazdı).
    const d = allDocs.find(x => x.id === docId);
    if (SB) {
      try {
        await api.updateDocStatus(docId, decision);
        if (decision === "dogrulandi" && d) await api.adminUpdateProfile(d.ownerId, { verified: true });
      } catch (e) { console.error(e); return { ok: false, error: e?.message }; }
    }
    setAdminDocs(prev => prev.map(x => x.id === docId ? { ...x, status: decision } : x));
    setDocs(prev => prev.map(x => x.id === docId ? { ...x, status: decision } : x));
    if (decision === "dogrulandi" && d) {
      setUsers(prev => prev.map(u => String(u.id) === String(d.ownerId) ? { ...u, verified: true } : u));
      setUser(prev => prev && String(prev.id) === String(d.ownerId) ? { ...prev, verified: true } : prev);
    }
    return { ok: true };
  };

  // ── Kullanici / kimlik dogrulama ── (users state yukari tasindi: banli filtreleme listings'ten once gerekir)
  // Admin denetim kaydi — kim, ne zaman, ne yapti.
  const logAdmin = (action, detail) => setAudit(appendAudit({ adminId: user?.id, adminName: user?.name || "admin", action, detail }));
  // Admin: ana sayfa duyuru/kampanya bandini kaydet.
  const saveAnnouncementAdmin = (next) => { setAnnouncement(next); saveAnnouncement(next); logAdmin("duyuru", next.active ? `Yayında: "${next.text}"` : "Kapatıldı"); };
  // Admin: herhangi bir kullaniciyi guncelle (ban/askiya al/rol/manuel onay).
  const updateUserAdmin = async (userId, patch) => {
    // SB modunda önce DB'ye yaz; başarısızsa yerel state'i HİÇ değiştirme
    // (aksi halde UI "banlandı" gösterir ama DB değişmez — yanıltıcı).
    if (SB) { try { await api.adminUpdateProfile(userId, patch); } catch (e) { console.error(e); return { ok: false, error: e?.message }; } }
    setUsers((prev) => prev.map((u) => String(u.id) === String(userId) ? { ...u, ...patch } : u));
    setUser((cur) => (cur && String(cur.id) === String(userId) ? { ...cur, ...patch } : cur));
    const target = users.find((u) => String(u.id) === String(userId));
    const label = "status" in patch ? (patch.status === "banli" ? "Banlandı" : "Ban kaldırıldı") : "role" in patch ? `Rol → ${patch.role}` : patch.verified ? "Onaylandı" : "Onay kaldırıldı";
    logAdmin("user", `${target?.name || userId}: ${label}`);
    return { ok: true };
  };
  const [user, setUser] = useState(() => (SB ? null : loadUser()));  // localStorage'da kayitli kullanici
  const [profile, setProfile] = useState(null);                     // SB modunda profiles satiri
  useEffect(() => { if (!SB) saveUser(user); }, [user, SB]);
  // Sadece kendi araçlarım (fleet yukarıda tanımlı; user burada tanımlandığı için burada hesaplanır).
  const myFleet = fleet.filter((v) => user && String(v.ownerId) === String(user.id));
  const [authReady, setAuthReady] = useState(!SB);                  // SB modunda oturum yuklenince hazir
  const [showAuth, setShowAuth] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false); // sifre sifirlama: yeni sifre modali
  const [showRole, setShowRole] = useState(false);
  const [showOnboard, setShowOnboard] = useState(() => !loadOnboarded());
  const finishOnboard = () => { saveOnboarded(); setShowOnboard(false); };

  // Giris yapilmis ama rolu yok (OAuth ilk giris) -> rol secim modali ac.
  useEffect(() => {
    if (!authReady) return;
    const u = profile || user;
    setShowRole(Boolean(u && !u.role));
  }, [authReady, user, profile]);

  // SB: oturum degisimini dinle, profil + ortak verileri yukle
  useEffect(() => {
    if (!SB) return;
    // Baglanti saglik kontrolu — yanlis anahtar / sema yok durumunu net bildir.
    api.checkHealth().then((h) => {
      setSbHealth(h);
      if (!h.ok) console.error("[Supabase] " + h.code + ": " + h.message);
    }).catch(() => {});
    // Ortak veri (herkese acik ilanlar vb.) oturumdan bagimsiz yuklenir.
    (async () => {
      await Promise.all([reloadListings(), reloadOffers(),
        api.fetchMessages().then(setMessages).catch(() => {}),
        api.fetchReviews().then(setReviews).catch(() => {})]);
    })();
    // Oturum: mevcut kullaniciyi al, sonra degisimleri dinle.
    const hydrate = async (sbUser) => {
      if (sbUser) {
        const prof = await api.getProfile(sbUser.id).catch(() => null);
        // Rol bos ise needsRole akisi RoleSelectModal'i acar (role: "" birakilir).
        setProfile(prof); setUser(prof || { id: sbUser.id, name: sbUser.email || "", role: "", phone: "" });
      } else { setProfile(null); setUser(null); }
      setAuthReady(true);
    };
    api.getSessionUser().then(hydrate).catch(() => setAuthReady(true));
    const unsub = api.onAuthChange(hydrate);
    // Sifre sifirlama baglantisina tiklanip donulunce -> yeni sifre modali ac.
    const unsubPw = api.onPasswordRecovery(() => { setShowAuth(false); setShowNewPassword(true); });
    return () => { try { unsub?.(); unsubPw?.(); } catch { /* noop */ } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SB modunda kullanici giris yapinca kendi belgelerini + filosunu yukle
  useEffect(() => {
    if (!SB || !user?.id) { return; }
    api.fetchDocs(user.id).then(setDocs).catch(() => {});
    api.fetchMyFleet().then(setFleet).catch(() => {});
    // Mola Yeri nakliyeci-özel: yalnız nakliyeci rolünde çek (RLS de korur).
    if (user.role === "nakliyeci") {
      api.fetchMolaPosts().then(setMolaPosts).catch(() => {});
      api.fetchThreads().then(setMolaThreads).catch(() => {});
    }
  }, [SB, user?.id, user?.role]);

  // SB modunda admin giris yapinca moderasyon verisini yukle (profiller + sikayetler).
  // RLS: bu sorgular yalnizca is_admin() icin doner.
  useEffect(() => {
    if (!SB || !isAdmin(user)) return;
    api.fetchAllProfiles().then(setUsers).catch((e) => console.error(e));
    api.fetchAllReports().then(setReports).catch((e) => console.error(e));
    // Admin belge doğrulaması: TÜM kullanıcıların belgeleri (kendi docs state'i yetmez).
    api.fetchAllDocs().then(setAdminDocs).catch((e) => console.error(e));
    // user yerine id+email yeterli (isAdmin yalnizca bunlara bakar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [SB, user?.id, user?.email]);

  // SB modunda canli tazeleme: mesaj/teklif/ilan periyodik cekilir (realtime yok).
  // Sekme arka plandayken durur (pil/veri tasarrufu); one gelince hemen tazeler.
  useEffect(() => {
    if (!SB || !user?.id) return;
    let timer = null;
    const tick = () => { if (document.visibilityState === "visible") { reloadMessages(); reloadOffers(); reloadListings(); } };
    const start = () => { if (!timer) timer = setInterval(tick, 15000); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const onVis = () => { if (document.visibilityState === "visible") { tick(); start(); } else stop(); };
    document.addEventListener("visibilitychange", onVis);
    start();
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [SB, user?.id]);

  // ── Giris: GOOGLE / APPLE (OAuth, sifresiz) ──────────────────
  // SB modunda Supabase saglayiciya yonlendirir; donuste onAuthChange oturumu
  // kurar. localStorage modunda (anahtar yoksa) sahte bir OAuth kullanicisi acar
  // — gelistirme/onizleme icin. Rol Google/Apple'dan gelmez -> needsRole akisi.
  const startOAuth = async (provider) => {
    // Mobil app (Capacitor) -> native giris. supabase.co redirect ekrani gorunmez;
    // idToken Supabase'e verilir, onAuthChange oturumu kurar.
    if (SB && Capacitor.isNativePlatform() && (provider === "google" || provider === "apple")) {
      const res = provider === "apple"
        ? await api.signInWithAppleNative()
        : await api.signInWithGoogleNative();
      if (res.ok) setShowAuth(false);
      return res;
    }
    if (SB) return api.signInWithProvider(provider); // web: tarayici yonlendirilir
    // localStorage modu: sahte hesap (rol henuz yok -> rol secim modali acilir)
    const fake = { id: Date.now(), name: provider === "apple" ? "Apple Kullanici" : "Google Kullanici", email: "", role: "", provider, verified: false, rating: 5.0 };
    setUsers(prev => prev.some(u => u.id === fake.id) ? prev : [...prev, fake]);
    setUser(fake);
    setShowAuth(false);
    return { ok: true };
  };
  // ── Giris: E-POSTA / SIFRE (kayit + giris) ───────────────────
  // SB modu: signUp/signIn Supabase'e yazar; onAuthChange oturumu kurar. Onay
  // e-postasi aciksa needsConfirm doner (modal mesaj gosterir, kapanmaz). Rol
  // e-postadan da gelmez -> needsRole akisi RoleSelectModal'i acar.
  // localStorage modu: sahte hesap acar (gelistirme/onizleme).
  const emailAuth = async ({ mode, name, email, password, role }) => {
    if (SB) {
      const res = mode === "register"
        ? await api.signUp({ name, email, password, role })   // rol kayıt formundan gelir
        : await api.signIn({ email, password });
      if (!res.ok) return res;
      if (res.needsConfirm) return res; // modal acik kalir, onay bekler
      setShowAuth(false);               // oturum kuruldu -> onAuthChange hydrate eder
      return res;
    }
    // localStorage modu: rol kayıt formundan gelir (gelmezse boş -> rol modali)
    const fake = { id: Date.now(), name: name || email, email, role: role || "", provider: "email", verified: false, rating: 5.0 };
    setUsers(prev => prev.some(u => u.email === email) ? prev : [...prev, fake]);
    setUser(fake);
    setShowAuth(false);
    return { ok: true };
  };
  // Sifremi unuttum -> sifirlama baglantili e-posta (SB modu). localStorage modunda
  // backend yok -> bilgi mesaji ile gecistir (gelistirme/onizleme).
  const resetPassword = async ({ email }) => {
    if (SB) return api.resetPassword({ email });
    return { ok: true, message: "Önizleme modunda şifre sıfırlama devre dışı." };
  };
  // Yeni sifre belirle (recovery oturumu) -> Supabase'e yazar, modali kapatir.
  const updatePassword = async ({ password }) => {
    if (!SB) return { ok: true };
    const res = await api.updatePassword({ password });
    return res;
  };
  // Ilk giriste rol secimi -> profile yaz
  const chooseRole = async (role) => {
    const res = await updateProfile({ role });
    // Basarisizsa modal ACIK kalir ve hatayi gosterir (throw -> RoleSelectModal catch).
    if (!res.ok) throw new Error(res.error || "Rol kaydedilemedi, tekrar dene.");
    setShowRole(false);
  };
  const logout = async () => { if (SB) { await api.signOut().catch(() => {}); } setUser(null); setProfile(null); };

  // ── Hesap silme (App Store & Google Play zorunlu) ──
  // Kullanicinin hesabini ve TUM verilerini kalici siler (App Store 5.1.1(v) &
  // Google Play zorunlu). SB modu: delete_my_account RPC auth.users'i siler ->
  // profiles.id cascade ile profil + ilan/teklif/mesaj/yorum/belge otomatik gider.
  // localStorage modu: yereldeki kayitlar temizlenir.
  // Donus: { ok, error? } — cagiran (ProfilPage) sonuca gore toast gosterir.
  const deleteAccount = async () => {
    const cur = profile || user;
    if (!cur) return { ok: false, error: "Oturum yok." };
    const uid = String(cur.id);
    if (SB) {
      const res = await api.deleteMyAccount();
      if (!res.ok) return res; // hata: oturum/UI'yi bozma, kullaniciya bildir
    } else {
      setUserListings((prev) => prev.filter((l) => String(l.ownerId) !== uid));
      setOffers((prev) => prev.filter((o) => String(o.fromUserId) !== uid));
      setMessages((prev) => prev.filter((m) => String(m.fromId) !== uid && String(m.toId) !== uid));
      setDocs((prev) => prev.filter((d) => String(d.ownerId) !== uid));
      setReviews((prev) => prev.filter((r) => String(r.fromId) !== uid));
      // SB modunda delete_my_account cascade ile hepsi gider; yerel modda da temizle
      // (yoksa filo + Mola gönderi/başlık/yorumları silinen kullanıcı adıyla görünür kalır).
      setFleet((prev) => prev.filter((v) => String(v.ownerId) !== uid));
      setMolaPosts((prev) => prev.filter((p) => String(p.ownerId) !== uid));
      setMolaThreads((prev) => prev.filter((t) => String(t.ownerId) !== uid));
      setMolaReplies((prev) => prev.filter((r) => String(r.ownerId) !== uid));
      setReports((prev) => prev.filter((r) => String(r.fromId) !== uid));
      setUsers((prev) => prev.filter((u) => String(u.id) !== uid));
      if (blocked[uid]) { const nb = { ...blocked }; delete nb[uid]; setBlocked(nb); saveBlocked(nb); }
    }
    setUser(null);
    setProfile(null);
    return { ok: true };
  };
  const requireAuth = () => setShowAuth(true);
  const markMessagesSeen = () => { if (user) setMsgSeen(prev => ({ ...prev, [user.id]: new Date().toISOString() })); };
  // SB modunda eşleşen tarafların profil iletişim bilgisi (telefon/e-posta) önbelleği.
  // getContact senkron; eksikse profil arka planda çekilir, sonraki render'da dolar.
  const [contactCache, setContactCache] = useState({}); // { [id]: {name, phone, email} }
  const fetchingContacts = useRef(new Set());
  const ensureContact = (id) => {
    if (!SB || !id || contactCache[id] || fetchingContacts.current.has(String(id))) return;
    fetchingContacts.current.add(String(id));
    api.getProfile(id)
      .then((p) => { if (p) setContactCache(prev => ({ ...prev, [id]: { name: p.name, phone: p.phone || "", email: p.email || "" } })); })
      .catch((e) => console.error(e))
      .finally(() => fetchingContacts.current.delete(String(id)));
  };
  const getContact = (id) => {
    if (SB) {
      if (id) ensureContact(id);                       // eksikse arka planda yükle
      const cached = contactCache[id];
      if (cached) return cached;
      // Önbellek dolana kadar en azından ismi göster (mesaj/teklif/ilandan).
      const fromMsg = messages.find(m => String(m.fromId) === String(id));
      const fromOffer = offers.find(o => String(o.fromUserId) === String(id));
      const name = fromMsg?.fromName || fromOffer?.fromUser || listings.find(l => String(l.ownerId) === String(id))?.owner;
      return name ? { name, phone: "", email: "" } : null;
    }
    const u = users.find(x => String(x.id) === String(id));
    return u ? { name: u.name, phone: u.phone, email: u.email } : null;
  };

  // ── Kullanıcı engelleme (yerel, kullanıcı başına) ──
  const myBlocked = user ? (blocked[user.id] || []).map(String) : [];
  const isBlocked = (id) => myBlocked.includes(String(id));
  const toggleBlock = (id) => {
    if (!user || !id) return;
    const sid = String(id);
    const cur = (blocked[user.id] || []).map(String);
    const nextList = cur.includes(sid) ? cur.filter((x) => x !== sid) : [sid, ...cur];
    const next = { ...blocked, [user.id]: nextList };
    setBlocked(next);
    saveBlocked(next);
  };

  const updateProfile = async (patch) => {
    if (SB) {
      try {
        const res = await api.updateProfile(user.id, patch);
        if (res.ok) { setProfile(res.profile); setUser(res.profile); return { ok: true }; }
        return { ok: false, error: res.error || "Profil güncellenemedi." };
      } catch (e) { console.error(e); return { ok: false, error: e?.message || "Profil güncellenemedi." }; }
    }
    setUser(prev => prev ? { ...prev, ...patch } : prev);
    setUsers(prev => prev.map(u => (user && u.id === user.id) ? { ...u, ...patch } : u));
    return { ok: true };
  };
  // NOT: Telefon SMS doğrulaması şimdilik kaldırıldı (gerçek SMS sağlayıcı bağlı değil).
  // Sağlayıcı bağlanınca PhoneVerifyModal + bu yardımcı geri eklenir:
  //   const verifyPhone = async (phone) => updateProfile({ phone, phoneVerified: true });

  // Sekmeler arasi canli senkron (sadece localStorage modu)
  useEffect(() => {
    if (SB) return;
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key === "hamted_offers") setOffers(loadOffers());
      else if (e.key === "hamted_messages") setMessages(loadMessages());
      else if (e.key === "hamted_listings") setUserListings(loadListings());
      else if (e.key === "hamted_users") setUsers(loadUsers());
      else if (e.key === "hamted_user") setUser(loadUser());
      else if (e.key === "hamted_msg_seen") setMsgSeen(loadMsgSeen());
      else if (e.key === "hamted_reviews") setReviews(loadReviews());
      else if (e.key === "hamted_docs") setDocs(loadDocs());
      else if (e.key === "hamted_fleet") setFleet(loadFleet());
      else if (e.key === "hamted_mola_posts") setMolaPosts(loadMolaPosts());
      else if (e.key === "hamted_mola_threads") setMolaThreads(loadMolaThreads());
      else if (e.key === "hamted_mola_replies") setMolaReplies(loadMolaReplies());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [SB]);

  // Bildirim sayilari
  const pendingOffersCount = user
    ? offers.filter(o => o.status === "beklemede" && userListings.some(l => l.ownerId === user.id && String(l.id) === String(o.listingId))).length
    : 0;
  const seenIso = user ? (msgSeen[user.id] || null) : null;
  const unreadCount = user
    ? messages.filter(m => String(m.toId) === String(user.id) && (!seenIso || m.createdAt > seenIso)).length
    : 0;

  const notifSeenIso = user ? (notifSeen[user.id] || null) : null;
  const notif = buildNotifications(user, { listings, offers, messages, reviews, savedSearches: loadSavedSearches(), molaThreads, molaReplies }, notifSeenIso, notifPrefs);

  // Yeni teklif/mesaj/kabul gelince tarayıcı bildirimi göster (giriş yapılmışsa).
  usePushNotifications(notif.items, Boolean(user));

  return (
    <div className="app-root">
      <ScrollToTop />

      <main>
        <ErrorBoundary>
          {!authReady ? (
            <PageLoader />
          ) : (
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><NakliyeHome listings={listings} user={user} offers={offers} pendingOffersCount={pendingOffersCount} unreadCount={unreadCount} notifUnread={notif.unread} onLoginClick={requireAuth} announcement={announcement} /></PageTransition>} />
                <Route path="/bildirimler" element={<PageTransition><BildirimlerPage user={user} items={notif.items} onSeen={markNotifSeen} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/sevkiyat" element={<PageTransition><DispatchPage user={user} listings={listings} offers={offers} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/sefer-gecmisi" element={<PageTransition><TripHistoryPage user={user} listings={listings} offers={offers} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/filo" element={<PageTransition><FleetPage user={user} fleet={myFleet} onAddVehicle={addVehicle} onUpdateVehicle={updateVehicle} onRemoveVehicle={removeVehicle} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilanlar" element={<PageTransition><ListingsPage listings={listings} blockedIds={myBlocked} offers={offers} reviews={reviews} onRefresh={SB ? () => Promise.all([reloadListings(), reloadOffers()]) : undefined} /></PageTransition>} />
                <Route path="/ilan/:id" element={<PageTransition><IlanDetayPage listings={listings} user={user} fleet={myFleet} onRequireAuth={requireAuth} offers={offers} reviews={reviews} onAddOffer={addOffer} onAcceptJob={acceptJob} onReport={addReport} isBlocked={isBlocked} onToggleBlock={toggleBlock} /></PageTransition>} />
                <Route path="/takip/:id" element={<PageTransition><TakipPage listings={listings} user={user} offers={offers} getContact={getContact} reviews={reviews} onAddReview={addReview} getUserRating={getUserRating} onUpdateListing={updateListing} onReport={addReport} onPayToEscrow={payToEscrow} onReleasePayment={releasePayment} onRefundPayment={refundPayment} onEarlyPayout={earlyPayoutNakliyeci} /></PageTransition>} />
                <Route path="/sozlesme/:offerId" element={<PageTransition><SozlesmePage listings={listings} offers={offers} getContact={getContact} /></PageTransition>} />
                {PAYMENTS_ENABLED && (
                <Route path="/cuzdan" element={<PageTransition><CuzdanPage user={user} listings={listings} offers={offers} onRequireAuth={requireAuth} /></PageTransition>} />
                )}
                <Route path="/ilan-ver" element={<PageTransition><IlanVerPage onPublish={publishListing} onUpdate={updateListing} listings={listings} offers={offers} reviews={reviews} user={user} fleet={myFleet} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilan-duzenle/:id" element={<PageTransition><IlanVerPage onPublish={publishListing} onUpdate={updateListing} listings={listings} offers={offers} reviews={reviews} user={user} fleet={myFleet} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilanlarim" element={<PageTransition><IlanlarimPage listings={listings} user={user} offers={offers} reviews={reviews} onUpdateOffer={updateOffer} onAcceptOffer={acceptOffer} onUpdateListing={updateListing} onDeleteListing={removeListing} onRequireAuth={requireAuth} getContact={getContact} onReport={addReport} /></PageTransition>} />
                <Route path="/tekliflerim" element={<PageTransition><TekliflerimPage listings={listings} user={user} offers={offers} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/mesajlar" element={<PageTransition><MesajlarPage user={user} listings={listings} offers={offers} messages={messages} onSendMessage={addMessage} onRequireAuth={requireAuth} onSeen={markMessagesSeen} onMarkThreadRead={markThreadRead} getContact={getContact} msgSeen={msgSeen} blockedIds={myBlocked} onReport={addReport} onToggleBlock={toggleBlock} /></PageTransition>} />
                <Route path="/profil" element={<PageTransition><ProfilPage user={user} onUpdateProfile={updateProfile} onRequireAuth={requireAuth} onLogout={logout} onDeleteAccount={deleteAccount} reviews={reviews} getUserRating={getUserRating} listings={listings} offers={offers} docs={docs.filter(d => user && String(d.ownerId) === String(user.id))} onAddDoc={addDoc} onRemoveDoc={removeDoc} notifPrefs={notifPrefs} onUpdateNotifPrefs={updateNotifPrefs} onReport={addReport} blockedIds={myBlocked} onToggleBlock={toggleBlock} getContact={getContact} /></PageTransition>} />
                <Route path="/panel" element={<PageTransition><DashboardPage user={user} listings={listings} offers={offers} messages={messages} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/admin" element={<PageTransition><AdminPage user={user} reports={reports} docs={allDocs} users={users} listings={allListings} offers={offers} audit={audit} onRequireAuth={requireAuth} onSetReportStatus={setReportStatus} onReviewDoc={reviewDoc} onUpdateUser={updateUserAdmin} onResolveDispute={resolveDispute} onLog={logAdmin} onUpdateListing={updateListing} announcement={announcement} onSaveAnnouncement={saveAnnouncementAdmin} /></PageTransition>} />
                <Route path="/muteahhit" element={<PageTransition><MuteahhitPage /></PageTransition>} />
                <Route path="/tedarikci" element={<PageTransition><TedarikciPage /></PageTransition>} />
                <Route path="/satici/:id" element={<PageTransition><SaticiProfilPage user={user} users={users} listings={listings} offers={offers} reviews={reviews} getUserRating={getUserRating} onReport={addReport} /></PageTransition>} />
                <Route path="/alici/:id" element={<PageTransition><AliciProfilPage user={user} users={users} listings={listings} offers={offers} reviews={reviews} getUserRating={getUserRating} onReport={addReport} /></PageTransition>} />
                <Route path="/nakliyeci-profil/:id" element={<PageTransition><NakliyeciProfilPage user={user} users={users} listings={listings} offers={offers} reviews={reviews} getUserRating={getUserRating} onReport={addReport} /></PageTransition>} />
                <Route path="/mola" element={<PageTransition><MolaYeriPage user={user} posts={molaPosts} threads={molaThreads} onRemovePost={removeMolaPost} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/mola/:id" element={<PageTransition><MolaDetayPage user={user} posts={molaPosts} onFetchPost={SB ? api.fetchMolaPost : undefined} onRemovePost={removeMolaPost} onRequireAuth={requireAuth} onReport={addReport} /></PageTransition>} />
                <Route path="/mola-paylas" element={<PageTransition><MolaPaylasPage user={user} onAddPost={addMolaPost} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/mola/baslik-ac" element={<PageTransition><MolaBaslikAcPage user={user} onAddThread={addThread} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/mola/forum/:id" element={<PageTransition><MolaThreadPage user={user} threads={molaThreads} replies={molaReplies} onFetchReplies={SB ? api.fetchReplies : undefined} onFetchThread={SB ? api.fetchThread : undefined} onAddReply={addReply} onRemoveReply={removeReply} onRemoveThread={removeThread} onRequireAuth={requireAuth} onReport={addReport} /></PageTransition>} />
                <Route path="/nakliyeci" element={<PageTransition><NakliyeciPage /></PageTransition>} />
                <Route path="/nasil-calisir" element={<PageTransition><NasilCalisirPage /></PageTransition>} />
                <Route path="/hakkimizda" element={<PageTransition><HakkimizdaPage /></PageTransition>} />
                <Route path="/iletisim" element={<PageTransition><IletisimPage /></PageTransition>} />
                {/* Piyasa Nabzı — özellik komple gizlendi (sistem henüz uygun değil); geri açmak için yorumu kaldır */}
                {/* <Route path="/piyasa" element={<PageTransition><PiyasaNabziPage listings={listings} offers={offers} /></PageTransition>} /> */}
                <Route path="/fiyat-simulasyonu" element={<PageTransition><FiyatSimulasyonuPage /></PageTransition>} />
                <Route path="/yasal/:slug" element={<PageTransition><LegalPage /></PageTransition>} />
                <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
          )}
        </ErrorBoundary>
      </main>

      <UpdateBanner />
      {/* SB modunda yanlis yapilandirma uyarisi — sessiz bos ekran yerine net tani */}
      {SB && sbHealth && !sbHealth.ok && (
        <div role="alert" style={{ position: "fixed", left: 12, right: 12, bottom: 76, zIndex: 9999, margin: "0 auto", maxWidth: 440, background: "#7A1212", color: "#fff", border: "2px solid #0A0A0A", borderRadius: 8, padding: "10px 12px", boxShadow: "3px 3px 0 rgba(10,10,10,.4)", fontFamily: "'Space Mono', ui-monospace, monospace", fontSize: 11.5, lineHeight: 1.45 }}>
          <strong style={{ display: "block", fontSize: 12, marginBottom: 2 }}>SUPABASE BAĞLANTI SORUNU</strong>
          {sbHealth.message}
          <button onClick={() => setSbHealth(null)} aria-label="Kapat" style={{ position: "absolute", top: 6, right: 8, background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
      )}
      <OfflineBanner onReconnect={() => { if (SB) { reloadListings(); reloadOffers(); } }} />
      <InstallPrompt />
      <MobileTabBar unreadCount={unreadCount} role={(profile || user)?.role} />

      {showNewPassword && <NewPasswordModal onSubmit={updatePassword} onDone={() => setShowNewPassword(false)} />}
      {showAuth && !showRole && !showNewPassword && <AuthModal onClose={() => setShowAuth(false)} onProvider={startOAuth} onEmailAuth={emailAuth} onReset={resetPassword} />}
      {showRole && <RoleSelectModal onSelect={chooseRole} />}
      {showOnboard && !showAuth && !showRole && <OnboardingModal onClose={finishOnboard} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppShell />
      </ToastProvider>
    </BrowserRouter>
  );
}
