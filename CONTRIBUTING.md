# Contributing to Notekeeper

Thanks for considering a contribution. This is a small project and the bar to merge is intentionally low — useful is more important than perfect.

## Project shape

- **`main.ts`** — the entire plugin source, single file by design. Includes the view, modals, settings tab, and helpers.
- **`styles.css`** — every visual style. Light-theme overrides live in a clearly-marked block at the bottom.
- **`manifest.json` / `versions.json`** — the Obsidian plugin manifest and per-version minimum-app-version map.
- **`main.js`** — esbuild output. Committed so manual installs work without a build step. Rebuild it before opening a PR.

## Build and dev

```bash
npm install
npm run dev     # watch + rebuild on save
npm run build   # type-check + production bundle
```

Local lint (matches the directory's automated scan, modulo the rules disabled in `eslint.config.mjs`):

```bash
npx eslint main.ts
```

## Opening a PR

- Make sure `npm run build` succeeds and `main.js` is up to date in the commit.
- Run `npx eslint main.ts` — should be clean.
- Test the change in a real vault. The `Documents/Obsidian Vault` pattern works, or any vault you don't mind experimenting on; just symlink or copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/notekeeper/` and reload.
- Keep the diff narrow. If you find adjacent things to clean up, file a separate issue or PR.

## Filing an issue

Open one [on GitHub](https://github.com/PhilemonChiro/obsidian-notekeeper/issues). Helpful to include:

- Obsidian version and platform (desktop/mobile, OS)
- Notekeeper version (from settings)
- A short repro — ideally the smallest sequence of clicks that triggers the behaviour
- A screenshot or short clip if the bug is visual

Feature requests are very welcome. Even one-line ones.

## Releases

Releases ship through `.github/workflows/release.yml` on every `X.Y.Z` tag push. The workflow builds, signs `main.js` / `manifest.json` / `styles.css` with [GitHub build provenance attestation](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations), and either creates the release or uploads to an existing tag.

## Licence

Notekeeper is MIT. Contributions are accepted under the same licence.
