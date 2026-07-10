# TRD — Campaign Control Room Dashboard

## Stack
React functional components, inline styles, lucide-react icons. Single-file artifact (`ad-campaign-dashboard.jsx`).

## Data model

```js
Campaign {
  id, name, startDate, endDate,
  ageMin, ageMax, gender, location,
  budget, currency,
  destination: "lead_form" | "whatsapp" | "website" | "other",
  sheetLink,        // only used if destination === lead_form
  testingNote,
  adsets: AdSet[]
}

AdSet {
  id, name, budget, status: "Active" | "Paused",
  ads: Ad[]
}

Ad {
  id, name, status: "Active" | "Paused",
  creativeType: "Image" | "Video" | "Carousel" | "Reel"
}
```

## Persistence
`window.storage` key-value API, personal scope (`shared: false`).
Single key: `adops-campaigns-v1` → JSON-stringified array of Campaign.
Whole array read/written on every mutation (simple last-write-wins, fine for single-user low-frequency edits).

## Derived state
- `liveState(start, end)`: compares today's ISO date to start/end → `LIVE` / `SCHEDULED` / `ENDED` / `DRAFT` (no dates set).
- `pct(start, end)`: % elapsed of campaign window, drives timeline bar width.

## Component tree
```
Dashboard
 ├─ NewCampaignForm / CampaignForm (add/edit)
 └─ CampaignCard[]
     ├─ meta pills (age, location, budget, destination, sheet link, testing note)
     ├─ timeline bar
     └─ AdSetBlock[]
         └─ AdRow[]
```

## Error handling
- `window.storage.get` failures → fall back to seed data, don't block render.
- `window.storage.set` failures → logged to console, UI state still updates optimistically.

## Non-functional
- No localStorage/sessionStorage (unsupported in artifacts).
- No external network calls, no Meta API integration in v1.
- All data typed as text/JSON, well under the 5MB per-key limit.

## Extension points (future)
- Swap manual entry for Meta Marketing API pull (would need a backend proxy, not available directly in artifact sandbox).
- Add spend/CTR/CPL fields to Ad level once API-backed.
- Multi-user shared view: switch storage calls to `shared: true` on a client-scoped key.
