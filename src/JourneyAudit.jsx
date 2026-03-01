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
} from "firebase/auth";
import { doc, setDoc, collection, getDocs, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

const BOOKING_LINK = "https://iamhariharan.com/training-institutes";

// ── Brand tokens ──────────────────────────────────────────────
const ORANGE = "#FF6B35";
const DARK = "#0A0A0A";
const CARD = "#111111";
const BORDER = "#1E1E1E";
const MUTED = "#555555";
const WHITE = "#F5F5F5";

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
  if (pct >= 80) return "#22c55e";
  if (pct >= 50) return ORANGE;
  return "#ef4444";
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
      padding: "6px 16px",
      borderRadius: 999,
      border: `1px solid ${active ? ORANGE : BORDER}`,
      background: active ? `${ORANGE}18` : "transparent",
      color: active ? ORANGE : MUTED,
      fontSize: 13,
      cursor: "pointer",
      transition: "all .2s",
    }}
  >
    {children}
  </button>
);

const Input = ({ label, placeholder, value, onChange, textarea }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
    <label
      style={{
        fontSize: 13,
        color: MUTED,
        letterSpacing: ".05em",
        textTransform: "uppercase",
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
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: "14px 16px",
          color: WHITE,
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
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          padding: "14px 16px",
          color: WHITE,
          fontSize: 15,
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    )}
  </div>
);

