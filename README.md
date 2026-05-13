# Wakana Type

A lightweight typing game for practicing Japanese hiragana with romaji input.

Built with React, TypeScript, and Vite. The app generates random rounds of kana, validates input in real time, and tracks typing performance.

## Features

- Practice kana with selectable groups (monographs, diacritics, and digraphs)
- Real-time romaji to hiragana composition using `wanakana`
- Live typing stats: progress, WPM, accuracy, and keystroke count
- Quick controls for restart and new rounds
- 30-token randomized rounds

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- WanaKana

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- pnpm

### Install

```bash
pnpm install
```

### Run Development Server

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

## Deploy to Vercel via GitHub Actions

The repository includes a workflow at `.github/workflows/deploy-vercel.yml` that deploys on pushes to `main` (and can also be run manually).

Add these repository secrets in GitHub before running the workflow:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

You can get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from your Vercel project settings, and create `VERCEL_TOKEN` from your Vercel account settings.

## Project Structure

```text
src/
	components/      UI blocks (filter, stats, typing canvas)
	constants/       Kana groups and round generation
	hooks/           Typing engine and input validation logic
```

## Controls

- Type letters (`a-z`) and `'` to input romaji
- `Backspace` removes the last typed character
- `Esc` resets the current round
- `Enter` starts a new round after finishing

## Notes

- The game supports special handling for `ん` input variants (for example: `n`, `nn`, `n'`, `xn`).
- If no character groups are selected, the game falls back to a safe default group.
