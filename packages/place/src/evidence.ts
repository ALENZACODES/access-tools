import type { PrototypeLabel, Provenance, PublicationContext, SurveyEvidence, VerificationTier } from "./types.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Protocol version, verifier role, method, and visit date. A washroom also needs a photo id. */
export function evidenceComplete(evidence: SurveyEvidence | undefined, options?: { requirePhoto?: boolean }): boolean {
  if (!evidence) return false;
  if (!evidence.protocolVersion.trim()) return false;
  if (!evidence.verifierRole) return false;
  if (!evidence.method.trim()) return false;
  if (!DATE.test(evidence.observedAt)) return false;
  if (options?.requirePhoto && evidence.photoIds.filter((id) => id.trim()).length === 0) return false;
  return true;
}

/**
 * "Verified by surveyor" is allowed only on a canonical record whose tier is 3
 * or whose prototype label is VERIFIED, and only when the evidence block is complete.
 * Prototype context never renders that wording.
 */
export function verifiedLabelAllowed(input: {
  provenance: Provenance;
  publicationContext: PublicationContext;
  requirePhoto?: boolean;
}): boolean {
  if (input.publicationContext === "prototype") return false;
  const label: PrototypeLabel | undefined = input.provenance.prototypeLabel;
  if (label === "PROTOTYPE-UNVERIFIED" || label === "SEEDED-OPEN-DATA" || label === "COMMUNITY-REPORTED") return false;
  const tier: VerificationTier = input.provenance.tier;
  const claimsVerified = tier === 3 || label === "VERIFIED";
  if (!claimsVerified) return false;
  if (label === "VERIFIED" && tier !== 3) return false;
  return evidenceComplete(input.provenance.evidence, { requirePhoto: input.requirePhoto });
}
