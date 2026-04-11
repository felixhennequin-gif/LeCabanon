import { useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../components/LocalizedLink";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTheme } from "../hooks/useTheme";
import { Warehouse, Menu, X, Sun, Moon } from "lucide-react";

export function PublicLayout() {
  const { t } = useTranslation("common");
  const { lang = "fr" } = useParams<{ lang: string }>();
  const { toggle, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/fonctionnalites", label: t("nav.features") },
    { to: "/tarifs", label: t("nav.pricing") },
    { to: "/a-propos", label: t("nav.about") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-[var(--color-card)] border-b border-[var(--color-border)] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <LocalizedLink to="/" className="flex items-center gap-2 text-primary-600 font-bold text-xl no-underline">
            <Warehouse className="w-6 h-6" strokeWidth={1.5} />
            LeCabanon
          </LocalizedLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <LocalizedLink
                key={link.to}
                to={link.to}
                className="text-sm text-[var(--color-text-secondary)] hover:text-primary-600 no-underline"
              >
                {link.label}
              </LocalizedLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={toggle}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer bg-transparent border-none"
              title={isDark ? t("theme.light") : t("theme.dark")}
            >
              {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
            </button>
            <LocalizedLink
              to="/login"
              className="text-sm text-[var(--color-text-secondary)] hover:text-primary-600 no-underline"
            >
              {t("nav.login")}
            </LocalizedLink>
            <LocalizedLink
              to="/register"
              className="text-sm px-4 py-2 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 no-underline"
            >
              {t("nav.signup")}
            </LocalizedLink>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer"
          >
            {menuOpen ? <X className="w-5 h-5" strokeWidth={1.5} /> : <Menu className="w-5 h-5" strokeWidth={1.5} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-card)]">
            <nav className="flex flex-col p-4 gap-3">
              {navLinks.map((link) => (
                <LocalizedLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-[var(--color-text-secondary)] hover:text-primary-600 no-underline py-1"
                >
                  {link.label}
                </LocalizedLink>
              ))}
              <div className="border-t border-[var(--color-border)] pt-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <LanguageSelector />
                  <button
                    onClick={toggle}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer bg-transparent border-none"
                  >
                    {isDark ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
                  </button>
                </div>
                <LocalizedLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-[var(--color-text-secondary)] hover:text-primary-600 no-underline py-1"
                >
                  {t("nav.login")}
                </LocalizedLink>
                <LocalizedLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm text-center px-4 py-2 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 no-underline"
                >
                  {t("nav.signup")}
                </LocalizedLink>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
              <Warehouse className="w-4 h-4" strokeWidth={1.5} />
              <span className="text-sm">
                {t("footer.copyright", { year: new Date().getFullYear() })}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)]">
              <a href={`/${lang}/mentions-legales`} className="hover:text-[var(--color-text-secondary)] no-underline">
                {t("footer.legal")}
              </a>
              <a href={`/${lang}/cgu`} className="hover:text-[var(--color-text-secondary)] no-underline">
                {t("footer.terms")}
              </a>
              <a href={`/${lang}/contact`} className="hover:text-[var(--color-text-secondary)] no-underline">
                {t("footer.contact")}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
