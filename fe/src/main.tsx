import { createRoot } from "react-dom/client";
import { Buffer } from 'buffer'
import App from "./App.tsx";
import "./index.css";
import { AppWalletProvider } from "./providers/WalletProvider.tsx";

window.Buffer = Buffer

createRoot(document.getElementById("root")!).render(
  <AppWalletProvider>
    <App />
  </AppWalletProvider>
);