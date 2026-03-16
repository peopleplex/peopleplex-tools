import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { updateProfile, updatePassword, updateEmail } from "firebase/auth";
import { auth, db } from "./firebase";

const DARK_MODE_BACKGROUND = "#F9FAFB";
const CARD_BACKGROUND = "#FFFFFF";
const BORDER_COLOR = "#E5E7EB";
const MUTED_COLOR = "#6B7280";
const TEXT_COLOR = "#111827";
const PRIMARY_BLUE = "#FF6B35";

function scoreColor(pct) {
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#eab308";
  return "#ef4444";
}

function scoreLabel(pct) {
  if (pct >= 70) return "Strong";
  if (pct >= 40) return "Developing";
  return "Critical";
}

function Spinner({ message }) {
  return (
    <div style={{ textAlign: "center", padding: 40, color: MUTED_COLOR }}>
      <div
        className="spin"
        style={{
          width: 30,
          height: 30,
          border: `3px solid ${BORDER_COLOR}`,
          borderTopColor: PRIMARY_BLUE,
          borderRadius: "50%",
          margin: "0 auto 16px",
        }}
      />
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin { animation: spin 1s linear infinite; }`}</style>
      <div>{message || "Loading..."}</div>
    </div>
  );
}

const AUTOMATION_TOOLS = [
  {
    stage: "Awareness",
    title: "Content Creation & Distribution",
    description:
      "Automate the process of creating and distributing valuable content to attract potential customers.",
    tools: [
      {
        name: "ChatGPT/Claude",
        category: "AI Content Generation",
        use: "Generate blog posts, social media captions, video scripts based on keywords and audience pain points.",
      },
      {
        name: "Buffer/Hootsuite",
        category: "Social Media Scheduling",
        use: "Schedule posts across multiple platforms, ensuring consistent online presence without manual effort.",
      },
      {
        name: "Zapier/Make.com",
        category: "Workflow Automation",
        use: "Automatically share new blog posts to social media, or distribute content to email subscribers.",
      },
      {
        name: "Google Alerts",
        category: "Monitoring",
        use: "Track mentions of your brand, industry keywords, and competitors to inform content strategy.",
      },
    ],
  },
  {
    stage: "Appeal",
    title: "Lead Capture & Nurturing",
    description:
      "Automate the process of capturing visitor information and engaging them with relevant content to build interest.",
    tools: [
      {
        name: "Leadpages/Unbounce",
        category: "Landing Page Builders",
        use: "Create high-converting landing pages with automated lead capture forms and thank-you pages.",
      },
      {
        name: "ActiveCampaign/Mailchimp",
        category: "Email Marketing Automation",
        use: "Set up automated email sequences (welcome series, educational content) for new leads.",
      },
      {
        name: "ManyChat/Chatfuel",
        category: "Chatbot Marketing",
        use: "Deploy chatbots on your website or social media to answer FAQs, qualify leads, and collect contact info 24/7.",
      },
      {
        name: "Calendly/Acuity Scheduling",
        category: "Appointment Scheduling",
        use: "Allow prospects to book discovery calls directly, automating the scheduling process and sending reminders.",
      },
    ],
  },
  {
    stage: "Consideration",
    title: "Trust Building & Qualification",
    description:
      "Automate the display of social proof, answer common objections, and qualify leads efficiently.",
    tools: [
      {
        name: "Trustpilot/Google My Business",
        category: "Review Management",
        use: "Automate requests for reviews from satisfied customers and display them prominently.",
      },
      {
        name: "VideoAsk/Typeform",
        category: "Interactive Forms/Surveys",
        use: "Create interactive quizzes or surveys to understand customer needs and qualify their interest automatically.",
      },
      {
        name: "CRM (e.g., HubSpot, Zoho CRM)",
        category: "Lead Scoring & Management",
        use: "Automatically score leads based on their engagement and demographic data, prioritizing high-value prospects.",
      },
      {
        name: "Proof/Fomo",
        category: "Social Proof Notifications",
        use: "Display real-time notifications of recent purchases or sign-ups to build credibility and urgency.",
      },
    ],
  },
  {
    stage: "Action",
    title: "Sales & Onboarding Automation",
    description:
      "Streamline the final steps of the customer journey, from closing the sale to initial onboarding.",
    tools: [
      {
        name: "Stripe/Razorpay",
        category: "Payment Processing",
        use: "Automate invoicing, payment collection, and subscription management.",
      },
      {
        name: "DocuSign/PandaDoc",
        category: "Document Automation",
        use: "Automate contract generation, e-signatures, and document delivery for faster closing.",
      },
      {
        name: "Slack/Microsoft Teams",
        category: "Internal Communication",
        use: "Automate notifications to your sales or onboarding team when a new lead converts or a payment is made.",
      },
      {
        name: "Loom/Vidyard",
        category: "Personalized Video",
        use: "Record quick, personalized video messages for new customers to welcome them and guide them through initial steps.",
      },
    ],
  },
  {
    stage: "Advocacy",
    title: "Retention & Referral Automation",
    description:
      "Automate processes to keep customers engaged, happy, and turning them into brand advocates.",
    tools: [
      {
        name: "Intercom/Gorgias",
        category: "Customer Support & Engagement",
        use: "Automate follow-up messages, satisfaction surveys, and proactive support to improve retention.",
      },
      {
        name: "ReferralCandy/Ambassador",
        category: "Referral Programs",
        use: "Set up automated referral programs that reward existing customers for bringing in new business.",
      },
      {
        name: "SurveyMonkey/Google Forms",
        category: "Feedback Collection",
        use: "Automate sending post-purchase or post-service surveys to gather valuable feedback.",
      },
      {
        name: "LoyaltyLion/Smile.io",
        category: "Loyalty Programs",
        use: "Automate points, rewards, and exclusive offers for loyal customers to encourage repeat business.",
      },
    ],
  },
];

function AutomationRecommendations({ audit, onBack }) {
  const { stageScores } = audit;
  const weakestStage = [...stageScores].sort((a, b) => a.pct - b.pct)[0];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: MUTED_COLOR,
          fontSize: 15,
          cursor: "pointer",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        ← Back to Audit Report
      </button>

      <h2
        style={{
          fontSize: 22,
          fontWeight: 400,
          color: TEXT_COLOR,
          margin: "0 0 12px",
        }}
      >
        Automation Recommendations
      </h2>
      <p
        style={{
          color: MUTED_COLOR,
          fontSize: 15,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Based on your audit, here are some automation tools and strategies to
        boost your customer journey, especially focusing on your weakest areas.
      </p>

      {weakestStage && (
        <div
          style={{
            background: `${PRIMARY_BLUE}10`,
            border: `1px solid ${PRIMARY_BLUE}30`,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 32,
            fontSize: 15,
            color: TEXT_COLOR,
            lineHeight: 1.5,
          }}
        >
          💡 Your weakest stage is the{" "}
          <span style={{ color: PRIMARY_BLUE }}>{weakestStage.stage}</span> stage
          ({weakestStage.pct}%). Prioritizing automation here will likely yield
          the biggest impact.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {AUTOMATION_TOOLS.map((section, idx) => (
          <div key={idx}>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: TEXT_COLOR,
                marginBottom: 8,
              }}
            >
              {section.stage} Stage: {section.title}
            </h3>
            <p
              style={{
                fontSize: 15,
                color: MUTED_COLOR,
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              {section.description}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {section.tools.map((tool, toolIdx) => (
                <div
                  key={toolIdx}
                  style={{
                    background: CARD_BACKGROUND,
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{ fontSize: 15, fontWeight: 400, color: TEXT_COLOR }}
                    >
                      {tool.name}
                    </span>
                    <span
                      style={{
                        fontSize: 14,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: `${PRIMARY_BLUE}20`,
                        color: PRIMARY_BLUE,
                        fontWeight: 400,
                      }}
                    >
                      {tool.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, color: "#aaa", lineHeight: 1.5 }}>
                    <span style={{ color: TEXT_COLOR }}>Use Case:</span>{" "}
                    {tool.use}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, textAlign: "center" }}>
        <button
          onClick={onBack}
          style={{
            padding: "14px 24px",
            borderRadius: 12,
            border: `1.5px solid ${BORDER_COLOR}`,
            background: "transparent",
            color: TEXT_COLOR,
            fontSize: 15,
            fontWeight: 400,
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          ← Back to Audit Report
        </button>
      </div>
    </div>
  );
}


function UserDashboard({ onClose, onLoadAudit }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [viewingAutomations, setViewingAutomations] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    try {
      const snapshot = await getDocs(
        collection(db, "users", auth.currentUser.uid, "audits"),
      );
      const loaded = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only load finished audits that have an overall score
        if (data.overallScore) {
          loaded.push({ id: doc.id, ...data });
        }
      });
      loaded.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      setLeads(loaded);
    } catch (e) {
      console.error("Failed to fetch user audits:", e);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  async function clearAllLeads() {
    if (
      !window.confirm(
        "Are you sure you want to delete all past audits? (Coming soon - mock clear)",
      )
    )
      return;
    // In production we would wipe the Firestore collection, but for now just clear local state
    setLeads([]);
  }

  function exportCSV() {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Industry",
      "Location",
      "Tier",
      "Persona",
      "Score",
      "Weakest",
      "Strongest",
      "Date",
    ];
    const rows = leads.map((l) => [
      l.name,
      l.email,
      l.phone,
      l.industry,
      l.location,
      l.pricingTier,
      l.personaName,
      l.overallScore + "%",
      l.weakestStage,
      l.strongestStage,
      new Date(l.completedAt).toLocaleDateString("en-IN"),
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads - ${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function notifyOnWhatsApp(lead) {
    const YOUR_WHATSAPP = "919566812543"; // REPLACE with your number
    const msg = encodeURIComponent(
      `Hi ${lead.name}, I saw you completed the Customer Journey Audit on PeoplePlex.com.\n\n` +
      `Your score was ${lead.overallScore}% — your biggest gap is the ${lead.weakestStage} stage.\n\n` +
      `I have a specific idea for how to fix that.Are you free for a quick 15 - minute call this week ? `,
    );
    window.open(
      `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${msg}`,
      "_blank",
    );
  }

  const filteredLeads = leads.filter((l) => {
    if (filter === "all") return true;
    if (filter === "critical") return l.overallScore < 40;
    if (filter === "developing")
      return l.overallScore >= 40 && l.overallScore < 70;
    if (filter === "strong") return l.overallScore >= 70;
    return true;
  });

  // Stats
  const avgScore = leads.length
    ? Math.round(leads.reduce((a, l) => a + l.overallScore, 0) / leads.length)
    : 0;
  const critCount = leads.filter((l) => l.overallScore < 40).length;
  const industries = [...new Set(leads.map((l) => l.industry))].length;
  const weakStages = leads.reduce((acc, l) => {
    acc[l.weakestStage] = (acc[l.weakestStage] || 0) + 1;
    return acc;
  }, {});
  const topWeak = Object.entries(weakStages).sort((a, b) => b[1] - a[1])[0];

  if (viewingAutomations) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DARK_MODE_BACKGROUND,
          color: TEXT_COLOR,
          fontFamily: "'Inter Tight', system-ui, sans-serif",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 20px" }}>
          <AutomationRecommendations
            audit={viewingAutomations}
            onBack={() => setViewingAutomations(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: DARK_MODE_BACKGROUND,
        color: TEXT_COLOR,
        fontFamily: "'Inter Tight', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${BORDER_COLOR}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: PRIMARY_BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 400,
              color: "#FFFFFF",
            }}
          >
            H
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 400 }}>
              My History Dashboard
            </div>
            <div style={{ fontSize: 14, color: MUTED_COLOR }}>
              PeoplePlex User Profile
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${BORDER_COLOR}`,
              background: "transparent",
              color: MUTED_COLOR,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            ← Back to Tool
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            {
              label: "Completed Audits",
              value: leads.length,
              icon: "👥",
              color: PRIMARY_BLUE,
            },
            {
              label: "Avg Score",
              value: avgScore + "%",
              icon: "📊",
              color: scoreColor(avgScore),
            },
            {
              label: "Critical (<40%)",
              value: critCount,
              icon: "🚨",
              color: "#ef4444",
            },
            {
              label: "Industries",
              value: industries,
              icon: "🏢",
              color: "#3b82f6",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: CARD_BACKGROUND,
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  color: stat.color,
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 14, color: MUTED_COLOR, marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top insight bar */}
        {topWeak && (
          <div
            style={{
              background: `${PRIMARY_BLUE}10`,
              border: `1px solid ${PRIMARY_BLUE}30`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 14,
              color: "#ccc",
            }}
          >
            💡 <span style={{ color: PRIMARY_BLUE }}>Pattern detected:</span> Most
            of your audits are weakest at the{" "}
            <span style={{ color: TEXT_COLOR }}>{topWeak[0]}</span> stage (
            {topWeak[1]} of {leads.length} audits). Consider focusing on this
            area.
          </div>
        )}

        {/* Filter pills */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {[
            ["all", "All My Audits", leads.length],
            [
              "critical",
              "🚨 Critical (<40%)",
              leads.filter((l) => l.overallScore < 40).length,
            ],
            [
              "developing",
              "🟡 Developing (40–70%)",
              leads.filter((l) => l.overallScore >= 40 && l.overallScore < 70)
                .length,
            ],
            [
              "strong",
              "✅ Strong (70%+)",
              leads.filter((l) => l.overallScore >= 70).length,
            ],
          ].map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${filter === id ? PRIMARY_BLUE : BORDER_COLOR}`,
                background: filter === id ? `${PRIMARY_BLUE}15` : "transparent",
                color: filter === id ? PRIMARY_BLUE : MUTED_COLOR,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Lead list */}
        {loading ? (
          <Spinner message="Loading leads…" />
        ) : filteredLeads.length === 0 ? (
          <div
            style={{ textAlign: "center", padding: "60px 20px", color: MUTED_COLOR }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 400,
                color: TEXT_COLOR,
                marginBottom: 8,
              }}
            >
              No audits yet
            </div>
            <div style={{ fontSize: 15 }}>
              Complete your first Customer Journey Audit to see it here!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                style={{
                  background: CARD_BACKGROUND,
                  border: `1px solid ${selected?.id === lead.id ? PRIMARY_BLUE : BORDER_COLOR}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  transition: "border-color .2s",
                }}
              >
                {/* Lead summary row */}
                <div
                  onClick={() =>
                    setSelected(selected?.id === lead.id ? null : lead)
                  }
                  style={{
                    padding: "16px 20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                  }}
                >
                  {/* Score circle */}
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `conic-gradient(${scoreColor(lead.overallScore)} ${lead.overallScore * 3.6}deg, ${BORDER_COLOR} 0deg)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: CARD_BACKGROUND,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 400,
                        color: scoreColor(lead.overallScore),
                      }}
                    >
                      {lead.overallScore}%
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{ fontSize: 15, fontWeight: 400, color: TEXT_COLOR }}
                      >
                        {lead.businessName || lead.industry}
                        {lead.personaName && lead.personaName !== "Unknown"
                          ? ` — ${lead.personaName}`
                          : ""}
                      </span>
                      <span
                        style={{
                          fontSize: 14,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: `${scoreColor(lead.overallScore)}20`,
                          color: scoreColor(lead.overallScore),
                          fontWeight: 400,
                        }}
                      >
                        {scoreLabel(lead.overallScore)}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: MUTED_COLOR, marginTop: 2 }}>
                      {lead.industry} · {lead.location} · {lead.pricingTier}
                    </div>
                    <div style={{ fontSize: 14, color: "#555", marginTop: 1 }}>
                      Weakest:{" "}
                      <span style={{ color: "#ef4444" }}>
                        {lead.weakestStage}
                      </span>{" "}
                      ·{" "}
                      {new Date(lead.completedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {selected?.id === lead.id && (
                  <div
                    style={{
                      borderTop: `1px solid ${BORDER_COLOR}`,
                      padding: "16px 20px",
                      background: "#F3F4F6",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        marginBottom: 14,
                      }}
                    >
                      {[
                        {
                          l: "Persona",
                          v:
                            lead.personaName && lead.personaName !== "Unknown"
                              ? `${lead.personaName} — ${lead.personaArchetype}`
                              : "Not generated",
                        },
                        { l: "Pricing Tier", v: lead.pricingTier },
                      ].map((item) => (
                        <div
                          key={item.l}
                          style={{
                            background: CARD_BACKGROUND,
                            borderRadius: 8,
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              color: MUTED_COLOR,
                              textTransform: "uppercase",
                              marginBottom: 3,
                            }}
                          >
                            {item.l}
                          </div>
                          <div style={{ fontSize: 14, color: TEXT_COLOR }}>
                            {item.v}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Stage breakdown */}
                    <div
                      style={{ fontSize: 14, color: MUTED_COLOR, marginBottom: 8 }}
                    >
                      Stage Scores
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 16,
                      }}
                    >
                      {(lead.stageScores || []).map((s) => (
                        <div
                          key={s.stage}
                          style={{
                            background: CARD_BACKGROUND,
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 14,
                          }}
                        >
                          <span style={{ color: MUTED_COLOR }}>{s.stage}: </span>
                          <span
                            style={{
                              color: scoreColor(s.pct),
                              fontWeight: 400,
                            }}
                          >
                            {s.pct}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginTop: 16,
                      }}
                    >
                      {lead.business && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadAudit(lead, 4);
                            }}
                            style={{
                              flex: 1,
                              padding: "12px 16px",
                              borderRadius: 10,
                              background: "transparent",
                              color: TEXT_COLOR,
                              border: `1.5px solid ${BORDER_COLOR}`,
                              fontWeight: 400,
                              fontSize: 14,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            📄 View Full Report
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadAudit(lead, 3);
                            }}
                            style={{
                              flex: 1,
                              padding: "12px 16px",
                              borderRadius: 10,
                              background: "transparent",
                              color: TEXT_COLOR,
                              border: `1.5px solid ${BORDER_COLOR}`,
                              fontWeight: 400,
                              fontSize: 14,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            🔄 Retake Audit
                          </button>
                        </>
                      )}

                      {/* Automation Plan Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingAutomations(lead);
                        }}
                        style={{
                          width: lead.business ? "100%" : "auto",
                          flex: lead.business ? "none" : 1,
                          padding: "12px 16px",
                          borderRadius: 10,
                          border: "none",
                          background: PRIMARY_BLUE,
                          color: "#FFFFFF",
                          fontWeight: 400,
                          fontSize: 14,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          transition: "opacity 0.2s",
                        }}
                      >
                        ⚙️ View Automation Recommendations
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Danger zone */}
        {leads.length > 0 && (
          <div style={{ marginTop: 32, textAlign: "center" }}>
            <button
              onClick={clearAllLeads}
              style={{
                background: "none",
                border: "none",
                color: "#444",
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Clear all audits
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;