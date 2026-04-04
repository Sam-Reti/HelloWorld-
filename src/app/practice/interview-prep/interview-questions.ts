import { InterviewQuestion } from './interview-prep.models';

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  // ─── Easy (~17) ───────────────────────────────────────────────────────────────
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

You may assume each input has **exactly one solution**, and you may not use the same element twice. Return the answer in any order.

### Examples

**Input:** \`nums = [2, 7, 11, 15]\`, \`target = 9\`
**Output:** \`[0, 1]\` (because \`2 + 7 = 9\`)

**Input:** \`nums = [3, 2, 4]\`, \`target = 6\`
**Output:** \`[1, 2]\`

**Input:** \`nums = [3, 3]\`, \`target = 6\`
**Output:** \`[0, 1]\``,
  },
  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'Easy',
    category: 'Strings',
    description: `## FizzBuzz

Given an integer \`n\`, return a list of strings from \`1\` to \`n\` where:
- For multiples of 3, use \`"Fizz"\` instead of the number
- For multiples of 5, use \`"Buzz"\` instead of the number
- For multiples of both 3 and 5, use \`"FizzBuzz"\`
- Otherwise, use the number as a string

### Examples

**Input:** \`n = 5\`
**Output:** \`["1", "2", "Fizz", "4", "Buzz"]\`

**Input:** \`n = 15\`
**Output:** \`["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]\``,
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    category: 'Strings',
    description: `## Reverse String

Write a function that reverses a string **in-place** (modify the input array of characters).

Do this with O(1) extra memory.

### Examples

**Input:** \`["h","e","l","l","o"]\`
**Output:** \`["o","l","l","e","h"]\`

**Input:** \`["H","a","n","n","a","h"]\`
**Output:** \`["h","a","n","n","a","H"]\``,
  },
  {
    id: 'palindrome-check',
    title: 'Palindrome Check',
    difficulty: 'Easy',
    category: 'Strings',
    description: `## Palindrome Check

Given a string \`s\`, return \`true\` if it is a palindrome after converting to lowercase and removing all non-alphanumeric characters.

### Examples

**Input:** \`"A man, a plan, a canal: Panama"\`
**Output:** \`true\`

**Input:** \`"race a car"\`
**Output:** \`false\`

**Input:** \`" "\`
**Output:** \`true\` (empty string is a palindrome)`,
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stacks & Queues',
    description: `## Valid Parentheses

Given a string \`s\` containing only \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\`, \`']'\`, determine if the input string is valid.

A string is valid if:
- Open brackets are closed by the same type of bracket
- Open brackets are closed in the correct order
- Every close bracket has a corresponding open bracket

### Examples

**Input:** \`"()"\`  **Output:** \`true\`

**Input:** \`"()[]{}"\`  **Output:** \`true\`

**Input:** \`"(]"\`  **Output:** \`false\`

**Input:** \`"([])"\`  **Output:** \`true\``,
  },
  {
    id: 'remove-duplicates-sorted',
    title: 'Remove Duplicates from Sorted Array',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Remove Duplicates from Sorted Array

Given a sorted integer array \`nums\`, remove duplicates **in-place** so each element appears only once. Return the number of unique elements \`k\`.

The first \`k\` elements of \`nums\` should hold the unique values in order.

### Examples

**Input:** \`nums = [1,1,2]\`
**Output:** \`k = 2\`, \`nums = [1,2,...]\`

**Input:** \`nums = [0,0,1,1,1,2,2,3,3,4]\`
**Output:** \`k = 5\`, \`nums = [0,1,2,3,4,...]\``,
  },
  {
    id: 'merge-sorted-arrays',
    title: 'Merge Two Sorted Arrays',
    difficulty: 'Easy',
    category: 'Sorting & Searching',
    description: `## Merge Two Sorted Arrays

Given two sorted integer arrays \`nums1\` (length \`m + n\`, with trailing zeros) and \`nums2\` (length \`n\`), merge \`nums2\` into \`nums1\` in-place so the result is sorted.

### Examples

**Input:** \`nums1 = [1,2,3,0,0,0]\`, \`m = 3\`, \`nums2 = [2,5,6]\`, \`n = 3\`
**Output:** \`[1,2,2,3,5,6]\`

**Input:** \`nums1 = [1]\`, \`m = 1\`, \`nums2 = []\`, \`n = 0\`
**Output:** \`[1]\``,
  },
  {
    id: 'maximum-subarray',
    title: 'Maximum Subarray',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Maximum Subarray (Kadane's Algorithm)

Given an integer array \`nums\`, find the subarray with the largest sum and return the sum.

A subarray is a contiguous part of the array.

### Examples

**Input:** \`[-2,1,-3,4,-1,2,1,-5,4]\`
**Output:** \`6\` (subarray \`[4,-1,2,1]\`)

**Input:** \`[1]\`
**Output:** \`1\`

**Input:** \`[5,4,-1,7,8]\`
**Output:** \`23\``,
  },
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Contains Duplicate

Given an integer array \`nums\`, return \`true\` if any value appears at least twice, and \`false\` if every element is distinct.

### Examples

**Input:** \`[1,2,3,1]\`  **Output:** \`true\`

**Input:** \`[1,2,3,4]\`  **Output:** \`false\`

**Input:** \`[1,1,1,3,3,4,3,2,4,2]\`  **Output:** \`true\``,
  },
  {
    id: 'best-time-buy-sell',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Best Time to Buy and Sell Stock

Given an array \`prices\` where \`prices[i]\` is the price on day \`i\`, find the maximum profit from one buy-sell transaction. If no profit is possible, return \`0\`.

### Examples

**Input:** \`[7,1,5,3,6,4]\`
**Output:** \`5\` (buy day 2, sell day 5: 6 - 1 = 5)

**Input:** \`[7,6,4,3,1]\`
**Output:** \`0\` (no profitable transaction)`,
  },
  {
    id: 'roman-to-integer',
    title: 'Roman to Integer',
    difficulty: 'Easy',
    category: 'Strings',
    description: `## Roman to Integer

Convert a Roman numeral string to an integer.

Symbol values: I=1, V=5, X=10, L=50, C=100, D=500, M=1000

Subtraction cases: IV=4, IX=9, XL=40, XC=90, CD=400, CM=900

### Examples

**Input:** \`"III"\`  **Output:** \`3\`

**Input:** \`"LVIII"\`  **Output:** \`58\`

**Input:** \`"MCMXCIV"\`  **Output:** \`1994\``,
  },
  {
    id: 'linked-list-cycle',
    title: 'Linked List Cycle Detection',
    difficulty: 'Easy',
    category: 'Linked Lists',
    description: `## Linked List Cycle Detection

Given the \`head\` of a linked list, determine if the list has a cycle.

A cycle exists if some node can be reached again by continuously following the \`next\` pointer.

Return \`true\` if there is a cycle, \`false\` otherwise. Try to solve it with O(1) memory.

### Examples

**Input:** \`head = [3,2,0,-4]\`, tail connects to index 1
**Output:** \`true\`

**Input:** \`head = [1,2]\`, tail connects to index 0
**Output:** \`true\`

**Input:** \`head = [1]\`, no cycle
**Output:** \`false\``,
  },
  {
    id: 'implement-stack',
    title: 'Implement Stack Using Array',
    difficulty: 'Easy',
    category: 'Stacks & Queues',
    description: `## Implement Stack Using Array

Implement a stack with the following operations:
- \`push(val)\` — push an element onto the stack
- \`pop()\` — remove and return the top element
- \`peek()\` — return the top element without removing
- \`isEmpty()\` — return whether the stack is empty

All operations should be O(1).

### Examples

\`\`\`
push(1), push(2), peek() → 2, pop() → 2, isEmpty() → false, pop() → 1, isEmpty() → true
\`\`\``,
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    category: 'Sorting & Searching',
    description: `## Binary Search

Given a sorted array of integers \`nums\` and a \`target\`, return the index of \`target\`. If not found, return \`-1\`.

Write an algorithm with O(log n) runtime.

### Examples

**Input:** \`nums = [-1,0,3,5,9,12]\`, \`target = 9\`
**Output:** \`4\`

**Input:** \`nums = [-1,0,3,5,9,12]\`, \`target = 2\`
**Output:** \`-1\``,
  },
  {
    id: 'count-vowels',
    title: 'Count Vowels in String',
    difficulty: 'Easy',
    category: 'Strings',
    description: `## Count Vowels in String

Given a string \`s\`, return the count of vowels (\`a, e, i, o, u\`, case-insensitive).

### Examples

**Input:** \`"Hello World"\`
**Output:** \`3\`

**Input:** \`"aEiOu"\`
**Output:** \`5\`

**Input:** \`"bcdfg"\`
**Output:** \`0\``,
  },
  {
    id: 'find-missing-number',
    title: 'Find Missing Number',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Find Missing Number

Given an array \`nums\` containing \`n\` distinct numbers from the range \`[0, n]\`, return the one number in the range that is missing.

### Examples

**Input:** \`[3,0,1]\`
**Output:** \`2\`

**Input:** \`[0,1]\`
**Output:** \`2\`

**Input:** \`[9,6,4,2,3,5,7,0,1]\`
**Output:** \`8\``,
  },
  {
    id: 'intersection-two-arrays',
    title: 'Intersection of Two Arrays',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    description: `## Intersection of Two Arrays

Given two integer arrays \`nums1\` and \`nums2\`, return an array of their intersection. Each element in the result must be unique. Order doesn't matter.

### Examples

**Input:** \`nums1 = [1,2,2,1]\`, \`nums2 = [2,2]\`
**Output:** \`[2]\`

**Input:** \`nums1 = [4,9,5]\`, \`nums2 = [9,4,9,8,4]\`
**Output:** \`[9,4]\``,
  },

  // ─── Medium (~17) ─────────────────────────────────────────────────────────────
  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `## Group Anagrams

Given an array of strings \`strs\`, group the anagrams together. Return the groups in any order.

An anagram is a word formed by rearranging the letters of another word using all original letters exactly once.

### Examples

**Input:** \`["eat","tea","tan","ate","nat","bat"]\`
**Output:** \`[["bat"],["nat","tan"],["ate","eat","tea"]]\`

**Input:** \`[""]\`
**Output:** \`[[""]]\`

**Input:** \`["a"]\`
**Output:** \`[["a"]]\``,
  },
  {
    id: 'three-sum',
    title: '3Sum',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `## 3Sum

Given an integer array \`nums\`, return all unique triplets \`[nums[i], nums[j], nums[k]]\` such that \`i != j != k\` and \`nums[i] + nums[j] + nums[k] == 0\`.

The solution set must not contain duplicate triplets.

### Examples

**Input:** \`[-1,0,1,2,-1,-4]\`
**Output:** \`[[-1,-1,2],[-1,0,1]]\`

**Input:** \`[0,1,1]\`
**Output:** \`[]\`

**Input:** \`[0,0,0]\`
**Output:** \`[[0,0,0]]\``,
  },
  {
    id: 'longest-substring-no-repeat',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Strings',
    description: `## Longest Substring Without Repeating Characters

Given a string \`s\`, find the length of the longest substring without repeating characters.

### Examples

**Input:** \`"abcabcbb"\`
**Output:** \`3\` (\`"abc"\`)

**Input:** \`"bbbbb"\`
**Output:** \`1\` (\`"b"\`)

**Input:** \`"pwwkew"\`
**Output:** \`3\` (\`"wke"\`)`,
  },
  {
    id: 'product-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `## Product of Array Except Self

Given an integer array \`nums\`, return an array \`answer\` where \`answer[i]\` equals the product of all elements of \`nums\` except \`nums[i]\`.

You must solve it in O(n) time **without using division**.

### Examples

**Input:** \`[1,2,3,4]\`
**Output:** \`[24,12,8,6]\`

**Input:** \`[-1,1,0,-3,3]\`
**Output:** \`[0,0,9,0,0]\``,
  },
  {
    id: 'valid-sudoku',
    title: 'Valid Sudoku',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `## Valid Sudoku

Determine if a 9x9 Sudoku board is valid. Only filled cells need to be validated according to these rules:
- Each row must contain digits 1-9 with no repetition
- Each column must contain digits 1-9 with no repetition
- Each 3x3 sub-box must contain digits 1-9 with no repetition

The board is partially filled; empty cells are represented by \`'.'\`.

### Examples

A board where rows, columns, and boxes have no duplicate digits → \`true\`

A board where the same digit appears twice in a row → \`false\``,
  },
  {
    id: 'spiral-matrix',
    title: 'Spiral Matrix',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `## Spiral Matrix

Given an \`m x n\` matrix, return all elements in spiral order.

### Examples

**Input:** \`[[1,2,3],[4,5,6],[7,8,9]]\`
**Output:** \`[1,2,3,6,9,8,7,4,5]\`

**Input:** \`[[1,2,3,4],[5,6,7,8],[9,10,11,12]]\`
**Output:** \`[1,2,3,4,8,12,11,10,9,5,6,7]\``,
  },
  {
    id: 'binary-tree-level-order',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    category: 'Trees',
    description: `## Binary Tree Level Order Traversal

Given the \`root\` of a binary tree, return the level order traversal of its nodes' values (i.e., from left to right, level by level).

### Examples

**Input:** \`root = [3,9,20,null,null,15,7]\`
**Output:** \`[[3],[9,20],[15,7]]\`

**Input:** \`root = [1]\`
**Output:** \`[[1]]\`

**Input:** \`root = []\`
**Output:** \`[]\``,
  },
  {
    id: 'validate-bst',
    title: 'Validate Binary Search Tree',
    difficulty: 'Medium',
    category: 'Trees',
    description: `## Validate Binary Search Tree

Given the \`root\` of a binary tree, determine if it is a valid BST.

A valid BST means:
- The left subtree only contains nodes with keys **less than** the node's key
- The right subtree only contains nodes with keys **greater than** the node's key
- Both left and right subtrees must also be valid BSTs

### Examples

**Input:** \`root = [2,1,3]\`  **Output:** \`true\`

**Input:** \`root = [5,1,4,null,null,3,6]\`  **Output:** \`false\` (4 is in the right subtree of 5 but is less than 5)`,
  },
  {
    id: 'kth-largest',
    title: 'Kth Largest Element',
    difficulty: 'Medium',
    category: 'Sorting & Searching',
    description: `## Kth Largest Element in an Array

Given an integer array \`nums\` and an integer \`k\`, return the \`k\`th largest element.

Note: it is the kth largest in sorted order, not the kth distinct element.

### Examples

**Input:** \`nums = [3,2,1,5,6,4]\`, \`k = 2\`
**Output:** \`5\`

**Input:** \`nums = [3,2,3,1,2,4,5,5,6]\`, \`k = 4\`
**Output:** \`4\``,
  },
  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    category: 'Sorting & Searching',
    description: `## Merge Intervals

Given an array of \`intervals\` where \`intervals[i] = [start, end]\`, merge all overlapping intervals and return the non-overlapping intervals that cover all the ranges.

### Examples

**Input:** \`[[1,3],[2,6],[8,10],[15,18]]\`
**Output:** \`[[1,6],[8,10],[15,18]]\`

**Input:** \`[[1,4],[4,5]]\`
**Output:** \`[[1,5]]\``,
  },
  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    description: `## Coin Change

Given an array of coin denominations \`coins\` and a total \`amount\`, return the fewest number of coins needed to make that amount. If it's impossible, return \`-1\`.

You have an infinite number of each coin.

### Examples

**Input:** \`coins = [1,5,10,25]\`, \`amount = 30\`
**Output:** \`2\` (25 + 5)

**Input:** \`coins = [2]\`, \`amount = 3\`
**Output:** \`-1\`

**Input:** \`coins = [1]\`, \`amount = 0\`
**Output:** \`0\``,
  },
  {
    id: 'longest-palindromic-substring',
    title: 'Longest Palindromic Substring',
    difficulty: 'Medium',
    category: 'Strings',
    description: `## Longest Palindromic Substring

Given a string \`s\`, return the longest palindromic substring.

### Examples

**Input:** \`"babad"\`
**Output:** \`"bab"\` (or \`"aba"\`)

**Input:** \`"cbbd"\`
**Output:** \`"bb"\`

**Input:** \`"a"\`
**Output:** \`"a"\``,
  },
  {
    id: 'min-stack',
    title: 'Min Stack',
    difficulty: 'Medium',
    category: 'Stacks & Queues',
    description: `## Min Stack

Design a stack that supports push, pop, top, and retrieving the minimum element, all in O(1) time.

Implement:
- \`push(val)\` — pushes val onto the stack
- \`pop()\` — removes the top element
- \`top()\` — gets the top element
- \`getMin()\` — retrieves the minimum element in the stack

### Examples

\`\`\`
push(-2), push(0), push(-3)
getMin() → -3
pop()
top() → 0
getMin() → -2
\`\`\``,
  },
  {
    id: 'top-k-frequent',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    category: 'Arrays & Hashing',
    description: `## Top K Frequent Elements

Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. The answer may be in any order.

### Examples

**Input:** \`nums = [1,1,1,2,2,3]\`, \`k = 2\`
**Output:** \`[1,2]\`

**Input:** \`nums = [1]\`, \`k = 1\`
**Output:** \`[1]\``,
  },
  {
    id: 'decode-ways',
    title: 'Decode Ways',
    difficulty: 'Medium',
    category: 'Dynamic Programming',
    description: `## Decode Ways

A message with letters A-Z can be encoded as numbers: \`'A' → "1"\`, \`'B' → "2"\`, ..., \`'Z' → "26"\`.

Given a string \`s\` containing only digits, return the number of ways to decode it. A digit or pair of digits may be decoded as a letter.

### Examples

**Input:** \`"12"\`
**Output:** \`2\` ("AB" or "L")

**Input:** \`"226"\`
**Output:** \`3\` ("BZ", "VF", "BBF")

**Input:** \`"06"\`
**Output:** \`0\` (leading zero is invalid)`,
  },
  {
    id: 'clone-graph',
    title: 'Clone Graph',
    difficulty: 'Medium',
    category: 'Graphs',
    description: `## Clone Graph

Given a reference to a node in a connected undirected graph, return a **deep copy** (clone) of the graph.

Each node has a value and a list of neighbors.

### Examples

**Input:** adjacency list \`[[2,4],[1,3],[2,4],[1,3]]\`
**Output:** A new graph with the same structure, where no node references the original.

**Input:** \`[[]]\` (single node, no neighbors)
**Output:** \`[[]]\``,
  },
  {
    id: 'search-rotated-sorted',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    category: 'Sorting & Searching',
    description: `## Search in Rotated Sorted Array

Given a sorted array that was rotated at some pivot and a \`target\` value, return the index of \`target\` or \`-1\` if not found.

You must achieve O(log n) runtime.

### Examples

**Input:** \`nums = [4,5,6,7,0,1,2]\`, \`target = 0\`
**Output:** \`4\`

**Input:** \`nums = [4,5,6,7,0,1,2]\`, \`target = 3\`
**Output:** \`-1\`

**Input:** \`nums = [1]\`, \`target = 0\`
**Output:** \`-1\``,
  },

  // ─── Hard (~16) ───────────────────────────────────────────────────────────────
  {
    id: 'median-two-sorted',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'Hard',
    category: 'Sorting & Searching',
    description: `## Median of Two Sorted Arrays

Given two sorted arrays \`nums1\` and \`nums2\`, return the median of the two sorted arrays.

The overall run time complexity should be O(log(m+n)).

### Examples

**Input:** \`nums1 = [1,3]\`, \`nums2 = [2]\`
**Output:** \`2.0\`

**Input:** \`nums1 = [1,2]\`, \`nums2 = [3,4]\`
**Output:** \`2.5\``,
  },
  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Arrays & Hashing',
    description: `## Trapping Rain Water

Given \`n\` non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining.

### Examples

**Input:** \`[0,1,0,2,1,0,1,3,2,1,2,1]\`
**Output:** \`6\`

**Input:** \`[4,2,0,3,2,5]\`
**Output:** \`9\``,
  },
  {
    id: 'word-break',
    title: 'Word Break',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    description: `## Word Break

Given a string \`s\` and a list of strings \`wordDict\`, return \`true\` if \`s\` can be segmented into a space-separated sequence of one or more dictionary words.

The same word may be reused multiple times.

### Examples

**Input:** \`s = "leetcode"\`, \`wordDict = ["leet","code"]\`
**Output:** \`true\`

**Input:** \`s = "applepenapple"\`, \`wordDict = ["apple","pen"]\`
**Output:** \`true\`

**Input:** \`s = "catsandog"\`, \`wordDict = ["cats","dog","sand","and","cat"]\`
**Output:** \`false\``,
  },
  {
    id: 'serialize-deserialize-tree',
    title: 'Serialize and Deserialize Binary Tree',
    difficulty: 'Hard',
    category: 'Trees',
    description: `## Serialize and Deserialize Binary Tree

Design an algorithm to serialize a binary tree to a string and deserialize it back to the original tree structure.

### Examples

**Input tree:** \`[1,2,3,null,null,4,5]\`
**Serialized:** Your string representation
**Deserialized:** Reconstructed tree matching the original

There is no restriction on how your serialization/deserialization algorithm should work — it just needs to roundtrip correctly.`,
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Hard',
    category: 'System Design Basics',
    description: `## LRU Cache

Design a Least Recently Used (LRU) cache with a given capacity.

Implement:
- \`get(key)\` — return the value if the key exists, otherwise \`-1\`
- \`put(key, value)\` — update or insert the value. If the cache exceeds capacity, evict the least recently used key.

Both operations must run in O(1) average time.

### Examples

\`\`\`
capacity = 2
put(1, 1), put(2, 2)
get(1) → 1
put(3, 3)       // evicts key 2
get(2) → -1     // not found
put(4, 4)       // evicts key 1
get(1) → -1
get(3) → 3
get(4) → 4
\`\`\``,
  },
  {
    id: 'merge-k-sorted-lists',
    title: 'Merge K Sorted Lists',
    difficulty: 'Hard',
    category: 'Linked Lists',
    description: `## Merge K Sorted Lists

Given an array of \`k\` linked lists, each sorted in ascending order, merge all into one sorted linked list and return it.

### Examples

**Input:** \`[[1,4,5],[1,3,4],[2,6]]\`
**Output:** \`[1,1,2,3,4,4,5,6]\`

**Input:** \`[]\`
**Output:** \`[]\`

**Input:** \`[[]]\`
**Output:** \`[]\``,
  },
  {
    id: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    category: 'Strings',
    description: `## Minimum Window Substring

Given strings \`s\` and \`t\`, return the minimum window substring of \`s\` that contains all characters of \`t\` (including duplicates). If no such window exists, return \`""\`.

### Examples

**Input:** \`s = "ADOBECODEBANC"\`, \`t = "ABC"\`
**Output:** \`"BANC"\`

**Input:** \`s = "a"\`, \`t = "a"\`
**Output:** \`"a"\`

**Input:** \`s = "a"\`, \`t = "aa"\`
**Output:** \`""\``,
  },
  {
    id: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'Hard',
    category: 'Graphs',
    description: `## Word Ladder

Given \`beginWord\`, \`endWord\`, and a \`wordList\`, find the length of the shortest transformation sequence from \`beginWord\` to \`endWord\`, where each step changes exactly one letter and each intermediate word must be in \`wordList\`.

Return \`0\` if no transformation is possible.

### Examples

**Input:** \`beginWord = "hit"\`, \`endWord = "cog"\`, \`wordList = ["hot","dot","dog","lot","log","cog"]\`
**Output:** \`5\` (hit → hot → dot → dog → cog)

**Input:** \`beginWord = "hit"\`, \`endWord = "cog"\`, \`wordList = ["hot","dot","dog","lot","log"]\`
**Output:** \`0\``,
  },
  {
    id: 'course-schedule',
    title: 'Course Schedule',
    difficulty: 'Hard',
    category: 'Graphs',
    description: `## Course Schedule (Topological Sort)

There are \`numCourses\` courses labeled \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [a, b]\` means you must take course \`b\` before course \`a\`.

Return \`true\` if you can finish all courses, \`false\` if there is a circular dependency.

### Examples

**Input:** \`numCourses = 2\`, \`prerequisites = [[1,0]]\`
**Output:** \`true\`

**Input:** \`numCourses = 2\`, \`prerequisites = [[1,0],[0,1]]\`
**Output:** \`false\``,
  },
  {
    id: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    description: `## Longest Increasing Subsequence

Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence.

### Examples

**Input:** \`[10,9,2,5,3,7,101,18]\`
**Output:** \`4\` (e.g. \`[2,3,7,101]\`)

**Input:** \`[0,1,0,3,2,3]\`
**Output:** \`4\`

**Input:** \`[7,7,7,7,7,7,7]\`
**Output:** \`1\``,
  },
  {
    id: 'alien-dictionary',
    title: 'Alien Dictionary',
    difficulty: 'Hard',
    category: 'Graphs',
    description: `## Alien Dictionary

Given a sorted list of words in an alien language, derive the order of characters in the alphabet. If the order is invalid, return \`""\`. If multiple valid orders exist, return any one.

### Examples

**Input:** \`["wrt","wrf","er","ett","rftt"]\`
**Output:** \`"wertf"\`

**Input:** \`["z","x"]\`
**Output:** \`"zx"\`

**Input:** \`["z","x","z"]\`
**Output:** \`""\` (invalid)`,
  },
  {
    id: 'regex-matching',
    title: 'Regular Expression Matching',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    description: `## Regular Expression Matching

Implement regular expression matching with support for \`'.'\` (matches any single character) and \`'*'\` (matches zero or more of the preceding element).

The matching should cover the **entire** input string.

### Examples

**Input:** \`s = "aa"\`, \`p = "a"\`
**Output:** \`false\`

**Input:** \`s = "aa"\`, \`p = "a*"\`
**Output:** \`true\`

**Input:** \`s = "ab"\`, \`p = ".*"\`
**Output:** \`true\``,
  },
  {
    id: 'max-path-sum-tree',
    title: 'Max Path Sum in Binary Tree',
    difficulty: 'Hard',
    category: 'Trees',
    description: `## Binary Tree Maximum Path Sum

Given the \`root\` of a binary tree, return the maximum path sum of any non-empty path.

A path can start and end at any node in the tree and goes along parent-child connections. Each node can only appear once in the path.

### Examples

**Input:** \`root = [1,2,3]\`
**Output:** \`6\` (path: 2 → 1 → 3)

**Input:** \`root = [-10,9,20,null,null,15,7]\`
**Output:** \`42\` (path: 15 → 20 → 7)`,
  },
  {
    id: 'sliding-window-max',
    title: 'Sliding Window Maximum',
    difficulty: 'Hard',
    category: 'Stacks & Queues',
    description: `## Sliding Window Maximum

Given an array \`nums\` and a sliding window of size \`k\`, return the max value in each window position as the window slides from left to right.

### Examples

**Input:** \`nums = [1,3,-1,-3,5,3,6,7]\`, \`k = 3\`
**Output:** \`[3,3,5,5,6,7]\`

**Input:** \`nums = [1]\`, \`k = 1\`
**Output:** \`[1]\``,
  },
  {
    id: 'edit-distance',
    title: 'Edit Distance',
    difficulty: 'Hard',
    category: 'Dynamic Programming',
    description: `## Edit Distance

Given two strings \`word1\` and \`word2\`, return the minimum number of operations to convert \`word1\` to \`word2\`.

Allowed operations: insert, delete, or replace a character.

### Examples

**Input:** \`word1 = "horse"\`, \`word2 = "ros"\`
**Output:** \`3\` (horse → rorse → rose → ros)

**Input:** \`word1 = "intention"\`, \`word2 = "execution"\`
**Output:** \`5\``,
  },
  {
    id: 'n-queens',
    title: 'N-Queens',
    difficulty: 'Hard',
    category: 'Recursion',
    description: `## N-Queens

Place \`n\` queens on an \`n x n\` chessboard such that no two queens attack each other (no shared row, column, or diagonal).

Return all distinct solutions. Each solution is a board configuration represented as an array of strings, where \`'Q'\` is a queen and \`'.'\` is empty.

### Examples

**Input:** \`n = 4\`
**Output:**
\`\`\`
[[".Q..","...Q","Q...","..Q."],
 ["..Q.","Q...","...Q",".Q.."]]
\`\`\`

**Input:** \`n = 1\`
**Output:** \`[["Q"]]\``,
  },
];
