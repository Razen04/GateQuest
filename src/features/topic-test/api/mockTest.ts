import type {
    CreateMockResponse,
    MockAnalysisResponse,
    MockLeaderboardResponse,
    MockServerEntry,
    MockSummaryResponse,
    PracticeFromMockResponse,
} from '@/shared/types/mock';
import { supabase } from '@/shared/utils/supabaseClient';

export async function fetchMockCatalog(
    branchId: string
): Promise<MockServerEntry[]> {
    const { data, error } = await supabase.rpc('get_mock_catalog', {
        p_branch_id: branchId,
    });
    if (error) {
        console.error('[mockTest] fetchMockCatalog error:', error);
        return [];
    }
    return (data as unknown as MockServerEntry[]) ?? [];
}

export async function createTestFromMock(
    mockId: string,
    branchId: string,
    recordActivity: boolean = false
): Promise<CreateMockResponse | { error: string }> {
    const { data, error } = await supabase.rpc('create_test_from_mock', {
        p_mock_id: mockId,
        p_branch_id: branchId.toLowerCase(),
        p_record_activity: recordActivity,
    });
    if (error) return { error: error.message };
    return data as CreateMockResponse;
}

export async function getMockSummary(
    testId: string
): Promise<MockSummaryResponse | { error: string }> {
    const { data, error } = await supabase.rpc('get_mock_summary', {
        p_test_id: testId,
    });
    if (error) return { error: error.message };
    return data as MockSummaryResponse;
}

export async function getMockAnalysis(
    testId: string
): Promise<MockAnalysisResponse | { error: string }> {
    const { data, error } = await supabase.rpc('get_mock_analysis', {
        p_test_id: testId,
    });
    if (error) return { error: error.message };
    return data as MockAnalysisResponse;
}

export async function getMockLeaderboard(
    mockId: string
): Promise<MockLeaderboardResponse | { error: string }> {
    const { data, error } = await supabase.rpc('get_mock_leaderboard', {
        p_mock_id: mockId,
    });
    if (error) return { error: error.message };
    return data as MockLeaderboardResponse;
}

export async function practiceFromMock(
    mockId: string
): Promise<PracticeFromMockResponse> {
    const { data, error } = await supabase.rpc('practice_from_mock', {
        p_mock_id: mockId,
    });
    if (error) return { error: 'mock_not_found' };
    return data as PracticeFromMockResponse;
}

export type MockSessionTimeResponse =
    | { error: 'not_found' | 'not_a_mock_attempt' | 'missing_mock_metadata' }
    | {
          not_started: true;
          duration_seconds: number;
          window_ends_at: string;
          label: string | null;
          time_allowed: number;
      }
    | {
          not_started: false;
          duration_seconds: number;
          window_ends_at: string;
          label: string | null;
          remaining_seconds: number;
      };

export async function getMockSessionTime(
    testId: string
): Promise<MockSessionTimeResponse> {
    const { data, error } = await supabase.rpc('get_mock_session_time', {
        p_test_id: testId,
    });
    if (error) return { error: 'not_found' };
    return data as MockSessionTimeResponse;
}
