import { HashRouter, Navigate, Route, Routes, useParams } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/utils/ScrollToTop";

import HomePage from "./pages/HomePage";
import WorkIndexPage from "./pages/WorkIndexPage";
import ProjectPage from "./pages/ProjectPage";
import AboutPage from "./pages/AboutPage";

import { DEFAULT_LOCALE, isValidLocale } from "./i18n/config";

function LocaleGuard({ children }) {
  const { locale } = useParams();

  if (!isValidLocale(locale)) {
    return <Navigate to={`/${DEFAULT_LOCALE}`} replace />;
  }

  return children;
}

function LegacyProjectRedirect() {
  const { slug } = useParams();

  return <Navigate to={`/${DEFAULT_LOCALE}/work/${slug}`} replace />;
}

function AppShell() {
  return (
    <main className="min-h-screen bg-site text-ink selection:bg-ink selection:text-white">
      <Header />

      <Routes>
        <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />

        <Route path="/work" element={<Navigate to={`/${DEFAULT_LOCALE}/work`} replace />} />
        <Route path="/work/:slug" element={<LegacyProjectRedirect />} />
        <Route path="/about" element={<Navigate to={`/${DEFAULT_LOCALE}/about`} replace />} />

        <Route
          path="/:locale"
          element={
            <LocaleGuard>
              <HomePage />
            </LocaleGuard>
          }
        />

        <Route
          path="/:locale/work"
          element={
            <LocaleGuard>
              <WorkIndexPage />
            </LocaleGuard>
          }
        />

        <Route
          path="/:locale/work/:slug"
          element={
            <LocaleGuard>
              <ProjectPage />
            </LocaleGuard>
          }
        />

        <Route
          path="/:locale/about"
          element={
            <LocaleGuard>
              <AboutPage />
            </LocaleGuard>
          }
        />

        <Route path="*" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
      </Routes>

      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <AppShell />
    </HashRouter>
  );
}
