// Client-side authentication functions - only for browser/client components
import type { User } from "@/types/auth";

export type UserDetails = User;

// Store JWT token in localStorage after successful login
export function clientStoreToken(token: string, user: UserDetails) {
  if (typeof window === "undefined") {
    console.warn("clientStoreToken called on server side");
    return;
  }

  try {
    localStorage.setItem("authToken", token);
    localStorage.setItem("loggedInUserDetails", JSON.stringify(user));
  } catch (error) {
    console.error("Failed to store token:", error);
  }
}

// Get current auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const token = localStorage.getItem("authToken");
    console.log(token);
    return token;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

// Get current user details from localStorage
export function getCurrentUser(): UserDetails | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const userDetailsStr = localStorage.getItem("loggedInUserDetails");
    if (!userDetailsStr) {
      return null;
    }
    return JSON.parse(userDetailsStr);
  } catch (error) {
    console.error("Failed to get user details:", error);
    return null;
  }
}

// Check if user is logged in (has valid token data)
export function isLoggedIn(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const token = getAuthToken();
  const user = getCurrentUser();

  return !!(token && user);
}

// Clear token data from localStorage
export function clientLogout() {
  if (typeof window === "undefined") {
    console.warn("clientLogout called on server side");
    return;
  }

  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInUserDetails");
  } catch (error) {
    console.error("Failed to clear token:", error);
  }
}

// Check if current user has admin role
export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === "Administrator";
}
