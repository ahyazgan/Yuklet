import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  loadTheme, saveTheme, loadListings, saveListings, loadUser, saveUser,
  loadUsers, saveUsers, loadOffers, saveOffers, loadMessages, saveMessages,
  loadMsgSeen, saveMsgSeen, loadNotifSeen, saveNotifSeen, loadReviews, saveReviews, loadDocs, saveDocs,
  loadOnboarded, saveOnboarded,
} from "./utils/storage";
import { buildNotifications } from "./utils/notifications";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary, NotFoundPage } from "./components/ErrorBoundary";
import { SkeletonGrid } from "./components/Skeleton";
import PageTransition from "./components/PageTransition";

import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileTabBar from "./components/MobileTabBar";
import WhatsAppButton from "./components/WhatsAppButton";
import AuthModal from "./components/AuthModal";
import OnboardingModal from "./components/OnboardingModal";

import { LISTINGS } from "./data/listings";

// Lazy loaded pages
const NakliyeHome = lazy(() => import("./pages/NakliyeHome"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const IlanDetayPage = lazy(() => import("./pages/IlanDetayPage"));
const TakipPage = lazy(() => import("./pages/TakipPage"));
const SozlesmePage = lazy(() => import("./pages/SozlesmePage"));
const CuzdanPage = lazy(() => import("./pages/CuzdanPage"));
const IlanVerPage = lazy(() => import("./pages/IlanVerPage"));
const IlanlarimPage = lazy(() => import("./pages/IlanlarimPage"));
const MesajlarPage = lazy(() => import("./pages/MesajlarPage"));
const ProfilPage = lazy(() => import("./pages/ProfilPage"));
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

  // Theme
  const [darkMode, setDarkMode] = useState(() => loadTheme() === "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    saveTheme(darkMode ? "dark" : "light");
  }, [darkMode]);

  // Ilanlar: demo seed + kullanicinin ekledikleri (kalici)
  const [userListings, setUserListings] = useState(() => loadListings());
  useEffect(() => { saveListings(userListings); }, [userListings]);
  const listings = [...userListings, ...LISTINGS];
  const publishListing = (listing) => setUserListings(prev => [listing, ...prev]);
  const updateListing = (id, patch) => setUserListings(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  const removeListing = (id) => {
    setUserListings(prev => prev.filter(l => l.id !== id));
    setOffers(prev => prev.filter(o => String(o.listingId) !== String(id)));
  };

  // Teklifler
  const [offers, setOffers] = useState(() => loadOffers());
  useEffect(() => { saveOffers(offers); }, [offers]);
  const addOffer = (offer) => setOffers(prev => [offer, ...prev]);
  const updateOffer = (id, patch) => setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch, ...(patch.status ? { updatedAt: new Date().toISOString() } : {}) } : o));

  // Mesajlar
  const [messages, setMessages] = useState(() => loadMessages());
  useEffect(() => { saveMessages(messages); }, [messages]);
  const addMessage = (msg) => setMessages(prev => [...prev, msg]);
  const [msgSeen, setMsgSeen] = useState(() => loadMsgSeen());
  useEffect(() => { saveMsgSeen(msgSeen); }, [msgSeen]);
  const [notifSeen, setNotifSeen] = useState(() => loadNotifSeen());
  useEffect(() => { saveNotifSeen(notifSeen); }, [notifSeen]);

  // Degerlendirmeler (puan + yorum)
  const [reviews, setReviews] = useState(() => loadReviews());
  useEffect(() => { saveReviews(reviews); }, [reviews]);
  const addReview = (r) => setReviews(prev => [r, ...prev]);

  // Belgeler (K belgesi, ruhsat, vergi levhasi) — base64
  const [docs, setDocs] = useState(() => loadDocs());
  useEffect(() => { saveDocs(docs); }, [docs]);
  const addDoc = (d) => setDocs(prev => [d, ...prev]);
  const removeDoc = (id) => setDocs(prev => prev.filter(x => x.id !== id));
  const getUserRating = (userId) => {
    const rs = reviews.filter(r => String(r.toId) === String(userId));
    if (!rs.length) return null;
    return { avg: rs.reduce((s, r) => s + r.rating, 0) / rs.length, count: rs.length };
  };

  // Kullanici / kimlik dogrulama
  const [users, setUsers] = useState(() => loadUsers());
  useEffect(() => { saveUsers(users); }, [users]);
  const [user, setUser] = useState(() => loadUser());
  useEffect(() => { saveUser(user); }, [user]);
  const [showAuth, setShowAuth] = useState(false);
  const [showOnboard, setShowOnboard] = useState(() => !loadOnboarded());
  const finishOnboard = () => { saveOnboarded(); setShowOnboard(false); };

  const registerUser = ({ name, email, password, role, phone }) => {
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase()))
      return { ok: false, error: "Bu e-posta zaten kayitli. Giris yapin." };
    const newUser = { id: Date.now(), name, email, password, role, phone: phone || "", verified: false, rating: 5.0 };
    setUsers(prev => [...prev, newUser]);
    const { password: _pw, ...safe } = newUser;
    setUser(safe);
    return { ok: true };
  };
  const loginUser = ({ email, password }) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return { ok: false, error: "Kullanici bulunamadi. Once kayit olun." };
    if (found.password && found.password !== password) return { ok: false, error: "Sifre hatali." };
    const { password: _pw, ...safe } = found;
    setUser(safe);
    return { ok: true };
  };
  const logout = () => setUser(null);
  const requireAuth = () => setShowAuth(true);
  const markMessagesSeen = () => { if (user) setMsgSeen(prev => ({ ...prev, [user.id]: new Date().toISOString() })); };
  const markNotifSeen = () => { if (user) setNotifSeen(prev => ({ ...prev, [user.id]: new Date().toISOString() })); };
  const getContact = (id) => {
    const u = users.find(x => String(x.id) === String(id));
    return u ? { name: u.name, phone: u.phone, email: u.email } : null;
  };
  const updateProfile = (patch) => {
    setUser(prev => prev ? { ...prev, ...patch } : prev);
    setUsers(prev => prev.map(u => (user && u.id === user.id) ? { ...u, ...patch } : u));
  };

  // Sekmeler arasi canli senkron: baska sekmede localStorage degisince state'i tazele
  useEffect(() => {
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
  }, []);

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

  return (
    <div className="app-root">
      <ScrollToTop />

      <Header
        darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)}
        user={user} onLoginClick={requireAuth} onLogout={logout}
        pendingOffersCount={pendingOffersCount} unreadCount={unreadCount}
        notifItems={notif.items} notifUnread={notif.unread} onNotifSeen={markNotifSeen}
      />

      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><NakliyeHome listings={listings} /></PageTransition>} />
                <Route path="/ilanlar" element={<PageTransition><ListingsPage listings={listings} /></PageTransition>} />
                <Route path="/ilan/:id" element={<PageTransition><IlanDetayPage listings={listings} user={user} onRequireAuth={requireAuth} offers={offers} onAddOffer={addOffer} /></PageTransition>} />
                <Route path="/takip/:id" element={<PageTransition><TakipPage listings={listings} user={user} offers={offers} getContact={getContact} reviews={reviews} onAddReview={addReview} getUserRating={getUserRating} onUpdateListing={updateListing} /></PageTransition>} />
                <Route path="/sozlesme/:offerId" element={<PageTransition><SozlesmePage listings={listings} offers={offers} getContact={getContact} /></PageTransition>} />
                <Route path="/cuzdan" element={<PageTransition><CuzdanPage user={user} listings={listings} offers={offers} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilan-ver" element={<PageTransition><IlanVerPage onPublish={publishListing} onUpdate={updateListing} listings={listings} user={user} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilan-duzenle/:id" element={<PageTransition><IlanVerPage onPublish={publishListing} onUpdate={updateListing} listings={listings} user={user} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilanlarim" element={<PageTransition><IlanlarimPage listings={listings} user={user} offers={offers} onUpdateOffer={updateOffer} onUpdateListing={updateListing} onDeleteListing={removeListing} onRequireAuth={requireAuth} getContact={getContact} /></PageTransition>} />
                <Route path="/mesajlar" element={<PageTransition><MesajlarPage user={user} listings={listings} offers={offers} messages={messages} onSendMessage={addMessage} onRequireAuth={requireAuth} onSeen={markMessagesSeen} getContact={getContact} /></PageTransition>} />
                <Route path="/profil" element={<PageTransition><ProfilPage user={user} onUpdateProfile={updateProfile} onRequireAuth={requireAuth} reviews={reviews} getUserRating={getUserRating} docs={docs.filter(d => user && String(d.ownerId) === String(user.id))} onAddDoc={addDoc} onRemoveDoc={removeDoc} /></PageTransition>} />
                <Route path="/panel" element={<PageTransition><DashboardPage user={user} listings={listings} offers={offers} messages={messages} onRequireAuth={requireAuth} /></PageTransition>} />
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
        </ErrorBoundary>
      </main>

      <Footer />
      <WhatsAppButton />
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
