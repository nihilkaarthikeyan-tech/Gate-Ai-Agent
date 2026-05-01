import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const SHORTCUTS = [
  // ── Algorithms ─────────────────────────────────────────────────────────
  {
    subject: 'Algorithms',
    title: 'Master Theorem — Quick Case Recall',
    contentMd: `T(n) = aT(n/b) + f(n)

Case 1: f(n) = O(n^(log_b(a) - ε))  →  T(n) = Θ(n^log_b(a))
Case 2: f(n) = Θ(n^log_b(a))         →  T(n) = Θ(n^log_b(a) · log n)
Case 3: f(n) = Ω(n^(log_b(a) + ε))  →  T(n) = Θ(f(n))

Memory trick: "Less, Equal, More" → polynomial ratio determines which case.
GATE Trap: Case 3 also requires the regularity condition: a·f(n/b) ≤ c·f(n)`,
    tags: ['recurrence', 'divide-and-conquer', 'complexity'],
    difficulty: 'medium',
    gateYear: 2023,
  },
  {
    subject: 'Algorithms',
    title: 'Sorting Algorithm Cheatsheet',
    contentMd: `Algorithm    | Best    | Avg     | Worst   | Space  | Stable
-------------|---------|---------|---------|--------|-------
Bubble Sort  | O(n)    | O(n²)   | O(n²)   | O(1)   | Yes
Selection    | O(n²)   | O(n²)   | O(n²)   | O(1)   | No ⚠️
Insertion    | O(n)    | O(n²)   | O(n²)   | O(1)   | Yes
Merge Sort   | O(nlogn)| O(nlogn)| O(nlogn)| O(n)   | Yes
Quick Sort   | O(nlogn)| O(nlogn)| O(n²)   | O(logn)| No ⚠️
Heap Sort    | O(nlogn)| O(nlogn)| O(nlogn)| O(1)   | No ⚠️
Counting Sort| O(n+k)  | O(n+k)  | O(n+k)  | O(k)   | Yes

GATE Trap: Quick Sort worst case is O(n²) with sorted input & pivot = first element.`,
    tags: ['sorting', 'complexity', 'stability'],
    difficulty: 'easy',
    gateYear: 2022,
  },
  {
    subject: 'Algorithms',
    title: 'Dijkstra vs Bellman-Ford vs Floyd-Warshall',
    contentMd: `Dijkstra:
  - Single source, non-negative weights only
  - O((V+E) log V) with min-heap
  - Fails with negative edges

Bellman-Ford:
  - Single source, handles negative weights
  - O(VE), detects negative cycles
  - Relaxes all edges V-1 times

Floyd-Warshall:
  - All pairs shortest path
  - O(V³), handles negative weights (no negative cycles)
  - DP: dp[i][j] = min(dp[i][j], dp[i][k] + dp[k][j])

GATE Tip: If negative weights → Bellman-Ford. Negative cycle detection → Bellman-Ford.`,
    tags: ['graph', 'shortest-path', 'dynamic-programming'],
    difficulty: 'hard',
    gateYear: 2024,
  },
  {
    subject: 'Algorithms',
    title: 'Greedy vs DP — Decision Rule',
    contentMd: `Use GREEDY when:
  ✓ Greedy choice property holds (local = global optimal)
  ✓ Optimal substructure exists
  Examples: Activity Selection, Huffman, Kruskal, Prim, Dijkstra

Use DP when:
  ✓ Overlapping subproblems
  ✓ Optimal substructure
  Examples: LCS, LIS, Knapsack, Matrix Chain, Coin Change

Quick Test: Can you prove a greedy choice never hurts? → Greedy.
Otherwise count overlapping subproblems → DP.`,
    tags: ['greedy', 'dynamic-programming', 'design'],
    difficulty: 'medium',
  },
  // ── Data Structures ─────────────────────────────────────────────────────
  {
    subject: 'Data Structures',
    title: 'Binary Heap Properties',
    contentMd: `Min-Heap: parent ≤ children  |  Max-Heap: parent ≥ children

Array representation (1-indexed):
  Parent(i) = ⌊i/2⌋
  Left(i)   = 2i
  Right(i)  = 2i + 1

Operations:
  Insert       : O(log n)  — add at end, bubble up
  Delete-min   : O(log n)  — swap root with last, bubble down
  Build-heap   : O(n)      ← NOT O(n log n)! (GATE favourite trap)
  Heapify      : O(log n)

Height of heap with n nodes = ⌊log₂ n⌋

GATE Trap: Building a heap from n elements is O(n), not O(n log n).`,
    tags: ['heap', 'priority-queue', 'tree'],
    difficulty: 'medium',
    gateYear: 2023,
  },
  {
    subject: 'Data Structures',
    title: 'AVL Tree Rotations — Instant Recall',
    contentMd: `Balance Factor (BF) = height(left) - height(right)
Valid BF ∈ {-1, 0, +1}

When BF = +2 (left-heavy):
  Left-Left   case → Single Right Rotation
  Left-Right  case → Left Rotation on child, then Right Rotation

When BF = -2 (right-heavy):
  Right-Right case → Single Left Rotation
  Right-Left  case → Right Rotation on child, then Left Rotation

Memory trick: LL→R, LR→LR, RR→L, RL→RL
(The imbalance pattern tells you the rotation direction, reversed)

Max nodes in AVL of height h: 2^(h+1) - 1
Min nodes: N(h) = N(h-1) + N(h-2) + 1  (Fibonacci-like)`,
    tags: ['avl', 'balanced-bst', 'rotations'],
    difficulty: 'hard',
    gateYear: 2022,
  },
  {
    subject: 'Data Structures',
    title: 'Hashing — Collision Resolution',
    contentMd: `Open Addressing (Probing):
  Linear Probing   : h(k, i) = (h'(k) + i) mod m
    → Primary clustering problem
  Quadratic Probing: h(k, i) = (h'(k) + c₁i + c₂i²) mod m
    → Secondary clustering
  Double Hashing   : h(k, i) = (h₁(k) + i·h₂(k)) mod m
    → Best distribution, no clustering

Chaining (Closed Addressing):
  Load factor α = n/m
  Successful search   : 1 + α/2
  Unsuccessful search : 1 + α

GATE Trap: In open addressing, deletion requires marking slots as DELETED (not empty).`,
    tags: ['hashing', 'collision', 'load-factor'],
    difficulty: 'medium',
    gateYear: 2021,
  },
  // ── Operating Systems ─────────────────────────────────────────────────
  {
    subject: 'Operating Systems',
    title: 'Page Replacement Algorithms — Hit Rate',
    contentMd: `FIFO (First In First Out):
  - Replace oldest page. Simple but suffers Belady's Anomaly.
  - More frames can → MORE page faults! (GATE trap)

LRU (Least Recently Used):
  - Replace page not used for longest time. Optimal in practice.
  - No Belady's Anomaly.

Optimal (OPT / Belady's):
  - Replace page not needed for longest time in FUTURE.
  - Best possible, used as benchmark only.

LFU (Least Frequently Used):
  - Replace page with fewest accesses.

GATE Trick: Only FIFO suffers Belady's Anomaly.
Stack algorithms (LRU, OPT) never suffer it.`,
    tags: ['page-replacement', 'virtual-memory', 'belady'],
    difficulty: 'medium',
    gateYear: 2024,
  },
  {
    subject: 'Operating Systems',
    title: 'Deadlock — Necessary Conditions & Detection',
    contentMd: `4 Coffman Conditions (ALL must hold for deadlock):
  1. Mutual Exclusion  — resource held non-shareably
  2. Hold and Wait     — holding ≥1 resource, waiting for more
  3. No Preemption     — resources released only voluntarily
  4. Circular Wait     — circular chain of processes waiting

Banker's Algorithm (Deadlock Avoidance):
  Safe state = there exists a safe sequence.
  Need[i][j] = Max[i][j] - Allocation[i][j]

Detection: Resource Allocation Graph
  - Single instance → cycle = deadlock
  - Multiple instances → use reduction algorithm

Recovery: Kill process, preempt resource, rollback.

GATE Trick: Circular wait alone is not sufficient for deadlock — all 4 must hold.`,
    tags: ['deadlock', 'banker', 'synchronization'],
    difficulty: 'hard',
    gateYear: 2023,
  },
  {
    subject: 'Operating Systems',
    title: 'CPU Scheduling — Key Formulas',
    contentMd: `Turnaround Time (TAT) = Completion Time - Arrival Time
Waiting Time (WT)     = TAT - Burst Time
Response Time         = First CPU - Arrival Time

FCFS: Non-preemptive, convoy effect with long jobs first.
SJF (Non-preemptive): Minimum average waiting time (provably optimal).
SRTF (Preemptive SJF): Even better average, starvation risk.
Round Robin: Preemptive, fair. Higher TQ → FCFS. Lower TQ → more context switches.
Priority: Can cause starvation → fix with Aging.

GATE Shortcut:
Average WT = Average TAT - Average Burst Time
(Never recalculate TAT from scratch — use this!)`,
    tags: ['scheduling', 'cpu', 'turnaround-time'],
    difficulty: 'medium',
    gateYear: 2022,
  },
  // ── Computer Networks ─────────────────────────────────────────────────
  {
    subject: 'Computer Networks',
    title: 'OSI vs TCP/IP — Layer Mapping',
    contentMd: `OSI Model (7 layers):           TCP/IP (4 layers):
  7. Application    ┐
  6. Presentation   ├──→  4. Application (HTTP, DNS, FTP, SMTP)
  5. Session        ┘
  4. Transport      ──→  3. Transport   (TCP, UDP)
  3. Network        ──→  2. Internet    (IP, ICMP, ARP)
  2. Data Link      ┐
  1. Physical       ┘──→  1. Network Access (Ethernet, Wi-Fi)

Key Protocols per Layer:
  Application : HTTP(80), HTTPS(443), DNS(53), FTP(21), SMTP(25), SSH(22)
  Transport   : TCP (reliable, connection-oriented), UDP (fast, connectionless)
  Network     : IP (addressing), ICMP (ping/traceroute), ARP (IP→MAC)

GATE Trick: ARP is in Data Link layer in OSI, but Internet layer in TCP/IP!`,
    tags: ['osi', 'tcp-ip', 'protocols', 'layers'],
    difficulty: 'easy',
    gateYear: 2022,
  },
  {
    subject: 'Computer Networks',
    title: 'TCP Congestion Control — AIMD',
    contentMd: `Phases:
  Slow Start        : cwnd doubles each RTT (exponential) until ssthresh
  Congestion Avoid  : cwnd += 1 each RTT (linear) after ssthresh
  Fast Retransmit   : On 3 duplicate ACKs, retransmit without waiting timeout
  Fast Recovery     : ssthresh = cwnd/2, cwnd = ssthresh (skip slow start)
  Timeout           : ssthresh = cwnd/2, cwnd = 1 (full slow start restart)

AIMD: Additive Increase, Multiplicative Decrease
  - On loss: cwnd = cwnd/2
  - Each ACK: cwnd += 1/cwnd

Throughput ≈ (0.75 × MSS) / (RTT × √p)  where p = packet loss rate

GATE Trap: 3 duplicate ACKs → Fast Retransmit (not timeout reset).
Timeout → cwnd = 1 (full reset).`,
    tags: ['tcp', 'congestion', 'sliding-window'],
    difficulty: 'hard',
    gateYear: 2024,
  },
  // ── Databases ────────────────────────────────────────────────────────
  {
    subject: 'Databases',
    title: 'Normal Forms — Quick Decision Tree',
    contentMd: `1NF: No multivalued/composite attributes. Atomic values only.

2NF: 1NF + No partial dependency (non-key attribute depends on part of composite PK).
     Only possible violation: composite primary key.

3NF: 2NF + No transitive dependency (A→B→C where A is PK and B is non-key).
     Allows some redundancy to preserve all FDs.

BCNF: 3NF + For every FD X→Y, X must be a superkey.
      Stricter than 3NF. May lose some FDs.

Memory: "Every determinant must be a candidate key" = BCNF.

GATE Shortcut: To find closure of {A}: start with A, apply all FDs.
If closure = all attributes → A is a superkey.`,
    tags: ['normalization', 'functional-dependency', 'bcnf'],
    difficulty: 'hard',
    gateYear: 2023,
  },
  {
    subject: 'Databases',
    title: 'Transaction Isolation Levels — Anomalies',
    contentMd: `Level            | Dirty Read | Non-Rep Read | Phantom Read
-----------------|------------|--------------|-------------
Read Uncommitted | ✓ Possible | ✓ Possible   | ✓ Possible
Read Committed   | ✗ Prevented| ✓ Possible   | ✓ Possible
Repeatable Read  | ✗ Prevented| ✗ Prevented  | ✓ Possible
Serializable     | ✗ Prevented| ✗ Prevented  | ✗ Prevented

Dirty Read    : Read uncommitted data from another transaction.
Non-Rep Read  : Same query gives different results in same txn.
Phantom Read  : New rows appear between two reads.

ACID Properties:
  Atomicity  → Undo (rollback)
  Consistency → Application logic + DB constraints
  Isolation  → Concurrency control (locks/MVCC)
  Durability → Redo (WAL/write-ahead log)`,
    tags: ['transactions', 'acid', 'isolation', 'concurrency'],
    difficulty: 'medium',
    gateYear: 2021,
  },
  // ── Digital Logic ─────────────────────────────────────────────────────
  {
    subject: 'Digital Logic',
    title: 'K-Map Grouping Rules — Fast Minimization',
    contentMd: `Rules for valid groups:
  1. Size must be power of 2: 1, 2, 4, 8, 16…
  2. Groups must be rectangular (wraps around edges allowed!)
  3. Cells must be adjacent (differ by exactly 1 variable)
  4. Always use largest possible groups
  5. Every 1 must be in at least one group
  6. Don't-cares (X) can be included if they help enlarge groups

SOP (Sum of Products): Group 1s
POS (Product of Sums): Group 0s

GATE Trick for 4-variable K-map:
  Corners all together form a valid group of 4!
  Top-bottom and left-right wrap around.

Essential Prime Implicant: A PI that covers a minterm not covered by any other PI.`,
    tags: ['k-map', 'boolean', 'minimization', 'sop'],
    difficulty: 'medium',
    gateYear: 2022,
  },
  // ── Theory of Computation ────────────────────────────────────────────
  {
    subject: 'TOC',
    title: 'Chomsky Hierarchy — Language Classes',
    contentMd: `Type 0: Recursively Enumerable (Unrestricted Grammar)
  → Turing Machine accepts

Type 1: Context-Sensitive (CSG)
  → Linear Bounded Automaton (LBA)

Type 2: Context-Free (CFG)
  → Pushdown Automaton (PDA)

Type 3: Regular (RG)
  → Finite Automaton (DFA/NFA)

Containment: Type 3 ⊂ Type 2 ⊂ Type 1 ⊂ Type 0

Closure Properties:
  Regular:    Closed under Union, Concat, Star, Complement, Intersection ✓
  CFL:        Closed under Union, Concat, Star ✓
              NOT closed under Complement, Intersection ✗
  CSL:        Closed under all boolean operations ✓

GATE Trick: Intersection of 2 CFLs is NOT always CFL.
But CFL ∩ Regular = CFL (always).`,
    tags: ['automata', 'grammar', 'turing-machine', 'cfl'],
    difficulty: 'hard',
    gateYear: 2024,
  },
  {
    subject: 'TOC',
    title: 'Pumping Lemma — Proof Strategy',
    contentMd: `For Regular Languages:
  ∀ language L, ∃ p (pumping length) such that
  ∀ string s ∈ L with |s| ≥ p,
  s = xyz where:
    1. |y| ≥ 1
    2. |xy| ≤ p
    3. ∀ k ≥ 0: xy^k z ∈ L

To PROVE a language is NOT regular:
  1. Assume L is regular with pumping length p
  2. Choose a string s ∈ L with |s| ≥ p  ← pick strategically!
  3. Show that for ALL ways to split s = xyz (with constraints),
     some xy^k z ∉ L
  4. Contradiction → L is not regular

Classic example: L = {0^n 1^n | n ≥ 0}
Choose s = 0^p 1^p. Since |xy| ≤ p, y is all 0s.
Pumping y twice gives more 0s than 1s → not in L.`,
    tags: ['pumping-lemma', 'regular', 'cfl', 'proof'],
    difficulty: 'hard',
  },
  // ── Compiler Design ──────────────────────────────────────────────────
  {
    subject: 'Compiler Design',
    title: 'LL(1) vs LR(0) vs LR(1) — Parser Power',
    contentMd: `LL(1): Top-down, left-to-right, leftmost derivation, 1 token lookahead
  - Uses Predictive Parsing Table
  - No left recursion, no ambiguity allowed
  - Must compute FIRST and FOLLOW sets
  - FIRST(A) ∩ FOLLOW(A) = ∅ for nullable A

LR(0): Bottom-up, no lookahead
  - Least powerful LR parser
  - Shift-Reduce and Reduce-Reduce conflicts common

SLR(1): LR(0) + FOLLOW sets for reduce decisions
  - More powerful than LR(0)

LR(1): Full canonical LR, 1 lookahead token
  - Most powerful, huge parse table

LALR(1): Merges LR(1) states with same core
  - Nearly as powerful as LR(1), much smaller table
  - Used by Yacc/Bison

Power: LL(1) < LR(0) < SLR(1) < LALR(1) < LR(1)
GATE Trap: Every LL(1) grammar is also LR(1), but not vice versa.`,
    tags: ['parsing', 'grammar', 'll1', 'lr1', 'lalr'],
    difficulty: 'hard',
    gateYear: 2023,
  },
  // ── Mathematics ──────────────────────────────────────────────────────
  {
    subject: 'Mathematics',
    title: 'Counting Formulas — Permutations & Combinations',
    contentMd: `Permutation (order matters):
  P(n, r) = n! / (n-r)!

Combination (order doesn't matter):
  C(n, r) = n! / (r! × (n-r)!)

Key Identities:
  C(n, r) = C(n, n-r)                  ← symmetry
  C(n, r) + C(n, r-1) = C(n+1, r)     ← Pascal's rule
  Σ C(n, r) for r=0..n = 2^n           ← sum of row

Pigeonhole Principle:
  n items into k containers → at least one container has ≥ ⌈n/k⌉ items.

Stars and Bars (distributing n identical items into k distinct bins):
  With empty bins allowed: C(n+k-1, k-1)
  Without empty bins:      C(n-1, k-1)

GATE Trick: "At least 1 in each bin" → Stars and Bars without empty bins.`,
    tags: ['combinatorics', 'counting', 'pigeonhole'],
    difficulty: 'medium',
    gateYear: 2022,
  },
  {
    subject: 'Mathematics',
    title: 'Graph Theory — Key Theorems',
    contentMd: `Euler Path/Circuit:
  Euler Path    : Exactly 2 vertices of odd degree
  Euler Circuit : All vertices have even degree (and graph is connected)

Hamilton Path/Circuit:
  No simple characterization (NP-complete to decide)

Handshaking Lemma:
  Σ deg(v) = 2|E|   →  Sum of degrees = twice the edges
  Corollary: Number of odd-degree vertices is always EVEN

Planar Graph (Euler's Formula):
  V - E + F = 2  (for connected planar graph)
  E ≤ 3V - 6     (general planar graph)
  E ≤ 2V - 4     (bipartite planar graph, no triangles)

Chromatic Number:
  Tree             : 2 (bipartite)
  Bipartite graph  : 2
  K_n              : n
  Petersen graph   : 3

GATE Trick: If E > 3V-6, graph is definitely non-planar (K_5 check shortcut).`,
    tags: ['graph', 'euler', 'planar', 'chromatic'],
    difficulty: 'hard',
    gateYear: 2024,
  },
];

async function main() {
  console.log('🌱 Seeding shortcuts library...');

  for (const s of SHORTCUTS) {
    await prisma.shortcut.upsert({
      where: { id: s.title.replace(/\s+/g, '-').toLowerCase().slice(0, 36) },
      update: { contentMd: s.contentMd, tags: s.tags },
      create: {
        id: s.title.replace(/\s+/g, '-').toLowerCase().slice(0, 36),
        subject: s.subject,
        title: s.title,
        contentMd: s.contentMd,
        tags: s.tags,
        difficulty: s.difficulty,
        gateYear: s.gateYear,
      },
    });
  }

  console.log(`✅ Seeded ${SHORTCUTS.length} shortcuts across ${[...new Set(SHORTCUTS.map(s => s.subject))].length} subjects.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
