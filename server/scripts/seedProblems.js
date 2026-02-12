/**
 * Seed Problems from Codeforces
 * 
 * This script inserts curated competitive programming problems
 * into the JudgeX MongoDB database with proper testcases.
 * 
 * Usage: node scripts/seedProblems.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Problem model
import Problem from '../src/models/problem.js';

const DB_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/FloatPoint';

// Curated competitive programming problems with testcases
const PROBLEMS = [
  {
    id: 'aplusb',
    name: 'A + B',
    tags: ['implementation', 'math'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## A + B Problem\n\n### Description\nGiven two integers **a** and **b**, calculate their sum.\n\n### Input\nA single line containing two space-separated integers **a** and **b** (0 \u2264 a, b \u2264 10\u2079).\n\n### Output\nPrint the sum of **a** and **b**.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 1 2   | 3      |\n| 100 200 | 300  |`,
    testcase: [
      { stdin: '1 2', stdout: '3' },
      { stdin: '0 0', stdout: '0' },
      { stdin: '100 200', stdout: '300' },
      { stdin: '1000000000 1000000000', stdout: '2000000000' },
      { stdin: '999999999 1', stdout: '1000000000' },
      { stdin: '123456789 987654321', stdout: '1111111110' },
    ],
  },
  {
    id: 'watermelon',
    name: 'Watermelon',
    tags: ['math', 'brute force'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Watermelon\n\n### Description\nPete and Billy have a watermelon weighing **w** kilograms. They want to divide it into two parts, each weighing an **even** number of kilograms.\n\nDetermine if this is possible.\n\n### Input\nA single integer **w** (1 \u2264 w \u2264 100) \u2014 the weight of the watermelon.\n\n### Output\nPrint \`YES\` if the watermelon can be divided into two even parts, or \`NO\` otherwise.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 8     | YES    |\n| 3     | NO     |`,
    testcase: [
      { stdin: '8', stdout: 'YES' },
      { stdin: '3', stdout: 'NO' },
      { stdin: '1', stdout: 'NO' },
      { stdin: '2', stdout: 'NO' },
      { stdin: '4', stdout: 'YES' },
      { stdin: '5', stdout: 'NO' },
      { stdin: '6', stdout: 'YES' },
      { stdin: '100', stdout: 'YES' },
      { stdin: '99', stdout: 'NO' },
      { stdin: '10', stdout: 'YES' },
    ],
  },
  {
    id: 'way-too-long',
    name: 'Way Too Long Words',
    tags: ['strings', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Way Too Long Words\n\n### Description\nSometimes some words are too long. In such cases, abbreviate:\n- Keep the first letter\n- Replace middle letters with the count\n- Keep the last letter\n\nIf a word has **10 or fewer** characters, don\u2019t abbreviate.\n\n### Input\nThe first line contains **n** (1 \u2264 n \u2264 100).\nEach of the next **n** lines contains a word (lowercase, length 1\u2013100).\n\n### Output\nFor each word, print the abbreviated form or the word itself.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 4     |        |\n| word  | word   |\n| localization | l10n |\n| internationalization | i18n |\n| pneumonoultramicroscopicsilicovolcanoconiosis | p43s |`,
    testcase: [
      { stdin: '4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis', stdout: 'word\nl10n\ni18n\np43s' },
      { stdin: '1\nabcdefghij', stdout: 'abcdefghij' },
      { stdin: '1\nabcdefghijk', stdout: 'a9k' },
      { stdin: '2\na\nab', stdout: 'a\nab' },
      { stdin: '1\nabcdefgh', stdout: 'abcdefgh' },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    tags: ['brute force', 'greedy'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Team\n\n### Description\nThree friends solve problems together. They solve a problem if **at least two** are sure about it.\n\n### Input\nFirst line: **n** (1 \u2264 n \u2264 1000).\nNext **n** lines: three integers (0 or 1), where 1 means that friend is sure.\n\n### Output\nPrint how many problems the team will solve.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 3     |        |\n| 1 1 0 |        |\n| 1 1 1 |        |\n| 1 0 0 | 2      |`,
    testcase: [
      { stdin: '3\n1 1 0\n1 1 1\n1 0 0', stdout: '2' },
      { stdin: '1\n0 0 0', stdout: '0' },
      { stdin: '1\n1 1 1', stdout: '1' },
      { stdin: '2\n1 0 0\n0 1 0', stdout: '0' },
      { stdin: '4\n1 1 0\n0 1 1\n1 0 1\n0 0 0', stdout: '3' },
    ],
  },
  {
    id: 'next-round',
    name: 'Next Round',
    tags: ['implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 3,
    memoryLimit: 256,
    task: `## Next Round\n\n### Description\nA participant advances if their score is **strictly positive** and **>= k-th place** score.\n\n### Input\nFirst line: **n** and **k** (1 \u2264 k \u2264 n \u2264 50).\nSecond line: **n** scores in non-increasing order (0\u2013100).\n\n### Output\nPrint the number of advancing participants.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 8 5   |        |\n| 10 9 8 7 7 7 5 5 | 6 |`,
    testcase: [
      { stdin: '8 5\n10 9 8 7 7 7 5 5', stdout: '6' },
      { stdin: '4 2\n0 0 0 0', stdout: '0' },
      { stdin: '5 3\n5 4 3 2 1', stdout: '3' },
      { stdin: '3 1\n10 10 10', stdout: '3' },
      { stdin: '1 1\n100', stdout: '1' },
    ],
  },
  {
    id: 'domino-piling',
    name: 'Domino Piling',
    tags: ['math', 'greedy'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Domino Piling\n\n### Description\nFind the maximum number of 2\u00d71 dominoes that fit on an M \u00d7 N board.\n\n### Input\nTwo integers **M** and **N** (1 \u2264 M, N \u2264 16).\n\n### Output\nPrint the maximum number of dominoes.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 2 4   | 4      |\n| 3 3   | 4      |`,
    testcase: [
      { stdin: '2 4', stdout: '4' },
      { stdin: '3 3', stdout: '4' },
      { stdin: '1 1', stdout: '0' },
      { stdin: '1 2', stdout: '1' },
      { stdin: '2 2', stdout: '2' },
      { stdin: '16 16', stdout: '128' },
      { stdin: '1 16', stdout: '8' },
      { stdin: '3 4', stdout: '6' },
    ],
  },
  {
    id: 'bit-plus-plus',
    name: 'Bit++',
    tags: ['implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Bit++\n\n### Description\nVariable **x** starts at 0. Operations: ++X / X++ (add 1), --X / X-- (subtract 1). Find final value.\n\n### Input\nFirst line: **n** (1 \u2264 n \u2264 150).\nNext **n** lines: one operation each.\n\n### Output\nPrint the final value of x.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 1     |        |\n| ++X   | 1      |`,
    testcase: [
      { stdin: '1\n++X', stdout: '1' },
      { stdin: '2\nX++\n--X', stdout: '0' },
      { stdin: '3\n++X\n++X\n++X', stdout: '3' },
      { stdin: '4\nX++\nX++\nX--\nX--', stdout: '0' },
      { stdin: '3\n--X\n--X\n--X', stdout: '-3' },
    ],
  },
  {
    id: 'string-task',
    name: 'String Task',
    tags: ['strings', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## String Task\n\n### Description\n1. Delete all vowels (A,O,Y,E,U,I)\n2. Insert '.' before each remaining letter\n3. Convert to lowercase\n\n### Input\nA string **s** (1 \u2264 |s| \u2264 100).\n\n### Output\nPrint the modified string.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| tour  | .t.r   |\n| Codeforces | .c.d.f.r.c.s |`,
    testcase: [
      { stdin: 'tour', stdout: '.t.r' },
      { stdin: 'Codeforces', stdout: '.c.d.f.r.c.s' },
      { stdin: 'aBAcAba', stdout: '.b.c.b' },
      { stdin: 'HELLO', stdout: '.h.l.l' },
      { stdin: 'bcdf', stdout: '.b.c.d.f' },
      { stdin: 'xyz', stdout: '.x.y.z' },
    ],
  },
  {
    id: 'theatre-square',
    name: 'Theatre Square',
    tags: ['math'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Theatre Square\n\n### Description\nPave an n \u00d7 m metre square with a \u00d7 a flagstones. Find the minimum number of flagstones.\n\n### Input\nThree integers **n**, **m**, **a** (1 \u2264 n, m, a \u2264 10\u2079).\n\n### Output\nPrint the number of flagstones needed.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 6 6 4 | 4     |`,
    testcase: [
      { stdin: '6 6 4', stdout: '4' },
      { stdin: '1 1 1', stdout: '1' },
      { stdin: '2 1 1', stdout: '2' },
      { stdin: '1000000000 1000000000 1', stdout: '1000000000000000000' },
      { stdin: '12 13 4', stdout: '12' },
      { stdin: '1 2 3', stdout: '1' },
    ],
  },
  {
    id: 'petya-strings',
    name: 'Petya and Strings',
    tags: ['strings', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Petya and Strings\n\n### Description\nCompare two strings lexicographically (case-insensitive).\n\n### Input\nTwo lines, each a string of equal length (1\u2013100), lowercase only.\n\n### Output\n-1 if first < second, 1 if first > second, 0 if equal.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| aaaa  |        |\n| aaab  | -1     |`,
    testcase: [
      { stdin: 'aaaa\naaab', stdout: '-1' },
      { stdin: 'abs\nabs', stdout: '0' },
      { stdin: 'bbb\naaa', stdout: '1' },
      { stdin: 'a\nb', stdout: '-1' },
      { stdin: 'z\na', stdout: '1' },
      { stdin: 'hello\nhello', stdout: '0' },
    ],
  },
  {
    id: 'factorial',
    name: 'Factorial',
    tags: ['math', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Factorial\n\n### Description\nGiven **n**, calculate n! (0! = 1).\n\n### Input\nA single integer **n** (0 \u2264 n \u2264 12).\n\n### Output\nPrint n!.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 5     | 120    |\n| 0     | 1      |`,
    testcase: [
      { stdin: '5', stdout: '120' },
      { stdin: '0', stdout: '1' },
      { stdin: '1', stdout: '1' },
      { stdin: '3', stdout: '6' },
      { stdin: '10', stdout: '3628800' },
      { stdin: '12', stdout: '479001600' },
    ],
  },
  {
    id: 'young-physicist',
    name: 'Young Physicist',
    tags: ['implementation', 'math'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Young Physicist\n\n### Description\nCheck if n force vectors sum to zero (equilibrium).\n\n### Input\nFirst line: **n** (1 \u2264 n \u2264 100).\nNext **n** lines: **x y z** (-100 \u2264 x,y,z \u2264 100).\n\n### Output\nPrint YES if in equilibrium, NO otherwise.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 3     |        |\n| 3 -1 1 |       |\n| -5 2 -1 |      |\n| 2 -1 0 | YES   |`,
    testcase: [
      { stdin: '3\n1 2 3\n3 2 1\n0 0 0', stdout: 'NO' },
      { stdin: '3\n3 -1 1\n-5 2 -1\n2 -1 0', stdout: 'YES' },
      { stdin: '1\n0 0 0', stdout: 'YES' },
      { stdin: '2\n5 10 15\n-5 -10 -15', stdout: 'YES' },
      { stdin: '2\n1 0 0\n0 1 0', stdout: 'NO' },
    ],
  },
  {
    id: 'stones-on-table',
    name: 'Stones on the Table',
    tags: ['implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Stones on the Table\n\n### Description\nRemove minimum stones so no two adjacent stones have the same color.\n\n### Input\nFirst line: **n** (1 \u2264 n \u2264 50).\nSecond line: string of n characters (R, G, or B).\n\n### Output\nPrint the minimum removals.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 3     |        |\n| RRG   | 1      |`,
    testcase: [
      { stdin: '3\nRRG', stdout: '1' },
      { stdin: '5\nRRRRR', stdout: '4' },
      { stdin: '4\nBRBG', stdout: '0' },
      { stdin: '1\nR', stdout: '0' },
      { stdin: '2\nRR', stdout: '1' },
      { stdin: '6\nRGBRGB', stdout: '0' },
    ],
  },
  {
    id: 'two-sum',
    name: 'Two Sum',
    tags: ['implementation', 'data structures'],
    difficulty: 'medium',
    point: 200,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Two Sum\n\n### Description\nFind two numbers in an array that add up to a target. Print their 1-based indices.\n\n### Input\nFirst line: **n** and **t**.\nSecond line: **n** integers.\n\n### Output\nPrint two indices **i j** (i < j) such that a[i] + a[j] = t.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 4 9   |        |\n| 2 7 11 15 | 1 2 |`,
    testcase: [
      { stdin: '4 9\n2 7 11 15', stdout: '1 2' },
      { stdin: '3 6\n3 2 4', stdout: '2 3' },
      { stdin: '2 6\n3 3', stdout: '1 2' },
      { stdin: '5 0\n-1 -2 3 -4 1', stdout: '1 5' },
    ],
  },
  {
    id: 'max-subarray',
    name: 'Maximum Subarray Sum',
    tags: ['dp', 'greedy'],
    difficulty: 'medium',
    point: 200,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Maximum Subarray Sum\n\n### Description\nFind the contiguous subarray with the largest sum.\n\n### Input\nFirst line: **n** (1 \u2264 n \u2264 10\u2075).\nSecond line: **n** integers.\n\n### Output\nPrint the maximum subarray sum.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 9     |        |\n| -2 1 -3 4 -1 2 1 -5 4 | 6 |`,
    testcase: [
      { stdin: '9\n-2 1 -3 4 -1 2 1 -5 4', stdout: '6' },
      { stdin: '1\n1', stdout: '1' },
      { stdin: '5\n5 4 -1 7 8', stdout: '23' },
      { stdin: '3\n-1 -2 -3', stdout: '-1' },
      { stdin: '4\n1 2 3 4', stdout: '10' },
    ],
  },
  {
    id: 'palindrome-check',
    name: 'Palindrome Check',
    tags: ['strings', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Palindrome Check\n\n### Description\nCheck if a string is a palindrome.\n\n### Input\nA string **s** (1 \u2264 |s| \u2264 100, lowercase).\n\n### Output\nPrint YES or NO.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| abba  | YES    |\n| hello | NO     |`,
    testcase: [
      { stdin: 'abba', stdout: 'YES' },
      { stdin: 'hello', stdout: 'NO' },
      { stdin: 'a', stdout: 'YES' },
      { stdin: 'racecar', stdout: 'YES' },
      { stdin: 'ab', stdout: 'NO' },
      { stdin: 'abcba', stdout: 'YES' },
      { stdin: 'aaa', stdout: 'YES' },
      { stdin: 'abcd', stdout: 'NO' },
    ],
  },
  {
    id: 'fibonacci',
    name: 'Fibonacci Number',
    tags: ['math', 'dp'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Fibonacci Number\n\n### Description\nF(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). Find F(n).\n\n### Input\nA single integer **n** (0 \u2264 n \u2264 45).\n\n### Output\nPrint the n-th Fibonacci number.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 5     | 5      |\n| 10    | 55     |`,
    testcase: [
      { stdin: '0', stdout: '0' },
      { stdin: '1', stdout: '1' },
      { stdin: '5', stdout: '5' },
      { stdin: '10', stdout: '55' },
      { stdin: '20', stdout: '6765' },
      { stdin: '45', stdout: '1134903170' },
    ],
  },
  {
    id: 'gcd',
    name: 'Greatest Common Divisor',
    tags: ['math', 'number theory'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Greatest Common Divisor\n\n### Description\nFind the GCD of two integers.\n\n### Input\nTwo integers **a** and **b** (1 \u2264 a, b \u2264 10\u2079).\n\n### Output\nPrint the GCD.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 12 8  | 4      |\n| 7 13  | 1      |`,
    testcase: [
      { stdin: '12 8', stdout: '4' },
      { stdin: '7 13', stdout: '1' },
      { stdin: '100 100', stdout: '100' },
      { stdin: '1000000000 500000000', stdout: '500000000' },
      { stdin: '6 4', stdout: '2' },
      { stdin: '17 1', stdout: '1' },
    ],
  },
  {
    id: 'reverse-string',
    name: 'Reverse String',
    tags: ['strings', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 1,
    memoryLimit: 256,
    task: `## Reverse String\n\n### Description\nReverse a given string.\n\n### Input\nA string **s** (1 \u2264 |s| \u2264 100, lowercase).\n\n### Output\nPrint the reversed string.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| hello | olleh  |\n| abc   | cba    |`,
    testcase: [
      { stdin: 'hello', stdout: 'olleh' },
      { stdin: 'abc', stdout: 'cba' },
      { stdin: 'a', stdout: 'a' },
      { stdin: 'abba', stdout: 'abba' },
      { stdin: 'racecar', stdout: 'racecar' },
      { stdin: 'programming', stdout: 'gnimmargorp' },
    ],
  },
  {
    id: 'sort-array',
    name: 'Sort Array',
    tags: ['sortings', 'implementation'],
    difficulty: 'easy',
    point: 100,
    timeLimit: 2,
    memoryLimit: 256,
    task: `## Sort Array\n\n### Description\nSort an array in non-decreasing order.\n\n### Input\nFirst line: **n** (1 \u2264 n \u2264 10\u2075).\nSecond line: **n** integers.\n\n### Output\nPrint the sorted array, space-separated.\n\n### Examples\n| Input | Output |\n|-------|--------|\n| 5     |        |\n| 5 3 1 4 2 | 1 2 3 4 5 |`,
    testcase: [
      { stdin: '5\n5 3 1 4 2', stdout: '1 2 3 4 5' },
      { stdin: '1\n42', stdout: '42' },
      { stdin: '3\n-1 -3 -2', stdout: '-3 -2 -1' },
      { stdin: '4\n1 1 1 1', stdout: '1 1 1 1' },
      { stdin: '6\n10 -5 3 0 8 -2', stdout: '-5 -2 0 3 8 10' },
    ],
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(DB_URL);
    console.log('Connected to MongoDB');

    let inserted = 0;
    let skipped = 0;

    for (const prob of PROBLEMS) {
      const existing = await Problem.findOne({ id: prob.id });
      if (existing) {
        console.log(`  Skipping "${prob.name}" (id: ${prob.id}) - already exists`);
        skipped++;
        continue;
      }

      await Problem.create({
        ...prob,
        public: true,
        noOfSubm: 0,
        noOfSuccess: 0,
      });

      console.log(`  Inserted "${prob.name}" (id: ${prob.id}, ${prob.difficulty}, ${prob.testcase.length} testcases)`);
      inserted++;
    }

    console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}, Total in DB: ${await Problem.countDocuments()}`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
