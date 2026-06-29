package web

import "embed"

// Files contains the built Vite app. Run `npm run build` in web/ before
// building the Go binary to embed the full UI.
//
//go:embed dist
var Files embed.FS
