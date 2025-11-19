import { getSurveysMadeByUser } from "../api/graphql/survey";

const ownershipCache = new Map();

const buildCacheEntry = (surveys) => {
  if (!Array.isArray(surveys)) {
    return { ids: new Set(), fetchedAt: Date.now() };
  }
  const ids = new Set(
    surveys
      .map((survey) => {
        const idNumber = Number(survey?.id);
        return Number.isNaN(idNumber) ? null : idNumber;
      })
      .filter((id) => id !== null)
  );
  return { ids, fetchedAt: Date.now() };
};

const getCachedOwnership = (userId) => {
  const entry = ownershipCache.get(userId);
  if (!entry) {
    return null;
  }
  // Invalidate cache after 60 seconds to keep data fresh
  if (Date.now() - entry.fetchedAt > 60 * 1000) {
    ownershipCache.delete(userId);
    return null;
  }
  return entry.ids;
};

const refreshOwnership = async (userId) => {
  const surveys = await getSurveysMadeByUser(userId);
  const entry = buildCacheEntry(surveys);
  ownershipCache.set(userId, entry);
  return entry.ids;
};

export async function ensureSurveyOwnership(surveyId) {
  const token = window?.localStorage?.getItem("token");
  const userIdStr = window?.localStorage?.getItem("userId");

  if (!token || !userIdStr) {
    return { allowed: false, reason: "AUTH_REQUIRED" };
  }

  const userId = parseInt(userIdStr, 10);
  if (!Number.isInteger(userId) || Number.isNaN(Number(surveyId))) {
    return { allowed: false, reason: "AUTH_REQUIRED" };
  }

  try {
    const normalizedSurveyId = Number(surveyId);
    let ownedSurveys = getCachedOwnership(userId);

    if (!ownedSurveys) {
      ownedSurveys = await refreshOwnership(userId);
    }

    if (ownedSurveys.has(normalizedSurveyId)) {
      return { allowed: true };
    }

    // Refresh once more to avoid stale cache issues
    ownedSurveys = await refreshOwnership(userId);
    if (ownedSurveys.has(normalizedSurveyId)) {
      return { allowed: true };
    }

    return { allowed: false, reason: "NOT_OWNER" };
  } catch (error) {
    console.error("[ensureSurveyOwnership] Failed to check ownership", error);
    return { allowed: false, reason: "CHECK_FAILED", error };
  }
}

export function invalidateSurveyOwnershipCache() {
  ownershipCache.clear();
}

