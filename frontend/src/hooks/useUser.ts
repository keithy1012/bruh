import { useState, useEffect, useCallback } from "react";
import { UserProfile } from "../types";

const USER_ID_KEY = "moneymap_user_id";
const USER_PROFILE_KEY = "moneymap_user_profile";

export function useUser() {
  const [userId, setUserIdState] = useState<string | null>(() => {
    return localStorage.getItem(USER_ID_KEY);
  });
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(() => {
    const stored = localStorage.getItem(USER_PROFILE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return !!localStorage.getItem(USER_ID_KEY);
  });

  const setUserId = useCallback((id: string) => {
    localStorage.setItem(USER_ID_KEY, id);
    setUserIdState(id);
    setIsOnboarded(true);
  }, []);

  const setUserProfile = useCallback((profile: UserProfile) => {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    setUserProfileState(profile);
  }, []);

  const clearUser = useCallback(() => {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    setUserIdState(null);
    setUserProfileState(null);
    setIsOnboarded(false);
  }, []);

  useEffect(() => {
    const storedId = localStorage.getItem(USER_ID_KEY);
    if (storedId) {
      setUserIdState(storedId);
      setIsOnboarded(true);
    }
    const storedProfile = localStorage.getItem(USER_PROFILE_KEY);
    if (storedProfile) {
      try {
        setUserProfileState(JSON.parse(storedProfile));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  return {
    userId,
    userProfile,
    isOnboarded,
    setUserId,
    setUserProfile,
    clearUser,
  };
}

export default useUser;
