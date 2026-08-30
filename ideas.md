# Quietly Remembered — Design Direction

## Three stylistic approaches

### Theme Name: Paper Lantern
Very soft, tactile, and editorial: cream paper, ink, pressed botanicals, and a quiet glow. It should feel like opening a hand-written letter kept in a drawer.
**Probability:** 0.07

### Theme Name: Moonlit Keepsake
A dusk-toned, poetic memorial space with deep blue-black fields, tiny stars, and warm candlelight accents. It would feel contemplative and private.
**Probability:** 0.03

### Theme Name: Garden Note
A light, botanical interface with gentle greens, faded coral, and scrapbook-like cards. It would feel hopeful, human, and lightly playful without becoming childish.
**Probability:** 0.08

## Chosen approach: Paper Lantern

### Design Movement
Contemporary editorial stationery with Japanese wabi-sabi influence: imperfect edges, generous breathing room, restrained ornament, and tactile paper-like surfaces.

### Core Principles
1. Make room for feeling: the form is calm, spacious, and never rushed.
2. Use tenderness instead of sentimentality: soft colors, but grounded typography and plainspoken copy.
3. Let small imperfections feel human: hand-drawn marks, lightly offset borders, and paper textures.
4. Keep anonymity visibly safe: no sender name, no social feed pressure, and clear privacy reassurance.

### Color Philosophy
The foundation is warm parchment rather than white, creating the feeling of a letter or keepsake. Ink is a deep plum-brown for emotional weight and legibility. A muted persimmon accent adds the warmth of a small paper lantern, while sage and faded blue-green provide quiet balance. The signature brand color is **Lantern Persimmon #D86E5A**—warm, memorable, and emotionally present without reading as alarming red.

### Layout Paradigm
An asymmetric editorial composition: a narrow, calm header; an off-center hero with the writing form anchored on the left and a floating keepsake illustration on the right; then a low, open “how it works” rail. The main form should feel like a sheet of stationery placed on a desk rather than a centered SaaS card.

### Signature Elements
1. A small lantern-and-thread symbol used as the brand mark and recurring divider.
2. Torn-paper / deckled edge motifs on the main writing card and memory notes.
3. Tiny hand-drawn stars and botanical sprigs used sparingly as emotional punctuation.

### Interaction Philosophy
Interactions should feel like placing something down gently. Focus states use a quiet ink underline and soft wash, not loud outlines. The submit action should create a small “folded note” confirmation state. The page never asks for a sender name or account. Any sample memory content is explicitly labeled as an example, never presented as a real testimonial.

### Animation
On load, the hero copy and writing card enter with a short, staggered upward drift under 300ms. Decorative marks float only 2–4px and only when motion is allowed. Focus transitions are immediate and subtle. On submit, the form compresses slightly and the confirmation note fades in with a small paper-slide transform. Respect `prefers-reduced-motion` by removing decorative movement.

### Typography System
Use **Fraunces** for display headlines and emotionally resonant short phrases; use **DM Sans** for labels, helper text, navigation, and form controls. Headlines use a generous line-height and occasional italic emphasis. Body copy stays short, warm, and highly readable.

### Brand Essence
Quietly Remembered is an anonymous place for words that still need somewhere to go—for anyone carrying love, grief, gratitude, or an unfinished goodbye. Personality: **tender, unhurried, sincere**.

### Brand Voice
Headlines are intimate and direct. CTAs are invitations rather than commands. Microcopy reassures without overpromising or using clinical language.

Example headline: “Some words keep looking for a home.”

Example CTA: “Leave the words here.”

### Wordmark & Logo
The mark is a minimal lantern made from a rounded square of light with one loose thread descending into a tiny four-point star. The wordmark “quietly remembered” is set in lowercase Fraunces with a slightly offset dot over the i as a hand-touched detail. The icon must also work alone at small sizes.

### Signature Brand Color
**Lantern Persimmon — #D86E5A**

## Style Decisions

- Major paper surfaces should feel handmade rather than like generic white cards: use deckled edges, grain, tape, folds, offset borders, or irregular placement.
- The lantern-thread-star mark is the primary recurring motif; use it sparingly as brand punctuation and section detail.
- Lantern Persimmon #D86E5A remains ceremonial: it is reserved for the primary invitation, emotional italic emphasis, and small ritual marks.
- Lower sections should keep calm structure while introducing small asymmetries so the site feels arranged by hand.
