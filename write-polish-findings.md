# Write page polish findings

Initial inspection shows the Write page already has the correct product flow: anonymous recipient and message fields, paper-color selection, optional scheduling, honeypot input, localized errors, and a private manage link after submission. The main unfinished quality is presentation: the page is compressed into dense one-line JSX, the visual hierarchy is less editorial than Home, the paper-choice buttons expose raw color keys as aria labels, and the confirmation/manage details need more breathing room and clearer hierarchy.

The polish should stay within the existing architecture. It should improve spacing, field grouping, helper copy, focus states, paper swatches, scheduling disclosure, submit affordance, and confirmation presentation without changing the note lifecycle or adding a new product feature. Home must remain untouched.

The live Write page was inspected in Arabic, confirming localized labels, Arabic typography, RTL form alignment, and schedule controls. Filling the recipient and message fields updated the “Dear …” preview and character count without submitting a note. The form remains intentionally anonymous and no live database mutation was made during this interaction check.

Desktop and narrow-mobile screenshots show the refined editorial hierarchy, quieter guidance block, larger paper surface, clearer field grouping, accessible paper swatches with selected checks, optional scheduling disclosure, and a more deliberate footer. Home was not modified.

Sorani Kurdish verification completed directly on `/write`: the localized title, labels, placeholders, paper-tone hints, schedule label, privacy helper, and CTA rendered with the page’s RTL flow. The form field order and paper selection remain usable in Kurdish; the content is readable without changing the product flow.

After adding the missing keys, direct live checks show the new helper copy is localized in both Sorani Kurdish and Arabic: the guidance paragraph, recipient hint, message hint, paper-choice hint, schedule optional label, and paper swatch labels no longer fall back to English. The Arabic and Sorani pages preserve RTL field ordering and readable hierarchy. The English desktop/mobile screenshots show the same structure in the default language.

Direct Arabic interaction checks completed after localization: selecting the faded-rose swatch changed the entire letter surface and marked the selected swatch; opening the optional scheduling disclosure revealed the localized “اختياري” label and future date/time control without submitting the form.
