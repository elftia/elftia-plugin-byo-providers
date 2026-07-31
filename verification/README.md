# Extraction verification record

Verified from a clean locked install:

```sh
npm ci --no-audit --no-fund --registry=https://registry.npmjs.org
npm run verify
```

Selected contracts:

- `@elftia/plugin-types@1.25.0`
- `@elftia/agent-spec@1.25.0`
- `@omnicross/contracts@0.1.5`

All three resolve from `https://registry.npmjs.org/` in `package-lock.json`;
none is a link, workspace, file, or path dependency.

The aggregate verification covers:

- standalone import and filesystem-root closure across runtime, tests,
  configuration, and maintenance scripts (144 files);
- 22 unit/activation/security tests, including explicit locale-source ownership,
  preset success/rejection-retry/unmount behavior, and exact method/argument
  parity for all 76 registered main relays;
- canonical terminology;
- renderer ESM and main CJS builds;
- package/manifest/SDK/entry parity;
- exact seven-permission audit;
- host-private, Electron, browser-process, and duplicate-React leak guards;
- two clean builds with an identical normalized file list and SHA-256 hashes.

The normalized 34-file artifact inventory and hashes are recorded in
`reproducibility.json`.

Host extraction acceptance was checked with scoped Git status/diff:

- `packages/byo-providers/` — unchanged;
- `resources/plugins/app-extensions/byo-providers/` — unchanged;
- root `package.json` and host plugin scripts — unchanged;
- Steam builder/channel configuration — unchanged;
- the only scoped pre-existing host diff was an unrelated documentation-comment
  edit in `electron/electron-builder.official.yml`; this extraction did not edit
  that file or its packaging behavior.

The standalone repository has no configured remote. Generated `node_modules/`
and `dist/` remain ignored; the source, configuration, lockfile, tests, and
verification records are the handoff material for the later host-cutover change.
