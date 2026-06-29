# Open Termkit Design System

Open Termkit now follows a Vercel-inspired product UI: Geist-style typography, near-black ink on a near-white canvas, exact hairline cards, compact 6px app controls, and a restrained mesh gradient used only as a subtle top-band accent. The app must support both light and dark themes.

## Principles

- Use Geist Sans for UI and prose. Fall back to Inter, Arial, system-ui, and sans-serif.
- Use Geist Mono only for code, terminal metadata, and compact technical labels.
- Keep chrome monochrome. Color is reserved for links, focus, status, and the subtle mesh gradient accent.
- Use a 1px hairline border before adding any shadow. Shadows must stay whisper-soft.
- Use 6px radius for nav and app controls, 12px radius for cards and code blocks, 16px radius for large panels, and pill radius for status chips or theme controls.
- Keep the dark theme first-class. Every token must have a dark equivalent with clear contrast.
- Prefer precise grids, centered containers, and generous whitespace.

## Light tokens

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#171717` | Primary button fill and strongest brand ink |
| `on-primary` | `#ffffff` | Text on primary buttons |
| `ink` | `#171717` | Headings and high-emphasis text |
| `body` | `#4d4d4d` | Body text and nav links |
| `mute` | `#8f8f8f` | Metadata and subdued labels |
| `faint` | `#a1a1a1` | Placeholders and disabled text |
| `hairline` | `#ebebeb` | Card, input, and divider borders |
| `hairline-soft` | `#f2f2f2` | Subtle fills and hover surfaces |
| `canvas` | `#fafafa` | App background |
| `canvas-elevated` | `#ffffff` | Cards, inputs, buttons, and panels |
| `link` | `#0070f3` | Links, focus rings, and positive status |
| `error` | `#ee0000` | Destructive and error states |
| `warning` | `#f5a623` | Caution states |

## Dark tokens

| Token | Value | Use |
| --- | --- | --- |
| `primary` | `#ededed` | Primary button fill in dark theme |
| `on-primary` | `#0a0a0a` | Text on dark-theme primary buttons |
| `ink` | `#ededed` | Headings and high-emphasis text |
| `body` | `#a1a1a1` | Body text and nav links |
| `mute` | `#737373` | Metadata and subdued labels |
| `faint` | `#525252` | Placeholders and disabled text |
| `hairline` | `#2e2e2e` | Card, input, and divider borders |
| `hairline-soft` | `#1a1a1a` | Subtle fills and hover surfaces |
| `canvas` | `#0a0a0a` | App background |
| `canvas-elevated` | `#111111` | Cards, inputs, buttons, and panels |
| `link` | `#3291ff` | Links, focus rings, and positive status |
| `error` | `#ff453a` | Destructive and error states |
| `warning` | `#f5a623` | Caution states |

## Typography

| Role | Family | Size | Weight | Line height | Letter spacing | Use |
| --- | --- | --- | --- | --- | --- | --- |
| `display-xl` | Geist Sans | 48px | 600 | 48px | -2.4px | View hero headings |
| `heading-lg` | Geist Sans | 32px | 600 | 40px | -1.28px | Major sections |
| `heading-md` | Geist Sans | 20px | 600 | 28px | -0.4px | Card headings |
| `label-sm` | Geist Sans | 14px | 500 | 20px | -0.28px | Strong labels and nav emphasis |
| `mono-eyebrow` | Geist Mono | 12px | 500 | 16px | 0 | Uppercase technical labels |
| `body-lg` | Geist Sans | 16px | 400 | 24px | 0 | Lead body text |
| `body-md` | Geist Sans | 14px | 400 | 20px | 0 | Default app text |
| `body-sm` | Geist Sans | 12px | 400 | 16px | 0 | Metadata and captions |
| `code` | Geist Mono | 14px | 400 | 20px | 0 | Code, paths, terminal metadata |

## Components

### Navigation

- Use a sticky top bar with a hairline bottom border.
- The brand mark should be a simple black or white triangle paired with the product name.
- Nav links use compact rounded hit areas, body text, and no decorative icons.
- The active nav item uses an elevated fill and hairline border.
- Include a visible theme switch in the top bar. It must persist the selected theme.

### Buttons

- Primary app buttons use the `primary` fill, `on-primary` text, 6px radius, 14px label type, and compact height.
- Secondary buttons use elevated canvas, ink text, 1px hairline, and 6px radius.
- Large one-off CTAs may use pill radius.
- Destructive buttons use red text and a red-tinted border, never a full red fill unless confirming a destructive action.

### Inputs

- Inputs use elevated canvas, ink text, 1px hairline, 6px radius, and 8px by 12px padding.
- Focus uses the link color as a crisp outline or border.
- Placeholders use `faint`.

### Cards and panels

- Cards use elevated canvas, 1px hairline, 12px radius, and 24px padding where space allows.
- Dense row panels may use 12px radius with row-level dividers.
- Use micro shadows only for elevated UI: `0 1px 1px rgba(0,0,0,0.04)` in light and a darker equivalent in dark.

### Terminal frame

- Treat the terminal as a code block surface: rounded 12px, hairline border, and black terminal interior.
- Do not let the terminal force the rest of the app into a terminal-native visual style.

### Status

- Connected and installed states use the link color.
- Error and destructive states use `error`.
- Warning states use `warning`.
- Status chips use pill radius with subtle borders and no heavy fills.

## Dark theme requirements

- Add all visual values through CSS variables so light and dark themes stay aligned.
- Set `color-scheme` to match the current theme.
- The theme switch must update the document theme and persist to local storage.
- Dark mode cards must not be pure black if the canvas is pure black. Use `canvas-elevated` for separation.
- Borders in dark mode should be visible but quiet, usually `#2e2e2e`.

## Do not

- Do not use the old cream-and-monospace design language.
- Do not use ASCII bracket markers as primary chrome.
- Do not add colorful fills to cards or buttons.
- Do not add heavy shadows, glass blur, or decorative imagery outside the subtle mesh accent.
- Do not mix multiple sans-serif display systems.
