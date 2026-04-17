import SortingTest from "../components/SortingTest";
import { PRE_TEST_ARRAYS } from "../utils/selectionSort";

export default function PreTest() {
  return (
    <SortingTest
      title="Pre-Test"
      description="For each array below, perform selection sort by selecting two numbers at a time to swap them."
      endpoint="/api/study/pre-test"
      initialArrays={PRE_TEST_ARRAYS}
      showIDontKnow
    />
  );
}
