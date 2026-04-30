import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import "./styles.css";
import 'bootstrap-icons/font/bootstrap-icons.css';

import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);