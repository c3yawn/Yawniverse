# Project Card Visual Design

**Date:** 2026-04-22
**Status:** Approved
**Component:** `src/components/ProjectCard.jsx`

## Goal

Make the project cards on the homepage hub (`/`) more visually interesting and thematic without being gaudy. The result should feel like "looking through a porthole into space."

## Approved Design: Star Field + Shimmer + Glow Pulse

Three layered effects, all pure CSS — no new libraries.

### 1. Star Field (idle)

A `starfield` div sits absolutely positioned behind the card content (`z-index: 0`). It contains ~35 individual star divs across three size tiers:

- **Small dim** (`1px`): ~18 stars, `opacity: 0.10–0.13` — distant background stars
- **Medium** (`1.5px`): ~10 stars, `opacity: 0.20–0.24` — mid-layer stars
- **Bright accent** (`2px`): ~5–7 stars, `opacity: 0.28–0.32` — foreground accent stars

Each star has a `twinkle` CSS animation with unique `--dur` (2.2s–4.4s) and `--delay` values so they pulse independently. Animation pulses opacity up to `3.5×` its base value at the midpoint.

### 2. Glow Pulse (idle)

The card `box-shadow` breathes on a 3s infinite ease-in-out cycle using a `pulse-glow` keyframe animation. The glow color is derived from the project's `glow` value (e.g., `rgba(56,189,248,…)` for Campaign Codex). At rest it is faint; at peak it is moderately visible.

### 3. Shimmer Sweep (on hover)

A `::after` pseudo-element — a semi-transparent white gradient stripe — starts off-screen left and sweeps across the card to the right on hover via a `shimmer` keyframe. Duration: ~0.5s. The glow pulse is cancelled on hover and replaced by a stronger static `box-shadow` + `translateY(-4px)` lift.

## Implementation Notes

- Card content (`accent-bar`, `card-inner`) must have `position: relative; z-index: 1` so they render above the starfield.
- The `starfield` div uses `overflow: hidden` and matches the card's `border-radius` so stars don't bleed outside.
- Star positions are hardcoded percentages — no JS randomization needed.
- Each project card gets the same star layout; the glow color differs per project via `project.glow`.
- The `pulse-glow` animation uses `box-shadow` — must be cancelled (`animation: none`) on hover to prevent fight with the hover shadow.

## Files to Change

| File | Change |
|---|---|
| `src/components/ProjectCard.jsx` | Add starfield markup + CSS-in-JS for all three effects |
