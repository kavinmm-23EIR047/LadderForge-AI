import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import LadderLogo from "./LadderLogo";
import useStore from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
// forced HMR reload

export default function Footer() {
  const { C = {}, isDark } = useTheme() || {};
  const S = makeStyles(C, isDark);
  const { user } = useStore() || {};
  const nav = useNavigate();

  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalContent, setLegalContent] = useState("");

  const handleAppNav = (e) => {
    e.preventDefault();
    if (user) {
      nav("/dashboard");
    } else {
      nav("/login");
    }
  };

  const openLegal = (e, type) => {
    e.preventDefault();
    const safe = (v) => v || "#999";
    let content = "";
    if (type === "Terms of Service") {
      content = `
        <h2 style="margin-bottom: 16px; font-weight: 800; color: ${safe(C.textPrimary)}">Terms of Service</h2>
        <p style="margin-bottom: 12px; line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;">Welcome to LadderForge AI. By using our platform, you agree to these conditions.</p>
        <p style="margin-bottom: 12px; line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;"><b>1. Service Provision:</b> We provide industrial AI logic generation on an "as-is" basis.</p>
        <p style="line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;"><b>2. Liability:</b> Users are solely responsible for testing and validating logic before deploying it to any physical PLC hardware to prevent physical harm or industrial damage.</p>
      `;
    } else if (type === "Privacy Policy") {
      content = `
        <h2 style="margin-bottom: 16px; font-weight: 800; color: ${safe(C.textPrimary)}">Privacy Policy</h2>
        <p style="margin-bottom: 12px; line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;">We respect your privacy.</p>
        <p style="line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;">Industrial logic prompts, user configuration, and interaction data may be processed programmatically to yield the generated sequences, but they are kept completely secure and isolated per account.</p>
      `;
    } else if (type === "Copyright Attribution") {
      content = `
        <h2 style="margin-bottom: 16px; font-weight: 800; color: ${safe(C.textPrimary)}">Copyright & Attributions</h2>
        <p style="margin-bottom: 12px; line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;">LadderForge AI Interface Engineered and Developed by <b>AK Webflair Technologies</b>.</p>
        <p style="margin-bottom: 12px; line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;">AI processing is Powered by the <b>Groq API</b>.</p>
        <p style="line-height: 1.6; color: ${safe(C.textSecondary)}; font-size: 14px;">All respective brand images, components, and third-party references (e.g. Siemens, Rockwell) are used purely for educational and interface demonstration purposes.</p>
      `;
    }
    setLegalContent(content);
    setLegalModalOpen(true);
  };

  return (
    <footer style={S.footer} className="no-print">
      <div style={S.container}>
        <div style={S.brandSection}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 15 }}>
            <LadderLogo style={{ width: 32, height: 32, color: C.brandPrimary || '#f97316' }} />
            <h3 style={{ ...S.logo, marginBottom: 0, color: C.textPrimary || '#fff' }}>
              LadderForge<span style={{ color: C.brandPrimary || '#f97316' }}> AI</span>
            </h3>
          </div>
          <p style={S.tagline}>The future of industrial automation logic.</p>
          <p style={S.attributionText}>
            Powered by Groq API & advanced logic tools. Images, brands, and third-party tools are used under their respective copyrights and licenses.
          </p>
        </div>

        <div style={S.linksSection}>
          <div style={S.column}>
            <h4 style={S.colTitle}>Product</h4>
            <a href="#" onClick={handleAppNav} className="footer-link" style={S.link}>Features</a>
            <a href="#" onClick={handleAppNav} className="footer-link" style={S.link}>Simulator</a>
            <a href="#" onClick={handleAppNav} className="footer-link" style={S.link}>AI Engine</a>
          </div>
          <div style={S.column}>
            <h4 style={S.colTitle}>Support</h4>
            <a href="/guide" className="footer-link" style={S.link}>Documentation & Steps</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Contact system will be implemented later."); }} className="footer-link" style={S.link}>Contact</a>
          </div>
          <div style={S.column}>
            <h4 style={S.colTitle}>Legal</h4>
            <a href="#" onClick={(e) => openLegal(e, "Terms of Service")} className="footer-link" style={S.link}>Terms of Service</a>
            <a href="#" onClick={(e) => openLegal(e, "Privacy Policy")} className="footer-link" style={S.link}>Privacy Policy</a>
            <a href="#" onClick={(e) => openLegal(e, "Copyright Attribution")} className="footer-link" style={S.link}>Copyright Attribution</a>
          </div>
        </div>
      </div>
      <div style={S.bottom}>
        <div style={S.bottomFlex}>
          <p style={S.copy}>
            © {new Date().getFullYear()} LadderForge AI. All rights reserved.
          </p>

          <p style={S.developedBy}>
            Engineered & Developed by{" "}
            <a
              href="https://akwebflairtechnologies.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontWeight: 800,
                color: C.textPrimary || "#fff",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              AK Webflair Technologies
            </a>
          </p>
        </div>
      </div>

      {legalModalOpen && (
        <div style={S.modalOverlay} onClick={() => setLegalModalOpen(false)}>
          <div style={S.modalCard} onClick={e => e.stopPropagation()}>
            <button style={S.closeModal} onClick={() => setLegalModalOpen(false)}><X size={16} /></button>
            <div dangerouslySetInnerHTML={{ __html: legalContent }} />
          </div>
        </div>
      )}

      <style>{`
        .footer-link {
          font-size: 14px;
          color: ${C?.textSecondary || '#aaa'};
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
        }
        .footer-link:hover {
          color: ${C?.brandPrimary || '#f97316'};
        }
      `}</style>
    </footer>
  );
}

