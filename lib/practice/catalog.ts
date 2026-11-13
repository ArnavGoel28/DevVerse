// PR-01 / PR-08: the Practice problem set. Original problems written for DevVerse (no statements copied from
// other sites, D-15). MVP language: JavaScript, judged in the user's own browser (D-32).
// Each problem is a single function: tests call it with `args` and compare the result to `expected`.

export type Difficulty = "easy" | "medium" | "hard";

export type PracticeTest = { args: unknown[]; expected: unknown };

export type PracticeProblem = {
  id: string;
  title: string;
  difficulty: Difficulty;
  /** Topic ids, also used as skill ids for evidence (DI-02). */
  topics: string[];
  fn: string;
  statement: string; // markdown
  starter: string;
  samples: PracticeTest[];
  tests: PracticeTest[]; // includes the samples
  /** Offline hints, gentle → specific (PR-06). Used when Gemini is unavailable. */
  hints: [string, string, string];
};

export const TOPIC_NAMES: Record<string, string> = {
  arrays: "Arrays",
  strings: "Strings",
  "hash-maps": "Hash maps",
  "two-pointers": "Two pointers",
  stacks: "Stacks",
  recursion: "Recursion",
  sorting: "Sorting",
  "binary-search": "Binary search",
  "dynamic-programming": "Dynamic programming",
  "sliding-window": "Sliding window",
};

const p = (x: Omit<PracticeProblem, "tests"> & { more: PracticeTest[] }): PracticeProblem => {
  const { more, ...rest } = x;
  return { ...rest, tests: [...x.samples, ...more] };
};

