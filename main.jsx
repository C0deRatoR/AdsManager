import React from "react";
import { createRoot } from "react-dom/client";
import AdCampaignDashboard from "./ad-campaign-dashboard.jsx";
import { createCloudStorage } from "./cloud-storage.js";

window.storage ||= {
  async get(key) {
    return { value: localStorage.getItem(key) };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  },
};

const storage = import.meta.env.PROD ? createCloudStorage() : window.storage;

createRoot(document.getElementById("root")).render(
  <AdCampaignDashboard storage={storage} syncStatus={import.meta.env.PROD ? "Cloud storage" : "Local preview"} />,
);
