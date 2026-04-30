import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import ScrollToTop from "./components/utils/ScrollToTop";

import HomePage from "./pages/HomePage";
import WorkIndexPage from "./pages/WorkIndexPage";
import ProjectPage from "./pages/ProjectPage";
import AboutPage from "./pages/AboutPage";

function AppShell() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] text-zinc-950 selection:bg-zinc-950 selection:text-white">
      <Header />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work" element={<WorkIndexPage />} />
        <Route path="/work/:slug" element={<ProjectPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  );
}