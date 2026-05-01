import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Tutor API
export const tutorApi = {
  createSession: (title?: string, subject?: string) =>
    api.post('/tutor/sessions', { title, subject }),
  getSessions: () => api.get('/tutor/sessions'),
  getSession: (id: string) => api.get(`/tutor/sessions/${id}`),
  saveMessage: (sessionId: string, role: 'user' | 'assistant', content: string) =>
    api.post('/tutor/messages', { sessionId, role, content }),
  explain: (question: string, correctAnswer: string, questionType: string, options?: string[]) =>
    api.post('/tutor/explain', { question, correctAnswer, questionType, options }),
};

// Planner API
export const plannerApi = {
  getPlan: () => api.get('/planner'),
  generatePlan: (params: {
    targetDate: string;
    dailyHours: number;
    weakSubjects: string[];
    targetScore: number;
    paper?: string;
  }) => api.post('/planner/generate', params),
  updateProgress: (completedTopics: string[]) =>
    api.patch('/planner/progress', { completedTopics }),
};

// PYQ API
export const pyqApi = {
  listQuestions: (params?: {
    subject?: string;
    year?: number;
    type?: string;
    page?: number;
    limit?: number;
  }) => api.get('/pyq', { params }),
  getQuestion: (id: string) => api.get(`/pyq/${id}`),
  getExplanation: (id: string) => api.get(`/pyq/${id}/explanation`),
  getSubjects: () => api.get('/pyq/subjects'),
  verifyNat: (questionId: string, userAnswer: string) =>
    api.post('/pyq/verify-nat', { questionId, userAnswer }),
};

/**
 * Stream tutor chat response via SSE (Server-Sent Events).
 * Calls onChunk for each text delta and onDone when the stream ends.
 */
export async function streamChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  subject: string | undefined,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void
): Promise<void> {
  const token = useAuthStore.getState().token;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const response = await fetch(`${baseUrl}/tutor/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, subject }),
  });

  if (!response.ok) {
    onError(`HTTP ${response.status}: ${response.statusText}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) { onError('No response body'); return; }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const payload = JSON.parse(line.slice(6)) as {
          type: 'chunk' | 'done' | 'error';
          text?: string;
          message?: string;
        };
        if (payload.type === 'chunk' && payload.text) onChunk(payload.text);
        else if (payload.type === 'done') onDone();
        else if (payload.type === 'error') onError(payload.message ?? 'Stream error');
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}

// ── Phase 3 APIs ────────────────────────────────────────────────────────────

export const mockTestApi = {
  generate: (body: { paperCode?: string; type?: string; topicIds?: string[] }) =>
    api.post('/mock-tests/generate', body),
  submit: (attemptId: string, responses: any[], timeTaken: number) =>
    api.post(`/mock-tests/${attemptId}/submit`, { responses, timeTaken }),
  getHistory: () => api.get('/mock-tests/history'),
  getAttempt: (attemptId: string) => api.get(`/mock-tests/${attemptId}`),
};

export const flashcardApi = {
  getDecks: () => api.get('/flashcards/decks'),
  createDeck: (data: { title: string; subject?: string; description?: string }) =>
    api.post('/flashcards/decks', data),
  deleteDeck: (deckId: string) => api.delete(`/flashcards/decks/${deckId}`),
  getDeckCards: (deckId: string) => api.get(`/flashcards/decks/${deckId}/cards`),
  addCard: (deckId: string, data: { frontMd: string; backMd: string; subject?: string; tags?: string[] }) =>
    api.post(`/flashcards/decks/${deckId}/cards`, data),
  updateCard: (cardId: string, data: any) => api.patch(`/flashcards/cards/${cardId}`, data),
  deleteCard: (cardId: string) => api.delete(`/flashcards/cards/${cardId}`),
  getDueCards: (deckId?: string) => api.get('/flashcards/due', { params: deckId ? { deckId } : {} }),
  submitReview: (cardId: string, quality: number) =>
    api.post(`/flashcards/cards/${cardId}/review`, { quality }),
  getStats: () => api.get('/flashcards/stats'),
};

export const notesApi = {
  getNotes: (params?: { subject?: string; search?: string }) =>
    api.get('/notes', { params }),
  getNote: (noteId: string) => api.get(`/notes/${noteId}`),
  createNote: (data: { title: string; contentMd: string; subject?: string; tags?: string[] }) =>
    api.post('/notes', data),
  updateNote: (noteId: string, data: any) => api.patch(`/notes/${noteId}`, data),
  deleteNote: (noteId: string) => api.delete(`/notes/${noteId}`),
  summarize: (noteId: string) => api.post(`/notes/${noteId}/summarize`),
};

export const shortcutsApi = {
  getSubjects: () => api.get('/shortcuts/subjects'),
  getShortcuts: (params?: { subject?: string; search?: string }) =>
    api.get('/shortcuts', { params }),
  getShortcut: (id: string) => api.get(`/shortcuts/${id}`),
};

export const liveExamApi = {
  getEvents: () => api.get('/live-exams'),
  register: (eventId: string) => api.post(`/live-exams/${eventId}/register`),
  submit: (eventId: string, responses: any[], timeTaken: number) =>
    api.post(`/live-exams/${eventId}/submit`, { responses, timeTaken }),
  getMyResult: (eventId: string) => api.get(`/live-exams/${eventId}/my-result`),
  getLeaderboard: (eventId: string) => api.get(`/live-exams/${eventId}/leaderboard`),
};

// ── Phase 4 APIs ────────────────────────────────────────────────────────────

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getWeakAreas: () => api.get('/analytics/weak-areas'),
  predictRank: () => api.get('/analytics/predict-rank'),
  toggleRevisionMode: (isRevisionMode: boolean) =>
    api.post('/analytics/revision-mode', { isRevisionMode }),
};

// ── Phase 5 APIs ────────────────────────────────────────────────────────────

export const advancedApi = {
  createRazorpayOrder: (amount: number) => api.post('/advanced/payments/create-order', { amount }),
  verifyRazorpayPayment: (paymentData: any) => api.post('/advanced/payments/verify', paymentData),
};

