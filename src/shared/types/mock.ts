// ═══════════════════════════════════════════════════════════════════
// Mock Test Series — shared types
//
// Shapes match Phase 4 RPC return values exactly. Any drift breaks
// type-safety silently; if a Phase 4 RPC signature changes, this file
// is the single source of truth to update.
// ═══════════════════════════════════════════════════════════════════

/** One row from `get_mock_catalog`. Server truth. */
export interface MockServerEntry {
    mock_id: string;
    label: string;
    starts_at: string;
    ends_at: string;
    duration_seconds: number;
    question_count: number;
    total_marks: number;
    attempt_min_tier: number;
    post_min_tier: number;
    series_number: number | null;
    blurb: string | null;
    announcement: string | null;
    is_live: boolean;
    results_released: boolean;
    can_attempt: boolean;
    attempt_lock_reason: 'login_required' | 'tier_required' | null;
    session_id: string | null;
    session_status: string | null;
    session_score: number | null;
    active_test_id: string | null;
    active_test_label: string | null;
}

/** Resolved state per mock — output of `resolveMockState`. */
export type MockState =
    | 'login_required'
    | 'upcoming'
    | 'live'
    | 'resumable'
    | 'embargoed'
    | 'attempted'
    | 'donor_locked'
    | 'open';

export interface ResolvedMock {
    state: MockState;
    // Identity
    mockId: string;
    label: string;
    // Schedule (ms epoch)
    startsAt: number;
    endsAt: number;
    durationSeconds: number;
    // Content
    questionCount: number;
    totalMarks: number;
    // Gates
    attemptMinTier: number;
    postMinTier: number;
    // Session (if any)
    sessionId: string | null;
    sessionStatus: string | null;
    sessionScore: number | null;
    // Derived timing
    secondsUntilStart: number | null;
    secondsUntilEnd: number | null;
    timeAllowedSeconds: number | null;
    // Derived permissions
    canAttempt: boolean;
    canReAttempt: boolean;
    canSeeAnalysis: boolean;
    isBeta: boolean;
    // Display hints from JSON (null if server has a mock JSON doesn't)
    seriesNumber: number | null;
    blurb: string | null;
    announcement: string | null;
    /** ID of the user's active test (any type) in this branch. */
    activeTestId: string | null;
    /** Label of the active test, for UI copy. */
    activeTestLabel: string | null;
}

/** Return shape of `get_mock_summary`. */
export type MockSummaryResponse =
    | { results_released: false; results_at: string }
    | {
          results_released: true;
          mock_id: string;
          is_re_attempt: boolean;
          total_score: number;
          positive_score: number;
          negative_score: number;
          total_marks: number;
          attempted_count: number;
          correct_count: number;
          incorrect_count: number;
          analysis_unlocked: boolean;
      }
    | { error: 'not_found' | 'not_completed' | 'not_a_mock_attempt' };

/** Return shape of `get_mock_analysis`. */
export type MockAnalysisResponse =
    | {
          results_released: true;
          is_re_attempt: boolean;
          rank: number | null;
          percentile: number | null;
          total_participants: number | null;
          note?: string;
      }
    | {
          error:
              | 'not_found'
              | 'not_completed'
              | 'not_a_mock_attempt'
              | 'embargoed'
              | 'tier_required';
          results_at?: string;
          min_tier?: number;
      };

export interface MockLeaderboardEntry {
    rank: number;
    user_id: string;
    username: string;
    name: string;
    avatar: string | null;
    tier: 0 | 1 | 2 | 3;
    score: number;
    time_seconds: number;
}

/** Return shape of `get_mock_leaderboard`. */
export type MockLeaderboardResponse =
    | {
          top: MockLeaderboardEntry[];
          my_rank: number | null;
          total_participants: number;
      }
    | {
          error: 'mock_not_found' | 'embargoed' | 'tier_required';
          results_at?: string;
          min_tier?: number;
      };

/** Return shape of `create_test_from_mock`. */
export type CreateMockResponse =
    | {
          status: 'created';
          test_id: string;
          actual_count: number;
          total_marks: number;
          time_allowed: number;
          results_at: string;
          is_re_attempt: boolean;
          record_activity: boolean;
      }
    | { status: 'not_live'; starts_at: string }
    | { status: 'already_attempted'; test_id: string; session_status: string }
    | {
          status: 'active_exists';
          test_id: string;
          blocking_paper_id: string | null;
      }
    | { status: 'attempt_gated'; min_tier: number; my_tier: number }
    | { status: 're_attempt_gated'; test_id: string; min_tier: number }
    | { status: 'window_closing'; seconds_left: number };

/** Return shape of `practice_from_mock`. */
export type PracticeFromMockResponse =
    | {
          status: 'created';
          test_id: string;
          question_count: number;
          total_marks: number;
      }
    | {
          error:
              | 'must_complete_first'
              | 'tier_required'
              | 'active_exists'
              | 'mock_not_found';
          min_tier?: number;
          test_id?: string;
      };
