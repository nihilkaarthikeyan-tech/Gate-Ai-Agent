import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  createDeck, getDecks, deleteDeck,
  addCard, getDeckCards, updateCard, deleteCard,
  getDueCards, submitReview, getFlashcardStats,
} from '../controllers/flashcard.controller';

const router = Router();
router.use(authMiddleware);

// Decks
router.post('/decks', createDeck);
router.get('/decks', getDecks);
router.delete('/decks/:deckId', deleteDeck);

// Cards within a deck
router.post('/decks/:deckId/cards', addCard);
router.get('/decks/:deckId/cards', getDeckCards);
router.patch('/cards/:cardId', updateCard);
router.delete('/cards/:cardId', deleteCard);

// Review session
router.get('/due', getDueCards);
router.post('/cards/:cardId/review', submitReview);
router.get('/stats', getFlashcardStats);

export default router;
