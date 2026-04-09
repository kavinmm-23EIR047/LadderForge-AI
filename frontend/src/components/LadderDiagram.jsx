import { useState, useEffect, useRef, useCallback } from "react";
import LadderRung from "./LadderRung";
import { useTheme } from "../hooks/useTheme";
import useStore from "../store/useStore";
import { explainRungs } from "../api/client";

/**
 * LADDER AI - ADVANCED SIMULATION ENGINE (V8: STABLE VIEW)
 * V8: Clean Workspace (Zoom Removed) + 20ms Precision + Pro Mobile Tabs
 */

const COLOR_ACTIVE = "#f97316";

function inferTagType(tag, rungs) {
  for (const rung of rungs) {
    for (const inst of rung.instructions) {
      if (["math", "move", "compare"].includes(inst.type) && (inst.tag === tag || inst.destination === tag || inst.source === tag || inst.source_a === tag)) return "INT";
      if (["timer", "counter"].includes(inst.type) && inst.tag === tag) return "INT";
    }
  }
  return "BOOL";
}

function buildTagMeta(rungs) {
  const meta = {};
  if (!rungs) return meta;
  rungs.forEach(r => r.instructions.forEach(i => {
    const tags = [i.tag, i.destination, i.source, i.source_a].filter(Boolean);
    tags.forEach(t => { if (!meta[t]) meta[t] = { type: "BOOL", value: null }; });
  }));
  Object.keys(meta).forEach(tag => {
    meta[tag].type = inferTagType(tag, rungs);
    meta[tag].value = meta[tag].type === "INT" ? 0 : false;
  });
  return meta;
}

