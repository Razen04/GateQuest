/**
 * Navigation hook for QuestionCard: computes first/last and handles next/prev.
 * Expects IDs to be comparable via String().
 */
export default function useQuestionNav({
  filteredQuestions,
  subject,
  qs,
  currentIndex,
  setCurrentIndex,
  navigate,
  resetQuestionState,
  toggleTimer,
}) {
  const index = filteredQuestions.findIndex((q) => String(q.id) === String(currentIndex));
  const isFirst = index === 0;
  const isLast = index === filteredQuestions.length - 1;

  const goto = (nextIdx) => {
    const nextQ = filteredQuestions[nextIdx];
    if (!nextQ) return;
    const nextId = String(nextQ.id);
    setCurrentIndex(nextId);
    navigate(`/practice/${subject}/${nextId}?${qs}`, {
      state: { questions: filteredQuestions },
    });
    resetQuestionState?.();
    toggleTimer?.();
  };

  const handleNext = () => {
    if (index < filteredQuestions.length - 1) goto(index + 1);
  };

  const handlePrevious = () => {
    if (index > 0) goto(index - 1);
  };

  return { isFirst, isLast, handleNext, handlePrevious };
}
