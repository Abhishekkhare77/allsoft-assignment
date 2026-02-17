import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

function getInitialToken() {
  const token = localStorage.getItem("token");
  return token && token.trim() ? token : null;
}

function getInitialMobile() {
  const mobile = localStorage.getItem("mobile_number");
  const fallback = import.meta.env.VITE_MOBILE_NUMBER;
  const value = mobile && mobile.trim() ? mobile : fallback;
  return value && String(value).trim() ? String(value).trim() : "";
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getInitialToken);
  const [mobileNumber, setMobileNumberState] = useState(getInitialMobile);

  const setToken = (nextToken) => {
    const value = nextToken && String(nextToken).trim() ? String(nextToken).trim() : null;
    setTokenState(value);
    if (value) localStorage.setItem("token", value);
    else localStorage.removeItem("token");
  };

  const setMobileNumber = (nextMobile) => {
    const value = nextMobile && String(nextMobile).trim() ? String(nextMobile).trim() : "";
    setMobileNumberState(value);
    if (value) localStorage.setItem("mobile_number", value);
    else localStorage.removeItem("mobile_number");
  };

  const logout = () => {
    setToken(null);
  };

  const value = useMemo(
    () => ({
      token,
      mobileNumber,
      setToken,
      setMobileNumber,
      logout,
      isAuthenticated: Boolean(token),
    }),
    [token, mobileNumber]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

