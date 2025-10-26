export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '12.2.3 (519615d)';
    };
    public: {
        Tables: {
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
                    verified?: boolean | null;
                    year?: number;
                };
                Relationships: [];
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
                    target_year: number | null;
                    total_xp: number | null;
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
                    target_year?: number | null;
                    total_xp?: number | null;
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
                    target_year?: number | null;
                    total_xp?: number | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            insert_user_question_activity_batch: {
                Args: { batch: Json };
                Returns: undefined;
            };
            refresh_question_peer_stats: {
                Args: Record<PropertyKey, never>;
                Returns: undefined;
            };
        };
        Enums: {
            [_ in never]: never;
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
    public: {
        Enums: {},
    },
} as const;
