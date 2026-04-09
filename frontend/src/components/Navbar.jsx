import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useStore from "../store/useStore";
import { useTheme } from "../hooks/useTheme";
import LadderLogo from "./LadderLogo";

export default function Navbar() {
  const { C } = useTheme();
  const { user, logout } = useStore();
  const nav = useNavigate();
  const location = useLocation();

  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const S = makeStyles(C, mobileMenuOpen, isMobile);
  const initials = (user?.name || "User").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // Unified Toggle Logic
  const handleNav = (path) => {
    nav(path);
    setMobileMenuOpen(false);
    setProfileOpen(false);
  };

  return (
    <nav style={S.nav}>
      <div style={S.container}>
        {/* LOGO */}
        <button onClick={() => handleNav("/")} style={S.logoWrap}>
          <LadderLogo style={S.logoBox} />
          <span style={S.logoText}>LadderForge<span style={{ color: C.brandPrimary }}> AI</span></span>
        </button>

        {/* DESKTOP NAVIGATION */}
        {!isMobile && (
          <div style={S.desktopLinks}>
            {user ? (
              <>
                <button onClick={() => handleNav("/dashboard")} style={location.pathname === "/dashboard" ? S.linkActive : S.link}>Dashboard</button>
                <button onClick={() => handleNav("/guide")} style={location.pathname === "/guide" ? S.linkActive : S.link}>Guide</button>
                {user?.role === "admin" && <button onClick={() => handleNav("/admin")} style={location.pathname === "/admin" ? S.linkActive : S.link}>Admin</button>}
              </>
            ) : (
              <>
                <button onClick={() => handleNav("/")} style={location.pathname === "/" ? S.linkActive : S.link}>Home</button>
                <button onClick={() => handleNav("/guide")} style={location.pathname === "/guide" ? S.linkActive : S.link}>Guide / Docs</button>
              </>
            )}
          </div>
        )}

        {/* RIGHT ACTIONS */}
        <div style={S.right}>
          {user && !isMobile && (
            <div style={{ position: "relative" }} ref={profileRef}>
              <button style={S.profileToggle} onClick={() => setProfileOpen(!profileOpen)}>
                <div style={S.avatar}>{initials}</div>
                <span style={S.userName}>{(user?.name || "Profile").split(" ")[0]}</span>
                <span style={S.arrow}>{profileOpen ? "▲" : "▼"}</span>
              </button>

              {profileOpen && (
                <div style={S.dropdown}>
                  <div style={S.dropdownHeader}>
                    <div style={S.largeAvatar}>{initials}</div>
                    <div style={S.headerText}>
                      <span style={S.nameHeader}>{user?.name}</span>
                      <p style={S.emailText}>{user?.email}</p>
                    </div>
                  </div>
                  <div style={S.dropdownDivider} />
                  <button style={S.logoutBtn} onClick={() => { logout(); handleNav("/login"); }}>Sign out</button>
                </div>
              )}
            </div>
          )}

          {!user && !isMobile && (
            <div style={S.authBtns}>
              <button onClick={() => handleNav("/login")} style={S.loginNavBtn}>Login</button>
              <button onClick={() => handleNav("/signup")} style={S.signupNavBtn}>Get Started</button>
            </div>
          )}

          {/* MOBILE HAMBURGER */}
          {isMobile && (
            <button style={S.hamburger} onClick={() => setMobileMenuOpen(true)}>
              <div style={S.burgerLine}></div>
              <div style={S.burgerLine}></div>
              <div style={S.burgerLine}></div>
            </button>
          )}
        </div>
      </div>

      {/* MOBILE SIDE MENU */}
      {isMobile && (
        <>
          <div style={S.sideMenu}>
            <div style={S.sideMenuHeader}>
              <div style={S.logoWrap}>
                <LadderLogo style={S.logoBox} />
                <span style={S.logoText}>LadderForge<span style={{ color: C.brandPrimary }}> AI</span></span>
              </div>
              <button style={S.closeSide} onClick={() => setMobileMenuOpen(false)}>✕</button>
            </div>

            <div style={S.sideContent}>
              {user && (
                <div style={S.sideProfileBox}>
                  <div style={S.sideAvatar}>{initials}</div>
                  <div style={S.sideInfo}>
                    <span style={S.sideName}>{user.name}</span>
                    <span style={S.sideEmail}>{user.email}</span>
                  </div>
                </div>
              )}

              <div style={S.sideLinks}>
                {user ? (
                  <>
                    <button onClick={() => handleNav("/dashboard")} style={location.pathname === "/dashboard" ? S.sideLinkActive : S.sideLink}>Dashboard</button>
                    <button onClick={() => handleNav("/guide")} style={location.pathname === "/guide" ? S.sideLinkActive : S.sideLink}>Guide & Docs</button>
                    {user?.role === "admin" && <button onClick={() => handleNav("/admin")} style={location.pathname === "/admin" ? S.sideLinkActive : S.sideLink}>Admin Panel</button>}
                    <button onClick={() => { logout(); handleNav("/login"); }} style={S.sideLogout}>Logout</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleNav("/")} style={location.pathname === "/" ? S.sideLinkActive : S.sideLink}>Home</button>
                    <button onClick={() => handleNav("/guide")} style={location.pathname === "/guide" ? S.sideLinkActive : S.sideLink}>Guide / Docs</button>
                    <div style={S.sideAuth}>
                      <button onClick={() => handleNav("/login")} style={S.sideBtnLogin}>Login</button>
                      <button onClick={() => handleNav("/signup")} style={S.sideBtnSignup}>Get Started</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {mobileMenuOpen && <div style={S.backdrop} onClick={() => setMobileMenuOpen(false)} />}
        </>
      )}
    </nav>
  );
}

function makeStyles(C, mobileOpen, isMobile) {
  return {
    nav: { position: "sticky", top: 0, left: 0, right: 0, zIndex: 1100, background: `${C.bgCard}cc`, borderBottom: `1px solid ${C.borderCard}`, backdropFilter: "blur(12px)", transition: "all 0.3s ease" },
    container: { maxWidth: 1400, margin: "0 auto", padding: isMobile ? "10px 16px" : "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" },

    logoWrap: { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: "none", border: "none", padding: 0 },
    logoBox: { width: 34, height: 34, background: C.brandPrimary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, fontSize: 13, fontWeight: 900, boxShadow: `0 4px 12px ${C.brandPrimary}33` },
    logoText: { fontSize: 20, fontWeight: 900, color: C.textPrimary, letterSpacing: "-0.02em" },

    desktopLinks: { display: "flex", gap: 6, marginLeft: 40, marginRight: "auto" },
    link: { padding: "8px 16px", borderRadius: 10, background: "none", border: "none", color: C.textSecondary, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s" },
    linkActive: { padding: "8px 16px", borderRadius: 10, background: `${C.brandPrimary}15`, color: C.brandPrimary, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, transition: "all 0.2s" },

    right: { display: "flex", alignItems: "center", gap: 15 },
    authBtns: { display: "flex", gap: 10 },
    loginNavBtn: { background: "none", border: "none", color: C.textSecondary, fontWeight: 700, cursor: "pointer", fontSize: 14, padding: "8px 16px" },
    signupNavBtn: { background: C.brandPrimary, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 4px 12px ${C.brandPrimary}44` },

    profileToggle: { display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 30, background: C.bgInput, border: `1px solid ${C.borderDefault}`, cursor: "pointer", transition: "all 0.2s" },
    avatar: { width: 26, height: 26, borderRadius: "50%", background: C.brandPrimary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 },
    userName: { fontSize: 13, fontWeight: 700, color: C.textPrimary },
    arrow: { fontSize: 9, opacity: 0.5 },

    hamburger: { display: "flex", flexDirection: "column", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, transition: "background 0.2s" },
    burgerLine: { width: 20, height: 2, background: C.textPrimary, borderRadius: 2 },

    sideMenu: {
      position: "fixed", top: 0, right: 0, width: "100%", maxWidth: 300, height: "100vh",
      background: C.bgCard, zIndex: 1200, transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
      boxShadow: "-10px 0 40px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column"
    },
    sideMenuHeader: { padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.borderCard}` },
    closeSide: { fontSize: 18, background: C.bgInput, border: "none", color: C.textSecondary, cursor: "pointer", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" },

    sideContent: { flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" },
    sideProfileBox: { display: "flex", alignItems: "center", gap: 15, padding: "16px", background: C.bgInput, borderRadius: 20, border: `1px solid ${C.borderDefault}` },
    sideAvatar: { width: 48, height: 48, borderRadius: "50%", background: C.brandPrimary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, boxShadow: `0 4px 12px ${C.brandPrimary}33` },
    sideInfo: { display: "flex", flexDirection: "column", overflow: "hidden" },
    sideName: { fontSize: 16, fontWeight: 800, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    sideEmail: { fontSize: 12, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

    sideLinks: { display: "flex", flexDirection: "column", gap: 6 },
    sideLink: { padding: "14px 20px", borderRadius: 14, background: "none", border: "none", color: C.textPrimary, fontSize: 15, fontWeight: 600, textAlign: "left", cursor: "pointer", transition: "all 0.2s" },
    sideLinkActive: { padding: "14px 20px", borderRadius: 14, background: `${C.brandPrimary}12`, border: "none", color: C.brandPrimary, fontSize: 15, fontWeight: 700, textAlign: "left", cursor: "pointer" },
    sideLogout: { padding: "14px 20px", borderRadius: 14, background: "none", border: "none", color: C.errorColor, fontSize: 15, fontWeight: 800, textAlign: "left", cursor: "pointer", marginTop: 10 },

    sideAuth: { display: "flex", flexDirection: "column", gap: 12, marginTop: 12 },
    sideBtnLogin: { padding: "14px", borderRadius: 14, border: `1px solid ${C.borderDefault}`, background: "none", color: C.textPrimary, fontWeight: 700, fontSize: 15, cursor: "pointer" },
    sideBtnSignup: { padding: "14px", borderRadius: 14, border: "none", background: C.brandPrimary, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", boxShadow: `0 4px 12px ${C.brandPrimary}33` },

    backdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 1150, transition: "opacity 0.4s" },

    dropdown: { position: "absolute", top: "calc(100% + 15px)", right: 0, width: 260, background: C.bgCard, border: `1px solid ${C.borderCard}`, borderRadius: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.15)", overflow: "hidden", zIndex: 1200 },
    dropdownHeader: { padding: "20px", display: "flex", gap: 15, alignItems: "center", background: `${C.brandPrimary}08` },
    largeAvatar: { width: 44, height: 44, borderRadius: "22px", background: C.brandPrimary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800 },
    headerText: { display: "flex", flexDirection: "column" },
    nameHeader: { fontSize: 16, fontWeight: 800, color: C.textPrimary },
    emailText: { fontSize: 12, color: C.textMuted },
    dropdownDivider: { height: 1, background: C.borderCard },
    logoutBtn: { width: "100%", padding: "16px", background: "none", border: "none", color: C.errorColor, cursor: "pointer", fontSize: 14, fontWeight: 800, transition: "background 0.2s" },
  };
}