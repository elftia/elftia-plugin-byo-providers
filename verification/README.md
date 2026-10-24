# Host API 2 verification record

The 0.4.0 producer targets the public `@elftia/plugin-types@2.0.0` contract.
Both main and renderer contributions declare `builtAgainst: "2.0.0"`,
`requiredMajor: 2`, and `requiredMinor: 0`. Model-role selection belongs to
native Elftia; this plugin retains provider, account, CLI, media, search,
voice, and object-storage settings without the old LLM selector/router relay.

## Locked SDK input

The SDK resolves from `vendor/elftia-plugin-types-2.0.0.tgz`, copied unchanged
from the qualified clean source build at commit
`1cddd18616112fc1db09d8e1da46f42d9fa1e7bc`, tree
`281dba23cd35c37fc919353181fcfc8e43d0c45e`.
Its SHA-256 is
`5616fcc5d741da1e782f5547ac1fb33e78c27de69c652f50679ef9bed81b9539`.
This is a local qualified package input, not a claim of an npm publication.
`@elftia/agent-spec@1.25.0` and `@omnicross/contracts@0.6.9` remain separately
locked registry inputs.

## Official producer gates

After a private locked install and staging the authorized source inputs:

```sh
npm run check:reproducible -- --update
npm run verify
```

`verify` runs TypeScript, unit/activation/security tests, standalone import
closure, terminology, renderer ESM and main CJS builds, package/manifest/SDK
parity, exact dedicated-permission auditing, bundle leak guards, two clean
staged-index builds, plugin-kit distribution verification, and local EPKG v2
archive production. The `release` script produces local files only; it does
not publish, sign, upload, tag, or deploy.

The original reproducibility algorithm exports the staged index with canonical
LF bytes into two isolated directories and uses locked clean installs. It
compares the complete raw trees, EPKGs, and integrity sidecars byte-for-byte;
`verification/reproducibility.json` is regenerated only by that producer and
contains the inventory and tree/archive/sidecar digests. Temporary directories
are removed; the gate does not replace the local `dist/` tree.

Built-backend activation and settings-flow runtime evidence is recorded in the
migration handoff. Such an isolated in-memory host-port fixture proves the
compiled entrypoint and plugin boundary, not native account authentication,
external vendor connectivity, actual CLI installation, or filesystem storage.

Generated `node_modules/`, `dist/`, `release/`, and `.elftia-work/` remain
ignored. The source, lockfile, qualified SDK tar, and generated reproducibility
record are the integration inputs.
