"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "./auth-modal";
import { BookSearch } from "./book-search";

const paths = {
  home: "m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9",
  library: "M5 3h14v19l-7-5-7 5V3Z",
  highlight: "m4 16 12-12 4 4L8 20l-5 1 1-5ZM14 6l4 4",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  settings: "m9 3 1-2h4l1 2 3 2 2 1v4l-2 1-1 3v3l-3 2-2-1-3-1-2 1-3-2v-3l-1-3-2-1V6l2-1 3-2Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  help: "M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3M12 17h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  auth: "M9 3H3v18h6m6-14 5 5-5 5M7 12h13",
};
function Icon({ name }: { name: keyof typeof paths }) {
  return <svg className="shell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}

function SidebarContent({ onNavigate, onAuth }: { onNavigate?: () => void; onAuth: () => void }) {
  const pathname = usePathname();
  const { user, loading, pending } = useAuth();
  const navLink = (href: string, label: string, icon: keyof typeof paths) => (
    <Link className="shell-nav-item" href={href} aria-current={pathname === href ? "page" : undefined} onClick={onNavigate}><Icon name={icon} /><span>{label}</span></Link>
  );
  return (
    <>
      <Link className="shell-logo" href="/" aria-label="Summarist home" onClick={onNavigate}><Image src="/assets/logo.png" alt="Summarist" width={495} height={114} sizes="160px" /></Link>
      <nav className="shell-navigation" aria-label="App navigation">
        <ul className="shell-nav-group" role="list">
          <li>{navLink("/for-you", "For you", "home")}</li>
          <li>{navLink("/library", "My Library", "library")}</li>
          <li><span className="shell-nav-item shell-nav-item--unavailable" aria-disabled="true" title="Highlights is not available"><Icon name="highlight" /><span>Highlights</span></span></li>
          <li><span className="shell-nav-item shell-nav-item--unavailable" aria-disabled="true" title="Use the search bar above"><Icon name="search" /><span>Search</span></span></li>
        </ul>
        <ul className="shell-nav-group shell-nav-group--bottom" role="list">
          <li>{navLink("/settings", "Settings", "settings")}</li>
          <li><span className="shell-nav-item shell-nav-item--unavailable" aria-disabled="true" title="Help & Support is not available"><Icon name="help" /><span>Help &amp; Support</span></span></li>
          <li><button className="shell-nav-item" type="button" disabled={loading || pending} aria-haspopup={!user ? "dialog" : undefined} onClick={onAuth}><Icon name="auth" /><span>{loading ? "Checking session…" : pending ? "Please wait…" : user ? "Logout" : "Login"}</span></button></li>
        </ul>
      </nav>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, open, logout } = useAuth();
  const drawer = useRef<HTMLDialogElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const overflow = useRef("");
  const afterClose = useRef<(() => void) | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    drawer.current?.close();
  }, [pathname]);

  useEffect(() => {
    const dialog = drawer.current;
    const media = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = () => { if (media.matches) drawer.current?.close(); };
    media.addEventListener("change", closeOnDesktop);
    return () => {
      media.removeEventListener("change", closeOnDesktop);
      if (dialog?.open) document.body.style.overflow = overflow.current;
    };
  }, []);

  function closeDrawer() { drawer.current?.close(); }
  function finishClose() {
    document.body.style.overflow = overflow.current;
    setExpanded(false);
    if (menuButton.current?.getClientRects().length) menuButton.current.focus();
    else main.current?.focus();
    const next = afterClose.current;
    afterClose.current = null;
    next?.();
  }
  function authenticate() { if (user) void logout(); else open(); }

  if (pathname === "/choose-plan") return <main className="shell-content">{children}</main>;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-content">Skip to content</a>
      <aside className="shell-sidebar"><SidebarContent onAuth={authenticate} /></aside>
      <div className="shell-body">
        <header className="shell-header">
          <div className="shell-header-inner">
            <BookSearch key={pathname} />
            <button ref={menuButton} className="shell-menu" type="button" aria-label="Open navigation menu" aria-expanded={expanded} aria-controls="app-mobile-menu" aria-haspopup="dialog" onClick={() => {
              if (!drawer.current || drawer.current.open) return;
              overflow.current = document.body.style.overflow;
              drawer.current.showModal();
              document.body.style.overflow = "hidden";
              setExpanded(true);
            }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button>
          </div>
        </header>
        <main ref={main} id="app-content" className="shell-content" tabIndex={-1}>{children}</main>
      </div>
      <dialog ref={drawer} id="app-mobile-menu" className="shell-drawer" aria-label="Navigation menu" onClose={finishClose} onClick={(event) => { if (event.target === drawer.current) closeDrawer(); }}>
        <div className="shell-drawer-inner">
          <button className="shell-drawer-close" type="button" aria-label="Close navigation menu" onClick={closeDrawer}>×</button>
          <SidebarContent onNavigate={closeDrawer} onAuth={() => { afterClose.current = authenticate; closeDrawer(); }} />
        </div>
      </dialog>
    </div>
  );
}
