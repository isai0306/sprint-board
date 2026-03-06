export interface AppUser {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
}

export interface AuthSession {
  token: string;
}
