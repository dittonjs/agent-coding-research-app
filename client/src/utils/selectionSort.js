// Hard-coded test arrays
export const PRE_TEST_ARRAY = [38, 12, 45, 7, 29, 53, 16, 42];
export const POST_TEST_ARRAY = [33, 15, 46, 12, 28, 44, 37, 19];

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
