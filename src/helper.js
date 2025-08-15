// This file contains various utility functions used throughout the application,such as interacting with localStorage, styling, and syncing data with Supabase.

import { toast } from "sonner";
import { supabase } from "../supabaseClient";

// Safely retrieves and parses the user profile from localStorage.
// Returns null if the profile doesn't exist or if there's a parsing error.
export const getUserProfile = () => {
    try {
        return JSON.parse(localStorage.getItem("gate_user_profile"))
    } catch {
        return null;
    }
}

// Maps a color name to corresponding Tailwind CSS classes for background and text color.
export const getBackgroundColor = (color) => {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        purple: "bg-purple-100 text-purple-600",
        green: "bg-green-100 text-green-600",
        indigo: "bg-indigo-100 text-indigo-600",
        red: "bg-red-100 text-red-600",
        orange: "bg-orange-100 text-orange-600"
    }
    return colors[color] || "bg-gray-100 text-gray-600" // Fallback for unknown colors.
}

// Updates the user profile in localStorage by merging new data with the existing profile.
export const updateUserProfile = (updates) => {
    const current = JSON.parse(localStorage.getItem("gate_user_profile"))
    const updated = { ...current, ...updates }
    localStorage.setItem("gate_user_profile", JSON.stringify(updated))
    return updated
}

// A helper function to sort questions by year in descending order (newest first).
export const sortQuestionsByYear = (questionsToSort) => {
    return [...questionsToSort].sort((a, b) => {
        // Safely parse the year, defaulting to 0 if it's missing.
        const yearA = a.year ? parseInt(a.year) : 0;
        const yearB = b.year ? parseInt(b.year) : 0;
        return yearB - yearA;
    });
};

// Pushes the entire local user profile to the Supabase 'users' table.
// This is used to persist changes made locally (like settings) to the database.
export const syncUserToSupabase = async () => {
    const user = getUserProfile()
    // A check to ensure there is a valid user to sync.
    if (!user || !user.id) {
        toast.message("Login to sync profile.")
        console.warn("No user or missing user.id — cannot sync");
        return;
    }
    const { error } = await supabase.from("users").update(user).eq("id", user.id)
    if (error) {
        console.error("Sync failed", error)
        toast.error("Profile update failed, try again later.");
    }
}

// Buffers user question attempts in localStorage before sending them to the database.
// This improves performance by batching writes.
export const recordAttemptLocally = async (params, user, updateStats) => {
    // A check to ensure attempts are only recorded for logged-in users.
    if (!user || !user.id) {
        toast.error("No valid user profile found.");
        return;
    }

    // Guest users (id: 1) can practice, but their progress isn't saved.
    if (user.id === 1) {
        toast.message("Login to sync your profile.");
        return;
    }

    const LOCAL_KEY = `attempt_buffer_${user.id}`;
    const buffer = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");

    // If the same question is attempted again while still in the buffer,
    // we update the existing entry instead of creating a new one.
    const existingIndex = buffer.findIndex(
        (item) => item.question_id === params.question_id
    );

    if (existingIndex !== -1) {
        // Increment the attempt number for the existing entry.
        buffer[existingIndex].attempt_number =
            (buffer[existingIndex].attempt_number || 1) + 1;
        buffer[existingIndex].attempted_at = new Date().toISOString();
    } else {
        // Add the new attempt to the buffer.
        buffer.push({
            ...params,
            attempted_at: new Date().toISOString(),
        });
    }

    localStorage.setItem(LOCAL_KEY, JSON.stringify(buffer));
    toast.success("Attempt recorded successfully.")

    // When the buffer reaches a size of 5, sync it to the database.
    if (buffer.length >= 5) {
        await recordAttempt(buffer, user, updateStats);
        localStorage.removeItem(LOCAL_KEY); // Clear the buffer after a successful sync.
    }
};

// Sends a batch of buffered attempts to the Supabase 'user_question_activity' table.
export const recordAttempt = async (buffer, user, updateStats) => {
    if (!user || !user.id) {
        toast.error("No valid user profile found.");
        return;
    }

    // Guest users (id: 1) cannot have their attempts recorded.
    if (user.id === 1) {
        toast.message("Login to sync your profile.")
        return;
    }

    // Insert the entire buffer as new rows in the activity table.
    const { error } = await supabase.from('user_question_activity').upsert(buffer, { onConflict: 'user_id,question_id' });
    // After syncing, immediately update the user's stats to reflect the new data.
    await updateStats(user)

    if (error) {
        toast.error("Failed to record attempt: " + error.message);
        console.error("Failed to record attempt: ", error);
    } else {
        toast.success("Attempt synced successfully!");
    }
}