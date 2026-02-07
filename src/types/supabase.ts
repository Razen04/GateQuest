export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never;
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            graphql: {
                Args: {
                    extensions?: Json;
                    operationName?: string;
                    query?: string;
                    variables?: Json;
                };
                Returns: Json;
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
    public: {
        Tables: {
            donations: {
                Row: {
                    actual_amount: number | null;
                    anonymous: boolean | null;
                    created_at: string | null;
                    id: string;
                    message: string | null;
                    suggested_amount: number | null;
                    user_id: string | null;
                    utr: string | null;
                    verified: boolean | null;
                    verified_at: string | null;
                };
                Insert: {
                    actual_amount?: number | null;
                    anonymous?: boolean | null;
                    created_at?: string | null;
                    id?: string;
                    message?: string | null;
                    suggested_amount?: number | null;
                    user_id?: string | null;
                    utr?: string | null;
                    verified?: boolean | null;
                    verified_at?: string | null;
                };
                Update: {
                    actual_amount?: number | null;
                    anonymous?: boolean | null;
                    created_at?: string | null;
                    id?: string;
                    message?: string | null;
                    suggested_amount?: number | null;
                    user_id?: string | null;
                    utr?: string | null;
                    verified?: boolean | null;
                    verified_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'donations_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            notifications: {
                Row: {
                    active: boolean | null;
                    created_at: string;
                    id: string;
                    message: string | null;
                    title: string | null;
                    type: string | null;
                };
                Insert: {
                    active?: boolean | null;
                    created_at?: string;
                    id?: string;
                    message?: string | null;
                    title?: string | null;
                    type?: string | null;
                };
                Update: {
                    active?: boolean | null;
                    created_at?: string;
                    id?: string;
                    message?: string | null;
                    title?: string | null;
                    type?: string | null;
                };
                Relationships: [];
            };
            question_peer_stats: {
                Row: {
                    avg_time_seconds: number | null;
                    correct_attempts: number;
                    question_id: string;
                    total_attempts: number;
                    updated_at: string;
                    wrong_attempts: number;
                };
                Insert: {
                    avg_time_seconds?: number | null;
                    correct_attempts?: number;
                    question_id: string;
                    total_attempts?: number;
                    updated_at?: string;
                    wrong_attempts?: number;
                };
                Update: {
                    avg_time_seconds?: number | null;
                    correct_attempts?: number;
                    question_id?: string;
                    total_attempts?: number;
                    updated_at?: string;
                    wrong_attempts?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'question_peer_stats_question_id_fkey';
                        columns: ['question_id'];
                        isOneToOne: true;
                        referencedRelation: 'questions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            question_reports: {
                Row: {
                    created_at: string | null;
                    id: string;
                    question_id: string | null;
                    report_text: string;
                    report_type: string | null;
                    status: string | null;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    question_id?: string | null;
                    report_text: string;
                    report_type?: string | null;
                    status?: string | null;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    question_id?: string | null;
                    report_text?: string;
                    report_type?: string | null;
                    status?: string | null;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'question_reports_question_id_fkey';
                        columns: ['question_id'];
                        isOneToOne: false;
                        referencedRelation: 'questions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'question_reports_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            questions: {
                Row: {
                    added_by: string | null;
                    answer_text: string | null;
                    correct_answer: Json;
                    created_at: string | null;
                    difficulty: string | null;
                    explanation: string | null;
                    id: string;
                    marks: number | null;
                    metadata: Json | null;
                    options: string[] | null;
                    question: string;
                    question_number: number | null;
                    question_type: string;
                    source: string | null;
                    source_url: string | null;
                    subject: string;
                    tags: string[] | null;
                    topic: string | null;
                    updated_at: string | null;
                    verified: boolean | null;
                    year: number;
                };
                Insert: {
                    added_by?: string | null;
                    answer_text?: string | null;
                    correct_answer: Json;
                    created_at?: string | null;
                    difficulty?: string | null;
                    explanation?: string | null;
                    id?: string;
                    marks?: number | null;
                    metadata?: Json | null;
                    options?: string[] | null;
                    question: string;
                    question_number?: number | null;
                    question_type: string;
                    source?: string | null;
                    source_url?: string | null;
                    subject: string;
                    tags?: string[] | null;
                    topic?: string | null;
                    updated_at?: string | null;
                    verified?: boolean | null;
                    year: number;
                };
                Update: {
                    added_by?: string | null;
                    answer_text?: string | null;
                    correct_answer?: Json;
                    created_at?: string | null;
                    difficulty?: string | null;
                    explanation?: string | null;
                    id?: string;
                    marks?: number | null;
                    metadata?: Json | null;
                    options?: string[] | null;
                    question?: string;
                    question_number?: number | null;
                    question_type?: string;
                    source?: string | null;
                    source_url?: string | null;
                    subject?: string;
                    tags?: string[] | null;
                    topic?: string | null;
                    updated_at?: string | null;
                    verified?: boolean | null;
                    year?: number;
                };
                Relationships: [];
            };
            revision_set_questions: {
                Row: {
                    is_correct: boolean | null;
                    question_id: string;
                    set_id: string;
                    time_spent_seconds: number | null;
                };
                Insert: {
                    is_correct?: boolean | null;
                    question_id: string;
                    set_id: string;
                    time_spent_seconds?: number | null;
                };
                Update: {
                    is_correct?: boolean | null;
                    question_id?: string;
                    set_id?: string;
                    time_spent_seconds?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'revision_set_questions_question_id_fkey';
                        columns: ['question_id'];
                        isOneToOne: false;
                        referencedRelation: 'questions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'revision_set_questions_set_id_fkey';
                        columns: ['set_id'];
                        isOneToOne: false;
                        referencedRelation: 'weekly_revision_set';
                        referencedColumns: ['id'];
                    },
                ];
            };
            topic_tests: {
                Row: {
                    accuracy: number | null;
                    attempted_count: number | null;
                    completed_at: string | null;
                    correct_count: number | null;
                    created_at: string | null;
                    id: string;
                    remaining_time_seconds: number;
                    score: number | null;
                    status: string | null;
                    topics: string[] | null;
                    total_marks: number | null;
                    total_questions: number | null;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    accuracy?: number | null;
                    attempted_count?: number | null;
                    completed_at?: string | null;
                    correct_count?: number | null;
                    created_at?: string | null;
                    id?: string;
                    remaining_time_seconds: number;
                    score?: number | null;
                    status?: string | null;
                    topics?: string[] | null;
                    total_marks?: number | null;
                    total_questions?: number | null;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    accuracy?: number | null;
                    attempted_count?: number | null;
                    completed_at?: string | null;
                    correct_count?: number | null;
                    created_at?: string | null;
                    id?: string;
                    remaining_time_seconds?: number;
                    score?: number | null;
                    status?: string | null;
                    topics?: string[] | null;
                    total_marks?: number | null;
                    total_questions?: number | null;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            topic_tests_attempts: {
                Row: {
                    attempt_order: number;
                    is_correct: boolean | null;
                    marked_for_review: boolean | null;
                    question_id: string;
                    score: number | null;
                    session_id: string;
                    status: string | null;
                    time_spent_seconds: number | null;
                    user_answer: Json | null;
                };
                Insert: {
                    attempt_order: number;
                    is_correct?: boolean | null;
                    marked_for_review?: boolean | null;
                    question_id: string;
                    score?: number | null;
                    session_id: string;
                    status?: string | null;
                    time_spent_seconds?: number | null;
                    user_answer?: Json | null;
                };
                Update: {
                    attempt_order?: number;
                    is_correct?: boolean | null;
                    marked_for_review?: boolean | null;
                    question_id?: string;
                    score?: number | null;
                    session_id?: string;
                    status?: string | null;
                    time_spent_seconds?: number | null;
                    user_answer?: Json | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'topic_tests_attempts_question_id_fkey';
                        columns: ['question_id'];
                        isOneToOne: false;
                        referencedRelation: 'questions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'topic_tests_attempts_session_id_fkey';
                        columns: ['session_id'];
                        isOneToOne: false;
                        referencedRelation: 'topic_tests';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_incorrect_queue: {
                Row: {
                    added_at: string | null;
                    box: number | null;
                    next_review_at: string | null;
                    question_id: string;
                    user_id: string;
                };
                Insert: {
                    added_at?: string | null;
                    box?: number | null;
                    next_review_at?: string | null;
                    question_id: string;
                    user_id: string;
                };
                Update: {
                    added_at?: string | null;
                    box?: number | null;
                    next_review_at?: string | null;
                    question_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_incorrect_queue_question_id_fkey';
                        columns: ['question_id'];
                        isOneToOne: false;
                        referencedRelation: 'questions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'user_incorrect_queue_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_question_activity: {
                Row: {
                    attempt_number: number | null;
                    attempted_at: string | null;
                    id: string;
                    question_id: string | null;
                    subject: string | null;
                    time_taken: number | null;
                    user_id: string | null;
                    user_version_number: number;
                    was_correct: boolean | null;
                };
                Insert: {
                    attempt_number?: number | null;
                    attempted_at?: string | null;
                    id?: string;
                    question_id?: string | null;
                    subject?: string | null;
                    time_taken?: number | null;
                    user_id?: string | null;
                    user_version_number?: number;
                    was_correct?: boolean | null;
                };
                Update: {
                    attempt_number?: number | null;
                    attempted_at?: string | null;
                    id?: string;
                    question_id?: string | null;
                    subject?: string | null;
                    time_taken?: number | null;
                    user_id?: string | null;
                    user_version_number?: number;
                    was_correct?: boolean | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_question_activity_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            users: {
                Row: {
                    avatar: string | null;
                    bookmark_questions: Json | null;
                    college: string | null;
                    email: string | null;
                    id: string;
                    joined_at: string;
                    name: string | null;
                    settings: Json | null;
                    show_name: boolean | null;
                    targetYear: number | null;
                    total_xp: number | null;
                    version_number: number;
                };
                Insert: {
                    avatar?: string | null;
                    bookmark_questions?: Json | null;
                    college?: string | null;
                    email?: string | null;
                    id?: string;
                    joined_at?: string;
                    name?: string | null;
                    settings?: Json | null;
                    show_name?: boolean | null;
                    targetYear?: number | null;
                    total_xp?: number | null;
                    version_number?: number;
                };
                Update: {
                    avatar?: string | null;
                    bookmark_questions?: Json | null;
                    college?: string | null;
                    email?: string | null;
                    id?: string;
                    joined_at?: string;
                    name?: string | null;
                    settings?: Json | null;
                    show_name?: boolean | null;
                    targetYear?: number | null;
                    total_xp?: number | null;
                    version_number?: number;
                };
                Relationships: [];
            };
            weekly_revision_set: {
                Row: {
                    accuracy: number | null;
                    correct_count: number | null;
                    created_at: string | null;
                    expires_at: string | null;
                    generated_for: string | null;
                    id: string;
                    start_of_week: string;
                    started_at: string | null;
                    status: Database['public']['Enums']['revision_status'] | null;
                    total_questions: number | null;
                };
                Insert: {
                    accuracy?: number | null;
                    correct_count?: number | null;
                    created_at?: string | null;
                    expires_at?: string | null;
                    generated_for?: string | null;
                    id?: string;
                    start_of_week: string;
                    started_at?: string | null;
                    status?: Database['public']['Enums']['revision_status'] | null;
                    total_questions?: number | null;
                };
                Update: {
                    accuracy?: number | null;
                    correct_count?: number | null;
                    created_at?: string | null;
                    expires_at?: string | null;
                    generated_for?: string | null;
                    id?: string;
                    start_of_week?: string;
                    started_at?: string | null;
                    status?: Database['public']['Enums']['revision_status'] | null;
                    total_questions?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'weekly_revision_set_generated_for_fkey';
                        columns: ['generated_for'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            v_user_cycle_stats: {
                Row: {
                    attempt_number: number | null;
                    attempted_at: string | null;
                    id: string | null;
                    question_id: string | null;
                    subject: string | null;
                    time_taken: number | null;
                    user_id: string | null;
                    user_version_number: number | null;
                    was_correct: boolean | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'user_question_activity_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Functions: {
            clear_user_data: { Args: never; Returns: Json };
            generate_topic_test: {
                Args: {
                    p_already_attempted_questions: boolean;
                    p_filters: Json;
                    p_question_count: number;
                    p_total_seconds: number;
                };
                Returns: Json;
            };
            generate_weekly_revision_set: { Args: never; Returns: Json };
            get_topic_counts: {
                Args: { p_subject: string };
                Returns: {
                    question_count: number;
                    topic: string;
                }[];
            };
            get_verified_donations: {
                Args: never;
                Returns: {
                    actual_amount: number;
                    anonymous: boolean;
                    created_at: string;
                    donation_id: string;
                    message: string;
                    user_avatar: string;
                    user_id: string;
                    user_name: string;
                    verified: boolean;
                }[];
            };
            get_weekly_set: { Args: never; Returns: Json };
            insert_user_question_activity_batch: {
                Args: { batch: Json };
                Returns: undefined;
            };
            refresh_question_peer_stats: { Args: never; Returns: undefined };
            start_weekly_revision_set: { Args: { v_set_id: string }; Returns: Json };
            update_status_of_weekly_set: {
                Args: { v_set_id: string };
                Returns: Json;
            };
        };
        Enums: {
            revision_status: 'pending' | 'started' | 'expired';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {
            revision_status: ['pending', 'started', 'expired'],
        },
    },
} as const;
