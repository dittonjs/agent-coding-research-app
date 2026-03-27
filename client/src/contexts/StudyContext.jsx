import { createContext, useState, useEffect } from "react";

export const StudyContext = createContext();

export function StudyProvider({ children }) {
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/study/progress")
      .then((res) => res.json())
      .then((data) => {
        setParticipant(data.participant);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const value = {
    participant,
    setParticipant,
    loading,
  };

  return (
    <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
  );
}
