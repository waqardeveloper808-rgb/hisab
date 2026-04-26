# PDF / preview notes

- **Totals row labels (bilingual):** In PDF export, grand-total and body English colors use `rgbFromLayoutEn` / `rgbFromLayoutAr` as appropriate; combined EN+AR label lines are drawn as two text runs (not full complex text layout). This matches the previous approach with improved colors.
- **Currency column:** Stored default is **10px**; preview and PDF apply a **minimum visual width (~22px)** so the Riyal glyph is not clipped. The inspector shows the stored value (10).
