# ⚡ LADDERFORGE AI — End-to-End Industrial Project Report

> **Project Name**: LadderForge AI  
> **System Type**: AI-Powered Industrial PLC Ladder Logic Generator & Simulation Suite  
> **Standards Compliance**: IEC 61131-3 (Programmable Controllers — Ladder Diagram)  
> **Document Date**: August 2026  

---

## 1. Executive Summary

**LadderForge AI** is an advanced web-based industrial automation engineering tool designed to convert natural language specifications and truth tables into clean, IEC 61131-3 compliant **PLC Ladder Logic JSON**, render dynamic visual rungs, and execute a real-time **20ms PLC Scan Engine** with live tag monitoring.

This report documents the end-to-end architecture, technical implementation details, AI pipeline improvements, interlocking logic resolution, database schemas, and verification results.

---

## 2. System Architecture

```mermaid
graph TD
    User([User / Automation Engineer]) -->|Natural Language Prompt| Frontend[React + Vite Frontend]
    Frontend -->|POST /generate| FastAPI[FastAPI Backend Router]
    
    subgraph Backend Engine
        FastAPI --> PresetFilter[Logic Gate Preset Filter]
        PresetFilter -->|Complex Prompt| GroqAI[Groq Llama-3.3-70B Engine]
        PresetFilter -->|Standalone Gate| StaticJSON[IEC Standard Preset]
        GroqAI --> CleanPipeline[PLC Cleaning & Validation Pipeline]
        CleanPipeline --> FixFormat[fix_ai_format]
        FixFormat --> FixLatch[fix_latch_pairs]
        FixLatch --> FixTimer[fix_timer]
        FixTimer --> FixOrder[fix_order]
        FixOrder --> Dedupe[remove_duplicate_rungs]
        Dedupe --> Normalize[normalize_plc]
    end
    
    Backend Engine -->|Store Project| MongoDB[(MongoDB Atlas)]
    Backend Engine -->|JSON Output + Warnings| Frontend
    
    subgraph Frontend Simulation Engine
        Frontend --> RungRenderer[Ladder Diagram SVG / Canvas Components]
        Frontend --> StatusMonitor[Status Monitor & Manual Toggles]
        Frontend --> ScanLoop[20ms Top-to-Bottom PLC Scan Loop]
    end
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **State Management**: Custom Store (Zustand pattern)
- **Styling**: Modern Industrial Dark Mode CSS Design System (HSL tokens, glassmorphism, dynamic glowing rungs)
- **Icons**: Lucide React
- **API Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI LLM Engine**: Groq API (`llama-3.3-70b-versatile`)
- **Database**: MongoDB Atlas (`pymongo`)
- **Authentication**: PyJWT + OAuth2 Bearer Tokens
- **Environment**: `python-dotenv`

---

## 4. Key Engineering Modules & Logic Implementation

### 4.1 AI Prompt Engineering & Preset Filtering
* **Preset Filter ([`plc_parser.py`](file:///d:/client%20projects%20Ak%20webflair%20technologies/LadderForge%20AI/backend/app/services/plc_parser.py#L630-L790))**:
  Strictly matches standalone logic gate queries (`"and gate"`, `"xor gate"`, `"not gate"`). All multi-device industrial prompts (`motors`, `switches`, `interlocks`, `truth tables`) bypass static presets and route directly to the Groq LLM Engine.
* **System Prompt ([`ai_generator.py`](file:///d:/client%20projects%20Ak%20webflair%20technologies/LadderForge%20AI/backend/app/services/ai_generator.py#L16-L98))**:
  Instructs the LLM to preserve exact user tags (`S1`, `S2`, `M1`, `M2`, `I0.0`, `Q0.0`) and enforce multi-output interlocking logic with priority control.

### 4.2 Priority Interlocking Logic (2 Switches & 2 Motors)

To control 2 Push-Button Switches (`S1`, `S2`) and 2 Motors (`M1`, `M2`) with Priority Interlock:

$$\begin{aligned}
\text{Motor 1 } (M1) &= S1 \cdot \overline{M2} \\
\text{Motor 2 } (M2) &= S2 \cdot \overline{S1} \cdot \overline{M1}
\end{aligned}$$

#### Truth Table

| S1 (`I0.0`) | S2 (`I0.1`) | M1 (`Q0.0`) | M2 (`Q0.1`) | Operating State |
| :---: | :---: | :---: | :---: | :--- |
| **OFF** | **OFF** | **OFF** | **OFF** | System Idle $\rightarrow$ Both Motors OFF |
| **ON** | **OFF** | **ON** | **OFF** | S1 Pressed $\rightarrow$ Motor 1 ON |
| **OFF** | **ON** | **OFF** | **ON** | S2 Pressed $\rightarrow$ Motor 2 ON |
| **ON** | **ON** | **ON** | **OFF** | **Both Pressed $\rightarrow$ Motor 1 ON (Priority Active, Only 1 Motor ON)** |

#### Ladder Rung Architecture

```text
Rung 1 (Motor 1 - Priority Output):
       S1 (NO)                                          M1 (OTE)
  |------] [----------------------------------------------( )------|

Rung 2 (Motor 2 - Interlocked Output):
       S2 (NO)       S1 (NC)       M1 (NC)              M2 (OTE)
  |------] [-----------]/[-----------]/[------------------( )------|
```

---

## 5. PLC Cleaning & Validation Pipeline

When the AI returns JSON, it passes through a multi-stage validation pipeline before storage and rendering:

1. **`fix_ai_format()`**: Standardizes instruction attributes (`contact`, `coil`, `timer`, `counter`, `compare`, `move`, `math`).
2. **`remove_invalid()`**: Removes unsupported raw strings or empty types.
3. **`fix_latch_pairs()`**: Validates that every `OTL` (Output Latch) tag has a corresponding `OTU` (Output Unlatch) tag.
4. **`fix_timer()`**: Normalizes preset delays to milliseconds ($1000\text{ ms} = 1\text{s}$) and appends done-bit contacts (`_done`).
5. **`fix_order()`**: Sorts rung elements into standard execution order:
   $$\text{Contacts} \longrightarrow \text{Compares} \longrightarrow \text{Timers} \longrightarrow \text{Counters} \longrightarrow \text{Outputs (Coil/Set/Reset)}$$
6. **`remove_duplicate_rungs()`**: Eliminates duplicate logic branches.
7. **`normalize_plc()`**: Assigns clean sequential identifiers (`r1`, `r2`, `r1_i1`, `r1_i2`).

---

## 6. Frontend 20ms Simulation Engine

The simulation engine in [`LadderDiagram.jsx`](file:///d:/client%20projects%20Ak%20webflair%20technologies/LadderForge%20AI/frontend/src/components/LadderDiagram.jsx#L134-L200) executes an industrial scan loop:

- **Scan Time**: Fixed $20\text{ ms}$ interval.
- **Top-to-Bottom Scan Order**: Evaluates Rung 1, updates memory table, evaluates Rung 2.
- **NC Contact Logic**: An NC contact (`]/[`) evaluates to **TRUE (Highlighted Orange)** when the associated tag is **FALSE (0)**, and opens (**FALSE / Grey**) when the tag is **TRUE (1)**.
- **Live Status Monitor**: Interactive side-panel displaying real-time I/O bit states with instant manual toggles.

---

## 7. JSON Program Structure

Below is the standard JSON structure produced by LadderForge AI:

```json
{
  "network_id": 1,
  "rungs": [
    {
      "rung_id": "r1",
      "instructions": [
        { "id": "r1_i1", "type": "contact", "mode": "NO", "tag": "S1" },
        { "id": "r1_i2", "type": "coil", "mode": "OTE", "tag": "M1" }
      ]
    },
    {
      "rung_id": "r2",
      "instructions": [
        { "id": "r2_i1", "type": "contact", "mode": "NO", "tag": "S2" },
        { "id": "r2_i2", "type": "contact", "mode": "NC", "tag": "S1" },
        { "id": "r2_i3", "type": "contact", "mode": "NC", "tag": "M1" },
        { "id": "r2_i4", "type": "coil", "mode": "OTE", "tag": "M2" }
      ]
    }
  ]
}
```

---

## 8. Summary of Completed Improvements

| Component | Previous Issue | Applied Solution & Result |
| :--- | :--- | :--- |
| **Preset Filtering** | Loose `"not"` / `"and"` matching triggered false static presets | Refactored [`plc_parser.py`](file:///d:/client%20projects%20Ak%20webflair%20technologies/LadderForge%20AI/backend/app/services/plc_parser.py#L630-L790) to match exact gate queries only |
| **Route Processing** | Project names (e.g., `MAKE`, `AS`) triggered static gate presets | Removed `project_name` check from [`generate.py`](file:///d:/client%20projects%20Ak%20webflair%20technologies/LadderForge%20AI/backend/app/routes/generate.py#L257-L265) |
| **Interlock Logic** | Dual-NC contacts blocked both motors when both switches turned ON | Updated [`ai_generator.py`](file:///d:/client%20projects%20Ak%20webflair%20technologies/LadderForge%20AI/backend/app/services/ai_generator.py#L58-L60) system prompt for priority interlock |
| **Tag Preservation** | Generic names (`A`, `B`, `C`) substituted user tags | Strict tag preservation rules enforced in Groq system prompt |

---

## 9. Conclusion

The **LadderForge AI** system is fully implemented, verified, and operational. It bridges natural language user specifications with industrial-grade IEC 61131-3 PLC ladder diagrams, offering seamless real-time simulation, priority interlock validation, and automated PDF engineering documentation export.
