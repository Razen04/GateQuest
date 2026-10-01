alter table public.question_peer_stats
    add column if not exists option_distribution jsonb default null;

comment on column public.question_peer_stats.option_distribution is 'Raw counts keyed by option index, e.g. {"0": 24, "1": 68, "2": 8}. For MSQ the sum of values exceeds total_attempts, since one attempt contributes to multiple options. NULL until enough data exists.';

