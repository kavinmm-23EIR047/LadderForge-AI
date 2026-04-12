import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";
import {
  ArrowRight, ChevronRight, Zap, Cpu, ShieldCheck,
  Activity, FileText, Play, BookOpen, Terminal,
  GitBranch, Radio, Layers, BarChart2, Code2
} from "lucide-react";

/* ─────────────────────────────────────────
   GLOBAL BRAND STYLES  (orange/industrial)
───────────────────────────────────────── */
const GlobalStyles = ({ isDark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

    :root {
      --primary:       #f97316;
      --primary-h:     #ea580c;
      --primary-dim:   rgba(249,115,22,0.12);
      --primary-glow:  rgba(249,115,22,0.25);
      --bg:            ${isDark ? "#0f0a04" : "#fff7ed"};
      --bg2:           ${isDark ? "#1c1006" : "#ffffff"};
      --bg3:           ${isDark ? "#261500" : "#fef3e2"};
      --border:        ${isDark ? "rgba(249,115,22,0.12)" : "rgba(0,0,0,0.07)"};
      --border2:       ${isDark ? "rgba(249,115,22,0.22)" : "rgba(249,115,22,0.3)"};
      --txt:           ${isDark ? "#f5f0e8" : "#1c1917"};
      --txt2:          ${isDark ? "#a8a29e" : "#78716c"};
      --txt3:          ${isDark ? "#57534e" : "#b0a898"};
      --mono:          'JetBrains Mono', monospace;
      --display:       'Syne', sans-serif;
      --body:          'DM Sans', sans-serif;
      --r:             16px;
      --r2:            24px;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; overflow-x: hidden; }
    body { background: var(--bg); color: var(--txt); font-family: var(--body); transition: background .3s, color .3s; overflow-x: hidden; }

    @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 0 var(--primary-glow)} 50%{box-shadow:0 0 0 10px transparent} }
    @keyframes scan-line   { 0%{top:-10%} 100%{top:110%} }
    @keyframes fade-up     { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes blink       { 0%,100%{opacity:1} 49%{opacity:1} 50%{opacity:0} 99%{opacity:0} }
    @keyframes rung-power  { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
    @keyframes float       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes spin-slow   { from{transform:rotateY(0deg)} to{transform:rotateY(360deg)} }
    @keyframes shimmer     { 0%{background-position:-200% center} 100%{background-position:200% center} }

    .fade-up { animation: fade-up .6s ease both; }
    .fade-up-2 { animation: fade-up .6s .15s ease both; }
    .fade-up-3 { animation: fade-up .6s .3s ease both; }

    .tag-badge {
      display:inline-flex; align-items:center; gap:8px;
      padding:6px 14px; border-radius:100px;
      background:var(--primary-dim); border:1px solid rgba(249,115,22,.2);
      font-family:var(--mono); font-size:10px; font-weight:700;
      color:var(--primary); letter-spacing:.12em;
    }
    .tag-badge .dot {
      width:7px; height:7px; border-radius:50%; background:var(--primary);
      animation: pulse-ring 2s infinite;
    }

    /* Grid bg */
    .grid-bg {
      position:absolute; inset:0;
      background-image: linear-gradient(rgba(249,115,22,.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(249,115,22,.04) 1px, transparent 1px);
      background-size:50px 50px;
      pointer-events:none;
    }
    .grid-bg::after {
      content:''; position:absolute; left:0; right:0; height:2px;
      background:linear-gradient(90deg, transparent, rgba(249,115,22,.3), transparent);
      animation: scan-line 10s linear infinite;
    }

    /* Buttons */
    .btn-primary {
      display:inline-flex; align-items:center; gap:10px;
      padding:16px 40px; background:var(--primary); color:#fff;
      border:none; border-radius:var(--r); font-family:var(--display);
      font-size:16px; font-weight:700; cursor:pointer;
      transition:background .2s, transform .15s, box-shadow .2s;
    }
    .btn-primary:hover { background:var(--primary-h); transform:translateY(-1px); box-shadow:0 8px 24px var(--primary-glow); }
    .btn-outline {
      display:inline-flex; align-items:center; gap:10px;
      padding:16px 36px; background:transparent; color:var(--txt);
      border:1px solid var(--border2); border-radius:var(--r);
      font-family:var(--display); font-size:16px; font-weight:600; cursor:pointer;
      transition:background .2s, border-color .2s;
    }
    .btn-outline:hover { background:var(--primary-dim); border-color:var(--primary); }

    /* Cards */
    .card {
      background:var(--bg2); border:1px solid var(--border);
      border-radius:var(--r2); padding:32px;
      transition:border-color .2s, box-shadow .2s;
    }
    .card:hover { border-color:var(--border2); box-shadow:0 0 0 1px var(--border2); }

    /* Section labels */
    .sec-label {
      font-family:var(--mono); font-size:10px; font-weight:700;
      color:var(--primary); letter-spacing:.18em; text-transform:uppercase;
      margin-bottom:16px;
    }
    .sec-title {
      font-family:var(--display); font-size:clamp(32px,4.5vw,52px);
      font-weight:800; line-height:1.05; letter-spacing:-.03em;
      margin-bottom:20px;
    }
    .sec-sub {
      font-size:17px; color:var(--txt2); line-height:1.7; max-width:580px;
    }

    /* Ladder SVG powered line animation */
    .rung-line { stroke-dasharray:200; animation: rung-power .4s ease forwards; }

    /* Step nav */
    .step-item {
      padding:20px 24px; border-radius:var(--r); cursor:pointer;
      border:1px solid transparent; transition:all .25s;
    }
    .step-item:hover { background:var(--bg3); }
    .step-item.active {
      background:var(--bg2); border-color:var(--primary);
      box-shadow:0 0 0 1px var(--primary-glow);
    }
    .step-num {
      font-family:var(--mono); font-size:10px; color:var(--primary);
      font-weight:700; letter-spacing:.1em; margin-bottom:8px;
    }
    .step-title {
      font-family:var(--display); font-size:17px; font-weight:700;
      margin-bottom:6px; transition:color .2s;
    }
    .step-desc { font-size:14px; color:var(--txt2); line-height:1.6; }

    /* Discipline cards */
    .disc-card {
      padding:32px; background:var(--bg2); border:1px solid var(--border);
      border-radius:var(--r2); cursor:pointer; transition:all .25s; position:relative; overflow:hidden;
    }
    .disc-card::before {
      content:''; position:absolute; inset:0;
      background:linear-gradient(135deg, var(--primary-dim), transparent);
      opacity:0; transition:opacity .3s;
    }
    .disc-card:hover { border-color:var(--border2); transform:translateY(-3px); }
    .disc-card:hover::before { opacity:1; }
    .disc-abbr { font-family:var(--mono); font-size:11px; font-weight:700; color:var(--primary); letter-spacing:.12em; margin-bottom:14px; }
    .disc-name { font-family:var(--display); font-size:20px; font-weight:700; margin-bottom:10px; }
    .disc-desc { font-size:14px; color:var(--txt2); line-height:1.65; }
    .disc-icon { width:40px; height:40px; background:var(--primary-dim); border-radius:10px; display:flex; align-items:center; justify-content:center; margin-bottom:20px; }

    /* Feature pill */
    .feat-pill {
      display:inline-flex; align-items:center; gap:8px; padding:8px 16px;
      background:var(--bg2); border:1px solid var(--border); border-radius:100px;
      font-size:13px; font-weight:500; color:var(--txt2);
    }
    .feat-pill svg { color:var(--primary); }

    /* Three.js canvas */
    #plc-canvas { width:100%; height:100%; display:block; }

    /* Stat cards */
    .stat-card {
      padding:28px; background:var(--bg2); border:1px solid var(--border);
      border-radius:var(--r2); text-align:center;
    }
    .stat-num { font-family:var(--display); font-size:42px; font-weight:800; color:var(--primary); line-height:1; margin-bottom:6px; }
    .stat-lbl { font-size:13px; color:var(--txt2); font-weight:500; }

    /* Testimonial */
    .testi-card {
      padding:32px; background:var(--bg2); border:1px solid var(--border);
      border-radius:var(--r2);
    }
    .testi-quote { font-size:16px; line-height:1.75; color:var(--txt); margin-bottom:20px; font-style:italic; }
    .testi-author { display:flex; align-items:center; gap:12px; }
    .testi-avatar { width:40px; height:40px; border-radius:50%; object-fit:cover; }
    .testi-name { font-weight:600; font-size:14px; }
    .testi-role { font-size:12px; color:var(--txt2); }
    
    @media (max-width: 1024px) {
      .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .hero-pad { padding: 120px 20px 60px 20px !important; }
      .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .disc-grid { grid-template-columns: repeat(2, 1fr) !important; }
      .disc-banner { grid-template-columns: 1fr !important; }
      .plc-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .ladder-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .workflow-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
      .feat-grid { grid-template-columns: 1fr !important; }
      .feat-grid > .card { grid-column: auto !important; }
      .feat-grid > .card.large { grid-template-columns: 1fr !important; }
      .specs-grid { grid-template-columns: 1fr !important; }
      .section-pad { padding: 60px 24px !important; }
      .cta-box { padding: 40px 24px !important; }
      .footer-flex { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr !important; }
      .disc-grid { grid-template-columns: 1fr !important; }
      .hero-title { font-size: clamp(32px, 8vw, 42px) !important; }
      .sec-title { font-size: clamp(24px, 6vw, 32px) !important; }
      .action-btns { flex-direction: column; width: 100%; }
      .action-btns > button { width: 100%; justify-content: center; }
    }
  `}</style>
);

/* ─────────────────────────────────────────
   CORRECT LADDER LOGIC SVG
   Proper IEC 61131-3 representation
───────────────────────────────────────── */
const LadderLogicSVG = ({ rungs, powered = true }) => {
  const railColor = powered ? "var(--primary)" : "var(--txt3)";
  const H = 50 + rungs.length * 90;
  return (
    <svg viewBox={`0 0 520 ${H}`} style={{ width: "100%", height: "auto", fontFamily: "var(--mono)" }}>
      {/* Power rails */}
      <line x1="30"  y1="20" x2="30"  y2={H - 20} stroke={railColor} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="490" y1="20" x2="490" y2={H - 20} stroke={railColor} strokeWidth="3.5" strokeLinecap="round" />

      {/* Rail labels */}
      <text x="30"  y="14" fill="var(--primary)" fontSize="8" textAnchor="middle" fontWeight="700">L1</text>
      <text x="490" y="14" fill="var(--primary)" fontSize="8" textAnchor="middle" fontWeight="700">L2</text>

      {rungs.map((rung, ri) => {
        const y = 60 + ri * 90;
        const rungColor = rung.powered ? "var(--primary)" : "var(--txt3)";
        const opacGlow = rung.powered ? 1 : 0.35;

        return (
          <g key={ri} opacity={opacGlow}>
            {/* Rung number */}
            <text x="14" y={y + 5} fill="var(--txt3)" fontSize="8" textAnchor="middle">{String(ri).padStart(3, "0")}</text>

            {/* Horizontal rung line from L1 → first contact */}
            <line x1="30" y1={y} x2="90" y2={y} stroke={rungColor} strokeWidth="2" />

            {/* --- Contacts (NO / NC) --- */}
            {(rung.contacts || []).map((c, ci) => {
              const cx = 90 + ci * 110;
              const color = c.powered ? "var(--primary)" : "var(--txt3)";
              return (
                <g key={ci}>
                  {/* Wire into contact */}
                  <line x1={cx} y1={y} x2={cx + 20} y2={y} stroke={color} strokeWidth="2" />

                  {/* Contact symbol: two vertical bars */}
                  <line x1={cx + 20} y1={y - 14} x2={cx + 20} y2={y + 14} stroke={color} strokeWidth="2.5" />
                  <line x1={cx + 34} y1={y - 14} x2={cx + 34} y2={y + 14} stroke={color} strokeWidth="2.5" />

                  {/* NC diagonal slash */}
                  {c.type === "NC" && (
                    <line x1={cx + 18} y1={y + 12} x2={cx + 36} y2={y - 12} stroke={color} strokeWidth="1.5" />
                  )}

                  {/* Wire out of contact */}
                  <line x1={cx + 34} y1={y} x2={cx + 54} y2={y} stroke={color} strokeWidth="2" />

                  {/* Tag above */}
                  <text x={cx + 27} y={y - 20} fill={c.powered ? "var(--primary)" : "var(--txt3)"} fontSize="8" textAnchor="middle" fontWeight="600">{c.tag}</text>
                  {/* Type below */}
                  <text x={cx + 27} y={y + 26} fill="var(--txt3)" fontSize="7" textAnchor="middle">{c.type || "NO"}</text>
                </g>
              );
            })}

            {/* Wire to coil */}
            <line x1={90 + (rung.contacts?.length || 0) * 110} y1={y} x2={380} y2={y} stroke={rungColor} strokeWidth="2" />

            {/* --- Coil symbol (circle with parens) --- */}
            <text x="380" y={y - 19} fill={rung.powered ? "var(--primary)" : "var(--txt3)"} fontSize="8" textAnchor="middle" fontWeight="600">{rung.coilTag}</text>
            <text x="395" y={y + 5} fill={rungColor} fontSize="20" textAnchor="middle" fontWeight="300">( )</text>
            <line x1="408" y1={y} x2="490" y2={y} stroke={rungColor} strokeWidth="2" />

            {/* Powered glow effect */}
            {rung.powered && (
              <line x1="30" y1={y} x2="490" y2={y} stroke="var(--primary)" strokeWidth="6" opacity="0.07" />
            )}
          </g>
        );
      })}
    </svg>
  );
};

/* ─────────────────────────────────────────
   THREE.JS PLC VISUALIZATION
───────────────────────────────────────── */
const PLCVisualization = ({ isDark }) => {
  const mountRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => {
      const THREE = window.THREE;
      const w = el.clientWidth, h = el.clientHeight;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
      camera.position.set(0, 3, 8);
      camera.lookAt(0, 0, 0);

      // Lighting
      const ambient = new THREE.AmbientLight(isDark ? 0x1a0800 : 0x3a2010, 0.8);
      scene.add(ambient);
      const dirLight = new THREE.DirectionalLight(0xf97316, 1.2);
      dirLight.position.set(5, 10, 5);
      dirLight.castShadow = true;
      scene.add(dirLight);
      const backLight = new THREE.PointLight(0xf97316, 0.5, 20);
      backLight.position.set(-5, 2, -5);
      scene.add(backLight);

      // Materials
      const plcBodyMat = new THREE.MeshStandardMaterial({
        color: isDark ? 0x1a1a1a : 0x2a2a2a,
        metalness: 0.8, roughness: 0.2,
      });
      const accentMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, metalness: 0.5, roughness: 0.3, emissive: 0xf97316, emissiveIntensity: 0.3
      });
      const greenLedMat = new THREE.MeshStandardMaterial({
        color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 0.8
      });
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x888888, metalness: 0.9, roughness: 0.1
      });
      const connectorMat = new THREE.MeshStandardMaterial({
        color: 0x444444, metalness: 0.7, roughness: 0.3
      });
      const wireMat_r = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.2 });
      const wireMat_b = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 0.2 });

      const group = new THREE.Group();
      scene.add(group);

      // ── DIN Rail ──
      const railGeo = new THREE.BoxGeometry(9, 0.15, 0.35);
      const rail    = new THREE.Mesh(railGeo, railMat);
      rail.position.set(0, -0.5, 0);
      rail.receiveShadow = true;
      group.add(rail);

      // ── Power Supply (PS) module ──
      const makePLCModule = (w, h, d, color, x) => {
        const geo  = new THREE.BoxGeometry(w, h, d);
        const mat  = new THREE.MeshStandardMaterial({ color, metalness: 0.7, roughness: 0.25 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, 0.5, 0);
        mesh.castShadow = true;
        group.add(mesh);

        // Front face accent strip
        const stripGeo  = new THREE.BoxGeometry(w * 0.15, h * 0.85, 0.02);
        const stripMesh = new THREE.Mesh(stripGeo, accentMat);
        stripMesh.position.set(x - w * 0.3, 0.5, d / 2 + 0.01);
        group.add(stripMesh);

        // Terminal connectors (bottom)
        for (let i = 0; i < 3; i++) {
          const tGeo  = new THREE.BoxGeometry(0.12, 0.18, 0.12);
          const tMesh = new THREE.Mesh(tGeo, connectorMat);
          tMesh.position.set(x - 0.2 + i * 0.2, -0.1, d / 2 + 0.01);
          group.add(tMesh);
        }
        return mesh;
      };

      // Modules: PS, CPU, DI, DO, AI
      const modules = [
        { color: 0x2d2d2d, x: -3.5, label: "PS" },
        { color: 0x1a1a2e, x: -2.1, label: "CPU" },
        { color: 0x1e2a1e, x: -0.7, label: "DI" },
        { color: 0x2a1e1e, x:  0.7, label: "DO" },
        { color: 0x1e1e2a, x:  2.1, label: "AI" },
      ];
      const moduleMeshes = modules.map(m => makePLCModule(1.1, 2.5, 1, m.color, m.x));

      // ── CPU: LED indicators ──
      const cpuX = -2.1;
      const ledColors = [0x22c55e, 0xf97316, 0xf97316, 0xef4444];
      const ledMeshes = ledColors.map((c, i) => {
        const geo  = new THREE.SphereGeometry(0.05, 8, 8);
        const mat  = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(cpuX + 0.25, 0.5 + 0.5 - i * 0.22, 0.52);
        group.add(mesh);
        return { mesh, mat };
      });

      // ── DI Module: Input terminals ──
      for (let i = 0; i < 8; i++) {
        const geo  = new THREE.BoxGeometry(0.08, 0.06, 0.06);
        const mesh = new THREE.Mesh(geo, connectorMat);
        mesh.position.set(-0.7 + (i % 2) * 0.15, 0.9 - Math.floor(i / 2) * 0.25, 0.52);
        group.add(mesh);
      }

      // ── DO Module: Output relay indicators ──
      for (let i = 0; i < 4; i++) {
        const geo  = new THREE.BoxGeometry(0.14, 0.06, 0.02);
        const mat  = new THREE.MeshStandardMaterial({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: i % 2 === 0 ? 0.9 : 0.1 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(0.7 + 0.1, 0.8 - i * 0.28, 0.52);
        group.add(mesh);
      }

      // ── Wires ──
      const addWire = (x1, y1, z1, x2, y2, z2, mat) => {
        const points  = [new THREE.Vector3(x1,y1,z1), new THREE.Vector3(x1,y1-0.3,z1), new THREE.Vector3(x2,y2-0.3,z2), new THREE.Vector3(x2,y2,z2)];
        const curve   = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.022, 6, false);
        const wire    = new THREE.Mesh(tubeGeo, mat);
        group.add(wire);
      };
      addWire(-3.5, -0.15, 0.5, -2.1, -0.15, 0.5, wireMat_r);
      addWire(-2.1, -0.15, 0.5, -0.7, -0.15, 0.5, wireMat_b);
      addWire(-0.7, -0.15, 0.5,  0.7, -0.15, 0.5, wireMat_r);
      addWire( 0.7, -0.15, 0.5,  2.1, -0.15, 0.5, wireMat_b);

      // ── Ground plate ──
      const groundGeo  = new THREE.BoxGeometry(10, 0.05, 3);
      const groundMat  = new THREE.MeshStandardMaterial({ color: isDark ? 0x111111 : 0x1a1a1a, metalness: 0.9, roughness: 0.1 });
      const groundMesh = new THREE.Mesh(groundGeo, groundMat);
      groundMesh.position.set(0, -0.93, 0);
      groundMesh.receiveShadow = true;
      group.add(groundMesh);

      // ── Particle system (scan effect) ──
      const particleGeo = new THREE.BufferGeometry();
      const pCount = 80;
      const pPos   = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pPos[i * 3]     = (Math.random() - 0.5) * 10;
        pPos[i * 3 + 1] = (Math.random() - 0.5) * 4;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      }
      particleGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const particleMat  = new THREE.PointsMaterial({ color: 0xf97316, size: 0.03, transparent: true, opacity: 0.6 });
      const particlesMesh = new THREE.Points(particleGeo, particleMat);
      group.add(particlesMesh);

      let t = 0;
      const animate = () => {
        animRef.current = requestAnimationFrame(animate);
        t += 0.012;

        // Slow orbit
        group.rotation.y = Math.sin(t * 0.3) * 0.4;
        group.rotation.x = Math.sin(t * 0.15) * 0.08;

        // LED blink
        ledMeshes.forEach((led, i) => {
          led.mat.emissiveIntensity = 0.5 + 0.5 * Math.sin(t * (1 + i * 0.7) + i * 1.3);
        });

        // Particle drift
        const pArr = particleGeo.attributes.position.array;
        for (let i = 0; i < pCount; i++) {
          pArr[i * 3 + 1] += 0.004;
          if (pArr[i * 3 + 1] > 2.5) pArr[i * 3 + 1] = -2.5;
        }
        particleGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      };
      animate();

      return () => {
        cancelAnimationFrame(animRef.current);
        renderer.dispose();
        if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      };
    };
    document.head.appendChild(script);
    return () => {
      cancelAnimationFrame(animRef.current);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [isDark]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
};

/* ─────────────────────────────────────────
   STEP DETAIL PANELS
───────────────────────────────────────── */
const stepDetails = [
  {
    title: "Define Control Specifications",
    tech: "Natural Language → I/O Mapping",
    desc: "Describe your process in plain English: 'Motor starts on START_PB momentary press, stops on ESTOP_NC or thermal overload'. The AI parser extracts all I/O tags, determines contact types (NO/NC), identifies interlocks, and builds a structured specification tree conforming to IEC 61131-3.",
    points: ["Automatic I/O tag extraction", "Contact type inference (NO/NC/TON/TOF)", "Interlock dependency mapping", "IEC 61131-3 type validation"],
    code: "INPUT: Motor control with E-Stop\nOUTPUT: START_PB[NO], ESTOP[NC]\n        RUN_SEAL, MOTOR_COIL\nINTERLOCK: OL_TRIP → MOTOR_COIL=FALSE",
    rungs: [
      { powered: true,  coilTag: "RUN_COIL", contacts: [{ tag: "START_PB", type: "NO", powered: true }, { tag: "RUN_COIL", type: "NO", powered: true }] },
      { powered: false, coilTag: "MOTOR_OUT", contacts: [{ tag: "RUN_COIL", type: "NO", powered: false }, { tag: "ESTOP", type: "NC", powered: false }] },
    ]
  },
  {
    title: "AI Rung Synthesis",
    tech: "IEC 61131-3 Compilation Engine",
    desc: "The synthesis engine maps your specifications onto valid Ladder Logic rungs. It applies standard PLC programming patterns — seal-in circuits, motor interlock templates, timer function blocks (TON, TOF, RTO), and counter FBs (CTU, CTD). Every rung respects IEC 61131-3 data types and scan-cycle semantics.",
    points: ["Seal-in / latch circuit generation", "TON/TOF/RTO timer rung templates", "CTU/CTD counter function blocks", "OB1 scan-cycle semantic compliance"],
    code: "RUNG_00: [START_PB/NO]--[RUN_SEAL/NO]---(RUN_COIL)\nRUNG_01: [RUN_COIL/NO]--[ESTOP/NC]---(RUN_SEAL)\nRUNG_02: [RUN_SEAL/NO]--[OL_TRIP/NC]--(MOTOR_Y)",
    rungs: [
      { powered: true,  coilTag: "RUN_COIL", contacts: [{ tag: "START_PB", type: "NO", powered: true }] },
      { powered: true,  coilTag: "RUN_SEAL", contacts: [{ tag: "RUN_COIL", type: "NO", powered: true }, { tag: "ESTOP", type: "NC", powered: true }] },
    ]
  },
  {
    title: "Real-Time Simulation",
    tech: "Software Scan-Cycle Engine",
    desc: "Execute your ladder program in a browser-native PLC scan-cycle emulator. Force bits on/off, observe real-time power flow highlighted in orange, test emergency stops, and validate timer accumulator values. The simulator implements the full Read Inputs → Execute Logic → Write Outputs cycle.",
    points: ["Force I/O bit manipulation", "Real-time power flow visualization", "Timer accumulator live readout", "Scan-cycle timing measurement (ms)"],
    code: "SCAN_CYCLE:\n  READ_INPUTS()   // I:0.0 → I:1.7\n  EXECUTE_RUNGS() // Rung 0..N\n  WRITE_OUTPUTS() // O:0.0 → O:1.7\n  // Cycle time: 12.4 ms",
    rungs: [
      { powered: true,  coilTag: "MOTOR",  contacts: [{ tag: "START_PB", type: "NO", powered: true }, { tag: "ESTOP", type: "NC", powered: true }] },
      { powered: false, coilTag: "ALARM",  contacts: [{ tag: "OL_TRIP",  type: "NO", powered: false }] },
    ]
  },
  {
    title: "Technical PDF Export",
    tech: "IEC-Compliant Documentation",
    desc: "Export complete, professionally formatted documentation containing rung-by-rung explanations, I/O tag tables, memory map, function block descriptions, and electrical schematic annotations. Suitable for client handover, CPCB submissions, and institutional assessment reports.",
    points: ["Rung-by-rung narrative explanations", "Complete I/O tag cross-reference table", "PLC memory map (bit/word/DW)", "Client-ready technical PDF format"],
    code: "EXPORT_PDF:\n  cover_page        → LadderForge AI v4\n  io_table          → 48 tags\n  rung_explanations → 12 pages\n  memory_map        → MW0..MW127\n  sign_off_sheet    → Engineer",
    rungs: [
      { powered: true,  coilTag: "DOC_OK",  contacts: [{ tag: "EXPORT", type: "NO", powered: true }] },
      { powered: true,  coilTag: "PDF_GEN", contacts: [{ tag: "DOC_OK", type: "NO", powered: true }] },
    ]
  }
];

/* ─────────────────────────────────────────
   DISCIPLINES DATA
───────────────────────────────────────── */
const disciplines = [
  {
    abbr: "EEE", name: "Electrical Engineering",
    icon: Zap, color: "#f97316",
    desc: "Master motor starter circuits, forward-reverse interlocks, star-delta starters, and power factor correction logic using NEMA/IEC standards.",
    topics: ["DOL / Star-Delta Starters", "Motor Protection Circuits", "Sequential Interlocks", "Feeder Panel Automation"]
  },
  {
    abbr: "EIE", name: "Instrumentation & Control",
    icon: Activity, color: "#fb923c",
    desc: "Design closed-loop process control rungs with analog input scaling, PID FBs, transmitter signal conditioning, and HART device management.",
    topics: ["PID Feedback Loops", "4-20mA Signal Scaling", "Analog Input FBs", "Process Alarm Rungs"]
  },
  {
    abbr: "MECH", name: "Mechatronics",
    icon: Cpu, color: "#f97316",
    desc: "Coordinate servo drives, stepper pulse trains, encoder feedback counters, and multi-axis synchronization routines for precision motion.",
    topics: ["Servo Drive Control", "Encoder Counter FBs", "Position Indexing", "Conveyor Sequencing"]
  },
  {
    abbr: "ROBO", name: "Robotics & Automation",
    icon: GitBranch, color: "#fb923c",
    desc: "Implement high-speed robotic cell safety interlocks, gripper I/O sequencing, vision system triggers, and collaborative robot fencing logic.",
    topics: ["Cell Safety Interlocks", "Robot I/O Handshaking", "Vision Trigger Logic", "Collaborative Fencing"]
  }
];

/* ─────────────────────────────────────────
   MAIN HOME COMPONENT
───────────────────────────────────────── */
export default function Home() {
  const { isDark } = useTheme();
  const nav = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [simState, setSimState]     = useState([true, false, true]);
  const [activeDiscipline, setActiveDiscipline] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSimState(s => [!s[0], !s[1], s[2]]), 2800);
    return () => clearInterval(t);
  }, []);

  const step = stepDetails[activeStep];

  return (
    <div style={{ background: "var(--bg)", color: "var(--txt)", fontFamily: "var(--body)", minHeight: "100vh", width: "100%", overflowX: "hidden", position: "relative" }}>
      <GlobalStyles isDark={isDark} />
      <Navbar />

      {/* ══════════════════════════════════
          HERO SECTION
      ══════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        <div className="grid-bg" />

        <div className="hero-grid hero-pad" style={{ maxWidth: 1400, margin: "0 auto", padding: "120px 48px 80px 48px", width: "100%", zIndex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* Left: Copy */}
          <div>
            <div className="tag-badge fade-up" style={{ marginBottom: 32 }}>
              <span className="dot" />
              BEST PLC LADDER LOGIC GENERATOR • IEC 61131-3
            </div>

            <h1 className="fade-up-2 hero-title" style={{ fontFamily: "var(--display)", fontSize: "clamp(44px,6vw,78px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: 28 }}>
              LadderForge AI:<br />
              <span style={{ color: "var(--primary)" }}>PLC Ladder Logic Generator</span><br />
              <span style={{ fontSize: "0.55em", color: "var(--txt2)", fontWeight: 600, letterSpacing: "-0.02em" }}>Advanced Training & Simulation Workspace</span>
            </h1>

            <p className="fade-up-3" style={{ fontSize: 18, color: "var(--txt2)", lineHeight: 1.75, maxWidth: 560, marginBottom: 40 }}>
              Convert natural language control requirements into verified Ladder Logic diagrams. Simulate scan cycles, validate interlock logic, and export IEC-compliant documentation — purpose-built for <strong style={{ color: "var(--txt)" }}>EEE, EIE, Mechatronics, Robotics & Automation</strong> students and engineers.
            </p>

            <div className="action-btns" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
              <button className="btn-primary" onClick={() => nav("/signup")}>
                Open Workspace <ArrowRight size={18} />
              </button>
              <button className="btn-outline" onClick={() => nav("/guide")}>
                <BookOpen size={18} /> IEC Documentation
              </button>
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[["IEC 61131-3", Layers], ["Real-Time Scan Sim", Activity], ["AI Rung Synthesis", Cpu], ["PDF Export", FileText]].map(([label, Icon]) => (
                <span className="feat-pill" key={label}>
                  <Icon size={13} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live Ladder Preview */}
          <div style={{ position: "relative" }}>
            <div className="card" style={{ padding: 28, boxShadow: isDark ? "0 40px 80px rgba(0,0,0,0.4)" : "0 40px 80px rgba(249,115,22,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--txt3)", letterSpacing: ".12em" }}>
                  LADDER_EDITOR • LIVE_SIM
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#ef4444","#f59e0b","#22c55e"].map(c => (
                    <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />
                  ))}
                </div>
              </div>

              {/* Status bar */}
              <div style={{ display: "flex", gap: 16, marginBottom: 16, padding: "8px 14px", background: "var(--bg3)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 9, color: "var(--txt3)" }}>
                <span style={{ color: "#22c55e" }}>● RUN</span>
                <span>SCAN: 12.4ms</span>
                <span>TAGS: 6</span>
                <span style={{ color: "var(--primary)" }}>IEC 61131-3</span>
              </div>

              <LadderLogicSVG rungs={[
                { powered: simState[0], coilTag: "RUN_COIL", contacts: [{ tag: "START_PB", type: "NO", powered: simState[0] }, { tag: "RUN_SEAL", type: "NO", powered: simState[0] }] },
                { powered: simState[1], coilTag: "CLR_FLT",  contacts: [{ tag: "ESTOP_NC", type: "NC", powered: simState[1] }] },
                { powered: simState[2], coilTag: "MOTOR_Y",  contacts: [{ tag: "RUN_COIL", type: "NO", powered: simState[2] }, { tag: "OL_TRIP", type: "NC", powered: simState[2] }] },
              ]} />

              <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
                {["START_PB", "ESTOP_NC", "OL_TRIP", "MOTOR_Y"].map((tag, i) => (
                  <div key={tag} style={{ padding: "4px 10px", borderRadius: 6, background: i < 2 && simState[i] ? "var(--primary-dim)" : "var(--bg3)", border: `1px solid ${i < 2 && simState[i] ? "var(--border2)" : "var(--border)"}`, fontFamily: "var(--mono)", fontSize: 9, color: i < 2 && simState[i] ? "var(--primary)" : "var(--txt3)" }}>
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating annotation */}
            <div style={{ position: "absolute", top: -20, right: -20, padding: "8px 16px", background: "var(--primary)", color: "#fff", borderRadius: 100, fontFamily: "var(--mono)", fontSize: 9, fontWeight: 700, animation: "float 3s ease-in-out infinite" }}>
              LIVE SIMULATION
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS BAR
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "60px 48px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="stats-grid" style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
          {[["5000+","Engineering Students"], ["200+","IEC-Compliant Programs"], ["4","Core Disciplines"], ["99.8%","Simulation Accuracy"]].map(([num, lbl]) => (
            <div className="stat-card" key={lbl}>
              <div className="stat-num">{num}</div>
              <div className="stat-lbl">{lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          DISCIPLINES SECTION
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "120px 48px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="sec-label">ENGINEERING DISCIPLINES</div>
            <h2 className="sec-title">Built for Every Branch<br />of <span style={{ color: "var(--primary)" }}>Industrial Engineering</span></h2>
            <p className="sec-sub" style={{ margin: "0 auto" }}>
              Domain-specific ladder templates, terminology, and function blocks tailored to each engineering discipline's real-world control challenges.
            </p>
          </div>

          <div className="disc-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 48 }}>
            {disciplines.map((d, i) => {
              const Icon = d.icon;
              return (
                <div key={i} className="disc-card" onClick={() => setActiveDiscipline(i)} style={{ borderColor: activeDiscipline === i ? "var(--primary)" : "var(--border)" }}>
                  <div className="disc-icon"><Icon size={20} color="var(--primary)" /></div>
                  <div className="disc-abbr">{d.abbr}</div>
                  <div className="disc-name">{d.name}</div>
                  <div className="disc-desc">{d.desc}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 20 }}>
                    {d.topics.map(t => (
                      <span key={t} style={{ padding: "3px 10px", borderRadius: 100, background: "var(--primary-dim)", border: "1px solid var(--border2)", fontFamily: "var(--mono)", fontSize: 9, color: "var(--primary)", fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Discipline image banner */}
          <div className="disc-banner" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, borderRadius: 'var(--r2)', overflow: "hidden" }}>
            {[
              { src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80", label: "PLC Cabinet Wiring" },
              { src: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=600&q=80", label: "Industrial Automation" },
              { src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80", label: "Control System Design" },
            ].map(img => (
              <div key={img.label} style={{ position: "relative", borderRadius: 'var(--r2)', overflow: "hidden", height: 200 }}>
                <img src={img.src} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,10,4,0.7), transparent)" }} />
                <span style={{ position: "absolute", bottom: 14, left: 16, fontFamily: "var(--mono)", fontSize: 10, color: "#fff", fontWeight: 700, letterSpacing: ".1em" }}>{img.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          3D PLC + WHAT IS PLC SECTION
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "120px 48px", background: isDark ? "rgba(249,115,22,0.02)" : "rgba(249,115,22,0.04)", borderTop: "1px solid var(--border)" }}>
        <div className="plc-grid" style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>

          {/* 3D PLC Canvas */}
          <div style={{ position: "relative", height: 420, borderRadius: 'var(--r2)', overflow: "hidden", background: isDark ? "#080401" : "#0f0a04", border: "1px solid var(--border2)" }}>
            <PLCVisualization isDark={isDark} />
            <div style={{ position: "absolute", bottom: 16, left: 16, fontFamily: "var(--mono)", fontSize: 9, color: "rgba(249,115,22,0.7)", letterSpacing: ".1em" }}>
              SIMATIC_S7 • DIN_RAIL_MOUNTED • INTERACTIVE_MODEL
            </div>
          </div>

          {/* PLC Explainer */}
          <div>
            <div className="sec-label">WHAT IS A PLC?</div>
            <h2 className="sec-title" style={{ fontSize: "clamp(28px,3.5vw,44px)" }}>
              Programmable Logic Controller —<br /><span style={{ color: "var(--primary)" }}>The Brain of Industry</span>
            </h2>
            <p style={{ fontSize: 16, color: "var(--txt2)", lineHeight: 1.8, marginBottom: 28 }}>
              A <strong style={{ color: "var(--txt)" }}>PLC (Programmable Logic Controller)</strong> is a ruggedised industrial computer designed to automate electromechanical processes — from assembly lines and conveyor systems to chemical reactors and robotic arms. Unlike general-purpose computers, PLCs operate in real-time, executing a deterministic <strong style={{ color: "var(--txt)" }}>scan cycle</strong> every few milliseconds.
            </p>
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { label: "CPU Module", desc: "Executes the control program, manages scan cycle, handles communications (PROFIBUS, Ethernet/IP, Modbus)" },
                { label: "Digital Input (DI)", desc: "Reads discrete 24VDC signals from push buttons, limit switches, photoelectric sensors, proximity sensors" },
                { label: "Digital Output (DO)", desc: "Drives contactors, solenoid valves, motor drives, signal lamps via relay or solid-state outputs" },
                { label: "Analog I/O (AI/AO)", desc: "Processes 4-20mA / 0-10V signals from pressure transmitters, thermocouples, flow meters, positioners" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", gap: 16, padding: "14px 18px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 'var(--r)' }}>
                  <div style={{ width: 8, minWidth: 8, height: 8, borderRadius: "50%", background: "var(--primary)", marginTop: 6 }} />
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--primary)", fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          LADDER LOGIC EXPLAINER
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "120px 48px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="ladder-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              <div className="sec-label">LADDER LOGIC FUNDAMENTALS</div>
              <h2 className="sec-title" style={{ fontSize: "clamp(28px,3.5vw,44px)" }}>
                Why Ladder Logic?<br />
                <span style={{ color: "var(--primary)" }}>The IEC Standard</span>
              </h2>
              <p style={{ fontSize: 16, color: "var(--txt2)", lineHeight: 1.8, marginBottom: 32 }}>
                <strong style={{ color: "var(--txt)" }}>Ladder Diagram (LD)</strong> is the most widely deployed PLC programming language under IEC 61131-3. Its graphical representation mimics relay logic schematics — two vertical power rails (L1 / L2) connected by horizontal rungs carrying contacts and output coils. This visual paradigm makes control logic immediately readable to both electrical engineers and maintenance technicians.
              </p>

              <div style={{ display: "grid", gap: 20 }}>
                {[
                  { sym: "[ ]", name: "Normally Open (NO) Contact", desc: "Closes (conducts) when referenced bit = TRUE. Used for push buttons, sensor inputs, seal-in contacts." },
                  { sym: "[/]", name: "Normally Closed (NC) Contact", desc: "Opens (breaks) when referenced bit = TRUE. Used for E-stops, overload trips, safety gates." },
                  { sym: "( )", name: "Output Coil", desc: "Sets the referenced output bit = TRUE when rung has power continuity. Maps to DO terminals." },
                  { sym: "[TON]", name: "Timer On-Delay (TON)", desc: "Accumulates preset time when enabled. Used for motor start delays, sequence timing, debounce." },
                  { sym: "[CTU]", name: "Up Counter (CTU)", desc: "Increments on each rising edge. Used for batch counting, production tallying, cycle counting." },
                ].map(item => (
                  <div key={item.name} style={{ display: "flex", gap: 16 }}>
                    <div style={{ padding: "8px 12px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 13, color: "var(--primary)", fontWeight: 700, minWidth: 56, textAlign: "center", height: "fit-content" }}>{item.sym}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{item.name}</div>
                      <div style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live annotated ladder */}
            <div>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--txt3)", letterSpacing: ".1em", marginBottom: 16 }}>EXAMPLE: DOL MOTOR STARTER • RUNG 00-02</div>
                <LadderLogicSVG rungs={[
                  { powered: true,  coilTag: "RUN_COIL", contacts: [{ tag: "START_PB", type: "NO", powered: true }, { tag: "RUN_SEAL", type: "NO", powered: true }] },
                  { powered: true,  coilTag: "RUN_SEAL", contacts: [{ tag: "RUN_COIL", type: "NO", powered: true }, { tag: "ESTOP",   type: "NC", powered: true }] },
                  { powered: true,  coilTag: "MOTOR_Y",  contacts: [{ tag: "RUN_COIL", type: "NO", powered: true }, { tag: "OL_TRIP", type: "NC", powered: true }] },
                ]} />
              </div>

              {/* Annotation cards */}
              <div style={{ display: "grid", gap: 12 }}>
                {[
                  { rung: "RUNG 00", title: "Momentary Start + Seal-In", note: "START_PB (NO) closes momentarily → energises RUN_COIL. RUN_SEAL (NO) in parallel holds circuit after START_PB releases." },
                  { rung: "RUNG 01", title: "Seal-in Memory Rung", note: "RUN_COIL contact maintains power through ESTOP (NC). ESTOP opens → clears RUN_COIL = motor stop." },
                  { rung: "RUNG 02", title: "Motor Output + Overload", note: "MOTOR_Y energises contactor coil only when RUN_COIL=TRUE and OL_TRIP=FALSE (overload healthy)." },
                ].map(a => (
                  <div key={a.rung} style={{ padding: "14px 18px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 'var(--r)' }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--primary)", fontWeight: 700 }}>{a.rung}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--txt2)", lineHeight: 1.6 }}>{a.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          4-STEP WORKFLOW
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "120px 48px", background: isDark ? "rgba(249,115,22,0.02)" : "rgba(249,115,22,0.04)", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="sec-label">AI-POWERED WORKFLOW</div>
            <h2 className="sec-title">From Specification to<br /><span style={{ color: "var(--primary)" }}>Verified Ladder Logic</span></h2>
          </div>

          <div className="workflow-grid" style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 48 }}>

            {/* Step navigation */}
            <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
              {stepDetails.map((s, i) => (
                <div key={i} className={`step-item${activeStep === i ? " active" : ""}`} onClick={() => setActiveStep(i)}>
                  <div className="step-num">STEP 0{i + 1}</div>
                  <div className="step-title" style={{ color: activeStep === i ? "var(--primary)" : "var(--txt)" }}>{s.title}</div>
                  <div className="step-desc">{s.tech}</div>
                </div>
              ))}
            </div>

            {/* Step detail panel */}
            <div key={activeStep} className="card" style={{ animation: "fade-up .35s ease" }}>
              <div className="sec-label" style={{ marginBottom: 12 }}>STEP 0{activeStep + 1} — {step.tech}</div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 16 }}>{step.title}</h3>
              <p style={{ fontSize: 15, color: "var(--txt2)", lineHeight: 1.8, marginBottom: 28 }}>{step.desc}</p>

              {/* Technical points */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
                {step.points.map(pt => (
                  <div key={pt} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 14px", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 10 }}>
                    <span style={{ color: "var(--primary)", fontSize: 14, marginTop: 1 }}>▸</span>
                    <span style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.55 }}>{pt}</span>
                  </div>
                ))}
              </div>

              {/* Code snippet */}
              <div style={{ padding: "16px 20px", background: isDark ? "#050300" : "#1c1917", borderRadius: 12, fontFamily: "var(--mono)", fontSize: 12, lineHeight: 1.8, color: "#d6c9b3", marginBottom: 28, overflowX: "auto" }}>
                <div style={{ fontSize: 9, color: "#6b6460", letterSpacing: ".1em", marginBottom: 10 }}>// PROGRAM EXCERPT</div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{step.code}</pre>
              </div>

              {/* Mini ladder preview */}
              <div style={{ background: "var(--bg3)", borderRadius: 12, padding: "20px 16px", border: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--txt3)", marginBottom: 10 }}>GENERATED LADDER OUTPUT</div>
                <LadderLogicSVG rungs={step.rungs} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          FEATURE GRID WITH IMAGES
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "120px 48px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div className="sec-label">PLATFORM CAPABILITIES</div>
            <h2 className="sec-title">Everything You Need to<br /><span style={{ color: "var(--primary)" }}>Master Industrial Control</span></h2>
          </div>

          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>

            {/* Large feature: Simulation */}
            <div className="card large" style={{ gridColumn: "1 / 3", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
              <div>
                <div style={{ padding: "10px 16px", background: "var(--primary-dim)", border: "1px solid var(--border2)", borderRadius: 8, fontFamily: "var(--mono)", fontSize: 10, color: "var(--primary)", fontWeight: 700, marginBottom: 20, display: "inline-block" }}>CORE FEATURE</div>
                <h3 style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Software PLC Scan-Cycle Simulator</h3>
                <p style={{ fontSize: 14, color: "var(--txt2)", lineHeight: 1.75, marginBottom: 20 }}>
                  Execute programs in a full scan-cycle emulator. Force input bits, monitor coil states in real-time, and measure scan-cycle time down to the millisecond. Validate your logic without any physical hardware.
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {["Force I/O Bits", "Live Power Flow", "Scan-Cycle Timing", "Error Detection"].map(f => (
                    <span key={f} style={{ padding: "4px 12px", borderRadius: 100, background: "var(--primary-dim)", border: "1px solid var(--border2)", fontSize: 11, color: "var(--primary)", fontFamily: "var(--mono)", fontWeight: 600 }}>{f}</span>
                  ))}
                </div>
              </div>
              <div style={{ borderRadius: 16, overflow: "hidden" }}>
                <img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80" alt="PLC Simulation" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              </div>
            </div>

            {/* Small feature cards */}
            <div className="card">
              <div style={{ width: 44, height: 44, background: "var(--primary-dim)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <FileText size={20} color="var(--primary)" />
              </div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>IEC PDF Export</h3>
              <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.7 }}>Rung-by-rung explanations, I/O tag tables, memory maps, and complete project documentation formatted to IEC standards.</p>
            </div>

            <div className="card" style={{ gridColumn: "1 / 2" }}>
              <div style={{ width: 44, height: 44, background: "var(--primary-dim)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Code2 size={20} color="var(--primary)" />
              </div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>AI Rung Synthesis</h3>
              <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.7 }}>Describe control requirements in plain English. The AI engine generates validated ladder rungs with proper contact types, seal-in circuits, and function blocks.</p>
            </div>

            <div className="card" style={{ gridColumn: "2 / 4" }}>
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
                <img src="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80" alt="Robotics Automation" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
              </div>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Multi-Discipline Templates</h3>
              <p style={{ fontSize: 13, color: "var(--txt2)", lineHeight: 1.7 }}>Pre-built, industry-verified templates for DOL starters, star-delta transitions, PID loops, conveyor sequencing, and robotic safety interlocks across all four engineering disciplines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TECHNICAL SPECS TABLE
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "80px 48px", borderTop: "1px solid var(--border)", background: isDark ? "rgba(249,115,22,0.02)" : "rgba(249,115,22,0.04)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <div className="sec-label" style={{ textAlign: "center", marginBottom: 12 }}>TECHNICAL SPECIFICATIONS</div>
          <h2 className="sec-title" style={{ textAlign: "center", marginBottom: 48 }}>Platform <span style={{ color: "var(--primary)" }}>Standards & Compliance</span></h2>

          <div className="specs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {[
              { title: "IEC 61131-3 Data Types", items: ["BOOL, INT, DINT, REAL", "STRING, TIME, DATE", "ARRAY, STRUCT, ENUM", "Derived Types (DT)"] },
              { title: "Function Blocks", items: ["TON, TOF, RTO Timers", "CTU, CTD, CTUD Counters", "SR, RS Flip-Flops", "PID, SCALE, LIMIT"] },
              { title: "Communication Protocols", items: ["Modbus RTU / TCP", "PROFIBUS DP", "EtherNet/IP", "OPC UA (read)"] },
              { title: "I/O Configuration", items: ["Up to 512 DI / 512 DO", "Up to 64 AI / 32 AO", "4-20mA / 0-10V Ranges", "Thermocouple Linearisation"] },
              { title: "Simulation Engine", items: ["Scan cycle: 1–250ms", "Force bit manipulation", "Trace buffer: 1000 scans", "Real-time I/O monitoring"] },
              { title: "Export Formats", items: ["PDF (IEC formatted)", "CSV Tag table export", "XML project backup", "SVG ladder diagrams"] },
            ].map(spec => (
              <div key={spec.title} className="card">
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--primary)", fontWeight: 700, letterSpacing: ".1em", marginBottom: 16 }}>{spec.title}</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {spec.items.map(it => (
                    <div key={it} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ color: "var(--primary)", fontSize: 10 }}>▸</span>
                      <span style={{ fontSize: 13, color: "var(--txt2)" }}>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

     
      {/* ══════════════════════════════════
          CTA
      ══════════════════════════════════ */}
      <section className="section-pad" style={{ padding: "80px 48px 120px 48px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          <div className="cta-box" style={{ background: "var(--primary)", borderRadius: 40, padding: "80px 60px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            {/* Grid overlay */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: ".18em", marginBottom: 20 }}>BEGIN YOUR PLC JOURNEY</div>
              <h2 style={{ fontFamily: "var(--display)", fontSize: "clamp(32px,5vw,60px)", fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
                Ready to Build Real<br />Industrial Control Logic?
              </h2>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.85)", marginBottom: 48, maxWidth: 560, margin: "0 auto 48px" }}>
                Join 5,000+ engineering students mastering IEC 61131-3 Ladder Logic with AI-powered guidance, real-time simulation, and professional documentation tools.
              </p>
              <div className="action-btns" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => nav("/signup")} style={{ padding: "18px 52px", background: "#fff", color: "var(--primary)", border: "none", borderRadius: 14, fontFamily: "var(--display)", fontWeight: 800, fontSize: 17, cursor: "pointer", transition: ".2s" }}>
                  Start Free — No Credit Card
                </button>
                <button onClick={() => nav("/guide")} style={{ padding: "18px 40px", background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 14, fontFamily: "var(--display)", fontWeight: 700, fontSize: 17, cursor: "pointer" }}>
                  View Full Documentation
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

     
    </div>
  );
}