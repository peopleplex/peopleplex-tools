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

const BOOKING_LINK = "https://iamhariharan.com/training-institutes";

// ── Brand tokens ──────────────────────────────────────────────
const PRIMARY_BLUE = "#007AFF";
const DARK_MODE_BACKGROUND = "#000000";
const CARD_BACKGROUND = "#1C1C1E";
const BORDER_COLOR = "#3A3A3C";
const MUTED_COLOR = "#8E8E93";
const TEXT_COLOR = "#FFFFFF";

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
      fontSize: 14,
      cursor: "pointer",
      transition: "all .2s",
      fontWeight: 500,
    }}
  >
    {children}
  </button>
);

const Input = ({ label, placeholder, value, onChange, textarea }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <label
      style={{
        fontSize: 14,
        color: MUTED_COLOR,
        letterSpacing: ".02em",
        textTransform: "uppercase",
        fontWeight: 600,
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
          fontSize: 16,
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
          fontSize: 16,
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
      background: secondary ? "transparent" : disabled ? BORDER_COLOR : `linear-gradient(45deg, ${PRIMARY_BLUE}, #00AFFF)`,
      color: disabled ? MUTED_COLOR : secondary ? MUTED_COLOR : "#FFFFFF",
      fontSize: 16,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .2s ease-in-out",
      letterSpacing: ".02em",
      boxShadow: secondary || disabled ? "none" : "0 4px 15px 0 rgba(0, 122, 255, 0.35)",
    }}
  >
    {children}
  </button>
);

