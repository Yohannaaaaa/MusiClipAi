// Approximate published rates (Runway charges 5 credits/second on both gen3a_turbo and
// gen4_turbo, 1 credit = $0.01) — shown to the user as an estimate, not a guarantee: Runway
// can change pricing, and this app has no way to verify it live.
export const RUNWAY_CLIP_DURATION_SECONDS = 10;
export const RUNWAY_CREDITS_PER_SECOND = 5;
export const RUNWAY_CREDIT_COST_USD = 0.01;

export const RUNWAY_CREDITS_PER_CLIP = RUNWAY_CLIP_DURATION_SECONDS * RUNWAY_CREDITS_PER_SECOND;
export const RUNWAY_COST_USD_PER_CLIP = RUNWAY_CREDITS_PER_CLIP * RUNWAY_CREDIT_COST_USD;
