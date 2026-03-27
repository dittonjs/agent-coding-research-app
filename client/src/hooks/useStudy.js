import { useContext } from "react";
import { StudyContext } from "../contexts/StudyContext";

export function useStudy() {
  return useContext(StudyContext);
}
