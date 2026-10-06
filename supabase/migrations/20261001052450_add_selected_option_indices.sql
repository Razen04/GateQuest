alter table public.user_question_activity
    add column if not exists selected_option_indices int[] default null;

comment on column public.user_question_activity.selected_option_indices is 'The option index/indices the user selected. NULL for numerical questions or unattempted. Array for MSQ (multiple selections), single-element for MCQ.';

