import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  updatePassword,
  updateEmail,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import ToolsDashboard from "./ToolsDashboard.jsx";
import CustomerPsychology from "./CustomerPsychology.jsx";
import UserProfileSettings from "./UserProfileSettings.jsx";
import NotFound from "./NotFound.jsx";
import AuthScreen from "./AuthScreen.jsx";
import UserDashboard from "./UserDashboard.jsx";
import SharedReportView from "./SharedReportView.jsx";
import ProjectsDashboard from "./ProjectsDashboard.jsx";
import CompetitorAnalysis from "./CompetitorAnalysis.jsx";

const BOOKING_LINK = "https://iamhariharan.com/training-institutes";

// ── Brand tokens ──────────────────────────────────────────────
const PRIMARY_BLUE = "#FF6B35";
const DARK_MODE_BACKGROUND = "#F9FAFB";
const CARD_BACKGROUND = "#FFFFFF";
const BORDER_COLOR = "#E5E7EB";
const MUTED_COLOR = "#6B7280";
const TEXT_COLOR = "#111827";

// ── Audit questions per journey stage ─────────────────────────
const JOURNEY_STAGES = [
  {
    id: "aware",
    label: "Aware",
    icon: "◎",
    description: "Can your customer find you when they first start looking?",
    questions: [
      "We appear in search results when customers look for solutions we offer",
      "We have content (video, blog, social) that reaches customers before they're ready to buy",
      "We run awareness campaigns that reach new audiences consistently",
      "Current customers actively refer others to us — systematically",
      "We are present on platforms where our customers ask questions",
      "We post content regularly that reaches customers in the early research phase",
    ],
  },
  {
    id: "appeal",
    label: "Appeal",
    icon: "◈",
    description: "When customers find you — do you pass their first filter?",
    questions: [
      "Our website clearly communicates what we offer and who it's for",
      "Pricing or investment range is easy to find without contacting us",
      "Key information (location, timing, process) is clearly stated",
      "Our website works properly and looks good on mobile devices",
      "A customer can understand our credibility within 10 seconds",
      "We look more professional than our top 3 competitors online",
    ],
  },
  {
    id: "ask",
    label: "Ask",
    icon: "◉",
    description: "When customers research you — what do they find?",
    questions: [
      "We have 20+ recent reviews with an average of 4.5 stars or above",
      "Our reviews include responses from the last 3 months",
      "We respond to reviews — both positive and negative",
      "Our social media is active with real customer stories and results",
      "We have visible testimonials or case studies with specific results",
      "Word-of-mouth about us is positive and specific — not just 'they're okay'",
    ],
  },
  {
    id: "act",
    label: "Act",
    icon: "◆",
    description: "When customers are ready — how easy is it to move forward?",
    questions: [
      "We respond to inquiries within 15 minutes during working hours",
      "Our process for getting started is simple and clearly explained",
      "We offer multiple payment or commitment options",
      "We have a follow-up system for leads who didn't convert immediately",
      "Our team handles common objections confidently and consistently",
      "We track how many inquiries convert to customers every month",
    ],
  },
  {
    id: "advocate",
    label: "Advocate",
    icon: "◇",
    description: "Are your customers actively working for you?",
    questions: [
      "We systematically ask every happy customer for a review or testimonial",
      "We document and share customer success stories regularly",
      "We have a referral process where customers bring other customers",
      "We follow up with past customers and maintain the relationship",
      "Successful customers are visible and active in our marketing",
      "We know exactly what our best customers would say to recommend us",
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────
function scoreColor(pct) {
  if (pct >= 80) return "#34C759";
  if (pct >= 50) return PRIMARY_BLUE;
  return "#FF3B30";
}
function scoreLabel(pct) {
  if (pct >= 80) return "Strong";
  if (pct >= 50) return "Developing";
  if (pct >= 25) return "Critical";
  return "Urgent";
}

// ── Reusable UI pieces ─────────────────────────────────────────
const Pill = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 16px",
      borderRadius: 999,
      border: `1px solid ${active ? PRIMARY_BLUE : BORDER_COLOR}`,
      background: active ? `${PRIMARY_BLUE}30` : "transparent",
      color: active ? PRIMARY_BLUE : MUTED_COLOR,
      fontSize: 15,
      cursor: "pointer",
      transition: "all .2s",
      fontWeight: 400,
    }}
  >
    {children}
  </button>
);

const Input = ({ label, placeholder, value, onChange, textarea }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <label
      style={{
        fontSize: 15,
        color: MUTED_COLOR,
        letterSpacing: ".02em",
        textTransform: "uppercase",
        fontWeight: 400,
      }}
    >
      {label}
    </label>
    {textarea ? (
      <textarea
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 12,
          padding: "14px 16px",
          color: TEXT_COLOR,
          fontSize: 15,
          resize: "vertical",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    ) : (
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 12,
          padding: "14px 16px",
          color: TEXT_COLOR,
          fontSize: 15,
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    )}
  </div>
);

const GradientButton = ({ children, onClick, disabled, fullWidth, secondary }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: fullWidth ? "100%" : "auto",
      padding: "16px 28px",
      borderRadius: 14,
      border: secondary ? `1.5px solid ${BORDER_COLOR}` : "none",
      background: secondary ? "transparent" : disabled ? BORDER_COLOR : PRIMARY_BLUE,
      color: disabled ? MUTED_COLOR : secondary ? MUTED_COLOR : "#FFFFFF",
      fontSize: 15,
      fontWeight: 400,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .2s ease-in-out",
      letterSpacing: ".02em",
      boxShadow: secondary || disabled ? "none" : "0 4px 15px 0 rgba(255, 107, 53, 0.30)",
    }}
  >
    {children}
  </button>
);

