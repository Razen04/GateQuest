UPDATE subjects 
SET question_count = (
    SELECT count(*) 
    FROM questions 
    WHERE questions.subject_id = subjects.id
);
