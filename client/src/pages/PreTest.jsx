import SortingTest from "../components/SortingTest";
import { PRE_TEST_ARRAY } from "../utils/selectionSort";

export default function PreTest() {
  return (
    <SortingTest
      title="Pre-Test"
      description="Below is an array of numbers. Perform selection sort by filling in the state of the array after each swap."
      endpoint="/api/study/pre-test"
      initialArray={PRE_TEST_ARRAY}
      showIDontKnow
    />
  );
}
