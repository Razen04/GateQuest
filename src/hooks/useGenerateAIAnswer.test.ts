import { renderHook, act } from '@testing-library/react';
import { useGenerateAIAnswer } from './useGenerateAIAnswer';
import { supabase } from '@/utils/supabaseClient';
import { toast } from 'sonner';

// 1. MOCK THE DEPENDENCIES
vi.mock('@/utils/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    channel: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('useGenerateAIAnswer Hook', () => {
  const mockQuestionId = 'test-question-123';
  const mockOnSuccess = vi.fn();
  const mockSyncToLocalDB = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks(); // Clear history before each test
  });

  it('Scenario 1: Successfully generates a new AI answer', async () => {
    
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { answer: 'The correct option is A because of X.' },
      error: null,
    });

    const { result } = renderHook(() => useGenerateAIAnswer());

    // Act: Trigger the generation
    await act(async () => {
      await result.current.generateAIAnswer(mockQuestionId, mockOnSuccess, mockSyncToLocalDB);
    });

    // Assert: Verify everything happened correctly
    expect(supabase.functions.invoke).toHaveBeenCalledWith('generate-ai-answer', {
      body: { question_id: mockQuestionId },
    });
    expect(toast.success).toHaveBeenCalledWith('AI Answer Generated!');
    expect(mockOnSuccess).toHaveBeenCalledWith('The correct option is A because of X.');
    expect(mockSyncToLocalDB).toHaveBeenCalledWith(mockQuestionId, 'The correct option is A because of X.');
    expect(result.current.isGenerating).toBe(false); // Spinner should turn off
  });

  it('Scenario 2: Handles the Concurrency Lock (202 Accepted)', async () => {
    
    (supabase.functions.invoke as any).mockResolvedValue({
      data: { status: 'generating' },
      error: null,
    });

    const { result } = renderHook(() => useGenerateAIAnswer());

    // Act: Trigger the generation
    await act(async () => {
      await result.current.generateAIAnswer(mockQuestionId, mockOnSuccess, mockSyncToLocalDB);
    });

    // Assert: Verify we entered the "Waiting" state
    expect(toast.loading).toHaveBeenCalledWith('Another user is generating this. Syncing...', {
      id: `sync-${mockQuestionId}`,
    });
    expect(supabase.channel).toHaveBeenCalledWith(`question-${mockQuestionId}`);
    
    // The spinner should STAY ON because we are waiting for the Realtime update
    expect(result.current.isGenerating).toBe(true); 
  });
});