const OrangeBtn = ({ children, onClick, disabled, fullWidth, secondary }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: fullWidth ? "100%" : "auto",
      padding: "15px 28px",
      borderRadius: 12,
      border: secondary ? `1px solid ${BORDER}` : "none",
      background: secondary ? "transparent" : disabled ? "#333" : ORANGE,
      color: disabled ? MUTED : secondary ? MUTED : "#000",
      fontSize: 15,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "all .2s",
      letterSpacing: ".02em",
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
              gap: 6,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background:
                  i < current ? ORANGE : i === current ? ORANGE : BORDER,
                border: `2px solid ${i <= current ? ORANGE : BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: i <= current ? "#000" : MUTED,
                transition: "all .3s",
              }}
            >
              {i < current ? "✓" : i + 1}
            </div>
            <span
              style={{
                fontSize: 11,
                color: i === current ? ORANGE : MUTED,
                whiteSpace: "nowrap",
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 1,
                margin: "0 8px",
                marginBottom: 20,
                background: i < current ? ORANGE : BORDER,
                transition: "all .3s",
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
        border: `3px solid ${BORDER}`,
        borderTop: `3px solid ${ORANGE}`,
        margin: "0 auto 20px",
        animation: "spin 1s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: MUTED, fontSize: 15 }}>{message}</p>
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
    color: "#FF6B35",
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
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [pricingTier, setPricing] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const ready =
    businessName.trim() &&
    industry.trim() &&
    description.trim() &&
    location.trim() &&
    pricingTier;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 13,
            color: ORANGE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          PeoplePlex
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: WHITE,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Discover Your
          <br />
          Customers
        </h1>
        <p
          style={{ color: MUTED, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}
        >
          Tell us about yourself and your business. AI will generate customer
          personas and map their complete journey with you.
        </p>
      </div>

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

        <div>
          <div
            style={{
              fontSize: 13,
              color: MUTED,
              letterSpacing: ".05em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Pricing Tier
          </div>
          <p
            style={{
              fontSize: 13,
              color: MUTED,
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
                    border: "1.5px solid " + (sel ? tier.color : BORDER),
                    background: sel ? tier.color + "12" : CARD,
                    cursor: "pointer",
                    transition: "all .2s",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      flexShrink: 0,
                      marginTop: 2,
                      border: "2px solid " + (sel ? tier.color : BORDER),
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
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#000",
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
                        marginBottom: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: sel ? WHITE : "#aaa",
                        }}
                      >
                        {tier.label}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: tier.color + "22",
                          color: tier.color,
                          fontWeight: 600,
                        }}
                      >
                        {tier.tag}
                      </span>
                    </div>
                    <div
                      style={{ fontSize: 13, color: MUTED, lineHeight: 1.4 }}
                    >
                      {tier.description}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: sel ? tier.color : "#444",
                        marginTop: 4,
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
                background: pricingTier.color + "10",
                border: "1px solid " + pricingTier.color + "30",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: pricingTier.color,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {pricingTier.icon} {pricingTier.tag} Customer Insight
              </div>
              <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                {TIER_INSIGHTS[pricingTier.id]}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <Input
          label="Additional Notes (Optional)"
          placeholder="e.g., We have a small budget, our primary audience is college students..."
          value={additionalNotes}
          onChange={setAdditionalNotes}
          textarea
        />
      </div>

      <div style={{ marginTop: 24 }}>
        <OrangeBtn
          fullWidth
          disabled={!ready}
          onClick={() =>
            onNext({
              businessName,
              industry,
              description,
              location,
              pricingTier,
              additionalNotes,
            })
          }
        >
          Generate Customer Personas →
        </OrangeBtn>
        {!ready && (industry || description || location) && (
          <p
            style={{
              fontSize: 12,
              color: MUTED,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            Complete all fields above to continue
          </p>
        )}
      </div>
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
        <OrangeBtn onClick={generatePersonas}>Try Again</OrangeBtn>
      </div>
    );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 13,
            color: ORANGE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Step 2 of 5
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          Who Is Your Customer?
        </h2>
        <p style={{ color: MUTED, marginTop: 8, fontSize: 14 }}>
          Here are 3 unique personas we generated for your business.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {personas?.map((p) => (
          <div
            key={p.id}
            style={{
              background: CARD,
              border: `1.5px solid ${BORDER}`,
              borderRadius: 14,
              padding: "20px 22px",
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
                    gap: 10,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: WHITE }}>
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: `${ORANGE}20`,
                      color: ORANGE,
                      fontWeight: 600,
                    }}
                  >
                    {p.archetype}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: MUTED }}>
                  {p.age} · {p.role}
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "#aaa",
                margin: "10px 0 12px",
                lineHeight: 1.5,
              }}
            >
              {p.summary}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {[
                { label: "🎯 Primary Goal", value: p.primaryGoal },
                { label: "😰 Biggest Fear", value: p.biggestFear },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "#0d0d0d",
                    borderRadius: 8,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, color: WHITE, lineHeight: 1.4 }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <OrangeBtn secondary onClick={onBack}>
          ← Back
        </OrangeBtn>
        <OrangeBtn
          fullWidth
          disabled={!personas}
          onClick={() => onNext(personas)}
        >
          Explore Their Journeys →
        </OrangeBtn>
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
Additional Notes: ${business.additionalNotes || "None"}

Persona 1: ${personas[0] ? personas[0].name : ""} (${personas[0] ? personas[0].archetype : ""}) - Goal: ${personas[0] ? personas[0].primaryGoal : ""}
Persona 2: ${personas[1] ? personas[1].name : ""} (${personas[1] ? personas[1].archetype : ""}) - Goal: ${personas[1] ? personas[1].primaryGoal : ""}
Persona 3: ${personas[2] ? personas[2].name : ""} (${personas[2] ? personas[2].archetype : ""}) - Goal: ${personas[2] ? personas[2].primaryGoal : ""}

Generate a SPECIFIC, DETAILED journey map for EACH persona. Make each stage unique and relevant to that exact persona.
Return ONLY valid JSON, no markdown backticks, no explanation:
{"journeys":[{"personaIdx":0,"stages":[{"stage":"Aware","intent":"specific intent","behaviour":"specific behaviour","painPoint":"specific pain point","touchpoint":"specific touchpoints","insight":"specific insight"},{"stage":"Appeal","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Ask","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Act","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Advocate","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."}]},{"personaIdx":1,"stages":[...]},{"personaIdx":2,"stages":[...]}]}`,
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
            fontSize: 13,
            color: ORANGE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Step 3 of 5
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          Customer Journeys
        </h2>
        <p style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
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
              padding: "10px 16px",
              borderRadius: 12,
              background: activePersonaIdx === i ? `${ORANGE}15` : CARD,
              border: `1px solid ${activePersonaIdx === i ? ORANGE : BORDER}`,
              color: activePersonaIdx === i ? ORANGE : "#aaa",
              fontSize: 14,
              fontWeight: activePersonaIdx === i ? 700 : 500,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .2s",
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
              background: activeStage === i ? ORANGE : CARD,
              color: activeStage === i ? "#000" : MUTED,
              fontSize: 13,
              fontWeight: activeStage === i ? 700 : 400,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all .2s",
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
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                color: ORANGE,
                fontWeight: 800,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {activePersona?.name}'s {stageInfo.label} Experience
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: WHITE,
                marginBottom: 4,
              }}
            >
              {stageInfo.icon} {stage.stage}
            </div>
            <div style={{ fontSize: 14, color: MUTED }}>
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
                  background: "#0d0d0d",
                  borderRadius: 10,
                  padding: "14px 16px",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: MUTED,
                      textTransform: "uppercase",
                      letterSpacing: ".06em",
                      marginBottom: 4,
                    }}
                  >
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, color: WHITE, lineHeight: 1.5 }}>
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
              background: `${ORANGE}10`,
              border: `1px solid ${ORANGE}30`,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: ORANGE,
                textTransform: "uppercase",
                letterSpacing: ".06em",
                marginBottom: 4,
              }}
            >
              💡 Key Insight
            </div>
            <div style={{ fontSize: 14, color: WHITE, lineHeight: 1.5 }}>
              {stage.insight}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <OrangeBtn secondary onClick={onBack}>
          ← Back
        </OrangeBtn>
        <OrangeBtn
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
        </OrangeBtn>
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
            fontSize: 13,
            color: ORANGE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Step 4 of 5
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          Audit Your Business
        </h2>
        <p style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
          Check Yes for everything your business already does well. Be honest.
        </p>
      </div>

      {/* Overall progress */}
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: `conic-gradient(${scoreColor(totalPct)} ${totalPct * 3.6}deg, ${BORDER} 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: CARD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 800,
              color: WHITE,
            }}
          >
            {totalPct}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: WHITE }}>
            Overall Score
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>
            {totalYes} of {totalQ} checks passed
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span
            style={{
              padding: "4px 14px",
              borderRadius: 999,
              background: `${scoreColor(totalPct)}20`,
              color: scoreColor(totalPct),
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {scoreLabel(totalPct)}
          </span>
        </div>
      </div>

      {/* Stage tabs */}
      <div
        style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}
      >
        {JOURNEY_STAGES.map((s, i) => {
          const sc = stageScore(s.id);
          return (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                border: `1px solid ${activeStage === i ? ORANGE : BORDER}`,
                background: activeStage === i ? `${ORANGE}15` : "transparent",
                color: activeStage === i ? ORANGE : MUTED,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all .2s",
              }}
            >
              {s.icon} {s.label}
              <span
                style={{
                  fontSize: 11,
                  color: scoreColor(sc.pct),
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
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <div
          style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: WHITE,
              marginBottom: 2,
            }}
          >
            {stage.icon} {stage.label} Stage
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>{stage.description}</div>
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
                  gap: 14,
                  padding: "16px 20px",
                  borderBottom:
                    i < stage.questions.length - 1
                      ? `1px solid ${BORDER}`
                      : "none",
                  cursor: "pointer",
                  background: checked ? `${ORANGE}08` : "transparent",
                  transition: "background .15s",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    flexShrink: 0,
                    marginTop: 1,
                    border: `2px solid ${checked ? ORANGE : BORDER}`,
                    background: checked ? ORANGE : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#000",
                    fontWeight: 800,
                    transition: "all .15s",
                  }}
                >
                  {checked ? "✓" : ""}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    color: checked ? WHITE : "#aaa",
                    lineHeight: 1.5,
                    transition: "color .15s",
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
            padding: "14px 20px",
            borderTop: `1px solid ${BORDER}`,
            background: "#0d0d0d",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 13, color: MUTED }}>
              {stage.label} Score: {sc.yes}/{sc.total} ({sc.pct}%)
            </span>
            <span
              style={{
                fontSize: 12,
                padding: "3px 12px",
                borderRadius: 999,
                background: `${scoreColor(sc.pct)}20`,
                color: scoreColor(sc.pct),
                fontWeight: 700,
              }}
            >
              {scoreLabel(sc.pct)}
            </span>
          </div>
          <div
            style={{
              height: 4,
              background: BORDER,
              borderRadius: 999,
              marginTop: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 999,
                width: `${sc.pct}%`,
                background: scoreColor(sc.pct),
                transition: "width .4s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {activeStage > 0 && (
          <OrangeBtn secondary onClick={() => setActive((a) => a - 1)}>
            ← Prev Stage
          </OrangeBtn>
        )}
        {activeStage < JOURNEY_STAGES.length - 1 && (
          <OrangeBtn onClick={() => setActive((a) => a + 1)}>
            Next Stage →
          </OrangeBtn>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <OrangeBtn secondary onClick={onBack}>
          ← Back
        </OrangeBtn>
        <OrangeBtn
          fullWidth
          disabled={!answeredAll}
          onClick={() => onNext(answers)}
        >
          See My Results →
        </OrangeBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 5 — Results
// ══════════════════════════════════════════════════════════════
function StepResults({ business, personas, answers, leadId, onRestart }) {
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
Additional Notes: ${business.additionalNotes || "None"}
Customer Personas: ${personas.map((p) => p.name + " (" + p.archetype + ")").join(", ")}
Audit Scores: ${scoresSummary}
Weakest Stage: ${weakest.label} (${weakest.pct}%)
Strongest Stage: ${strongest.label} (${strongest.pct}%)
Overall Score: ${totalPct}%

Write a personalised 3-paragraph insight report (no headers, just plain paragraphs).
Para 1: What's working and why it matters for retaining customers.
Para 2: The biggest gap (weakest stage) and specifically what it is costing them right now.
Para 3: The single most important thing to fix first and why it will have the biggest impact.
Be specific, direct, and actionable. Under 200 words total.`,
            },
          ],
        }),
      });
      const data = await res.json();
      setAiInsight(data.content?.[0]?.text || getFallbackInsight());
    } catch (e) {
      setAiInsight(getFallbackInsight());
    } finally {
      setLoadingAI(false);
    }
  }

  function getFallbackInsight() {
    return `Your ${strongest.label} stage is your strongest asset at ${strongest.pct}% — this means customers who reach this point have a good experience and are more likely to convert. This is a solid foundation to build on.

However, your ${weakest.label} stage at ${weakest.pct}% is where you're losing customers silently. At this stage, potential customers are evaluating whether to trust you — and most are leaving before making contact. Every customer lost here is revenue you never see.

The single most important fix: focus all energy on the ${weakest.label} stage first. Even a 20% improvement here can significantly increase the number of customers who reach out — without spending more on ads or marketing.`;
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
          <h3 style="color:#FF6B35;margin:0 0 12px;font-size:15px;">${s.icon} ${s.label} Stage</h3>
          ${passed.map((q) => `<div style="padding:8px 12px;margin-bottom:6px;background:#1a1a1a;border-radius:8px;border-left:3px solid #22c55e;color:#ccc;font-size:13px;">✓ ${q}</div>`).join("")}
          ${failed.map((q) => `<div style="padding:8px 12px;margin-bottom:6px;background:#1a1a1a;border-radius:8px;border-left:3px solid #ef4444;color:#777;font-size:13px;">✗ ${q}</div>`).join("")}
        </div>
      `;
    }).join("");

    const personasHTML = personas
      .map(
        (p) => `
      <div style="background:#111;border:1px solid #1e1e1e;border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="color:#FF6B35;font-weight:700;font-size:16px;margin-bottom:2px;">
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
              <div style="margin-top:8px;color:#FF6B35;font-weight:600;">💡 Insight: ${step.insight}</div>
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
              <div style="width:40px;height:40px;border-radius:10px;background:#FF6B35;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:900;color:#000;">H</div>
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
              <div style="font-size:12px;color:#FF6B35;letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px;">Customer Journey Audit Report</div>
              <h1 style="font-size:28px;font-weight:900;color:#f5f5f5;line-height:1.2;margin-bottom:8px;">
                Customer Journey — How Well Is Your Business Performing?
              </h1>
              <p style="color:#777;font-size:14px;">Prepared for: <strong style="color:#aaa;">${business.businessName || business.industry}</strong> · ${business.location}</p>
            </div>

            <!-- Business Info -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:20px;margin-bottom:24px;">
              <div style="font-size:12px;color:#FF6B35;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Business Details</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div style="grid-column:1/-1;"><div style="font-size:11px;color:#555;margin-bottom:4px;">BUSINESS NAME</div><div style="color:#f5f5f5;font-size:14px;">${business.businessName || "Not provided"}</div></div>
                <div><div style="font-size:11px;color:#555;margin-bottom:4px;">INDUSTRY</div><div style="color:#f5f5f5;font-size:14px;">${business.industry}</div></div>
                <div><div style="font-size:11px;color:#555;margin-bottom:4px;">LOCATION</div><div style="color:#f5f5f5;font-size:14px;">${business.location}</div></div>
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
            ${
              aiInsight
                ? `
  <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:24px;">
    <div style="font-size:13px;font-weight:700;color:#FF6B35;margin-bottom:14px;">💡 Personalised Gap Analysis</div>
    <p style="font-size:14px;color:#ccc;line-height:1.8;">${aiInsight.replace(/\n\n/g, '</p><p style="font-size:14px;color:#ccc;line-height:1.8;margin-top:12px;">')}</p>
  </div>`
                : ""
            }

            <!-- Detailed Checklist -->
            <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:24px;">
              <div style="font-size:13px;font-weight:700;color:#f5f5f5;margin-bottom:20px;">Detailed Audit Checklist</div>
              ${checkedItems}
            </div>

            <!-- CTA -->
            <div style="background:#FF6B3515;border:1px solid #FF6B3540;border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
              <div style="font-size:20px;font-weight:800;color:#f5f5f5;margin-bottom:8px;">Ready to Fix Your Biggest Gap?</div>
              <p style="font-size:14px;color:#777;margin-bottom:20px;line-height:1.6;">
                Book a free 30-minute Enrollment System Audit Call.<br />
                You bring this report. I bring the analysis.
              </p>
              <a href="${BOOKING_LINK}" style="
      display:inline-block;padding:14px 28px;background:#FF6B35;
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
      display:inline-block;padding:12px 24px;background:transparent;border:2px solid #FF6B35;
      color:#FF6B35;font-weight:700;border-radius:10px;text-decoration:none;font-size:14px;
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
            fontSize: 13,
            color: ORANGE,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Your Completed Report
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          Customer Journey Audit
        </h2>
        <p style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
          Comprehensive analysis of your current business performance.
        </p>
      </div>

      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER} `,
          borderRadius: 16,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: MUTED,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Input Overview
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 14,
          }}
        >
          <div>
            <span style={{ color: MUTED }}>Industry:</span> {business.industry}
          </div>
          <div>
            <span style={{ color: MUTED }}>Location:</span> {business.location}
          </div>
          <div>
            <span style={{ color: MUTED }}>Market Tier:</span>{" "}
            {business.pricingTier.label}
          </div>
          <div style={{ marginTop: 4, color: "#ccc", lineHeight: 1.5 }}>
            "{business.description}"
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: WHITE,
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
                background: CARD,
                border: `1px solid ${BORDER} `,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  color: ORANGE,
                  fontWeight: 700,
                  fontSize: 16,
                  marginBottom: 2,
                }}
              >
                {p.name}{" "}
                <span style={{ color: MUTED, fontSize: 14, fontWeight: 500 }}>
                  — {p.archetype}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#aaa" }}>
                {p.age} · {p.role}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
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
            fontWeight: 800,
            color: WHITE,
            marginBottom: 16,
          }}
        >
          Mapped Customer Journeys
        </div>
        {personas.map((p, i) => (
          <div
            key={i}
            style={{
              background: CARD,
              border: `1px solid ${BORDER} `,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                color: WHITE,
                fontWeight: 800,
                fontSize: 16,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: `1px solid ${BORDER} `,
              }}
            >
              {p.name}'s Journey
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
                        paddingLeft: 12,
                        borderLeft: `2px solid ${color} `,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
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
                          fontSize: 14,
                          color: "#ccc",
                          marginTop: 4,
                          lineHeight: 1.4,
                          paddingBottom: 12,
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>
                          <strong style={{ color: "#fff" }}>Intent:</strong>{" "}
                          {step.intent}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong style={{ color: "#fff" }}>Behaviour:</strong>{" "}
                          {step.behaviour}
                        </div>
                        <div style={{ marginBottom: 4 }}>
                          <strong style={{ color: "#fff" }}>Pain Point:</strong>{" "}
                          {step.painPoint}
                        </div>
                        <div style={{ marginBottom: 2 }}>
                          <strong style={{ color: "#fff" }}>
                            Touchpoints:
                          </strong>{" "}
                          {step.touchpoint}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            color: ORANGE,
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
          background: CARD,
          border: `1px solid ${BORDER} `,
          borderRadius: 16,
          padding: 24,
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
          style={{ fontSize: 18, fontWeight: 700, color: WHITE, marginTop: 8 }}
        >
          {scoreLabel(totalPct)} — {totalYes}/{totalQ} checks passed
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
          Weakest: <span style={{ color: "#ef4444" }}>{weakest.label}</span>
          {" · "}
          Strongest: <span style={{ color: "#22c55e" }}>{strongest.label}</span>
        </div>
      </div>

      {/* Stage bars */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {stageScores.map((s) => (
          <div
            key={s.id}
            style={{
              background: CARD,
              border: `1px solid ${BORDER} `,
              borderRadius: 12,
              padding: "14px 18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>
                {s.icon} {s.label}
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: scoreColor(s.pct),
                  fontWeight: 700,
                }}
              >
                {s.yes}/{s.total} · {s.pct}%
              </span>
            </div>
            <div style={{ height: 6, background: BORDER, borderRadius: 999 }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  width: `${s.pct}% `,
                  background: scoreColor(s.pct),
                  transition: "width .6s ease",
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
              background: CARD,
              border: `1px solid ${BORDER} `,
              borderRadius: 16,
              padding: 24,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: ORANGE,
                marginBottom: 14,
              }}
            >
              💡 Your Personalised Gap Analysis
            </div>
            {aiInsight?.split("\n\n").map((para, i) => (
              <p
                key={i}
                style={{
                  fontSize: 14,
                  color: "#ccc",
                  lineHeight: 1.8,
                  margin: i > 0 ? "12px 0 0" : 0,
                }}
              >
                {para}
              </p>
            ))}
          </div>

          {/* Report Actions */}
          <div
            style={{
              background: CARD,
              border: `1px solid ${BORDER} `,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: WHITE,
                marginBottom: 6,
              }}
            >
              📄 Your Full Report is Ready
            </div>
            <p
              style={{
                fontSize: 13,
                color: MUTED,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Includes your complete checklist, stage breakdown, and
              personalised insights. Save it or send it to your inbox.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* Download Button */}
              <button
                onClick={handleShare}
                disabled={downloading}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: "13px 18px",
                  borderRadius: 10,
                  border: `1.5px solid ${ORANGE} `,
                  background: "transparent",
                  color: ORANGE,
                  fontSize: 14,
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
                marginTop: 12,
                padding: "10px 14px",
                background: "#0d0d0d",
                borderRadius: 8,
                fontSize: 12,
                color: MUTED,
                lineHeight: 1.5,
              }}
            >
              💡 <strong style={{ color: "#aaa" }}>Download</strong> saves an
              HTML file — open in browser and use <em>Print → Save as PDF</em>{" "}
              for a perfect PDF copy.
            </div>
          </div>

          {/* Dual CTA */}
          <div
            style={{
              background: `${ORANGE} 10`,
              border: `1px solid ${ORANGE} 40`,
              borderRadius: 16,
              padding: 24,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: WHITE,
                marginBottom: 6,
              }}
            >
              Ready to Fix Your Biggest Gap?
            </div>
            <p
              style={{
                fontSize: 14,
                color: MUTED,
                marginBottom: 20,
                lineHeight: 1.6,
              }}
            >
              Your{" "}
              <span style={{ color: "#ef4444", fontWeight: 700 }}>
                {weakest.label}
              </span>{" "}
              stage at{" "}
              <strong style={{ color: "#ef4444" }}>{weakest.pct}%</strong> is
              costing you customers right now. Book a call — you bring this
              report, I bring the analysis.
            </p>

            {/* TWO CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* View Automations */}
              <button
                onClick={() => setShowAutomations(true)}
                style={{
                  width: "100%",
                  padding: "15px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: ORANGE,
                  color: "#000",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all .2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                ⚙️ View Automation Recommendations
              </button>

              {/* Primary: Schedule Call */}
              <button
                onClick={() => window.open(BOOKING_LINK, "_blank")}
                style={{
                  width: "100%",
                  padding: "15px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${ORANGE}`,
                  background: "transparent",
                  color: ORANGE,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all .2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                📞 Book Free Audit Call →
              </button>

              {/* Secondary: Share Report */}
              <button
                onClick={handleShare}
                disabled={downloading}
                style={{
                  width: "100%",
                  padding: "15px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${BORDER}`,
                  background: "transparent",
                  color: WHITE,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: downloading ? "not-allowed" : "pointer",
                  transition: "all .2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {downloading ? "⏳ Generating..." : "🔗 Share Report URL"}
              </button>
            </div>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                onClick={onRestart}
                style={{
                  background: "none",
                  border: "none",
                  color: MUTED,
                  fontSize: 13,
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Start a new audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// AUTOMATION TOOLS
// ══════════════════════════════════════════════════════════════
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
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: MUTED,
          fontSize: 14,
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
          fontSize: 26,
          fontWeight: 800,
          color: WHITE,
          margin: "0 0 12px",
        }}
      >
        Automation Recommendations
      </h2>
      <p
        style={{
          color: MUTED,
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
            background: `${ORANGE}10`,
            border: `1px solid ${ORANGE}30`,
            borderRadius: 10,
            padding: "16px 20px",
            marginBottom: 32,
            fontSize: 14,
            color: WHITE,
            lineHeight: 1.5,
          }}
        >
          💡 Your weakest stage is the{" "}
          <strong style={{ color: ORANGE }}>{weakestStage.stage}</strong> stage
          ({weakestStage.pct}%). Prioritizing automation here will likely yield
          the biggest impact.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {AUTOMATION_TOOLS.map((section, idx) => (
          <div key={idx}>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: WHITE,
                marginBottom: 8,
              }}
            >
              {section.stage} Stage: {section.title}
            </h3>
            <p
              style={{
                fontSize: 14,
                color: MUTED,
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
                    background: CARD,
                    border: `1px solid ${BORDER}`,
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
                      style={{ fontSize: 16, fontWeight: 700, color: WHITE }}
                    >
                      {tool.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: `${ORANGE}20`,
                        color: ORANGE,
                        fontWeight: 600,
                      }}
                    >
                      {tool.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>
                    <strong style={{ color: WHITE }}>Use Case:</strong>{" "}
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
            border: `1.5px solid ${BORDER}`,
            background: "transparent",
            color: WHITE,
            fontSize: 15,
            fontWeight: 700,
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

// ══════════════════════════════════════════════════════════════
// AUTHENTICATION SCREEN
// ══════════════════════════════════════════════════════════════
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let userDetails;
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        userDetails = userCred.user;
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        userDetails = userCred.user;

        // Send email verification on first signup
        await sendEmailVerification(userDetails);
        alert(
          "A verification link has been sent to your email. Please verify to fully secure your account.",
        );
      }

      // Ensure user profile document exists in Firestore database
      await setDoc(
        doc(db, "users", userDetails.uid),
        {
          email: userDetails.email,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);

      // Ensure user profile document exists in Firestore database
      await setDoc(
        doc(db, "users", userCred.user.uid),
        {
          email: userCred.user.email,
          displayName: userCred.user.displayName,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true },
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: DARK,
        color: WHITE,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: CARD,
          border: `1px solid ${BORDER} `,
          padding: 40,
          borderRadius: 16,
          width: "100%",
          maxWidth: 400,
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        <p
          style={{
            color: MUTED,
            textAlign: "center",
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          {isLogin
            ? "Log in to view your audits."
            : "Sign up to start saving your audits."}
        </p>

        {error && (
          <div
            style={{
              background: "#ef444420",
              color: "#ef4444",
              padding: "10px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: MUTED,
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${BORDER} `,
                background: DARK,
                color: WHITE,
                fontSize: 15,
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 700,
                color: MUTED,
                marginBottom: 6,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${BORDER} `,
                background: DARK,
                color: WHITE,
                fontSize: 15,
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              width: "100%",
              padding: "14px",
              borderRadius: 10,
              border: "none",
              background: ORANGE,
              color: "#000",
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? "wait" : "pointer",
              transition: "all .2s",
            }}
          >
            {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
          </button>
        </form>

        <div
          style={{ display: "flex", alignItems: "center", margin: "20px 0" }}
        >
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span
            style={{
              margin: "0 10px",
              fontSize: 12,
              fontWeight: 700,
              color: MUTED,
            }}
          >
            OR
          </span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 10,
            border: `1px solid ${BORDER} `,
            background: CARD,
            color: WHITE,
            fontWeight: 700,
            fontSize: 15,
            cursor: loading ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all .2s",
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            width="20"
            alt="Google"
          />
          Continue with Google
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 13,
            color: MUTED,
            marginTop: 24,
          }}
        >
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: ORANGE, cursor: "pointer", fontWeight: 700 }}
          >
            {isLogin ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// USER DASHBOARD — Audit History
// ══════════════════════════════════════════════════════════════
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
          background: DARK,
          color: WHITE,
          fontFamily: "'DM Sans','Segoe UI',sans-serif",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px" }}>
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
        background: DARK,
        color: WHITE,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${BORDER}`,
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
              background: ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: "#000",
            }}
          >
            H
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              My History Dashboard
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>
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
              border: `1px solid ${BORDER}`,
              background: "transparent",
              color: MUTED,
              fontSize: 12,
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
              color: ORANGE,
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
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: stat.color,
                  lineHeight: 1.1,
                  marginTop: 4,
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Top insight bar */}
        {topWeak && (
          <div
            style={{
              background: `${ORANGE}10`,
              border: `1px solid ${ORANGE}30`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 13,
              color: "#ccc",
            }}
          >
            💡 <strong style={{ color: ORANGE }}>Pattern detected:</strong> Most
            of your audits are weakest at the{" "}
            <strong style={{ color: WHITE }}>{topWeak[0]}</strong> stage (
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
                border: `1px solid ${filter === id ? ORANGE : BORDER}`,
                background: filter === id ? `${ORANGE}15` : "transparent",
                color: filter === id ? ORANGE : MUTED,
                fontSize: 12,
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
            style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: WHITE,
                marginBottom: 8,
              }}
            >
              No audits yet
            </div>
            <div style={{ fontSize: 14 }}>
              Complete your first Customer Journey Audit to see it here!
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                style={{
                  background: CARD,
                  border: `1px solid ${selected?.id === lead.id ? ORANGE : BORDER}`,
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
                      background: `conic-gradient(${scoreColor(lead.overallScore)} ${lead.overallScore * 3.6}deg, ${BORDER} 0deg)`,
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
                        background: CARD,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
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
                        style={{ fontSize: 15, fontWeight: 700, color: WHITE }}
                      >
                        {lead.businessName || lead.industry}
                        {lead.personaName && lead.personaName !== "Unknown"
                          ? ` — ${lead.personaName}`
                          : ""}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: `${scoreColor(lead.overallScore)}20`,
                          color: scoreColor(lead.overallScore),
                          fontWeight: 600,
                        }}
                      >
                        {scoreLabel(lead.overallScore)}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {lead.industry} · {lead.location} · {lead.pricingTier}
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>
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
                      borderTop: `1px solid ${BORDER}`,
                      padding: "16px 20px",
                      background: "#0d0d0d",
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
                            background: CARD,
                            borderRadius: 8,
                            padding: "10px 12px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: MUTED,
                              textTransform: "uppercase",
                              marginBottom: 3,
                            }}
                          >
                            {item.l}
                          </div>
                          <div style={{ fontSize: 13, color: WHITE }}>
                            {item.v}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Stage breakdown */}
                    <div
                      style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}
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
                            background: CARD,
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: MUTED }}>{s.stage}: </span>
                          <span
                            style={{
                              color: scoreColor(s.pct),
                              fontWeight: 700,
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
                              color: WHITE,
                              border: `1.5px solid ${BORDER}`,
                              fontWeight: 700,
                              fontSize: 13,
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
                              color: WHITE,
                              border: `1.5px solid ${BORDER}`,
                              fontWeight: 700,
                              fontSize: 13,
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
                          background: ORANGE,
                          color: "#000",
                          fontWeight: 800,
                          fontSize: 13,
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
                fontSize: 12,
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

// ══════════════════════════════════════════════════════════════
// USER PROFILE SETTINGS
// ══════════════════════════════════════════════════════════════
function UserProfileSettings({ user, onClose }) {
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      getDoc(doc(db, "users", user.uid))
        .then((snap) => {
          if (snap.exists() && snap.data().whatsapp) {
            setWhatsapp(snap.data().whatsapp);
          }
        })
        .catch((e) => console.error(e));
    });
  }, [user]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      if (email !== user.email) {
        await updateEmail(auth.currentUser, email);
      }
      if (password) {
        await updatePassword(auth.currentUser, password);
      }

      const { doc: fsDoc, setDoc: fsSetDoc } =
        await import("firebase/firestore");
      await fsSetDoc(
        fsDoc(db, "users", auth.currentUser.uid),
        { whatsapp },
        { merge: true },
      );

      setMsg({ text: "Profile updated successfully!", type: "success" });
      setPassword("");
    } catch (err) {
      if (err.code === "auth/requires-recent-login") {
        setMsg({
          text: "Please sign out and sign back in to change sensitive information like email or password.",
          type: "error",
        });
      } else {
        setMsg({ text: err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: DARK,
        color: WHITE,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: `1px solid ${BORDER}`,
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
              background: ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: "#000",
            }}
          >
            H
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              Profile Settings
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>
              Manage your PeoplePlex account
            </div>
          </div>
        </div>
        <div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: `1px solid ${BORDER}`,
              background: "transparent",
              color: MUTED,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            ← Back to Tool
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "40px auto", padding: "0 20px" }}>
        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            padding: "32px",
            borderRadius: 16,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
            Account Settings
          </h2>

          {msg.text && (
            <div
              style={{
                background: msg.type === "error" ? "#ef444420" : "#22c55e20",
                color: msg.type === "error" ? "#ef4444" : "#22c55e",
                padding: "12px",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 24,
                lineHeight: 1.4,
              }}
            >
              {msg.text}
            </div>
          )}

          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: MUTED,
                  marginBottom: 6,
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: DARK,
                  color: WHITE,
                  fontSize: 15,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: MUTED,
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: DARK,
                  color: WHITE,
                  fontSize: 15,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: MUTED,
                  marginBottom: 6,
                }}
              >
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: DARK,
                  color: WHITE,
                  fontSize: 15,
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: MUTED,
                  marginBottom: 6,
                }}
              >
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${BORDER}`,
                  background: DARK,
                  color: WHITE,
                  fontSize: 15,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background: ORANGE,
                color: "#000",
                fontWeight: 700,
                fontSize: 15,
                cursor: loading ? "wait" : "pointer",
                transition: "all .2s",
              }}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SHARED REPORT VIEW
// ══════════════════════════════════════════════════════════════
function SharedReportView({ reportId }) {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    import("firebase/firestore").then(({ doc, getDoc }) => {
      getDoc(doc(db, "public_reports", reportId))
        .then((snap) => {
          if (snap.exists()) setHtml(snap.data().html);
          else setError(true);
        })
        .catch(() => setError(true));
    });
  }, [reportId]);

  if (error)
    return (
      <div
        style={{
          color: "#fff",
          padding: 40,
          textAlign: "center",
          background: DARK,
          minHeight: "100vh",
        }}
      >
        <h2>Report Not Found</h2>
        <p style={{ color: MUTED }}>
          This report may have been deleted or never existed.
        </p>
        <button
          onClick={() => (window.location.href = "/")}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            background: ORANGE,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Start New Audit
        </button>
      </div>
    );
  if (!html)
    return (
      <div
        style={{
          background: DARK,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner message="Loading Shared Report..." />
      </div>
    );

  return (
    <iframe
      srcDoc={html}
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        background: "#fff",
      }}
      title="Shared Report"
    />
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
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
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(undefined);

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

  function handleLogoClick() {
    setShowDashboard(!showDashboard);
  }

  if (user === undefined)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: DARK,
          color: WHITE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner message="Loading..." />
      </div>
    );
  if (!user) return <AuthScreen />;
  if (showSettings)
    return (
      <UserProfileSettings user={user} onClose={() => setShowSettings(false)} />
    );
  if (showDashboard)
    return (
      <UserDashboard
        onClose={() => setShowDashboard(false)}
        onLoadAudit={(lead, targetStep) => {
          setBusiness(lead.business);
          setPersonas(lead.personas);
          setAnswers(lead.answers);
          setLeadId(lead.id);
          setStep(targetStep);
          setShowDashboard(false);
        }}
      />
    );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: DARK,
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        color: WHITE,
        padding: "0 0 60px",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          onClick={() => {
            setShowDashboard(false);
            setShowSettings(false);
            restart();
          }}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            title="Home"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: ORANGE,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 900,
              color: "#000",
              transition: "background .2s",
            }}
          >
            H
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: WHITE,
                lineHeight: 1,
              }}
            >
              PeoplePlex
            </div>
            <div style={{ fontSize: 11, color: MUTED }}>
              Understand Your Customers
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${BORDER}`,
            background: "transparent",
            color: WHITE,
            fontSize: 12,
            cursor: "pointer",
            transition: "all .2s",
            marginRight: 8,
          }}
        >
          Settings
        </button>
        <button
          onClick={handleLogoClick}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${BORDER}`,
            background: CARD,
            color: WHITE,
            fontSize: 12,
            cursor: "pointer",
            transition: "all .2s",
            marginRight: 8,
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => signOut(auth)}
          style={{
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${BORDER}`,
            background: "transparent",
            color: MUTED,
            fontSize: 12,
            cursor: "pointer",
            transition: "all .2s",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 0" }}>
        <Steps current={step} />

        {step === 0 && (
          <StepDescribe
            onNext={(d) => {
              setBusiness(d);
              // ── Save initial audit session to Firestore ──
              const newLeadId = `audit_${Date.now()}`;
              setLeadId(newLeadId);
              const auditData = {
                id: newLeadId,
                businessName: d.businessName,
                additionalNotes: d.additionalNotes,
                industry: d.industry,
                location: d.location,
                pricingTier: d.pricingTier?.label || "Unknown",
                completedAt: new Date().toISOString(),
                source: "PeoplePlex App",
              };

              // Save to Firestore Database
              if (auth.currentUser) {
                setDoc(
                  doc(db, "users", auth.currentUser.uid, "audits", newLeadId),
                  auditData,
                ).catch((err) => {
                  console.error("Firestore save error (Step 1):", err);
                });
              }

              setStep(1);
            }}
          />
        )}
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
          />
        )}
      </div>
    </div>
  );
}
