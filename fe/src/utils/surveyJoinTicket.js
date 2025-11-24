const SURVEY_JOIN_TICKET_KEY = "surveyJoinTicket";
const SURVEY_JOIN_TICKET_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getSessionStorage = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage ?? null;
};

export const issueSurveyJoinTicket = (surveyId, token) => {
  const storage = getSessionStorage();
  if (!storage) return null;

  const payload = {
    surveyId: Number(surveyId),
    token,
    issuedAt: Date.now(),
    expiresAt: Date.now() + SURVEY_JOIN_TICKET_TTL_MS,
  };

  storage.setItem(SURVEY_JOIN_TICKET_KEY, JSON.stringify(payload));
  return payload;
};

export const readSurveyJoinTicket = () => {
  const storage = getSessionStorage();
  if (!storage) return null;

  const raw = storage.getItem(SURVEY_JOIN_TICKET_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.expiresAt && parsed.expiresAt <= Date.now()) {
      storage.removeItem(SURVEY_JOIN_TICKET_KEY);
      return null;
    }
    return parsed;
  } catch (error) {
    storage.removeItem(SURVEY_JOIN_TICKET_KEY);
    return null;
  }
};

export const clearSurveyJoinTicket = () => {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.removeItem(SURVEY_JOIN_TICKET_KEY);
};

export const isTicketValidForSurvey = (surveyId, token) => {
  const ticket = readSurveyJoinTicket();
  if (
    ticket &&
    Number(ticket.surveyId) === Number(surveyId) &&
    ticket.token === token
  ) {
    return ticket;
  }
  return null;
};

