import React, { useEffect, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { formatNodeData } from "./node-data.js";
import {
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  FileImage,
  GalleryHorizontalEnd,
  Image as ImageIcon,
  Layers3,
  Link2,
  MapPin,
  Maximize2,
  Megaphone,
  Minus,
  MousePointerClick,
  Pencil,
  Plus,
  Trash2,
  Users,
  Video,
  X,
  Zap,
} from "lucide-react";

const STORAGE_KEY = "adops-campaigns-v1";
const MAX_UPLOAD_BYTES = import.meta.env.PROD ? 100_000_000 : 3_000_000;
const CANVAS_WIDTH = 1110;
const GEOMETRY = {
  campaign: { x: 52, width: 328, minHeight: 108 },
  adset: { x: 468, width: 256, minHeight: 96 },
  ad: { x: 820, width: 236, minHeight: 96 },
};

const colors = {
  bg: "#111210",
  canvas: "#171816",
  panel: "#1d1e1b",
  node: "#242522",
  nodeAlt: "#20211f",
  border: "#3a3b36",
  text: "#f3f4ef",
  muted: "#a5a79d",
  faint: "#72756c",
  accent: "#ff6d5a",
  blue: "#58a6ff",
  green: "#43c887",
  yellow: "#e6b94f",
  red: "#ef6b68",
};

const nodeKey = (kind, id) => `${kind}-${id}`;
const destinationLabels = {
  lead_form: "Lead Form",
  whatsapp: "WhatsApp",
  website: "Website",
  other: "Other",
};
const conversionByDestination = {
  lead_form: "Instant Forms",
  whatsapp: "WhatsApp",
  website: "Website",
};

function localDateOffset(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const seedCampaigns = [
  {
    id: "campaign-imperio-leads",
    name: "Imperio Railing - Lead Generation",
    objective: "Leads",
    startDate: localDateOffset(-7),
    endDate: localDateOffset(21),
    ageMin: 28,
    ageMax: 60,
    gender: "All",
    location: "Delhi NCR",
    budget: 2500,
    currency: "INR",
    destination: "lead_form",
    sheetLink: "https://docs.google.com/spreadsheets/",
    testingNote: "Testing homeowner audience against lookalike",
    adsets: [
      {
        id: "adset-homeowners",
        name: "Homeowners - Delhi NCR",
        budget: 1500,
        status: "Active",
        ads: [
          { id: "ad-balcony-video", name: "Balcony Transformation", status: "Active", creativeType: "Video" },
          { id: "ad-proof-carousel", name: "Installations & Proof", status: "Active", creativeType: "Carousel" },
        ],
      },
      {
        id: "adset-lookalike",
        name: "Lead Lookalike 2%",
        budget: 1000,
        status: "Active",
        ads: [{ id: "ad-safety-image", name: "Safety First", status: "Paused", creativeType: "Image" }],
      },
    ],
  },
  {
    id: "campaign-consulting",
    name: "Consulting - Discovery Calls",
    objective: "Leads",
    startDate: localDateOffset(5),
    endDate: localDateOffset(35),
    ageMin: 24,
    ageMax: 50,
    gender: "All",
    location: "India",
    budget: 1200,
    currency: "INR",
    destination: "website",
    sheetLink: "",
    testingNote: "Testing founder-led reel against static offer",
    adsets: [
      {
        id: "adset-founders",
        name: "Founders & Operators",
        budget: 1200,
        status: "Paused",
        ads: [{ id: "ad-founder-reel", name: "Founder Story", status: "Paused", creativeType: "Video" }],
      },
    ],
  },
];

function todayIso() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function liveState(start, end, today = todayIso()) {
  if (!start) return "DRAFT";
  if (end && today > end) return "ENDED";
  if (today < start) return "SCHEDULED";
  return "ACTIVE";
}

export function timelinePercent(start, end, today = todayIso()) {
  if (!start || !end || end < start) return 0;
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  const todayTime = new Date(`${today}T00:00:00`).getTime();
  if (![startTime, endTime, todayTime].every(Number.isFinite)) return 0;
  if (today <= start) return 0;
  if (today >= end) return 100;
  return Math.max(0, Math.min(100, Math.round(((todayTime - startTime) / (endTime - startTime)) * 100)));
}

function uid(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
}

function newCampaign() {
  return {
    id: uid("campaign"),
    name: "Untitled campaign",
    objective: "Leads",
    startDate: "",
    endDate: "",
    ageMin: 18,
    ageMax: 65,
    gender: "All",
    location: "",
    budget: "",
    currency: "INR",
    destination: "lead_form",
    sheetLink: "",
    testingNote: "",
    adsets: [],
  };
}

function newAdSet() {
  return {
    id: uid("adset"),
    name: "Untitled ad set",
    conversionLocation: "Website",
    startDate: "",
    endDate: "",
    location: "",
    ageMin: 18,
    ageMax: 65,
    gender: "All",
    detailedTargeting: "",
    device: "All Devices",
    platforms: [],
    ads: [],
  };
}

function newAd() {
  return { id: uid("ad"), name: "Untitled ad", status: "Active", creativeType: "Image", destinationUrl: "", formName: "", sheetLink: "", instagramHandle: "", mobileNumber: "", creatives: [] };
}

function readCreative(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string"
      ? resolve({ name: file.name, type: file.type, dataUrl: reader.result })
      : reject(new Error("Creative could not be read"));
    reader.onerror = () => reject(reader.error || new Error("Creative could not be read"));
    reader.readAsDataURL(file);
  });
}

