# Contributing to Open Termkit

## Development

Read `design.md` before changing UI. Preserve light and dark variables, visible keyboard focus, theme persistence, and terminal interaction.

Use Go 1.26+, Node.js 22+, and npm. `make build` bundles both React applications into the Go binary. `make dev` runs the backend and Vite app separately.

```sh
make build
go test -race ./...
go vet ./...
```

Run `gofmt -w` on changed Go files. Verify PTY output, tab switching, reconnect behavior, and profile persistence when changing terminal code. SSH and install workflows affect the server user's host; use isolated fixtures and avoid real keys in tests or screenshots.

## Screenshots

The README screenshots show the running application with an isolated home and a generated shell profile. Use a disposable home directory, a sample-only profile, and no real SSH keys, private hosts, or environment secrets. Capture light and dark variants with browser screenshots. Document the fixture in `docs/images/README.md`.

## Documentation site

The public site is https://natelindev-open-termkit.pages.dev/. Its Cloudflare Pages project is `natelindev-open-termkit`. Current deployments use manual Direct Upload; automatic Cloudflare deployments are not configured.

Edit `docs-site/` and check desktop/mobile layouts, navigation, code copying, images, and light/dark appearance. Preserve both English and Chinese content. `VITE_DOCS_STANDALONE=true` changes the public site’s terminal link to installation; normal builds retain the in-app terminal link.

To publish, authenticate Wrangler to the account owning the project with Pages write permission:

```sh
VITE_DOCS_STANDALONE=true npm --prefix docs-site run build
npx --yes wrangler@4.148.0 login
export CLOUDFLARE_ACCOUNT_ID=03ceea7ffa07af3f2b87471413fe6b18
npx --yes wrangler@4.148.0 pages deploy docs-site/dist --project-name natelindev-open-termkit --branch main
```

Alternatively, upload a ZIP of the contents of `docs-site/dist/` in the project dashboard, with `index.html` at the archive root. The included `deploy-docs.yml` workflow can publish using repository secrets `CLOUDFLARE_API_TOKEN` (Account → Cloudflare Pages → Edit) and `CLOUDFLARE_ACCOUNT_ID`. These secrets are not currently configured. See [Cloudflare’s direct-upload CI guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

## Pull requests and reports

Describe the user-visible change and relevant verification. Keep private keys, API tokens, personal transcripts, and private hostnames out of commits, screenshots, and reports. Include a small reproduction and OS/tool versions. Brand assets live in `docs/assets/brand/`; marks are path-based SVGs, with transparent PNG exports and dark variants.
