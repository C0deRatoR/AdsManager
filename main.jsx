import React from "react";
import { createRoot } from "react-dom/client";
import AdCampaignDashboard from "./ad-campaign-dashboard.jsx";

window.storage ||= {
  async get(key) {
    return { value: localStorage.getItem(key) };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

createRoot(document.getElementById("root")).render(<AdCampaignDashboard />);