async function storeCreative(file) {
  if (!import.meta.env.PROD) return readCreative(file);
  const filename = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-") || "creative";
  const blob = await upload(`creatives/${filename}`, file, {
    access: "public",
    contentType: file.type,
    handleUploadUrl: "/api/uploads",
  });
  return { name: file.name, type: file.type, dataUrl: blob.url, pathname: blob.pathname };
}

const nodeFields = (item) => formatNodeData(item).slice(0, 3);

function nodeHeight(kind, item) {
  return Math.max(GEOMETRY[kind].minHeight, 98 + nodeFields(item).length * 34);
}

function buildLayout(campaigns, collapsedCampaigns, collapsedAdSets) {
  const nodes = [];
  const edges = [];
  let top = 86;

  campaigns.forEach((campaign) => {
    const campaignHeight = nodeHeight("campaign", campaign);
    const campaignClosed = Boolean(collapsedCampaigns[campaign.id]);
    const groups = campaignClosed
      ? []
      : campaign.adsets.map((adset) => {
          const visibleAds = collapsedAdSets[adset.id] ? [] : adset.ads;
          const adsHeight = visibleAds.length
            ? visibleAds.reduce((height, ad) => height + nodeHeight("ad", ad), 0) + (visibleAds.length - 1) * 18
            : 0;
          return { adset, visibleAds, adsHeight, adsetHeight: nodeHeight("adset", adset), height: Math.max(nodeHeight("adset", adset), adsHeight) };
        });
    const childrenHeight = groups.reduce((sum, group) => sum + group.height, 0) + Math.max(0, groups.length - 1) * 26;
    const groupHeight = Math.max(campaignHeight, childrenHeight);
    const campaignY = top + (groupHeight - campaignHeight) / 2;
    const campaignNode = { kind: "campaign", item: campaign, ...GEOMETRY.campaign, height: campaignHeight, y: campaignY };
    nodes.push(campaignNode);

    let groupTop = top + (groupHeight - childrenHeight) / 2;
    groups.forEach(({ adset, visibleAds, adsHeight, adsetHeight, height }) => {
      const adsetY = groupTop + (height - adsetHeight) / 2;
      const adsetNode = { kind: "adset", item: adset, campaignId: campaign.id, ...GEOMETRY.adset, height: adsetHeight, y: adsetY };
      nodes.push(adsetNode);
      edges.push({
        key: `campaign-${campaign.id}-${adset.id}`,
        from: [campaignNode.x + campaignNode.width, campaignNode.y + campaignNode.height / 2],
        to: [adsetNode.x, adsetNode.y + adsetNode.height / 2],
      });

      let adTop = groupTop + (height - adsHeight) / 2;
      visibleAds.forEach((ad) => {
        const height = nodeHeight("ad", ad);
        const adNode = { kind: "ad", item: ad, campaignId: campaign.id, adsetId: adset.id, ...GEOMETRY.ad, height, y: adTop };
        nodes.push(adNode);
        edges.push({
          key: `adset-${adset.id}-${ad.id}`,
          from: [adsetNode.x + adsetNode.width, adsetNode.y + adsetNode.height / 2],
          to: [adNode.x, adNode.y + adNode.height / 2],
        });
        adTop += height + 18;
      });
      groupTop += height + 26;
    });

    top += groupHeight + 54;
  });

  return { nodes, edges, height: Math.max(620, top + 20) };
}

function selectionForNode(node) {
  if (node.kind === "campaign") return { kind: "campaign", campaignId: node.item.id };
  if (node.kind === "adset") return { kind: "adset", campaignId: node.campaignId, adsetId: node.item.id };
  return { kind: "ad", campaignId: node.campaignId, adsetId: node.adsetId, adId: node.item.id };
}

