import SortingTest from "../components/SortingTest";
import { POST_TEST_ARRAY } from "../utils/selectionSort";

export default function PostTest() {
  return (
    <SortingTest
      title="Post-Test"
      description="Below is an array of numbers. Perform selection sort by filling in the state of the array after each swap."
      endpoint="/api/study/post-test"
      initialArray={POST_TEST_ARRAY}
    />
  );
}
