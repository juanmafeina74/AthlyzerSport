import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./router";
import { installSessionGuard } from "./components/services/sessionGuard";
import "./index.css";

installSessionGuard();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