function selectedRecord(campaigns, selected) {
  if (!selected) return null;
  const campaign = campaigns.find((item) => item.id === selected.campaignId);
  if (!campaign) return null;
  if (selected.kind === "campaign") return { campaign, item: campaign };
  const adset = campaign.adsets.find((item) => item.id === selected.adsetId);
  if (!adset) return null;
  if (selected.kind === "adset") return { campaign, adset, item: adset };
  const ad = adset.ads.find((item) => item.id === selected.adId);
  return ad ? { campaign, adset, ad, item: ad } : null;
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(`${value}T00:00:00`);
  if (!Number.isFinite(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(
    date,
  );
}

function formatBudget(value, currency = "INR") {
  if (value === "" || value === null || value === undefined) return "Budget not set";
  try {
    return `${new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value))}/day`;
  } catch {
    return `${currency} ${value}/day`;
  }
}

function stateStyle(state) {
  const palette = {
    ACTIVE: [colors.green, "#163428"],
    SCHEDULED: [colors.yellow, "#382f18"],
    ENDED: [colors.red, "#3b2020"],
    DRAFT: [colors.muted, "#30312d"],
  };
  const [color, background] = palette[state];
  return { color, background, border: `1px solid ${color}55` };
}

function CreativeIcon({ type, size = 15 }) {
  if (type === "Video" || type === "Reel") return <Video size={size} />;
  if (type === "Carousel") return <GalleryHorizontalEnd size={size} />;
  return <ImageIcon size={size} />;
}

function IconButton({ label, children, danger = false, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      style={{
        width: 28,
        height: 28,
        display: "inline-grid",
        placeItems: "center",
        padding: 0,
        color: danger ? colors.red : colors.muted,
        background: "transparent",
        border: "1px solid transparent",
        borderRadius: 6,
        cursor: "pointer",
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function NodeShell({ node, selected, children, onSelect }) {
  const active = selected && node.item.id === (node.kind === "campaign" ? selected.campaignId : node.kind === "adset" ? selected.adsetId : selected.adId);
  return (
    <article
      onClick={onSelect}
      role="group"
      aria-label={`${node.kind} ${node.item.name}`}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        boxSizing: "border-box",
        color: colors.text,
        background: node.kind === "campaign" ? colors.node : colors.nodeAlt,
        border: `1px solid ${active ? colors.blue : colors.border}`,
        boxShadow: active ? `0 0 0 2px ${colors.blue}2e, 0 14px 28px #00000038` : "0 12px 24px #00000028",
        borderRadius: 8,
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      {children}
    </article>
  );
}

function Toolbar({ children }) {
  return (
    <div
      onClick={(event) => event.stopPropagation()}
      style={{ display: "flex", alignItems: "center", flexShrink: 0, marginRight: -6 }}
    >
      {children}
    </div>
  );
}

function NodeFields({ item }) {
  return <div style={{ display: "grid", gap: 5 }}>{nodeFields(item).map(({ label, value }) => <div key={label} style={{ minWidth: 0, padding: "5px 7px", background: "#1b1c19", border: "1px solid #30312d", borderRadius: 6 }}><div style={{ color: colors.faint, fontSize: 8, lineHeight: "10px", textTransform: "uppercase" }}>{label}</div><div title={value} style={{ color: colors.text, fontSize: 10, lineHeight: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div></div>)}</div>;
}

function NodeCard({ node, selected, actions, icon, label, fallbackName, status }) {
  return <NodeShell node={node} selected={selected} onSelect={actions.select}>
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box", display: "grid", alignContent: "start", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9, minWidth: 0 }}>
        {icon}<div style={{ minWidth: 0, flex: 1 }}><div style={{ color: colors.faint, fontSize: 9, lineHeight: "11px", textTransform: "uppercase" }}>{label}</div><div title={node.item.name} style={{ marginTop: 2, fontSize: 13, lineHeight: "17px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.item.name || fallbackName}</div></div><Toolbar>{actions.children}</Toolbar>
      </div>
      <NodeFields item={node.item} />
      {status}
    </div>
  </NodeShell>;
}

function CampaignNode({ node, selected, collapsed, actions }) {
  const state = liveState(node.item.startDate, node.item.endDate);
  return <NodeCard node={node} selected={selected} actions={{ ...actions, children: <><IconButton label="Edit campaign" onClick={actions.select}><Pencil size={14} /></IconButton><IconButton label="Add ad set" onClick={actions.add}><Plus size={15} /></IconButton><IconButton label={collapsed ? "Expand campaign" : "Collapse campaign"} onClick={actions.toggle}>{collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}</IconButton><IconButton label="Delete campaign" danger onClick={actions.remove}><Trash2 size={14} /></IconButton></> }} icon={<div style={{ width: 31, height: 31, borderRadius: 6, display: "grid", placeItems: "center", background: "#43251f", color: colors.accent, flexShrink: 0 }}><Megaphone size={17} /></div>} label="Campaign" fallbackName="Untitled campaign" status={<span style={{ ...stateStyle(state), justifySelf: "start", padding: "3px 6px", borderRadius: 5, fontSize: 9, lineHeight: "11px", fontWeight: 800 }}>{state}</span>} />;
}

function AdSetNode({ node, selected, collapsed, actions }) {
  const state = liveState(node.item.startDate ?? node.startDate, node.item.endDate ?? node.endDate);
  return <NodeCard node={node} selected={selected} actions={{ ...actions, children: <><IconButton label="Edit ad set" onClick={actions.select}><Pencil size={13} /></IconButton><IconButton label="Add ad" onClick={actions.add}><Plus size={14} /></IconButton><IconButton label={collapsed ? "Expand ad set" : "Collapse ad set"} onClick={actions.toggle}>{collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}</IconButton><IconButton label="Delete ad set" danger onClick={actions.remove}><Trash2 size={13} /></IconButton></> }} icon={<div style={{ width: 31, height: 31, borderRadius: 6, display: "grid", placeItems: "center", background: "#1f3445", color: colors.blue, flexShrink: 0 }}><Layers3 size={17} /></div>} label="Ad set" fallbackName="Untitled ad set" status={<StatusDot active={state === "ACTIVE"} label={state[0] + state.slice(1).toLowerCase()} />} />;
}

function AdNode({ node, selected, actions }) {
  return <NodeCard node={node} selected={selected} actions={{ ...actions, children: <><IconButton label="Edit ad" onClick={actions.select}><Pencil size={13} /></IconButton><IconButton label="Delete ad" danger onClick={actions.remove}><Trash2 size={13} /></IconButton></> }} icon={<div style={{ width: 31, height: 31, borderRadius: 6, display: "grid", placeItems: "center", background: "#352b42", color: "#c49cff", flexShrink: 0 }}><FileImage size={17} /></div>} label="Ad" fallbackName="Untitled ad" status={<StatusDot active={node.item.status === "Active"} label={node.item.status} />} />;
}

function StatusDot({ active, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: active ? colors.green : colors.muted, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: active ? colors.green : colors.faint }} /> {label}
    </span>
  );
}

const inputStyle = {
  width: "100%",
  height: 38,
  boxSizing: "border-box",
  padding: "8px 10px",
  color: colors.text,
  background: "#151613",
  border: `1px solid ${colors.border}`,
  borderRadius: 6,
  font: "inherit",
  fontSize: 12,
};

function Field({ label, children, wide = false }) {
  return (
    <label style={{ display: "block", minWidth: 0, gridColumn: wide ? "1 / -1" : undefined }}>
      <span style={{ display: "block", marginBottom: 6, color: colors.muted, fontSize: 10, lineHeight: "13px", textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}

function DetailsPanel({ selected, record, compact, onClose, updateCampaign, updateAdSet, updateAd, addAdSet, addAd, removeCampaign, removeAdSet, removeAd }) {
  const [uploading, setUploading] = useState(false);
  const kind = selected?.kind;
  const item = record?.item;
  const panelTitle = kind === "campaign" ? "Campaign" : kind === "adset" ? "Ad set" : kind === "ad" ? "Ad" : "Details";
  const PanelIcon = kind === "campaign" ? Megaphone : kind === "adset" ? Layers3 : FileImage;
  const platforms = Array.isArray(item?.platforms) ? item.platforms : [];
  const creativeType = item?.creativeType === "Reel" ? "Video" : item?.creativeType || "Image";
  const creatives = Array.isArray(item?.creatives) ? item.creatives : [];
  const conversionLocation = record?.adset?.conversionLocation ?? conversionByDestination[record?.campaign?.destination] ?? "Website";

  const uploadCreative = async (event) => {
    const selectedFiles = [...(event.target.files || [])];
    event.target.value = "";
    if (!selectedFiles.length) return;
    const files = creativeType === "Carousel" ? selectedFiles : selectedFiles.slice(0, 1);
    const valid = files.every((file) => creativeType === "Image"
      ? file.type.startsWith("image/")
      : creativeType === "Video"
        ? file.type.startsWith("video/")
        : /^(image|video)\//.test(file.type));
    if (!valid) return window.alert(`Choose ${creativeType === "Image" ? "an image" : creativeType === "Video" ? "a video" : "images or videos"}.`);
    const tooLarge = import.meta.env.PROD
      ? files.some((file) => file.size > MAX_UPLOAD_BYTES)
      : files.reduce((size, file) => size + file.size, 0) > MAX_UPLOAD_BYTES;
    if (tooLarge) return window.alert(import.meta.env.PROD ? "Keep each creative under 100 MB." : "Keep creative uploads under 3 MB total in this local preview.");
    setUploading(true);
    try {
      updateAd({ creatives: await Promise.all(files.map(storeCreative)) });
    } catch (error) {
      console.error("Creative could not be uploaded.", error);
      window.alert("Creative could not be uploaded. Try another file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <aside
      style={{
        position: compact ? "fixed" : "relative",
        top: compact ? 0 : undefined,
        right: compact ? 0 : undefined,
        zIndex: 40,
        width: compact ? "min(92vw, 380px)" : 380,
        minWidth: compact ? 0 : 380,
        height: compact ? "100dvh" : "100%",
        boxSizing: "border-box",
        color: colors.text,
        background: colors.panel,
        borderLeft: `1px solid ${colors.border}`,
        boxShadow: compact ? "-18px 0 44px #00000078" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 64, padding: "0 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 6, background: "#2b2c28", color: colors.muted }}><PanelIcon size={16} /></div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: colors.faint, fontSize: 9, lineHeight: "11px", textTransform: "uppercase" }}>{panelTitle} details</div>
          {(kind === "adset" || kind === "ad") && item ? (
            <input aria-label={`${panelTitle} name`} value={item.name} onChange={(event) => (kind === "adset" ? updateAdSet : updateAd)({ name: event.target.value })} style={{ width: "100%", height: 24, boxSizing: "border-box", marginTop: 2, padding: "2px 5px", color: colors.text, background: "#151613", border: `1px solid ${colors.border}`, borderRadius: 4, font: "inherit", fontSize: 13, fontWeight: 700 }} />
          ) : (
            <div title={item?.name} style={{ marginTop: 2, fontSize: 13, lineHeight: "17px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item?.name || "No selection"}</div>
          )}
        </div>
        <IconButton label="Close details" onClick={onClose}><X size={17} /></IconButton>
      </div>

      {!item ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 28, color: colors.faint, fontSize: 12, textAlign: "center" }}>No campaign selected</div>
      ) : (
        <form onSubmit={(event) => event.preventDefault()} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: 18 }}>
          {kind === "campaign" && (
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Campaign name"><input style={inputStyle} value={item.name} onChange={(event) => updateCampaign({ name: event.target.value })} /></Field>
              <Field label="Campaign objective">
                <select style={inputStyle} value={item.objective || "Leads"} onChange={(event) => updateCampaign({ objective: event.target.value })}>
                  <option>Awareness</option><option>Traffic</option><option>Engagement</option><option>Leads</option><option>App Promotion</option><option>Sales</option>
                </select>
              </Field>
              <Field label="Campaign budget per day"><input type="number" min="0" step="1" style={inputStyle} value={item.budget} onChange={(event) => updateCampaign({ budget: event.target.value })} /></Field>
            </div>
          )}

          {kind === "adset" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Conversion location" wide>
                <select style={inputStyle} value={conversionLocation} onChange={(event) => {
                  const nextLocation = event.target.value;
                  const keepMobile = (conversionLocation === "WhatsApp" && nextLocation === "Calls") || (conversionLocation === "Calls" && nextLocation === "WhatsApp");
                  updateAdSet({
                    conversionLocation: nextLocation,
                    ads: item.ads.map((ad) => ({ ...ad, destinationUrl: "", formName: "", sheetLink: "", instagramHandle: "", mobileNumber: keepMobile ? ad.mobileNumber || "" : "" })),
                  });
                }}>
                  <option>Website</option><option>Instant Forms</option><option>Instagram</option><option>WhatsApp</option><option>Calls</option><option>App</option>
                </select>
              </Field>
              <Field label="Start date"><input type="date" max={item.endDate ?? record?.campaign?.endDate ?? ""} style={inputStyle} value={item.startDate ?? record?.campaign?.startDate ?? ""} onChange={(event) => updateAdSet({ startDate: event.target.value })} /></Field>
              <Field label="End date"><input type="date" min={item.startDate ?? record?.campaign?.startDate ?? ""} style={inputStyle} value={item.endDate ?? record?.campaign?.endDate ?? ""} onChange={(event) => updateAdSet({ endDate: event.target.value })} /></Field>
              <Field label="Location" wide><input style={inputStyle} value={item.location ?? record?.campaign?.location ?? ""} onChange={(event) => updateAdSet({ location: event.target.value })} /></Field>
              <Field label="Minimum age"><input type="number" min="13" max="65" style={inputStyle} value={item.ageMin ?? record?.campaign?.ageMin ?? 18} onChange={(event) => updateAdSet({ ageMin: event.target.value })} /></Field>
              <Field label="Maximum age"><input type="number" min="13" max="65" style={inputStyle} value={item.ageMax ?? record?.campaign?.ageMax ?? 65} onChange={(event) => updateAdSet({ ageMax: event.target.value })} /></Field>
              <Field label="Gender" wide>
                <select style={inputStyle} value={item.gender ?? record?.campaign?.gender ?? "All"} onChange={(event) => updateAdSet({ gender: event.target.value })}>
                  <option>All</option><option>Women</option><option>Men</option>
                </select>
              </Field>
              <Field label="Detailed targeting" wide><textarea rows={4} style={{ ...inputStyle, height: 88, resize: "vertical" }} value={item.detailedTargeting || ""} onChange={(event) => updateAdSet({ detailedTargeting: event.target.value })} /></Field>
              <Field label="Device" wide>
                <select style={inputStyle} value={item.device || "All Devices"} onChange={(event) => updateAdSet({ device: event.target.value })}>
                  <option>All Devices</option><option>Android Only</option><option>iOS Only</option>
                </select>
              </Field>
              <fieldset style={{ gridColumn: "1 / -1", minWidth: 0, margin: 0, padding: 0, border: 0 }}>
                <legend style={{ marginBottom: 6, padding: 0, color: colors.muted, fontSize: 10, lineHeight: "13px", textTransform: "uppercase" }}>Platforms</legend>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: 10, background: "#151613", border: `1px solid ${colors.border}`, borderRadius: 6 }}>
                  {["Facebook", "Instagram", "Audience Network", "Messenger", "WhatsApp", "Threads"].map((platform) => (
                    <label key={platform} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0, color: colors.text, fontSize: 11 }}>
                      <input type="checkbox" checked={platforms.includes(platform)} onChange={(event) => updateAdSet({ platforms: event.target.checked ? [...platforms, platform] : platforms.filter((value) => value !== platform) })} style={{ accentColor: colors.blue }} />
                      {platform}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {kind === "ad" && (
            <div style={{ display: "grid", gap: 14 }}>
              <Field label="Creative type"><select style={inputStyle} value={creativeType} onChange={(event) => updateAd({ creativeType: event.target.value })}><option>Image</option><option>Video</option><option>Carousel</option></select></Field>
              {conversionLocation === "Website" && <Field label="Destination URL"><input type="url" placeholder="https://example.com/" style={inputStyle} value={item.destinationUrl || ""} onChange={(event) => updateAd({ destinationUrl: event.target.value })} /></Field>}
              {conversionLocation === "Instant Forms" && <>
                <Field label="Form Name"><input type="text" style={inputStyle} value={item.formName || ""} onChange={(event) => updateAd({ formName: event.target.value })} /></Field>
                <Field label="Google Sheet URL"><input type="url" placeholder="https://docs.google.com/spreadsheets/..." style={inputStyle} value={item.sheetLink || ""} onChange={(event) => updateAd({ sheetLink: event.target.value })} /></Field>
              </>}
              {conversionLocation === "Instagram" && <Field label="Instagram Handle"><input type="text" style={inputStyle} value={item.instagramHandle || ""} onChange={(event) => updateAd({ instagramHandle: event.target.value })} /></Field>}
              {(conversionLocation === "WhatsApp" || conversionLocation === "Calls") && <Field label="Mobile Number"><input type="tel" style={inputStyle} value={item.mobileNumber || ""} onChange={(event) => updateAd({ mobileNumber: event.target.value })} /></Field>}
              <Field label="Show creative">
                <input key={`${item.id}-${creativeType}`} type="file" accept={creativeType === "Image" ? "image/*" : creativeType === "Video" ? "video/*" : "image/*,video/*"} multiple={creativeType === "Carousel"} disabled={uploading} onChange={uploadCreative} style={{ ...inputStyle, height: "auto", opacity: uploading ? 0.65 : 1 }} />
                {uploading && <span style={{ display: "block", marginTop: 6, color: colors.muted, fontSize: 11 }}>Uploading creative...</span>}
              </Field>
              {creatives.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: creatives.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr", gap: 8 }}>
                    {creatives.map((creative, index) => creative.type?.startsWith("video/") ? (
                      <video key={`${creative.name}-${index}`} src={creative.dataUrl} controls preload="metadata" aria-label={creative.name} style={{ width: "100%", maxHeight: 190, objectFit: "contain", background: "#0d0e0c", border: `1px solid ${colors.border}`, borderRadius: 6 }} />
                    ) : (
                      <img key={`${creative.name}-${index}`} src={creative.dataUrl} alt={creative.name || "Ad creative"} style={{ width: "100%", maxHeight: 190, objectFit: "contain", background: "#0d0e0c", border: `1px solid ${colors.border}`, borderRadius: 6 }} />
                    ))}
                  </div>
                  <button type="button" onClick={() => updateAd({ creatives: [] })} style={{ ...dangerButtonStyle, width: "fit-content", height: 32 }}><X size={14} /> Clear creative</button>
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {item && (
        <div style={{ minHeight: 68, padding: "12px 18px", boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderTop: `1px solid ${colors.border}`, flexShrink: 0 }}>
          {kind !== "ad" ? (
            <button type="button" onClick={kind === "campaign" ? addAdSet : addAd} style={primaryButtonStyle}>
              <Plus size={15} /> Add {kind === "campaign" ? "ad set" : "ad"}
            </button>
          ) : <span />}
          <button type="button" onClick={kind === "campaign" ? removeCampaign : kind === "adset" ? removeAdSet : removeAd} style={dangerButtonStyle}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </aside>
  );
}

const primaryButtonStyle = {
  height: 36,
  padding: "0 12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 7,
  color: "#1a1a17",
  background: colors.text,
  border: 0,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle = {
  ...primaryButtonStyle,
  color: colors.red,
  background: "transparent",
  border: `1px solid ${colors.red}66`,
};

export default function AdCampaignDashboard({ storage = window.storage, syncStatus = "Local only" }) {
  const [campaigns, setCampaigns] = useState(seedCampaigns);
  const [loaded, setLoaded] = useState(false);
  const [storageWritable, setStorageWritable] = useState(false);
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches);
  const [selected, setSelected] = useState(() => compact ? null : { kind: "campaign", campaignId: seedCampaigns[0].id });
  const [collapsedCampaigns, setCollapsedCampaigns] = useState({});
  const [collapsedAdSets, setCollapsedAdSets] = useState({});
  const [zoom, setZoom] = useState(0.85);
  const [view, setView] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const canvasRef = useRef(null);
  const panRef = useRef(null);
  const ignoreClickRef = useRef(false);
  const historyRef = useRef([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await storage.get(STORAGE_KEY, { shared: false });
        const raw = stored && typeof stored === "object" && "value" in stored ? stored.value : stored;
        if (raw == null) {
          if (active) {
            setCampaigns(seedCampaigns);
            setStorageWritable(true);
          }
          return;
        }
        const parsed = JSON.parse(raw);
        const valid = Array.isArray(parsed) && parsed.every(
          (campaign) => campaign && Array.isArray(campaign.adsets) && campaign.adsets.every((adset) => adset && Array.isArray(adset.ads)),
        );
        if (!valid) throw new Error("Stored campaigns do not match the campaign data model");
        if (active) {
          setCampaigns(parsed);
          setStorageWritable(true);
        }
      } catch (error) {
        console.warn("Campaign storage could not be read; using seed data.", error);
        if (active) {
          setCampaigns(seedCampaigns);
          setStorageWritable(false);
        }
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [storage]);

  useEffect(() => {
    if (!loaded || !storageWritable) return;
    (async () => {
      try {
        await storage.set(STORAGE_KEY, JSON.stringify(campaigns), { shared: false });
      } catch (error) {
        console.error("Campaign changes could not be saved.", error);
        window.alert("Campaign changes could not be saved. Try again.");
      }
    })();
  }, [campaigns, loaded, storage, storageWritable]);

  const commitCampaigns = (update) => {
    historyRef.current = [...historyRef.current.slice(-49), structuredClone(campaigns)];
    setCampaigns((items) => typeof update === "function" ? update(items) : update);
  };

  useEffect(() => {
    const undo = (event) => {
      if ((!event.ctrlKey && !event.metaKey) || event.key.toLowerCase() !== "z" || event.shiftKey) return;
      if (event.target?.closest?.("input, textarea, select, [contenteditable='true']")) return;
      const previous = historyRef.current.pop();
      if (!previous) return;
      event.preventDefault();
      setCampaigns(previous);
    };
    window.addEventListener("keydown", undo);
    return () => window.removeEventListener("keydown", undo);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const record = useMemo(() => selectedRecord(campaigns, selected), [campaigns, selected]);
  const layout = useMemo(() => buildLayout(campaigns, collapsedCampaigns, collapsedAdSets), [campaigns, collapsedCampaigns, collapsedAdSets]);
  const counts = useMemo(() => {
    const adsets = campaigns.reduce((sum, campaign) => sum + campaign.adsets.length, 0);
    const ads = campaigns.reduce((sum, campaign) => sum + campaign.adsets.reduce((adSum, adset) => adSum + adset.ads.length, 0), 0);
    return { adsets, ads };
  }, [campaigns]);

  useEffect(() => {
    if (!loaded) return;
    if (selected && !record && campaigns.length) setSelected({ kind: "campaign", campaignId: campaigns[0].id });
    if (!campaigns.length && selected) setSelected(null);
  }, [campaigns, loaded, record, selected]);

  const updateCampaign = (patch) => commitCampaigns((items) => items.map((campaign) => campaign.id === selected.campaignId ? { ...campaign, ...patch } : campaign));
  const updateAdSet = (patch) => commitCampaigns((items) => items.map((campaign) => campaign.id === selected.campaignId ? { ...campaign, adsets: campaign.adsets.map((adset) => adset.id === selected.adsetId ? { ...adset, ...patch } : adset) } : campaign));
  const updateAd = (patch) => commitCampaigns((items) => items.map((campaign) => campaign.id === selected.campaignId ? { ...campaign, adsets: campaign.adsets.map((adset) => adset.id === selected.adsetId ? { ...adset, ads: adset.ads.map((ad) => ad.id === selected.adId ? { ...ad, ...patch } : ad) } : adset) } : campaign));

  const addCampaign = () => {
    const campaign = newCampaign();
    commitCampaigns((items) => [...items, campaign]);
    setSelected({ kind: "campaign", campaignId: campaign.id });
  };

  const addAdSet = (campaignId = selected?.campaignId) => {
    if (!campaignId) return;
    const adset = newAdSet();
    commitCampaigns((items) => items.map((campaign) => campaign.id === campaignId ? { ...campaign, adsets: [...campaign.adsets, adset] } : campaign));
    setCollapsedCampaigns((items) => ({ ...items, [campaignId]: false }));
    setSelected({ kind: "adset", campaignId, adsetId: adset.id });
  };

  const addAd = (campaignId = selected?.campaignId, adsetId = selected?.adsetId) => {
    if (!campaignId || !adsetId) return;
    const ad = newAd();
    commitCampaigns((items) => items.map((campaign) => campaign.id === campaignId ? { ...campaign, adsets: campaign.adsets.map((adset) => adset.id === adsetId ? { ...adset, ads: [...adset.ads, ad] } : adset) } : campaign));
    setCollapsedCampaigns((items) => ({ ...items, [campaignId]: false }));
    setCollapsedAdSets((items) => ({ ...items, [adsetId]: false }));
    setSelected({ kind: "ad", campaignId, adsetId, adId: ad.id });
  };

  const removeCampaign = (campaignId = selected?.campaignId) => {
    if (!campaignId || !window.confirm("Delete this campaign and all of its ad sets and ads?")) return;
    const next = campaigns.filter((campaign) => campaign.id !== campaignId);
    commitCampaigns(next);
    setSelected(next[0] ? { kind: "campaign", campaignId: next[0].id } : null);
  };

  const removeAdSet = (campaignId = selected?.campaignId, adsetId = selected?.adsetId) => {
    if (!campaignId || !adsetId || !window.confirm("Delete this ad set and all of its ads?")) return;
    commitCampaigns((items) => items.map((campaign) => campaign.id === campaignId ? { ...campaign, adsets: campaign.adsets.filter((adset) => adset.id !== adsetId) } : campaign));
    setSelected({ kind: "campaign", campaignId });
  };

  const removeAd = (campaignId = selected?.campaignId, adsetId = selected?.adsetId, adId = selected?.adId) => {
    if (!campaignId || !adsetId || !adId || !window.confirm("Delete this ad?")) return;
    commitCampaigns((items) => items.map((campaign) => campaign.id === campaignId ? { ...campaign, adsets: campaign.adsets.map((adset) => adset.id === adsetId ? { ...adset, ads: adset.ads.filter((ad) => ad.id !== adId) } : adset) } : campaign));
    setSelected({ kind: "adset", campaignId, adsetId });
  };

  const toggleCampaign = (campaignId) => {
    const closing = !collapsedCampaigns[campaignId];
    setCollapsedCampaigns((items) => ({ ...items, [campaignId]: closing }));
    if (closing && selected?.campaignId === campaignId && selected.kind !== "campaign") setSelected({ kind: "campaign", campaignId });
  };

  const toggleAdSet = (campaignId, adsetId) => {
    const closing = !collapsedAdSets[adsetId];
    setCollapsedAdSets((items) => ({ ...items, [adsetId]: closing }));
    if (closing && selected?.adsetId === adsetId && selected.kind === "ad") setSelected({ kind: "adset", campaignId, adsetId });
  };

  const startPan = (event) => {
    if (event.button !== 0 || event.target.closest("button, a, input, select, textarea")) return;
    panRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y, moved: false };
    setPanning(true);
  };

  const movePan = (event) => {
    const pan = panRef.current;
    if (!pan || pan.pointerId !== event.pointerId) return;
    const x = event.clientX - pan.x;
    const y = event.clientY - pan.y;
    if (!pan.moved && Math.hypot(x, y) < 4) return;
    if (!pan.moved) {
      pan.moved = true;
      canvasRef.current.setPointerCapture(event.pointerId);
    }
    setView({ x: pan.viewX + x, y: pan.viewY + y });
    event.preventDefault();
  };

  const endPan = (event) => {
    if (panRef.current?.pointerId !== event.pointerId) return;
    const moved = panRef.current.moved;
    if (canvasRef.current.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
    panRef.current = null;
    setPanning(false);
    if (moved) {
      ignoreClickRef.current = true;
      setTimeout(() => { ignoreClickRef.current = false; }, 0);
    }
  };

  const suppressDraggedClick = (event) => {
    if (!ignoreClickRef.current) return;
    ignoreClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  const renderNode = (node) => {
    const selection = selectionForNode(node);
    const select = () => setSelected(selection);
    if (node.kind === "campaign") {
      return <CampaignNode key={nodeKey(node.kind, node.item.id)} node={node} selected={selected} collapsed={Boolean(collapsedCampaigns[node.item.id])} actions={{ select, add: () => addAdSet(node.item.id), toggle: () => toggleCampaign(node.item.id), remove: () => removeCampaign(node.item.id) }} />;
    }
    if (node.kind === "adset") {
      const campaign = campaigns.find((item) => item.id === node.campaignId);
      return <AdSetNode key={nodeKey(node.kind, node.item.id)} node={{ ...node, startDate: campaign?.startDate, endDate: campaign?.endDate }} selected={selected} collapsed={Boolean(collapsedAdSets[node.item.id])} actions={{ select, add: () => addAd(node.campaignId, node.item.id), toggle: () => toggleAdSet(node.campaignId, node.item.id), remove: () => removeAdSet(node.campaignId, node.item.id) }} />;
    }
    return <AdNode key={nodeKey(node.kind, node.item.id)} node={node} selected={selected} actions={{ select, remove: () => removeAd(node.campaignId, node.adsetId, node.item.id) }} />;
  };

  return (
    <div style={{ height: "100dvh", minHeight: 620, display: "flex", flexDirection: "column", overflow: "hidden", color: colors.text, background: colors.bg, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif", fontSize: 13, letterSpacing: 0 }}>
      <header style={{ height: 64, minHeight: 64, display: "flex", alignItems: "center", gap: compact ? 10 : 18, padding: compact ? "0 12px" : "0 18px", background: "#191a17", borderBottom: `1px solid ${colors.border}`, boxSizing: "border-box", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: compact ? 1 : undefined }}>
          <div style={{ width: 34, height: 34, borderRadius: 7, display: "grid", placeItems: "center", color: colors.text, background: colors.accent, flexShrink: 0 }}><Megaphone size={18} /></div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: compact ? 14 : 15, lineHeight: "19px", fontWeight: 750, whiteSpace: "nowrap" }}>Campaign Control Room</h1>
            {!compact && <div style={{ color: colors.faint, fontSize: 10, lineHeight: "13px" }}>Meta ad workflow</div>}
          </div>
        </div>
        {!compact && <div style={{ height: 26, width: 1, background: colors.border, flexShrink: 0 }} />}
        {!compact && (
          <div style={{ display: "flex", alignItems: "center", gap: 18, color: colors.muted, fontSize: 10, minWidth: 0, flex: 1 }}>
            <span><strong style={{ color: colors.text, fontSize: 12 }}>{campaigns.length}</strong> campaigns</span>
            <span><strong style={{ color: colors.text, fontSize: 12 }}>{counts.adsets}</strong> ad sets</span>
            <span><strong style={{ color: colors.text, fontSize: 12 }}>{counts.ads}</strong> ads</span>
            <span>{syncStatus}</span>
          </div>
        )}
        <button type="button" aria-label="New campaign" title="New campaign" onClick={addCampaign} style={{ ...primaryButtonStyle, width: compact ? 36 : undefined, padding: compact ? 0 : primaryButtonStyle.padding, flexShrink: 0 }}>
          <Plus size={15} /> {!compact && "New campaign"}
        </button>
      </header>

      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <main
          ref={canvasRef}
          onClickCapture={suppressDraggedClick}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
          style={{ position: "relative", flex: 1, minWidth: 0, overflow: "hidden", cursor: panning ? "grabbing" : "grab", userSelect: panning ? "none" : "auto", touchAction: "none", backgroundColor: colors.canvas, backgroundImage: "radial-gradient(#3b3c37 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        >
          <div style={{ position: "absolute", left: 0, top: 0, width: CANVAS_WIDTH, height: layout.height, transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${zoom})`, transformOrigin: "top left" }}>
              <div style={{ position: "absolute", top: 28, left: GEOMETRY.campaign.x, width: GEOMETRY.campaign.width, display: "flex", alignItems: "center", gap: 8, color: colors.faint, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}><Megaphone size={13} /> Campaigns</div>
              <div style={{ position: "absolute", top: 28, left: GEOMETRY.adset.x, width: GEOMETRY.adset.width, display: "flex", alignItems: "center", gap: 8, color: colors.faint, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}><Layers3 size={13} /> Ad sets</div>
              <div style={{ position: "absolute", top: 28, left: GEOMETRY.ad.x, width: GEOMETRY.ad.width, display: "flex", alignItems: "center", gap: 8, color: colors.faint, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}><FileImage size={13} /> Ads</div>

              <svg aria-hidden="true" width={CANVAS_WIDTH} height={layout.height} style={{ position: "absolute", inset: 0, overflow: "visible", zIndex: 1 }}>
                {layout.edges.map((edge) => {
                  const [x1, y1] = edge.from;
                  const [x2, y2] = edge.to;
                  const bend = Math.max(46, (x2 - x1) * 0.48);
                  return <path key={edge.key} d={`M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`} fill="none" stroke="#60625a" strokeWidth="1.5" />;
                })}
              </svg>

              {layout.nodes.map(renderNode)}
              {!campaigns.length && (
                <div style={{ position: "absolute", left: 350, top: 210, width: 410, padding: 28, boxSizing: "border-box", textAlign: "center", color: colors.muted }}>
                  <Megaphone size={26} style={{ marginBottom: 12 }} />
                  <div style={{ marginBottom: 14, color: colors.text, fontSize: 14, fontWeight: 700 }}>No campaigns</div>
                  <button type="button" onClick={addCampaign} style={primaryButtonStyle}><Plus size={15} /> New campaign</button>
                </div>
              )}
          </div>

          <div style={{ position: "absolute", left: 14, bottom: 14, width: 142, height: 38, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", boxSizing: "border-box", color: colors.muted, background: "#20211eee", border: `1px solid ${colors.border}`, borderRadius: 7, boxShadow: "0 8px 20px #00000045", zIndex: 10 }}>
            <IconButton label="Zoom out" onClick={() => setZoom((value) => Math.max(0.65, Number((value - 0.1).toFixed(2))))}><Minus size={15} /></IconButton>
            <span style={{ width: 38, textAlign: "center", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>{Math.round(zoom * 100)}%</span>
            <IconButton label="Reset view" onClick={() => { setZoom(0.85); setView({ x: 0, y: 0 }); }}><Maximize2 size={14} /></IconButton>
            <IconButton label="Zoom in" onClick={() => setZoom((value) => Math.min(1.15, Number((value + 0.1).toFixed(2))))}><Plus size={15} /></IconButton>
          </div>
        </main>

        {(!compact || selected) && (
          <DetailsPanel
            selected={selected}
            record={record}
            compact={compact}
            onClose={() => setSelected(null)}
            updateCampaign={updateCampaign}
            updateAdSet={updateAdSet}
            updateAd={updateAd}
            addAdSet={() => addAdSet()}
            addAd={() => addAd()}
            removeCampaign={() => removeCampaign()}
            removeAdSet={() => removeAdSet()}
            removeAd={() => removeAd()}
          />
        )}
      </div>
    </div>
  );
}
