# PRD — Campaign Control Room Dashboard

## Problem
Gaurav runs Meta ads for Imperio + consulting clients. No single view of live campaigns, their targeting, budget, destination, and current test. Info scattered across Ads Manager tabs.

## Goal
One dashboard. Open it, see every campaign's state at a glance. Structured Campaign → Ad Set → Ad, like an n8n tree.

## Users
Gaurav only. Single-player tool.

## Core requirements

**Campaign level (always visible on card, no click needed)**
- Name
- Start date, End date
- Live status: LIVE / SCHEDULED / ENDED (auto-computed from dates)
- Timeline bar (visual progress start→end)
- Age range
- Gender
- Location
- Budget/day
- Destination: Lead Form / WhatsApp / Website / Other
- Google Sheet link — shown only when destination = Lead Form
- Testing note — free text, e.g. "Testing creative A/B", "Testing audience"

**Ad Set level (nested, collapsible)**
- Name
- Budget/day
- Status (Active/Paused)

**Ad level (nested under Ad Set)**
- Name
- Creative type (Image/Video/Carousel/Reel)
- Status (Active/Paused)

## Actions
- Add / edit / delete at all 3 levels
- Collapse/expand campaign and ad set
- Data persists across sessions (per-user, private)

## Out of scope (v1)
- No live sync with Meta Ads API — manual entry
- No multi-user sharing
- No performance metrics (CTR, CPL, spend) — structure/status only

## Success
Gaurav opens dashboard → sees campaign structure + live status + current test in under 5 seconds, no digging into Ads Manager.
