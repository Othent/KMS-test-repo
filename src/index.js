import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));

// Not using React.StrictMode here as that would involve additional checks in App.js to make sure Othent is not
// instantiated twice, which can create some issues in certain flows (e.g. logInWithRedirect).

root.render(<App />);
