# Graph Report - AdsManager  (2026-07-10)

## Corpus Check
- 5 files · ~5,874 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 69 nodes · 84 edges · 8 communities (7 shown, 1 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- ad-campaign-dashboard.jsx
- TRD — Campaign Control Room Dashboard
- AdCampaignDashboard
- PRD — Campaign Control Room Dashboard
- CampaignNode
- DetailsPanel
- package.json

## God Nodes (most connected - your core abstractions)
1. `AdCampaignDashboard()` - 9 edges
2. `TRD — Campaign Control Room Dashboard` - 9 edges
3. `PRD — Campaign Control Room Dashboard` - 8 edges
4. `CampaignNode()` - 6 edges
5. `uid()` - 4 edges
6. `liveState()` - 3 edges
7. `newCampaign()` - 3 edges
8. `newAdSet()` - 3 edges
9. `newAd()` - 3 edges
10. `formatDate()` - 3 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (8 total, 1 thin omitted)

### Community 0 - "ad-campaign-dashboard.jsx"
Cohesion: 0.11
Nodes (8): colors, conversionByDestination, dangerButtonStyle, destinationLabels, GEOMETRY, inputStyle, primaryButtonStyle, seedCampaigns

### Community 1 - "TRD — Campaign Control Room Dashboard"
Cohesion: 0.20
Nodes (9): Component tree, Data model, Derived state, Error handling, Extension points (future), Non-functional, Persistence, Stack (+1 more)

### Community 2 - "AdCampaignDashboard"
Cohesion: 0.28
Nodes (9): AdCampaignDashboard(), buildLayout(), newAd(), newAdSet(), newCampaign(), nodeKey(), selectedRecord(), selectionForNode() (+1 more)

### Community 3 - "PRD — Campaign Control Room Dashboard"
Cohesion: 0.22
Nodes (8): Actions, Core requirements, Goal, Out of scope (v1), PRD — Campaign Control Room Dashboard, Problem, Success, Users

### Community 4 - "CampaignNode"
Cohesion: 0.33
Nodes (7): AdSetNode(), CampaignNode(), formatBudget(), formatDate(), liveState(), stateStyle(), timelinePercent()

### Community 6 - "package.json"
Cohesion: 0.20
Nodes (9): dependencies, lucide-react, react, react-dom, vite, private, scripts, dev (+1 more)

## Knowledge Gaps
- **30 isolated node(s):** `GEOMETRY`, `colors`, `destinationLabels`, `conversionByDestination`, `seedCampaigns` (+25 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `GEOMETRY`, `colors`, `destinationLabels` to the rest of the system?**
  _30 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ad-campaign-dashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._