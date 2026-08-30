# Archive Cleanup and Reaction QA Findings

The preview database contained clearly fabricated rows using the `Someone` recipient with messages matching `message 0` through `message 4`, along with an obvious `dadadadadada` test message. Those rows were marked `deleted` rather than hard-deleted, preserving database history while removing them from public results.

The public Home query was verified after cleanup and returned no published rows. A full-page Home capture showed the intended empty state: “No notes have been left yet,” the invitation to write the first note, and no fabricated note cards.

The validation test that previously inserted `message 0` through `message 4` into the shared database was isolated with a database mock. Future `pnpm test` runs therefore cannot repopulate the preview archive.

The anonymous remembered reaction is one-way. The client persists the reacted note ID, marks the button `aria-pressed`, disables it after the reaction succeeds (including duplicate responses), and exposes localized locked-state feedback. There is no remove or undo mutation in the backend.
