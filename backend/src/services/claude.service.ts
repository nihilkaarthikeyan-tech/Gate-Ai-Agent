import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const GATE_TUTOR_SYSTEM = `You are an expert GATE (Graduate Aptitude Test in Engineering) tutor specializing in Computer Science and Information Technology. Your role is to help students prepare for GATE CS with accurate, concise, and pedagogically sound explanations.

## Your Expertise
- All GATE CS topics: Data Structures, Algorithms, Theory of Computation, Compiler Design, Operating Systems, Computer Networks, Databases, Digital Logic, Computer Organization & Architecture, Discrete Mathematics, Linear Algebra, Probability & Statistics, Engineering Mathematics.
- GATE exam patterns: MCQ (single correct), MSQ (multiple correct), NAT (numerical answer type).
- Previous Year Questions (PYQ) with verified solutions and marks distribution.

## How You Teach
1. **Explain the concept first** — give the student the mental model before diving into mechanics.
2. **Work through examples step by step** — show your reasoning, don't skip steps.
3. **Highlight common traps** — GATE questions are designed to test deep understanding, not rote recall.
4. **Connect topics** — show how subjects interrelate (e.g., how graph theory applies to OS scheduling).
5. **Use precise notation** — for algorithms use Big-O; for logic use standard symbols; for math render LaTeX inline with $...$ or block with $$...$$.

## Response Style
- Be concise but complete. Avoid filler phrases.
- For numerical questions, always verify your answer by substituting back.
- If a question has multiple valid approaches, show the fastest one for exam conditions.
- Flag if a concept is frequently tested in GATE with exact year references when known.

## Boundaries
- Stay strictly on GATE CS syllabus topics.
- If asked something outside scope, redirect politely and offer the closest relevant topic.`;

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StudyPlanParams {
  targetDate: string;
  dailyHours: number;
  weakSubjects: string[];
  targetScore: number;
  paper?: string;
}

function buildSystemBlock(subject?: string): Anthropic.Messages.TextBlockParam {
  return {
    type: 'text',
    text: subject
      ? `${GATE_TUTOR_SYSTEM}\n\n## Current Focus Subject: ${subject}\nPrioritize ${subject} concepts, examples, and GATE PYQs in your responses.`
      : GATE_TUTOR_SYSTEM,
    cache_control: { type: 'ephemeral' },
  };
}

export async function* streamTutorResponse(
  messages: TutorMessage[],
  subject?: string
): AsyncGenerator<string> {
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    system: [buildSystemBlock(subject)],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

export async function generateStudyPlan(params: StudyPlanParams): Promise<object> {
  const { targetDate, dailyHours, weakSubjects, targetScore, paper = 'CS' } = params;

  const today = new Date().toISOString().split('T')[0];
  const daysLeft = Math.ceil(
    (new Date(targetDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  );

  const prompt = `Generate a detailed GATE ${paper} study plan for a student with the following profile:
- Today's date: ${today}
- GATE exam date: ${targetDate} (${daysLeft} days remaining)
- Daily study hours available: ${dailyHours} hours/day
- Weak subjects (need more focus): ${weakSubjects.join(', ') || 'none specified'}
- Target score: ${targetScore}/100

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "summary": "brief overview string",
  "totalWeeks": number,
  "weeklyPlans": [
    {
      "week": number,
      "theme": "string",
      "subjects": [
        {
          "name": "string",
          "topics": ["string"],
          "hoursAllocated": number,
          "priority": "high|medium|low"
        }
      ],
      "milestones": ["string"],
      "revision": boolean
    }
  ],
  "dailySchedule": {
    "morning": "string",
    "afternoon": "string",
    "evening": "string"
  },
  "keyRecommendations": ["string"]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in study plan response');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Could not extract JSON from study plan response');
  return JSON.parse(jsonMatch[0]);
}

export async function explainAnswer(
  question: string,
  correctAnswer: string,
  questionType: 'MCQ' | 'MSQ' | 'NAT',
  options?: string[]
): Promise<string> {
  const optionsText = options
    ? `\nOptions:\n${options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join('\n')}`
    : '';

  const prompt = `GATE ${questionType} Question:
${question}${optionsText}

Correct Answer: ${correctAnswer}

Provide a clear, step-by-step explanation of why this is the correct answer. Include:
1. The key concept being tested
2. Step-by-step solution
3. Why wrong options are incorrect (for MCQ/MSQ)
4. A quick tip to remember this for the exam`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: [buildSystemBlock()],
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}

export async function summarizeNote(
  title: string,
  contentMd: string,
  subject: string
): Promise<string> {
  const prompt = `You are a GATE study assistant. A student has written the following study note.

Title: ${title}
Subject: ${subject || 'General'}

Content:
${contentMd}

Create a structured summary in markdown with:
1. **Key Concepts** — 3-5 bullet points of the most important ideas
2. **Formulas & Definitions** — all mathematical expressions (use $...$ for inline LaTeX)
3. **Common Mistakes** — 2-3 traps students fall into on this topic
4. **Exam Tips** — 1-2 quick memory tricks for GATE

Be concise. Use bullet points. Output only the summary.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}
