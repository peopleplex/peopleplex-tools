import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const PRIMARY = "#FF6B35";
const BG = "#F9FAFB";
const CARD = "#FFFFFF";
const BORDER = "#E5E7EB";
const MUTED = "#6B7280";
const TEXT = "#111827";
const SHADOW = "0 1px 3px 0 rgba(0,0,0,.08), 0 1px 2px 0 rgba(0,0,0,.04)";
const SHADOW_HOVER = "0 10px 25px -5px rgba(0,0,0,.1), 0 4px 10px -5px rgba(0,0,0,.06)";

function Spinner() {
    return (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", border: `4px solid ${BORDER}`, borderTop: `4px solid ${PRIMARY}`, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ color: MUTED, fontSize: 15 }}>Loading projects…</p>
        </div>
    );
}

function statusBadge(status) {
    if (status === "active") return { label: "Active", bg: "#ecfdf5", color: "#059669" };
    if (status === "draft") return { label: "Draft", bg: "#fef3c7", color: "#d97706" };
    return { label: "New", bg: "#f3f4f6", color: MUTED };
}

function toolProgress(project) {
    const tools = project.tools || {};
    const done = ["journey", "psychology", "competitor"].filter(k => tools[k] === "complete").length;
    return { done, total: 3, pct: Math.round((done / 3) * 100) };
}

export default function ProjectsDashboard({ onSelectProject, onCreateProject }) {
    const [projects, setProjects] = useState(null);
    const [hoveredId, setHoveredId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => { loadProjects(); }, []);

    async function loadProjects() {
        if (!auth.currentUser) return;
        try {
            const snap = await getDocs(collection(db, "users", auth.currentUser.uid, "projects"));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
            setProjects(list);
        } catch (e) {
            console.error("Failed to load projects", e);
            setProjects([]);
        }
    }

    async function handleDelete(e, projectId) {
        e.stopPropagation();
        if (!window.confirm("Delete this project? This cannot be undone.")) return;
        setDeletingId(projectId);
        try {
            await deleteDoc(doc(db, "users", auth.currentUser.uid, "projects", projectId));
            setProjects(prev => prev.filter(p => p.id !== projectId));
        } catch (err) {
            alert("Failed to delete project.");
        }
        setDeletingId(null);
    }

    if (projects === null) return <Spinner />;

    return (
        <div style={{ padding: "48px 32px 80px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 14, color: PRIMARY, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 400, marginBottom: 6 }}>PeoplePlex</p>
                <h1 style={{ fontSize: 22, fontWeight: 400, color: TEXT, marginBottom: 10 }}>My Projects</h1>
                <p style={{ fontSize: 15, color: MUTED }}>Select a project to open its workspace, or create a new one.</p>
            </div>

            {/* Project Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 32 }}>

                {/* Create New Card */}
                <div
                    onClick={onCreateProject}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = PRIMARY; e.currentTarget.style.boxShadow = SHADOW_HOVER; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = SHADOW; }}
                    style={{
                        background: CARD, border: `2px dashed ${BORDER}`, borderRadius: 20,
                        padding: "32px 24px", cursor: "pointer", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: 12, minHeight: 180,
                        boxShadow: SHADOW, transition: "all .2s ease",
                    }}
                >
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: `${PRIMARY}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>✚</div>
                    <div style={{ fontSize: 15, fontWeight: 400, color: TEXT }}>Create New Project</div>
                    <div style={{ fontSize: 14, color: MUTED, textAlign: "center" }}>Set up a new client or business workspace</div>
                </div>

                {/* Existing Projects */}
                {projects.map(p => {
                    const badge = statusBadge(p.status || "active");
                    const prog = toolProgress(p);
                    const isHov = hoveredId === p.id;
                    return (
                        <div
                            key={p.id}
                            onClick={() => onSelectProject(p)}
                            onMouseEnter={() => setHoveredId(p.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                                background: CARD, border: `1px solid ${isHov ? PRIMARY : BORDER}`,
                                borderRadius: 20, padding: "24px", cursor: "pointer",
                                display: "flex", flexDirection: "column", gap: 16, minHeight: 180,
                                boxShadow: isHov ? SHADOW_HOVER : SHADOW,
                                transition: "all .2s ease", position: "relative",
                                transform: isHov ? "translateY(-3px)" : "none",
                            }}
                        >
                            {/* Delete button */}
                            <button
                                onClick={e => handleDelete(e, p.id)}
                                title="Delete project"
                                style={{
                                    position: "absolute", top: 12, right: 12, width: 26, height: 26,
                                    borderRadius: 8, border: `1px solid ${BORDER}`, background: isHov ? "#fff" : "transparent",
                                    color: MUTED, fontSize: 12, cursor: "pointer", display: "flex",
                                    alignItems: "center", justifyContent: "center", opacity: isHov ? 1 : 0,
                                    transition: "opacity .2s",
                                }}
                            >
                                ✕
                            </button>

                            {/* Industry icon + name */}
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${PRIMARY}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 400, color: TEXT, marginBottom: 2 }}>{p.businessName || "Unnamed Project"}</div>
                                    <div style={{ fontSize: 14, color: MUTED }}>{p.industry || "—"}</div>
                                </div>
                            </div>

                            {/* Status badge */}
                            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, background: badge.bg, color: badge.color, fontSize: 13, fontWeight: 400 }}>
                                    {badge.label}
                                </span>
                            </div>

                            {/* Tool progress bar */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: MUTED }}>
                                    <span>{prog.done}/{prog.total} tools complete</span>
                                    <span>{prog.pct}%</span>
                                </div>
                                <div style={{ height: 5, background: BORDER, borderRadius: 999, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${prog.pct}%`, background: PRIMARY, borderRadius: 999, transition: "width .5s ease" }} />
                                </div>
                            </div>

                            {/* CTA */}
                            <div style={{ marginTop: "auto", fontSize: 14, color: isHov ? PRIMARY : MUTED, fontWeight: 400, transition: "color .2s" }}>
                                Open workspace →
                            </div>
                        </div>
                    );
                })}
            </div>

            {projects.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: MUTED, fontSize: 15 }}>
                    No projects yet. Click "Create New Project" to get started.
                </div>
            )}
        </div>
    );
}
