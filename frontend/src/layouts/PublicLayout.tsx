import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../components/LocalizedLink";
import { LanguageSelector } from "../components/LanguageSelector";
import { useTheme } from "../hooks/useTheme";
import { Warehouse, Menu, X, Sun, Moon } from "lucide-react";

export function PublicLayout() {
  const { t } = useTranslation("common");
  const { toggle, isDark } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { to: "/fonctionnalites", label: t("nav.features") },
    { to: "/tarifs", label: t("nav.pricing") },
    { to: "/a-propos", label: t("nav.about") },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className={`bg-[var(--color-card)]/80 backdrop-blur-md border-b sticky top-0 z-50 transition-shadow duration-300 ${
          scrolled
            ? "border-[var(--color-border-strong)] shadow-sm"
            : "border-[var(--color-border)]"
        }`}
      >
        <div className="max-w-[1120px] mx-auto px-4 h-16 flex items-center justify-between">
          <LocalizedLink
            to="/"
            className="flex items-center gap-2 text-primary-600 font-bold text-xl no-underline"
          >
            <Warehouse className="w-6 h-6" strokeWidth={1.5} />
            LeCabanon
          </LocalizedLink>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <LocalizedLink
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-primary-600 no-underline transition-colors"
              >
                {link.label}
              </LocalizedLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSelector />
            <button
              onClick={toggle}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer bg-transparent border-none transition-colors"
              title={isDark ? t("theme.light") : t("theme.dark")}
            >
              {isDark ? (
                <Sun className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
            <LocalizedLink
              to="/login"
              className="text-sm font-medium px-4 py-2 border border-primary-600 text-primary-600 rounded-[var(--radius-button)] hover:bg-primary-50 no-underline transition-colors"
            >
              {t("nav.login")}
            </LocalizedLink>
            <LocalizedLink
              to="/register"
              className="text-sm font-medium px-4 py-2 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 no-underline transition-colors"
            >
              {t("nav.signup")}
            </LocalizedLink>
          </div>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer"
          >
            {menuOpen ? (
              <X className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            )}
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
                  className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-primary-600 no-underline py-1"
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
                    {isDark ? (
                      <Sun className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Moon className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
                <LocalizedLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-[var(--radius-button)] hover:bg-primary-50 no-underline"
                >
                  {t("nav.login")}
                </LocalizedLink>
                <LocalizedLink
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-center px-4 py-2 bg-primary-600 text-[var(--color-page)] rounded-[var(--radius-button)] hover:bg-primary-700 no-underline"
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
        <div className="max-w-[1120px] mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand */}
            <div>
              <LocalizedLink
                to="/"
                className="flex items-center gap-2 text-primary-600 font-bold text-lg no-underline mb-3"
              >
                <Warehouse className="w-5 h-5" strokeWidth={1.5} />
                LeCabanon
              </LocalizedLink>
              <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                {t("footer.product")}
              </h4>
              <ul className="space-y-2 list-none p-0 m-0">
                {navLinks.map((link) => (
                  <li key={link.to}>
                    <LocalizedLink
                      to={link.to}
                      className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] no-underline transition-colors"
                    >
                      {link.label}
                    </LocalizedLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                {t("footer.legal_title")}
              </h4>
              <ul className="space-y-2 list-none p-0 m-0">
                <li>
                  <LocalizedLink
                    to="/mentions-legales"
                    className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] no-underline transition-colors"
                  >
                    {t("footer.legal")}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    to="/cgu"
                    className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] no-underline transition-colors"
                  >
                    {t("footer.terms")}
                  </LocalizedLink>
                </li>
                <li>
                  <LocalizedLink
                    to="/contact"
                    className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] no-underline transition-colors"
                  >
                    {t("footer.contact")}
                  </LocalizedLink>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                {t("footer.community")}
              </h4>
              <ul className="space-y-2 list-none p-0 m-0">
                <li>
                  <a
                    href="https://github.com/felixhennequin-gif/LeCabanon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] no-underline transition-colors"
                  >
                    {t("footer.github")}
                  </a>
                </li>
                <li>
                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    {t("footer.made_in")}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-[var(--color-border)]">
          <div className="max-w-[1120px] mx-auto px-4 py-4">
            <p className="text-[13px] text-[var(--color-text-tertiary)] text-center m-0">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
