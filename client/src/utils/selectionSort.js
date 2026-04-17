// Each test is multiple short sorting questions (values 1-5, length 5).
// Every array below requires >=3 swaps under selection sort.
export const PRE_TEST_ARRAYS = [
  [3, 1, 4, 2, 5],
  [5, 1, 2, 3, 4],
  [2, 3, 4, 5, 1],
  [2, 4, 1, 5, 3],
  [3, 4, 5, 1, 2],
];

export const POST_TEST_ARRAYS = [
  [4, 1, 5, 2, 3],
  [4, 5, 1, 3, 2],
  [5, 3, 4, 1, 2],
  [2, 5, 1, 4, 3],
  [3, 5, 4, 1, 2],
];

/**
 * Compute the array state after each swap in selection sort.
 * Returns an array of snapshots — one per swap that actually changes the array.
 * Each snapshot is the full array state after that swap.
 */
export function selectionSortSteps(initialArray) {
  const arr = [...initialArray];
  const steps = [];

  for (let i = 0; i < arr.length - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
      steps.push([...arr]);
    }
  }

  return steps;
}

/**
 * Check a student's answer for a given step.
 * Returns true if every element matches the expected state.
 */
export function checkStep(expected, answer) {
  if (expected.length !== answer.length) return false;
  return expected.every((val, i) => val === answer[i]);
}
