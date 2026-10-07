# Product screenshots

These are captures of the running Go/React application in light and dark themes, with a disposable home at `/tmp/open-termkit-polish-home`. A custom `/bin/sh` profile prints a synthetic workspace banner and example command output, then starts an interactive shell. The displayed test timings are sample shell output, not benchmark results. No personal terminals, SSH hosts, keys, or profiles are shown.

To reproduce, build the app, create a temporary home and sample shell script, then create a profile using `open-termkit profile create --name "Example workspace" --shell /bin/sh --arg /path/to/sample-shell.sh --cwd /path/to/example-workspace --default`. Launch the server with that disposable home in its process environment. Capture the browser at a desktop viewport, switch the visible theme, and capture the second variant. Copy the images to `docs-site/public/screenshots/` before building docs.
