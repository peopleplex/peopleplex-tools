import { useState, useEffect } from "react";

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
    <label style={{ fontSize: 13, color: MUTED, letterSpacing: ".05em", textTransform: "uppercase" }}>
      {label}
    </label>
    {textarea ? (
      <textarea
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "14px 16px", color: WHITE, fontSize: 15, resize: "vertical",
          outline: "none", fontFamily: "inherit",
        }}
      />
    ) : (
      <input
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: "14px 16px", color: WHITE, fontSize: 15,
          outline: "none", fontFamily: "inherit",
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
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < current ? ORANGE : i === current ? ORANGE : BORDER,
              border: `2px solid ${i <= current ? ORANGE : BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: i <= current ? "#000" : MUTED,
              transition: "all .3s",
            }}>
              {i < current ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: 11, color: i === current ? ORANGE : MUTED, whiteSpace: "nowrap" }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 1, margin: "0 8px", marginBottom: 20,
              background: i < current ? ORANGE : BORDER,
              transition: "all .3s",
            }} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── Loading spinner ────────────────────────────────────────────
const Spinner = ({ message }) => (
  <div style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{
      width: 48, height: 48, borderRadius: "50%",
      border: `3px solid ${BORDER}`,
      borderTop: `3px solid ${ORANGE}`,
      margin: "0 auto 20px",
      animation: "spin 1s linear infinite",
    }} />
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
    premium: "Premium homes · ₹1.5Cr–₹5Cr · Lifestyle apartments, gated communities",
    luxury: "Luxury villas · ₹5Cr+ · Ultra-premium, branded residences, penthouses",
  },
  "training": {
    budget: "Short courses · ₹500–₹5,000 · Certificate programs, quick skills",
    mid: "Skill programs · ₹5,000–₹50,000 · Professional certifications, diplomas",
    premium: "Advanced courses · ₹50,000–₹2L · Specialised, placement-focused",
    luxury: "Elite programs · ₹2L+ · Executive education, international certifications",
  },
  "salon": {
    budget: "Basic services · ₹100–₹500 · Haircut, threading, everyday grooming",
    mid: "Quality services · ₹500–₹2,500 · Styling, treatments, colour",
    premium: "Premium salon · ₹2,500–₹8,000 · Expert stylists, branded products",
    luxury: "Luxury spa salon · ₹8,000+ · Exclusive, bespoke, celebrity experience",
  },
  "restaurant": {
    budget: "Everyday dining · ₹100–₹400 per head · Quick, affordable meals",
    mid: "Casual dining · ₹400–₹1,500 per head · Good food, good experience",
    premium: "Fine dining · ₹1,500–₹5,000 per head · Curated menu, ambience",
    luxury: "Ultra-fine dining · ₹5,000+ per head · Chef's table, exclusivity",
  },
  "consulting": {
    budget: "Basic consulting · ₹5,000–₹20,000/month · Startups, solopreneurs",
    mid: "Growth consulting · ₹20,000–₹1L/month · SMEs, established businesses",
    premium: "Strategic consulting · ₹1L–₹5L/month · Corporate, senior leadership",
    luxury: "Executive advisory · ₹5L+/month · Board-level, enterprise, CXO",
  },
  "healthcare": {
    budget: "General clinic · ₹200–₹800 consultation · Primary care, accessible",
    mid: "Speciality clinic · ₹800–₹3,000 · Quality specialists, diagnostics",
    premium: "Premium hospital · ₹3,000–₹15,000 · Advanced care, private rooms",
    luxury: "Luxury healthcare · ₹15,000+ · Concierge medicine, international care",
  },
  "default": {
    budget: "Entry-level · Lowest price point in your category · Volume-driven",
    mid: "Mid-market · Competitive pricing with quality focus · Best value",
    premium: "Premium tier · Higher price, higher expectation · Experience-led",
    luxury: "Top of market · Price is not the priority · Exclusivity and prestige",
  },
};

function getIndustryKey(industry) {
  const lower = (industry || "").toLowerCase();
  if (lower.includes("real estate") || lower.includes("property") || lower.includes("realty")) return "real estate";
  if (lower.includes("train") || lower.includes("coach") || lower.includes("institute") || lower.includes("education") || lower.includes("course")) return "training";
  if (lower.includes("salon") || lower.includes("spa") || lower.includes("beauty") || lower.includes("grooming")) return "salon";
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe") || lower.includes("dining")) return "restaurant";
  if (lower.includes("consult") || lower.includes("agency") || lower.includes("marketing") || lower.includes("strategy")) return "consulting";
  if (lower.includes("health") || lower.includes("clinic") || lower.includes("hospital") || lower.includes("doctor") || lower.includes("medical")) return "healthcare";
  return "default";
}

const PRICING_TIERS = [
  { id: "budget", label: "Budget", tag: "Mass Market", icon: "◎", color: "#64748b", description: "Price-sensitive customers. Volume-focused. Affordability wins." },
  { id: "mid", label: "Mid-Range", tag: "Value Market", icon: "◈", color: "#3b82f6", description: "Quality-conscious. Best balance of value and experience." },
  { id: "premium", label: "Premium", tag: "Aspirational", icon: "◆", color: "#8b5cf6", description: "Experience-first. Willing to pay more for quality and status." },
  { id: "luxury", label: "Luxury", tag: "Exclusive Market", icon: "◇", color: "#FF6B35", description: "Price is secondary. Exclusivity, prestige, and perfection." },
];

const TIER_INSIGHTS = {
  budget: "Your customer prioritises affordability above all. They compare prices, hunt for deals, and need clear value justification before committing. Trust is built through volume of reviews and word-of-mouth — not premium branding.",
  mid: "Your customer wants quality without overpaying. They research carefully, compare 3-4 options, and respond well to proof of results. They will pay more — but only when they feel the value is clearly justified.",
  premium: "Your customer expects an elevated experience at every touchpoint — from your website to your WhatsApp reply time. They judge credibility by presentation. Price matters less than confidence and professionalism.",
  luxury: "Your customer is buying exclusivity, identity, and an exceptional experience. They want to feel chosen — not sold to. Every interaction must signal elite quality. Price itself signals legitimacy — never discount.",
};

// ══════════════════════════════════════════════════════════════
// STEP 1 — Business Description + Pricing Tier
// ══════════════════════════════════════════════════════════════
function StepDescribe({ onNext }) {
  const [industry, setIndustry] = useState("");
  const [description, setDesc] = useState("");
  const [location, setLocation] = useState("");
  const [pricingTier, setPricing] = useState(null);

  const ready = industry.trim() && description.trim() && location.trim() && pricingTier;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: ORANGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          PeoplePlex
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: WHITE, margin: 0, lineHeight: 1.2 }}>
          Discover Your<br />Customers
        </h1>
        <p style={{ color: MUTED, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>
          Tell us about your business. AI will generate customer personas and map their complete journey with you.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Input label="Industry" placeholder="e.g., Training Institute, Real Estate, Salon" value={industry} onChange={setIndustry} />
        <Input label="Business Description" placeholder="e.g., We run an IT training institute in Chennai offering placement-focused courses for graduates and working professionals." value={description} onChange={setDesc} textarea />
        <Input label="Location" placeholder="e.g., Chennai, India or Online-only" value={location} onChange={setLocation} />

        <div>
          <div style={{ fontSize: 13, color: MUTED, letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 6 }}>
            Pricing Tier
          </div>
          <p style={{ fontSize: 13, color: MUTED, marginBottom: 14, lineHeight: 1.5 }}>
            Where does your product or service sit in the market? This shapes who your customer is and what drives their decision.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PRICING_TIERS.map(tier => {
              const sel = pricingTier && pricingTier.id === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setPricing(tier)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 14,
                    padding: "16px 18px", borderRadius: 12,
                    border: "1.5px solid " + (sel ? tier.color : BORDER),
                    background: sel ? tier.color + "12" : CARD,
                    cursor: "pointer", transition: "all .2s",
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                    border: "2px solid " + (sel ? tier.color : BORDER),
                    background: sel ? tier.color : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .2s",
                  }}>
                    {sel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#000" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: sel ? WHITE : "#aaa" }}>{tier.label}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: tier.color + "22", color: tier.color, fontWeight: 600 }}>
                        {tier.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.4 }}>{tier.description}</div>
                    <div style={{ fontSize: 12, color: sel ? tier.color : "#444", marginTop: 4, fontWeight: 500 }}>{(INDUSTRY_EXAMPLES[getIndustryKey(industry)] || INDUSTRY_EXAMPLES["default"])[tier.id]}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {pricingTier && (
            <div style={{
              marginTop: 14, padding: "14px 16px",
              background: pricingTier.color + "10",
              border: "1px solid " + pricingTier.color + "30",
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 12, color: pricingTier.color, fontWeight: 700, marginBottom: 4 }}>
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
        <OrangeBtn fullWidth disabled={!ready} onClick={() => onNext({ industry, description, location, pricingTier })}>
          Generate Customer Personas →
        </OrangeBtn>
        {!ready && pricingTier === null && industry && description && location && (
          <p style={{ fontSize: 12, color: MUTED, textAlign: "center", marginTop: 10 }}>
            Select your pricing tier to continue
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
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generatePersonas();
  }, []);

  async function generatePersonas() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/generate', {
        method: "POST",
        headers: { "Content-Type": "application/json", },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a customer research expert. Generate exactly 3 distinct customer personas for this business.

Business:
Industry: ${business.industry}
Description: ${business.description}
Location: ${business.location}
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
}`
          }]
        })
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

  if (loading) return <Spinner message="Analysing your business and generating customer personas…" />;
  if (error) return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: "#ef4444", marginBottom: 20 }}>{error}</p>
      <OrangeBtn onClick={generatePersonas}>Try Again</OrangeBtn>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: ORANGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Step 2 of 5
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          Who Is Your Customer?
        </h2>
        <p style={{ color: MUTED, marginTop: 8, fontSize: 14 }}>
          Select the persona that best represents your ideal customer.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {personas?.map(p => (
          <div
            key={p.id}
            onClick={() => setSelected(p)}
            style={{
              background: selected?.id === p.id ? `${ORANGE}10` : CARD,
              border: `1.5px solid ${selected?.id === p.id ? ORANGE : BORDER}`,
              borderRadius: 14, padding: "20px 22px",
              cursor: "pointer", transition: "all .2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: WHITE }}>{p.name}</span>
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 999,
                    background: `${ORANGE}20`, color: ORANGE, fontWeight: 600,
                  }}>{p.archetype}</span>
                </div>
                <div style={{ fontSize: 13, color: MUTED }}>{p.age} · {p.role}</div>
              </div>
              {selected?.id === p.id && (
                <div style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: ORANGE, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 12, color: "#000", fontWeight: 800,
                }}>✓</div>
              )}
            </div>
            <p style={{ fontSize: 14, color: "#aaa", margin: "10px 0 12px", lineHeight: 1.5 }}>
              {p.summary}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "🎯 Primary Goal", value: p.primaryGoal },
                { label: "😰 Biggest Fear", value: p.biggestFear },
              ].map(item => (
                <div key={item.label} style={{
                  background: "#0d0d0d", borderRadius: 8, padding: "10px 12px",
                }}>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 13, color: WHITE, lineHeight: 1.4 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        <OrangeBtn secondary onClick={onBack}>← Back</OrangeBtn>
        <OrangeBtn fullWidth disabled={!selected} onClick={() => onNext(selected)}>
          Map Their Journey →
        </OrangeBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 3 — Journey Map
// ══════════════════════════════════════════════════════════════
function StepJourney({ business, persona, onNext, onBack }) {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => { generateJourney(); }, []);

  async function generateJourney() {
    // Unique smart fallbacks per stage in case API fails
    const smartFallbacks = [
      {
        stage: "Aware",
        intent: `${persona.name} is trying to solve a problem or achieve ${persona.primaryGoal} — but doesn't know the solution yet`,
        behaviour: `Searching Google and YouTube for answers, asking friends and colleagues, noticing businesses like yours on social media`,
        painPoint: `Doesn't know what they don't know. Overwhelmed by options. Not sure if their problem is common or fixable`,
        touchpoint: `Google search, YouTube, Instagram, LinkedIn, word-of-mouth from trusted contacts`,
        insight: `At this stage they're problem-aware, not solution-aware. Speak to their problem — not your service`,
      },
      {
        stage: "Appeal",
        intent: `${persona.name} is evaluating whether your business looks credible and relevant enough to explore further`,
        behaviour: `Visiting your website, scanning your social media, comparing you to competitors, checking if you serve people like them`,
        painPoint: `Most businesses look the same. Hard to tell who's actually good vs who just looks good`,
        touchpoint: `Your website, Instagram profile, Google Business listing, LinkedIn page, first impressions everywhere`,
        insight: `You have 7 seconds. If your positioning, credibility, and relevance aren't immediately clear — they leave`,
      },
      {
        stage: "Ask",
        intent: `${persona.name} is researching whether they can actually trust you before committing any money or time`,
        behaviour: `Reading Google reviews, looking for case studies, asking friends if they've heard of you, checking recent social activity`,
        painPoint: `Fear of wasting money. Past experience with businesses that overpromised. Can't tell who's genuine`,
        touchpoint: `Google Reviews, testimonials, social proof, LinkedIn recommendations, word-of-mouth from existing customers`,
        insight: `This is where most businesses silently lose customers. Social proof isn't optional — it's the deciding factor`,
      },
      {
        stage: "Act",
        intent: `${persona.name} has decided they want to move forward — now they're trying to figure out HOW to start`,
        behaviour: `Clicking contact/WhatsApp/call buttons, filling enquiry forms, DM'ing on Instagram, comparing final options`,
        painPoint: `Friction in the process. Slow response times. Confusing next steps. Feeling like just another lead`,
        touchpoint: `WhatsApp, phone call, contact form, DM, walk-in, booking page — wherever you make it easy to start`,
        insight: `Speed wins. The business that responds fastest and makes it easiest to start — gets the customer`,
      },
      {
        stage: "Advocate",
        intent: `${persona.name} had a great experience and naturally wants to tell others — but usually needs a small nudge`,
        behaviour: `Mentioning you to friends, sharing your content, leaving a review if asked, referring people who have the same problem`,
        painPoint: `No one asked them. They forgot. They don't know how to refer or what to say about you specifically`,
        touchpoint: `WhatsApp follow-up, review request, referral program, social media tag, email check-in`,
        insight: `Happy customers are your best salespeople — but only if you activate them. Ask directly and make it easy`,
      },
    ];

    try {
      const res = await fetch('/api/generate', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: `You are a customer journey expert. Map the complete journey of this specific customer persona for this specific business.

Business Industry: ${business.industry}
Business Description: ${business.description}
Location: ${business.location}
Persona Name: ${persona.name}
Persona Role: ${persona.role}
Persona Archetype: ${persona.archetype}
Their Primary Goal: ${persona.primaryGoal}
Their Biggest Fear: ${persona.biggestFear}
What Triggers Them: ${persona.trigger}

Generate a SPECIFIC, DETAILED journey map. Make each stage unique and relevant to this exact persona and business.
Do NOT use generic placeholder text.

Return ONLY valid JSON, no markdown backticks, no explanation, just the JSON object:
{"stages":[{"stage":"Aware","intent":"specific intent for this persona","behaviour":"specific behaviour","painPoint":"specific pain point","touchpoint":"specific platforms and channels","insight":"specific actionable insight"},{"stage":"Appeal","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Ask","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Act","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."},{"stage":"Advocate","intent":"...","behaviour":"...","painPoint":"...","touchpoint":"...","insight":"..."}]}`
          }]
        })
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

      if (!parsed.stages || parsed.stages.length !== 5) {
        throw new Error("Invalid stages data");
      }

      setJourney(parsed.stages);
    } catch (e) {
      console.error("Journey generation error:", e.message);
      // Use smart unique fallbacks instead of identical generic text
      setJourney(smartFallbacks);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spinner message="Mapping your customer's complete journey…" />;

  const stage = journey?.[active];
  const stageInfo = JOURNEY_STAGES[active];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: ORANGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Step 3 of 5
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          {persona.name}'s Journey
        </h2>
        <p style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
          5 stages they go through before becoming your customer.
        </p>
      </div>

      {/* Stage tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {JOURNEY_STAGES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActive(i)}
            style={{
              padding: "8px 16px", borderRadius: 999, border: "none",
              background: active === i ? ORANGE : CARD,
              color: active === i ? "#000" : MUTED,
              fontSize: 13, fontWeight: active === i ? 700 : 400,
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all .2s",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Stage card */}
      {stage && (
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: WHITE, marginBottom: 4 }}>
              {stageInfo.icon} {stage.stage}
            </div>
            <div style={{ fontSize: 14, color: MUTED }}>{stageInfo.description}</div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {[
              { label: "Intent", value: stage.intent, icon: "🎯" },
              { label: "Behaviour", value: stage.behaviour, icon: "👁" },
              { label: "Pain Point", value: stage.painPoint, icon: "😤" },
              { label: "Touchpoint", value: stage.touchpoint, icon: "📍" },
            ].map(item => (
              <div key={item.label} style={{
                background: "#0d0d0d", borderRadius: 10, padding: "14px 16px",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 14, color: WHITE, lineHeight: 1.5 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, padding: "14px 16px",
            background: `${ORANGE}10`, border: `1px solid ${ORANGE}30`,
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, color: ORANGE, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
              💡 Key Insight
            </div>
            <div style={{ fontSize: 14, color: WHITE, lineHeight: 1.5 }}>{stage.insight}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <OrangeBtn secondary onClick={onBack}>← Back</OrangeBtn>
        <OrangeBtn fullWidth onClick={onNext}>
          Audit Your Business →
        </OrangeBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 4 — Audit
// ══════════════════════════════════════════════════════════════
function StepAudit({ persona, onNext, onBack }) {
  const [answers, setAnswers] = useState({});
  const [activeStage, setActive] = useState(0);

  function toggle(stageId, idx) {
    const key = `${stageId}_${idx}`;
    setAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function stageScore(stageId) {
    const qs = JOURNEY_STAGES.find(s => s.id === stageId).questions;
    const yes = qs.filter((_, i) => answers[`${stageId}_${i}`]).length;
    return { yes, total: qs.length, pct: Math.round((yes / qs.length) * 100) };
  }

  const totalYes = JOURNEY_STAGES.reduce((acc, s) => acc + stageScore(s.id).yes, 0);
  const totalQ = JOURNEY_STAGES.reduce((acc, s) => acc + s.questions.length, 0);
  const totalPct = Math.round((totalYes / totalQ) * 100);
  const answeredAll = Object.keys(answers).length > 0;

  const stage = JOURNEY_STAGES[activeStage];
  const sc = stageScore(stage.id);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: ORANGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
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
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 12, padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 16, marginBottom: 20,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `conic-gradient(${scoreColor(totalPct)} ${totalPct * 3.6}deg, ${BORDER} 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: CARD, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 13, fontWeight: 800, color: WHITE,
          }}>{totalPct}%</div>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: WHITE }}>Overall Score</div>
          <div style={{ fontSize: 13, color: MUTED }}>{totalYes} of {totalQ} checks passed</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{
            padding: "4px 14px", borderRadius: 999,
            background: `${scoreColor(totalPct)}20`,
            color: scoreColor(totalPct), fontSize: 12, fontWeight: 700,
          }}>{scoreLabel(totalPct)}</span>
        </div>
      </div>

      {/* Stage tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {JOURNEY_STAGES.map((s, i) => {
          const sc = stageScore(s.id);
          return (
            <button key={s.id} onClick={() => setActive(i)} style={{
              padding: "7px 14px", borderRadius: 999,
              border: `1px solid ${activeStage === i ? ORANGE : BORDER}`,
              background: activeStage === i ? `${ORANGE}15` : "transparent",
              color: activeStage === i ? ORANGE : MUTED,
              fontSize: 12, cursor: "pointer", display: "flex",
              alignItems: "center", gap: 6, transition: "all .2s",
            }}>
              {s.icon} {s.label}
              <span style={{
                fontSize: 11,
                color: scoreColor(sc.pct),
              }}>{sc.yes}/{sc.total}</span>
            </button>
          );
        })}
      </div>

      {/* Questions */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginBottom: 2 }}>
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
                  display: "flex", alignItems: "flex-start", gap: 14,
                  padding: "16px 20px",
                  borderBottom: i < stage.questions.length - 1 ? `1px solid ${BORDER}` : "none",
                  cursor: "pointer",
                  background: checked ? `${ORANGE}08` : "transparent",
                  transition: "background .15s",
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${checked ? ORANGE : BORDER}`,
                  background: checked ? ORANGE : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, color: "#000", fontWeight: 800,
                  transition: "all .15s",
                }}>
                  {checked ? "✓" : ""}
                </div>
                <span style={{
                  fontSize: 14, color: checked ? WHITE : "#aaa",
                  lineHeight: 1.5, transition: "color .15s",
                }}>{q}</span>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${BORDER}`, background: "#0d0d0d" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: MUTED }}>
              {stage.label} Score: {sc.yes}/{sc.total} ({sc.pct}%)
            </span>
            <span style={{
              fontSize: 12, padding: "3px 12px", borderRadius: 999,
              background: `${scoreColor(sc.pct)}20`,
              color: scoreColor(sc.pct), fontWeight: 700,
            }}>{scoreLabel(sc.pct)}</span>
          </div>
          <div style={{
            height: 4, background: BORDER, borderRadius: 999, marginTop: 10,
          }}>
            <div style={{
              height: "100%", borderRadius: 999,
              width: `${sc.pct}%`,
              background: scoreColor(sc.pct),
              transition: "width .4s ease",
            }} />
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {activeStage > 0 && (
          <OrangeBtn secondary onClick={() => setActive(a => a - 1)}>← Prev Stage</OrangeBtn>
        )}
        {activeStage < JOURNEY_STAGES.length - 1 && (
          <OrangeBtn onClick={() => setActive(a => a + 1)}>Next Stage →</OrangeBtn>
        )}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <OrangeBtn secondary onClick={onBack}>← Back</OrangeBtn>
        <OrangeBtn fullWidth disabled={!answeredAll} onClick={() => onNext(answers)}>
          See My Results →
        </OrangeBtn>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STEP 5 — Results + Lead Capture + PDF + Email
// ══════════════════════════════════════════════════════════════
function StepResults({ business, persona, answers, onRestart }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Calculate scores
  const stageScores = JOURNEY_STAGES.map(s => {
    const yes = s.questions.filter((_, i) => answers[`${s.id}_${i}`]).length;
    return { ...s, yes, total: s.questions.length, pct: Math.round((yes / s.questions.length) * 100) };
  });
  const totalYes = stageScores.reduce((a, s) => a + s.yes, 0);
  const totalQ = stageScores.reduce((a, s) => a + s.total, 0);
  const totalPct = Math.round((totalYes / totalQ) * 100);
  const weakest = [...stageScores].sort((a, b) => a.pct - b.pct)[0];
  const strongest = [...stageScores].sort((a, b) => b.pct - a.pct)[0];
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  // ── Generate AI insight ───────────────────────────────────
  async function handleSubmit() {
    if (!name || !email || !phone) return;
    setSubmitted(true);
    setLoadingAI(true);

    // ══════════════════════════════════════════════════════
    // CONFIG — Update these before going live
    // ══════════════════════════════════════════════════════
    const CONFIG = {
      // Google Sheets Web App URL (from Apps Script deployment)
      // Setup: sheet.new → Extensions → Apps Script → paste doPost fn → Deploy
      SHEETS_WEBHOOK: "YOUR_GOOGLE_SHEETS_WEBHOOK_URL",

      // Your WhatsApp Business number (country code + number, no spaces/+)
      // e.g. India: "919566812543"
      WA_BUSINESS: "919566812543",

      // Your booking/consultation link
      BOOKING_LINK: "https://iamhariharan.com/training-institutes",
    };

    // ── 1. Save to persistent storage (always works, backup) ──
    try {
      const leadId = `lead_${Date.now()}`;
      const leadData = {
        id: leadId, name, email, phone,
        industry: business.industry,
        location: business.location,
        pricingTier: business.pricingTier?.label || "Unknown",
        personaName: persona.name,
        personaArchetype: persona.archetype,
        overallScore: totalPct,
        weakestStage: weakest.label,
        strongestStage: strongest.label,
        stageScores: stageScores.map(s => ({ stage: s.label, pct: s.pct })),
        completedAt: new Date().toISOString(),
        source: window.location.hostname || "direct",
      };
      localStorage.setItem(leadId, JSON.stringify(leadData));
      let index = [];
      try {
        const idxResult = localStorage.getItem("lead_index");
        if (idxResult) index = JSON.parse(idxResult);
      } catch (e) { index = []; }
      index.unshift(leadId);
      localStorage.setItem("lead_index", JSON.stringify(index));
    } catch (storageErr) { console.warn("Storage save failed:", storageErr); }

    // ── 2. Send to Google Sheets via webhook ──────────────────
    if (CONFIG.SHEETS_WEBHOOK && CONFIG.SHEETS_WEBHOOK !== "YOUR_GOOGLE_SHEETS_WEBHOOK_URL") {
      try {
        await fetch(CONFIG.SHEETS_WEBHOOK, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            name, email, phone,
            industry: business.industry,
            location: business.location,
            pricingTier: business.pricingTier?.label || "Unknown",
            persona: `${persona.name} — ${persona.archetype}`,
            overallScore: totalPct + "%",
            weakest: `${weakest.label} (${weakest.pct}%)`,
            strongest: `${strongest.label} (${strongest.pct}%)`,
            aware: stageScores.find(s => s.id === "aware")?.pct + "%" || "",
            appeal: stageScores.find(s => s.id === "appeal")?.pct + "%" || "",
            ask: stageScores.find(s => s.id === "ask")?.pct + "%" || "",
            act: stageScores.find(s => s.id === "act")?.pct + "%" || "",
            advocate: stageScores.find(s => s.id === "advocate")?.pct + "%" || "",
            source: window.location.hostname || "direct",
          }),
        });
      } catch (e) { console.warn("Sheets webhook failed:", e.message); }
    }

    // ── 3. WhatsApp Business notification ────────────────────
    try {
      const waMsg = encodeURIComponent(
        `🔔 *NEW AUDIT LEAD*

` +
        `👤 *Name:* ${name}
` +
        `📧 *Email:* ${email}
` +
        `📱 *Phone:* ${phone}

` +
        `🏢 *Industry:* ${business.industry}
` +
        `📍 *Location:* ${business.location}
` +
        `💰 *Tier:* ${business.pricingTier?.label || "Unknown"}

` +
        `📊 *Score:* ${totalPct}%
` +
        `❌ *Weakest:* ${weakest.label} (${weakest.pct}%)
` +
        `✅ *Strongest:* ${strongest.label} (${strongest.pct}%)

` +
        `⏰ ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}

` +
        `👉 Follow up now: wa.me/${phone.replace(/[^0-9]/g, "")}`
      );
      const waLink = `https://wa.me/${CONFIG.WA_BUSINESS}?text=${waMsg}`;
      sessionStorage.setItem("pendingNotification", waLink);
      sessionStorage.setItem("pendingLeadName", name);
    } catch (e) { /* silent */ }

    try {
      const scoresSummary = stageScores.map(s => `${s.label}: ${s.pct}%`).join(", ");
      const res = await fetch('/api/generate', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a marketing consultant giving personalised advice.

Business: ${business.description}
Industry: ${business.industry}
Location: ${business.location}
Customer Persona Audited: ${persona.name} - ${persona.archetype}
Audit Scores: ${scoresSummary}
Weakest Stage: ${weakest.label} (${weakest.pct}%)
Strongest Stage: ${strongest.label} (${strongest.pct}%)
Overall Score: ${totalPct}%

Write a personalised 3-paragraph insight report (no headers, just plain paragraphs).
Para 1: What's working and why it matters for retaining customers.
Para 2: The biggest gap (weakest stage) and specifically what it is costing them right now.
Para 3: The single most important thing to fix first and why it will have the biggest impact.
Be specific, direct, and actionable. Under 200 words total.`
          }]
        })
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
    const stageRows = stageScores.map(s => `
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
    `).join("");

    const checkedItems = JOURNEY_STAGES.map(s => {
      const passed = s.questions.filter((_, i) => answers[`${s.id}_${i}`]);
      const failed = s.questions.filter((_, i) => !answers[`${s.id}_${i}`]);
      return `
        <div style="margin-bottom:24px;">
          <h3 style="color:#FF6B35;margin:0 0 12px;font-size:15px;">${s.icon} ${s.label} Stage</h3>
          ${passed.map(q => `<div style="padding:8px 12px;margin-bottom:6px;background:#1a1a1a;border-radius:8px;border-left:3px solid #22c55e;color:#ccc;font-size:13px;">✓ ${q}</div>`).join("")}
          ${failed.map(q => `<div style="padding:8px 12px;margin-bottom:6px;background:#1a1a1a;border-radius:8px;border-left:3px solid #ef4444;color:#777;font-size:13px;">✗ ${q}</div>`).join("")}
        </div>
      `;
    }).join("");

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Customer Journey Audit Report — ${name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0a0a0a; color:#f5f5f5; font-family:'Segoe UI',sans-serif; padding:40px 24px; }
  .container { max-width:720px; margin:0 auto; }
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
      ${persona.name}'s Journey — How Well Is Your Business Performing?
    </h1>
    <p style="color:#777;font-size:14px;">Prepared for: <strong style="color:#aaa;">${name}</strong> · ${email} · ${phone}</p>
  </div>

  <!-- Business Info -->
  <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:20px;margin-bottom:24px;">
    <div style="font-size:12px;color:#FF6B35;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;">Business Details</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><div style="font-size:11px;color:#555;margin-bottom:4px;">INDUSTRY</div><div style="color:#f5f5f5;font-size:14px;">${business.industry}</div></div>
      <div><div style="font-size:11px;color:#555;margin-bottom:4px;">LOCATION</div><div style="color:#f5f5f5;font-size:14px;">${business.location}</div></div>
      <div style="grid-column:1/-1;"><div style="font-size:11px;color:#555;margin-bottom:4px;">CUSTOMER PERSONA AUDITED</div><div style="color:#f5f5f5;font-size:14px;">${persona.name} — ${persona.archetype}</div></div>
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
  ${aiInsight ? `
  <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:24px;">
    <div style="font-size:13px;font-weight:700;color:#FF6B35;margin-bottom:14px;">💡 Personalised Gap Analysis</div>
    <p style="font-size:14px;color:#ccc;line-height:1.8;">${aiInsight.replace(/\n\n/g, '</p><p style="font-size:14px;color:#ccc;line-height:1.8;margin-top:12px;">')}</p>
  </div>` : ""}

  <!-- Detailed Checklist -->
  <div style="background:#111;border:1px solid #1e1e1e;border-radius:14px;padding:24px;margin-bottom:24px;">
    <div style="font-size:13px;font-weight:700;color:#f5f5f5;margin-bottom:20px;">Detailed Audit Checklist</div>
    ${checkedItems}
  </div>

  <!-- CTA -->
  <div style="background:#FF6B3515;border:1px solid #FF6B3540;border-radius:14px;padding:28px;text-align:center;">
    <div style="font-size:20px;font-weight:800;color:#f5f5f5;margin-bottom:8px;">Ready to Fix Your Biggest Gap?</div>
    <p style="font-size:14px;color:#777;margin-bottom:20px;line-height:1.6;">
      Book a free 30-minute Enrollment System Audit Call.<br/>
      You bring this report. I bring the analysis.
    </p>
    <a href="https://iamhariharan.com/training-institutes" style="
      display:inline-block;padding:14px 28px;background:#FF6B35;
      color:#000;font-weight:700;border-radius:10px;text-decoration:none;font-size:15px;
    ">Book Audit Call →</a>
    <div style="margin-top:16px;font-size:13px;color:#555;">
      peopleplex.in · Powered by PeoplePlex (peopleplex.in)
    </div>
  </div>

</div>
</body>
</html>`;
  }

  // ── Download as HTML file (opens print dialog for PDF) ───
  function handleDownload() {
    setDownloading(true);
    try {
      const html = buildReportHTML();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Customer-Journey-Audit-${name.replace(/\s+/g, "-")}-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  // ── Send email via mailto (opens mail client) ────────────
  // In Firebase: replace this with EmailJS / Resend / Nodemailer
  function handleEmailReport() {
    setEmailSending(true);
    try {
      const scoreLines = stageScores.map(s => `${s.label}: ${s.pct}% (${scoreLabel(s.pct)})`).join("\n");
      const subject = encodeURIComponent(`Your Customer Journey Audit Report — ${totalPct}% Overall Score`);
      const body = encodeURIComponent(
        `Hi ${name},

Thank you for completing your Customer Journey Audit on PeoplePlex (peopleplex.in).

Here are your results:

OVERALL SCORE: ${totalPct}% — ${scoreLabel(totalPct)}

STAGE BREAKDOWN:
${scoreLines}

STRONGEST STAGE: ${strongest.label} (${strongest.pct}%)
BIGGEST GAP: ${weakest.label} (${weakest.pct}%)

${aiInsight ? `PERSONALISED INSIGHT:\n${aiInsight}\n` : ""}

---
NEXT STEP: Book a free 30-minute Enrollment System Audit Call
→ https://iamhariharan.com/training-institutes

You bring this report. I bring the analysis.
We identify exactly what to fix first — and build a plan around it.

Best regards,
Hariharan M
Strategic Marketing Systems Builder
PeoplePlex (peopleplex.in)
hari@PeoplePlex (peopleplex.in)
`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setTimeout(() => setEmailSent(true), 1000);
    } finally {
      setEmailSending(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: ORANGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>
          Your Results
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: 0 }}>
          {persona.name}'s Journey Audit
        </h2>
        <p style={{ color: MUTED, marginTop: 6, fontSize: 14 }}>
          Here's how your business performs at each stage of their journey.
        </p>
      </div>

      {/* Big score */}
      <div style={{
        background: CARD, border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: 24, marginBottom: 16, textAlign: "center",
      }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: scoreColor(totalPct), lineHeight: 1 }}>
          {totalPct}%
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: WHITE, marginTop: 8 }}>
          {scoreLabel(totalPct)} — {totalYes}/{totalQ} checks passed
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>
          Weakest: <span style={{ color: "#ef4444" }}>{weakest.label}</span>
          {" · "}
          Strongest: <span style={{ color: "#22c55e" }}>{strongest.label}</span>
        </div>
      </div>

      {/* Stage bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {stageScores.map(s => (
          <div key={s.id} style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: "14px 18px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>
                {s.icon} {s.label}
              </span>
              <span style={{ fontSize: 13, color: scoreColor(s.pct), fontWeight: 700 }}>
                {s.yes}/{s.total} · {s.pct}%
              </span>
            </div>
            <div style={{ height: 6, background: BORDER, borderRadius: 999 }}>
              <div style={{
                height: "100%", borderRadius: 999,
                width: `${s.pct}%`, background: scoreColor(s.pct),
                transition: "width .6s ease",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Lead capture OR full report */}
      {!submitted ? (
        <div style={{
          background: `${ORANGE}10`, border: `1px solid ${ORANGE}30`,
          borderRadius: 16, padding: 24,
        }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: WHITE, marginBottom: 6 }}>
            Get Your Personalised Gap Report
          </div>
          <p style={{ fontSize: 14, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
            Enter your details to unlock your AI-powered gap analysis — and get the full report sent to your email.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Your Name" placeholder="e.g., Rajesh Kumar" value={name} onChange={setName} />
            <Input label="Email Address" placeholder="your@email.com" value={email} onChange={setEmail} />
            <Input label="WhatsApp Number" placeholder="+91 98765 43210" value={phone} onChange={setPhone} />
          </div>
          <div style={{ marginTop: 18 }}>
            <OrangeBtn fullWidth disabled={!name || !email || !phone} onClick={handleSubmit}>
              Generate My Gap Report →
            </OrangeBtn>
          </div>
          <p style={{ fontSize: 12, color: MUTED, marginTop: 12, textAlign: "center" }}>
            🔒 Your details are only used to send your report. No spam.
          </p>
        </div>

      ) : loadingAI ? (
        <Spinner message="Generating your personalised gap report…" />

      ) : (
        <div>
          {/* AI Insight Card */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: 24, marginBottom: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: ORANGE, marginBottom: 14 }}>
              💡 Your Personalised Gap Analysis
            </div>
            {aiInsight?.split("\n\n").map((para, i) => (
              <p key={i} style={{ fontSize: 14, color: "#ccc", lineHeight: 1.8, margin: i > 0 ? "12px 0 0" : 0 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Report Actions */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: 20, marginBottom: 16,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, marginBottom: 6 }}>
              📄 Your Full Report is Ready
            </div>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              Includes your complete checklist, stage breakdown, and personalised insights. Save it or send it to your inbox.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  flex: 1, minWidth: 140,
                  padding: "13px 18px",
                  borderRadius: 10, border: `1.5px solid ${ORANGE}`,
                  background: "transparent", color: ORANGE,
                  fontSize: 14, fontWeight: 700,
                  cursor: downloading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  transition: "all .2s",
                }}
              >
                {downloading ? "⏳ Preparing…" : "⬇ Download Report"}
              </button>

              {/* Email Button */}
              <button
                onClick={handleEmailReport}
                disabled={emailSending || emailSent}
                style={{
                  flex: 1, minWidth: 140,
                  padding: "13px 18px",
                  borderRadius: 10, border: `1.5px solid ${emailSent ? "#22c55e" : BORDER}`,
                  background: emailSent ? "#22c55e18" : "transparent",
                  color: emailSent ? "#22c55e" : MUTED,
                  fontSize: 14, fontWeight: 700,
                  cursor: emailSent ? "default" : "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 8,
                  transition: "all .2s",
                }}
              >
                {emailSent ? "✓ Email Sent!" : emailSending ? "⏳ Opening…" : `✉ Email to ${email.split("@")[0]}@…`}
              </button>
            </div>

            {/* Instruction note */}
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#0d0d0d", borderRadius: 8,
              fontSize: 12, color: MUTED, lineHeight: 1.5,
            }}>
              💡 <strong style={{ color: "#aaa" }}>Download</strong> saves an HTML file — open in browser and use <em>Print → Save as PDF</em> for a perfect PDF copy.
              {" "}<strong style={{ color: "#aaa" }}>Email</strong> opens your mail app with the full report pre-filled.
            </div>
          </div>

          {/* Dual CTA */}
          <div style={{
            background: `${ORANGE}10`, border: `1px solid ${ORANGE}40`,
            borderRadius: 16, padding: 24,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: WHITE, marginBottom: 6 }}>
              Ready to Fix Your Biggest Gap?
            </div>
            <p style={{ fontSize: 14, color: MUTED, marginBottom: 20, lineHeight: 1.6 }}>
              Your <span style={{ color: "#ef4444", fontWeight: 700 }}>{weakest.label}</span> stage at <strong style={{ color: "#ef4444" }}>{weakest.pct}%</strong> is costing you customers right now. Book a call — you bring this report, I bring the analysis.
            </p>

            {/* TWO CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Primary: Book Audit Call */}
              <button
                onClick={() => window.open("https://iamhariharan.com/training-institutes", "_blank")}
                style={{
                  width: "100%", padding: "16px 24px",
                  borderRadius: 12, border: "none",
                  background: ORANGE, color: "#000",
                  fontSize: 16, fontWeight: 800,
                  cursor: "pointer", transition: "all .2s",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10,
                }}
              >
                📞 Book Free Audit Call →
              </button>

              {/* Secondary: Download Report */}
              <button
                onClick={handleDownload}
                style={{
                  width: "100%", padding: "15px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${BORDER}`,
                  background: "transparent", color: WHITE,
                  fontSize: 15, fontWeight: 700,
                  cursor: "pointer", transition: "all .2s",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 10,
                }}
              >
                ⬇ Download Full Report
              </button>
            </div>

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                onClick={onRestart}
                style={{
                  background: "none", border: "none",
                  color: MUTED, fontSize: 13,
                  cursor: "pointer", textDecoration: "underline",
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
// ADMIN DASHBOARD — Lead Tracking
// ══════════════════════════════════════════════════════════════
function AdminDashboard({ onClose }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [notifLink, setNotifLink] = useState(null);

  useEffect(() => {
    loadLeads();
    const pending = sessionStorage.getItem("pendingNotification");
    if (pending) { setNotifLink(pending); sessionStorage.removeItem("pendingNotification"); }
  }, []);

  async function loadLeads() {
    setLoading(true);
    try {
      let index = [];
      try {
        const idxResult = localStorage.getItem("lead_index");
        if (idxResult) index = JSON.parse(idxResult);
      } catch (e) { index = []; }

      const loaded = [];
      for (const id of index.slice(0, 100)) {
        try {
          const r = localStorage.getItem(id);
          if (r) loaded.push(JSON.parse(r));
        } catch (e) { }
      }
      setLeads(loaded);
    } catch (e) { setLeads([]); }
    finally { setLoading(false); }
  }

  async function clearAllLeads() {
    if (!window.confirm("Delete all leads? This cannot be undone.")) return;
    try {
      const idxResult = localStorage.getItem("lead_index");
      if (idxResult) {
        const index = JSON.parse(idxResult);
        for (const id of index) { try { localStorage.removeItem(id); } catch (e) { } }
      }
      localStorage.removeItem("lead_index");
      setLeads([]);
    } catch (e) { }
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Phone", "Industry", "Location", "Tier", "Persona", "Score", "Weakest", "Strongest", "Date"];
    const rows = leads.map(l => [
      l.name, l.email, l.phone, l.industry, l.location,
      l.pricingTier, l.personaName, l.overallScore + "%",
      l.weakestStage, l.strongestStage,
      new Date(l.completedAt).toLocaleDateString("en-IN")
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${Date.now()}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  function notifyOnWhatsApp(lead) {
    const YOUR_WHATSAPP = "919566812543"; // REPLACE with your number
    const msg = encodeURIComponent(
      `Hi ${lead.name}, I saw you completed the Customer Journey Audit on PeoplePlex.com.\n\n` +
      `Your score was ${lead.overallScore}% — your biggest gap is the ${lead.weakestStage} stage.\n\n` +
      `I have a specific idea for how to fix that. Are you free for a quick 15-minute call this week?`
    );
    window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${msg}`, "_blank");
  }

  const filteredLeads = leads.filter(l => {
    if (filter === "all") return true;
    if (filter === "critical") return l.overallScore < 40;
    if (filter === "developing") return l.overallScore >= 40 && l.overallScore < 70;
    if (filter === "strong") return l.overallScore >= 70;
    return true;
  });

  // Stats
  const avgScore = leads.length ? Math.round(leads.reduce((a, l) => a + l.overallScore, 0) / leads.length) : 0;
  const critCount = leads.filter(l => l.overallScore < 40).length;
  const industries = [...new Set(leads.map(l => l.industry))].length;
  const weakStages = leads.reduce((acc, l) => { acc[l.weakestStage] = (acc[l.weakestStage] || 0) + 1; return acc; }, {});
  const topWeak = Object.entries(weakStages).sort((a, b) => b[1] - a[1])[0];

  return (
    <div style={{ minHeight: "100vh", background: DARK, color: WHITE, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#000" }}>H</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Lead Dashboard</div>
            <div style={{ fontSize: 11, color: MUTED }}>Admin View · PeoplePlex</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportCSV} disabled={!leads.length} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: leads.length ? WHITE : MUTED, fontSize: 12, cursor: leads.length ? "pointer" : "not-allowed" }}>⬇ Export CSV</button>
          <button onClick={onClose} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>← Back to Tool</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px" }}>

        {/* WhatsApp notification prompt */}
        {notifLink && (
          <div style={{ background: "#22c55e18", border: "1px solid #22c55e40", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ fontSize: 14, color: "#22c55e" }}>🔔 New lead just submitted! Send yourself a WhatsApp notification.</div>
            <button onClick={() => { window.open(notifLink, "_blank"); setNotifLink(null); }} style={{ padding: "8px 16px", borderRadius: 8, background: "#22c55e", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Send Now →</button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Leads", value: leads.length, icon: "👥", color: ORANGE },
            { label: "Avg Score", value: avgScore + "%", icon: "📊", color: scoreColor(avgScore) },
            { label: "Critical (<40%)", value: critCount, icon: "🚨", color: "#ef4444" },
            { label: "Industries", value: industries, icon: "🏢", color: "#3b82f6" },
          ].map(stat => (
            <div key={stat.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{stat.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: stat.color, lineHeight: 1.1, marginTop: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top insight bar */}
        {topWeak && (
          <div style={{ background: `${ORANGE}10`, border: `1px solid ${ORANGE}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#ccc" }}>
            💡 <strong style={{ color: ORANGE }}>Pattern detected:</strong> Most of your leads are weakest at the <strong style={{ color: WHITE }}>{topWeak[0]}</strong> stage ({topWeak[1]} of {leads.length} leads). Consider creating content specifically about this.
          </div>
        )}

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[["all", "All Leads"], ["critical", "🚨 Critical (<40%)"], ["developing", "🟡 Developing (40–70%)"], ["strong", "✅ Strong (70%+)"]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${filter === id ? ORANGE : BORDER}`, background: filter === id ? `${ORANGE}15` : "transparent", color: filter === id ? ORANGE : MUTED, fontSize: 12, cursor: "pointer" }}>
              {label} {id === "all" ? `(${leads.length})` : `(${filteredLeads.length})`}
            </button>
          ))}
        </div>

        {/* Lead list */}
        {loading ? (
          <Spinner message="Loading leads…" />
        ) : filteredLeads.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginBottom: 8 }}>No leads yet</div>
            <div style={{ fontSize: 14 }}>Share your tool link and leads will appear here as people complete the audit.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredLeads.map(lead => (
              <div key={lead.id} style={{ background: CARD, border: `1px solid ${selected?.id === lead.id ? ORANGE : BORDER}`, borderRadius: 14, overflow: "hidden", transition: "border-color .2s" }}>

                {/* Lead summary row */}
                <div onClick={() => setSelected(selected?.id === lead.id ? null : lead)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Score circle */}
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: `conic-gradient(${scoreColor(lead.overallScore)} ${lead.overallScore * 3.6}deg, ${BORDER} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: CARD, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: scoreColor(lead.overallScore) }}>{lead.overallScore}%</div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: WHITE }}>{lead.name}</span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: `${scoreColor(lead.overallScore)}20`, color: scoreColor(lead.overallScore), fontWeight: 600 }}>{scoreLabel(lead.overallScore)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{lead.industry} · {lead.location} · {lead.pricingTier}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>Weakest: <span style={{ color: "#ef4444" }}>{lead.weakestStage}</span> · {new Date(lead.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); notifyOnWhatsApp(lead); }} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "#25D366", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>💬 WA</button>
                    <button onClick={e => { e.stopPropagation(); window.location.href = `mailto:${lead.email}?subject=Your Customer Journey Audit Results&body=Hi ${lead.name},%0D%0A%0D%0AThank you for completing the audit. Your score was ${lead.overallScore}%.%0D%0A%0D%0AWould you like to book a call to discuss your results?%0D%0A%0D%0ABest,%0D%0AHariharan`; }} style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>✉ Email</button>
                  </div>
                </div>

                {/* Expanded detail */}
                {selected?.id === lead.id && (
                  <div style={{ borderTop: `1px solid ${BORDER}`, padding: "16px 20px", background: "#0d0d0d" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                      {[
                        { l: "Email", v: lead.email },
                        { l: "Phone", v: lead.phone },
                        { l: "Persona", v: `${lead.personaName} — ${lead.personaArchetype}` },
                        { l: "Pricing Tier", v: lead.pricingTier },
                      ].map(item => (
                        <div key={item.l} style={{ background: CARD, borderRadius: 8, padding: "10px 12px" }}>
                          <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", marginBottom: 3 }}>{item.l}</div>
                          <div style={{ fontSize: 13, color: WHITE }}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                    {/* Stage breakdown */}
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>Stage Scores</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {(lead.stageScores || []).map(s => (
                        <div key={s.stage} style={{ background: CARD, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
                          <span style={{ color: MUTED }}>{s.stage}: </span>
                          <span style={{ color: scoreColor(s.pct), fontWeight: 700 }}>{s.pct}%</span>
                        </div>
                      ))}
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
            <button onClick={clearAllLeads} style={{ background: "none", border: "none", color: "#444", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
              Clear all leads
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState(null);
  const [persona, setPersona] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminClicks, setAdminClicks] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Demo mode prefill data (Training Institute example)
  const DEMO_DATA = {
    business: {
      industry: "Training Institute",
      description: "We run an IT training institute in Chennai offering placement-focused courses in Python, Data Analytics, and Digital Marketing for graduates and working professionals.",
      location: "Chennai, Tamil Nadu",
      pricingTier: { id: "mid", label: "Mid-Range", tag: "Value Market", icon: "◈", color: "#3b82f6", description: "Quality-conscious." },
    },
    persona: {
      id: "demo_persona",
      name: "Priya",
      archetype: "Career Switcher",
      age: "24-32",
      role: "Working professional or recent graduate",
      summary: "A young professional looking to upskill and switch to a higher-paying tech career.",
      primaryGoal: "Get a placement-ready skill certification that helps land a better job",
      biggestFear: "Paying for a course and not getting placed or wasting time",
      trigger: "Sees a colleague get promoted after doing a certification or gets passed over for promotion",
    },
  };

  const DEMO_STEPS = [
    { label: "What is Demo Mode?", icon: "📖" },
    { label: "Run Live with Prospect", icon: "🎯" },
    { label: "Pre-filled Example", icon: "⚡" },
    { label: "Show Your Own Results", icon: "📊" },
  ];

  function restart() {
    setStep(0); setBusiness(null); setPersona(null); setAnswers({});
    setDemoMode(false);
  }

  function launchDemoLive() {
    // Pre-fill Step 1 with training institute data, let them run through naturally
    setBusiness(DEMO_DATA.business);
    setStep(1);
    setDemoMode(false);
  }

  function launchDemoPreFilled() {
    // Skip to Step 3 with all data pre-filled
    setBusiness(DEMO_DATA.business);
    setPersona(DEMO_DATA.persona);
    setStep(2);
    setDemoMode(false);
  }

  // Secret triple-click on logo to open admin
  function handleLogoClick() {
    const next = adminClicks + 1;
    setAdminClicks(next);
    if (next >= 3) { setShowAdmin(true); setAdminClicks(0); }
    setTimeout(() => setAdminClicks(0), 2000);
  }

  if (showAdmin) return <AdminDashboard onClose={() => setShowAdmin(false)} />;

  if (demoMode) return (
    <div style={{ minHeight: "100vh", background: DARK, fontFamily: "'DM Sans','Segoe UI',sans-serif", color: WHITE }}>
      <div style={{ padding: "16px 24px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#000" }}>H</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Discovery Call Mode</div>
            <div style={{ fontSize: 11, color: MUTED }}>peopleplex.in</div>
          </div>
        </div>
        <button onClick={() => setDemoMode(false)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 12, cursor: "pointer" }}>✕ Close</button>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ fontSize: 13, color: ORANGE, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Discovery Call Mode</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: WHITE, margin: "0 0 8px" }}>How do you want to use the tool?</h2>
        <p style={{ fontSize: 14, color: MUTED, marginBottom: 28, lineHeight: 1.6 }}>
          Three ways to use this tool during a discovery call with a prospect.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Option 1: Run live */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>🎯</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginBottom: 4 }}>Run It Live Together</div>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 14 }}>
                  Start fresh with your prospect's business details. Fill it in together on screen share. They watch their customer journey and audit score appear in real time.
                </p>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>
                  ✓ Most impactful &nbsp;·&nbsp; ✓ Personalised to them &nbsp;·&nbsp; ✓ They feel involved
                </div>
                <button onClick={launchDemoLive} style={{ padding: "11px 20px", borderRadius: 10, border: "none", background: ORANGE, color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Start with Their Business →
                </button>
              </div>
            </div>
          </div>

          {/* Option 2: Pre-filled example */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginBottom: 4 }}>Show a Pre-filled Example</div>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 14 }}>
                  Jump straight to the journey map using a training institute example. Perfect for quickly showing the prospect what the tool does before running it for their business.
                </p>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>
                  ✓ Saves time &nbsp;·&nbsp; ✓ No API wait &nbsp;·&nbsp; ✓ Great for intro demos
                </div>
                <button onClick={launchDemoPreFilled} style={{ padding: "11px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: WHITE, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Load Training Institute Example →
                </button>
              </div>
            </div>
          </div>

          {/* Option 3: Your own results */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <div style={{ fontSize: 28, lineHeight: 1 }}>📊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: WHITE, marginBottom: 4 }}>Show Your Own Audit</div>
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.5, marginBottom: 14 }}>
                  Already ran your own business through the audit? Share your screen showing your results. Use it as a conversation opener: "Here is what I found when I audited my own business..."
                </p>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>
                  ✓ Builds credibility &nbsp;·&nbsp; ✓ Shows vulnerability &nbsp;·&nbsp; ✓ Opens honest conversation
                </div>
                <button onClick={() => { restart(); }} style={{ padding: "11px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: MUTED, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Run Audit on My Business →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div style={{ marginTop: 24, padding: "16px 18px", background: `${ORANGE}08`, border: `1px solid ${ORANGE}20`, borderRadius: 12 }}>
          <div style={{ fontSize: 12, color: ORANGE, fontWeight: 700, marginBottom: 10 }}>💡 Discovery Call Tips</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              "Ask them to rate each audit question BEFORE showing the score — they engage more.",
              "When their weakest stage appears, ask: 'Does this match what you're experiencing?' — not 'I told you so'.",
              "The moment they say 'Yes, that's exactly our problem' — stop talking. Let them sit with it.",
              "End with: 'I can build the system that fixes this. Want to see what that looks like?'",
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 13, color: MUTED, display: "flex", gap: 8, lineHeight: 1.5 }}>
                <span style={{ color: ORANGE, flexShrink: 0 }}>{i + 1}.</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: DARK,
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      color: WHITE,
      padding: "0 0 60px",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px",
        borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 8,
      }}>
        <div
          onClick={handleLogoClick}
          title="Admin"
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: adminClicks > 0 ? `${ORANGE}80` : ORANGE,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 900, color: "#000",
            cursor: "pointer", transition: "background .2s",
          }}>H</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: WHITE, lineHeight: 1 }}>
            PeoplePlex
          </div>
          <div style={{ fontSize: 11, color: MUTED }}>Understand Your Customers</div>
        </div>

      </div>

      {/* Content */}
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 0" }}>
        <Steps current={step} />

        {step === 0 && (
          <StepDescribe onNext={d => { setBusiness(d); setStep(1); }} />
        )}
        {step === 1 && (
          <StepPersonas business={business} onNext={p => { setPersona(p); setStep(2); }} onBack={() => setStep(0)} />
        )}
        {step === 2 && (
          <StepJourney business={business} persona={persona} onNext={() => setStep(3)} onBack={() => setStep(1)} />
        )}
        {step === 3 && (
          <StepAudit persona={persona} onNext={a => { setAnswers(a); setStep(4); }} onBack={() => setStep(2)} />
        )}
        {step === 4 && (
          <StepResults business={business} persona={persona} answers={answers} onRestart={restart} />
        )}
      </div>
    </div>
  );
}