function makeStyles(C = {}, isDark = false) {
  const safe = (v, fallback) => (v ?? fallback);

  const border = `1px solid ${safe(C.borderCard, "#222")}`;

  return {
    footer: {
      background: isDark ? "#080401" : safe(C.bgCard, "#111"),
      borderTop: border,
      padding: "50px 30px 30px",
      marginTop: "auto",
      position: "relative",
      width: "100%",
    },

    container: {
      width: "100%",
      maxWidth: "100%",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 40,
      marginBottom: 40,
    },

    brandSection: {
      flex: "1 1 350px",
    },

    logo: {
      fontSize: 24,
      fontWeight: 900,
      letterSpacing: "-0.02em",
    },

    tagline: {
      fontSize: 15,
      color: safe(C.textSecondary, "#aaa"),
      fontWeight: 500,
      lineHeight: 1.5,
      marginBottom: 16,
    },

    attributionText: {
      fontSize: 12,
      color: safe(C.textMuted, "#666"),
      lineHeight: 1.6,
      maxWidth: 380,
    },

    linksSection: {
      display: "flex",
      gap: 60,
      flexWrap: "wrap",
    },

    column: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },

    colTitle: {
      fontSize: 12,
      fontWeight: 800,
      color: safe(C.textPrimary, "#fff"),
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    },

    link: {
      cursor: "pointer",
      color: safe(C.textSecondary, "#aaa"),
      transition: "0.2s",
    },

    bottom: {
      width: "100%",
      maxWidth: "100%",
      paddingTop: 24,
      borderTop: border,
    },

    bottomFlex: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 15,
    },

    copy: {
      fontSize: 13,
      color: safe(C.textMuted, "#666"),
      fontWeight: 500,
    },

    developedBy: {
      fontSize: 13,
      color: safe(C.textMuted, "#666"),
    },

    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 20,
    },

    modalCard: {
      background: safe(C.bgCard, "#111"),
      width: "100%",
      maxWidth: 500,
      borderRadius: 24,
      padding: 30,
      position: "relative",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
      border: border,
    },

    closeModal: {
      position: "absolute",
      top: 20,
      right: 20,
      background: safe(C.bgInput, "#222"),
      border: "none",
      width: 32,
      height: 32,
      borderRadius: "50%",
      color: safe(C.textMuted, "#aaa"),
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
    },
  };
}