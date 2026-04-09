import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";
import LadderDiagram from "../components/LadderDiagram";
import { generate, getProjects, explainRungs } from "../api/client";
import LadderLogo from "../components/LadderLogo";

export default function Dashboard() {
  const { C, isDark } = useTheme();
  const { user, currentProject, setProject } = useStore();
  const nav = useNavigate();

  const [projects, setProjects] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 1024;
  const isSmallMobile = windowWidth < 600;
  
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [showGen, setShowGen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const S = makeStyles(C, sidebarOpen, showGen, windowWidth, isDark);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return nav("/login");
  }, [nav]);

  const loadProjects = async () => {
    if (!user?.user_id) return;
    setFetching(true);
    try {
      const r = await getProjects(user.user_id);
      setProjects(r.data.projects || []);
    } catch (e) { console.error(e); }
    setFetching(false);
  };
  useEffect(() => { loadProjects(); }, [user]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !projectName.trim()) return setErr("Please fill all fields");
    setLoading(true); setErr("");
    try {
      const res = await generate({ prompt, project_name: projectName, user_id: user.user_id });
      setProject({ ...res.data, project_name: projectName, prompt });
      setShowGen(false); setPrompt(""); setProjectName(""); loadProjects();
    } catch (e) { setErr(e.response?.data?.detail || "Generation failed"); }
    finally { setLoading(false); }
  };

  const handleRegenerate = () => {
    if (currentProject) {
      setProjectName(currentProject.project_name);
      setPrompt(currentProject.prompt || "");
      setShowGen(true);
    }
  };

  return (
    <div style={S.root}>
      <div className="no-print"><Navbar /></div>

      <div style={S.layout}>
        {/* REPOSITORY SIDEBAR */}
        <aside style={S.sidebar} className="no-print">
          <div style={S.sidebarHeader}>
            <span style={S.sidebarTitle}>MY PROJECTS</span>
            <button onClick={() => setSidebarOpen(false)} style={S.closeSidebarBtn}>✕ CLOSE</button>
          </div>
          <div style={S.sidebarContent}>
            <button onClick={() => setShowGen(true)} style={S.newBtn}>
              <span>+</span> START NEW DESIGN
            </button>
            <div style={S.projectList}>
              {fetching ? <div style={S.statusText}>Syncing...</div> : projects.length === 0 ? <div style={S.statusText}>No deposits.</div> : (
                projects.map(p => (
                  <div key={p._id} onClick={() => setProject({ ...p, project_id: p._id })} style={currentProject?._id === p._id ? S.projectCardActive : S.projectCard}>
                    <div style={S.projectIcon}>⚙</div>
                    <div style={S.projectInfo}><span style={S.pName}>{p.project_name}</span><span style={S.pPrompt}>{p.prompt}</span></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {isMobile && sidebarOpen && <div style={S.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />}

        <main style={S.main}>
          <header style={S.toolHeader} className="no-print">
             <div style={S.headerLeft}>
                {(isMobile || !sidebarOpen) && (
                   <button onClick={() => setSidebarOpen(true)} style={S.menuBtn}>
                      {isMobile ? "☰ MENU" : "☰ MY PROJECTS"}
                   </button>
                )}
                <div style={S.projectBadgeGroup}>
                   <h2 style={S.activeProjectName}>{currentProject?.project_name || "LADDERFORGE AI WORKSPACE"}</h2>
                   {currentProject && <span style={S.liveStatus}>● ACTIVE LOGIC</span>}
                </div>
             </div>
             <div style={S.headerRight}>
                {currentProject && (
                  <button onClick={handleRegenerate} style={S.actionBtnSecondary}>
                    <span>🔄</span> REGENERATE
                  </button>
                )}
                <button onClick={() => window.print()} style={S.actionBtnPrimary}>
                  <span>📄</span> EXPORT PDF
                </button>
             </div>
          </header>

          <div style={S.workspaceContent}>
             {currentProject ? (
               <div style={S.canvasArea} className="printable-area"><LadderDiagram project={currentProject} /></div>
             ) : (
               <div style={S.emptyState}>
                 <div style={S.emptyCircle}><LadderLogo style={{ width: 50, height: 50 }} /></div>
                 <h3>Select a project to simulate</h3>
                 <button onClick={() => setSidebarOpen(true)} style={S.emptyBtn}>
                   SELECT PROJECT
                 </button>
               </div>
             )}
          </div>

          {!showGen && (
            <div style={S.aiCommandContainer} className="no-print" onClick={() => setShowGen(true)}>
               <div style={S.aiCommandBar}>
                  <div style={S.aiBorderGlow} />
                  <div style={S.aiSparkleBox}>✨</div>
                  <span style={S.aiCommandText}>AI GENERATOR</span>
               </div>
            </div>
          )}
        </main>
      </div>

      {showGen && (
        <div style={S.modalOverlay} className="no-print">
          <div style={S.modalCard}>
            <div style={S.modalHeader}>
               <h3>Generate PLC Logic</h3>
               <button onClick={() => setShowGen(false)} style={S.closeBtn}>✕</button>
            </div>
            <div style={S.modalBody}>
              <div style={S.inputField}>
                <label style={S.fieldLabel}>SYSTEM IDENTIFIER</label>
                <input placeholder="Project name..." value={projectName} onChange={e => setProjectName(e.target.value)} style={S.modalInput} />
              </div>
              <div style={S.inputField}>
                <label style={S.fieldLabel}>SEQUENCE DESCRIPTION</label>
                <textarea rows={6} placeholder="Describe pump sequences, interlocks, etc..." value={prompt} onChange={e => setPrompt(e.target.value)} style={S.modalTextarea} />
              </div>
              {err && <div style={{ color: C.brandPrimary, fontSize: 12 }}>{err}</div>}
            </div>
            <div style={S.modalFooter}>
              <button onClick={() => setShowGen(false)} style={S.cancelBtn}>CANCEL</button>
              <button onClick={handleGenerate} disabled={loading} style={S.generateBtn}>{loading ? "SYNTHESIZING..." : "START GENERATION"}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes liquid-glow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      `}</style>
    </div>
  );
}

function makeStyles(C, sidebarOpen, showGen, width, isDark) {
  const isMobile = width < 1024;
  const isSmallMobile = width < 600;
  return {
    root: { display: "flex", flexDirection: "column", height: "100vh", background: C.bgPage, color: C.textPrimary, overflow: "hidden" },
    layout: { display: "flex", flex: 1, overflow: "hidden", position: "relative" },
    sidebar: { 
      position: isMobile ? "fixed" : "relative", 
      left: 0, top: 0, bottom: 0, 
      width: sidebarOpen ? 300 : 0, 
      background: C.bgCard, borderRight: sidebarOpen ? `1px solid ${C.borderCard}` : "none",
      display: "flex", flexDirection: "column", transition: "0.4s cubic-bezier(0.4, 0, 0.2, 1)", 
      transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "none",
      overflow: "hidden", zIndex: 2000, boxShadow: isMobile && sidebarOpen ? "20px 0 60px rgba(0,0,0,0.4)" : "none"
    },
    sidebarHeader: { padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.borderCard}`, minWidth: 300 },
    sidebarTitle: { fontSize: 11, fontWeight: 900, color: C.textMuted, letterSpacing: "0.2em" },
    closeSidebarBtn: { background: "none", border: `1px solid ${C.borderDefault}`, padding: "6px 12px", borderRadius: 8, color: C.textMuted, cursor: "pointer", fontSize: 10, fontWeight: 800 },
    sidebarBackdrop: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", zIndex: 1900 },
    sidebarContent: { flex: 1, padding: 20, overflowY: "auto", minWidth: 300 },
    newBtn: { background: C.brandPrimary, color: "#fff", border: "none", padding: "14px", borderRadius: 14, fontWeight: 800, cursor: "pointer", marginBottom: 24, fontSize: 13, width: "100%" },
    projectList: { display: "flex", flexDirection: "column", gap: 10 },
    projectCard: { padding: "14px", borderRadius: 16, cursor: "pointer", display: "flex", gap: 14, alignItems: "center", border: "1px solid transparent" },
    projectCardActive: { padding: "14px", borderRadius: 16, background: `${C.brandPrimary}12`, border: `1px solid ${C.brandPrimary}33`, display: "flex", gap: 14, alignItems: "center" },
    projectIcon: { width: 32, height: 32, borderRadius: 8, background: C.bgInput, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 },
    projectInfo: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", gap: 2 },
    pName: { fontSize: 14, fontWeight: 800, color: C.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    pPrompt: { fontSize: 11, color: C.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
    statusText: { textAlign: "center", padding: 40, color: C.textMuted, fontSize: 12 },

    main: { flex: 1, background: C.bgPage, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" },
    toolHeader: { padding: "15px 30px", background: C.bgCard, borderBottom: `1px solid ${C.borderCard}`, display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 80 },
    headerLeft: { display: "flex", alignItems: "center", gap: 15 },
    menuBtn: { background: C.bgInput, border: `1px solid ${C.borderDefault}`, padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: C.brandPrimary, cursor: "pointer" },
    projectBadgeGroup: { display: "flex", flexDirection: "column", gap: 4 },
    activeProjectName: { fontSize: 18, fontWeight: 900, margin: 0, textTransform: "uppercase" },
    liveStatus: { fontSize: 10, fontWeight: 800, color: "#1D9E75" },
    headerRight: { display: "flex", gap: 12 },
    actionBtnSecondary: { background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: 12, padding: "10px 24px", color: C.textPrimary, cursor: "pointer", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 8, transition: "background 0.2s" },
    actionBtnPrimary: { background: C.brandPrimary, border: "none", borderRadius: 12, padding: "10px 24px", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", gap: 8 },

    workspaceContent: { flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" },
    canvasArea: { flex: 1, overflow: "hidden" },
    emptyState: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, textAlign: "center" },
    emptyCircle: { width: 90, height: 90, borderRadius: 24, background: C.brandPrimary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, marginBottom: 30, transform: "rotate(-5deg)" },
    emptyBtn: { marginTop: 20, padding: "12px 24px", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: 12, color: C.textPrimary, fontWeight: 800, cursor: "pointer", transition: "background 0.2s" },

    aiCommandContainer: { position: "fixed", bottom: 30, right: 30, zIndex: 5000 },
    aiCommandBar: { 
      background: isDark ? "rgba(38, 38, 38, 0.8)" : "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(15px)", 
      border: `1.5px solid ${C.brandPrimary}66`, borderRadius: 40, padding: 6, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)" 
    },
    aiSparkleBox: { width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${C.brandPrimary} 0%, #6366f1 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
    aiCommandText: { fontSize: 11, color: C.textPrimary, fontWeight: 800, marginRight: 15, marginLeft: 5 },
    aiBorderGlow: { position: "absolute", inset: -1, borderRadius: 20, padding: 2, background: `linear-gradient(90deg, transparent, ${C.brandPrimary}, #6366f1, transparent)`, backgroundSize: "200% 100%", animation: "liquid-glow 3s linear infinite", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", pointerEvents: "none" },

    modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 },
    modalCard: { width: "100%", maxWidth: 500, background: C.bgCard, borderRadius: 28, border: `1px solid ${C.borderCard}`, overflow: "hidden" },
    modalHeader: { padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.borderCard}` },
    closeBtn: { fontSize: 24, background: "none", border: "none", color: C.textMuted, cursor: "pointer" },
    modalBody: { padding: "30px", display: "flex", flexDirection: "column", gap: 20 },
    inputField: { display: "flex", flexDirection: "column", gap: 8 },
    fieldLabel: { fontSize: 10, fontWeight: 900, color: C.textMuted },
    modalInput: { padding: "14px", borderRadius: 14, border: `1px solid ${C.borderDefault}`, background: C.bgInput, color: C.textPrimary, outline: "none" },
    modalTextarea: { padding: "14px", borderRadius: 14, border: `1px solid ${C.borderDefault}`, background: C.bgInput, color: C.textPrimary, outline: "none", resize: "none" },
    modalFooter: { padding: "24px", borderTop: `1px solid ${C.borderCard}`, display: "flex", justifyContent: "flex-end", gap: 15 },
    cancelBtn: { padding: "12px 24px", background: "none", border: `2px solid ${C.borderDefault}`, borderRadius: 14, color: C.textMuted, cursor: "pointer", fontWeight: 800 },
    generateBtn: { padding: "12px 30px", background: C.brandPrimary, color: "#fff", border: "none", borderRadius: 14, fontWeight: 900, cursor: "pointer" },
  };
}