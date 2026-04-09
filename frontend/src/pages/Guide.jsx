import { useState } from "react";
import { useTheme } from "../hooks/useTheme";
import Navbar from "../components/Navbar";

export default function Guide() {
  const { C, isDark } = useTheme();
  const S = makeStyles(C, isDark);

  return (
    <div style={S.root}>
      <Navbar />
      
      <main style={S.container}>
        <header style={S.header}>
          <h1 style={S.title}>Operation Guide & Documentation</h1>
          <p style={S.sub}>A complete walkthrough of the LadderForge AI technical workflow.</p>
        </header>

        <section style={S.section}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>01</div>
            <h2>Requirement Synthesis (Text to Logic)</h2>
          </div>
          <p style={S.text}>
            Enter the <strong>LadderForge AI Designer</strong> workspace via the Dashboard. Describe your industrial process 
            in natural language. Unlike generic AI, LadderForge AI is pre-trained on Siemens and Rockwell 
            instruction sets, ensuring every generated rung follows deterministic state-machine principles.
          </p>
          <div style={S.tip}>
             <strong>Pro Tip:</strong> Mention Safety Interlocks and E-Stops explicitly for automated safety rung generation.
          </div>
        </section>

        <section style={S.section}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>02</div>
            <h2>Logic Generation & Refinement</h2>
          </div>
          <p style={S.text}>
            Our engine breaks down your request into boolean logic rungs. Each rung is validated 
            to prevent race conditions (multiple coils affecting the same address). You can 
            instantly regenerate or refine specific logic segments by updating your industrial prompt.
          </p>
        </section>

        <section style={S.section}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>03</div>
            <h2>Live Simulation & AI Explanations</h2>
          </div>
          <p style={S.text}>
            Visualize your logic in real-time. The <strong>Ladder Monitor</strong> simulates an 
            800ms scan cycle.
          </p>
          <ul>
             <li style={S.li}><strong>Orange Flow:</strong> Indicates active power flow (Logic Continuity).</li>
             <li style={S.li}><strong>AI Insights:</strong> Every rung features a technical "Why?" button that explains the exact boolean condition and hardware impact of that specific logic line.</li>
          </ul>
        </section>

        <section style={S.section}>
          <div style={S.stepHeader}>
            <div style={S.stepNum}>04</div>
            <h2>Documentation & B/W Export</h2>
          </div>
          <p style={S.text}>
            Industrial compliance requires clear documentation. Use the <strong>Export PDF / Print</strong> 
            feature to generate a high-contrast black-and-white report. This report acts as a 
            standardized blueprint for hardware technicians to implement on physical PLC hardware.
          </p>
        </section>
      </main>
    </div>
  );
}

function makeStyles(C, isDark) {
  return {
    root: { background: C.bgPage, color: C.textPrimary, minHeight: "100vh" },
    container: { maxWidth: 900, margin: "0 auto", padding: "60px 24px" },
    header: { marginBottom: 60, textAlign: "center" },
    title: { fontSize: 44, fontWeight: 900, marginBottom: 16, color: C.textPrimary },
    sub: { fontSize: 18, color: C.textSecondary },
    
    section: { marginBottom: 80 },
    stepHeader: { display: "flex", alignItems: "center", gap: 20, marginBottom: 24 },
    stepNum: { 
      width: 44, height: 44, borderRadius: 12, background: C.brandPrimary, color: "#fff", 
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900 
    },
    "stepHeader h2": { fontSize: 28, fontWeight: 800, margin: 0, color: C.textPrimary },
    text: { fontSize: 17, lineHeight: 1.8, color: C.textSecondary, marginBottom: 20 },
    tip: { padding: 20, background: `${C.brandPrimary}10`, borderLeft: `4px solid ${C.brandPrimary}`, borderRadius: "0 12px 12px 0", color: C.brandPrimary, fontSize: 15 },
    li: { marginBottom: 12, fontSize: 16, color: C.textSecondary },
  };
}
