# Validation — Workspace V2 header / PDF / stamp (implementation)

## Automated capture

With dev server on `http://localhost:3000`, run:

```text
OUT_DIR=c:\hisab\storage\app\agent-output\workspace-v2-header-pdf-stamp-recovery-20260426-1428 node tools/capture-template-studio-screens.mjs
```

The script clears `hisabix.wsv2.templateUi.v1`, reloads the studio, reads default control values (info 160/330/160, totals 260/10/140, header card widths + logo 200×200), and writes `after-current-default-column-widths.png` plus embeds JSON in its own `validation-report.md` under `OUT_DIR`.

## PDF / Arabic extraction

- Visual PDF is the parity target for EN + AR.
- `pdftotext` and similar tools may show reversed or stripped Arabic; that does not by itself imply the PDF is English-only.

## Checklist (manual)

- [ ] Header: three bordered cards, logo `object-fit: contain` at configured size (default 200×200).
- [ ] Accent color control removed; header text uses English/Arabic typography colors.
- [ ] Stamp/signature: footer line + label aligned at card bottom; signatory lines above footer.
- [ ] PDF: three header regions, bilingual info rows when mode is bilingual, stamp/signature labels.