export default function LadderDiagram({ project }) {
  const { C, isDark } = useTheme();
  const { setProject } = useStore();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 1024;
  const isSmallMobile = windowWidth < 600;

  const [activeTab, setActiveTab] = useState("diagram");
  const [rungs, setRungs] = useState(project?.plc_logic?.rungs || []);
  const [tagValues, setTagValues] = useState({});
  const [mode, setMode] = useState("manual");
  const [simSpeed, setSimSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [activeRungIdx, setActiveRungIdx] = useState(-1);
  const [selectedRungId, setSelectedRungId] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiExplains, setAiExplains] = useState({});

  const tagMeta = useRef({});
  const intervalRef = useRef(null);
  const lastScanTime = useRef(Date.now());

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const newRungs = project?.plc_logic?.rungs || [];
    setRungs(newRungs);
    tagMeta.current = buildTagMeta(newRungs);

    const initVals = {};
    Object.keys(tagMeta.current).forEach(t => {
      initVals[t] = tagMeta.current[t].value;
      if (newRungs.some(r => r.instructions.some(i => (i.type === "timer" || i.type === "counter") && i.tag === t))) {
        initVals[`${t}.ACC`] = 0;
      }
    });
    setTagValues(initVals);
    setRunning(false); setActiveRungIdx(-1);
  }, [project?.project_id]);

  const evaluateLadder = useCallback((prevTags, dt) => {
    const next = { ...prevTags };
    const effectiveDt = dt * simSpeed;

    rungs.forEach(rung => {
      const contacts = rung.instructions.filter(i => i.type === "contact");
      const compares = rung.instructions.filter(i => i.type === "compare");
      const coils = rung.instructions.filter(i => i.type === "coil");
      const timers = rung.instructions.filter(i => i.type === "timer");
      const counters = rung.instructions.filter(i => i.type === "counter");
      const moves = rung.instructions.filter(i => i.type === "move");
      const maths = rung.instructions.filter(i => i.type === "math");

      const energized = (contacts.length === 0 || contacts.every(i => i.mode === "NC" ? !next[i.tag] : !!next[i.tag])) &&
        (compares.length === 0 || compares.every(i => {
          const v = Number(next[i.tag] ?? 0), t = Number(i.value ?? 0);
          const op = i.operator;
          if (op === "LES") return v < t; if (op === "GRT") return v > t;
          if (op === "EQ" || op === "EQU") return v === t; if (op === "NEQ") return v !== t;
          if (op === "LEQ") return v <= t; if (op === "GEQ") return v >= t;
          return true;
        }));

      timers.forEach(i => {
        const accTag = `${i.tag}.ACC`;
        const doneTag = `${i.tag}_done`;
        if (energized && i.subtype === "TON") {
          next[accTag] = Math.min(Number(i.preset), (next[accTag] || 0) + effectiveDt);
          next[doneTag] = next[accTag] >= Number(i.preset);
        } else { next[accTag] = 0; next[doneTag] = false; }
      });

      counters.forEach(i => {
        const accTag = `${i.tag}.ACC`;
        const pulseTag = `${i.tag}_pulse`;
        const doneTag = `${i.tag}_done`;
        if (energized && !prevTags[pulseTag]) {
          next[accTag] = (next[accTag] || 0) + 1;
          next[pulseTag] = true;
        } else if (!energized) { next[pulseTag] = false; }
        next[doneTag] = next[accTag] >= Number(i.preset);
      });

      if (energized) {
        moves.forEach(i => next[i.destination] = Number(next[i.source] ?? i.source));
        maths.forEach(i => {
          const a = Number(next[i.source_a] ?? i.source_a), b = Number(next[i.source_b] ?? i.source_b);
          if (i.operator === "add") next[i.destination] = a + b;
          if (i.operator === "sub") next[i.destination] = a - b;
          if (i.operator === "mul") next[i.destination] = a * b;
          if (i.operator === "div") next[i.destination] = b !== 0 ? a / b : 0;
        });
      }
      coils.forEach(coil => {
        if (coil.mode === "OTL") { if (energized) next[coil.tag] = true; }
        else if (coil.mode === "OTU") { if (energized) next[coil.tag] = false; }
        else next[coil.tag] = energized;
      });
    });
    return next;
  }, [rungs, simSpeed]);

  useEffect(() => {
    if (!running) {
      lastScanTime.current = Date.now();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    lastScanTime.current = Date.now();
    intervalRef.current = setInterval(() => {
      setTagValues(prev => {
        const now = Date.now();
        // Calculate DT and apply simulation speed multiplier
        const dt = (now - lastScanTime.current) * simSpeed;
        lastScanTime.current = now;

        let current = { ...prev };

        // 🤖 AUTO-STIMULUS SEQUENCER (Now synced to Scan Speed)
        if (mode === "auto") {
          // Move the highlight at a "human-traceable" pace
          setActiveRungIdx(prevIdx => {
             // Move every 200ms (scaled by simSpeed)
             if (Math.floor(now / (200 / simSpeed)) % 2 === 0) return (prevIdx + 1) % rungs.length;
             return prevIdx;
          });

          Object.keys(current).forEach(tag => {
             const t = tag.toLowerCase();
             // Standard Industrial Pulse cycles (scaled by simSpeed)
             if (t.includes("start") || t.includes("pb")) {
                current[tag] = (now % (5000 / simSpeed)) < (600 / simSpeed);
             }
             if (t.includes("sensor") || t.includes("limit")) {
                current[tag] = (now % (3000 / simSpeed)) < (1500 / simSpeed);
             }
          });
        } else {
          setActiveRungIdx(-1);
        }

        // Logic evaluation with high-precision DT
        return evaluateLadder(current, dt / simSpeed); // Pass raw dt as evaluateladder already uses simSpeed
      });
      setScanCount(s => s + 1);
    }, 20); // ⚡ Standard 20ms Scan Cycle

    return () => clearInterval(intervalRef.current);
  }, [running, mode, evaluateLadder]);

  const handleUpdateInstruction = (instId, updates) => {
    const updated = rungs.map(r => ({
      ...r,
      instructions: r.instructions.map(i => i.id === instId ? { ...i, ...updates } : i)
    }));
    setRungs(updated);
    setProject({ ...project, plc_logic: { ...project.plc_logic, rungs: updated } });
  };

  const explainAll = async () => {
    setAiLoading(true);
    try {
      const res = await explainRungs({ rungs });
      const data = res.data?.explanations || [];
      const map = {}; rungs.forEach((r, i) => map[r.rung_id] = data[i] || "...");
      setAiExplains(map);
    } catch (e) { }
    setAiLoading(false);
  };

  const explainSingleRung = async (rung) => {
    setSelectedRungId(rung.rung_id);
    if (isMobile) setActiveTab("explain");
    if (aiExplains[rung.rung_id]) return;
    setAiLoading(true);
    try {
      const res = await explainRungs({ rungs: [rung] });
      setAiExplains(prev => ({ ...prev, [rung.rung_id]: res.data?.explanations?.[0] || "..." }));
    } catch (e) { }
    setAiLoading(false);
  };

  const S = makeStyles(C, isMobile, activeTab, isSmallMobile, isDark);

  return (
    <div style={S.root}>
      {/* ── MAIN TOOLBAR ── */}
      <header style={S.toolbar}>
        <div style={S.toolGroup}>
          <button onClick={() => setRunning(!running)} style={{ ...S.runBtn, background: running ? "#ef4444" : "#22c55e" }}>
            {running ? (isSmallMobile ? "■" : "STOP SIM") : (isSmallMobile ? "▶" : "START SCAN")}
          </button>
          <div style={S.modeGroup}>
            <button onClick={() => setMode("manual")} style={mode === "manual" ? S.modeActive : S.modeBtn}>
              {isSmallMobile ? "M" : "MANUAL"}
            </button>
            <button onClick={() => setMode("auto")} style={mode === "auto" ? S.modeActive : S.modeBtn}>
              {isSmallMobile ? "A" : "AUTO"}
            </button>
          </div>
        </div>
        <div style={S.stats}>
          {!isSmallMobile && <div style={S.chip}>SCAN: {scanCount}</div>}
          <div style={S.modeGroup}>
            {[1, 5, 10].map(s => (
              <button key={s} onClick={() => setSimSpeed(s)} style={simSpeed === s ? S.modeActive : S.modeBtn}>{s}x</button>
            ))}
          </div>
        </div>
      </header>

      {isMobile && (
        <div style={S.tabBar}>
          <button onClick={() => setActiveTab("diagram")} style={activeTab === "diagram" ? S.tabActive : S.tab}>LADDER</button>
          <button onClick={() => setActiveTab("tags")} style={activeTab === "tags" ? S.tabActive : S.tab}>TAGS</button>
          <button onClick={() => setActiveTab("explain")} style={activeTab === "explain" ? S.tabActive : S.tab}>AI INFO</button>
        </div>
      )}

      <div style={S.main}>
        {(activeTab === "tags" || !isMobile) && (
          <div style={S.sidebar}>
            <div style={S.panelTitle}>STATUS MONITOR</div>
            <div style={S.tagList}>
              {Object.entries(tagValues).filter(([k]) => !k.includes(".ACC") && !k.includes("_pulse")).map(([tag, val]) => (
                <div key={tag} style={S.tagRow}>
                  <span style={S.tagName}>{tag}</span>
                  {typeof val === "boolean" ? (
                    <button onClick={() => setTagValues(p => ({ ...p, [tag]: !val }))} style={{ ...S.statusBtn, background: val ? COLOR_ACTIVE : (isDark ? "#262626" : "#e2e8f0"), color: val ? "#fff" : (isDark ? "#555" : "#94a3b8") }}>
                      {val ? "ON" : "OFF"}
                    </button>
                  ) : (
                    <input type="number" value={Math.round(val)} onChange={(e) => setTagValues(p => ({ ...p, [tag]: Number(e.target.value) }))} style={S.tagInput} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(activeTab === "diagram" || !isMobile) && (
          <div style={S.canvas}>
            <div style={S.rungContainer}>
              <div style={{ display: "inline-flex", flexDirection: "column", minWidth: "100%", zoom: isMobile ? 0.75 : 1, paddingBottom: 20 }}>
                {rungs.map((rung, idx) => (
                  <LadderRung
                    key={rung.rung_id || idx}
                    rung={rung}
                    index={idx}
                    tagValues={tagValues}
                    tagMeta={tagMeta.current}
                    onTagClick={(t) => setTagValues(p => ({ ...p, [t]: !p[t] }))}
                    onUpdateInstruction={handleUpdateInstruction}
                    energized={(() => {
                      const contacts = rung.instructions.filter(i => i.type === "contact");
                      const compares = rung.instructions.filter(i => i.type === "compare");
                      return (contacts.length === 0 || contacts.every(i => i.mode === "NC" ? !tagValues[i.tag] : !!tagValues[i.tag])) &&
                             (compares.length === 0 || compares.every(i => {
                               const v = Number(tagValues[i.tag] ?? 0), t = Number(i.value ?? 0);
                               const op = i.operator;
                               if (op === "LES") return v < t; if (op === "GRT") return v > t;
                               if (op === "EQ" || op === "EQU") return v === t; if (op === "NEQ") return v !== t;
                               if (op === "LEQ") return v <= t; if (op === "GEQ") return v >= t;
                               return true;
                             }));
                    })()}
                    selected={selectedRungId === rung.rung_id}
                    onSelect={() => explainSingleRung(rung)}
                    active={running && activeRungIdx === idx}
                    isMobile={isMobile}
                  />
                ))}
              </div>
              <div style={{ height: 200 }} />
            </div>
          </div>
        )}

        {(activeTab === "explain" || !isMobile) && (
          <div style={S.aiPanel}>
            <div style={S.panelTitle}>LOGIC AI ANALYSIS</div>
            <button onClick={explainAll} disabled={aiLoading} style={S.aiActionBtn}>
              {aiLoading ? "ANALYZING..." : "RE-EXPLAIN ALL"}
            </button>
            <div style={S.aiScroll}>
              {rungs.map((rung, idx) => (
                <div key={rung.rung_id} style={{ ...S.aiCard, borderLeft: selectedRungId === rung.rung_id ? `4px solid ${COLOR_ACTIVE}` : "4px solid transparent" }}>
                  <div style={S.aiRungNum}>RUNG {idx + 1}</div>
                  <p style={S.aiText}>{aiExplains[rung.rung_id] || "Ready..."}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function makeStyles(C, isMobile, activeTab, isSmallMobile, isDark) {
  return {
    root: { display: "flex", flexDirection: "column", height: "100%", background: C.bgPage, overflow: "hidden" },
    toolbar: { display: "flex", justifyContent: "space-between", padding: "10px 20px", borderBottom: `1px solid ${C.borderDefault}`, background: C.bgCard, zIndex: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    toolGroup: { display: "flex", gap: 10, alignItems: "center" },
    runBtn: { padding: "8px 24px", border: "none", borderRadius: 10, color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 11, letterSpacing: '0.05em' },
    modeGroup: { display: "flex", background: C.bgInput, borderRadius: 10, padding: 3, border: `1px solid ${C.borderDefault}` },
    modeBtn: { padding: "6px 14px", border: "none", background: "none", color: C.textMuted, fontSize: 10, fontWeight: 800, cursor: "pointer" },
    modeActive: { padding: "6px 14px", border: "none", background: isDark ? "#262626" : "#ffffff", color: COLOR_ACTIVE, borderRadius: 8, fontSize: 10, fontWeight: 900, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    stats: { display: "flex", alignItems: "center", gap: 15 },
    chip: { background: `${COLOR_ACTIVE}15`, color: COLOR_ACTIVE, padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 900 },

    main: { flex: 1, display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row" },
    tabBar: { display: "flex", background: C.bgCard, borderBottom: `1px solid ${C.borderDefault}`, padding: '0 10px' },
    tab: { flex: 1, padding: 14, border: "none", background: "none", color: C.textMuted, fontSize: 11, fontWeight: 900, borderBottom: "3px solid transparent" },
    tabActive: { flex: 1, padding: 14, border: "none", background: "transparent", color: COLOR_ACTIVE, fontSize: 11, fontWeight: 900, borderBottom: `3px solid ${COLOR_ACTIVE}` },

    sidebar: { width: isMobile ? "100%" : 260, borderRight: isMobile ? "none" : `1px solid ${C.borderDefault}`, padding: "20px 15px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.bgCard, height: isMobile ? '100%' : '100%' },
    tagList: { flex: 1, overflowY: "auto", paddingRight: 5 },
    panelTitle: { color: C.textMuted, fontSize: 10, fontWeight: 900, marginBottom: 20, letterSpacing: "0.15em", textTransform: 'uppercase' },
    tagRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "10px 14px", background: C.bgInput, borderRadius: 12, border: `1px solid ${C.borderDefault}` },
    tagName: { fontSize: 11, color: C.textPrimary, fontWeight: 700, fontFamily: 'monospace' },
    statusBtn: { border: "none", borderRadius: 8, width: 48, height: 28, fontSize: 9, fontWeight: 900, cursor: "pointer", transition: '0.2s' },
    tagInput: { width: 60, background: "transparent", border: "none", color: COLOR_ACTIVE, fontSize: 12, fontWeight: 800, textAlign: "right", borderBottom: `1.5px solid ${C.borderDefault}`, outline: 'none' },

    canvas: { flex: 1, overflow: "hidden", background: C.bgPage, position: 'relative', display: 'flex', flexDirection: 'column' },
    rungContainer: { flex: 1, overflowY: "auto", overflowX: "auto", padding: isMobile ? "15px" : "40px" },

    aiPanel: { width: isMobile ? "100%" : 320, borderLeft: isMobile ? "none" : `1px solid ${C.borderDefault}`, padding: 20, display: "flex", flexDirection: "column", background: C.bgCard, height: isMobile ? '100%' : '100%' },
    aiActionBtn: { width: "100%", padding: 12, border: `1.5px solid ${COLOR_ACTIVE}`, background: "none", color: COLOR_ACTIVE, fontSize: 10, fontWeight: 900, borderRadius: 10, cursor: "pointer", marginBottom: 20, transition: '0.2s' },
    aiScroll: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
    aiCard: { padding: 16, background: C.bgInput, borderRadius: 14, border: `1px solid ${C.borderDefault}` },
    aiRungNum: { fontSize: 9, fontWeight: 900, color: C.textMuted, marginBottom: 10 },
    aiText: { fontSize: 12, color: C.textSecondary, lineHeight: 1.7, margin: 0 }
  };
}