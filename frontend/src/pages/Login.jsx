import { useState, useEffect, useRef } from "react";
import { login, googleLogin } from "../api/client";
import useStore from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { GoogleLogin } from "@react-oauth/google";
import LadderLogo from "../components/LadderLogo";

// ── Floating Particles Background (Three.js Style) ─────────────────────────
const ThreeBackground = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    const count = 60;
    const resize = () => { if (canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; } };

    class Particle {
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * (canvas.width || 800);
        this.y = Math.random() * (canvas.height || 600);
        this.size = Math.random() * 2 + 1;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
      update() { this.x += this.speedX; this.y += this.speedY; if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset(); }
      draw() { ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }

    const init = () => { resize(); particles = []; for (let i = 0; i < count; i++) particles.push(new Particle()); };
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y; const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) { ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * (1 - dist / 100)})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); }
        }
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    init(); animate(); window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
};

const thoughts = [
  "Ladder logic is the bridge between imagination and automation.",
  "Simplicity is the ultimate sophistication in PLC design.",
  "Great systems aren't just built; they are architected with precision."
];

export default function Login() {
  const { C } = useTheme();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [thoughtIdx, setThoughtIdx] = useState(0);
  const [width, setWidth] = useState(window.innerWidth);

  const { setUser } = useStore();
  const nav = useNavigate();
  const S = makeStyles(C, width);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    const tid = setInterval(() => setThoughtIdx(prev => (prev + 1) % thoughts.length), 5000);
    return () => { window.removeEventListener("resize", handleResize); clearInterval(tid); };
  }, []);

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      const res = await googleLogin(tokenResponse.credential);
      const { access_token, refresh_token, user_email, user_name } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      const p = JSON.parse(atob(access_token.split(".")[1]));
      setUser({ user_id: p.user_id, role: p.role, email: user_email, name: user_name });
      nav("/dashboard");
    } catch (e) {
      setErr(e?.response?.data?.detail || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.email || !form.password) return setErr("Required fields missing.");
    setLoading(true); setErr("");
    try {
      const res = await login(form);
      const { access_token, refresh_token, user_email, user_name } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      const p = JSON.parse(atob(access_token.split(".")[1]));
      setUser({ user_id: p.user_id, role: p.role, email: user_email, name: user_name });
      nav("/dashboard");
    } catch (e) { setErr(e?.response?.data?.detail || "Invalid login."); } finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      <div style={S.leftSide}>
        <ThreeBackground />
        <div style={S.leftContent}>
          <div style={S.brandLarge}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <LadderLogo style={{ width: 64, height: 64, color: "#fff" }} />
              <h1 style={{ margin: 0 }}>LadderForge<span style={{ color: C.brandPrimary }}> AI</span></h1>
            </div>
          </div>
          <div style={S.thoughtBox}>
            <div key={thoughtIdx} style={S.thoughtText}>"{thoughts[thoughtIdx]}"</div>
            <p style={S.thoughtSub}>Industrial Intelligence Verified</p>
          </div>
        </div>
      </div>

      <div style={S.rightSide}>
        <div style={S.formCard}>
          <h2 style={S.heading}>Welcome back</h2>
          <p style={S.sub}>Sign in to your LadderForge AI workspace</p>
          {err && <div style={S.errBox}>{err}</div>}

          <div style={S.inputGroup}>
            <div style={S.inputItem}>
              <label style={S.label}>Email Address</label>
              <input type="email" placeholder="name@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={S.input} />
            </div>
            <div style={S.inputItem}>
              <div style={S.labelRow}>
                <label style={S.label}>Password</label>
                <button onClick={() => nav("/forgot-password")} style={S.smallLink}>Forgot?</button>
              </div>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={S.input} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <button onClick={submit} disabled={loading} style={S.submitBtn}>
              {loading ? "Authenticating…" : "Sign In"}
            </button>

            <div style={S.divider}>
              <div style={S.line}></div>
              <span style={S.dividerText}>OR</span>
              <div style={S.line}></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  setErr("Google Login Failed");
                }}
                useOneTap
                theme="filled_black"
                shape="pill"
                width="360px"
                text="signin_with"
              />
            </div>
          </div>

          <p style={S.signupRow}>
            New to LadderForge AI? <button onClick={() => nav("/signup")} style={S.brandLink}>Create account</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function makeStyles(C, width) {
  const isMobile = width < 1024;
  return {
    root: { display: "flex", height: "100vh", background: C.bgPage, flexDirection: isMobile ? "column" : "row" },
    leftSide: { flex: 1.2, position: "relative", background: "#0f172a", display: isMobile ? "none" : "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
    leftContent: { position: "relative", zIndex: 10, textAlign: "center", padding: 60, width: "100%" },
    brandLarge: { marginBottom: 40, color: "#fff" },
    thoughtBox: { minHeight: 120 },
    thoughtText: { fontSize: 24, fontStyle: "italic", color: "rgba(255,255,255,0.9)", fontWeight: 500, animation: "fadeIn 0.8s ease" },
    thoughtSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.2em", marginTop: 20 },
    rightSide: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bgPage },
    formCard: { width: "100%", maxWidth: 400 },
    heading: { fontSize: 32, fontWeight: 900, color: C.textPrimary, marginBottom: 8, letterSpacing: "-0.03em" },
    sub: { fontSize: 16, color: C.textSecondary, marginBottom: 32 },
    errBox: { marginBottom: 24, padding: "12px 16px", borderRadius: 12, background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.errorColor, fontSize: 13 },
    inputGroup: { display: "flex", flexDirection: "column", gap: 20, marginBottom: 32 },
    inputItem: { display: "flex", flexDirection: "column", gap: 8 },
    label: { fontSize: 13, fontWeight: 700, color: C.textPrimary },
    labelRow: { display: "flex", justifyContent: "space-between" },
    smallLink: { background: "none", border: "none", color: C.brandPrimary, fontSize: 12, fontWeight: 700, cursor: "pointer" },
    input: { width: "100%", padding: "14px", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: 14, color: C.textPrimary, outline: "none", fontSize: 15 },
    submitBtn: { width: "100%", padding: "16px", background: C.brandPrimary, color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `0 10px 25px ${C.brandPrimary}44` },
    signupRow: { marginTop: 24, textAlign: "center", fontSize: 14, color: C.textSecondary },
    brandLink: { background: "none", border: "none", color: C.brandPrimary, fontWeight: 800, cursor: "pointer" },
    divider: { display: 'flex', alignItems: 'center', margin: '8px 0', gap: 10 },
    line: { flex: 1, height: 1, background: C.borderDefault },
    dividerText: { fontSize: 12, color: C.textSecondary, fontWeight: 600 },
  };
}