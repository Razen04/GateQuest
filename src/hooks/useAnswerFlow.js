// Encapsulates answer reveal and submission/recording logic for a question
import { submitAndRecordAnswer } from '../utils/answerHandler'

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
  const handleShowAnswer = async () => {
    // Prevent duplicate submissions
    if (!currentQuestion || showAnswer) return;

    resetTimer?.();
    setShowAnswer(true);

    const resultStatus = await submitAndRecordAnswer({
      currentQuestion,
      selectedOptionIndices,
      numericalAnswer,
      timeTaken,
      user,
      isLogin,
      updateStats,
    });

    setResult(resultStatus);
  };

  const handleSubmit = async () => {
    await handleShowAnswer();
  };

  return { handleShowAnswer, handleSubmit };
}
