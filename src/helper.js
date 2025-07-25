import { toast } from "sonner";
import { supabase } from "../supabaseClient";

export const getUserProfile = () => {
    try {
        return JSON.parse(localStorage.getItem("gate_user_profile"))
    } catch (err) {
        return null;
    }
}

// Get background color based on subject
export const getBackgroundColor = (color) => {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        purple: "bg-purple-100 text-purple-600",
        green: "bg-green-100 text-green-600",
        indigo: "bg-indigo-100 text-indigo-600",
        red: "bg-red-100 text-red-600",
        orange: "bg-orange-100 text-orange-600"
    }
    return colors[color] || "bg-gray-100 text-gray-600"
}

export const updateUserProfile = (updates) => {
    const current = JSON.parse(localStorage.getItem("gate_user_profile"))
    const updated = { ...current, ...updates }
    localStorage.setItem("gate_user_profile", JSON.stringify(updated))
    return updated
}

export const syncUserToSupabase = async () => {

    const user = getUserProfile()
    if (!user || !user.id) {
        toast.message("No user found.")
        console.warn("No user or missing user.id — cannot sync");
        return;
    }
    const { error } = await supabase.from("users").update(user).eq("id", user.id)
    if (error) {
        console.error("Sync failed", error)
        toast.error("Profile update failed, try again later.");
    }
}

export const recordAttempt = async (params, user) => {

    if (!user || !user.id) {
        toast.error("No valid user profile found.");
        return;
    }

    if(user.id === 1) {
        toast.message("Login to sync your profile.")
        return;
    }

    const { data, error } = await supabase.from('user_question_activity').insert([{
        ...params
    }]);

    if (error) {
        toast.error("Failed to record attempt: " + error.message);
        console.error("Failed to record attempt: ", error);
    } else {
        toast.success("Attempt recorded successfully!");
    }
}