# Home polish findings

The refined desktop hero now has stronger hierarchy: the headline and CTA sit comfortably beside the stationery artwork, with less dead space than before while keeping the quiet mood.

The narrow mobile hero is readable and intentional. The header remains usable, but it is dense because the brand wraps to two lines and the visible utility links compete slightly with the language controls. The hero copy, CTA, artwork, and divider fit cleanly without clipping.

Further verification should inspect the full feed and note cards at desktop and mobile widths, including loading, empty, report, reaction, and pagination states. Arabic and Sorani Kurdish RTL should be checked through the language switcher or a controlled browser state.

The full desktop feed now has a clear archive rhythm: the search field is visually secondary, cards align as a quiet grid, reactions and reports sit below each note, and Load more is centered without technical language. The collection end state is intentionally understated.

The full mobile feed stacks notes cleanly and keeps the text readable. Long page length is expected for a public archive, while the card actions remain touch-sized. The note cards preserve torn-paper silhouettes without letting decorative marks compete with the messages. The mobile header remains the main density concern, but it is usable and does not overlap.

The language provider persists the selected language under `qr-language`, maps Sorani Kurdish to the `ckb` document language, and applies `dir="rtl"` for Arabic and Kurdish. The Home implementation now routes all new user-facing state copy through the dictionary, including clear search, retry, empty collection, report confirmation, and collection-end messaging.

The local Home archive endpoint returned HTTP 200 JSON for a normal listing, a name search, and an intentional no-match search. This confirms the feed, ranked search, and empty-result request path are healthy after the earlier SQL ordering fix.

Interaction checks completed: entering an intentional no-match recipient query produced the calm no-results state with translated-ready Clear search and Write one for them actions; activating Clear search restored the full collection; opening a note’s Report note summary revealed the secondary report form without disrupting the archive. No live reaction or report submission was made against real notes during verification.

Arabic verification completed in the running browser: switching the persisted language to `ar` rendered Arabic navigation, hero, search placeholder, reporting options, reaction labels, and CTA copy. The hero artwork moved to the left and the Arabic heading/feed alignment flowed right-to-left as intended. The public note card actions remained available and readable.

Sorani Kurdish verification completed in the running browser: the Home page rendered the requested Kurdish headline, Kurdish navigation, search placeholder, reporting options, reaction labels, and CTA copy. The hero composition placed the artwork on the left with right-aligned Kurdish text, and the feed/search controls remained readable in RTL.

The narrow mobile Home screenshot confirmed the responsive hero stack, readable headline/body scale, full-width-safe CTA, preserved artwork crop, and clear separation before the archive section. The RTL browser checks above confirmed Arabic and Kurdish direction and localized copy; the same responsive CSS rules apply at mobile breakpoints.
