# Ambient and expandable-card QA findings

The desktop preview shows the public Home archive in a truthful empty state with no fabricated note cards. The Write card now visibly previews the selected Lantern mode using a warm orb and a small uppercase label, rather than leaving the control visually inert. The same card structure uses the ambient-light class so Moon, Ember, and No light receive distinct treatments when selected.

Expandable cards are implemented in Home.tsx with an explicit expand/minimize button, article keyboard activation, localized open/close labels, and no audio autoplay on expansion. Audio remains an explicit play action with deferred signed URL loading.

The current desktop screenshot confirms the Write page remains editorial and calm, although a real public note is still required to visually exercise expanded card sizing and published ambient treatments without fabricating content.

The 390px captures confirm the Home hero remains readable and the Write card’s Lantern preview is visible at the top of the stationery card without covering the form. The mobile header wraps the brand and navigation as before; the ambient controls remain below the fold and are intended to be reached by scrolling. No audio is requested or played by opening the page.

## Custom paper palette QA

The desktop Write capture shows the existing Lantern preview remains present while the paper control is kept separate from the ambient control. The Customize capture retains the calm editorial layout; the expanded seven-tone palette and custom color picker render inside the stationery panel below the fold. The custom color path is restricted to six-digit hex values and maps to a CSS variable rather than injecting arbitrary class names.

The 390px full-page capture confirms the Write card remains usable with the seven named paper tones visible as compact swatches, the custom color control visible as the eighth option, and the Lantern/Moon/Ember/No light controls still present below the schedule row. The Customize page presents the seven named tones plus Custom paper color in a readable two-column grid on mobile. The custom picker currently displays the chosen color as a small input indicator, while the paper card preview continues to use the selected value.

## Palette and reaction follow-up QA

The updated Home archive was captured at desktop and 390px mobile widths after the reversible-reaction and custom-paper changes. The empty/archive layout remains stable, note cards retain distinct stationery tones, and the compact card actions remain visible without clipping. The mobile archive confirms paper-color variation remains legible and the expand affordance stays in the card corner. Direct audio playback still remains opt-in by design; no audio was autoplayed during capture.

## Custom paper regression findings

The API and Supabase adapters already preserve named and six-digit custom paper values, so the Warm parchment result is client-side. The card-specific ambient background-image layer can visually cover the named paper background, and only the older paper classes are fully defined. Dark custom cards also inherit fixed `var(--ink)`, `var(--muted)`, brown gray, and low-opacity control colors without derived contrast tokens, which explains the disappearing labels and metadata. The fix should be centralized in `paper.ts` and the shared note-card CSS rather than changing the Supabase data contract.

## Contrast and paper propagation QA

The refreshed 390px capture confirms the Write card no longer receives an opaque cream background image from the selected ambient treatment; the stationery surface is visible beneath the Lantern glow. The Home archive’s dark custom card now keeps the recipient line, message, expand control, reaction, report affordance, and footer marker visible through contrast-aware CSS variables. The soft-purple/lilac choice is represented by its own paper class and no longer falls back to the default parchment surface.

## Direct RTL narrow-mobile evidence

An isolated Chromium DevTools capture at 390×844 was completed for both RTL languages. Arabic reported `dir="rtl"` and `lang="ar"`; Sorani Kurdish reported `dir="rtl"` and `lang="ckb"`. Both Write pages kept the heading, form labels, placeholders, paper swatches, ambient controls, audio helper text, and submit affordance inside the viewport width with no visible horizontal overflow or English fallback in the application UI. The pale yellow “This page is not live and cannot be shared directly” banner is preview-harness chrome, not application content, and does not appear in production after publishing.
