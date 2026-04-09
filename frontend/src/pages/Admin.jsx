import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import LadderDiagram from "../components/LadderDiagram";
import { getUsers, getProjects, deleteUser } from "../api/client";
import useStore from "../store/useStore";
import { useTheme } from "../hooks/useTheme";

export default function Admin() {
  const { C } = useTheme();
  const S = makeStyles(C);

  const { user } = useStore();
  const nav = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tab, setTab] = useState("users");

  const fetchUsers = () => {
    if (user?.role !== "admin") return;
    getUsers().then(r => setUsers(r.data)).catch(e => console.error("Admin fetch failed", e));
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      nav("/dashboard");
    } else {
      fetchUsers();
    }
  }, [user, nav]);

  const loadProjects = async (u) => {
    setSelectedUser(u);
    setSelectedProject(null);

    const r = await getProjects(u._id);
    setProjects(r.data.projects || []);
    setTab("projects");
  };

  const handleDeleteUser = async (u) => {
    if (u.role === "admin") return alert("Admins cannot be deleted.");
    if (!window.confirm(`Are you sure you want to delete ${u.name}?`)) return;

    try {
      await deleteUser(u._id);
      fetchUsers();
      if (selectedUser?._id === u._id) {
        setSelectedUser(null);
        setProjects([]);
      }
    } catch (e) {
      alert("Delete failed.");
    }
  };

  return (
    <div style={S.root}>
      <Navbar />

      <div style={S.container}>
        <h1 style={S.title}>Admin Panel</h1>

        {/* Stats */}
        <div style={S.statsGrid}>
          {[
            { label: "Total Users", val: users.length },
            { label: "Admins", val: users.filter(u => u.role === "admin").length },
            { label: "Viewing", val: selectedUser?.name || "—" },
            { label: "Projects", val: projects.length },
          ].map(s => (
            <div key={s.label} style={S.card}>
              <p style={S.statLabel}>{s.label}</p>
              <p style={S.statValue}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          {["users","projects","diagram"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={tab === t ? S.tabActive : S.tab}
            >
              {t}
            </button>
          ))}
        </div>

        {/* USERS */}
        {tab === "users" && (
          <div style={S.card}>
            <h2 style={S.sectionTitle}>All Users</h2>

            <table style={S.table}>
              <thead>
                <tr>
                  {["Name","Email","Role","Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={S.tr}>
                    <td style={S.td}>{u.name}</td>
                    <td style={S.tdSmall}>{u.email}</td>

                    <td style={S.td}>
                      <span style={
                        u.role === "admin"
                          ? S.adminBadge
                          : S.userBadge
                      }>
                        {u.role}
                      </span>
                    </td>

                    <td style={S.td}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button
                          onClick={() => loadProjects(u)}
                          style={S.linkBtn}
                        >
                          View
                        </button>
                        {u.role !== "admin" && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            style={S.delBtn}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PROJECTS */}
        {tab === "projects" && (
          <div style={S.card}>
            <h2 style={S.sectionTitle}>
              Projects {selectedUser ? `— ${selectedUser.name}` : ""}
            </h2>

            <div style={S.projectGrid}>
              {projects.map(p => (
                <button
                  key={p._id}
                  onClick={() => {
                    setSelectedProject(p);
                    setTab("diagram");
                  }}
                  style={S.projectItem}
                >
                  <p style={S.projectName}>{p.project_name}</p>
                  <p style={S.projectPrompt}>{p.prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DIAGRAM */}
        {tab === "diagram" && (
          <div style={S.card}>
            {selectedProject ? (
              <>
                <h2 style={S.sectionTitle}>
                  {selectedProject.project_name}
                </h2>

                <p style={S.projectPrompt}>
                  {selectedProject.prompt}
                </p>

                <LadderDiagram
                  project={{
                    plc_logic: selectedProject.plc_logic,
                    warnings: selectedProject.warnings,
                  }}
                />
              </>
            ) : (
              <p style={S.emptyText}>
                Select a project first
              </p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────
function makeStyles(C) {
  return {
    root: {
      minHeight: "100vh",
      background: C.bgPage,
      color: C.textPrimary,
    },

    container: {
      maxWidth: 1100,
      margin: "0 auto",
      padding: 20,
    },

    title: {
      fontSize: 26,
      fontWeight: 700,
      marginBottom: 20,
    },

    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
      gap: 10,
      marginBottom: 20,
    },

    card: {
      background: C.bgCard,
      border: `1px solid ${C.borderCard}`,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
    },

    statLabel: {
      fontSize: 12,
      color: C.textSecondary,
    },

    statValue: {
      fontSize: 20,
      fontWeight: 700,
      color: C.brandPrimary,
    },

    tabs: {
      display: "flex",
      gap: 6,
      marginBottom: 15,
    },

    tab: {
      padding: "6px 12px",
      background: C.bgInput,
      border: `1px solid ${C.borderDefault}`,
      borderRadius: 8,
      cursor: "pointer",
      color: C.textSecondary,
    },

    tabActive: {
      padding: "6px 12px",
      background: C.brandPrimary,
      color: C.textOnBrand,
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: 600,
      marginBottom: 10,
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
    },

    th: {
      textAlign: "left",
      padding: 8,
      fontSize: 12,
      color: C.textSecondary,
    },

    td: {
      padding: 8,
      borderTop: `1px solid ${C.borderDefault}`,
    },

    tdSmall: {
      padding: 8,
      fontSize: 12,
      color: C.textMuted,
      borderTop: `1px solid ${C.borderDefault}`,
    },

    tr: {},

    adminBadge: {
      background: C.brandPrimary,
      color: C.textOnBrand,
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: 12,
    },

    userBadge: {
      background: C.bgInput,
      color: C.textSecondary,
      padding: "2px 8px",
      borderRadius: 6,
      fontSize: 12,
    },

    linkBtn: {
      background: "none",
      border: "none",
      color: C.brandPrimary,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
    },
    delBtn: {
      background: "none",
      border: "none",
      color: C.errorColor,
      cursor: "pointer",
      fontSize: 12,
      fontWeight: 600,
      padding: "4px 8px",
      borderRadius: 6,
      transition: "background 0.2s",
      ":hover": {
        background: `${C.errorColor}11`,
      }
    },

    projectGrid: {
      display: "grid",
      gap: 10,
    },

    projectItem: {
      padding: 12,
      border: `1px solid ${C.borderDefault}`,
      borderRadius: 10,
      background: C.bgCard,
      cursor: "pointer",
      textAlign: "left",
    },

    projectName: {
      fontWeight: 600,
      color: C.textPrimary,
    },

    projectPrompt: {
      fontSize: 12,
      color: C.textMuted,
    },

    emptyText: {
      color: C.textSecondary,
    },
  };
}