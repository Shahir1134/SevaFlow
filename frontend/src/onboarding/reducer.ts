import type { OnboardingAction, OnboardingState, QuestionId } from './types'
import { QUESTIONS, INITIAL_QUESTION_ID } from './questions'

export const initialOnboardingState: OnboardingState = {
  currentQuestion: INITIAL_QUESTION_ID,
  answers: {},
  history: [],
  isComplete: false,
}

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'ANSWER': {
      const updatedAnswers = {
        ...state.answers,
        ...(action.extraAnswers ?? {}),
        [action.questionId]: action.value,
      }

      const questionDef = QUESTIONS[action.questionId]
      const nextQ = questionDef.nextQuestion(updatedAnswers)

      if (nextQ === null) {
        return {
          ...state,
          answers: updatedAnswers,
          isComplete: true,
        }
      }

      return {
        ...state,
        answers: updatedAnswers,
        currentQuestion: nextQ,
        history: [...state.history, action.questionId],
        isComplete: false,
      }
    }

    case 'SET_ANSWER': {
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.value,
        },
      }
    }

    case 'NAVIGATE_BACK': {
      if (state.history.length === 0) {
        return state
      }

      const lastIndex = state.history.length - 1
      const prevQuestion = state.history[lastIndex]
      if (!prevQuestion) {
        return state
      }

      const newHistory = state.history.slice(0, lastIndex)

      return {
        ...state,
        currentQuestion: prevQuestion,
        history: newHistory,
        isComplete: false,
      }
    }

    case 'SKIP_QUESTION': {
      const currentDef = QUESTIONS[state.currentQuestion]
      if (!currentDef.optional) {
        // Required questions cannot be skipped
        return state
      }

      const nextQ = currentDef.nextQuestion(state.answers)
      if (nextQ === null) {
        return {
          ...state,
          isComplete: true,
        }
      }

      return {
        ...state,
        currentQuestion: nextQ,
        history: [...state.history, state.currentQuestion],
        isComplete: false,
      }
    }

    case 'CLEAR_ALL': {
      return {
        currentQuestion: INITIAL_QUESTION_ID,
        answers: {},
        history: [],
        isComplete: false,
      }
    }

    case 'RESTORE': {
      const targetQuestion: QuestionId =
        action.history.length > 0
          ? action.history[action.history.length - 1] ?? INITIAL_QUESTION_ID
          : INITIAL_QUESTION_ID

      return {
        currentQuestion: targetQuestion,
        answers: action.answers,
        history: action.history.slice(0, -1),
        isComplete: false,
      }
    }

    default:
      return state
  }
}
