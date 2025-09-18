import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

// ⬇️ AJOUT : Provider qui expose le profil Telegram à toute l'app
import { UserProvider } from "./context/UserContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <UserProvider>
      <App />
    </UserProvider>
  </React.StrictMode>
);
