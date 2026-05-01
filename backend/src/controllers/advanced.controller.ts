import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
}) : null;

// ─── Photo Solver ────────────────────────────────────────────────────────────

export const solvePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: 'Image is required' });
      return;
    }
    if (!openai) {
      res.status(500).json({ error: 'OpenAI is not configured. Missing API key.' });
      return;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please solve the problem in this image. Provide a step-by-step solution.' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
    });

    res.json({ solution: response.choices[0].message.content });
  } catch (error: any) {
    console.error('Photo Solver Error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
};

// ─── Motivation Coach (Claude Haiku + real DB stats) ─────────────────────────

export const getMotivation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = (req as any).user;

    const [user, mockTestCount, studyPlan, chatSessionCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.testAttempt.count({ where: { userId } }),
      prisma.studyPlan.findFirst({ where: { userId }, orderBy: { lastAdaptedAt: 'desc' } }),
      prisma.chatSession.count({ where: { userId } }),
    ]);

    const name = user?.name || 'Student';
    const hoursPerDay = studyPlan?.dailyHours ?? user?.hoursPerDay ?? 4;
    const weeklyHours = hoursPerDay * 5;
    const targetHours = hoursPerDay * 7;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      system: 'You are a motivational coach for competitive exam students. Write short, powerful, and specific motivational messages. Be direct, energizing, and personal. No generic advice.',
      messages: [
        {
          role: 'user',
          content: `Write one powerful 2-sentence motivational message for ${name}, a GATE CS exam student. Stats: ${mockTestCount} mock tests completed, ${weeklyHours} study hours this week (target: ${targetHours}h), ${chatSessionCount} tutor sessions. Be specific to their progress — acknowledge their effort and fire them up for the next step.`,
        },
      ],
    });

    const nudge = message.content[0].type === 'text' ? message.content[0].text : '';

    res.json({
      nudge,
      progress: {
        weeklyHours,
        targetHours,
        mockTestsCompleted: mockTestCount,
      },
    });
  } catch (error: any) {
    console.error('Motivation Error:', error);
    res.status(500).json({ error: 'Failed to fetch motivation' });
  }
};

// ─── Interview Prep (Claude Sonnet) ──────────────────────────────────────────

const INTERVIEWER_SYSTEM = `You are an elite technical interviewer for GATE/BARC/ISRO/IIT M.Tech admissions. Your role:
1. Ask one focused technical or behavioral question at a time — never ask multiple questions in one message.
2. After the candidate answers, give 1-2 sentences of specific feedback on their answer (what was strong, what was missing).
3. Then ask a logical follow-up or a new topic question that probes deeper.
4. Cover: OS, Networks, DBMS, Algorithms, Data Structures, Computer Architecture, and relevant project experience.
5. Keep each response under 120 words. Be demanding but fair — this is a high-stakes simulation.`;

export const startInterviewMock = async (_req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = crypto.randomUUID();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: INTERVIEWER_SYSTEM,
      messages: [
        {
          role: 'user',
          content: 'Start the mock interview. Ask your opening question — make it a strong technical question that also lets the candidate introduce their background.',
        },
      ],
    });

    const question = message.content[0].type === 'text' ? message.content[0].text : '';
    res.json({ question, sessionId });
  } catch (error: any) {
    console.error('Interview Start Error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
};

export const continueInterviewMock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as {
      messages: { role: 'user' | 'system'; content: string }[];
    };

    if (!messages || messages.length === 0) {
      res.status(400).json({ error: 'messages array is required' });
      return;
    }

    // Map frontend roles (system → assistant) for Anthropic API
    const apiMessages = messages.map((m) => ({
      role: m.role === 'system' ? ('assistant' as const) : ('user' as const),
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: INTERVIEWER_SYSTEM,
      messages: apiMessages,
    });

    const question = response.content[0].type === 'text' ? response.content[0].text : '';
    res.json({ question });
  } catch (error: any) {
    console.error('Interview Continue Error:', error);
    res.status(500).json({ error: 'Failed to continue interview' });
  }
};

// ─── Counselling Assistant (Claude Sonnet) ───────────────────────────────────

const COUNSELLOR_SYSTEM = `You are an expert GATE counsellor with deep knowledge of:
- GATE application process, eligibility, and important dates
- COAP (Common Offer Acceptance Portal) — rounds, seat matrix, how to accept/upgrade offers
- CCMT (Centralized Counselling for M.Tech/M.Arch/M.Plan) — choice filling strategy, document verification
- PSU recruitment through GATE — which PSUs recruit, cutoffs, stages (written/interview/medical)
- IIT and NIT M.Tech admissions — GATE score validity, branch-wise cutoffs, interview shortlists

Give accurate, step-by-step actionable guidance. If you don't know specific cutoff numbers for the current year, say so clearly and advise the student to check the official portal. Keep responses clear, structured, and practical.`;

export const getCounsellingGuidance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, history } = req.body as {
      query: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!query?.trim()) {
      res.status(400).json({ error: 'query is required' });
      return;
    }

    const apiMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...(history || []),
      { role: 'user', content: query },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: COUNSELLOR_SYSTEM,
      messages: apiMessages,
    });

    const answer = response.content[0].type === 'text' ? response.content[0].text : '';
    res.json({ answer });
  } catch (error: any) {
    console.error('Counselling Error:', error);
    res.status(500).json({ error: 'Failed to get counselling guidance' });
  }
};

// ─── Payments (Razorpay) ─────────────────────────────────────────────────────

export const createRazorpayOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;
    if (!razorpay) {
      res.status(500).json({ error: 'Razorpay is not configured. Missing keys.' });
      return;
    }

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_order_${Math.random() * 10000}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

export const verifyRazorpayPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      const { userId } = (req as any).user;
      await prisma.user.update({
        where: { id: userId },
        data: { planTier: 'premium' },
      });
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};
