// In-memory conversation state (per phone number). Resets on server restart.
const conversationState = new Map();
const CONVERSATION_TTL_MS = 15 * 60 * 1000;

function getState(from) {
  const key = String(from || '').trim();
  if (!key) return null;
  const state = conversationState.get(key);
  if (!state) return null;
  if (Date.now() - state.ts > CONVERSATION_TTL_MS) {
    conversationState.delete(key);
    return null;
  }
  return state;
}

function setState(from, state) {
  const key = String(from || '').trim();
  if (!key) return;
  conversationState.set(key, { ...state, ts: Date.now() });
}

module.exports = {
  getState,
  setState,
};
