const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function run() {
    const result = await fetch('http://localhost:5177/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1000,
            messages: [{
                role: "user",
                content: `You are a customer research expert. Generate exactly 3 distinct customer personas for this business.

Business:
Industry: test
Description: test test test
Location: testLocation
Pricing Tier: Mid-Range (Value Market)
Price Range: Mid-range pricing

Important: Generate personas that specifically match the Value Market segment. Their income level, expectations, decision-making style, and what they value should reflect this pricing tier.

Return ONLY valid JSON, no markdown, no explanation:
{
  "personas": [
    {
      "id": "persona_1",
      "name": "First Name",
      "archetype": "2-3 word catchphrase (e.g. The Overwhelmed Founder)",
      "age": "Age range",
      "role": "Their job or life situation",
      "summary": "1 sentence describing their core situation",
      "primaryGoal": "What is their #1 goal related to this industry?",
      "biggestFear": "What are they terrified of getting wrong?",
      "trigger": "What exact event made them start looking for a solution today?"
    }
  ]
}`
            }]
        })
    });
    console.log('Status:', result.status);
    console.log('Text:', await result.text());
}
run();
