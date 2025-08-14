// This custom hook encapsulates the logic for handling the entire answer submission process, from revealing the correct answer to recording the user's attempt.

import { submitAndRecordAnswer } from '../utils/answerHandler'

// Manages the state and actions for a single question's answer lifecycle.
export default function useAnswerFlow({
  currentQuestion,
  selectedOptionIndices,
  numericalAnswer,
  timeTaken,
  user,
  isLogin,
  updateStats,
  setShowAnswer,
  setResult,
  resetTimer,
  showAnswer,
}) {
  // This function is triggered when the user wants to see the correct answer.
  // It orchestrates stopping the timer, showing the result, and recording the attempt.
  const handleShowAnswer = async () => {
    // A guard to prevent any action if there's no question or if the answer is already shown.
    // This avoids accidental duplicate submissions.
    if (!currentQuestion || showAnswer) return;

    // Stop the timer as soon as the answer is requested.
    resetTimer?.();
    // Set the state to reveal the answer UI.
    setShowAnswer(true);

    // Call the main utility function to check the answer and record the attempt.
    const resultStatus = await submitAndRecordAnswer({
      currentQuestion,
      selectedOptionIndices,
      numericalAnswer,
      timeTaken,
      user,
      isLogin,
      updateStats,
    });

    // Update the UI with the result (e.g., 'Correct' or 'Incorrect').
    setResult(resultStatus);
  };

  // The handleSubmit function is an alias for handleShowAnswer.
  // This provides a more semantic name for form submission events.
  const handleSubmit = async () => {
    await handleShowAnswer();
  };

  // Expose the handler functions to the component using this hook.
  return { handleShowAnswer, handleSubmit };
}
