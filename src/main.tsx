import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

import { UserProvider } from "./context/UserContext";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </UserProvider>
  </React.StrictMode>
);
