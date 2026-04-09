import { useState, useEffect, useRef } from "react";
import { signup, googleLogin } from "../api/client";
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
    const resize = () => { if(canvas) { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; } };
    
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
      animationFrameId = requestAnimationFrame(animate);
    };
    init(); animate(); window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animationFrameId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} />;
};

const getStrength = (pw, C) => {
  if (!pw) return { score: 0, label: "", color: "transparent" };
  let s = 0; if (pw.length >= 6) s++; if (pw.length >= 10) s++; if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: "Weak", color: C.errorColor };
  if (s <= 3) return { score: s, label: "Fair", color: "#f59e0b" };
  return { score: s, label: "Strong", color: "#10b981" };
};

export default function Signup() {
  const { C } = useTheme();
  const [form, setForm] = useState({ name: "", email: "", password: "", agreed: false });
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [width, setWidth] = useState(window.innerWidth);

  const { setUser } = useStore();
  const nav = useNavigate();
  const strength = getStrength(form.password, C);
  const S = makeStyles(C, width);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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
      setErr(e?.response?.data?.detail || "Google signup failed.");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!form.name || !form.email || !form.password) return setErr("All fields are required.");
    if (!form.agreed) return setErr("You must agree to the Terms and Conditions.");
    setLoading(true); setErr("");
    try {
      await signup(form);
      setSuccess(true);
      setTimeout(() => nav("/login"), 1500);
    } catch (e) {
      setErr(e.response?.data?.detail || "Signup failed.");
    } finally { setLoading(false); }
  };

  return (
    <div style={S.root}>
      <div style={S.leftSide}>
        <ThreeBackground />
        <div style={S.leftContent}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginBottom: 16 }}>
            <LadderLogo style={{ width: 64, height: 64, color: "#fff" }} />
            <h1 style={{ margin: 0 }}>LadderForge<span style={{ color: C.brandPrimary }}> AI</span></h1>
          </div>
          <p style={{ fontSize: 20, fontStyle: "italic", opacity: 0.9 }}>"The rungs of today build the industry of tomorrow."</p>
        </div>
      </div>

      <div style={S.rightSide}>
        <div style={S.formCard}>
          <h2 style={S.heading}>Join LadderForge AI</h2>
          <p style={S.sub}>The professional choice for ladder logic AI</p>

          {success && <div style={S.successBox}>Success! Redirecting to login...</div>}
          {err && <div style={S.errBox}>{err}</div>}

          <div style={S.inputGroup}>
            <div style={S.inputItem}>
              <label style={S.label}>Full Name</label>
              <input placeholder="John Doe" value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={S.input} />
            </div>
            <div style={S.inputItem}>
              <label style={S.label}>Work Email</label>
              <input placeholder="john@industry.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} style={S.input} />
            </div>
            <div style={S.inputItem}>
              <label style={S.label}>Password</label>
              <input type="password" placeholder="6+ characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={S.input} />
              {form.password && (
                <div style={S.strengthRow}>
                  <div style={S.strengthBar}>
                    <div style={{...S.strengthFill, width:`${strength.score*25}%`, background:strength.color}}/>
                  </div>
                  <span style={{fontSize:11, fontWeight:700, color:strength.color}}>{strength.label}</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: C.textSecondary, cursor: "pointer" }}>
              <input type="checkbox" checked={form.agreed} onChange={e => setForm({...form, agreed: e.target.checked})} style={{ width: 16, height: 16, accentColor: C.brandPrimary, marginTop: 2 }} />
              <span style={{ lineHeight: 1.4 }}>I agree to the <span style={{ color: C.brandPrimary, fontWeight: 700 }}>Terms of Service</span> and <span style={{ color: C.brandPrimary, fontWeight: 700 }}>Privacy Policy</span></span>
            </label>
            <button onClick={submit} disabled={loading} style={S.submitBtn}>
              {loading ? "Creating Account…" : "Get Started Free"}
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
                    setErr("Google Signup Failed");
                  }}
                  useOneTap
                  theme="filled_black"
                  shape="pill"
                  width="360px"
                  text="signup_with"
               />
            </div>
          </div>

          <p style={S.loginRow}>
            Already have an account? <button onClick={() => nav("/login")} style={S.brandLink}>Sign In</button>
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
    leftContent: { position: "relative", zIndex: 10, textAlign: "center", color: "#fff", padding: 40 },
    rightSide: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: C.bgPage },
    formCard: { width: "100%", maxWidth: 400 },
    heading: { fontSize: 32, fontWeight: 900, color: C.textPrimary, marginBottom: 8, letterSpacing: "-0.03em" },
    sub: { fontSize: 16, color: C.textSecondary, marginBottom: 32 },
    errBox: { marginBottom: 24, padding: "12px 16px", borderRadius: 12, background: C.errorBg, border: `1px solid ${C.errorBorder}`, color: C.errorColor, fontSize: 13 },
    successBox: { marginBottom: 24, padding: "12px 16px", borderRadius: 12, background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: 13, border: "1px solid #10b981" },
    inputGroup: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 },
    inputItem: { display: "flex", flexDirection: "column", gap: 8 },
    label: { fontSize: 13, fontWeight: 700, color: C.textPrimary },
    input: { width: "100%", padding: "14px", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: 14, color: C.textPrimary, outline: "none", fontSize: 15 },
    strengthRow: { display:"flex", alignItems:"center", gap:10, marginTop:4 },
    strengthBar: { flex:1, height:4, background:C.borderDefault, borderRadius:2, overflow:"hidden" },
    strengthFill: { height:"100%", transition: "width 0.3s ease" },
    submitBtn: { width: "100%", padding: "16px", background: C.brandPrimary, color: "#fff", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: `0 10px 25px ${C.brandPrimary}44` },
    loginRow: { marginTop: 24, textAlign: "center", fontSize: 14, color: C.textSecondary },
    brandLink: { background: "none", border: "none", color: C.brandPrimary, fontWeight: 800, cursor: "pointer" },
    divider: { display: 'flex', alignItems: 'center', margin: '8px 0', gap: 10 },
    line: { flex: 1, height: 1, background: C.borderDefault },
    dividerText: { fontSize: 12, color: C.textSecondary, fontWeight: 600 },
  };
}