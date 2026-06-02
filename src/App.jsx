import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import {
  loadTheme, saveTheme, loadListings, saveListings, loadUser, saveUser,
  loadUsers, saveUsers, loadOffers, saveOffers, loadMessages, saveMessages,
} from "./utils/storage";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary, NotFoundPage } from "./components/ErrorBoundary";
import { SkeletonGrid } from "./components/Skeleton";
import PageTransition from "./components/PageTransition";

import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import AuthModal from "./components/AuthModal";

import { LISTINGS } from "./data/listings";

// Lazy loaded pages
const NakliyeHome = lazy(() => import("./pages/NakliyeHome"));
const ListingsPage = lazy(() => import("./pages/ListingsPage"));
const IlanDetayPage = lazy(() => import("./pages/IlanDetayPage"));
const IlanVerPage = lazy(() => import("./pages/IlanVerPage"));
const IlanlarimPage = lazy(() => import("./pages/IlanlarimPage"));
const MesajlarPage = lazy(() => import("./pages/MesajlarPage"));
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

  // Teklifler
  const [offers, setOffers] = useState(() => loadOffers());
  useEffect(() => { saveOffers(offers); }, [offers]);
  const addOffer = (offer) => setOffers(prev => [offer, ...prev]);
  const updateOffer = (id, patch) => setOffers(prev => prev.map(o => o.id === id ? { ...o, ...patch } : o));

  // Mesajlar
  const [messages, setMessages] = useState(() => loadMessages());
  useEffect(() => { saveMessages(messages); }, [messages]);
  const addMessage = (msg) => setMessages(prev => [...prev, msg]);

  // Kullanici / kimlik dogrulama
  const [users, setUsers] = useState(() => loadUsers());
  useEffect(() => { saveUsers(users); }, [users]);
  const [user, setUser] = useState(() => loadUser());
  useEffect(() => { saveUser(user); }, [user]);
  const [showAuth, setShowAuth] = useState(false);

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

  return (
    <div className="app-root">
      <ScrollToTop />

      <Header
        darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)}
        user={user} onLoginClick={requireAuth} onLogout={logout}
      />

      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><NakliyeHome listings={listings} /></PageTransition>} />
                <Route path="/ilanlar" element={<PageTransition><ListingsPage listings={listings} /></PageTransition>} />
                <Route path="/ilan/:id" element={<PageTransition><IlanDetayPage listings={listings} user={user} onRequireAuth={requireAuth} offers={offers} onAddOffer={addOffer} /></PageTransition>} />
                <Route path="/ilan-ver" element={<PageTransition><IlanVerPage onPublish={publishListing} user={user} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/ilanlarim" element={<PageTransition><IlanlarimPage listings={listings} user={user} offers={offers} onUpdateOffer={updateOffer} onUpdateListing={updateListing} onRequireAuth={requireAuth} /></PageTransition>} />
                <Route path="/mesajlar" element={<PageTransition><MesajlarPage user={user} listings={listings} offers={offers} messages={messages} onSendMessage={addMessage} onRequireAuth={requireAuth} /></PageTransition>} />
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

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={loginUser} onRegister={registerUser} />}
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
