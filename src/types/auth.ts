// Shared authentication types

export interface User {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  role: 'Administrator' | 'Manager' | 'QA Analyst' | 'Agent';
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}