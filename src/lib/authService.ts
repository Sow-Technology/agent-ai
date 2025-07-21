
const AUTH_KEY = 'assureqai_auth_token';
const LOCAL_STORAGE_MANAGED_USERS_KEY = 'assureQaiManagedUsers';
const LOCAL_STORAGE_LOGGED_IN_USER_DETAILS_KEY = 'assureQaiLoggedInUserDetails';

export interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
}

export const login = (username?: string, password?: string): boolean => {
  if (typeof window === 'undefined' || !username) {
    return false;
  }

  // 1. Check superuser credentials
  if (username === 'AT2205' && password === 'Ajju@2205') {
    try {
      localStorage.setItem(AUTH_KEY, 'loggedIn');
      localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_USER_DETAILS_KEY, JSON.stringify({
        id: 'AT2205_superuser',
        username: 'AT2205',
        fullName: 'Super Admin',
        email: 'superuser@example.com',
        role: 'Administrator'
      }));
      return true;
    } catch (error) {
      console.error("Failed to set auth token or user details in localStorage for superuser", error);
      return false;
    }
  }

  // 2. Check dynamically managed users from localStorage
  try {
    const storedUsersRaw = localStorage.getItem(LOCAL_STORAGE_MANAGED_USERS_KEY);
    if (storedUsersRaw) {
      const managedUsers: User[] = JSON.parse(storedUsersRaw);
      // Case-insensitive username check
      const foundUser = managedUsers.find(user => user.username.toLowerCase() === username.toLowerCase());

      if (foundUser) {
        // For this prototype, password for dynamic users is NOT checked.
        localStorage.setItem(AUTH_KEY, 'loggedIn');
        localStorage.setItem(LOCAL_STORAGE_LOGGED_IN_USER_DETAILS_KEY, JSON.stringify({
          id: foundUser.id,
          username: foundUser.username,
          fullName: foundUser.fullName,
          email: foundUser.email,
          role: foundUser.role
        }));
        return true;
      }
    }
  } catch (error) {
    console.error("Error during dynamic user login check:", error);
  }

  return false; // If no user matched
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(LOCAL_STORAGE_LOGGED_IN_USER_DETAILS_KEY);
    } catch (error) {
      console.error("Failed to remove auth token or user details from localStorage", error);
    }
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(AUTH_KEY) === 'loggedIn';
    } catch (error) {
      console.error("Failed to get auth token from localStorage", error);
      return false;
    }
  }
  return false;
};

export const getLoggedInUserDetails = (): User | null => {
  if (typeof window !== 'undefined') {
    try {
      const detailsRaw = localStorage.getItem(LOCAL_STORAGE_LOGGED_IN_USER_DETAILS_KEY);
      if (detailsRaw) {
        return JSON.parse(detailsRaw) as User;
      }
    } catch (error) {
      console.error("Failed to get logged in user details from localStorage", error);
    }
  }
  return null;
};