export const PROBLEMS: PracticeProblem[] = [
  p({
    id: "pair-to-target",
    title: "Pair to Target",
    difficulty: "easy",
    topics: ["arrays", "hash-maps"],
    fn: "pairToTarget",
    statement:
      "Given an array of integers `nums` and an integer `target`, return the indices `[i, j]` (with `i < j`) of the two numbers that add up to `target`. Exactly one pair exists.\n\nTry to do it in one pass.",
    starter: "function pairToTarget(nums, target) {\n  // return [i, j]\n}\n",
    samples: [
      { args: [[3, 8, 11, 2], 10], expected: [1, 3] },
      { args: [[5, 5], 10], expected: [0, 1] },
    ],
    more: [
      { args: [[-4, 1, 9, 7], 5], expected: [0, 2] },
      { args: [[0, 2, 4, 6, 8], 14], expected: [3, 4] },
    ],
    hints: [
      "For each number, what other number would you need to reach the target?",
      "Remember the numbers you've already seen, and where you saw them.",
      "Use a Map from value to index; for each nums[i], check whether target - nums[i] is already in the map.",
    ],
  }),
  p({
    id: "flip-the-words",
    title: "Flip the Words",
    difficulty: "easy",
    topics: ["strings"],
    fn: "flipWords",
    statement:
      "Given a sentence `s`, return the words in reverse order, joined by a single space. Ignore extra spaces at the start, end or between words.",
    starter: "function flipWords(s) {\n  \n}\n",
    samples: [
      { args: ["build things that matter"], expected: "matter that things build" },
      { args: ["  hello   devverse "], expected: "devverse hello" },
    ],
    more: [
      { args: ["one"], expected: "one" },
      { args: ["a b  c"], expected: "c b a" },
    ],
    hints: [
      "First get a clean list of the words.",
      "Splitting on whitespace can leave empty strings; drop them.",
      "s.trim().split(/\\s+/) gives the words; reverse the array and join with ' '.",
    ],
  }),
  p({
    id: "mirror-text",
    title: "Mirror Text",
    difficulty: "easy",
    topics: ["strings", "two-pointers"],
    fn: "isMirror",
    statement:
      "Return `true` if `s` reads the same forwards and backwards when you keep only letters and digits and ignore case. Otherwise return `false`.",
    starter: "function isMirror(s) {\n  \n}\n",
    samples: [
      { args: ["Step on no pets!"], expected: true },
      { args: ["DevVerse"], expected: false },
    ],
    more: [
      { args: [""], expected: true },
      { args: ["12-3-21"], expected: true },
      { args: ["ab"], expected: false },
    ],
    hints: [
      "Clean the string first, or skip the characters you don't care about.",
      "Compare characters from both ends moving towards the middle.",
      "Use two indexes i (start) and j (end); skip non-alphanumerics, compare lowercase, move inwards.",
    ],
  }),
  p({
    id: "balanced-brackets",
    title: "Balanced Brackets",
    difficulty: "easy",
    topics: ["stacks", "strings"],
    fn: "isBalanced",
    statement:
      "Given a string made of `()[]{}` characters, return `true` if every bracket is closed by the same type, in the correct order.",
    starter: "function isBalanced(s) {\n  \n}\n",
    samples: [
      { args: ["{[()]}"], expected: true },
      { args: ["([)]"], expected: false },
    ],
    more: [
      { args: [""], expected: true },
      { args: ["(("], expected: false },
      { args: ["()[]{}"], expected: true },
      { args: ["}"], expected: false },
    ],
    hints: [
      "The most recently opened bracket must be the first one closed.",
      "Which data structure gives you 'last in, first out'?",
      "Push opening brackets onto a stack; on a closing bracket, pop and check it matches; the stack must be empty at the end.",
    ],
  }),
  p({
    id: "staircase-ways",
    title: "Staircase Ways",
    difficulty: "easy",
    topics: ["dynamic-programming", "recursion"],
    fn: "staircaseWays",
    statement:
      "You climb a staircase of `n` steps, taking 1 or 2 steps at a time. Return how many different ways you can reach the top. `1 ≤ n ≤ 60`.",
    starter: "function staircaseWays(n) {\n  \n}\n",
    samples: [
      { args: [2], expected: 2 },
      { args: [4], expected: 5 },
    ],
    more: [
      { args: [1], expected: 1 },
      { args: [10], expected: 89 },
      { args: [45], expected: 1836311903 },
    ],
    hints: [
      "How can you arrive at step n? Think about your last move.",
      "ways(n) depends on ways(n - 1) and ways(n - 2). Plain recursion is too slow for big n.",
      "Keep two running values and loop from 3 to n, like Fibonacci.",
    ],
  }),
  p({
    id: "find-in-sorted",
    title: "Find in Sorted",
    difficulty: "easy",
    topics: ["binary-search", "arrays"],
    fn: "findInSorted",
    statement:
      "Given a sorted array of distinct integers `nums` and a `target`, return the index of `target`, or `-1` if it isn't there. Aim for O(log n).",
    starter: "function findInSorted(nums, target) {\n  \n}\n",
    samples: [
      { args: [[1, 4, 7, 9, 12], 9], expected: 3 },
      { args: [[1, 4, 7], 5], expected: -1 },
    ],
    more: [
      { args: [[], 3], expected: -1 },
      { args: [[2], 2], expected: 0 },
      { args: [[-5, -1, 0, 3, 8, 13], -5], expected: 0 },
    ],
    hints: [
      "The array is sorted, so one comparison can rule out half of it.",
      "Look at the middle element and decide which half the target must be in.",
      "Keep lo and hi; while lo <= hi, mid = (lo + hi) >> 1; move lo or hi past mid.",
    ],
  }),
  p({
    id: "flatten-deep",
    title: "Flatten Deep",
    difficulty: "easy",
    topics: ["recursion", "arrays"],
    fn: "flattenDeep",
    statement:
      "Given an array that may contain nested arrays at any depth, return a flat array of all values in order. Don't use `Array.prototype.flat`.",
    starter: "function flattenDeep(arr) {\n  \n}\n",
    samples: [
      { args: [[1, [2, [3, [4]]], 5]], expected: [1, 2, 3, 4, 5] },
      { args: [[]], expected: [] },
    ],
    more: [
      { args: [[[["a"]], "b"]], expected: ["a", "b"] },
      { args: [[1, [], [2, []]]], expected: [1, 2] },
    ],
    hints: [
      "Some items are values, some are arrays that need the same treatment.",
      "Write a function that handles one array and calls itself for nested arrays.",
      "Loop over items: if Array.isArray(item), push ...flattenDeep(item); otherwise push item.",
    ],
  }),
  p({
    id: "best-streak",
    title: "Best Streak",
    difficulty: "medium",
    topics: ["dynamic-programming", "arrays"],
    fn: "bestStreak",
    statement:
      "Given a non-empty array of integers (daily profit or loss), return the largest sum of any run of consecutive days.",
    starter: "function bestStreak(nums) {\n  \n}\n",
    samples: [
      { args: [[-2, 3, -1, 4, -6, 2]], expected: 6 },
      { args: [[-3, -1, -2]], expected: -1 },
    ],
    more: [
      { args: [[5]], expected: 5 },
      { args: [[1, 2, 3, 4]], expected: 10 },
      { args: [[4, -10, 3, 3]], expected: 6 },
    ],
    hints: [
      "At each day, should the streak continue or start fresh?",
      "Track the best sum of a streak that ends today.",
      "current = max(nums[i], current + nums[i]); best = max(best, current). (Kadane's algorithm)",
    ],
  }),
  p({
    id: "merge-slots",
    title: "Merge Slots",
    difficulty: "medium",
    topics: ["sorting", "arrays"],
    fn: "mergeSlots",
    statement:
      "Given time slots as `[start, end]` pairs (in any order), merge all overlapping or touching slots and return them sorted by start.",
    starter: "function mergeSlots(slots) {\n  \n}\n",
    samples: [
      { args: [[[8, 10], [1, 3], [2, 6]]], expected: [[1, 6], [8, 10]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
    ],
    more: [
      { args: [[]], expected: [] },
      { args: [[[1, 10], [2, 3], [4, 5]]], expected: [[1, 10]] },
      { args: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]] },
    ],
    hints: [
      "Overlaps are easy to spot once slots are in order.",
      "Sort by start time, then walk through and grow the last merged slot when the next one overlaps.",
      "Sort by a[0]; if next.start <= last.end, set last.end = max(last.end, next.end), else push next.",
    ],
  }),
  p({
    id: "longest-fresh-run",
    title: "Longest Fresh Run",
    difficulty: "medium",
    topics: ["sliding-window", "strings", "hash-maps"],
    fn: "longestFreshRun",
    statement:
      "Return the length of the longest substring of `s` in which no character repeats.",
    starter: "function longestFreshRun(s) {\n  \n}\n",
    samples: [
      { args: ["devverse"], expected: 4 },
      { args: ["aaaa"], expected: 1 },
    ],
    more: [
      { args: [""], expected: 0 },
      { args: ["abcabcbb"], expected: 3 },
      { args: ["pwwkew"], expected: 3 },
    ],
    hints: [
      "Think of a window that only ever contains distinct characters.",
      "When a repeat appears, move the window's left edge just past the earlier copy.",
      "Store each char's last index in a Map; left = max(left, last + 1); answer = max(answer, i - left + 1).",
    ],
  }),
  p({
    id: "anagram-groups",
    title: "Anagram Groups",
    difficulty: "medium",
    topics: ["hash-maps", "strings", "sorting"],
    fn: "anagramGroups",
    statement:
      "Group the words that are anagrams of each other. Sort the words inside each group alphabetically, and sort the groups by their first word.",
    starter: "function anagramGroups(words) {\n  \n}\n",
    samples: [
      { args: [["listen", "code", "silent", "deco", "enlist"]], expected: [["code", "deco"], ["enlist", "listen", "silent"]] },
      { args: [["a"]], expected: [["a"]] },
    ],
    more: [
      { args: [[]], expected: [] },
      { args: [["ab", "ba", "c"]], expected: [["ab", "ba"], ["c"]] },
    ],
    hints: [
      "Anagrams have the same letters; find a key they all share.",
      "Sorting a word's letters gives the same key for all its anagrams.",
      "Map sortedLetters → words; then sort each group and sort the groups by group[0].",
    ],
  }),
  p({
    id: "fewest-coins",
    title: "Fewest Coins",
    difficulty: "hard",
    topics: ["dynamic-programming"],
    fn: "fewestCoins",
    statement:
      "Given coin values `coins` (unlimited of each) and an `amount`, return the fewest coins that add up to `amount`, or `-1` if it can't be made. `0 ≤ amount ≤ 10000`.",
    starter: "function fewestCoins(coins, amount) {\n  \n}\n",
    samples: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
    ],
    more: [
      { args: [[1], 0], expected: 0 },
      { args: [[3, 7, 405, 436], 8839], expected: 25 },
      { args: [[2, 5, 10, 1], 27], expected: 4 },
    ],
    hints: [
      "Greedy (biggest coin first) fails for some coin sets. Build up from smaller amounts.",
      "If you know the answer for every amount below x, how do you get the answer for x?",
      "dp[0] = 0; dp[x] = min over coins c <= x of dp[x - c] + 1; unreachable stays Infinity → return -1.",
    ],
  }),
];

export function getProblem(id: string): PracticeProblem | undefined {
  return PROBLEMS.find((q) => q.id === id);
}
