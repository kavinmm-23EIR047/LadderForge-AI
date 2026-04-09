import { useState, useEffect, useRef, useCallback } from "react";
import LadderRung from "./LadderRung";
import { useTheme } from "../hooks/useTheme";
import useStore from "../store/useStore";
import { explainRungs } from "../api/client";

/**
 * LADDER AI - ADVANCED SIMULATION ENGINE (V9: FULL ANIMATION + EDIT)
 * V9: Per-instruction animation + ACC/Preset display + Correct speed scaling
 *     + Auto-mode proper rung cycling + Edit mode for all properties
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

// ── EDIT MODAL ──────────────────────────────────────────────────────────────
function EditModal({ instruction, onSave, onClose, C, isDark }) {
  const [form, setForm] = useState({ ...instruction });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const fields = [];
  if (form.tag !== undefined) fields.push({ key: "tag", label: "Tag Name", type: "text" });
  if (form.mode !== undefined && (form.type === "contact" || form.type === "coil"))
    fields.push({ key: "mode", label: "Mode", type: "select", options: form.type === "contact" ? ["NO", "NC"] : ["OTE", "OTL", "OTU"] });
  if (form.preset !== undefined) fields.push({ key: "preset", label: "Preset (ms)", type: "number" });
  if (form.operator !== undefined && form.type === "compare")
    fields.push({ key: "operator", label: "Operator", type: "select", options: ["LES", "GRT", "EQ", "EQU", "NEQ", "LEQ", "GEQ"] });
  if (form.value !== undefined && form.type === "compare") fields.push({ key: "value", label: "Compare Value", type: "number" });
  if (form.source !== undefined) fields.push({ key: "source", label: "Source", type: "text" });
  if (form.destination !== undefined) fields.push({ key: "destination", label: "Destination", type: "text" });
  if (form.source_a !== undefined) fields.push({ key: "source_a", label: "Source A", type: "text" });
  if (form.source_b !== undefined) fields.push({ key: "source_b", label: "Source B", type: "text" });
  if (form.operator !== undefined && form.type === "math")
    fields.push({ key: "operator", label: "Operator", type: "select", options: ["add", "sub", "mul", "div"] });
  if (form.subtype !== undefined && form.type === "timer")
    fields.push({ key: "subtype", label: "Timer Type", type: "select", options: ["TON", "TOF", "RTO"] });
  if (form.subtype !== undefined && form.type === "counter")
    fields.push({ key: "subtype", label: "Counter Type", type: "select", options: ["CTU", "CTD", "RES"] });

  const S = {
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
    box: { background: C.bgCard, border: `1px solid ${C.borderDefault}`, borderRadius: 16, padding: 28, minWidth: 320, maxWidth: 420, width: "90vw", boxShadow: "0 8px 40px rgba(0,0,0,0.25)" },
    title: { fontSize: 11, fontWeight: 900, color: C.textMuted, letterSpacing: "0.12em", marginBottom: 20 },
    label: { fontSize: 10, fontWeight: 800, color: C.textMuted, letterSpacing: "0.08em", marginBottom: 5, display: "block" },
    input: { width: "100%", boxSizing: "border-box", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "8px 12px", color: C.textPrimary, fontSize: 13, fontFamily: "monospace", outline: "none", marginBottom: 14 },
    select: { width: "100%", boxSizing: "border-box", background: C.bgInput, border: `1px solid ${C.borderDefault}`, borderRadius: 8, padding: "8px 12px", color: C.textPrimary, fontSize: 12, outline: "none", marginBottom: 14 },
    row: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 },
    cancelBtn: { padding: "8px 20px", border: `1px solid ${C.borderDefault}`, borderRadius: 9, background: "none", color: C.textMuted, fontSize: 11, fontWeight: 800, cursor: "pointer" },
    saveBtn: { padding: "8px 20px", border: "none", borderRadius: 9, background: COLOR_ACTIVE, color: "#fff", fontSize: 11, fontWeight: 900, cursor: "pointer" },
    typeTag: { display: "inline-block", background: `${COLOR_ACTIVE}22`, color: COLOR_ACTIVE, borderRadius: 6, padding: "3px 9px", fontSize: 10, fontWeight: 900, marginBottom: 18 }
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.box} onClick={e => e.stopPropagation()}>
        <div style={S.title}>EDIT INSTRUCTION</div>
        <div style={S.typeTag}>{form.type?.toUpperCase()}</div>
        {fields.map(f => (
          <div key={f.key}>
            <label style={S.label}>{f.label}</label>
            {f.type === "select" ? (
              <select style={S.select} value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)}>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                style={S.input}
                type={f.type}
                value={form[f.key] ?? ""}
                onChange={e => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
              />
            )}
          </div>
        ))}
        <div style={S.row}>
          <button style={S.cancelBtn} onClick={onClose}>CANCEL</button>
          <button style={S.saveBtn} onClick={() => onSave(form)}>SAVE</button>
        </div>
      </div>
    </div>
  );
}

// ── INSTRUCTION BOX ─────────────────────────────────────────────────────────
// Renders a single PLC instruction with animation, ACC/Preset overlay, edit pencil
export function InstructionBox({ inst, tagValues, energized, isActive, onTagClick, onEdit, isMobile, C, isDark }) {
  const accKey = `${inst.tag}.ACC`;
  const accVal = tagValues[accKey] ?? 0;
  const preset = Number(inst.preset ?? 0);
  const doneKey = `${inst.tag}_done`;
  const done = tagValues[doneKey] ?? false;
  const tagVal = tagValues[inst.tag];

  const isOn = energized;
  const pulse = isActive && isOn;

  const boxColor = pulse ? COLOR_ACTIVE : isOn ? `${COLOR_ACTIVE}99` : (isDark ? "#1a1a1a" : "#f8f8f8");
  const borderColor = pulse ? COLOR_ACTIVE : isOn ? `${COLOR_ACTIVE}66` : (isDark ? "#333" : "#d1d5db");
  const textColor = pulse ? "#fff" : isOn ? COLOR_ACTIVE : C.textPrimary;

  const S = {
    wrap: { position: "relative", display: "inline-flex", flexDirection: "column", alignItems: "center", minWidth: isMobile ? 64 : 80, margin: "0 4px" },
    box: {
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      border: `2px solid ${borderColor}`,
      borderRadius: 10,
      background: boxColor,
      padding: isMobile ? "6px 10px" : "8px 14px",
      minWidth: isMobile ? 60 : 76,
      minHeight: isMobile ? 52 : 64,
      cursor: "pointer",
      transition: "background 0.12s, border-color 0.12s",
      position: "relative",
      userSelect: "none",
      boxShadow: pulse ? `0 0 0 3px ${COLOR_ACTIVE}44` : "none"
    },
    typeLabel: { fontSize: 9, fontWeight: 900, color: pulse ? "#fff" : C.textMuted, letterSpacing: "0.1em", marginBottom: 2 },
    tagLabel: { fontSize: isMobile ? 9 : 10, fontWeight: 800, color: textColor, fontFamily: "monospace", textAlign: "center", wordBreak: "break-all", maxWidth: 70 },
    accBar: { width: "100%", height: 4, borderRadius: 2, background: isDark ? "#2a2a2a" : "#e5e7eb", marginTop: 4, overflow: "hidden" },
    accFill: { height: "100%", borderRadius: 2, background: done ? "#22c55e" : COLOR_ACTIVE, transition: "width 0.1s", width: `${Math.min(100, (accVal / (preset || 1)) * 100)}%` },
    accText: { fontSize: 8, fontWeight: 900, color: pulse ? "#fff" : C.textMuted, marginTop: 2, fontFamily: "monospace" },
    editBtn: {
      position: "absolute", top: -8, right: -8,
      width: 18, height: 18, borderRadius: "50%",
      background: isDark ? "#333" : "#e2e8f0",
      border: `1px solid ${C.borderDefault}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", fontSize: 9, color: C.textMuted, fontWeight: 900,
      zIndex: 10, lineHeight: 1
    },
    contactLines: { display: "flex", alignItems: "center", gap: 0 },
    contactSymbol: { fontSize: isMobile ? 20 : 24, color: textColor, lineHeight: 1, fontFamily: "monospace", fontWeight: 900 },
    coilSymbol: { fontSize: isMobile ? 20 : 24, color: textColor, lineHeight: 1, fontFamily: "monospace" },
    ncBar: { width: 2, height: "110%", background: pulse ? "#fff" : isOn ? COLOR_ACTIVE : C.textMuted, position: "absolute", left: "50%", transform: "translateX(-50%) rotate(20deg)", borderRadius: 1 }
  };

  const typeLabels = { contact: "CONTACT", coil: "COIL", timer: "TIMER", counter: "CTR", compare: "CMP", move: "MOV", math: "MATH" };

  const renderSymbol = () => {
    if (inst.type === "contact") {
      return (
        <div style={S.contactLines}>
          <span style={S.contactSymbol}>|</span>
          <div style={{ position: "relative", width: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {inst.mode === "NC" && <div style={S.ncBar} />}
          </div>
          <span style={S.contactSymbol}>|</span>
        </div>
      );
    }
    if (inst.type === "coil") {
      const sym = inst.mode === "OTL" ? "(L)" : inst.mode === "OTU" ? "(U)" : "( )";
      return <span style={S.coilSymbol}>{sym}</span>;
    }
    if (inst.type === "timer") return <span style={{ fontSize: 13, fontWeight: 900, color: textColor }}>TON</span>;
    if (inst.type === "counter") return <span style={{ fontSize: 13, fontWeight: 900, color: textColor }}>CTU</span>;
    if (inst.type === "compare") return <span style={{ fontSize: 13, fontWeight: 900, color: textColor }}>{inst.operator || "CMP"}</span>;
    if (inst.type === "move") return <span style={{ fontSize: 13, fontWeight: 900, color: textColor }}>MOV</span>;
    if (inst.type === "math") return <span style={{ fontSize: 13, fontWeight: 900, color: textColor }}>{inst.operator?.toUpperCase() || "MATH"}</span>;
    return null;
  };

  const hasAccumulator = (inst.type === "timer" || inst.type === "counter") && preset > 0;

  return (
    <div style={S.wrap}>
      <div style={S.box} onClick={() => onTagClick && onTagClick(inst.tag)}>
        <div style={S.typeLabel}>{typeLabels[inst.type] || inst.type?.toUpperCase()}</div>
        {renderSymbol()}
        <div style={S.tagLabel}>{inst.tag}</div>
        {hasAccumulator && (
          <>
            <div style={S.accBar}><div style={S.accFill} /></div>
            <div style={S.accText}>{Math.round(accVal)}/{preset}ms</div>
          </>
        )}
        {inst.type === "compare" && (
          <div style={{ fontSize: 8, color: pulse ? "#fff" : C.textMuted, fontFamily: "monospace", marginTop: 2 }}>
            {inst.tag} {inst.operator} {inst.value}
          </div>
        )}
        {(inst.type === "move" || inst.type === "math") && (
          <div style={{ fontSize: 8, color: pulse ? "#fff" : C.textMuted, fontFamily: "monospace", marginTop: 2, textAlign: "center" }}>
            {inst.source_a || inst.source}→{inst.destination}
          </div>
        )}
        <button style={S.editBtn} onClick={e => { e.stopPropagation(); onEdit && onEdit(inst); }}>✎</button>
      </div>
    </div>
  );
}

// ── LADDER RUNG (inline, replacing external LadderRung for full control) ─────
function EnhancedRung({ rung, index, tagValues, onTagClick, onUpdateInstruction, energized, selected, onSelect, active, isMobile, C, isDark }) {
  const [editInst, setEditInst] = useState(null);

  const handleSave = (updated) => {
    onUpdateInstruction(updated.id, updated);
    setEditInst(null);
  };

  const S = {
    rung: {
      display: "flex", alignItems: "center", marginBottom: 12,
      background: selected ? `${COLOR_ACTIVE}10` : "transparent",
      border: `1px solid ${selected ? COLOR_ACTIVE : (isDark ? "#222" : "#e5e7eb")}`,
      borderRadius: 14, padding: isMobile ? "10px 10px" : "14px 20px",
      cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
      position: "relative"
    },
    rungNum: { fontSize: 10, fontWeight: 900, color: C.textMuted, minWidth: 28, fontFamily: "monospace" },
    rail: { flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 },
    wire: { height: 2, flex: 1, minWidth: 16, background: energized ? COLOR_ACTIVE : (isDark ? "#333" : "#d1d5db"), transition: "background 0.12s" },
    powerLeft: { width: 4, height: 40, borderRadius: 2, background: energized ? COLOR_ACTIVE : (isDark ? "#444" : "#94a3b8"), marginRight: 8, transition: "background 0.12s" },
    powerRight: { width: 4, height: 40, borderRadius: 2, background: energized ? COLOR_ACTIVE : (isDark ? "#444" : "#94a3b8"), marginLeft: 8, transition: "background 0.12s" },
    activePulse: {
      position: "absolute", inset: 0, borderRadius: 14, pointerEvents: "none",
      border: `2px solid ${COLOR_ACTIVE}`,
      opacity: active ? 0.6 : 0,
      transition: "opacity 0.1s"
    }
  };

  const contacts = rung.instructions.filter(i => i.type === "contact" || i.type === "compare");
  const outputs = rung.instructions.filter(i => i.type === "coil" || i.type === "timer" || i.type === "counter" || i.type === "move" || i.type === "math");

  return (
    <>
      {editInst && (
        <EditModal
          instruction={editInst}
          onSave={handleSave}
          onClose={() => setEditInst(null)}
          C={C}
          isDark={isDark}
        />
      )}
      <div style={S.rung} onClick={onSelect}>
        <div style={S.activePulse} />
        <div style={S.rungNum}>{index + 1}</div>
        <div style={S.powerLeft} />
        <div style={S.rail}>
          {contacts.map((inst, i) => (
            <div key={inst.id || i} style={{ display: "flex", alignItems: "center" }}>
              <InstructionBox
                inst={inst}
                tagValues={tagValues}
                energized={energized}
                isActive={active}
                onTagClick={onTagClick}
                onEdit={setEditInst}
                isMobile={isMobile}
                C={C}
                isDark={isDark}
              />
              {i < contacts.length - 1 && <div style={S.wire} />}
            </div>
          ))}
          <div style={{ ...S.wire, flex: 2 }} />
          {outputs.map((inst, i) => (
            <div key={inst.id || i} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <div style={S.wire} />}
              <InstructionBox
                inst={inst}
                tagValues={tagValues}
                energized={energized}
                isActive={active}
                onTagClick={onTagClick}
                onEdit={setEditInst}
                isMobile={isMobile}
                C={C}
                isDark={isDark}
              />
            </div>
          ))}
        </div>
        <div style={S.powerRight} />
      </div>
    </>
  );
}

// ── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function LadderDiagram({ project }) {
  const { C, isDark } = useTheme();
  const { setProject } = useStore();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const isMobile = windowWidth < 1024;
  const isSmallMobile = windowWidth < 600;

  const SCAN_MS = 20; // Physical tick: 20ms real time

  const [simTime, setSimTime] = useState(0);
  const [activeTab, setActiveTab] = useState("diagram");
  const [rungs, setRungs] = useState([]);
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
  const simTimeRef = useRef(0);

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
    setRunning(false);
    setActiveRungIdx(-1);
    setSimTime(0);
    simTimeRef.current = 0;
    setScanCount(0);
  }, [project?.project_id]);

  // ── EVALUATE ONE SCAN CYCLE (dt = logical ms this scan covers) ──
  const evaluateLadder = useCallback((prevTags, dt) => {
    const next = { ...prevTags };

    (rungs || []).forEach(rung => {
      const contacts = rung.instructions.filter(i => i.type === "contact");
      const compares = rung.instructions.filter(i => i.type === "compare");
      const coils = rung.instructions.filter(i => i.type === "coil");
      const timers = rung.instructions.filter(i => i.type === "timer");
      const counters = rung.instructions.filter(i => i.type === "counter");
      const moves = rung.instructions.filter(i => i.type === "move");
      const maths = rung.instructions.filter(i => i.type === "math");

      const energized =
        (contacts.length === 0 || contacts.every(i => i.mode === "NC" ? !next[i.tag] : !!next[i.tag])) &&
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
          next[accTag] = Math.min(Number(i.preset), (next[accTag] || 0) + dt);
          next[doneTag] = next[accTag] >= Number(i.preset);
        } else if (i.subtype === "TON") {
          next[accTag] = 0; next[doneTag] = false;
        }
      });

      counters.forEach(i => {
        const accTag = `${i.tag}.ACC`;
        const pulseTag = `${i.tag}_pulse`;
        const doneTag = `${i.tag}_done`;
        if (energized && !prevTags[pulseTag]) {
          next[accTag] = (next[accTag] || 0) + 1;
          next[pulseTag] = true;
        } else if (!energized) {
          next[pulseTag] = false;
        }
        next[doneTag] = next[accTag] >= Number(i.preset);
      });

      if (energized) {
        moves.forEach(i => { next[i.destination] = Number(next[i.source] ?? i.source); });
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
  }, [rungs]);

  // ── SIMULATION LOOP ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Physical tick is always 20ms real time.
    // simSpeed multiplies the logical time step:
    //   1x → each tick = 20ms logical
    //   5x → each tick = 100ms logical (5 logic scans per tick)
    //  10x → each tick = 200ms logical (10 logic scans per tick)
    const LOGICAL_DT = SCAN_MS; // ms per logical scan
    const scansPerTick = simSpeed; // how many logic scans happen in one real tick

    intervalRef.current = setInterval(() => {
      setTagValues(prev => {
        let current = { ...prev };

        for (let s = 0; s < scansPerTick; s++) {
          simTimeRef.current += LOGICAL_DT;
          const t = simTimeRef.current;

          // AUTO STIMULUS: correct cycle-based pattern
          if (mode === "auto") {
            Object.keys(current).forEach(tag => {
              const tagLow = tag.toLowerCase();
              if (tagLow.includes("start") || tagLow.includes("pb_1")) {
                // Pulse for 600ms every 5 seconds
                current[tag] = (t % 5000) < 600;
              }
              if (tagLow.includes("stop") || tagLow.includes("pb_2")) {
                current[tag] = (t % 8000) < 400;
              }
              if (tagLow.includes("sensor") || tagLow.includes("limit") || tagLow.includes("prox")) {
                current[tag] = (t % 3000) < 1500;
              }
              if (tagLow.includes("reset") || tagLow.includes("rst")) {
                current[tag] = (t % 10000) < 300;
              }
            });
          }

          current = evaluateLadder(current, LOGICAL_DT);
        }

        return current;
      });

      // Step rung highlight — cycles through all rungs in order
      setActiveRungIdx(idx => rungs.length > 0 ? (idx + 1) % rungs.length : -1);
      setScanCount(sc => sc + scansPerTick);
      setSimTime(simTimeRef.current);
    }, SCAN_MS);

    return () => clearInterval(intervalRef.current);
  }, [running, mode, simSpeed, rungs.length, evaluateLadder]);

  const handleUpdateInstruction = (instId, updates) => {
    const updated = (rungs || []).map(r => ({
      ...r,
      instructions: r.instructions.map(i => i.id === instId ? { ...i, ...updates } : i)
    }));
    setRungs(updated);
    setProject({ ...project, plc_logic: { ...project.plc_logic, rungs: updated } });
    // Rebuild tag meta in case tag names changed
    tagMeta.current = buildTagMeta(updated);
  };

  const explainAll = async () => {
    setAiLoading(true);
    try {
      const res = await explainRungs({ rungs });
      const data = res.data?.explanations || [];
      const map = {};
      (rungs || []).forEach((r, i) => map[r.rung_id] = data[i] || "...");
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

  // Format logical sim time as mm:ss.ms
  const formatTime = (ms) => {
    const m = Math.floor(ms / 60000).toString().padStart(2, "0");
    const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, "0");
    const ms3 = Math.floor((ms % 1000) / 10).toString().padStart(2, "0");
    return `${m}:${s}.${ms3}`;
  };

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
          {!isSmallMobile && (
            <>
              <div style={S.chip}>SCAN: {scanCount}</div>
              <div style={{ ...S.chip, background: `${COLOR_ACTIVE}10` }}>T: {formatTime(simTime)}</div>
            </>
          )}
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
        {/* ── TAG SIDEBAR ── */}
        {(activeTab === "tags" || !isMobile) && (
          <div style={S.sidebar}>
            <div style={S.panelTitle}>STATUS MONITOR</div>
            <div style={S.tagList}>
              {Object.entries(tagValues)
                .filter(([k]) => !k.includes("_pulse"))
                .map(([tag, val]) => {
                  const isAcc = tag.includes(".ACC");
                  const isDone = tag.includes("_done");
                  // find the base timer tag for ACC entries
                  const baseTag = isAcc ? tag.replace(".ACC", "") : null;
                  const preset = baseTag ? (() => {
                    for (const rung of rungs) {
                      for (const inst of rung.instructions) {
                        if ((inst.type === "timer" || inst.type === "counter") && inst.tag === baseTag) return Number(inst.preset);
                      }
                    }
                    return null;
                  })() : null;

                  return (
                    <div key={tag} style={S.tagRow}>
                      <span style={{ ...S.tagName, color: isAcc ? COLOR_ACTIVE : isDone ? "#22c55e" : C.textPrimary }}>
                        {tag}{isAcc && preset !== null ? ` /${preset}` : ""}
                      </span>
                      {typeof val === "boolean" ? (
                        <button
                          onClick={() => setTagValues(p => ({ ...p, [tag]: !val }))}
                          style={{ ...S.statusBtn, background: val ? COLOR_ACTIVE : (isDark ? "#262626" : "#e2e8f0"), color: val ? "#fff" : (isDark ? "#555" : "#94a3b8") }}
                        >
                          {val ? "ON" : "OFF"}
                        </button>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                          {isAcc && preset !== null && (
                            <div style={{ width: 60, height: 4, borderRadius: 2, background: isDark ? "#333" : "#e5e7eb", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${Math.min(100, (val / preset) * 100)}%`, background: COLOR_ACTIVE, borderRadius: 2, transition: "width 0.1s" }} />
                            </div>
                          )}
                          <input
                            type="number"
                            value={Math.round(val)}
                            onChange={e => setTagValues(p => ({ ...p, [tag]: Number(e.target.value) }))}
                            style={S.tagInput}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ── LADDER CANVAS ── */}
        {(activeTab === "diagram" || !isMobile) && (
          <div style={S.canvas}>
            <div style={S.rungContainer}>
              <div style={{ display: "inline-flex", flexDirection: "column", minWidth: "100%", paddingBottom: 20 }}>
                {(rungs || []).map((rung, idx) => {
                  const contacts = rung.instructions.filter(i => i.type === "contact");
                  const compares = rung.instructions.filter(i => i.type === "compare");
                  const rungEnergized =
                    (contacts.length === 0 || contacts.every(i => i.mode === "NC" ? !tagValues[i.tag] : !!tagValues[i.tag])) &&
                    (compares.length === 0 || compares.every(i => {
                      const v = Number(tagValues[i.tag] ?? 0), t = Number(i.value ?? 0);
                      const op = i.operator;
                      if (op === "LES") return v < t; if (op === "GRT") return v > t;
                      if (op === "EQ" || op === "EQU") return v === t; if (op === "NEQ") return v !== t;
                      if (op === "LEQ") return v <= t; if (op === "GEQ") return v >= t;
                      return true;
                    }));

                  return (
                    <EnhancedRung
                      key={rung.rung_id || idx}
                      rung={rung}
                      index={idx}
                      tagValues={tagValues}
                      tagMeta={tagMeta.current}
                      onTagClick={t => setTagValues(p => ({ ...p, [t]: !p[t] }))}
                      onUpdateInstruction={handleUpdateInstruction}
                      energized={rungEnergized}
                      selected={selectedRungId === rung.rung_id}
                      onSelect={() => explainSingleRung(rung)}
                      active={running && activeRungIdx === idx}
                      isMobile={isMobile}
                      C={C}
                      isDark={isDark}
                    />
                  );
                })}
              </div>
              <div style={{ height: 200 }} />
            </div>
          </div>
        )}

        {/* ── AI EXPLAIN PANEL ── */}
        {(activeTab === "explain" || !isMobile) && (
          <div style={S.aiPanel}>
            <div style={S.panelTitle}>LOGIC AI ANALYSIS</div>
            <button onClick={explainAll} disabled={aiLoading} style={S.aiActionBtn}>
              {aiLoading ? "ANALYZING..." : "RE-EXPLAIN ALL"}
            </button>
            <div style={S.aiScroll}>
              {(rungs || []).map((rung, idx) => (
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
    runBtn: { padding: "8px 24px", border: "none", borderRadius: 10, color: "#fff", fontWeight: 900, cursor: "pointer", fontSize: 11, letterSpacing: "0.05em" },
    modeGroup: { display: "flex", background: C.bgInput, borderRadius: 10, padding: 3, border: `1px solid ${C.borderDefault}` },
    modeBtn: { padding: "6px 14px", border: "none", background: "none", color: C.textMuted, fontSize: 10, fontWeight: 800, cursor: "pointer" },
    modeActive: { padding: "6px 14px", border: "none", background: isDark ? "#262626" : "#ffffff", color: COLOR_ACTIVE, borderRadius: 8, fontSize: 10, fontWeight: 900, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    stats: { display: "flex", alignItems: "center", gap: 15 },
    chip: { background: `${COLOR_ACTIVE}15`, color: COLOR_ACTIVE, padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 900 },
    main: { flex: 1, display: "flex", overflow: "hidden", flexDirection: isMobile ? "column" : "row" },
    tabBar: { display: "flex", background: C.bgCard, borderBottom: `1px solid ${C.borderDefault}`, padding: "0 10px" },
    tab: { flex: 1, padding: 14, border: "none", background: "none", color: C.textMuted, fontSize: 11, fontWeight: 900, borderBottom: "3px solid transparent" },
    tabActive: { flex: 1, padding: 14, border: "none", background: "transparent", color: COLOR_ACTIVE, fontSize: 11, fontWeight: 900, borderBottom: `3px solid ${COLOR_ACTIVE}` },
    sidebar: { width: isMobile ? "100%" : 260, borderRight: isMobile ? "none" : `1px solid ${C.borderDefault}`, padding: "20px 15px", overflow: "hidden", display: "flex", flexDirection: "column", background: C.bgCard, height: "100%" },
    tagList: { flex: 1, overflowY: "auto", paddingRight: 5 },
    panelTitle: { color: C.textMuted, fontSize: 10, fontWeight: 900, marginBottom: 20, letterSpacing: "0.15em", textTransform: "uppercase" },
    tagRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "10px 14px", background: C.bgInput, borderRadius: 12, border: `1px solid ${C.borderDefault}` },
    tagName: { fontSize: 11, color: C.textPrimary, fontWeight: 700, fontFamily: "monospace" },
    statusBtn: { border: "none", borderRadius: 8, width: 48, height: 28, fontSize: 9, fontWeight: 900, cursor: "pointer", transition: "0.2s" },
    tagInput: { width: 60, background: "transparent", border: "none", color: COLOR_ACTIVE, fontSize: 12, fontWeight: 800, textAlign: "right", borderBottom: `1.5px solid ${C.borderDefault}`, outline: "none" },
    canvas: { flex: 1, overflow: "hidden", background: C.bgPage, position: "relative", display: "flex", flexDirection: "column" },
    rungContainer: { flex: 1, overflowY: "auto", overflowX: "auto", padding: isMobile ? "15px" : "40px" },
    aiPanel: { width: isMobile ? "100%" : 320, borderLeft: isMobile ? "none" : `1px solid ${C.borderDefault}`, padding: 20, display: "flex", flexDirection: "column", background: C.bgCard, height: "100%" },
    aiActionBtn: { width: "100%", padding: 12, border: `1.5px solid ${COLOR_ACTIVE}`, background: "none", color: COLOR_ACTIVE, fontSize: 10, fontWeight: 900, borderRadius: 10, cursor: "pointer", marginBottom: 20, transition: "0.2s" },
    aiScroll: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
    aiCard: { padding: 16, background: C.bgInput, borderRadius: 14, border: `1px solid ${C.borderDefault}` },
    aiRungNum: { fontSize: 9, fontWeight: 900, color: C.textMuted, marginBottom: 10 },
    aiText: { fontSize: 12, color: C.textSecondary, lineHeight: 1.7, margin: 0 }
  };
}