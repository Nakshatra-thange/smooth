import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";   // ⭐ THIS LINE IS CRITICAL
import { Buffer } from "buffer";
import App from "./App";
import AppProviders from "./contexts/AppProviders";
import { AppProvider } from "./contexts/AppContext";
(window as any).Buffer = Buffer;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProviders>
        <AppProvider>
        <App />
        </AppProvider>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>
);
