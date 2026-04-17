import SortingTest from "../components/SortingTest";
import { POST_TEST_ARRAYS } from "../utils/selectionSort";

export default function PostTest() {
  return (
    <SortingTest
      title="Post-Test"
      description="For each array below, perform selection sort by selecting two numbers at a time to swap them."
      endpoint="/api/study/post-test"
      initialArrays={POST_TEST_ARRAYS}
    />
  );
}
