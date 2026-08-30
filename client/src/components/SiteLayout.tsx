/* Paper Lantern direction: shared editorial shell with language switching that respects Arabic and Sorani Kurdish RTL reading flow. */
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowUpRight, Feather, Menu, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (path: string) => location === path;

  // Close sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [location]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <main className="site-shell">
      <div className="paper-grain" aria-hidden="true" />

      <header className="site-header container">
        <Link href="/" className="brand" aria-label="Quietly Remembered home">
          <span className="brand-mark">
            <span className="brand-glow" />
            <span className="brand-thread" />
            <span className="brand-star">✦</span>
          </span>
          <span className="brand-name">quietly remembered</span>
        </Link>

        {/* Desktop nav */}
        <nav className="header-nav" aria-label="Main navigation">
          <Link href="/rituals" className={isActive("/rituals") ? "active" : ""}>{t.smallRituals}</Link>
          <Link href="/about" className={isActive("/about") ? "active" : ""}>{t.about}</Link>
          <Link href="/creators" className={isActive("/creators") ? "active" : ""}>{t.creators}</Link>
          <Link href="/customize" className={isActive("/customize") ? "active" : ""}>{t.customize}</Link>
          <div className="language-switcher" aria-label={String(t.language)}>
            {([["en","EN"],["ar","ع"],["ku","کوردی"]] as const).map(([code,label]) => (
              <button key={code} className={language === code ? "selected" : ""} onClick={() => setLanguage(code)}>{label}</button>
            ))}
          </div>
          <Link href="/write" className="nav-cta">{t.write} <ArrowUpRight size={15} /></Link>
        </nav>

        {/* Mobile hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      <div className={`mobile-overlay ${mobileOpen ? "open" : ""}`} onClick={() => setMobileOpen(false)} aria-hidden="true" />

      {/* Mobile sidebar */}
      <aside className={`mobile-sidebar ${mobileOpen ? "open" : ""}`} aria-label="Mobile navigation">
        <div className="mobile-sidebar-header">
          <Link href="/" className="brand" aria-label="Quietly Remembered home">
            <span className="brand-mark">
              <span className="brand-glow" />
              <span className="brand-thread" />
              <span className="brand-star">✦</span>
            </span>
            <span className="brand-name">quietly remembered</span>
          </Link>
          <button className="mobile-close-btn" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="mobile-sidebar-nav">
          <Link href="/write" className="mobile-sidebar-cta">{t.write} <ArrowUpRight size={16} /></Link>

          <div className="mobile-sidebar-links">
            <Link href="/rituals" className={isActive("/rituals") ? "active" : ""}>{t.smallRituals}</Link>
            <Link href="/about" className={isActive("/about") ? "active" : ""}>{t.about}</Link>
            <Link href="/creators" className={isActive("/creators") ? "active" : ""}>{t.creators}</Link>
            <Link href="/customize" className={isActive("/customize") ? "active" : ""}>{t.customize}</Link>
          </div>

          <div className="mobile-sidebar-lang">
            <span className="mobile-lang-label">{t.language}</span>
            <div className="mobile-lang-buttons">
              {([["en","EN"],["ar","ع"],["ku","کوردی"]] as const).map(([code,label]) => (
                <button key={code} className={language === code ? "selected" : ""} onClick={() => setLanguage(code)}>{label}</button>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {children}

      <footer className="site-footer container">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <span className="brand-glow" />
            <span className="brand-thread" />
            <span className="brand-star">✦</span>
          </span>
          <span className="brand-name">quietly remembered</span>
        </Link>
        <span>{t.footer}</span>
        <Link href="/write">{t.write} <Feather size={13} /></Link>
      </footer>
    </main>
  );
}
