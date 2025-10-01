// Three implementations of sum_to_n in TypeScript
// Input: n - any integer
// Output: sum of integers from 1 to n (inclusive)
// Assumptions:
// - The result will fit within Number.MAX_SAFE_INTEGER as stated by the prompt.
// - For n <= 0, we define the summation to return 0 (no positive integers to sum).

/**
 * Iterative implementation using a simple loop.
 * Time: O(|n|) — linear in n (we treat negative or zero as immediate 0).
 * Space: O(1) — constant extra space.
 */
export function sum_to_n_a(n: number): number {
	if (!Number.isFinite(n)) throw new TypeError('n must be a finite number');
	// For non-positive n, return 0 (no positive integers to sum)
	if (n <= 0) return 0;
	// Work with floor in case a non-integer is passed (treat as integer part)
	const upto = Math.floor(n);
	let sum = 0;
	for (let i = 1; i <= upto; i++) {
		sum += i;
	}
	return sum;
}

/**
 * Recursive implementation. Not tail-recursive in JS/TS engines, so depth = n.
 * Time: O(n)
 * Space: O(n) — call stack grows with n.
 */
export function sum_to_n_b(n: number): number {
	if (!Number.isFinite(n)) throw new TypeError('n must be a finite number');
	if (n <= 0) return 0;
	const upto = Math.floor(n);

	function helper(k: number): number {
		if (k <= 0) return 0;
		if (k === 1) return 1;
		return k + helper(k - 1);
	}

	return helper(upto);
}

/**
 * Constant-time formula using arithmetic series: n * (n + 1) / 2.
 * Time: O(1)
 * Space: O(1)
 * Note: uses floor for non-integers and returns 0 for n <= 0.
 */
export function sum_to_n_c(n: number): number {
	if (!Number.isFinite(n)) throw new TypeError('n must be a finite number');
	if (n <= 0) return 0;
	const upto = Math.floor(n);
	// Use integer arithmetic but keep in JS number domain. Safe as long as result < MAX_SAFE_INTEGER.
	return (upto * (upto + 1)) / 2;
}

// Exported test helper so callers (or test runners) can run quick checks.
export function runBasicTests(): void {
	const tests: Array<[number, number]> = [
		[5, 15],
		[1, 1],
		[0, 0],
		[-3, 0],
		[10, 55],
	];

	for (const [input, expected] of tests) {
		const a = sum_to_n_a(input);
		const b = sum_to_n_b(input);
		const c = sum_to_n_c(input);
		console.assert(a === expected, `sum_to_n_a(${input}) === ${a}, expected ${expected}`);
		console.assert(b === expected, `sum_to_n_b(${input}) === ${b}, expected ${expected}`);
		console.assert(c === expected, `sum_to_n_c(${input}) === ${c}, expected ${expected}`);
	}
}

// Example: runBasicTests();

