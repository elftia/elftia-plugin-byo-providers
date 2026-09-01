# Extraction verification record

Verified from a clean locked install:

```sh
npm ci --no-audit --no-fund --registry=https://registry.npmjs.org
npm run verify
```

Selected contracts:

- `@elftia/plugin-types@1.25.0`
- `@elftia/agent-spec@1.25.0`
- `@omnicross/contracts@0.1.6`

All three resolve from `https://registry.npmjs.org/` in `package-lock.json`;
none is a link, workspace, file, or path dependency.

The aggregate verification covers:

- standalone import and filesystem-root closure across runtime, tests,
  configuration, and maintenance scripts (147 files);
- 26 unit/activation/security tests, including explicit locale-source ownership,
  preset success/rejection-retry/unmount behavior, and exact method/argument
  parity for all 76 registered main relays;
- canonical terminology;
- renderer ESM and main CJS builds;
- package/manifest/SDK/entry parity;
- exact seven-permission audit;
- host-private, Electron, browser-process, and duplicate-React leak guards;
- two isolated temporary checkouts with byte-identical raw trees, EPKGs, and
  EPKG v2 sidecars;
- plugin-kit validation of the completed `dist/byo-providers/` tree via
  `npm run verify:dist`;
- plugin-kit release of `release/0.2.13/byo-providers.epkg` as a standard ZIP
  container plus the same-stem `byo-providers.json` integrity sidecar.

The normalized 35-file artifact inventory, tree hash, EPKG hash, and sidecar
hash are recorded in
`reproducibility.json`.

Host extraction acceptance was checked with scoped Git status/diff:

- `packages/byo-providers/` — unchanged;
- `resources/plugins/app-extensions/byo-providers/` — unchanged;
- root `package.json` and host plugin scripts — unchanged;
- Steam builder/channel configuration — unchanged;
- the only scoped pre-existing host diff was an unrelated documentation-comment
  edit in `electron/electron-builder.official.yml`; this extraction did not edit
  that file or its packaging behavior.

The standalone repository has `origin` configured at
`https://github.com/elftia/elftia-plugin-byo-providers.git`. Generated
`node_modules/`, `dist/`, `release/`, and `.elftia-work/` remain ignored; the
source, configuration, lockfile, tests, and verification records are the
handoff material for the later host-cutover change.
