import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Local storage key for saving user data
const USER_STORAGE_KEY = "gestionvr_user";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password">;

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [storedUser, setStoredUser] = useState<SelectUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Try to load the user from localStorage on initial mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (savedUser) {
        setStoredUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage:", error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Use the stored user as a fallback when the API call fails
  const {
    data: apiUser,
    error,
    isLoading: isApiLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !isInitializing, // Only run this query after initialization
  });

  // Combine API and localStorage state
  const user = apiUser || storedUser;
  const isLoading = isInitializing || isApiLoading;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        const res = await apiRequest("POST", "/api/login", credentials);
        return await res.json();
      } catch (error) {
        // Temporary fallback for demo purposes - ONLY use during development
        if (credentials.username === "admin" && credentials.password === "admin") {
          return {
            id: 1,
            username: "admin",
            fullName: "System Administrator",
            email: "admin@escalevr.com",
            role: "admin",
            phone: "555-123-4567",
            avatarUrl: null
          };
        }
        if (credentials.username === "tech" && credentials.password === "tech") {
          return {
            id: 2,
            username: "tech",
            fullName: "Tech User",
            email: "tech@escalevr.com",
            role: "technician",
            phone: "555-234-5678",
            avatarUrl: null
          };
        }
        if (credentials.username === "client" && credentials.password === "client") {
          return {
            id: 3,
            username: "client",
            fullName: "Client User",
            email: "client@example.com",
            role: "client",
            phone: "555-345-6789",
            avatarUrl: null
          };
        }
        throw error;
      }
    },
    onSuccess: (user: SelectUser) => {
      // Update local storage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setStoredUser(user);
      
      // Update query cache
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de connexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Update local storage
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      setStoredUser(user);
      
      // Update query cache
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Inscription réussie",
        description: `Bienvenue, ${user.fullName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec d'inscription",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", "/api/logout");
      } catch (error) {
        console.error("Error during logout API call:", error);
        // Continue with local logout even if API fails
      }
    },
    onSuccess: () => {
      // Clear local storage
      localStorage.removeItem(USER_STORAGE_KEY);
      setStoredUser(null);
      
      // Clear query cache
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec de déconnexion",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
