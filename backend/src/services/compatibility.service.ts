import { GoogleGenerativeAI } from "@google/generative-ai";
import { Listing, TenantProfile } from "@prisma/client";
import { env } from "../config/env";
import { compatibilityRepository } from "../repositories/compatibility.repository";

interface ScoreResult {
  score: number;
  explanation: string;
  source: "LLM" | "RULE_BASED";
}

const genAI = env.geminiApiKey ? new GoogleGenerativeAI(env.geminiApiKey) : null;

/**
 * Builds the prompt sent to the LLM. Kept identical in spirit to the spec:
 * listing details + tenant profile -> strict JSON { score, explanation }.
 */
function buildPrompt(listing: Listing, tenant: TenantProfile): string {
  return `Given the following room listing
Location: ${listing.location}
Rent: ${listing.rent}
Room Type: ${listing.roomType}
Furnishing: ${listing.furnishingStatus}
Available Date: ${listing.availableFrom.toISOString().split("T")[0]}

and the following tenant profile
Preferred Location: ${tenant.preferredLocation}
Budget Range: ${tenant.minimumBudget} - ${tenant.maximumBudget}
Move-in Date: ${tenant.moveInDate.toISOString().split("T")[0]}

Return ONLY valid JSON in this exact format, with no markdown fences and no extra text:
{"score": 85, "explanation": "Budget matches well and preferred location is exactly matched."}

Rules:
- score must be an integer between 0 and 100.
- explanation must be under 40 words.`;
}

function parseLLMResponse(raw: string): { score: number; explanation: string } | null {
  try {
    // Strip markdown fences if the model wraps the JSON despite instructions
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.score !== "number" ||
      parsed.score < 0 ||
      parsed.score > 100 ||
      typeof parsed.explanation !== "string" ||
      parsed.explanation.split(/\s+/).length > 40
    ) {
      return null;
    }

    return { score: Math.round(parsed.score), explanation: parsed.explanation };
  } catch {
    return null;
  }
}

async function scoreWithLLM(listing: Listing, tenant: TenantProfile): Promise<{ score: number; explanation: string } | null> {
  if (!genAI) return null; // no API key configured

  try {
    const model = genAI.getGenerativeModel({ model: env.geminiModel });

    const result = await Promise.race([
      model.generateContent(buildPrompt(listing, tenant)),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("LLM timeout")), 10000)),
    ]);

    const text = result.response.text();
    return parseLLMResponse(text);
  } catch {
    return null; // any failure (network, rate limit, invalid JSON) triggers fallback
  }
}

/**
 * Deterministic rule-based scorer, used whenever the LLM is unavailable,
 * times out, is rate-limited, or returns invalid JSON.
 */
function scoreWithRules(listing: Listing, tenant: TenantProfile): { score: number; explanation: string } {
  let score = 0;
  const reasons: string[] = [];

  // Location: exact (case-insensitive) match => +60
  const exactLocationMatch =
    listing.location.trim().toLowerCase() === tenant.preferredLocation.trim().toLowerCase();
  if (exactLocationMatch) {
    score += 60;
    reasons.push("location matches exactly");
  } else if (
    listing.location.toLowerCase().includes(tenant.preferredLocation.toLowerCase()) ||
    tenant.preferredLocation.toLowerCase().includes(listing.location.toLowerCase())
  ) {
    score += 30;
    reasons.push("location is a partial match");
  }

  // Budget: within range => +30
  if (listing.rent >= tenant.minimumBudget && listing.rent <= tenant.maximumBudget) {
    score += 30;
    reasons.push("rent fits within budget");
  } else {
    reasons.push("rent is outside stated budget");
  }

  // Move-in date within 30 days of availability => +10
  const diffDays = Math.abs(
    (listing.availableFrom.getTime() - tenant.moveInDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays <= 30) {
    score += 10;
    reasons.push("move-in dates align");
  }

  score = Math.min(score, 100);

  const explanation = `Rule-based match: ${reasons.join(", ")}.`.slice(0, 250);

  return { score, explanation };
}

export const compatibilityService = {
  /**
   * Generates (or returns cached) compatibility between a tenant and a listing.
   * Called whenever a tenant profile changes or a new listing is created.
   * Never recomputes on every browse request - result is persisted.
   */
  async getOrGenerate(listing: Listing, tenant: TenantProfile): Promise<ScoreResult> {
    const existing = await compatibilityRepository.find(tenant.id, listing.id);
    if (existing) {
      return { score: existing.score, explanation: existing.explanation, source: existing.source };
    }
    return this.generate(listing, tenant);
  },

  async generate(listing: Listing, tenant: TenantProfile): Promise<ScoreResult> {
    const llmResult = await scoreWithLLM(listing, tenant);

    const result: ScoreResult = llmResult
      ? { ...llmResult, source: "LLM" }
      : { ...scoreWithRules(listing, tenant), source: "RULE_BASED" };

    await compatibilityRepository.upsert(tenant.id, listing.id, result.score, result.explanation, result.source);

    return result;
  },
};
