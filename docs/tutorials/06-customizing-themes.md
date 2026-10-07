# Tutorial 6: Customizing Themes & Typography

Open Termkit implements the Vercel Geist design system (`design.md`) and features 12 curated terminal color schemes.

---

## 1. Application Chrome Theming

The application chrome supports both light and dark themes with first-class contrast:
- Click the **Sun / Moon** icon in the top right corner to toggle themes.
- Or open the Command Palette (`Cmd+K`) and select **"Toggle Light / Dark Theme"**.
- The selected theme is stored in `localStorage` under `open-termkit-theme` and restores automatically across visits.

---

## 2. Terminal Color Schemes

Open Termkit ships with 12 handcrafted color schemes optimized for terminal readability:

1. **Monokai** (Default high-contrast developer theme)
2. **Tokyo Night** (Cool midnight indigo palette)
3. **Catppuccin Mocha** (Soothing pastel dark aesthetic)
4. **Dracula** (Vibrant cyberpunk gothic palette)
5. **Nord** (Arctic blue minimalist tones)
6. **Gruvbox Dark** (Warm retro earth tones)
7. **One Dark** (Atom editor inspired balanced palette)
8. **GitHub Dark** (Clean low-saturation chrome)
9. **Rose Pine** (Rosy muted aesthetic)
10. **Solarized Dark** (Precision optical contrast)
11. **Solarized Light** (Reading-optimized light scheme)
12. **Light** (Clean monochrome paper scheme)

### Changing Schemes Globally or Per-Profile
- **Globally**: Select a scheme from the **Scheme** dropdown in the top bar to apply it to your active terminal session immediately.
- **Per-Profile**: Navigate to **Profiles**, edit a profile, and pick its default color scheme.

---

## 3. Font Configuration & Scaling

Open Termkit defaults to clean coding fonts:
- `JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace`
- Use the **A-** and **A+** buttons in the terminal toolbar to quickly scale font size up or down in real time (from 10px to 24px).
