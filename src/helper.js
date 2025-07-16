import { toast } from "sonner";
import { supabase } from "../supabaseClient";

export const getUserProfile = () => {
    try {
        return JSON.parse(localStorage.getItem("gate_user_profile"))
    } catch (err) {
        return null;
    }
}

export const updateUserProfile = (updates) => {
    const current = JSON.parse(localStorage.getItem("gate_user_profile"))
    const updated = { ...current, ...updates }
    localStorage.setItem("gate_user_profile", JSON.stringify(updated))
    return updated
}

export const syncUserToSupabase = async (isLogin = true) => {
    if (!isLogin) {
        toast.message("Please login to sync your profile.");
        return;
    }
    const user = JSON.parse(localStorage.getItem("gate_user_profile"));
    if (!user || !user.id) {
        console.warn("No user or missing user.id — cannot sync");
        return;
    }
    const { error } = await supabase.from("users").update(user).eq("id", user.id)
    if (error) {
        console.error("Sync failed", error)
        toast.error("Profile update failed, try again later.");
    }
}

export const recordAttempt = async ({ user_id,
    question_id,
    subject,
    was_correct,
    time_taken,
    attempted_at,
    attempt_number }, isLogin = true) => {
    if (!isLogin) {
        toast.message("Please login to store your progress.");
        return;
    }
    const { data, error } = await supabase.from('user_question_activity').insert([{
        user_id,
        question_id,
        subject,
        was_correct,
        time_taken,
        attempted_at,
        attempt_number
    }])
    if (error) {
        console.error("Failed to record attempt: ", error.message)
    }
}