// ── Step indicator ─────────────────────────────────────────────
const Steps = ({ current }) => {
  // current=1→Personas active, current=2→Journey active, current=3→Results active
  const steps = ["Personas", "Journey", "Results"];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 0,
        marginBottom: 40,
      }}
    >
      {steps.map((s, i) => (
        <div
          key={s}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < steps.length - 1 ? 1 : 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background:
                  i < current - 1 ? PRIMARY_BLUE : i === current - 1 ? CARD_BACKGROUND : "transparent",
                border: `2px solid ${i <= current - 1 ? PRIMARY_BLUE : BORDER_COLOR}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 15,
                fontWeight: 400,
                color: i <= current - 1 ? "#FFFFFF" : MUTED_COLOR,
                transition: "all .3s ease-in-out",
              }}
            >
              {i < current - 1 ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 14,
                color: i === current - 1 ? PRIMARY_BLUE : MUTED_COLOR,
                whiteSpace: "nowrap",
                fontWeight: i === current - 1 ? 600 : 400,
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                margin: "0 8px",
                marginBottom: 24,
                background: i < current - 1 ? PRIMARY_BLUE : BORDER_COLOR,
                transition: "all .3s ease-in-out",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Loading spinner ────────────────────────────────────────────
const Spinner = ({ message }) => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: `4px solid ${BORDER_COLOR}`,
        borderTop: `4px solid ${PRIMARY_BLUE}`,
        margin: "0 auto 24px",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: MUTED_COLOR, fontSize: 15 }}>{message}</p>
  </div>
);

// ── Pricing tier data ─────────────────────────────────────────
// ── Industry-aware pricing examples ───────────────────────────
const INDUSTRY_EXAMPLES = {
  "real estate": {
    budget: "Affordable housing · Under ₹40L · First-time buyers, budget flats",
    mid: "Mid-segment homes · ₹40L–₹1.5Cr · Family homes, value townships",
    premium:
      "Premium homes · ₹1.5Cr–₹5Cr · Lifestyle apartments, gated communities",
    luxury:
      "Luxury villas · ₹5Cr+ · Ultra-premium, branded residences, penthouses",
  },
  training: {
    budget: "Short courses · ₹500–₹5,000 · Certificate programs, quick skills",
    mid: "Skill programs · ₹5,000–₹50,000 · Professional certifications, diplomas",
    premium: "Advanced courses · ₹50,000–₹2L · Specialised, placement-focused",
    luxury:
      "Elite programs · ₹2L+ · Executive education, international certifications",
  },
  salon: {
    budget:
      "Basic services · ₹100–₹500 · Haircut, threading, everyday grooming",
    mid: "Quality services · ₹500–₹2,500 · Styling, treatments, colour",
    premium:
      "Premium salon · ₹2,500–₹8,000 · Expert stylists, branded products",
    luxury:
      "Luxury spa salon · ₹8,000+ · Exclusive, bespoke, celebrity experience",
  },
  restaurant: {
    budget: "Everyday dining · ₹100–₹400 per head · Quick, affordable meals",
    mid: "Casual dining · ₹400–₹1,500 per head · Good food, good experience",
    premium: "Fine dining · ₹1,500–₹5,000 per head · Curated menu, ambience",
    luxury: "Ultra-fine dining · ₹5,000+ per head · Chef's table, exclusivity",
  },
  consulting: {
    budget: "Basic consulting · ₹5,000–₹20,000/month · Startups, solopreneurs",
    mid: "Growth consulting · ₹20,000–₹1L/month · SMEs, established businesses",
    premium:
      "Strategic consulting · ₹1L–₹5L/month · Corporate, senior leadership",
    luxury: "Executive advisory · ₹5L+/month · Board-level, enterprise, CXO",
  },
  healthcare: {
    budget:
      "General clinic · ₹200–₹800 consultation · Primary care, accessible",
    mid: "Speciality clinic · ₹800–₹3,000 · Quality specialists, diagnostics",
    premium: "Premium hospital · ₹3,000–₹15,000 · Advanced care, private rooms",
    luxury:
      "Luxury healthcare · ₹15,000+ · Concierge medicine, international care",
  },
  default: {
    budget: "Entry-level · Lowest price point in your category · Volume-driven",
    mid: "Mid-market · Competitive pricing with quality focus · Best value",
    premium: "Premium tier · Higher price, higher expectation · Experience-led",
    luxury:
      "Top of market · Price is not the priority · Exclusivity and prestige",
  },
};

function getIndustryKey(industry) {
  const lower = (industry || "").toLowerCase();
  if (
    lower.includes("real estate") ||
    lower.includes("property") ||
    lower.includes("realty")
  )
    return "real estate";
  if (
    lower.includes("train") ||
    lower.includes("coach") ||
    lower.includes("institute") ||
    lower.includes("education") ||
    lower.includes("course")
  )
    return "training";
  if (
    lower.includes("salon") ||
    lower.includes("spa") ||
    lower.includes("beauty") ||
    lower.includes("grooming")
  )
    return "salon";
  if (
    lower.includes("restaurant") ||
    lower.includes("food") ||
    lower.includes("cafe") ||
    lower.includes("dining")
  )
    return "restaurant";
  if (
    lower.includes("consult") ||
    lower.includes("agency") ||
    lower.includes("marketing") ||
    lower.includes("strategy")
  )
    return "consulting";
  if (
    lower.includes("health") ||
    lower.includes("clinic") ||
    lower.includes("hospital") ||
    lower.includes("doctor") ||
    lower.includes("medical")
  )
    return "healthcare";
  return "default";
}

const PRICING_TIERS = [
  {
    id: "budget",
    label: "Budget",
    tag: "Mass Market",
    icon: "◎",
    color: "#64748b",
    description:
      "Price-sensitive customers. Volume-focused. Affordability wins.",
  },
  {
    id: "mid",
    label: "Mid-Range",
    tag: "Value Market",
    icon: "◈",
    color: "#3b82f6",
    description: "Quality-conscious. Best balance of value and experience.",
  },
  {
    id: "premium",
    label: "Premium",
    tag: "Aspirational",
    icon: "◆",
    color: "#8b5cf6",
    description:
      "Experience-first. Willing to pay more for quality and status.",
  },
  {
    id: "luxury",
    label: "Luxury",
    tag: "Exclusive Market",
    icon: "◇",
    color: PRIMARY_BLUE,
    description: "Price is secondary. Exclusivity, prestige, and perfection.",
  },
];

const TIER_INSIGHTS = {
  budget:
    "Your customer prioritises affordability above all. They compare prices, hunt for deals, and need clear value justification before committing. Trust is built through volume of reviews and word-of-mouth — not premium branding.",
  mid: "Your customer wants quality without overpaying. They research carefully, compare 3-4 options, and respond well to proof of results. They will pay more — but only when they feel the value is clearly justified.",
  premium:
    "Your customer expects an elevated experience at every touchpoint — from your website to your WhatsApp reply time. They judge credibility by presentation. Price matters less than confidence and professionalism.",
  luxury:
    "Your customer is buying exclusivity, identity, and an exceptional experience. They want to feel chosen — not sold to. Every interaction must signal elite quality. Price itself signals legitimacy — never discount.",
};

// ══════════════════════════════════════════════════════════════
// STEP 1 — Business Description + Pricing Tier
// ══════════════════════════════════════════════════════════════
function StepDescribe({ onNext }) {
  const [setupStep, setSetupStep] = useState(1);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisPct, setAnalysisPct] = useState(0);
  const [analysisChecks, setAnalysisChecks] = useState([]);

  const ANALYSIS_CHECKS = [
    "Industry dynamics identified",
    "Business psychology classified",
    "Purchase behaviour analysed",
  ];

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [gmbUrl, setGmbUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [pricingTier, setPricing] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const step1Ready =
    businessName.trim() &&
    industry.trim() &&
    description.trim() &&
    location.trim();
  const step3Ready = pricingTier !== null;

  // ── Analysis phase ─────────────────────────────────────────
  async function runAnalysis(data) {
    setAnalyzing(true);
    setAnalysisPct(0);
    setAnalysisChecks([]);

    // Animate progress bar
    const timer = setInterval(() => {
      setAnalysisPct(prev => {
        if (prev >= 95) { clearInterval(timer); return 95; }
        return prev + Math.random() * 8;
      });
    }, 300);

    // Stagger checkmarks in
    setTimeout(() => setAnalysisChecks([0]), 800);
    setTimeout(() => setAnalysisChecks([0, 1]), 1800);
    setTimeout(() => setAnalysisChecks([0, 1, 2]), 2800);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 400,
          messages: [{
            role: "user",
            content: `Analyze this business in JSON only, no markdown:
{
  "industryDynamics": "one-line summary of how this industry works",
  "businessPsychology": "one-line buyer psychology type",
  "purchaseBehaviour": "one-line how customers make purchase decisions"
}
Business: ${data.businessName}, Industry: ${data.industry}, Pricing: ${data.pricingTier?.label || 'Mid-Range'}, Location: ${data.location}`
          }]
        })
      });
      const json = await res.json();
      const text = (json.content?.[0]?.text || "").replace(/```json|```/g, "").trim();
      try {
        const parsed = JSON.parse(text);
        data.analysis = parsed;
      } catch (_) {
        data.analysis = {};
      }
    } catch (_) {
      data.analysis = {};
    }

    clearInterval(timer);
    setAnalysisPct(100);
    setTimeout(() => onNext(data), 600);
  }

  if (analyzing) {
    return (
      <div
        style={{
          background: "#0f172a",
          borderRadius: 20,
          padding: "48px 40px",
          fontFamily: "'Inter Tight', monospace",
          minHeight: 260,
        }}
      >
        <p style={{ color: "#94a3b8", fontSize: 14, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Analyzing Your Business...</p>
        {/* Progress bar */}
        <div style={{ background: "#1e293b", borderRadius: 4, height: 10, marginBottom: 10, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              borderRadius: 4,
              width: `${analysisPct}%`,
              background: "linear-gradient(90deg, #FF6B35, #FF8C5A)",
              transition: "width .4s ease",
            }}
          />
        </div>
        <p style={{ color: "#475569", fontSize: 13, marginBottom: 32 }}>{Math.round(analysisPct)}%</p>
        {/* Checkmarks */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ANALYSIS_CHECKS.map((label, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                opacity: analysisChecks.includes(idx) ? 1 : 0.2,
                transform: analysisChecks.includes(idx) ? "translateX(0)" : "translateX(-8px)",
                transition: "all .4s ease",
              }}
            >
              <span style={{ color: "#22c55e", fontSize: 15, fontWeight: 400 }}>✓</span>
              <span style={{ color: "#cbd5e1", fontSize: 14 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ flex: 1, height: 6, borderRadius: 3, background: setupStep >= s ? PRIMARY_BLUE : BORDER_COLOR, transition: "background .3s" }} />
          ))}
        </div>

        {setupStep === 1 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: "0 0 8px 0" }}>Step 1: Core Identity</h2>
            <p style={{ color: MUTED_COLOR, margin: 0, fontSize: 15 }}>Establish the foundational identity of the business.</p>
          </>
        )}
        {setupStep === 2 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: "0 0 8px 0" }}>Step 2: Digital Footprint</h2>
            <p style={{ color: MUTED_COLOR, margin: 0, fontSize: 15 }}>Link their core channels so the AI can analyze their current presence.</p>
          </>
        )}
        {setupStep === 3 && (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: "0 0 8px 0" }}>Step 3: Market Positioning</h2>
            <p style={{ color: MUTED_COLOR, margin: 0, fontSize: 15 }}>Determine where their offer sits in the wider market ecosystem.</p>
          </>
        )}
      </div>

      {setupStep === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Input
            label="Business Name"
            placeholder="e.g., PeoplePlex Training Institute"
            value={businessName}
            onChange={setBusinessName}
          />
          <Input
            label="Industry"
            placeholder="e.g., Training Institute, Real Estate, Salon"
            value={industry}
            onChange={setIndustry}
          />
          <Input
            label="Business Description"
            placeholder="e.g., We run an IT training institute in Chennai offering placement-focused courses for graduates and working professionals."
            value={description}
            onChange={setDesc}
            textarea
          />
          <Input
            label="Location"
            placeholder="e.g., Chennai, India or Online-only"
            value={location}
            onChange={setLocation}
          />

          <div style={{ marginTop: 8 }}>
            <GradientButton fullWidth disabled={!step1Ready} onClick={() => setSetupStep(2)}>
              Next: Digital Footprint →
            </GradientButton>
          </div>
        </div>
      )}

      {setupStep === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Input
            label="Website URL (Optional)"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={setWebsiteUrl}
          />
          <Input
            label="Google My Business (GMB) URL (Optional)"
            placeholder="https://maps.app.goo.gl/..."
            value={gmbUrl}
            onChange={setGmbUrl}
          />
          <Input
            label="Instagram Profile (Optional)"
            placeholder="@yourbrand"
            value={instagramUrl}
            onChange={setInstagramUrl}
          />
          <Input
            label="Facebook Page (Optional)"
            placeholder="facebook.com/yourbrand"
            value={facebookUrl}
            onChange={setFacebookUrl}
          />
          <Input
            label="LinkedIn Profile (Optional)"
            placeholder="linkedin.com/company/yourbrand"
            value={linkedinUrl}
            onChange={setLinkedinUrl}
          />

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={() => setSetupStep(1)}
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                background: "transparent",
                border: `1.5px solid ${BORDER_COLOR}`,
                color: TEXT_COLOR,
                fontWeight: 400,
                cursor: "pointer",
                transition: "all .2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = MUTED_COLOR;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER_COLOR;
              }}
            >
              ← Back
            </button>
            <div style={{ flex: 1 }}>
              <GradientButton fullWidth onClick={() => setSetupStep(3)}>
                Next: Market Positioning →
              </GradientButton>
            </div>
          </div>
        </div>
      )}

      {setupStep === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <div
              style={{
                fontSize: 15,
                color: MUTED_COLOR,
                letterSpacing: ".02em",
                textTransform: "uppercase",
                marginBottom: 6,
                fontWeight: 400,
              }}
            >
              Pricing Tier
            </div>
            <p
              style={{
                fontSize: 15,
                color: MUTED_COLOR,
                marginBottom: 14,
                lineHeight: 1.5,
              }}
            >
              Where does your product or service sit in the market? This shapes
              who your customer is and what drives their decision.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PRICING_TIERS.map((tier) => {
                const sel = pricingTier && pricingTier.id === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setPricing(tier)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: "16px 18px",
                      borderRadius: 12,
                      border: "1.5px solid " + (sel ? tier.color : BORDER_COLOR),
                      background: sel ? tier.color + "1A" : CARD_BACKGROUND,
                      cursor: "pointer",
                      transition: "all .2s ease-in-out",
                    }}
                  >
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        flexShrink: 0,
                        marginTop: 2,
                        border: "2px solid " + (sel ? tier.color : BORDER_COLOR),
                        background: sel ? tier.color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .2s",
                      }}
                    >
                      {sel && (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: "#FFFFFF",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 400,
                            color: sel ? TEXT_COLOR : MUTED_COLOR,
                          }}
                        >
                          {tier.label}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: tier.color + "33",
                            color: tier.color,
                            fontWeight: 400,
                          }}
                        >
                          {tier.tag}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: 15, color: MUTED_COLOR, lineHeight: 1.5 }}
                      >
                        {tier.description}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          color: sel ? tier.color : "#666",
                          marginTop: 6,
                          fontWeight: 400,
                        }}
                      >
                        {
                          (INDUSTRY_EXAMPLES[getIndustryKey(industry)] ||
                            INDUSTRY_EXAMPLES["default"])[tier.id]
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ minHeight: 100, marginTop: 4 }}>
              {pricingTier && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "14px 16px",
                    background: pricingTier.color + "15",
                    border: "1px solid " + pricingTier.color + "40",
                    borderRadius: 12,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: pricingTier.color,
                      fontWeight: 400,
                      marginBottom: 4,
                    }}
                  >
                    {pricingTier.icon} {pricingTier.tag} Customer Insight
                  </div>
                  <div style={{ fontSize: 15, color: MUTED_COLOR, lineHeight: 1.6 }}>
                    {TIER_INSIGHTS[pricingTier.id]}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Input
            label="Additional Notes (Optional)"
            placeholder="e.g., We have a small budget, our primary audience is college students..."
            value={additionalNotes}
            onChange={setAdditionalNotes}
            textarea
          />

          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={() => setSetupStep(2)}
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                background: "transparent",
                border: `1.5px solid ${BORDER_COLOR}`,
                color: TEXT_COLOR,
                fontWeight: 400,
                cursor: "pointer",
                transition: "all .2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = MUTED_COLOR;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER_COLOR;
              }}
            >
              ← Back
            </button>
            <div style={{ flex: 1 }}>
              <GradientButton
                fullWidth
                disabled={!step3Ready}
                onClick={() =>
                  runAnalysis({
                    businessName,
                    industry,
                    description,
                    location,
                    websiteUrl,
                    gmbUrl,
                    instagramUrl,
                    facebookUrl,
                    linkedinUrl,
                    pricingTier,
                    additionalNotes,
                  })
                }
              >
                Complete Setup 🚀
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 2 — Persona Selection
// ══════════════════════════════════════════════════════════════
function StepPersonas({ business, onNext, onBack }) {
  const [personas, setPersonas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generatePersonas();
  }, []);

  async function generatePersonas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a customer research expert. Generate exactly 3 distinct customer personas for this business.

Business:
Name: ${business.businessName}
Industry: ${business.industry}
Description: ${business.description}
Location: ${business.location}
Website: ${business.websiteUrl || "Not provided"}
Google My Business: ${business.gmbUrl || "Not provided"}
Social Media: ${business.socialUrl || "Not provided"}
Additional Notes: ${business.additionalNotes || "None"}
Pricing Tier: ${business.pricingTier ? business.pricingTier.label + " (" + business.pricingTier.tag + ")" : "Mid-Range"}
Price Range: ${business.pricingTier ? business.pricingTier.label + " (" + business.pricingTier.tag + ") — " + business.pricingTier.description : "Mid-range pricing"}

Important: Generate personas that specifically match the ${business.pricingTier ? business.pricingTier.tag : "Value Market"} segment. Their income level, expectations, decision-making style, and what they value should reflect this pricing tier.

Return ONLY valid JSON, no markdown, no explanation:
{
  "personas": [
    {
      "id": "persona_1",
      "name": "First Name Only",
      "archetype": "2-3 word archetype label",
      "age": "age range",
      "role": "job title or role",
      "summary": "one sentence who they are",
      "primaryGoal": "what they most want",
      "biggestFear": "what they're most afraid of",
      "trigger": "what makes them start looking for a solution"
    }
  ]
}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setPersonas(parsed.personas);
    } catch (e) {
      setError("Failed to generate personas. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return (
      <Spinner message="Analysing your business and generating customer personas…" />
    );
  if (error)
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <p style={{ color: "#ef4444", marginBottom: 20 }}>{error}</p>
        <GradientButton onClick={generatePersonas}>Try Again</GradientButton>
      </div>
    );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 15,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 400,
          }}
        >
          Step 2 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: 0 }}>
          Who Is Your Customer?
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 15 }}>
          Here are 3 unique personas we generated for your business.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {personas?.map((p) => (
          <div
            key={p.id}
            style={{
              background: CARD_BACKGROUND,
              border: `1.5px solid ${BORDER_COLOR}`,
              borderRadius: 16,
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 400, color: TEXT_COLOR }}>
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: `${PRIMARY_BLUE}30`,
                      color: PRIMARY_BLUE,
                      fontWeight: 400,
                    }}
                  >
                    {p.archetype}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: MUTED_COLOR }}>
                  {p.age} · {p.role}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 15,
                color: MUTED_COLOR,
                margin: "12px 0 16px",
                lineHeight: 1.6,
              }}
            >
              {p.summary}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                { label: "🎯 Primary Goal", value: p.primaryGoal },
                { label: "😰 Biggest Fear", value: p.biggestFear },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ fontSize: 14, color: MUTED_COLOR, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 15, color: TEXT_COLOR, lineHeight: 1.5 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <GradientButton secondary onClick={onBack}>
          ← Back
        </GradientButton>
        <GradientButton
          fullWidth
          disabled={!personas}
          onClick={() => onNext(personas)}
        >
          Explore Their Journeys →
        </GradientButton>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 3 — Journey Map
// ══════════════════════════════════════════════════════════════
function StepJourney({ business, personas, onNext, onBack }) {
  const [journeys, setJourneys] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState(0);
  const [activePersonaIdx, setActivePersonaIdx] = useState(0);

  useEffect(() => {
    generateJourney();
  }, []);

  async function generateJourney() {
    // Unique smart fallbacks
    const smartFallbacks = personas.map((p, idx) => ({
      personaIdx: idx,
      stages: [
        {
          stage: "Aware",
          intent: `${p.name} is trying to solve a problem or achieve ${p.primaryGoal} — but doesn't know the solution yet`,
          behaviour: `Searching Google and YouTube for answers, asking friends and colleagues`,
          painPoint: `Doesn't know what they don't know. Overwhelmed by options.`,
          touchpoint: `Google search, YouTube, Instagram, LinkedIn, word-of-mouth`,
          insight: `At this stage they're problem-aware, not solution-aware. Speak to their problem — not your service`,
        },
        {
          stage: "Appeal",
          intent: `${p.name} is evaluating whether your business looks credible and relevant enough to explore further`,
          behaviour: `Visiting your website, scanning your social media, comparing you to competitors`,
          painPoint: `Most businesses look the same. Hard to tell who's actually good vs who just looks good`,
          touchpoint: `Your website, Instagram profile, Google Business listing`,
          insight: `You have 7 seconds. If your positioning, credibility, and relevance aren't immediately clear — they leave`,
        },
        {
          stage: "Ask",
          intent: `${p.name} is researching whether they can actually trust you before committing any money or time`,
          behaviour: `Reading Google reviews, looking for case studies, asking friends if they've heard of you`,
          painPoint: `Fear of wasting money. Past experience with businesses that overpromised.`,
          touchpoint: `Google Reviews, testimonials, social proof, LinkedIn recommendations`,
          insight: `This is where most businesses silently lose customers. Social proof isn't optional — it's the deciding factor`,
        },
        {
          stage: "Act",
          intent: `${p.name} has decided they want to move forward — now they're trying to figure out HOW to start`,
          behaviour: `Clicking contact/WhatsApp/call buttons, filling enquiry forms`,
          painPoint: `Friction in the process. Slow response times. Confusing next steps.`,
          touchpoint: `WhatsApp, phone call, contact form, DM, walk-in, booking page`,
          insight: `Speed wins. The business that responds fastest and makes it easiest to start — gets the customer`,
        },
        {
          stage: "Advocate",
          intent: `${p.name} had a great experience and naturally wants to tell others — but usually needs a small nudge`,
          behaviour: `Mentioning you to friends, sharing your content, leaving a review if asked`,
          painPoint: `No one asked them. They forgot. They don't know how to refer.`,
          touchpoint: `WhatsApp follow-up, review request, referral program, email check-in`,
          insight: `Happy customers are your best salespeople — but only if you activate them. Ask directly and make it easy`,
        },
      ],
    }));

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 3000,
          messages: [
            {
              role: "user",
              content: `You are a customer journey expert. Map the complete journey of these 3 customer personas for this specific business.

Business Name: ${business.businessName}
Business Industry: ${business.industry}
Business Description: ${business.description}
Location: ${business.location}
Website: ${business.websiteUrl || "Not provided"}
Google My Business: ${business.gmbUrl || "Not provided"}
Instagram: ${business.instagramUrl || "Not provided"}
Facebook: ${business.facebookUrl || "Not provided"}
LinkedIn: ${business.linkedinUrl || "Not provided"}
Additional Notes: ${business.additionalNotes || "None"}

Persona 1: ${personas[0] ? personas[0].name : ""} (${personas[0] ? personas[0].archetype : ""}) - Goal: ${personas[0] ? personas[0].primaryGoal : ""}
Persona 2: ${personas[1] ? personas[1].name : ""} (${personas[1] ? personas[1].archetype : ""}) - Goal: ${personas[1] ? personas[1].primaryGoal : ""}
Persona 3: ${personas[2] ? personas[2].name : ""} (${personas[2] ? personas[2].archetype : ""}) - Goal: ${personas[2] ? personas[2].primaryGoal : ""}

Generate a SPECIFIC, DETAILED journey map for EACH persona. Make each stage unique and relevant to that exact persona.
Return ONLY valid JSON, no markdown backticks, no explanation:
{"journeys":[{"personaIdx":0,"stages":[{"stage":"Aware","intent":"specific intent","behaviour":"specific behaviour","painPoint":"specific pain point","touchpoint":"specific touchpoints","insight":"specific insight"},{"stage":"Appeal","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Ask","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Act","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Advocate","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."}]},{"personaIdx":1,"stages":[]},{"personaIdx":2,"stages":[]}]}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error.message || "API returned error");
      }

      const text = data.content?.[0]?.text || "";
      if (!text) throw new Error("Empty response from API");

      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (!parsed.journeys || parsed.journeys.length === 0) {
        throw new Error("Invalid stages data");
      }

      setJourneys(parsed.journeys);
    } catch (e) {
      console.error("Journey generation error:", e.message);
      // Use smart unique fallbacks instead of identical generic text
      setJourneys(smartFallbacks);
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <Spinner message="Mapping complete journeys for your personas…" />;

  const activePersona = personas[activePersonaIdx];
  const activeJourney =
    journeys?.find((j) => j.personaIdx === activePersonaIdx)?.stages ||
    journeys?.[0]?.stages;
  const stage = activeJourney?.[activeStage];
  const stageInfo = JOURNEY_STAGES[activeStage];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 15,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 400,
          }}
        >
          Step 3 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: 0 }}>
          Customer Journeys
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 15 }}>
          Here is how each persona navigates the 5 stages to becoming your
          customer.
        </p>
      </div>

      {/* Persona tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {personas.map((p, i) => (
          <button
            key={i}
            onClick={() => {
              setActivePersonaIdx(i);
              setActiveStage(0);
            }}
            style={{
              padding: "10px 18px",
              borderRadius: 12,
              background: activePersonaIdx === i ? `${PRIMARY_BLUE}30` : CARD_BACKGROUND,
              border: `1px solid ${activePersonaIdx === i ? PRIMARY_BLUE : BORDER_COLOR}`,
              color: activePersonaIdx === i ? PRIMARY_BLUE : MUTED_COLOR,
              fontSize: 15,
              fontWeight: activePersonaIdx === i ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .2s ease-in-out",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Stage tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          overflowX: "auto",
          paddingBottom: 4,
        }}
      >
        {JOURNEY_STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveStage(i)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "none",
              background: activeStage === i ? PRIMARY_BLUE : CARD_BACKGROUND,
              color: activeStage === i ? "#FFFFFF" : MUTED_COLOR,
              fontSize: 15,
              fontWeight: activeStage === i ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .2s ease-in-out",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Stage card */}
      {stage && (
        <div
          style={{
            background: CARD_BACKGROUND,
            border: `1px solid ${BORDER_COLOR}`,
            borderRadius: 18,
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 14,
                color: PRIMARY_BLUE,
                fontWeight: 400,
                textTransform: "uppercase",
                marginBottom: 6,
                letterSpacing: '.05em',
              }}
            >
              {activePersona?.name}'s {stageInfo.label} Experience
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 400,
                color: TEXT_COLOR,
                marginBottom: 4,
              }}
            >
              {stageInfo.icon} {stage.stage}
            </div>
            <div style={{ fontSize: 15, color: MUTED_COLOR, lineHeight: 1.5 }}>
              {stageInfo.description}
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              { label: "Intent", value: stage.intent, icon: "🎯" },
              { label: "Behaviour", value: stage.behaviour, icon: "👁" },
              { label: "Pain Point", value: stage.painPoint, icon: "😤" },
              { label: "Touchpoint", value: stage.touchpoint, icon: "📍" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 18, marginTop: 2 }}>{item.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      color: MUTED_COLOR,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      marginBottom: 4,
                      fontWeight: 400,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 15, color: TEXT_COLOR, lineHeight: 1.6 }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              background: `${PRIMARY_BLUE}15`,
              border: `1px solid ${PRIMARY_BLUE}40`,
              borderRadius: 12,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: PRIMARY_BLUE,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 4,
                fontWeight: 400,
              }}
            >
              💡 Key Insight
            </div>
            <div style={{ fontSize: 15, color: TEXT_COLOR, lineHeight: 1.6 }}>
              {stage.insight}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <GradientButton secondary onClick={onBack}>
          ← Back
        </GradientButton>
        <GradientButton
          fullWidth
          onClick={() => {
            const updatedPersonas = personas.map((p, idx) => {
              const j = journeys?.find((j) => j.personaIdx === idx)?.stages;
              return { ...p, journey: j };
            });
            onNext(updatedPersonas);
          }}
        >
          View Personas & Journey →
        </GradientButton>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 4 — Audit
// ══════════════════════════════════════════════════════════════
function StepAudit({ onNext, onBack }) {
  const [answers, setAnswers] = useState({});
  const [activeStage, setActive] = useState(0);

  function toggle(stageId, idx) {
    const key = `${stageId}_${idx}`;
    setAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function stageScore(stageId) {
    const qs = JOURNEY_STAGES.find((s) => s.id === stageId).questions;
    const yes = qs.filter((_, i) => answers[`${stageId}_${i}`]).length;
    return { yes, total: qs.length, pct: Math.round((yes / qs.length) * 100) };
  }

  const totalYes = JOURNEY_STAGES.reduce(
    (acc, s) => acc + stageScore(s.id).yes,
    0,
  );
  const totalQ = JOURNEY_STAGES.reduce((acc, s) => acc + s.questions.length, 0);
  const totalPct = Math.round((totalYes / totalQ) * 100);
  const answeredAll = Object.keys(answers).length > 0;

  const stage = JOURNEY_STAGES[activeStage];
  const sc = stageScore(stage.id);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 15,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 400,
          }}
        >
          Step 4 of 5
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: 0 }}>
          Audit Your Business
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 15 }}>
          Check Yes for everything your business already does well. Be honest.
        </p>
      </div>

      {/* Overall progress */}
      <div
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `conic-gradient(${scoreColor(totalPct)} ${totalPct * 3.6}deg, ${BORDER_COLOR} 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: CARD_BACKGROUND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 400,
              color: TEXT_COLOR,
            }}
          >
            {totalPct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 400, color: TEXT_COLOR }}>
            Overall Score
          </div>
          <div style={{ fontSize: 15, color: MUTED_COLOR }}>
            {totalYes} of {totalQ} checks passed
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              background: `${scoreColor(totalPct)}20`,
              color: scoreColor(totalPct),
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            {scoreLabel(totalPct)}
          </span>
        </div>
      </div>

      {/* Stage tabs */}
      <div
        style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}
      >
        {JOURNEY_STAGES.map((s, i) => {
          const sc = stageScore(s.id);
          return (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: `1.5px solid ${activeStage === i ? PRIMARY_BLUE : BORDER_COLOR}`,
                background: activeStage === i ? `${PRIMARY_BLUE}25` : "transparent",
                color: activeStage === i ? PRIMARY_BLUE : MUTED_COLOR,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all .2s",
                fontWeight: activeStage === i ? 600 : 400,
              }}
            >
              {s.icon} {s.label}
              <span
                style={{
                  fontSize: 14,
                  color: scoreColor(sc.pct),
                  fontWeight: 400,
                }}
              >
                {sc.yes}/{sc.total}
              </span>
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER_COLOR}` }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: TEXT_COLOR,
              marginBottom: 4,
            }}
          >
            {stage.icon} {stage.label} Stage
          </div>
          <div style={{ fontSize: 15, color: MUTED_COLOR, lineHeight: 1.5 }}>{stage.description}</div>
        </div>

        <div>
          {stage.questions.map((q, i) => {
            const key = `${stage.id}_${i}`;
            const checked = !!answers[key];
            return (
              <div
                key={i}
                onClick={() => toggle(stage.id, i)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                  padding: "18px 22px",
                  borderBottom:
                    i < stage.questions.length - 1
                      ? `1px solid ${BORDER_COLOR}`
                      : "none",
                  cursor: "pointer",
                  background: checked ? `${PRIMARY_BLUE}15` : "transparent",
                  transition: "background .15s ease-in-out",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 8,
                    flexShrink: 0,
                    marginTop: 2,
                    border: `2px solid ${checked ? PRIMARY_BLUE : BORDER_COLOR}`,
                    background: checked ? PRIMARY_BLUE : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 15,
                    color: "#FFFFFF",
                    fontWeight: 400,
                    transition: "all .15s ease-in-out",
                  }}
                >
                  {checked ? "✓" : ""}
                </div>
                <span
                  style={{
                    fontSize: 15,
                    color: checked ? TEXT_COLOR : MUTED_COLOR,
                    lineHeight: 1.6,
                    transition: "color .15s ease-in-out",
                  }}
                >
                  {q}
                </span>
              </div>
            );
          })}
        </div>

        <div
          style={{
            padding: "16px 22px",
            borderTop: `1px solid ${BORDER_COLOR}`,
            background: "#FFFFFF",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 15, color: MUTED_COLOR, fontWeight: 400 }}>
              {stage.label} Score: {sc.yes}/{sc.total} ({sc.pct}%)
            </span>
            <span
              style={{
                fontSize: 14,
                padding: "4px 14px",
                borderRadius: 999,
                background: `${scoreColor(sc.pct)}25`,
                color: scoreColor(sc.pct),
                fontWeight: 400,
              }}
            >
              {scoreLabel(sc.pct)}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: BORDER_COLOR,
              borderRadius: 999,
              marginTop: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${sc.pct}%`,
                background: scoreColor(sc.pct),
                transition: "width .4s ease-in-out",
              }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {activeStage > 0 && (
          <GradientButton secondary onClick={() => setActive((a) => a - 1)}>
            ← Prev Stage
          </GradientButton>
        )}
        {activeStage < JOURNEY_STAGES.length - 1 && (
          <GradientButton onClick={() => setActive((a) => a + 1)}>
            Next Stage →
          </GradientButton>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <GradientButton secondary onClick={onBack}>
          ← Back
        </GradientButton>
        <GradientButton
          fullWidth
          disabled={!answeredAll}
          onClick={() => onNext(answers)}
        >
          See My Results →
        </GradientButton>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 5 — Results
// ══════════════════════════════════════════════════════════════
function StepResults({ business, personas, leadId, onRestart, onNavigatePsychology }) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Save report when opened
    try {
      if (leadId && auth.currentUser) {
        import("firebase/firestore").then(({ setDoc, doc }) => {
          setDoc(
            doc(db, "users", auth.currentUser.uid, "audits", leadId),
            {
              business: business || null,
              personas: personas || null,
              completedAt: new Date().toISOString()
            },
            { merge: true }
          ).catch((e) => console.error(e));
        });
      }
    } catch (e) {
      console.warn("Storage save failed:", e);
    }
  }, [business, personas, leadId]);

  // ── Build report HTML string (used for both download and email) ──
  function buildReportHTML() {
    const date = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const personasHTML = personas
      .map(
        (p) => `
      <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="color:${PRIMARY_BLUE};font-weight: 400;font-size: 15px;margin-bottom:2px;">
          ${p.name} <span style="color:#555;font-size: 15px;font-weight: 400;">— ${p.archetype}</span>
        </div>
        <div style="font-size: 14px;color:#aaa;">${p.age} · ${p.role}</div>
        <div style="margin-top:8px;font-size: 15px;color:#ccc;line-height:1.5;">"${p.summary}"</div>
      </div>
    `,
      )
      .join("");

    const mappedJourneysHTML = personas
      .map((p) => {
        if (!p.journey) return "";
        const stepsHTML = p.journey
          .map((step) => {
            const colors = {
              Aware: "#3b82f6",
              Appeal: "#a855f7",
              Ask: "#ec4899",
              Act: "#f97316",
              Advocate: "#22c55e",
            };
            const color = colors[step.stage] || "#aaa";
            return `
          <div style="padding-left:12px;border-left:2px solid ${color};margin-bottom:16px;">
            <div style="font-size: 14px;font-weight: 400;color:${color};text-transform:uppercase;letter-spacing:.05em;">${step.stage}</div>
            <div style="color:#ccc;margin-top:6px;font-size: 15px;line-height:1.5;">
              <div style="margin-bottom:4px;"><span style="color:#fff;">Intent:</span> ${step.intent}</div>
              <div style="margin-bottom:4px;"><span style="color:#fff;">Behaviour:</span> ${step.behaviour}</div>
              <div style="margin-bottom:4px;"><span style="color:#fff;">Pain Point:</span> ${step.painPoint}</div>
              <div style="margin-bottom:4px;"><span style="color:#fff;">Touchpoints:</span> ${step.touchpoint}</div>
              <div style="margin-top:8px;color:${PRIMARY_BLUE};font-weight: 400;">💡 Insight: ${step.insight}</div>
            </div>
          </div>
        `;
          })
          .join("");

        return `
        <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:20px;margin-bottom:16px;">
          <div style="color:#f5f5f5;font-weight: 400;font-size: 15px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1e1e1e;">${p.name}'s Journey</div>
          <div>${stepsHTML}</div>
        </div>
      `;
      })
      .join("");

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Customer Personas & Journey Report — ${business.industry}</title>
          <style>
            * {margin:0; padding:0; box-sizing:border-box; }
            body {background:#0a0a0a; color:#f5f5f5; font-family:'Segoe UI',sans-serif; padding:40px 24px; }
            .container {max-width:720px; margin:0 auto; }
          </style>
        </head>
        <body>
          <div class="container">

            <!-- Header -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:40px;padding-bottom:24px;border-bottom:1px solid #1e1e1e;">
              <div style="width:40px;height:40px;border-radius:10px;background:${PRIMARY_BLUE};display:flex;align-items:center;justify-content:center;font-size: 18px;font-weight: 400;color:#000;">H</div>
              <div>
                <div style="font-size: 15px;font-weight: 400;color:#f5f5f5;">PeoplePlex</div>
                <div style="font-size: 14px;color:#555;">peopleplex.in · Understand Your Customers</div>
              </div>
              <div style="margin-left:auto;text-align:right;">
                <div style="font-size: 14px;color:#555;">Generated on</div>
                <div style="font-size: 14px;color:#aaa;">${date}</div>
              </div>
            </div>

            <!-- Title -->
            <div style="margin-bottom:32px;">
              <div style="font-size: 14px;color:${PRIMARY_BLUE};letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Customer Personas Report</div>
              <h1 style="font-size: 22px;font-weight: 400;color:#f5f5f5;line-height:1.2;margin-bottom:8px;">
                Customer Personas & Mapped Journeys
              </h1>
              <p style="color:#777;font-size: 15px;">Prepared for: <span style="color:#aaa;">${business.businessName || business.industry}</span> · ${business.location}</p>
            </div>

            <!-- Business Info -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:20px;margin-bottom:24px;">
              <div style="font-size: 14px;color:${PRIMARY_BLUE};text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Business Details & Links</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="grid-column:1/-1;"><div style="font-size: 14px;color:#555;margin-bottom:4px;">BUSINESS NAME</div><div style="color:#f5f5f5;font-size: 15px;">${business.businessName || "Not provided"}</div></div>
                <div><div style="font-size: 14px;color:#555;margin-bottom:4px;">INDUSTRY</div><div style="color:#f5f5f5;font-size: 15px;">${business.industry}</div></div>
                <div><div style="font-size: 14px;color:#555;margin-bottom:4px;">LOCATION</div><div style="color:#f5f5f5;font-size: 15px;">${business.location}</div></div>
                
                ${business.websiteUrl ? `<div><div style="font-size: 14px;color:#555;margin-bottom:4px;">WEBSITE</div><div style="font-size: 15px;"><a href="${business.websiteUrl}" target="_blank" style="color:${PRIMARY_BLUE};text-decoration:none;">${business.websiteUrl}</a></div></div>` : ""}
                ${business.gmbUrl ? `<div><div style="font-size: 14px;color:#555;margin-bottom:4px;">GOOGLE GMB</div><div style="font-size: 15px;"><a href="${business.gmbUrl}" target="_blank" style="color:${PRIMARY_BLUE};text-decoration:none;">View Maps</a></div></div>` : ""}
                ${business.socialUrl ? `<div><div style="font-size: 14px;color:#555;margin-bottom:4px;">SOCIAL MEDIA</div><div style="font-size: 15px;"><a href="${business.socialUrl}" target="_blank" style="color:${PRIMARY_BLUE};text-decoration:none;">View Profile</a></div></div>` : ""}

                ${business.additionalNotes ? `<div style="grid-column:1/-1;"><div style="font-size: 14px;color:#555;margin-bottom:4px;">ADDITIONAL NOTES</div><div style="color:#f5f5f5;font-size: 15px;line-height:1.5;">${business.additionalNotes}</div></div>` : ""}
                <div style="grid-column:1/-1;"><div style="font-size: 14px;color:#555;margin-bottom:4px;">CUSTOMER PERSONAS AUDITED</div><div style="color:#f5f5f5;font-size: 15px;">${personas.map((p) => p.name).join(", ")}</div></div>
              </div>
            </div>

            <!-- Overall Score -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:28px;margin-bottom:24px;text-align:center;">
              <div style="font-size: 72px;font-weight: 400;color:${scoreColor(totalPct)};line-height:1;">${totalPct}%</div>
              <div style="font-size: 18px;font-weight: 400;color:#f5f5f5;margin-top:8px;">${scoreLabel(totalPct)} — ${totalYes}/${totalQ} checks passed</div>
              <div style="font-size: 14px;color:#555;margin-top:6px;">
                Weakest: <span style="color:#ef4444;">${weakest.label} (${weakest.pct}%)</span> &nbsp;·&nbsp;
                Strongest: <span style="color:#22c55e;">${strongest.label} (${strongest.pct}%)</span>
              </div>
            </div>

            <!-- Stage Scores Table -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;overflow:hidden;margin-bottom:24px;">
              <div style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
                <div style="font-size: 14px;font-weight: 400;color:#f5f5f5;">Stage-by-Stage Breakdown</div>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                <div style="grid-column:1/-1;"><div style="font-size: 14px;color:#555;margin-bottom:4px;">BUSINESS NAME</div><div style="color:#f5f5f5;font-size: 15px;">${business.businessName || "Not provided"}</div></div>
                <div><div style="font-size: 14px;color:#555;margin-bottom:4px;">INDUSTRY</div><div style="color:#f5f5f5;font-size: 15px;">${business.industry}</div></div>
                <div><div style="font-size: 14px;color:#555;margin-bottom:4px;">TIER</div><div style="color:#f5f5f5;font-size: 15px;">${business.pricingTier.label}</div></div>
              </div>
            </div>

            <!-- Personas -->
            <div style="margin-bottom:24px;">
              <h3 style="color:#f5f5f5;font-size: 18px;margin-bottom:16px;">Generated Personas</h3>
              ${personasHTML}
            </div>

            <!-- Mapped Journeys -->
            <div style="margin-bottom:24px;">
              <h3 style="color:#f5f5f5;font-size: 18px;margin-bottom:16px;">Mapped Customer Journeys</h3>
              ${mappedJourneysHTML}
            </div>

            <!-- Viral Marketing CTA -->
            <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1e1e1e;text-align:center;">
              <div style="font-size: 18px;font-weight: 400;color:#f5f5f5;margin-bottom:8px;">Want to uncover the hidden gaps in your own business?</div>
              <p style="font-size: 14px;color:#777;margin-bottom:16px;line-height:1.5;">
                Get a free, AI-generated Customer Personas & Journey map designed specifically for your industry. Find out exactly where you're losing money and the quickest way to fix it.
              </p>
              <a href="${window.location.origin}" style="
      display:inline-block;padding:12px 24px;background:transparent;border:2px solid ${PRIMARY_BLUE};
      color:${PRIMARY_BLUE};font-weight: 400;border-radius:10px;text-decoration:none;font-size: 15px;
    ">Generate Personas For Your Business →</a>
              <div style="margin-top:24px;font-size: 14px;color:#555;">
                peopleplex.in · Powered by PeoplePlex
              </div>
            </div>

          </div>
        </body>
      </html>`;
  }

  // ── Share Report URL ───
  async function handleShare() {
    setDownloading(true);
    try {
      const html = buildReportHTML();
      // Write HTML to public firestore
      const { setDoc, doc } = await import("firebase/firestore");
      await setDoc(doc(db, "public_reports", leadId), {
        html,
        createdAt: new Date().toISOString(),
      });

      const shareUrl = `${window.location.origin}?report=${leadId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert("Report URL safely copied to clipboard!\n\n" + shareUrl);
      setDownloading(false);
    } catch (e) {
      console.error(e);
      alert("Failed to create sharing link.");
      setDownloading(false);
    }
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 15,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 400,
          }}
        >
          Your Completed Report
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, margin: 0 }}>
          Customer Journey Audit
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 15 }}>
          Comprehensive analysis of your current business performance.
        </p>
      </div>

      <div
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 16,
          padding: "24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: MUTED_COLOR,
            textTransform: "uppercase",
            marginBottom: 16,
            letterSpacing: '.05em',
          }}
        >
          Input Overview
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            fontSize: 15,
          }}
        >
          <div>
            <span style={{ color: MUTED_COLOR, fontWeight: 400 }}>Industry:</span> {business.industry}
          </div>
          <div>
            <span style={{ color: MUTED_COLOR, fontWeight: 400 }}>Location:</span> {business.location}
          </div>
          <div>
            <span style={{ color: MUTED_COLOR, fontWeight: 400 }}>Market Tier:</span>{" "}
            {business.pricingTier.label}
          </div>
          <div style={{ marginTop: 8, color: TEXT_COLOR, lineHeight: 1.6, fontStyle: 'italic' }}>
            "{business.description}"
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: TEXT_COLOR,
            marginBottom: 16,
          }}
        >
          Generated Personas
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {personas.map((p, i) => (
            <div
              key={i}
              style={{
                background: CARD_BACKGROUND,
                border: `1px solid ${BORDER_COLOR}`,
                borderRadius: 14,
                padding: 20,
              }}
            >
              <div
                style={{
                  color: PRIMARY_BLUE,
                  fontWeight: 400,
                  fontSize: 18,
                  marginBottom: 4,
                }}
              >
                {p.name}{" "}
                <span style={{ color: MUTED_COLOR, fontSize: 15, fontWeight: 400 }}>
                  — {p.archetype}
                </span>
              </div>
              <div style={{ fontSize: 15, color: MUTED_COLOR }}>
                {p.age} · {p.role}
              </div>
              <div style={{ marginTop: 10, fontSize: 15, lineHeight: 1.6 }}>
                "{p.summary}"
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Journeys displayed in Step 5 */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: TEXT_COLOR,
            marginBottom: 16,
          }}
        >
          Mapped Customer Journeys
        </div>
        {personas.map((p, i) => (
          <div
            key={i}
            style={{
              background: CARD_BACKGROUND,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                color: TEXT_COLOR,
                fontWeight: 400,
                fontSize: 18,
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: `1px solid ${BORDER_COLOR}`,
              }}
            >
              {p.name}'s Journey
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {p.journey &&
                p.journey.map((step, idx) => {
                  const colors = {
                    Aware: "#3b82f6",
                    Appeal: "#a855f7",
                    Ask: "#ec4899",
                    Act: "#f97316",
                    Advocate: "#22c55e",
                  };
                  const color = colors[step.stage] || "#aaa";
                  return (
                    <div
                      key={idx}
                      style={{
                        paddingLeft: 14,
                        borderLeft: `2px solid ${color}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 400,
                          color: color,
                          textTransform: "uppercase",
                          letterSpacing: ".05em",
                        }}
                      >
                        {step.stage}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          color: MUTED_COLOR,
                          marginTop: 6,
                          lineHeight: 1.6,
                          paddingBottom: 12,
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: TEXT_COLOR }}>Intent:</span>{" "}
                          <span style={{ color: MUTED_COLOR }}>{step.intent}</span>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: TEXT_COLOR }}>Behaviour:</span>{" "}
                          <span style={{ color: MUTED_COLOR }}>{step.behaviour}</span>
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <span style={{ color: TEXT_COLOR }}>Pain Point:</span>{" "}
                          <span style={{ color: MUTED_COLOR }}>{step.painPoint}</span>
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <span style={{ color: TEXT_COLOR }}>
                            Touchpoints:
                          </span>{" "}
                          <span style={{ color: MUTED_COLOR }}>{step.touchpoint}</span>
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            color: PRIMARY_BLUE,
                            fontWeight: 400,
                          }}
                        >
                          💡 Insight: {step.insight}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>


      {/* Report Actions */}
      <div
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 15,
            fontWeight: 400,
            color: TEXT_COLOR,
            marginBottom: 8,
          }}
        >
          📄 Your Full Report is Ready
        </div>
        <p
          style={{
            fontSize: 15,
            color: MUTED_COLOR,
            marginBottom: 16,
            lineHeight: 1.6,
          }}
        >
          Includes your complete persona breakdown and mapped journeys. Save it or send it to your inbox.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Download Button */}
          <button
            onClick={handleShare}
            disabled={downloading}
            style={{
              flex: 1,
              minWidth: 140,
              padding: "14px 20px",
              borderRadius: 12,
              border: `1.5px solid ${PRIMARY_BLUE}`,
              background: "transparent",
              color: PRIMARY_BLUE,
              fontSize: 15,
              fontWeight: 400,
              cursor: downloading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all .2s",
            }}
          >
            {downloading ? "⏳ Generating Link…" : "🔗 Share Report URL"}
          </button>
        </div>

        {/* Instruction note */}
        <div
          style={{
            marginTop: 14,
            padding: "12px 16px",
            background: "#FFFFFF",
            borderRadius: 10,
            fontSize: 14,
            color: MUTED_COLOR,
            lineHeight: 1.6,
          }}
        >
          💡 <span style={{ color: TEXT_COLOR }}>Share Report URL</span>{" "}
          generates a unique, public link you can instantly send to your
          team or stakeholders so they can view the full breakdown.
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          background: `${PRIMARY_BLUE}15`,
          border: `1px solid ${PRIMARY_BLUE}40`,
          borderRadius: 20,
          padding: 28,
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: TEXT_COLOR,
            marginBottom: 8,
          }}
        >
          Ready for deeper psychological triggers?
        </div>
        <p
          style={{
            fontSize: 15,
            color: MUTED_COLOR,
            marginBottom: 24,
            lineHeight: 1.7,
          }}
        >
          Now that you have your foundational personas, use our Psychology Tool to dig into their deepest motivations, pain points, and buyer logic.
        </p>

        {/* TWO CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Lead to Psychology Audit */}
          <GradientButton
            onClick={onNavigatePsychology}
          >
            🧠 Launch Customer Psychology AI →
          </GradientButton>

          {/* Secondary: Share Report */}
          <GradientButton
            secondary
            onClick={handleShare}
            disabled={downloading}
          >
            {downloading ? "⏳ Generating..." : "🔗 Share Report URL"}
          </GradientButton>
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={onRestart}
            style={{
              background: "none",
              border: "none",
              color: MUTED_COLOR,
              fontSize: 15,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Start a new analysis
          </button>
        </div>
      </div>
    </div >
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const urlParams = new URLSearchParams(window.location.search);
  const sharedReportId = urlParams.get("report");

  if (sharedReportId) {
    return <SharedReportView reportId={sharedReportId} />;
  }

  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState(null);
  const [personas, setPersonas] = useState(null);
  const [answers, setAnswers] = useState({});
  const [leadId, setLeadId] = useState(null);
  const [user, setUser] = useState(undefined);
  const [activeProject, setActiveProject] = useState(null); // { id, businessName, industry, tools, ... }

  const isAudit = location.pathname === "/journey";
  const isPsychology = location.pathname === "/psychology";
  const isCompetitor = location.pathname === "/competitor";
  const showDashboard = location.pathname === "/history";
  const showSettings = location.pathname === "/settings";
  const isToolsDashboard = location.pathname === "/" || location.pathname === "/tools" || location.pathname === "/setup";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  function restart() {
    setStep(0);
    setBusiness(null);
    setPersonas(null);
    setAnswers({});
    setLeadId(null);
  }

  // ── Save tool completion to Firestore project ─────────────────
  async function markToolComplete(toolId) {
    if (!activeProject || !auth.currentUser) return;
    const updatedTools = { ...(activeProject.tools || {}), [toolId]: "complete" };
    const updatedProject = { ...activeProject, tools: updatedTools };
    setActiveProject(updatedProject);
    try {
      await setDoc(
        doc(db, "users", auth.currentUser.uid, "projects", activeProject.id),
        { tools: updatedTools },
        { merge: true }
      );
    } catch (e) {
      console.error("Failed to update tool status", e);
    }
  }

  if (user === undefined)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DARK_MODE_BACKGROUND,
          color: TEXT_COLOR,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner message="Loading..." />
      </div>
    );
  if (!user) return <AuthScreen />;;

  return (
    <div className="layout-container">
      <style>{`
        .layout-container {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
          background: ${DARK_MODE_BACKGROUND};
          font-family: 'Inter Tight', system-ui, sans-serif;
          color: ${TEXT_COLOR};
        }
        .side-nav {
          width: 260px;
          border-right: 1px solid ${BORDER_COLOR};
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          gap: 16px;
          background: ${CARD_BACKGROUND};
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 50;
        }
        .main-content {
          flex: 1;
          height: 100vh;
          overflow-y: auto;
          position: relative;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 400;
          font-size: 15px;
          text-align: left;
          transition: all .2s;
        }
        .nav-btn.active {
          background: ${PRIMARY_BLUE};
          color: ${TEXT_COLOR};
        }
        .nav-btn.inactive {
          background: transparent;
          color: ${MUTED_COLOR};
        }
        .nav-btn.inactive:hover {
          background: rgba(255,255,255,0.08);
          color: ${TEXT_COLOR};
        }
        .nav-btn-icon {
          font-size: 18px;
          display: none; /* Hidden by default on desktop */
        }
        @media (max-width: 768px) {
          .layout-container {
            flex-direction: column;
          }
          .side-nav {
            width: 100%;
            height: 70px;
            flex-direction: row;
            border-right: none;
            border-top: 1px solid ${BORDER_COLOR};
            bottom: 0;
            top: auto;
            position: fixed;
            justify-content: space-around;
            padding: 0 10px;
            align-items: center;
            gap: 0;
          }
          .logo-section, .spacer {
            display: none !important;
          }
          .nav-btn {
            flex-direction: column;
            gap: 4px;
            padding: 10px;
            font-size: 14px;
            border-radius: 8px;
            justify-content: center;
          }
          .main-content {
            padding-bottom: 70px;
          }
          .nav-btn-icon {
            display: block; /* Show icons on mobile bottom nav */
          }
        }
      `}</style>

      {/* Side / Bottom Navigation */}
      <div className="side-nav">
        <div
          className="logo-section"
          style={{
            padding: "0 8px 16px",
            marginBottom: 16,
            borderBottom: `1px solid ${BORDER_COLOR}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: PRIMARY_BLUE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 400,
              color: "#FFFFFF",
            }}
          >
            P
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 400, color: TEXT_COLOR }}>
              PeoplePlex
            </div>
            <div style={{ fontSize: 14, color: MUTED_COLOR }}>Growth Tools</div>
          </div>
        </div>

        <button
          className={`nav-btn ${isToolsDashboard ? "active" : "inactive"}`}
          onClick={() => navigate("/")}
        >
          <span className="nav-btn-icon">📦</span>
          <span>{activeProject ? activeProject.businessName : "All Tools"}</span>
        </button>

        <button
          className={`nav-btn ${isAudit ? "active" : "inactive"}`}
          onClick={() => {
            navigate("/journey");
          }}
        >
          <span className="nav-btn-icon">📝</span>
          <span>Journey Audit</span>
        </button>

        <button
          className={`nav-btn ${isPsychology ? "active" : "inactive"}`}
          onClick={() => navigate("/psychology")}
        >
          <span className="nav-btn-icon">🧠</span>
          <span>Psychology Audit</span>
        </button>

        <button
          className={`nav-btn ${isCompetitor ? "active" : "inactive"}`}
          onClick={() => navigate("/competitor")}
        >
          <span className="nav-btn-icon">🎯</span>
          <span>Competitor Analysis</span>
        </button>

        <button
          className={`nav-btn ${showDashboard ? "active" : "inactive"}`}
          onClick={() => navigate("/history")}
        >
          <span className="nav-btn-icon">📊</span>
          <span>My History</span>
        </button>

        <button
          className={`nav-btn ${showSettings ? "active" : "inactive"}`}
          onClick={() => navigate("/settings")}
        >
          <span className="nav-btn-icon">⚙️</span>
          <span>Settings</span>
        </button>

        <div className="spacer" style={{ flex: 1 }} />

        <button
          className="nav-btn inactive"
          onClick={() => signOut(auth)}
          style={{ color: "#FF3B30" }}
        >
          <span className="nav-btn-icon">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={
            !activeProject ? (
              <ProjectsDashboard
                onSelectProject={(proj) => {
                  setActiveProject(proj);
                  setBusiness({
                    businessName: proj.businessName,
                    industry: proj.industry,
                    description: proj.description,
                    location: proj.location,
                    websiteUrl: proj.websiteUrl || "",
                    gmbUrl: proj.gmbUrl || "",
                    socialUrl: proj.socialUrl || "",
                    pricingTier: proj.pricingTier || null,
                    additionalNotes: proj.additionalNotes || "",
                    analysis: proj.analysis || {},
                  });
                  setStep(1);
                }}
                onCreateProject={() => {
                  setActiveProject(null);
                  setBusiness(null);
                  setStep(0);
                  navigate("/setup");
                }}
              />
            ) : (
              <ToolsDashboard
                business={business}
                project={activeProject}
                onRestart={() => {
                  setBusiness(null);
                  setActiveProject(null);
                  setStep(0);
                }}
                onSwitchProject={() => {
                  setBusiness(null);
                  setActiveProject(null);
                  setStep(0);
                }}
                setupWizard={
                  <StepDescribe
                    onNext={async (d) => {
                      const newProjectId = `project_${Date.now()}`;
                      const projectData = {
                        id: newProjectId,
                        businessName: d.businessName,
                        industry: d.industry,
                        description: d.description,
                        location: d.location,
                        websiteUrl: d.websiteUrl || "",
                        gmbUrl: d.gmbUrl || "",
                        socialUrl: d.socialUrl || "",
                        pricingTier: d.pricingTier || null,
                        additionalNotes: d.additionalNotes || "",
                        analysis: d.analysis || {},
                        status: "active",
                        tools: {},
                        createdAt: new Date().toISOString(),
                        source: "PeoplePlex App",
                      };
                      setBusiness(d);
                      setLeadId(newProjectId);
                      const newProj = projectData;
                      setActiveProject(newProj);
                      if (auth.currentUser) {
                        setDoc(
                          doc(db, "users", auth.currentUser.uid, "projects", newProjectId),
                          projectData
                        ).catch(err => console.error("Firestore save error:", err));
                      }
                      setStep(1);
                    }}
                  />
                }
              />
            )
          } />

          <Route path="/setup" element={
            <ToolsDashboard
              business={null}
              project={null}
              onRestart={() => { setBusiness(null); setActiveProject(null); setStep(0); navigate("/"); }}
              onSwitchProject={() => navigate("/")}
              setupWizard={
                <StepDescribe
                  onNext={async (d) => {
                    const newProjectId = `project_${Date.now()}`;
                    const projectData = {
                      id: newProjectId,
                      businessName: d.businessName,
                      industry: d.industry,
                      description: d.description,
                      location: d.location,
                      websiteUrl: d.websiteUrl || "",
                      gmbUrl: d.gmbUrl || "",
                      socialUrl: d.socialUrl || "",
                      pricingTier: d.pricingTier || null,
                      additionalNotes: d.additionalNotes || "",
                      analysis: d.analysis || {},
                      status: "active",
                      tools: {},
                      createdAt: new Date().toISOString(),
                      source: "PeoplePlex App",
                    };
                    setBusiness(d);
                    setLeadId(newProjectId);
                    setActiveProject(projectData);
                    if (auth.currentUser) {
                      setDoc(
                        doc(db, "users", auth.currentUser.uid, "projects", newProjectId),
                        projectData
                      ).catch(err => console.error("Firestore save error:", err));
                    }
                    setStep(1);
                    navigate("/");
                  }}
                />
              }
            />
          } />
          <Route path="/psychology" element={<CustomerPsychology business={business} personas={personas} />} />
          <Route path="/competitor" element={<CompetitorAnalysis business={business} onComplete={() => markToolComplete("competitor")} />} />

          <Route path="/settings" element={
            <UserProfileSettings
              user={user}
              onClose={() => navigate("/")}
            />
          } />

          <Route path="/history" element={
            <UserDashboard
              onClose={() => navigate("/")}
              onLoadAudit={(lead, targetStep) => {
                setBusiness(lead.business);
                setPersonas(lead.personas);
                setAnswers(lead.answers);
                setLeadId(lead.id);
                setStep(targetStep);
                navigate("/journey");
              }}
            />
          } />

          <Route path="/journey" element={
            <div
              style={{
                maxWidth: 800,
                margin: "0 auto",
                padding: "40px 20px 60px",
              }}
            >
              {!business ? (
                <div style={{ textAlign: "center", paddingTop: 80 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                  <h2 style={{ fontSize: 22, fontWeight: 400, color: TEXT_COLOR, marginBottom: 16 }}>Project Not Setup</h2>
                  <p style={{ color: MUTED_COLOR, marginBottom: 32, fontSize: 15 }}>Please complete the Project Setup Wizard on the Dashboard to access this tool.</p>
                  <GradientButton onClick={() => navigate("/")}>
                    Go to Dashboard →
                  </GradientButton>
                </div>
              ) : (
                <>
                  {step > 0 && <Steps current={step} />}

                  {step === 0 && <StepDescribe onNext={(d) => { setBusiness(d); setStep(1); }} />}
                  {step === 1 && (
                    <StepPersonas
                      business={business}
                      onNext={(p) => {
                        setPersonas(p);
                        setStep(2);
                      }}
                      onBack={() => setStep(0)}
                    />
                  )}
                  {step === 2 && (
                    <StepJourney
                      business={business}
                      personas={personas}
                      onNext={(updatedPersonas) => {
                        if (updatedPersonas) setPersonas(updatedPersonas);
                        setStep(3);
                      }}
                      onBack={() => setStep(1)}
                    />
                  )}
                  {step === 3 && (
                    <StepResults
                      business={business}
                      personas={personas}
                      answers={{}}
                      leadId={leadId}
                      onRestart={restart}
                      onNavigatePsychology={() => navigate("/psychology")}
                      onComplete={() => markToolComplete("journey")}
                    />
                  )}
                </>
              )}
            </div>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
