export interface MathResource {
  id: string;
  title: string;
  url: string;
  category: string;
  type: 'Interactive App' | 'Video' | 'PDF Document' | 'Guide / Article' | 'Interactive Puzzle';
  description: string;
  teaches: string[];
  tags: string[];
  source?: string;
  featured?: boolean;
}

export const RESOURCE_CATEGORIES = [
  'All Categories',
  'Interactive Apps & Tools',
  'Combinatorics',
] as const;

export const MATH_RESOURCES: MathResource[] = [
  // --- Interactive Suite ---
  {
    id: 'discover-math-play',
    title: 'Discover Math Play',
    url: '/discover-math-play',
    category: 'Interactive Apps & Tools',
    type: 'Interactive App',
    description: 'An interactive mathematical playground designed for active exploration of physical geometry, 3D solids, similar triangles, and real-world engineering concepts.',
    source: 'Josephite Math Club Interactive Suite',
    featured: true,
    tags: ['Geometry', 'Solids', 'Triangles', 'Modeling', 'Physics'],
    teaches: [
      'Observation and measurement',
      'Geometry of solids and surface areas',
      'Similar triangles & Thales shadow triangulation',
      'Algebraic manipulation & scale isolation',
      'Mathematical modelling and harmonic motion',
    ],
  },
  {
    id: 'know-math-symbols',
    title: 'Know Math Symbols',
    url: '/know-math-symbols',
    category: 'Interactive Apps & Tools',
    type: 'Interactive App',
    description: 'Master first-order predicate logic, mathematical quantifiers, and formal statement verification through interactive practice modules.',
    source: 'Josephite Math Club Interactive Suite',
    featured: true,
    tags: ['Logic', 'Quantifiers', 'Proofs', 'Notation', 'Set Theory'],
    teaches: [
      'Interpret the meanings of ∀ ("for all") and ∃ ("there exists")',
      'Distinguish between universal and existential statements',
      'Use counterexamples to disprove universal statements',
      'Verify existential statements by constructing valid witnesses',
    ],
  },

  // --- COMBINATORICS RESOURCES (Course Info: MAT_456_SKY_FALL_2024) ---
  // Section 1: Intro & N-Queens Puzzles
  {
    id: 'comb-co1-what-is-combinatorics',
    title: 'CO1 What is Combinatorics?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Fundamental introduction to combinatorial reasoning, discrete structures, and counting principles.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Intro', 'MAT_456'],
    teaches: ['Foundations of discrete mathematics', 'Counting vs enumeration', 'Overview of combinatorial structures']
  },
  {
    id: 'comb-co2-counting-problem-solution',
    title: 'CO2 What does a solution to a counting problem look like?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Analysis of counting outcomes, constructive solutions, closed formulas, and recurrence relations.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Counting', 'MAT_456'],
    teaches: ['Constructive counting methods', 'Evaluating closed-form solutions', 'Existence proofs in combinatorics']
  },
  {
    id: 'comb-8-queens-puzzle',
    title: '8 Queens Puzzle & The N-Queens Problem',
    url: '',
    category: 'Combinatorics',
    type: 'Interactive Puzzle',
    description: 'Classic chessboard placement puzzle of placing 8 non-attacking queens on an 8x8 grid.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'N-Queens', 'Chess Puzzles'],
    teaches: ['Constraint satisfaction problems', 'Backtracking search', 'Permutations on chessboard diagonals']
  },
  {
    id: 'comb-solving-n-queens-algorithm',
    title: 'Solving the N-Queens Problem - The Easiest Algorithm',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Algorithmic breakdown and systematic search optimization for the N-Queens problem.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Algorithms', 'N-Queens'],
    teaches: ['Algorithmic problem solving', 'Diagonal constraint elimination', 'Recursive backtracking']
  },
  {
    id: 'comb-8-queens-wikipedia',
    title: 'Eight queens puzzle - Wikipedia',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Comprehensive historical and mathematical article on the 8 Queens puzzle and its generalizations.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'N-Queens', 'Wikipedia'],
    teaches: ['Fundamental group of symmetries', 'Counting distinct vs total solutions', 'History of Gauss and Ahrens']
  },
  {
    id: 'comb-queens-puzzle-graph-theory',
    title: 'Solving the Queens Puzzle with Graph Theory - Wolfram Community',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Graph-theoretic formulation of queen independence numbers and vertex colorings in queen graphs.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Graph Theory', 'Wolfram'],
    teaches: ['Graph vertices and edges in chess', 'Independent sets in graphs', 'Wolfram Mathematica code modeling']
  },

  // Section 2: Magic Squares & Cubes
  {
    id: 'comb-what-is-combinatorics-explore',
    title: 'What Is Combinatorics? & Magic Square Fundamentals',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Exploration of magic constants, normal magic squares of order n, and historical square patterns.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Squares'],
    teaches: ['Magic constant formula M = n(n^2 + 1)/2', 'Row, column, and diagonal symmetry', 'Order n classification']
  },
  {
    id: 'comb-magic-square-and-cube',
    title: 'Magic Square and Magic Cube Exploration',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Extending 2D magic squares into 3D magic hypercubes with constant spatial diagonal sums.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Cubes'],
    teaches: ['3D matrix arrays', 'Space diagonals and pillar sums', 'Higher dimensional combinatorics']
  },
  {
    id: 'comb-perfect-magic-square',
    title: 'Perfect Magic Square',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Symmetrical magic squares where sub-quadrants and broken diagonals also sum to the magic constant.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Squares'],
    teaches: ['Pandiagonal magic squares', 'Symmetry group operations', 'Modular arithmetic constraints']
  },
  {
    id: 'comb-why-only-one-3x3-magic-square',
    title: 'Why is there only one 3x3 magic square?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Uniqueness proof demonstrating that the 3x3 magic square is unique up to 8 rotations and reflections.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Squares', 'Proof'],
    teaches: ['Center cell must be 5 proof', 'Corner cell parity rules', 'Dihedral group D4 symmetries']
  },
  {
    id: 'comb-unlocking-secrets-magic-squares',
    title: 'Unlocking the secrets of Magic Square puzzles',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Deconstructing magic square algorithms, Siamese step methods, and parity matrix constructions.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Squares', 'Puzzles'],
    teaches: ['De La Loubère algorithm', 'Odd vs even order magic squares', 'Pattern recognition']
  },
  {
    id: 'comb-make-9x9-magic-square',
    title: 'Make A 9x9 Magic Square! Learn The Ancient Chinese Algorithm',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Step-by-step construction of higher odd-order magic squares using ancient Luoshu grid algorithms.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Algorithms', 'Magic Squares'],
    teaches: ['Odd order step algorithms', 'Luoshu diagram history', 'Grid coordinate wrapping']
  },
  {
    id: 'comb-magic-squares-prof-brumgnach',
    title: 'Magic Squares with professor Edward Brumgnach',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Academic lecture on linear algebra transformations and vector subspaces of magic square matrices.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Linear Algebra', 'Lecture'],
    teaches: ['Matrix vector spaces', 'Kernel and Nullity of magic square systems', 'Linear transformations']
  },
  {
    id: 'comb-magic-squares-unlocked-puzzles',
    title: 'MAGIC SQUARES UNLOCKED: From Puzzles to Patterns',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Deep dive into structural patterns, magic constants, and recreational math applications.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Squares', 'Patterns'],
    teaches: ['Pattern discovery in grid numbers', 'Symmetry transformations', 'Mathematical aesthetics']
  },
  {
    id: 'comb-3-ways-to-solve-magic-square',
    title: '3 Ways to Solve Magic Square Math Puzzles',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Practical walkthroughs for solving odd, doubly-even (4x4), and singly-even (6x6) magic squares.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Magic Squares', 'Guide'],
    teaches: ['Cross-out method for 4x4 squares', 'LUX method for singly-even squares', 'Quick mental math checks']
  },
  {
    id: 'comb-magic-myth-math',
    title: 'The magic, myth and math of magic squares',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Historical exploration of magic squares in art (Dürer\'s Melencolia I), culture, and mathematics.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'History of Math', 'Magic Squares'],
    teaches: ['Albrecht Dürer 1514 magic square', 'Cultural history across civilizations', 'Mathematical symbolism']
  },
  {
    id: 'comb-korean-kings-magic-square',
    title: 'The Korean king\'s magic square: a brilliant algorithm in a k-drama',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Historical breakdown of King Sejong\'s and Choe Seok-jeong\'s magic square algorithms.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Algorithms', 'Magic Squares'],
    teaches: ['Orthogonal Latin squares', 'Choe Seok-jeong\'s Hexagonal magic square', 'Asian mathematical heritage']
  },
  {
    id: 'comb-fascination-magic-squares-royal-inst',
    title: 'The fascination of magic squares - Royal Institution (Michael Daniels & Sakal Roy)',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Royal Institution lecture on the beauty, algebraic properties, and recreational power of magic squares.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Royal Institution', 'Lecture'],
    teaches: ['Recreational mathematics', 'Combinatorial designs', 'Engaging math presentation']
  },
  {
    id: 'comb-magic-squares-strategy-guide',
    title: 'Magic Squares: A Detailed Strategy Guide – MathCommunities.org',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Detailed strategy guide for educators and students to construct and analyze magic squares.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'MathCommunities', 'Guide'],
    teaches: ['Pedagogical strategies', 'Grid algebraic proofs', 'Classroom extensions']
  },
  {
    id: 'comb-ramanujan-magic-square',
    title: 'Ramanujan Magic Square, Ramanujan Magical Square (MATH WONDERS)',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Srinivasa Ramanujan\'s birthday magic square where the top row encodes his birthdate (22-12-1887).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramanujan', 'Magic Squares'],
    teaches: ['Date-encoded magic squares', 'Ramanujan\'s combinatorial genius', 'Custom birthday square formulas']
  },
  {
    id: 'comb-ramanujan-birthday-linear-algebra',
    title: 'Fun with Ramanujan’s Birthday Magic Square and Linear Algebra',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Linear algebraic system of equations behind constructing custom birthday magic squares for any date.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramanujan', 'Linear Algebra'],
    teaches: ['4x4 linear systems', 'Parameterizing birthday entries', 'Matrix rank and independence']
  },

  // Section 3: Permutations and Combinations
  {
    id: 'comb-co11-counting-basics',
    title: 'CO11 Counting Basics: Multiplication Principle & Probability',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Fundamental counting principles: Product Rule, Sum Rule, and basic probability sample spaces.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Counting Basics', 'MAT_456'],
    teaches: ['Rule of Product and Rule of Sum', 'Tree diagrams for decision choices', 'Discrete probability foundations']
  },
  {
    id: 'comb-co12-balls-boxes',
    title: 'CO12 Balls & Boxes Counting Problems',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Comprehensive analysis of the Twelvefold Way: placing distinguishable/indistinguishable balls into boxes.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Twelvefold Way', 'MAT_456'],
    teaches: ['Distinguishable vs indistinguishable elements', 'Stirling numbers of the second kind', 'Partition functions']
  },
  {
    id: 'comb-co14-counting-permutations',
    title: 'CO14 Counting Permutations of a Set',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Ordered arrangements, nPr formulas, factorial growth, and symmetry permutations.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Permutations', 'MAT_456'],
    teaches: ['nPr formula derivation', 'Factorial notation and properties', 'Ordered selection without replacement']
  },
  {
    id: 'comb-co15-circular-permutations',
    title: 'CO15 Circular Permutations, # of k-cycles in S_n',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Arrangements around a circle, necklace counting, and cycle structure in symmetric group S_n.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Circular Permutations', 'MAT_456'],
    teaches: ['Division by rotation symmetries (n-1)!', 'k-cycles in symmetric groups', 'Necklace and bracelet counting']
  },
  {
    id: 'comb-co16-counting-combinations',
    title: 'CO16 Counting subsets aka Combinations via binomial coefficients',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Unordered selection, binomial coefficients (n k), subset counting, and Pascal identity.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Combinations', 'MAT_456'],
    teaches: ['nCr formula derivation', 'Symmetry (n k) = (n n-k)', 'Subsets of an n-element set']
  },
  {
    id: 'comb-co17-multisets-multinomial',
    title: 'CO17 Permutations of Multisets & Multinomial Coefficients',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Arranging elements with repetitions, word anagrams, and multinomial coefficients n!/(n1! n2! ... nk!).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Multisets', 'MAT_456'],
    teaches: ['Multiset permutations', 'Anagram counting formulas', 'Multinomial notation']
  },
  {
    id: 'comb-co18-multichoose-stars-bars',
    title: 'CO18 Counting Combinations with Repetition & Multichoose numbers',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Unordered selection with replacement, Stars and Bars technique, and multichoose formula ((n k)).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Stars and Bars', 'MAT_456'],
    teaches: ['Stars and Bars visual proof', 'Non-negative integer solutions to x1+...+xn=k', 'Multichoose coefficients']
  },

  // Section 4: The Pigeonhole Principle & Ramsey Theory
  {
    id: 'comb-gf1-what-is-function',
    title: 'GF1 What is a function? What do 1-1 and onto mean?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Injective (one-to-one), surjective (onto), and bijective functions as foundations for combinatorial proofs.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Functions', 'MAT_456'],
    teaches: ['Injection, surjection, and bijection definitions', 'Domain and codomain mappings', 'Counting functions between sets']
  },
  {
    id: 'comb-what-is-pigeonhole-principle',
    title: 'What Is the Pigeonhole Principle?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Intuitive video overview of Dirichlet\'s Box Principle and its ubiquitous problem-solving applications.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Pigeonhole Principle'],
    teaches: ['Statement of Dirichlet\'s Box Principle', 'Identifying items (pigeons) and containers (holes)', 'Existence proofs']
  },
  {
    id: 'comb-co4-pigeonhole-principle',
    title: 'CO4 The Pigeonhole Principle',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Formal formulation of the generalized Pigeonhole Principle ⌈n/k⌉ and foundational applications.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Pigeonhole Principle', 'MAT_456'],
    teaches: ['Generalized Pigeonhole theorem', 'Ceiling function bounds', 'Geometric & subset pigeonhole applications']
  },
  {
    id: 'comb-co5-erdos-szekeres-theorem',
    title: 'CO5 The Erdos-Szekeres Theorem',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Proof that any sequence of ab + 1 distinct real numbers contains a monotonic subsequence of length a+1 or b+1.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Erdos-Szekeres', 'MAT_456'],
    teaches: ['Monotonic subsequences', 'Pigeonhole proof using coordinate pairs', 'Extremal sequence length']
  },
  {
    id: 'comb-simple-principle-impossible-math',
    title: 'Simple Principle Solves Seemingly IMPOSSIBLE Math Problems',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Applying the Pigeonhole Principle to solve high-school and Olympiad competition challenges effortlessly.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Problem Solving', 'Olympiad'],
    teaches: ['Creative pigeonhole partitioning', 'Number theory modulo applications', 'Geometric point packing']
  },
  {
    id: 'comb-erdos-ramsey-numbers-commentary',
    title: 'Paul Erdős commented on Ramsey numbers R(3,3), R(4,4), R(5,5) and R(6,6)',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Paul Erdős\'s legendary commentary on alien computational threats and the impossibility of finding R(6,6).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramsey Theory', 'Erdos'],
    teaches: ['Definition of Ramsey numbers R(r,s)', 'Known values R(3,3)=6, R(4,4)=18', 'Computational complexity of Ramsey numbers']
  },
  {
    id: 'comb-cg1-graphs-basic-vocabulary',
    title: 'CG1 Graphs: Basic Vocabulary',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Essential graph theory terminology: Vertices, Edges, Degrees, Handshaking Lemma, Complete Graphs K_n.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Graph Theory', 'MAT_456'],
    teaches: ['Graph definition G=(V,E)', 'Handshaking Lemma ∑deg(v) = 2|E|', 'Bipartite and complete graph structures']
  },
  {
    id: 'comb-co6-what-is-ramsey-theory',
    title: 'CO6 What is Ramsey Theory?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Introduction to Ramsey theory: "Complete disorder is impossible" in monochromatic edge colorings.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramsey Theory', 'MAT_456'],
    teaches: ['2-colorings of complete graph edges', 'Party problem: 6 people contain 3 mutual friends or 3 strangers', 'Monochromatic cliques']
  },
  {
    id: 'comb-co7-proof-ramseys-theorem-2-colors',
    title: 'CO7 Proof of Ramsey\'s Theorem for 2 colors',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Inductive proof that Ramsey number R(r,s) exists and satisfies R(r,s) ≤ R(r-1,s) + R(r,s-1).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramsey Proof', 'MAT_456'],
    teaches: ['Inductive proof of Ramsey\'s theorem', 'Pascal-like recurrence bound for Ramsey numbers', 'Finiteness of Ramsey numbers']
  },
  {
    id: 'comb-co8-small-ramsey-numbers',
    title: 'CO8 Small Ramsey Numbers: r(3, 4)=9, r(3, 5)= 14, r(4,4) =18',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Explicit construction and upper/lower bound proofs for small Ramsey numbers R(3,4), R(3,5), and R(4,4).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramsey Numbers', 'MAT_456'],
    teaches: ['Constructing edge-coloring counterexample graphs', 'Proving upper bounds via degree arguments', 'Exact Ramsey values']
  },
  {
    id: 'comb-co21-upper-lower-bounds-ramsey',
    title: 'CO21 Upper and Lower Bounds for Ramsey Numbers',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Asymptotic bounds for R(k,k) using Stirling\'s approximation and Erdős\'s probabilistic lower bound method.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramsey Bounds', 'MAT_456'],
    teaches: ['Probabilistic Method introduced by Erdős', 'Exponential bounds 2^(k/2) < R(k,k) ≤ 4^k', 'Asymptotic notation in combinatorics']
  },
  {
    id: 'comb-why-complete-chaos-impossible-ramsey',
    title: 'Why complete chaos is impossible || Ramsey Theory',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Conceptual, highly visual video explaining how large mathematical systems forcedly exhibit structured order.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Ramsey Theory'],
    teaches: ['Visual graph colorings', 'Inevitability of structure in large sets', 'Ramsey theory in communication networks']
  },
  {
    id: 'comb-4-5-finite-cardinality-libretexts',
    title: '4.5: Finite Cardinality - Engineering LibreTexts',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Engineering textbook chapter on finite set cardinalities, bijections, and countability.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'LibreTexts', 'Cardinality'],
    teaches: ['Set cardinalities |A|', 'Bijection principle for set equality', 'Finite vs infinite sets']
  },
  {
    id: 'comb-14-8-pigeonhole-libretexts',
    title: '14.8: The Pigeonhole Principle - Engineering LibreTexts',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Engineering textbook chapter detailing formal pigeonhole principle proofs and hashing collisions.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'LibreTexts', 'Pigeonhole'],
    teaches: ['Hash table collisions', 'Data compression limits', 'Formal statement & proof techniques']
  },
  {
    id: 'comb-pigeonhole-brilliant-wiki',
    title: 'Pigeonhole Principle | Brilliant Math & Science Wiki',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Brilliant.org wiki article covering beginner to advanced competition problems solved via Pigeonhole Principle.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Brilliant', 'Pigeonhole'],
    teaches: ['Divisibility pigeonhole proofs', 'Subsets with given sums', 'Geometric pigeonhole applications']
  },
  {
    id: 'comb-16-fun-applications-pigeonhole',
    title: '16 fun applications of the pigeonhole principle',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Collection of 16 engaging real-world puzzles (hair count, handshakes, socks in drawers) solved with Pigeonhole.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Applications', 'Pigeonhole'],
    teaches: ['Real-world mathematical modeling', 'Everyday pigeonhole examples', 'Fun math paradoxes']
  },
  {
    id: 'comb-fitch-cheney-card-trick',
    title: 'Learn A Remarkable Mathematical Card Trick – Game Theory Tuesdays',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Explanation of Fitch Cheney\'s 5-card trick using the Pigeonhole Principle and modulo arithmetic permutations.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Card Tricks', 'Game Theory'],
    teaches: ['Card suit pigeonhole selection', 'Cycle permutations for encoding numbers 1-6', 'Information transmission protocols']
  },

  // Section 5: The Binomial Coefficients & Pascal's Triangle
  {
    id: 'comb-co19-binomial-identities-combinatorial-proofs',
    title: 'CO19 Combinatorial Proofs of Binomial Identities',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Proving algebraic identities (e.g. ∑(n k) = 2^n, Pascal\'s identity) without algebra by double counting.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Binomial Proofs', 'MAT_456'],
    teaches: ['Double counting method', 'Committee forming stories for equations', 'Algebraic-free identity proofs']
  },
  {
    id: 'comb-co20-unimodality-binomial-coefficients',
    title: 'CO20 Unimodality of Binomial Coefficients',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Proof that the sequence (n 0), (n 1), ..., (n n) increases monotonically to the middle coefficient and then decreases.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Unimodality', 'MAT_456'],
    teaches: ['Unimodal sequences definition', 'Ratio test (n k+1)/(n k)', 'Symmetry and peak at ⌊n/2⌋']
  },
  {
    id: 'comb-co22-binomial-theorem',
    title: 'CO22 The Binomial Theorem',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Formal statement and algebraic/combinatorial proofs of (x+y)^n = ∑ (n k) x^k y^(n-k).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Binomial Theorem', 'MAT_456'],
    teaches: ['Binomial expansion formula', 'Substituting x=1, y=1 and x=1, y=-1', 'Polynomial coefficient extraction']
  },
  {
    id: 'comb-what-lies-above-pascals-triangle',
    title: 'What Lies Above Pascal\'s Triangle?',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Extending Pascal\'s triangle into negative rows and fractional indices using Newton\'s binomial theorem.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Pascal Triangle'],
    teaches: ['Generalized binomial coefficients (r k)', 'Negative index expansions', 'Mathematical extrapolation']
  },
  {
    id: 'comb-expand-x1-irrational-power',
    title: 'How to Expand x+1 Raised to an Irrational Power',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Infinite series binomial expansion for (1+x)^α where α is an irrational or real number.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Binomial Series'],
    teaches: ['Newton\'s generalized binomial series', 'Convergence radius |x| < 1', 'Taylor series connection']
  },
  {
    id: 'comb-co23-multinomial-coefficients-theorem',
    title: 'CO23 Multinomial Coefficients & the Multinomial Theorem',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Expanding (x1 + x2 + ... + xm)^n and calculating general term coefficients (n / k1,k2,...,km).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Multinomial', 'MAT_456'],
    teaches: ['Multinomial expansion formula', 'Partitioning n into m non-negative integers', 'Combinatorial interpretation']
  },
  {
    id: 'comb-counting-paths-grid-permutations',
    title: 'Counting Paths On A Grid (Permutations)',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Manhattan lattice path counting from origin (0,0) to (m,n) using combinations (m+n choose m).',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Grid Paths'],
    teaches: ['Lattice paths in 2D grids', 'Mapping Rights (R) and Ups (U) to word permutations', 'Monotone path counting']
  },
  {
    id: 'comb-number-of-paths-algorithm',
    title: 'How to do the Number of Paths Algorithm',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Dynamic programming / Pascal triangle addition algorithm to compute paths on grid layouts with blocked paths.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Grid Paths', 'Algorithms'],
    teaches: ['Pascal addition recurrence on grid vertices', 'Handling blocked or missing grid vertices', 'Dynamic programming path counting']
  },
  {
    id: 'comb-what-you-dont-know-pascals-triangle',
    title: 'What You Don\'t Know About Pascal\'s Triangle',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Hidden secrets in Pascal\'s triangle: Fibonacci numbers along diagonals, prime divisibility patterns, and Sierpinski triangle.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Pascal Triangle'],
    teaches: ['Shallow diagonal Fibonacci sums', 'Sierpinski triangle via mod 2 parity', 'Hockey stick identity']
  },
  {
    id: 'comb-14-10-combinatorial-proofs-libretexts',
    title: '14.10: Combinatorial Proofs - Engineering LibreTexts',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'LibreTexts guide on writing precise combinatorial double counting proofs for discrete math courses.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'LibreTexts', 'Combinatorial Proofs'],
    teaches: ['Double counting structure', 'Bijective proof framework', 'Avoiding algebraic manipulation']
  },
  {
    id: 'comb-pascals-triangle-binomial-theorem-wiki',
    title: 'Pascal\'s Triangle & Binomial Theorem Guides',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Detailed reference guides explaining Pascal\'s triangle properties, row sums, and algebraic identities.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Pascal Triangle', 'Binomial Theorem'],
    teaches: ['Symmetry of binomial coefficients', 'Sum of row n equals 2^n', 'Applications in probability']
  },
  {
    id: 'comb-how-many-paths-a-to-b-math-doctors',
    title: 'How Many Paths from A to B? – The Math Doctors',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Comprehensive problem-solving guide for grid path problems with restrictions, mandatory waypoints, and obstacles.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Grid Paths', 'Math Doctors'],
    teaches: ['Waypoints multiplication (A→C)×(C→B)', 'Inclusion-Exclusion for avoided vertices', 'Sub-grid calculations']
  },
  {
    id: 'comb-navigate-grid-betterexplained',
    title: 'Navigate a Grid Using Combinations And Permutations – BetterExplained',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Intuitive article explaining grid navigation combinatorics without memorizing dry formulas.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Grid Paths', 'BetterExplained'],
    teaches: ['Intuitive mental models for combinations', 'Paths as movement sequences', 'Connecting algebra to geometry']
  },

  // Section 6: The Inclusion-Exclusion Principle
  {
    id: 'comb-visual-inclusion-exclusion',
    title: 'Visual Inclusion/Exclusion',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Intuitive visual explanation of set intersections, overcounting corrections, and Venn diagrams.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Inclusion-Exclusion', 'Visualization'],
    teaches: ['Overcounting correction intuition', 'Venn diagrams for 2, 3, and 4 sets', 'Alternating sum signs (+ - + -)']
  },
  {
    id: 'comb-co32-inclusion-exclusion-principle',
    title: 'CO32 The Inclusion-Exclusion Principle',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Formal statement and inductive proof of PIE for n finite sets: |⋃ A_i| = ∑|A_i| - ∑|A_i ∩ A_j| + ...',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'PIE', 'MAT_456'],
    teaches: ['General PIE formula for n sets', 'Element inclusion counting proof', 'Complementary counting |A| - |⋃ A_i|']
  },
  {
    id: 'comb-co34-multiset-combinations-pie',
    title: 'CO34 Combinations of Multisets via Inclusion-Exclusion',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Solving Stars and Bars multiset combination problems with upper bound capacity restrictions using PIE.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Multisets', 'PIE', 'MAT_456'],
    teaches: ['Handling capacity constraints x_i ≤ c_i', 'Combining Stars and Bars with PIE', 'Forbidden property subsets']
  },
  {
    id: 'comb-co35-hat-check-problem-derangements',
    title: 'CO35 The Hat-Check Problem and Counting Derangements',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Permutations with no fixed points (derangements D_n), subfactorial !n formula, and limit lim D_n/n! = 1/e.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Derangements', 'MAT_456'],
    teaches: ['Hat-Check problem formulation', 'Derangement formula !n = n! ∑ (-1)^k / k!', 'Asymptotic convergence to 1/e']
  },
  {
    id: 'comb-co36-non-attacking-rooks-forbidden-positions',
    title: 'CO36 Non-attacking Rooks on Boards with Forbidden Positions',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Placing non-attacking rooks on arbitrary boards with forbidden squares using rook polynomials and PIE.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Rook Polynomials', 'MAT_456'],
    teaches: ['Rook polynomials R(x, B)', 'Board decomposition theorems', 'Matching permutations to forbidden positions']
  },
  {
    id: 'comb-3-5-3-pie-example-euler-totient',
    title: '3.5.3 Inclusion-Exclusion Example: Euler Totient Function',
    url: '',
    category: 'Combinatorics',
    type: 'Video',
    description: 'Deriving Euler\'s totient formula φ(n) = n ∏ (1 - 1/p) using Inclusion-Exclusion on prime factors of n.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Euler Totient', 'PIE'],
    teaches: ['Euler\'s totient function φ(n)', 'Prime factorization set intersections', 'Number theoretic inclusion-exclusion']
  },
  {
    id: 'comb-principle-inclusion-exclusion-brilliant',
    title: 'Principle of Inclusion and Exclusion (PIE) | Brilliant Math & Science Wiki',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Comprehensive Brilliant.org article with interactive practice problems on PIE, derangements, and surjection counting.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'Brilliant', 'PIE'],
    teaches: ['Number of surjective functions S(n,k)', 'Inclusion-exclusion practice problems', 'Complement counting techniques']
  },
  {
    id: 'comb-14-9-inclusion-exclusion-libretexts',
    title: '14.9: Inclusion-Exclusion - Engineering LibreTexts',
    url: '',
    category: 'Combinatorics',
    type: 'Guide / Article',
    description: 'Textbook chapter covering formal statement, proof by characteristic functions, and applications of PIE.',
    source: 'Course Info: MAT_456_SKY_FALL_2024',
    tags: ['Combinatorics', 'LibreTexts', 'PIE'],
    teaches: ['Characteristic indicator functions', 'Proof of PIE using indicator variable algebra', 'Computer science counting applications']
  }
];
