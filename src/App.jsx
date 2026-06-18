import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  saveTheme, loadListings, saveListings, loadUser, saveUser,
  loadUsers, saveUsers, loadOffers, saveOffers, loadMessages, saveMessages,
  loadMsgSeen, saveMsgSeen, loadNotifSeen, loadReviews, saveReviews, loadDocs, saveDocs,
  loadOnboarded, saveOnboarded, loadReports, saveReports,
} from "./utils/storage";
import { isSupabaseConfigured } from "./lib/supabase";
import * as api from "./lib/api";
import { chargeToEscrow, releaseFromEscrow } from "./lib/paymentProvider";
import { splitAmount } from "./utils/payments";
import { buildNotifications } from "./utils/notifications";
import usePushNotifications from "./hooks/usePushNotifications";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary, NotFoundPage } from "./components/ErrorBoundary";
import { SkeletonGrid } from "./components/Skeleton";
import PageTransition from "./components/PageTransition";

import MobileTabBar from "./components/MobileTabBar";
import AuthModal from "./components/AuthModal";
import OnboardingModal from "./components/OnboardingModal";
import InstallPrompt from "./components/InstallPrompt";

import { LISTINGS } from "./data/listings";

// Lazy loaded pages
const NakliyeHome = lazy(() => import("./pages/NakliyeHome"));
const SahaHome = lazy(() => import("./pages/SahaHome"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const IlanDetayPage = lazy(() => import("./pages/IlanDetayPage"));
const TakipPage = lazy(() => import("./pages/TakipPage"));
const SozlesmePage = lazy(() => import("./pages/SozlesmePage"));
const CuzdanPage = lazy(() => import("./pages/CuzdanPage"));
const IlanVerPage = lazy(() => import("./pages/IlanVerPage"));
const IlanlarimPage = lazy(() => import("./pages/IlanlarimPage"));
const MesajlarPage = lazy(() => import("./pages/MesajlarPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MuteahhitPage = lazy(() => import("./pages/MuteahhitPage"));
const TedarikciPage = lazy(() => import("./pages/TedarikciPage"));
const NakliyeciPage = lazy(() => import("./pages/NakliyeciPage"));
const NasilCalisirPage = lazy(() => import("./pages/NasilCalisirPage"));
const HakkimizdaPage = lazy(() => import("./pages/HakkimizdaPage"));
const IletisimPage = lazy(() => import("./pages/IletisimPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

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

  // Tema: SAHA mobil app tek tema (light/manila). Dark mode kaldırıldı.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "light");
    saveTheme("light");
  }, []);

  // ── VERI KATMANI: Supabase yapilandirilmissa async DB, yoksa localStorage ──
  const SB = isSupabaseConfigured;

  // Ilanlar
  // SB modunda demo ilanlar veritabaninda (seed) oldugu icin LISTINGS eklenmez.
  const [userListings, setUserListings] = useState(() => (SB ? [] : loadListings()));
  useEffect(() => { if (!SB) saveListings(userListings); }, [userListings, SB]);
  const listings = SB ? userListings : [...userListings, ...LISTINGS];
  const reloadListings = async () => { try { setUserListings(await api.fetchListings()); } catch (e) { console.error(e); } };
  const publishListing = async (listing) => {
    if (SB) { try { await api.createListing(listing, profile || user); await reloadListings(); } catch (e) { console.error(e); } }
    else setUserListings(prev => [listing, ...prev]);
  };
  const updateListing = async (id, patch) => {
    if (SB) { try { await api.updateListing(id, patch); setUserListings(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l)); } catch (e) { console.error(e); } }
    else setUserListings(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  };
  const removeListing = async (id) => {
    if (SB) { try { await api.deleteListing(id); setUserListings(prev => prev.filter(l => l.id !== id)); } catch (e) { console.error(e); } }
    else { setUserListings(prev => prev.filter(l => l.id !== id)); setOffers(prev => prev.filter(o => String(o.listingId) !== String(id))); }
  };

  // ── Ödeme / Escrow (emanet) — sağlayıcı (mock veya gerçek) + listing durumu ──
  const payToEscrow = async (listingId, amount) => {
    const split = splitAmount(amount);
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

  // Teklifler
  const [offers, setOffers] = useState(() => (SB ? [] : loadOffers()));
  useEffect(() => { if (!SB) saveOffers(offers); }, [offers, SB]);
  const reloadOffers = async () => { try { setOffers(await api.fetchOffers()); } catch (e) { console.error(e); } };
  const addOffer = async (offer) => {
    if (SB) { try { await api.createOffer(offer, profile || user); await Promise.all([reloadOffers(), reloadListings()]); } catch (e) { console.error(e); } }
    else setOffers(prev => [offer, ...prev]);
  };
  const updateOffer = async (id, patch) => {
    if (SB) { try { await api.updateOffer(id, patch); setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o)); } catch (e) { console.error(e); } }
    else setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch, ...(patch.status ? { updatedAt: new Date().toISOString() } : {}) } : o));
  };

  // Mesajlar
  const [messages, setMessages] = useState(() => (SB ? [] : loadMessages()));
  useEffect(() => { if (!SB) saveMessages(messages); }, [messages, SB]);
  const addMessage = async (msg) => {
    if (SB) { try { const saved = await api.sendMessage(msg); setMessages(prev => [...prev, saved]); } catch (e) { console.error(e); } }
    else setMessages(prev => [...prev, msg]);
  };
  // "Goruldu" ve bildirim okundu durumu — yerel tercih, her modda localStorage'da kalir
  const [msgSeen, setMsgSeen] = useState(() => loadMsgSeen());
  useEffect(() => { saveMsgSeen(msgSeen); }, [msgSeen]);
  // Bildirim "okundu" durumu (yalnızca okuma — push bildirim filtresi için).
  const [notifSeen] = useState(() => loadNotifSeen());

  // Degerlendirmeler (puan + yorum)
  const [reviews, setReviews] = useState(() => (SB ? [] : loadReviews()));
  useEffect(() => { if (!SB) saveReviews(reviews); }, [reviews, SB]);
  const addReview = async (r) => {
    if (SB) { try { await api.addReview(r); setReviews(await api.fetchReviews()); } catch (e) { console.error(e); } }
    else setReviews(prev => [r, ...prev]);
  };

  // Belgeler (K belgesi, ruhsat, vergi levhasi)
  const [docs, setDocs] = useState(() => (SB ? [] : loadDocs()));
  useEffect(() => { if (!SB) saveDocs(docs); }, [docs, SB]);
  const addDoc = async (d) => {
    if (SB) { try { const saved = await api.addDoc({ ...d, ownerId: (profile || user)?.id }); setDocs(prev => [{ ...d, ...saved, ownerId: (profile || user)?.id }, ...prev]); } catch (e) { console.error(e); } }
    else setDocs(prev => [d, ...prev]);
  };
  const removeDoc = async (id) => {
    if (SB) { try { await api.removeDoc(id); } catch (e) { console.error(e); } }
    setDocs(prev => prev.filter(x => x.id !== id));
  };

  // Sikayet / uyusmazlik bildirimleri
  const [reports, setReports] = useState(() => (SB ? [] : loadReports()));
  useEffect(() => { if (!SB) saveReports(reports); }, [reports, SB]);
  const addReport = async (r) => {
    if (SB) { try { await api.addReport({ ...r, fromId: (profile || user)?.id, fromName: (profile || user)?.name }); } catch (e) { console.error(e); } }
    else setReports(prev => [{ ...r, id: Date.now(), createdAt: new Date().toISOString(), status: "acik" }, ...prev]);
  };
  const getUserRating = (userId) => {
    const rs = reviews.filter(r => String(r.toId) === String(userId));
    if (!rs.length) return null;
    return { avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
  };

  // ── Admin / moderasyon (yerel modda tam çalışır; SB için servis rolü ileride) ──
  const setReportStatus = (id, status) => setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  const reviewDoc = (docId, decision) => {
    // decision: "dogrulandi" | "red". Onaylanırsa belge sahibini verified yap.
    const d = docs.find(x => x.id === docId);
    setDocs(prev => prev.map(x => x.id === docId ? { ...x, status: decision } : x));
    if (decision === "dogrulandi" && d) {
      setUsers(prev => prev.map(u => String(u.id) === String(d.ownerId) ? { ...u, verified: true } : u));
      setUser(prev => prev && String(prev.id) === String(d.ownerId) ? { ...prev, verified: true } : prev);
    }
  };

  // ── Kullanici / kimlik dogrulama ──
  const [users, setUsers] = useState(() => loadUsers());            // sadece localStorage modunda kullanilir
  useEffect(() => { if (!SB) saveUsers(users); }, [users, SB]);
  const [user, setUser] = useState(() => (SB ? null : loadUser())); // SB: profil; local: kullanici
  const [profile, setProfile] = useState(null);                     // SB modunda profiles satiri
  useEffect(() => { if (!SB) saveUser(user); }, [user, SB]);
  const [authReady, setAuthReady] = useState(!SB);                  // SB: oturum cozulene kadar bekle
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboard, setShowOnboard] = useState(() => !loadOnboarded());
  const finishOnboard = () => { saveOnboarded(); setShowOnboard(false); };

  // SB: oturum degisimini dinle, profil + verileri yukle
  useEffect(() => {
    if (!SB) return;
    let unsub = () => {};
    const hydrate = async (authUser) => {
      if (authUser) {
        const prof = await api.getProfile(authUser.id).catch(() => null);
        setProfile(prof); setUser(prof || { id: authUser.id, email: authUser.email });
      } else { setProfile(null); setUser(null); }
      setAuthReady(true);
    };
    (async () => {
      const u = await api.getSessionUser().catch(() => null);
      await hydrate(u);
      await Promise.all([reloadListings(), reloadOffers(),
        api.fetchMessages().then(setMessages).catch(() => {}),
        api.fetchReviews().then(setReviews).catch(() => {})]);
      unsub = api.onAuthChange((au) => hydrate(au));
    })();
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SB modunda kullanici giris yapinca kendi belgelerini yukle
  useEffect(() => {
    if (!SB || !user?.id) { return; }
    api.fetchDocs(user.id).then(setDocs).catch(() => {});
  }, [SB, user?.id]);

  const registerUser = async ({ name, email, password, role, phone }) => {
    if (SB) return api.signUp({ name, email, password, role, phone });
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: "Bu e-posta zaten kayitli. Giris yapin." };
    const newUser = { id: Date.now(), name, email, password, role, phone: phone || "", verified: false, rating: 5.0 };
    setUsers(prev => [...prev, newUser]);
    const { password: _pw, ...safe } = newUser;
    setUser(safe);
    return { ok: true };
  };
  const loginUser = async ({ email, password }) => {
    if (SB) return api.signIn({ email, password });
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { ok: false, error: "Kullanici bulunamadi. Once kayit olun." };
    if (found.password && found.password !== password) return { ok: false, error: "Sifre hatali." };
    const { password: _pw, ...safe } = found;
    setUser(safe);
    return { ok: true };
  };
  const logout = async () => { if (SB) { await api.signOut().catch(() => {}); } setUser(null); setProfile(null); };
  const requireAuth = () => setShowAuth(true);
  const markMessagesSeen = () => { if (user) setMsgSeen(prev => ({ ...prev, [user.id]: new Date().toISOString() })); };
  const getContact = (id) => {
    if (SB) {
      // Iletisim bilgileri profiles'tan; eslesen taraf icin isim/ telefon
      const fromMsg = messages.find(m => String(m.fromId) === String(id));
      const fromOffer = offers.find(o => String(o.fromUserId) === String(id));
      const name = fromMsg?.fromName || fromOffer?.fromUser || listings.find(l => String(l.ownerId) === String(id))?.owner;
      return name ? { name, phone: "", email: "" } : null;
    }
    const u = users.find(x => String(x.id) === String(id));
    return u ? { name: u.name, phone: u.phone, email: u.email } : null;
  };
  const updateProfile = async (patch) => {
    if (SB) {
      try { const res = await api.updateProfile(user.id, patch); if (res.ok) { setProfile(res.profile); setUser(res.profile); } }
      catch (e) { console.error(e); }
      return;
    }
    setUser(prev => prev ? { ...prev, ...patch } : prev);
    setUsers(prev => prev.map(u => (user && u.id === user.id) ? { ...u, ...patch } : u));
  };
  // Telefon doğrulandı: numara + phoneVerified bayrağını profile yaz
  const verifyPhone = async (phone) => updateProfile({ phone, phoneVerified: true });

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
  const notif = buildNotifications(user, { listings, offers, messages }, notifSeenIso);

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
                <Route path="/" element={<PageTransition><NakliyeHome listings={listings} user={user} offers={offers} pendingOffersCount={pendingOffersCount} unreadCount={unreadCount} onLoginClick={requireAuth} /></PageTransition>} />
                <Route path="/saha" element={<PageTransition><SahaHome listings={listings} user={user} pendingOffersCount={pendingOffersCount} /></PageTransition>} />
                <Route path="/ilanlar" element={<PageTransition><ListingsPage listings={listings} /></PageTransition>} />
                <Route path="/ilan/:id" element={<PageTransition><IlanDetayPage listings={listings} user={user} onRequireAuth={requireAuth} offers={offers} onAddOffer={addOffer} onReport={addReport} /></PageTransition>} />
                <Route path="/takip/:id" element={<PageTransition><TakipPage listings={listings} user={user} offers={offers} getContact={getContact} reviews={reviews} onAddReview={addReview} getUserRating={getUserRating} onUpdateListing={updateListing} onReport={addReport} onPayToEscrow={payToEscrow} onReleasePayment={releasePayment} /></PageTransition>} />
                <Route path="/sozlesme/:offerId" element={<PageTransition><SozlesmePage listings={listings} offers={offers} getContact={getContact} /></PageTransition>} />
                <Route path="/cuzdan" element={<PageTransition><CuzdanPage user={user} listings={listings} offers={offers} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilan-ver" element={<PageTransition><IlanVerPage onPublish={publishListing} onUpdate={updateListing} listings={listings} user={user} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilan-duzenle/:id" element={<PageTransition><IlanVerPage onPublish={publishListing} onUpdate={updateListing} listings={listings} user={user} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilanlarim" element={<PageTransition><IlanlarimPage listings={listings} user={user} offers={offers} onUpdateOffer={updateOffer} onUpdateListing={updateListing} onDeleteListing={removeListing} onRequireAuth={requireAuth} getContact={getContact} /></PageTransition>} />
                <Route path="/mesajlar" element={<PageTransition><MesajlarPage user={user} listings={listings} offers={offers} messages={messages} onSendMessage={addMessage} onRequireAuth={requireAuth} onSeen={markMessagesSeen} getContact={getContact} /></PageTransition>} />
                <Route path="/profil" element={<PageTransition><ProfilPage user={user} onUpdateProfile={updateProfile} onVerifyPhone={verifyPhone} onRequireAuth={requireAuth} onLogout={logout} reviews={reviews} getUserRating={getUserRating} docs={docs.filter(d => user && String(d.ownerId) === String(user.id))} onAddDoc={addDoc} onRemoveDoc={removeDoc} /></PageTransition>} />
                <Route path="/panel" element={<PageTransition><DashboardPage user={user} listings={listings} offers={offers} messages={messages} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/admin" element={<PageTransition><AdminPage user={user} reports={reports} docs={docs} users={users} listings={listings} onRequireAuth={requireAuth} onSetReportStatus={setReportStatus} onReviewDoc={reviewDoc} /></PageTransition>} />
                <Route path="/muteahhit" element={<PageTransition><MuteahhitPage /></PageTransition>} />
                <Route path="/tedarikci" element={<PageTransition><TedarikciPage /></PageTransition>} />
                <Route path="/nakliyeci" element={<PageTransition><NakliyeciPage /></PageTransition>} />
                <Route path="/nasil-calisir" element={<PageTransition><NasilCalisirPage /></PageTransition>} />
                <Route path="/hakkimizda" element={<PageTransition><HakkimizdaPage /></PageTransition>} />
                <Route path="/iletisim" element={<PageTransition><IletisimPage /></PageTransition>} />
                <Route path="/yasal/:slug" element={<PageTransition><LegalPage /></PageTransition>} />
                <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </Suspense>
          )}
        </ErrorBoundary>
      </main>

      <InstallPrompt />
      <MobileTabBar unreadCount={unreadCount} />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={loginUser} onRegister={registerUser} />}
      {showOnboard && !showAuth && <OnboardingModal onClose={finishOnboard} />}
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
