import { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { loadTheme, saveTheme, loadListings, saveListings, loadUser, saveUser } from "./utils/storage";
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

  // Kullanici / kimlik dogrulama
  const [user, setUser] = useState(() => loadUser());
  useEffect(() => { saveUser(user); }, [user]);
  const [showAuth, setShowAuth] = useState(false);
  const logout = () => setUser(null);

  return (
    <div className="app-root">
      <ScrollToTop />

      <Header
        darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)}
        user={user} onLoginClick={() => setShowAuth(true)} onLogout={logout}
      />

      <main>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><NakliyeHome listings={listings} /></PageTransition>} />
                <Route path="/ilanlar" element={<PageTransition><ListingsPage listings={listings} /></PageTransition>} />
                <Route path="/ilan/:id" element={<PageTransition><IlanDetayPage listings={listings} user={user} onRequireAuth={() => setShowAuth(true)} /></PageTransition>} />
                <Route path="/ilan-ver" element={<PageTransition><IlanVerPage onPublish={publishListing} user={user} onRequireAuth={() => setShowAuth(true)} /></PageTransition>} />
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

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuth={setUser} />}
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
