import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";
import LadderDiagram from "../components/LadderDiagram";
import { generate, getProjects, explainRungs, deleteProject } from "../api/client";
import LadderLogo from "../components/LadderLogo";
import { Trash2, Loader2, AlertTriangle, CheckCircle2, RotateCcw, Printer, Plus, Sparkles, X, Menu, Cpu } from "lucide-react";

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

  // Delete & Toast states
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toastMsg, setToastMsg] = useState("");

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

  const openDeleteConfirm = (e, project) => {
    e.stopPropagation();
    setDeleteTarget(project);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget._id;
    const targetName = deleteTarget.project_name;
    setDeletingId(targetId);
    try {
      await deleteProject(targetId);
      if (currentProject?._id === targetId || currentProject?.project_id === targetId) {
        setProject(null);
      }
      setDeleteTarget(null);
      setToastMsg(`Project "${targetName}" deleted successfully`);
      setTimeout(() => setToastMsg(""), 3500);
      await loadProjects();
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert(err.response?.data?.detail || "Failed to delete project");
    } finally {
      setDeletingId(null);
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
            <button onClick={() => setSidebarOpen(false)} style={S.closeSidebarBtn}><X size={12} /> CLOSE</button>
          </div>
          <div style={S.sidebarContent}>
            <button onClick={() => setShowGen(true)} style={{ ...S.newBtn, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Plus size={16} /> START NEW DESIGN
            </button>
            <div style={S.projectList}>
              {fetching ? <div style={S.statusText}>Syncing...</div> : projects.length === 0 ? <div style={S.statusText}>No deposits.</div> : (
                projects.map(p => (
                  <div key={p._id} onClick={() => setProject({ ...p, project_id: p._id, plc_logic: p.plc_logic || { rungs: [] } })} style={currentProject?._id === p._id ? S.projectCardActive : S.projectCard}>
                    <div style={S.projectIcon}><Cpu size={15} color={C.brandPrimary} /></div>
                    <div style={S.projectInfo}><span style={S.pName}>{p.project_name}</span><span style={S.pPrompt}>{p.prompt}</span></div>
                    <button 
                      onClick={(e) => openDeleteConfirm(e, p)} 
                      title="Delete Project"
                      disabled={deletingId === p._id}
                      style={{
                        background: "none",
                        border: "none",
                        color: C.textMuted || "#888",
                        cursor: "pointer",
                        padding: "6px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#ef4444"; e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted || "#888"; e.currentTarget.style.background = "none"; }}
                    >
                      {deletingId === p._id ? (
                        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </button>
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
                   <button onClick={() => setSidebarOpen(true)} style={{ ...S.menuBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Menu size={14} /> {isMobile ? "MENU" : "MY PROJECTS"}
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
                    <RotateCcw size={14} /> REGENERATE
                  </button>
                )}
                <button onClick={() => window.print()} style={S.actionBtnPrimary}>
                  <Printer size={14} /> EXPORT PDF
                </button>
             </div>
          </header>

          <div style={S.workspaceContent}>
             {currentProject ? (
               <div style={S.canvasArea} className="printable-area">
                  {/* PDF INDUSTRIAL ENGINEERING TITLE & SPECIFICATION BLOCK */}
                  <div className="pdf-header-only">
                    <div style={{ border: '2px solid #000000', padding: '12px 16px', marginBottom: '15px', background: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #000000', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div>
                          <h1 style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: 0 }}>
                            {currentProject?.project_name || "INDUSTRIAL PLC SPECIFICATION"}
                          </h1>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#222222', margin: '4px 0 0 0' }}>
                            SPECIFICATION: {currentProject?.prompt || "Industrial Control Logic Specification"}
                          </p>
                        </div>

                        {/* BRAND LOGO BADGE (COLOR ACCENT AT TOP) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="pdf-brand-logo" style={{ width: 36, height: 36, background: '#f97316', color: '#ffffff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                            <LadderLogo style={{ width: 22, height: 22 }} />
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              LADDERFORGE <span className="pdf-brand-accent" style={{ color: '#f97316' }}>AI</span>
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: '#444444', margin: '1px 0 0 0' }}>
                              IEC 61131-3 ENGINEERING SPECIFICATION
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* METADATA STRIP */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', fontSize: '9px', fontWeight: 800, color: '#000000' }}>
                        <div>DOC REF: <b>LF-ENG-2026-001</b></div>
                        <div>REVISION: <b>REV 1.0 (APPROVED)</b></div>
                        <div>STANDARD: <b>IEC 61131-3</b></div>
                        <div>DATE: <b>{new Date().toLocaleDateString()}</b></div>
                      </div>
                    </div>

                    {/* SYSTEM I/O & VARIABLE TAG MAPPING TABLE */}
                    <div style={{ marginBottom: '15px', border: '1px solid #000000', padding: '10px 14px', background: '#ffffff' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '8px', color: '#000000' }}>
                        SYSTEM I/O & VARIABLE TAG MAPPING TABLE
                      </div>
                      <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', textAlign: 'left', color: '#000000' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #000000' }}>
                            <th style={{ padding: '4px 0', fontWeight: '800' }}>TAG NAME</th>
                            <th style={{ padding: '4px 0', fontWeight: '800' }}>TYPE / FUNCTION</th>
                            <th style={{ padding: '4px 0', fontWeight: '800' }}>MEMORY ADDRESS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const rungs = currentProject?.plc_logic?.rungs || [];
                            const tagsMap = new Map();
                            rungs.forEach(rung => {
                              (rung.instructions || []).forEach(inst => {
                                if (inst.tag && !tagsMap.has(inst.tag)) {
                                  let type = "BOOL / BIT";
                                  if (inst.type === "contact") type = inst.mode === "NC" ? "Input (NC Contact)" : "Input (NO Contact)";
                                  if (inst.type === "coil") type = inst.mode === "OTL" ? "Output (Latch OTL)" : inst.mode === "OTU" ? "Output (Unlatch OTU)" : "Output Coil (OTE)";
                                  if (inst.type === "timer") type = `Timer (${inst.subtype || 'TON'} PRE:${inst.preset}ms)`;
                                  if (inst.type === "counter") type = `Counter (${inst.subtype || 'CTU'} PRE:${inst.preset})`;
                                  if (inst.type === "compare") type = `Compare (${inst.operator || 'EQU'} ${inst.value})`;
                                  tagsMap.set(inst.tag, type);
                                }
                              });
                            });
                            const list = Array.from(tagsMap.entries());
                            if (list.length === 0) return <tr><td colSpan={3} style={{ padding: '4px 0' }}>No tags assigned</td></tr>;
                            return list.map(([tag, type], idx) => (
                              <tr key={idx} style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                                <td style={{ padding: '4px 0', fontFamily: 'monospace', fontWeight: '800' }}>{tag}</td>
                                <td style={{ padding: '4px 0' }}>{type}</td>
                                <td style={{ padding: '4px 0' }}>%M0.{idx}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* RUNG-BY-RUNG ENGINEERING LOGIC ANALYSIS & OPERATIONAL STEPS */}
                    <div style={{ marginBottom: '20px', border: '1px solid #000000', padding: '10px 14px', background: '#ffffff' }}>
                      <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', borderBottom: '1px solid #000000', paddingBottom: '4px', marginBottom: '8px', color: '#000000' }}>
                        RUNG-BY-RUNG ENGINEERING LOGIC ANALYSIS & OPERATIONAL STEPS
                      </div>
                      <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', textAlign: 'left', color: '#000000' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #000000' }}>
                            <th style={{ padding: '4px 0', fontWeight: '800', width: '60px' }}>RUNG #</th>
                            <th style={{ padding: '4px 0', fontWeight: '800' }}>LOGIC ANALYSIS & OPERATIONAL EXECUTION STEP</th>
                            <th style={{ padding: '4px 0', fontWeight: '800', width: '120px' }}>SAFETY INTERLOCK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(currentProject?.plc_logic?.rungs || []).map((r, idx) => {
                            const contacts = (r.instructions || []).filter(i => i.type === "contact");
                            const coils = (r.instructions || []).filter(i => i.type === "coil");
                            const timers = (r.instructions || []).filter(i => i.type === "timer");

                            const cList = contacts.map(i => `${i.tag} (${i.mode === "NC" ? "NC Contact" : "NO Contact"})`).join(contacts.length > 1 ? " AND " : "");
                            const coilList = coils.map(i => `${i.tag} (${i.mode || "OTE"})`).join(", ");
                            const timerList = timers.map(i => `Timer ${i.tag} (${i.preset}ms)`).join(", ");

                            let stepText = "";
                            if (contacts.length > 0 && coils.length > 0) {
                              stepText = `Scans ${cList}. When logic continuity is TRUE, energizes output coil ${coilList}.`;
                            } else if (contacts.length > 0 && timers.length > 0) {
                              stepText = `Scans ${cList}. When TRUE, initiates timing sequence for ${timerList}.`;
                            } else {
                              stepText = `Executes rung sequence containing ${r.instructions.map(i => i.tag || i.type).join(", ")}.`;
                            }

                            return (
                              <tr key={idx} style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                                <td style={{ padding: '4px 0', fontWeight: '800' }}>RUNG {idx + 1}</td>
                                <td style={{ padding: '4px 0', lineHeight: 1.4 }}>{stepText}</td>
                                <td style={{ padding: '4px 0', fontWeight: '700' }}>
                                  {contacts.some(c => c.mode === "NC") ? "Failsafe Interlock" : "Direct Control"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {(!currentProject.plc_logic?.rungs || currentProject.plc_logic.rungs.length === 0) ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 15 }}>
                      <div style={{ width: 60, height: 60, borderRadius: "50%", background: "rgba(249, 115, 22, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <AlertTriangle size={32} color="#f97316" />
                      </div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>No Ladder Rungs Found for "{currentProject.project_name}"</h3>
                      <p style={{ color: C.textMuted, fontSize: 13, maxWidth: 400, margin: 0 }}>
                        This design has no compiled rungs yet. Click below to synthesize standard PLC ladder logic.
                      </p>
                      <button onClick={handleRegenerate} style={{ padding: '12px 24px', background: C.brandPrimary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <RotateCcw size={14} /> REGENERATE LOGIC NOW
                      </button>
                    </div>
                  ) : (
                    <LadderDiagram project={currentProject} />
                  )}

                  {/* PDF INDUSTRIAL ENGINEERING PROCEDURES & STANDARDS COMPLIANCE REPORT */}
                  <div className="pdf-header-only" style={{ marginTop: '25px', paddingTop: '10px' }}>
                    <div style={{ border: '2px solid #000000', padding: '14px 16px', background: '#ffffff' }}>
                      <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderBottom: '1.5px solid #000000', paddingBottom: '6px', marginBottom: '10px', color: '#000000' }}>
                        INDUSTRIAL CONTROL SYSTEM (ICS) PROCEDURES & STANDARDS COMPLIANCE REPORT
                      </div>

                      {/* SECTION A: SYSTEM OPERATIONAL PROCEDURE */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#000000', marginBottom: '4px' }}>
                          SECTION A: SYSTEM OPERATIONAL & COMMISSIONING PROCEDURE
                        </div>
                        <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '8.5px', color: '#111111', lineHeight: '1.6' }}>
                          <li><b>Pre-Power Continuity Verification:</b> Inspect physical field wiring against assigned %M0.X memory addresses. Verify ground loop integrity.</li>
                          <li><b>Safety Interlock Testing:</b> Confirm all Normally Closed (NC) contact branches drop power on safety trip or E-Stop activation.</li>
                          <li><b>Scan Rate & Cycle Validation:</b> Verify PLC execution cycle timing remains stable under 20ms maximum target limit.</li>
                          <li><b>Functional Truth Table Test:</b> Cycle system through Manual and Auto modes to validate input-to-output transitions.</li>
                        </ol>
                      </div>

                      {/* SECTION B: INDUSTRIAL STANDARDS COMPLIANCE */}
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#000000', marginBottom: '4px' }}>
                          SECTION B: INDUSTRIAL AUTOMATION COMPLIANCE STANDARDS
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '8.5px', color: '#111111' }}>
                          <div>• <b>IEC 61131-3:</b> Programmable Controllers - Ladder Diagram (LD) Standard</div>
                          <div>• <b>ISO 9001:2015:</b> Quality Assurance in Industrial Automation Systems</div>
                          <div>• <b>NFPA 79:</b> Electrical Standard for Industrial Machinery Safety</div>
                          <div>• <b>IEEE 142:</b> Recommended Practice for Grounding Control Systems</div>
                        </div>
                      </div>

                      {/* SECTION C: SIGN-OFF & QUALITY ASSURANCE BLOCK */}
                      <div>
                        <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', color: '#000000', marginBottom: '6px', borderBottom: '1px solid #000000', paddingBottom: '3px' }}>
                          SECTION C: ENGINEERING APPROVAL & QUALITY ASSURANCE SIGN-OFF
                        </div>
                        <table style={{ width: '100%', fontSize: '8.5px', borderCollapse: 'collapse', textAlign: 'left', color: '#000000' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #000000' }}>
                              <th style={{ padding: '3px 0', fontWeight: '800' }}>ROLE</th>
                              <th style={{ padding: '3px 0', fontWeight: '800' }}>AUTHOR / DEPT</th>
                              <th style={{ padding: '3px 0', fontWeight: '800' }}>STATUS</th>
                              <th style={{ padding: '3px 0', fontWeight: '800' }}>DATE</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '0.5px solid #ccc' }}>
                              <td style={{ padding: '3px 0', fontWeight: '700' }}>Lead Automation Engineer</td>
                              <td style={{ padding: '3px 0' }}>AK Webflair AI Engine</td>
                              <td style={{ padding: '3px 0', fontWeight: '800' }}>[ APPROVED ]</td>
                              <td style={{ padding: '3px 0' }}>{new Date().toLocaleDateString()}</td>
                            </tr>
                            <tr style={{ borderBottom: '0.5px solid #ccc' }}>
                              <td style={{ padding: '3px 0', fontWeight: '700' }}>Control Systems Manager</td>
                              <td style={{ padding: '3px 0' }}>Engineering Department</td>
                              <td style={{ padding: '3px 0', fontWeight: '800' }}>[ VERIFIED ]</td>
                              <td style={{ padding: '3px 0' }}>{new Date().toLocaleDateString()}</td>
                            </tr>
                            <tr>
                              <td style={{ padding: '3px 0', fontWeight: '700' }}>Quality Compliance Officer</td>
                              <td style={{ padding: '3px 0' }}>Quality & Standards Division</td>
                              <td style={{ padding: '3px 0', fontWeight: '800' }}>[ RELEASED ]</td>
                              <td style={{ padding: '3px 0' }}>{new Date().toLocaleDateString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
               </div>
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
                  <div style={S.aiSparkleBox}><Sparkles size={18} color="#fff" /></div>
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
               <button onClick={() => setShowGen(false)} style={S.closeBtn}><X size={18} /></button>
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

      {deleteTarget && (
        <div style={S.modalOverlay} className="no-print">
          <div style={S.deleteModalCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.textPrimary }}>Delete Project?</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 11, color: C.textMuted }}>Permanent Action</p>
              </div>
            </div>
            <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginBottom: 24 }}>
              Are you sure you want to delete <strong style={{ color: C.textPrimary }}>"{deleteTarget.project_name}"</strong>? This will permanently remove the logic design from your account.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setDeleteTarget(null)} 
                disabled={!!deletingId}
                style={{ padding: "10px 20px", background: "none", border: `1px solid ${C.borderDefault}`, borderRadius: 12, color: C.textMuted, fontWeight: 800, cursor: "pointer", fontSize: 12 }}
              >
                CANCEL
              </button>
              <button 
                onClick={confirmDelete} 
                disabled={!!deletingId}
                style={{ padding: "10px 24px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 12, fontWeight: 900, cursor: "pointer", fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {deletingId ? (
                  <>
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                    DELETING...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    YES, DELETE
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div style={S.toastCard} className="no-print">
          <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#22c55e20", color: "#22c55e", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={16} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>{toastMsg}</span>
        </div>
      )}

      <style>{`
        @keyframes liquid-glow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes toastSlide { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
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
    deleteModalCard: { width: "100%", maxWidth: 440, background: C.bgCard, borderRadius: 24, border: `1px solid ${C.borderCard}`, padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.5)" },
    toastCard: { position: "fixed", top: 24, right: 24, zIndex: 9999, background: isDark ? "rgba(24, 24, 27, 0.95)" : "rgba(255, 255, 255, 0.95)", border: `1px solid ${isDark ? "#3f3f46" : "#e4e4e7"}`, padding: "12px 18px", borderRadius: 16, display: "flex", alignItems: "center", gap: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", backdropFilter: "blur(10px)", animation: "toastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1)" },
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