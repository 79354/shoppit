import { createContext, useContext, useState, ReactNode, useEffect } from "react";




interface AuthContextType {
  userIsAuthenticated: boolean;
  login: (username:string) => void;
  logout: () => void;
  authUsername: string;
}

// Create context with default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userIsAuthenticated, setUserIsAuthenticated] = useState(false);
  const [authUsername, setAuthUsername] = useState("")




  const login = (username: string) => {
    setUserIsAuthenticated(true)
    setAuthUsername(username)
  }
    

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token")
    localStorage.removeItem("auth_username")
    setUserIsAuthenticated(false)

  };


   useEffect(() => {
    const storedAccessToken = localStorage.getItem("access_token");
    const storedUsername = localStorage.getItem("auth_username");
    if (storedAccessToken) {
      setUserIsAuthenticated(true)
      console.log("yes user is authnticated")
    }
    if(storedUsername){
        setAuthUsername(storedUsername)
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userIsAuthenticated, login, logout, authUsername }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
