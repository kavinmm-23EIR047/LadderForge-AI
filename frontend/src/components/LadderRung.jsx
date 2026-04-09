import { useState, useEffect, useRef } from "react";
import { useTheme } from "../hooks/useTheme";

// ── CUSTOM INDUSTRIAL PALETTE (RESPONSIVE THEME) ──────────────────────────────
const COLOR_ACTIVE = "#f97316"; // Vibrant Orange
const GLOW_ACTIVE = "0 0 20px rgba(249, 115, 22, 0.6)";

// ── DIMENSIONS ──────────────────────────────────────────────────────────────
const RUNG_HEIGHT = 160;
const WIRE_THICKNESS = 3;

/** Base Component for 'Joined Wire' look */
const InstructionWrapper = ({ children, active, tag, label, width = 60, height = 40, isOutput = false, isDark, onClick }) => {
  const colorInactive = isDark ? "#404040" : "#cbd5e1"; 
  const color = active ? COLOR_ACTIVE : colorInactive;
  const glow = active ? GLOW_ACTIVE : "none";
  const textColor = active ? COLOR_ACTIVE : (isDark ? "#737373" : "#64748b");
  const bgColor = isDark ? "#0c0a09" : "#ffffff"; 

  return (
    <div 
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      style={{ 
        position: "relative", 
        width, 
        height: RUNG_HEIGHT - 60, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexShrink: 0,
        cursor: onClick ? "pointer" : "default"
      }}
    >
      {/* Tag Label */}
      <div style={{
        position: "absolute",
        bottom: "85%",
        fontSize: 10,
        fontWeight: 900,
        color: textColor,
        whiteSpace: "nowrap",
        fontFamily: "'JetBrains Mono', monospace",
        textAlign: "center",
        background: active ? `${COLOR_ACTIVE}15` : 'transparent',
        padding: '2px 4px',
        borderRadius: 4,
        display: "flex",
        alignItems: "center",
        gap: 4
      }}>
        <input 
          value={tag} 
          onChange={(e) => onClick?.(e.target.value)} 
          placeholder="TAG"
          style={{
            background: "none",
            border: "none",
            borderBottom: active ? `1px solid ${COLOR_ACTIVE}` : "1px solid transparent",
            color: "inherit",
            fontSize: "inherit",
            fontWeight: "inherit",
            fontFamily: "inherit",
            textAlign: "center",
            width: Math.max(40, tag.length * 7),
            outline: "none",
            padding: 0
          }}
        />
      </div>

      {/* Main Connection Wire */}
      <div style={{ position: "absolute", width: "100%", height: WIRE_THICKNESS, background: color, boxShadow: glow, zIndex: 1, transition: 'all 0.1s' }} />

      {/* Symbol Component */}
      <div style={{ 
        position: "relative", 
        zIndex: 2, 
        background: bgColor,
        animation: active ? "symbolPulse 0.5s infinite alternate ease-in-out" : "none"
      }}>
        {children}
      </div>
      
      <style>{`
        @keyframes symbolPulse {
          from { transform: scale(1); }
          to { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
};

/** BOX style for Timers, Counters, Math, etc. */
const PLCBox = ({ title, active, children, width = 100, isDark }) => {
  const colorInactive = isDark ? "#404040" : "#cbd5e1";
  const color = active ? COLOR_ACTIVE : colorInactive;
  const glow = active ? GLOW_ACTIVE : "none";
  const bgColor = isDark ? "#0c0a09" : "#ffffff";

  return (
    <div style={{ 
      width, 
      border: `2.5px solid ${color}`, 
      background: bgColor, 
      borderRadius: 4, 
      padding: "6px 8px",
      display: "flex",
      flexDirection: "column",
      gap: 5,
      boxShadow: glow,
      transition: 'border-color 0.2s'
    }}>
      <div style={{ fontSize: 10, fontWeight: 900, color, textAlign: "center", borderBottom: `1px solid ${color}44`, paddingBottom: 2 }}>{title}</div>
      {children}
    </div>
  );
};

/** Editable Attribute Value */
const Attribute = ({ label, value, onChange, active, type = "number", isDark }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
    <span style={{ fontSize: 9, fontWeight: 800, color: active ? COLOR_ACTIVE : (isDark ? "#555" : "#64748b") }}>{label}:</span>
    <input 
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 55,
        background: active ? `${COLOR_ACTIVE}10` : 'transparent',
        border: "none",
        borderBottom: `1px solid ${active ? COLOR_ACTIVE : (isDark ? "#333" : "#cbd5e1")}`,
        color: active ? (isDark ? "#fff" : "#000") : (isDark ? "#888" : "#64748b"),
        fontSize: 10,
        fontWeight: 700,
        textAlign: "right",
        outline: "none",
        fontFamily: "monospace",
        padding: '2px 0'
      }}
    />
  </div>
);

export default function LadderRung({
  rung,
  index,
  tagValues,
  tagMeta,
  onTagClick,
  onUpdateInstruction,
  energized,
  active,
  selected,
  onSelect,
  isMobile
}) {
  const { C, isDark } = useTheme();

  const inputs = rung.instructions.filter(i => ["contact", "compare"].includes(i.type));
  const outputs = rung.instructions.filter(i => ["coil", "timer", "counter", "move", "math"].includes(i.type));
  const getLabel = (tag) => tagMeta?.[tag]?.label || "";

  const isInstActive = (inst) => {
    if (inst.type === "contact") {
      const val = tagValues[inst.tag] ?? false;
      return inst.mode === "NC" ? !val : !!val;
    }
    if (inst.type === "compare") {
      const val = Number(tagValues[inst.tag] ?? 0);
      const target = Number(inst.value ?? 0);
      const op = inst.operator;
      if (op === "LES") return val < target;
      if (op === "GRT") return val > target;
      if (op === "EQ" || op === "EQU") return val === target;
      if (op === "LEQ") return val <= target;
      if (op === "GEQ") return val >= target;
      if (op === "NEQ") return val !== target;
    }
    return false;
  };

  const bgColor = isDark ? "#0c0a09" : "#ffffff";
  const colorInactive = isDark ? "#404040" : "#cbd5e1";
  const lc = energized ? COLOR_ACTIVE : colorInactive;
  const glow = energized ? GLOW_ACTIVE : "none";

  return (
    <div 
      onClick={onSelect}
      style={{
        background: bgColor,
        minHeight: RUNG_HEIGHT,
        width: "100%",
        position: "relative",
        borderLeft: selected ? `6px solid ${COLOR_ACTIVE}` : "6px solid transparent",
        borderBottom: `2px solid ${isDark ? "#1c1917" : "#f1f5f9"}`,
        display: "flex",
        alignItems: "center",
        transition: "all 0.2s ease",
        cursor: 'pointer'
      }}
    >
      {/* Rung Number Highlight Box */}
      <div style={{ width: 35, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRight: `2px solid ${isDark ? "#1c1917" : "#f1f5f9"}`, flexShrink: 0 }}>
        <div style={{ 
          background: selected || active ? COLOR_ACTIVE : (isDark ? "#262626" : "#e2e8f0"), 
          color: selected || active ? "#fff" : (isDark ? "#888" : "#64748b"), 
          width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", 
          borderRadius: "4px", fontSize: 10, fontWeight: 900, boxShadow: selected || active ? GLOW_ACTIVE : "none",
          transition: "all 0.2s"
        }}>
          {index + 1}
        </div>
      </div>

      <div style={{ flex: 1, position: "relative", height: "100%", padding: "0 60px", display: "flex", alignItems: "center" }}>
        {/* The Rung Rail Wire */}
        <div style={{ position: "absolute", left: 0, right: 0, height: WIRE_THICKNESS, background: lc, boxShadow: glow, zIndex: 1 }} />
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: RAIL_W, background: isDark ? "#292524" : "#e2e8f0" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: RAIL_W, background: isDark ? "#292524" : "#e2e8f0" }} />

        <div style={{ zIndex: 2, display: "flex", width: "100%", alignItems: "center" }}>
          
          <div style={{ display: "flex", gap: 20 }}>
            {inputs.map((inst, idx) => {
              const active = isInstActive(inst);
              const color = active ? COLOR_ACTIVE : colorInactive;
              if (inst.type === "contact") {
                return (
                  <InstructionWrapper key={idx} active={active} tag={inst.tag} label={getLabel(inst.tag)} isDark={isDark} onClick={(newTag) => onUpdateInstruction(inst.id, { tag: newTag })}>
                    <div 
                      onClick={(e) => { e.stopPropagation(); onUpdateInstruction(inst.id, { mode: inst.mode === "NO" ? "NC" : "NO" }); }}
                      style={{ position: "relative", width: 22, height: 40, background: bgColor, display: "flex", justifyContent: "space-between", padding: '0 2px', cursor: "pointer" }}
                    >
                      <div style={{ width: 5, height: "100%", background: color, borderRadius: 1 }} />
                      {inst.mode === "NC" && <div style={{ position: "absolute", width: 5, height: "135%", background: color, top: "-17%", left: "40%", transform: "rotate(-35deg)", borderRadius: 1 }} />}
                      <div style={{ width: 5, height: "100%", background: color, borderRadius: 1 }} />
                    </div>
                  </InstructionWrapper>
                );
              }
              if (inst.type === "compare") {
                return (
                  <InstructionWrapper key={idx} active={active} tag={inst.tag} label={getLabel(inst.tag)} width={100} isDark={isDark} onClick={() => onTagClick(inst.tag)}>
                    <PLCBox title={inst.operator || "CMP"} active={active} width={90} isDark={isDark}>
                      <Attribute label="REF" value={inst.value} onChange={(v) => onUpdateInstruction(inst.id, { value: v })} active={active} isDark={isDark} />
                      <div style={{ fontSize: 9, fontWeight: 900, color: active ? COLOR_ACTIVE : (isDark ? "#555" : "#94a3b8"), textAlign: "center" }}>V: {tagValues[inst.tag] ?? 0}</div>
                    </PLCBox>
                  </InstructionWrapper>
                );
              }
            })}
          </div>

          <div style={{ flex: 1, minWidth: 60 }} />

          <div style={{ display: "flex", gap: 20 }}>
            {outputs.map((inst, idx) => {
              if (inst.type === "coil") {
                return (
                  <InstructionWrapper key={idx} active={energized} tag={inst.tag} label={getLabel(inst.tag)} isOutput isDark={isDark}>
                    <div style={{ width: 38, height: 38, border: `4px solid ${lc}`, borderRadius: "50%", background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       {inst.mode === "OTL" && <span style={{ fontSize: 14, fontWeight:900, color: lc }}>L</span>}
                       {inst.mode === "OTU" && <span style={{ fontSize: 14, fontWeight:900, color: lc }}>U</span>}
                    </div>
                  </InstructionWrapper>
                );
              }
              if (inst.type === "timer" || inst.type === "counter") {
                return (
                  <InstructionWrapper key={idx} active={energized} tag={inst.tag} label={getLabel(inst.tag)} width={120} isOutput isDark={isDark} onClick={(newTag) => onUpdateInstruction(inst.id, { tag: newTag })}>
                    <PLCBox title={inst.subtype || (inst.type === "timer" ? "TON" : "CTU")} active={energized} width={110} isDark={isDark}>
                      <Attribute label="PRE" value={inst.preset} onChange={(v) => onUpdateInstruction(inst.id, { preset: v })} active={energized} isDark={isDark} />
                      <div style={{ 
                        fontSize: 9, 
                        fontWeight: 900, 
                        color: energized ? COLOR_ACTIVE : (isDark ? "#555" : "#94a3b8"), 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        animation: energized ? "accPulse 1s infinite" : "none"
                      }}>
                         <span>ACC:</span>
                         <span style={{ color: energized ? COLOR_ACTIVE : inherit }}>{Math.round(tagValues[`${inst.tag}.ACC`] || 0)}</span>
                      </div>
                      <style>{`
                        @keyframes accPulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
                      `}</style>
                    </PLCBox>
                  </InstructionWrapper>
                );
              }
              if (inst.type === "move" || inst.type === "math") {
                return (
                  <InstructionWrapper key={idx} active={energized} tag={inst.destination} label={getLabel(inst.destination)} width={120} isOutput isDark={isDark}>
                    <PLCBox title={inst.operator || "MOV"} active={energized} width={110} isDark={isDark}>
                      <Attribute label="SRC" value={inst.source || inst.source_a} onChange={(v) => onUpdateInstruction(inst.id, inst.source ? { source: v } : { source_a: v })} active={energized} type="text" isDark={isDark} />
                      {inst.source_b && <Attribute label="S-B" value={inst.source_b} onChange={(v) => onUpdateInstruction(inst.id, { source_b: v })} active={energized} isDark={isDark} />}
                      <div style={{ fontSize: 9, fontWeight: 900, color: energized ? COLOR_ACTIVE : (isDark ? "#555" : "#94a3b8"), textAlign: 'right' }}>D: {tagValues[inst.destination] || 0}</div>
                    </PLCBox>
                  </InstructionWrapper>
                );
              }
            })}
          </div>
        </div>
      </div>

      {active && (
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, ${COLOR_ACTIVE}1a, transparent)`, pointerEvents: "none", animation: "scanLine 2s linear infinite" }} />
      )}

      <style>{`
        @keyframes scanLine { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}

const RAIL_W = 8;
const inherit = "inherit";