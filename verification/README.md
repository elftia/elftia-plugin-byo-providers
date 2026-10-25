# Host API 2 verification record

The 0.4.0 producer targets the public `@elftia/plugin-types@2.0.0` contract.
Both main and renderer contributions declare `builtAgainst: "2.0.0"`,
`requiredMajor: 2`, and `requiredMinor: 0`. Model-role selection belongs to
native Elftia; this plugin retains provider, account, CLI, media, search,
voice, and object-storage settings without the old LLM selector/router relay.

## Locked SDK input

The SDK resolves from `vendor/elftia-plugin-types-2.0.0.tgz`, copied unchanged
from the qualified clean source build at commit
`5697ec2acded2ee6b60475940f12d10828d099ce`, tree
`c45c581e4add9be32c6f6ebe2442c561e5601997`.
Its SHA-256 is
`59c93adbb5d19ac9dde790394908637172c81e2f42b3555e041db07e466af2bb`.
This is a local qualified package input, not a claim of an npm publication.
`@elftia/agent-spec@1.25.0` and `@omnicross/contracts@0.7.1` remain separately
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
