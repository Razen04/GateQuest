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
    const updated = {...current, ...updates}
    localStorage.setItem("gate_user_profile", JSON.stringify(updated))
    return updated
}

export const syncUserToSupabase = async () => {
    const user = JSON.parse(localStorage.getItem("gate_user_profile"));
    if (!user || !user.id) {
        console.warn("No user or missing user.id — cannot sync");
        return;
    }

    const { error } = await supabase.from("users").update(user).eq("id", user.id)

    if(error) {
        console.error("Sync failed", error)
        toast.error("Profile update failed, try again later.")
    } else {
        toast.success("Profile updated successfully.")
    }

}