# Elftia BYO Providers

Standalone first-party BYO Providers plugin for Elftia. It is a canonical
`app-extension` with separate renderer and utility-process main entries.

The repository owns its source, lockfile, tests, build configuration, manifest,
and verification gates. It does not read from or write to an Elftia host
checkout.

## Requirements

- Node.js 20 or newer
- npm with access to the public npm registry

## Clean install and verification

```sh
npm ci
npm run verify
```

Useful focused commands:

```sh
npm run typecheck
npm test
npm run check:imports
npm run build
npm run check:manifest
npm run check:permissions
npm run check:leaks
npm run check:terminology
npm run check:reproducible
npm run artifact:describe
```

`npm run build` starts by removing this repository's `dist/` directory, builds
both process halves, copies the authored manifest, and runs the manifest,
permission, leak, and terminology gates.

## Locale maintenance

The checked-in locale seeds belong to this plugin. The two optional import
tools never infer an Elftia checkout or inspect parent/sibling directories.
Instead, a caller must explicitly provide a standalone locale export containing
`en`, `zh`, and `ja` subdirectories with the documented source JSON layout:

```sh
npm run i18n:harvest:llm -- --locales-dir <locale-export-directory>
npm run i18n:harvest:media -- --locales-dir <locale-export-directory>
```

The LLM importer reads `providers/llm.json`, `common.json`, and
`providers/media.json`. The media importer reads `providers/media.json` and
`settings/core.json`. Omitting `--locales-dir` is an error; there is no hidden
checkout-relative fallback. `npm run check:imports` scans maintenance scripts
as well as runtime/test code and rejects implicit host-tree paths, parent-root
escapes, and absolute filesystem literals.

## Artifact interface

The only consumer-facing interface is:

```text
dist/byo-providers/
  elftia-plugin.json
  main/index.cjs
  renderer/index.mjs
  renderer/chunks/*
  renderer/assets/*
```

Some optional chunk/asset directories may be absent when empty. Consumers must
copy the complete `dist/byo-providers/` directory and must not import this
repository's source or build configuration.

Artifact synchronization is consumer-owned. This project deliberately contains
no host checkout path and never writes into `resources/plugins/`. A host
cutover should:

1. run `npm ci && npm run verify` in this repository;
2. stage a copy of `dist/byo-providers/`;
3. atomically replace the host's canonical
   `resources/plugins/app-extensions/byo-providers/` directory;
4. run the host's loader, permission, packaging, and channel-policy checks.

The older `renderer-extension` name is migration terminology only. It is not a
valid authored kind, build path, artifact path, or synchronization target in
this project. The terminology guard permits that historical term only in this
README.

## Host contract

The project locks the newest released public SDK,
`@elftia/plugin-types@1.25.0`, and records `builtAgainst: "1.25.0"` in both
manifest contributions. The public 1.25 SDK covers the base UI/backend API and
the LLM, media, search, and subscription ports. The additive host 1.26–1.27
agent-config, CLI-runtime, secrets-pack, model-test, and manual-token members
are represented by narrow plugin-owned structural projections in
`src/domain/plugin-types.ts`; the manifest still requires host minor 27 for the
main contribution. No projection imports host source.

React and React DOM are host-provided peer runtimes and remain external in the
renderer build. The main entry is CommonJS, Node-targeted, and Electron-free.

## Permission model

The manifest declares exactly:

- `host:llm-config`
- `host:media-config`
- `host:search-config`
- `host:subscription-auth`
- `host:agent-config`
- `host:cli-runtime`
- `host:secrets-pack`

`host:secrets-write` is intentionally absent. Provider keys, manual tokens,
OAuth verifiers, and secrets-pack passphrases travel inward only through their
dedicated masked host services. Reads return masked status, flags, counts, and
paths; the plugin does not receive plaintext stored credentials or encrypted
pack bytes.

`npm run check:permissions` maps emitted `host.services.*` edges back to these
tokens and fails on undeclared, undetected, or generic secret-write access.

## Reproducibility

`npm run check:reproducible` performs two clean builds, compares the normalized
artifact file list and SHA-256 hashes, leaves the second verified artifact in
`dist/byo-providers/`, and records the result in
`verification/reproducibility.json`.

## Ownership

Copyright © 2026 ATELIER AI LTD. Licensed under the MIT License.
