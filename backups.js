const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const validCreative = (creative) => isObject(creative)
  && typeof creative.name === "string"
  && typeof creative.type === "string"
  && typeof creative.dataUrl === "string";

const validAd = (ad) => isObject(ad)
  && typeof ad.id === "string"
  && typeof ad.name === "string"
  && (ad.creatives === undefined || (Array.isArray(ad.creatives) && ad.creatives.every(validCreative)));

const validAdSet = (adSet) => isObject(adSet)
  && typeof adSet.id === "string"
  && typeof adSet.name === "string"
  && Array.isArray(adSet.ads)
  && adSet.ads.every(validAd);

export const validCampaigns = (campaigns) => Array.isArray(campaigns) && campaigns.every(
  (campaign) => isObject(campaign)
    && typeof campaign.id === "string"
    && typeof campaign.name === "string"
    && Array.isArray(campaign.adsets)
    && campaign.adsets.every(validAdSet),
);

export function parseBackup(source) {
  let backup;
  try {
    backup = JSON.parse(source);
  } catch {
    throw new Error("This is not a valid JSON backup.");
  }
  if (!isObject(backup) || backup.version !== 1 || !validCampaigns(backup.campaigns)) {
    throw new Error("This backup is invalid or uses an unsupported version.");
  }
  return backup.campaigns;
}

export function serializeBackup(campaigns) {
  if (!validCampaigns(campaigns)) throw new Error("Campaign data cannot be exported.");
  return JSON.stringify({ version: 1, campaigns }, null, 2);
}