// ── Step indicator ─────────────────────────────────────────────
const Steps = ({ current }) => {
  const steps = ["Describe", "Personas", "Journey", "Audit", "Results"];
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
                  i < current ? `linear-gradient(45deg, ${PRIMARY_BLUE}, #00AFFF)` : i === current ? CARD_BACKGROUND : "transparent",
                border: `2px solid ${i <= current ? PRIMARY_BLUE : BORDER_COLOR}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: i <= current ? "#FFFFFF" : MUTED_COLOR,
                transition: "all .3s ease-in-out",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 12,
                color: i === current ? PRIMARY_BLUE : MUTED_COLOR,
                whiteSpace: "nowrap",
                fontWeight: i === current ? 600 : 400,
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
                background: i < current ? PRIMARY_BLUE : BORDER_COLOR,
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
    <p style={{ color: MUTED_COLOR, fontSize: 16 }}>{message}</p>
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

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [gmbUrl, setGmbUrl] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [pricingTier, setPricing] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const step1Ready =
    businessName.trim() &&
    industry.trim() &&
    description.trim() &&
    location.trim();
  const step3Ready = pricingTier !== null;

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
            <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: "0 0 8px 0" }}>Step 1: Core Identity</h2>
            <p style={{ color: MUTED_COLOR, margin: 0, fontSize: 16 }}>Establish the foundational identity of the business.</p>
          </>
        )}
        {setupStep === 2 && (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: "0 0 8px 0" }}>Step 2: Digital Footprint</h2>
            <p style={{ color: MUTED_COLOR, margin: 0, fontSize: 16 }}>Link their core channels so the AI can analyze their current presence.</p>
          </>
        )}
        {setupStep === 3 && (
          <>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: "0 0 8px 0" }}>Step 3: Market Positioning</h2>
            <p style={{ color: MUTED_COLOR, margin: 0, fontSize: 16 }}>Determine where their offer sits in the wider market ecosystem.</p>
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
            label="Social Media URL (Optional)"
            placeholder="https://instagram.com/yourbrand"
            value={socialUrl}
            onChange={setSocialUrl}
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
                fontWeight: 700,
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
                fontSize: 14,
                color: MUTED_COLOR,
                letterSpacing: ".02em",
                textTransform: "uppercase",
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              Pricing Tier
            </div>
            <p
              style={{
                fontSize: 14,
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
                            fontSize: 16,
                            fontWeight: 700,
                            color: sel ? TEXT_COLOR : MUTED_COLOR,
                          }}
                        >
                          {tier.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            padding: "3px 10px",
                            borderRadius: 999,
                            background: tier.color + "33",
                            color: tier.color,
                            fontWeight: 600,
                          }}
                        >
                          {tier.tag}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: 14, color: MUTED_COLOR, lineHeight: 1.5 }}
                      >
                        {tier.description}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: sel ? tier.color : "#666",
                          marginTop: 6,
                          fontWeight: 500,
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
                    fontSize: 13,
                    color: pricingTier.color,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {pricingTier.icon} {pricingTier.tag} Customer Insight
                </div>
                <div style={{ fontSize: 14, color: MUTED_COLOR, lineHeight: 1.6 }}>
                  {TIER_INSIGHTS[pricingTier.id]}
                </div>
              </div>
            )}
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
                fontWeight: 700,
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
                  onNext({
                    businessName,
                    industry,
                    description,
                    location,
                    websiteUrl,
                    gmbUrl,
                    socialUrl,
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
            fontSize: 14,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Step 2 of 5
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: 0 }}>
          Who Is Your Customer?
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 16 }}>
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
                  <span style={{ fontSize: 20, fontWeight: 800, color: TEXT_COLOR }}>
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 12px",
                      borderRadius: 999,
                      background: `${PRIMARY_BLUE}30`,
                      color: PRIMARY_BLUE,
                      fontWeight: 600,
                    }}
                  >
                    {p.archetype}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: MUTED_COLOR }}>
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
                    background: "#1C1C1E",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ fontSize: 12, color: MUTED_COLOR, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, color: TEXT_COLOR, lineHeight: 1.5 }}>
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
Social Media: ${business.socialUrl || "Not provided"}
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
            fontSize: 14,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Step 3 of 5
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: 0 }}>
          Customer Journeys
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 16 }}>
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
              fontSize: 14,
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
                fontSize: 13,
                color: PRIMARY_BLUE,
                fontWeight: 800,
                textTransform: "uppercase",
                marginBottom: 6,
                letterSpacing: '.05em',
              }}
            >
              {activePersona?.name}'s {stageInfo.label} Experience
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
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
                  background: "#1C1C1E",
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 20, marginTop: 2 }}>{item.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: MUTED_COLOR,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      marginBottom: 4,
                      fontWeight: 600,
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
                fontSize: 12,
                color: PRIMARY_BLUE,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 4,
                fontWeight: 700,
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
          Audit Your Business →
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
            fontSize: 14,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Step 4 of 5
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: 0 }}>
          Audit Your Business
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 16 }}>
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
              fontSize: 14,
              fontWeight: 800,
              color: TEXT_COLOR,
            }}
          >
            {totalPct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_COLOR }}>
            Overall Score
          </div>
          <div style={{ fontSize: 14, color: MUTED_COLOR }}>
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
              fontSize: 13,
              fontWeight: 700,
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
                fontSize: 14,
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
                  fontSize: 12,
                  color: scoreColor(sc.pct),
                  fontWeight: 700,
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
              fontWeight: 700,
              color: TEXT_COLOR,
              marginBottom: 4,
            }}
          >
            {stage.icon} {stage.label} Stage
          </div>
          <div style={{ fontSize: 14, color: MUTED_COLOR, lineHeight: 1.5 }}>{stage.description}</div>
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
                    fontSize: 14,
                    color: "#FFFFFF",
                    fontWeight: 800,
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
            background: "#1C1C1E",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, color: MUTED_COLOR, fontWeight: 500 }}>
              {stage.label} Score: {sc.yes}/{sc.total} ({sc.pct}%)
            </span>
            <span
              style={{
                fontSize: 13,
                padding: "4px 14px",
                borderRadius: 999,
                background: `${scoreColor(sc.pct)}25`,
                color: scoreColor(sc.pct),
                fontWeight: 700,
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
function StepResults({ business, personas, answers, leadId, onRestart, onNavigatePsychology }) {
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [showAutomations, setShowAutomations] = useState(false);

  // Calculate scores
  const stageScores = JOURNEY_STAGES.map((s) => {
    const yes = s.questions.filter((_, i) => answers[`${s.id}_${i}`]).length;
    return {
      ...s,
      yes,
      total: s.questions.length,
      pct: Math.round((yes / s.questions.length) * 100),
    };
  });
  const totalYes = stageScores.reduce((a, s) => a + s.yes, 0);
  const totalQ = stageScores.reduce((a, s) => a + s.total, 0);
  const totalPct = Math.round((totalYes / totalQ) * 100);
  const weakest = [...stageScores].sort((a, b) => a.pct - b.pct)[0];
  const strongest = [...stageScores].sort((a, b) => b.pct - a.pct)[0];
  const date = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    generateResults();
  }, []);

  // ── Generate AI insight ───────────────────────────────────
  async function generateResults() {
    setLoadingAI(true);

    const persona = personas?.[0] || {};
    const updateData = {
      overallScore: totalPct,
      weakestStage: weakest.label,
      strongestStage: strongest.label,
      stageScores: stageScores.map((s) => ({
        stage: s.label,
        pct: s.pct,
      })),
      personaName: persona.name || "Unknown",
      personaArchetype: persona.archetype || "Unknown",
      completedAt: new Date().toISOString(),
      business: business || null,
      personas: personas || null,
      answers: answers || {},
    };

    // ── Update persistent storage with scores ──
    try {
      if (leadId && auth.currentUser) {
        setDoc(
          doc(db, "users", auth.currentUser.uid, "audits", leadId),
          updateData,
          { merge: true },
        ).catch((err) => {
          console.error("Firestore save error (Step 5):", err);
        });
      }
    } catch (storageErr) {
      console.warn("Storage save failed:", storageErr);
    }

    try {
      const scoresSummary = stageScores
        .map((s) => `${s.label}: ${s.pct}%`)
        .join(", ");
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a marketing consultant giving personalised advice.

Business Name: ${business.businessName}
Industry: ${business.industry}
Location: ${business.location}
Website: ${business.websiteUrl || "Not provided"}
Google My Business: ${business.gmbUrl || "Not provided"}
Social Media: ${business.socialUrl || "Not provided"}
Additional Notes: ${business.additionalNotes || "None"}

Overall Business Journey Score: ${totalPct}%
Strongest Stage: ${strongest.label} (${strongest.pct}%)
Weakest Stage: ${weakest.label} (${weakest.pct}%)

IMPORTANT: Do NOT confuse a stage score with the Overall Business Journey Score. The overall score is exactly ${totalPct}%.

Write a personalised insight report based on their weakest stage and the URLs provided. Return EXACTLY this JSON structure (no markdown borders, just the raw JSON object):
{
  "websiteReport": "A critical analysis of their Website Structure, Content, SEO and overall online presence strictly based on the URLs provided. If URLs are weak or missing, call it out.",
  "keyTakeaways": "A paragraph outlining the biggest gap (weakest stage) and specifically what it is costing them right now.",
  "nextPriorityStep": "A paragraph stating the single most important thing to fix first and why it will have the biggest impact."
}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const txt = data.content?.[0]?.text || "";
      let parsed = null;
      try {
        parsed = JSON.parse(txt);
      } catch (err) {
        const match = txt.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
          } catch (e) { }
        }
      }
      if (parsed && parsed.websiteReport) {
        setAiInsight(parsed);
      } else {
        setAiInsight(getFallbackInsight());
      }
    } catch (e) {
      setAiInsight(getFallbackInsight());
    } finally {
      setLoadingAI(false);
    }
  }

  function getFallbackInsight() {
    return {
      websiteReport: `Because we don't have detailed metrics for your links yet, we recommend manually reviewing the user experience on your site and social pages. Ensure your strongest asset (${strongest.label} at ${strongest.pct}%) is visible everywhere.`,
      keyTakeaways: `Your ${weakest.label} stage at ${weakest.pct}% is where you're losing customers silently. At this stage, potential customers are evaluating whether to trust you — and most are leaving before making contact. Every customer lost here is revenue you never see.`,
      nextPriorityStep: `Focus all energy on the ${weakest.label} stage first. Even a 20% improvement here can significantly increase the number of customers who reach out — without spending more on ads or marketing.`,
    };
  }

  // ── Build report HTML string (used for both download and email) ──
  function buildReportHTML() {
    const stageRows = stageScores
      .map(
        (s) => `
      <tr>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1e1e;color:#f5f5f5;font-weight:600;">
          ${s.icon} ${s.label}
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1e1e;text-align:center;">
          <span style="color:${scoreColor(s.pct)};font-weight:700;">${s.pct}%</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1e1e;text-align:center;">
          <span style="color:#aaa;">${s.yes}/${s.total}</span>
        </td>
        <td style="padding:12px 16px;border-bottom:1px solid #1e1e1e;text-align:center;">
          <span style="
            padding:3px 10px;border-radius:999px;font-size:12px;font-weight:700;
            background:${scoreColor(s.pct)}22;color:${scoreColor(s.pct)};
          ">${scoreLabel(s.pct)}</span>
        </td>
      </tr>
    `,
      )
      .join("");

    const checkedItems = JOURNEY_STAGES.map((s) => {
      const passed = s.questions.filter((_, i) => answers[`${s.id}_${i}`]);
      const failed = s.questions.filter((_, i) => !answers[`${s.id}_${i}`]);
      return `
        <div style="margin-bottom:24px;">
          <h3 style="color:${PRIMARY_BLUE};margin:0 0 12px;font-size:15px;">${s.icon} ${s.label} Stage</h3>
          ${passed.map((q) => `<div style="padding:8px 12px;margin-bottom:6px;background:#1a1a1a;border-radius:8px;border-left:3px solid #22c55e;color:#ccc;font-size:13px;">✓ ${q}</div>`).join("")}
          ${failed.map((q) => `<div style="padding:8px 12px;margin-bottom:6px;background:#1a1a1a;border-radius:8px;border-left:3px solid #ef4444;color:#777;font-size:13px;">✗ ${q}</div>`).join("")}
        </div>
      `;
    }).join("");

    const personasHTML = personas
      .map(
        (p) => `
      <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="color:${PRIMARY_BLUE};font-weight:700;font-size:16px;margin-bottom:2px;">
          ${p.name} <span style="color:#555;font-size:14px;font-weight:500;">— ${p.archetype}</span>
        </div>
        <div style="font-size:13px;color:#aaa;">${p.age} · ${p.role}</div>
        <div style="margin-top:8px;font-size:14px;color:#ccc;line-height:1.5;">"${p.summary}"</div>
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
            <div style="font-size:13px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.05em;">${step.stage}</div>
            <div style="color:#ccc;margin-top:6px;font-size:14px;line-height:1.5;">
              <div style="margin-bottom:4px;"><strong style="color:#fff;">Intent:</strong> ${step.intent}</div>
              <div style="margin-bottom:4px;"><strong style="color:#fff;">Behaviour:</strong> ${step.behaviour}</div>
              <div style="margin-bottom:4px;"><strong style="color:#fff;">Pain Point:</strong> ${step.painPoint}</div>
              <div style="margin-bottom:4px;"><strong style="color:#fff;">Touchpoints:</strong> ${step.touchpoint}</div>
              <div style="margin-top:8px;color:${PRIMARY_BLUE};font-weight:600;">💡 Insight: ${step.insight}</div>
            </div>
          </div>
        `;
          })
          .join("");

        return `
        <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:20px;margin-bottom:16px;">
          <div style="color:#f5f5f5;font-weight:800;font-size:16px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #1e1e1e;">${p.name}'s Journey</div>
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
          <title>Customer Journey Audit Report — ${business.industry}</title>
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
              <div style="width:40px;height:40px;border-radius:10px;background:${PRIMARY_BLUE};display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#000;">H</div>
              <div>
                <div style="font-size:16px;font-weight:700;color:#f5f5f5;">PeoplePlex</div>
                <div style="font-size:12px;color:#555;">peopleplex.in · Understand Your Customers</div>
              </div>
              <div style="margin-left:auto;text-align:right;">
                <div style="font-size:12px;color:#555;">Generated on</div>
                <div style="font-size:13px;color:#aaa;">${date}</div>
              </div>
            </div>

            <!-- Title -->
            <div style="margin-bottom:32px;">
              <div style="font-size:12px;color:${PRIMARY_BLUE};letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Customer Journey Audit Report</div>
              <h1 style="font-size:28px;font-weight:900;color:#f5f5f5;line-height:1.2;margin-bottom:8px;">
                Customer Journey — How Well Is Your Business Performing?
              </h1>
              <p style="color:#777;font-size:14px;">Prepared for: <strong style="color:#aaa;">${business.businessName || business.industry}</strong> · ${business.location}</p>
            </div>

            <!-- Business Info -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:20px;margin-bottom:24px;">
              <div style="font-size:12px;color:${PRIMARY_BLUE};text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Business Details & Links</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="grid-column:1/-1;"><div style="font-size:11px;color:#555;margin-bottom:4px;">BUSINESS NAME</div><div style="color:#f5f5f5;font-size:14px;">${business.businessName || "Not provided"}</div></div>
                <div><div style="font-size:11px;color:#555;margin-bottom:4px;">INDUSTRY</div><div style="color:#f5f5f5;font-size:14px;">${business.industry}</div></div>
                <div><div style="font-size:11px;color:#555;margin-bottom:4px;">LOCATION</div><div style="color:#f5f5f5;font-size:14px;">${business.location}</div></div>
                
                ${business.websiteUrl ? `<div><div style="font-size:11px;color:#555;margin-bottom:4px;">WEBSITE</div><div style="font-size:14px;"><a href="${business.websiteUrl}" target="_blank" style="color:${PRIMARY_BLUE};text-decoration:none;">${business.websiteUrl}</a></div></div>` : ""}
                ${business.gmbUrl ? `<div><div style="font-size:11px;color:#555;margin-bottom:4px;">GOOGLE GMB</div><div style="font-size:14px;"><a href="${business.gmbUrl}" target="_blank" style="color:${PRIMARY_BLUE};text-decoration:none;">View Maps</a></div></div>` : ""}
                ${business.socialUrl ? `<div><div style="font-size:11px;color:#555;margin-bottom:4px;">SOCIAL MEDIA</div><div style="font-size:14px;"><a href="${business.socialUrl}" target="_blank" style="color:${PRIMARY_BLUE};text-decoration:none;">View Profile</a></div></div>` : ""}

                ${business.additionalNotes ? `<div style="grid-column:1/-1;"><div style="font-size:11px;color:#555;margin-bottom:4px;">ADDITIONAL NOTES</div><div style="color:#f5f5f5;font-size:14px;line-height:1.5;">${business.additionalNotes}</div></div>` : ""}
                <div style="grid-column:1/-1;"><div style="font-size:11px;color:#555;margin-bottom:4px;">CUSTOMER PERSONAS AUDITED</div><div style="color:#f5f5f5;font-size:14px;">${personas.map((p) => p.name).join(", ")}</div></div>
              </div>
            </div>

            <!-- Overall Score -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:28px;margin-bottom:24px;text-align:center;">
              <div style="font-size:72px;font-weight:900;color:${scoreColor(totalPct)};line-height:1;">${totalPct}%</div>
              <div style="font-size:20px;font-weight:700;color:#f5f5f5;margin-top:8px;">${scoreLabel(totalPct)} — ${totalYes}/${totalQ} checks passed</div>
              <div style="font-size:13px;color:#555;margin-top:6px;">
                Weakest: <span style="color:#ef4444;">${weakest.label} (${weakest.pct}%)</span> &nbsp;·&nbsp;
                Strongest: <span style="color:#22c55e;">${strongest.label} (${strongest.pct}%)</span>
              </div>
            </div>

            <!-- Stage Scores Table -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;overflow:hidden;margin-bottom:24px;">
              <div style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
                <div style="font-size:13px;font-weight:700;color:#f5f5f5;">Stage-by-Stage Breakdown</div>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="background:#0d0d0d;">
                    <th style="padding:10px 16px;text-align:left;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.06em;">Stage</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.06em;">Score</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.06em;">Passed</th>
                    <th style="padding:10px 16px;text-align:center;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.06em;">Status</th>
                  </tr>
                </thead>
                <tbody>${stageRows}</tbody>
              </table>
            </div>

            <!-- AI Insight -->
            ${!aiInsight
        ? ""
        : typeof aiInsight === "string"
          ? `
              <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:24px;">
                <div style="font-size:13px;font-weight:700;color:${PRIMARY_BLUE};margin-bottom:14px;">💡 Personalised Gap Analysis</div>
                <p style="font-size:14px;color:#ccc;line-height:1.8;">${aiInsight.replace(/\n\n/g, '</p><p style="font-size:14px;color:#ccc;line-height:1.8;margin-top:12px;">')}</p>
              </div>`
          : `
              <div style="margin-bottom:24px;">
                <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:16px;">
                  <div style="font-size:13px;font-weight:700;color:${PRIMARY_BLUE};margin-bottom:10px;">🌐 Website & Online Presence Report</div>
                  <p style="font-size:14px;color:#ccc;line-height:1.8;margin:0;">${aiInsight.websiteReport}</p>
                </div>
                <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:16px;">
                  <div style="font-size:13px;font-weight:700;color:${PRIMARY_BLUE};margin-bottom:10px;">💡 Key Takeaways</div>
                  <p style="font-size:14px;color:#ccc;line-height:1.8;margin:0;">${aiInsight.keyTakeaways}</p>
                </div>
                <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;">
                  <div style="font-size:13px;font-weight:700;color:${PRIMARY_BLUE};margin-bottom:10px;">🚀 Next Priority Step</div>
                  <p style="font-size:14px;color:#ccc;line-height:1.8;margin:0;">${aiInsight.nextPriorityStep}</p>
                </div>
              </div>`
      }

            <!-- Detailed Checklist -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:24px;">
              <div style="font-size:13px;font-weight:700;color:#f5f5f5;margin-bottom:20px;">Detailed Audit Checklist</div>
              ${checkedItems}
            </div>

            <!-- CTA -->
            <div style="background:${PRIMARY_BLUE}15;border:1px solid ${PRIMARY_BLUE}40;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
              <div style="font-size:20px;font-weight:800;color:#f5f5f5;margin-bottom:8px;">Ready to Fix Your Biggest Gap?</div>
              <p style="font-size:14px;color:#777;margin-bottom:20px;line-height:1.6;">
                Book a free 30-minute Enrollment System Audit Call.<br />
                You bring this report. I bring the analysis.
              </p>
              <a href="${BOOKING_LINK}" style="
      display:inline-block;padding:14px 28px;background:${PRIMARY_BLUE};
      color:#000;font-weight:700;border-radius:10px;text-decoration:none;font-size:15px;
    ">Book Audit Call →</a>
            </div>

            <!-- Personas -->
            <div style="margin-bottom:24px;">
              <h3 style="color:#f5f5f5;font-size:18px;margin-bottom:16px;">Generated Personas</h3>
              ${personasHTML}
            </div>

            <!-- Mapped Journeys -->
            <div style="margin-bottom:24px;">
              <h3 style="color:#f5f5f5;font-size:18px;margin-bottom:16px;">Mapped Customer Journeys</h3>
              ${mappedJourneysHTML}
            </div>

            <!-- Viral Marketing CTA -->
            <div style="margin-top:40px;padding-top:24px;border-top:1px solid #1e1e1e;text-align:center;">
              <div style="font-size:18px;font-weight:800;color:#f5f5f5;margin-bottom:8px;">Want to uncover the hidden gaps in your own business?</div>
              <p style="font-size:13px;color:#777;margin-bottom:16px;line-height:1.5;">
                Get a free, AI-generated Customer Journey Audit designed specifically for your industry. Find out exactly where you're losing money and the quickest way to fix it.
              </p>
              <a href="${window.location.origin}" style="
      display:inline-block;padding:12px 24px;background:transparent;border:2px solid ${PRIMARY_BLUE};
      color:${PRIMARY_BLUE};font-weight:700;border-radius:10px;text-decoration:none;font-size:14px;
    ">Take Audit For Your Business →</a>
              <div style="margin-top:24px;font-size:13px;color:#555;">
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

  // Removed Email functionality directly in-app since we no longer collect it.

  if (showAutomations) {
    return (
      <AutomationRecommendations
        audit={{
          stageScores: stageScores.map((s) => ({ stage: s.label, pct: s.pct })),
        }}
        onBack={() => setShowAutomations(false)}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 14,
            color: PRIMARY_BLUE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
            fontWeight: 600,
          }}
        >
          Your Completed Report
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: TEXT_COLOR, margin: 0 }}>
          Customer Journey Audit
        </h2>
        <p style={{ color: MUTED_COLOR, marginTop: 8, fontSize: 16 }}>
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
            fontSize: 14,
            fontWeight: 700,
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
            <span style={{ color: MUTED_COLOR, fontWeight: 500 }}>Industry:</span> {business.industry}
          </div>
          <div>
            <span style={{ color: MUTED_COLOR, fontWeight: 500 }}>Location:</span> {business.location}
          </div>
          <div>
            <span style={{ color: MUTED_COLOR, fontWeight: 500 }}>Market Tier:</span>{" "}
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
            fontSize: 20,
            fontWeight: 800,
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
                  fontWeight: 700,
                  fontSize: 17,
                  marginBottom: 4,
                }}
              >
                {p.name}{" "}
                <span style={{ color: MUTED_COLOR, fontSize: 15, fontWeight: 500 }}>
                  — {p.archetype}
                </span>
              </div>
              <div style={{ fontSize: 14, color: "#aaa" }}>
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
            fontSize: 20,
            fontWeight: 800,
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
                fontWeight: 800,
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
                          fontSize: 14,
                          fontWeight: 800,
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
                          color: "#ccc",
                          marginTop: 6,
                          lineHeight: 1.6,
                          paddingBottom: 12,
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: "#fff" }}>Intent:</strong>{" "}
                          {step.intent}
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: "#fff" }}>Behaviour:</strong>{" "}
                          {step.behaviour}
                        </div>
                        <div style={{ marginBottom: 6 }}>
                          <strong style={{ color: "#fff" }}>Pain Point:</strong>{" "}
                          {step.painPoint}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong style={{ color: "#fff" }}>
                            Touchpoints:
                          </strong>{" "}
                          {step.touchpoint}
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            color: PRIMARY_BLUE,
                            fontWeight: 600,
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

      {/* Big score */}
      <div
        style={{
          background: CARD_BACKGROUND,
          border: `1px solid ${BORDER_COLOR}`,
          borderRadius: 20,
          padding: 28,
          marginBottom: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: scoreColor(totalPct),
            lineHeight: 1,
          }}
        >
          {totalPct}%
        </div>
        <div
          style={{ fontSize: 20, fontWeight: 700, color: TEXT_COLOR, marginTop: 12 }}
        >
          {scoreLabel(totalPct)} — {totalYes}/{totalQ} checks passed
        </div>
        <div style={{ fontSize: 14, color: MUTED_COLOR, marginTop: 6 }}>
          Weakest: <span style={{ color: "#FF3B30", fontWeight: '600' }}>{weakest.label}</span>
          {" · "}
          Strongest: <span style={{ color: "#34C759", fontWeight: '600' }}>{strongest.label}</span>
        </div>
      </div>

      {/* Stage bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 24,
        }}
      >
        {stageScores.map((s) => (
          <div
            key={s.id}
            style={{
              background: CARD_BACKGROUND,
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 14,
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 10,
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 600, color: TEXT_COLOR }}>
                {s.icon} {s.label}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: scoreColor(s.pct),
                  fontWeight: 700,
                }}
              >
                {s.yes}/{s.total} · {s.pct}%
              </span>
            </div>
            <div style={{ height: 8, background: BORDER_COLOR, borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  width: `${s.pct}%`,
                  background: `linear-gradient(90deg, ${scoreColor(s.pct)}, ${scoreColor(s.pct)}99)`,
                  transition: "width .6s ease-in-out",
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {loadingAI ? (
        <Spinner message="Generating your personalised gap report…" />
      ) : (
        <div>
          {/* AI Insight Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 16,
            }}
          >
            {typeof aiInsight === "string" ? (
              <div
                style={{
                  background: CARD_BACKGROUND,
                  border: `1px solid ${BORDER_COLOR}`,
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: PRIMARY_BLUE,
                    marginBottom: 14,
                  }}
                >
                  💡 Personalised Gap Analysis
                </div>
                {aiInsight.split("\n\n").map((para, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 15,
                      color: MUTED_COLOR,
                      lineHeight: 1.8,
                      margin: i > 0 ? "12px 0 0" : 0,
                    }}
                  >
                    {para}
                  </p>
                ))}
              </div>
            ) : (
              <>
                <div
                  style={{
                    background: CARD_BACKGROUND,
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: 16,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: PRIMARY_BLUE,
                      marginBottom: 10,
                    }}
                  >
                    🌐 Website & Online Presence Report
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      color: MUTED_COLOR,
                      lineHeight: 1.8,
                      margin: 0,
                    }}
                  >
                    {aiInsight?.websiteReport}
                  </p>
                </div>
                <div
                  style={{
                    background: CARD_BACKGROUND,
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: 16,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: PRIMARY_BLUE,
                      marginBottom: 10,
                    }}
                  >
                    💡 Key Takeaways
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      color: MUTED_COLOR,
                      lineHeight: 1.8,
                      margin: 0,
                    }}
                  >
                    {aiInsight?.keyTakeaways}
                  </p>
                </div>
                <div
                  style={{
                    background: CARD_BACKGROUND,
                    border: `1px solid ${BORDER_COLOR}`,
                    borderRadius: 16,
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: PRIMARY_BLUE,
                      marginBottom: 10,
                    }}
                  >
                    🚀 Next Priority Step
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      color: MUTED_COLOR,
                      lineHeight: 1.8,
                      margin: 0,
                    }}
                  >
                    {aiInsight?.nextPriorityStep}
                  </p>
                </div>
              </>
            )}
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
                fontWeight: 700,
                color: TEXT_COLOR,
                marginBottom: 8,
              }}
            >
              📄 Your Full Report is Ready
            </div>
            <p
              style={{
                fontSize: 14,
                color: MUTED_COLOR,
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              Includes your complete checklist, stage breakdown, and
              personalised insights. Save it or send it to your inbox.
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
                  fontWeight: 700,
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
                background: "#1C1C1E",
                borderRadius: 10,
                fontSize: 13,
                color: MUTED_COLOR,
                lineHeight: 1.6,
              }}
            >
              💡 <strong style={{ color: TEXT_COLOR }}>Share Report URL</strong>{" "}
              generates a unique, public link you can instantly send to your
              team or stakeholders so they can view the full breakdown.
            </div>
          </div>

          {/* Dual CTA */}
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
                fontWeight: 800,
                color: TEXT_COLOR,
                marginBottom: 8,
              }}
            >
              Ready to Fix Your Biggest Gap?
            </div>
            <p
              style={{
                fontSize: 15,
                color: MUTED_COLOR,
                marginBottom: 24,
                lineHeight: 1.7,
              }}
            >
              Your{" "}
              <span style={{ color: "#FF3B30", fontWeight: 700 }}>
                {weakest.label}
              </span>{" "}
              stage at{" "}
              <strong style={{ color: "#FF3B30" }}>{weakest.pct}%</strong> is
              costing you customers right now. Book a call — you bring this
              report, I bring the analysis.
            </p>

            {/* TWO CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* View Automations */}
              <GradientButton
                onClick={() => setShowAutomations(true)}
              >
                ⚙️ View Automation Recommendations
              </GradientButton>

              {/* Primary: Schedule Call */}
              <GradientButton
                secondary
                onClick={() => window.open(BOOKING_LINK, "_blank")}
              >
                📞 Book Free Audit Call →
              </GradientButton>

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
                  fontSize: 14,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Start a new audit
              </button>
            </div>
          </div>
        </div>
      )
      }
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

  const isAudit = location.pathname === "/journey";
  const isPsychology = location.pathname === "/psychology";
  const showDashboard = location.pathname === "/history";
  const showSettings = location.pathname === "/settings";
  const isToolsDashboard = location.pathname === "/" || location.pathname === "/tools";

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
  if (!user) return <AuthScreen />;

  return (
    <div className="layout-container">
      <style>{`
        .layout-container {
          display: flex;
          flex-direction: row;
          min-height: 100vh;
          background: ${DARK_MODE_BACKGROUND};
          font-family: 'SF Pro Display',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;
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
          font-weight: 700;
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
          font-size: 20px;
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
            font-size: 10px;
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
              background: `linear-gradient(45deg, ${PRIMARY_BLUE}, #00AFFF)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            P
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: TEXT_COLOR }}>
              PeoplePlex
            </div>
            <div style={{ fontSize: 11, color: MUTED_COLOR }}>Growth Tools</div>
          </div>
        </div>

        <button
          className={`nav-btn ${isToolsDashboard ? "active" : "inactive"}`}
          onClick={() => navigate("/")}
        >
          <span className="nav-btn-icon">📦</span>
          <span>All Tools</span>
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
            <ToolsDashboard
              business={business}
              onRestart={restart}
              setupWizard={
                <StepDescribe
                  onNext={(d) => {
                    setBusiness(d);
                    const newLeadId = `audit_${Date.now()}`;
                    setLeadId(newLeadId);
                    const auditData = {
                      id: newLeadId,
                      businessName: d.businessName,
                      additionalNotes: d.additionalNotes,
                      industry: d.industry,
                      location: d.location,
                      websiteUrl: d.websiteUrl || "",
                      gmbUrl: d.gmbUrl || "",
                      socialUrl: d.socialUrl || "",
                      pricingTier: d.pricingTier?.label || "Unknown",
                      completedAt: new Date().toISOString(),
                      source: "PeoplePlex App",
                    };

                    if (auth.currentUser) {
                      setDoc(
                        doc(db, "users", auth.currentUser.uid, "audits", newLeadId),
                        auditData
                      ).catch((err) => {
                        console.error("Firestore save error:", err);
                      });
                    }
                    setStep(1); // Set step to 1 so the Journey tool starts on Personas
                  }}
                />
              }
            />
          } />
          <Route path="/psychology" element={<CustomerPsychology business={business} personas={personas} />} />

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
                maxWidth: 560,
                margin: "0 auto",
                padding: "40px 20px 60px",
              }}
            >
              {!business ? (
                <div style={{ textAlign: "center", paddingTop: 80 }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: TEXT_COLOR, marginBottom: 16 }}>Project Not Setup</h2>
                  <p style={{ color: MUTED_COLOR, marginBottom: 32, fontSize: 16 }}>Please complete the Project Setup Wizard on the Dashboard to access this tool.</p>
                  <GradientButton
                    onClick={() => navigate("/")}
                  >
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
                    <StepAudit
                      onNext={(a) => {
                        setAnswers(a);
                        setStep(4);
                      }}
                      onBack={() => setStep(2)}
                    />
                  )}
                  {step === 4 && (
                    <StepResults
                      business={business}
                      personas={personas}
                      answers={answers}
                      leadId={leadId}
                      onRestart={restart}
                      onNavigatePsychology={() => navigate("/psychology")}
                    />
                  )}
                </>
              )}
            </div>
          } />
        </Routes>
      </div>
    </div>
  );
}

export default JourneyAudit;
