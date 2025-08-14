/**
 * This hook manages the navigation logic (next/previous) for the QuestionCard.
 * It determines the current question's position within a filtered list and provides handlers to move to the next or previous question.
 * It expects question IDs to be comparable as strings.
 */
export default function useQuestionNav({
  filteredQuestions, // The array of questions to navigate through.
  subject,           // The current subject, used for constructing the URL.
  qs,                // The query string, preserved during navigation.
  currentIndex,      // The ID of the currently displayed question.
  setCurrentIndex,   // State setter for the current question ID.
  navigate,          // The navigate function from react-router-dom.
  resetQuestionState,// A function to reset the state of the question card (e.g., selected answer).
  toggleTimer,       // A function to restart the timer for the new question.
}) {
  // Find the numerical index of the current question in the filtered array.
  // Using String() ensures consistent comparison, as IDs might be numbers or strings.
  const index = filteredQuestions.findIndex((q) => String(q.id) === String(currentIndex));

  // Determine if the current question is the first or last in the list.
  // This is used to disable the 'previous' or 'next' buttons in the UI.
  const isFirst = index === 0;
  const isLast = index === filteredQuestions.length - 1;

  // A centralized function to handle the logic of navigating to a new question.
  const goto = (nextIdx) => {
    const nextQ = filteredQuestions[nextIdx];
    if (!nextQ) return; // Guard against invalid indices.

    const nextId = String(nextQ.id);
    setCurrentIndex(nextId); // Update the state to reflect the new question ID.

    // Programmatically navigate to the new question's URL.
    // The filtered list is passed in the route state to avoid re-fetching on the next page.
    navigate(`/practice/${subject}/${nextId}?${qs}`, {
      state: { questions: filteredQuestions },
    });

    // Reset the state of the question card (e.g., clear selected options, hide answer).
    resetQuestionState?.();
    // Restart the timer for the new question.
    toggleTimer?.();
  };

  // Handler for the 'next' button. Navigates to the next question if not on the last one.
  const handleNext = () => {
    if (index < filteredQuestions.length - 1) goto(index + 1);
  };

  // Handler for the 'previous' button. Navigates to the previous question if not on the first one.
  const handlePrevious = () => {
    if (index > 0) goto(index - 1);
  };

  // Expose the navigation state and handlers to the component.
  return { isFirst, isLast, handleNext, handlePrevious };
}
