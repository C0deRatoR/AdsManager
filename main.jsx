import React from "react";
import { createRoot } from "react-dom/client";
import AdCampaignDashboard from "./ad-campaign-dashboard.jsx";
import { createCloudStorage } from "./cloud-storage.js";

const localMode = import.meta.env.VITE_STORAGE_MODE === "local" || !import.meta.env.PROD;

window.storage ||= {
  async get(key) {
    return { value: localStorage.getItem(key) };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

const storage = localMode ? window.storage : createCloudStorage();

createRoot(document.getElementById("root")).render(
  <AdCampaignDashboard storage={storage} syncStatus={localMode ? "Saved in this browser — export before clearing browser data" : "Cloud storage"} />,
);
