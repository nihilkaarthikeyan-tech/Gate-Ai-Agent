import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SYLLABUS: Record<string, string[]> = {
  'Engineering Mathematics': [
    'Discrete Mathematics', 'Linear Algebra', 'Calculus',
    'Probability & Statistics', 'Graph Theory', 'Combinatorics',
  ],
  'Digital Logic': [
    'Boolean Algebra', 'Logic Gates', 'Combinational Circuits',
    'Sequential Circuits', 'Number Systems', 'Minimization (K-Map)',
  ],
  'Computer Organization and Architecture': [
    'Machine Instructions & Addressing Modes', 'ALU & Data Path',
    'Control Unit', 'Memory Hierarchy', 'Cache Memory',
    'I/O Organization', 'Pipelining', 'Instruction Level Parallelism',
  ],
  'Programming and Data Structures': [
    'Arrays', 'Stacks and Queues', 'Linked Lists', 'Trees',
    'Binary Search Trees', 'Heaps', 'Hashing', 'Graphs',
    'Recursion', 'C Programming Fundamentals',
  ],
  'Algorithms': [
    'Asymptotic Notation', 'Searching and Sorting',
    'Divide and Conquer', 'Greedy Algorithms',
    'Dynamic Programming', 'Graph Algorithms',
    'NP-Completeness', 'Randomized Algorithms',
  ],
  'Theory of Computation': [
    'Regular Languages & Finite Automata', 'Context Free Languages',
    'Pushdown Automata', 'Turing Machines',
    'Decidability', 'Reducibility',
  ],
  'Compiler Design': [
    'Lexical Analysis', 'Syntax Analysis (Parsing)',
    'Semantic Analysis', 'Intermediate Code Generation',
    'Code Optimization', 'Code Generation', 'Runtime Environments',
  ],
  'Operating System': [
    'Processes & Threads', 'CPU Scheduling', 'Process Synchronization',
    'Deadlock', 'Memory Management', 'Virtual Memory',
    'File Systems', 'I/O Systems',
  ],
  'Databases': [
    'ER Model', 'Relational Model', 'SQL',
    'Normalization', 'Transactions & Concurrency Control',
    'Indexing & Hashing', 'Query Processing',
  ],
  'Computer Networks': [
    'OSI & TCP/IP Model', 'Data Link Layer', 'MAC & LAN',
    'Network Layer & IP', 'Routing Algorithms',
    'Transport Layer', 'Application Layer', 'Network Security',
  ],
  'General Aptitude': [
    'Verbal Ability', 'Numerical Ability',
    'Analytical Reasoning', 'Data Interpretation',
  ],
};

const WEIGHTS: Record<string, number> = {
  'Engineering Mathematics': 13,
  'Digital Logic': 5,
  'Computer Organization and Architecture': 8,
  'Programming and Data Structures': 10,
  'Algorithms': 8,
  'Theory of Computation': 8,
  'Compiler Design': 4,
  'Operating System': 8,
  'Databases': 8,
  'Computer Networks': 8,
  'General Aptitude': 15,
};

async function main() {
  console.log('Seeding GATE CS syllabus...');

  const csPaper = await prisma.paper.upsert({
    where: { code: 'CS' },
    update: { name: 'Computer Science & Information Technology' },
    create: { code: 'CS', name: 'Computer Science & Information Technology' },
  });

  for (const [subjectName, topics] of Object.entries(SYLLABUS)) {
    const subject = await prisma.subject.upsert({
      where: { id: `seed-${subjectName.toLowerCase().replace(/\s+/g, '-')}` },
      update: { name: subjectName, weight: WEIGHTS[subjectName] },
      create: {
        id: `seed-${subjectName.toLowerCase().replace(/\s+/g, '-')}`,
        name: subjectName,
        weight: WEIGHTS[subjectName],
        paperCode: csPaper.code,
      },
    });

    for (const topicName of topics) {
      await prisma.topic.upsert({
        where: { id: `seed-${subjectName}-${topicName}`.toLowerCase().replace(/\s+/g, '-').slice(0, 60) },
        update: { name: topicName },
        create: {
          id: `seed-${subjectName}-${topicName}`.toLowerCase().replace(/\s+/g, '-').slice(0, 60),
          name: topicName,
          subjectId: subject.id,
          difficulty: 'Medium',
          estimatedHours: 8,
        },
      });
    }

    console.log(`  ✓ ${subjectName} (${topics.length} topics)`);
  }

  console.log(`\nSeed complete: ${Object.keys(SYLLABUS).length} subjects, ${Object.values(SYLLABUS).flat().length} topics.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
