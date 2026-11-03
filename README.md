# Input to Form

Portfolio website built with React and Vite.

Live site: https://kustart.pro/

## Local development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

Deployment to GitHub Pages runs automatically through GitHub Actions after a push to `main`.

## HDA parameter demos

Houdini exporter and launch instructions: [tools/houdini/README.md](tools/houdini/README.md).

Animated parameter panels, video sync and case configuration: [docs/hda-demo.md](docs/hda-demo.md).
With the dev server running, open `/#/ru/hda-preview` to preview a local export,
choose a video and generate a project block configuration. This preview page and
the exports in `houdini-exports.local` are excluded from the production build.

```bash
npm run test:hda
```

Case videos play their original sources through the browser's native video
player. Configured loops restart from the beginning and play forwards.
HDA panels follow the video's presented timestamps, including pause and seeking.

```bash
npm run test:video
```
