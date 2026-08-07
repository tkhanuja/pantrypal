# Project Requirements & Dependencies

## System & Runtime Requirements
- **Node.js**: `v22.23.1` (or >= 18.x)
- **npm**: `v10.9.8`
- **Module Type**: ES Modules (`"type": "module"`)

---

## Production Dependencies

| Package | Installed Version |
| :--- | :--- |
| `@google/genai` | `2.15.0` |
| `@tailwindcss/vite` | `4.3.3` |
| `@vitejs/plugin-react` | `5.2.0` |
| `dotenv` | `17.4.2` |
| `express` | `4.22.2` |
| `firebase` | `12.17.0` |
| `lucide-react` | `0.546.0` |
| `motion` | `12.43.0` |
| `react` | `19.2.8` |
| `react-dom` | `19.2.8` |
| `vite` | `6.4.3` |

---

## Development Dependencies

| Package | Installed Version |
| :--- | :--- |
| `@types/express` | `4.17.25` |
| `@types/node` | `22.20.1` |
| `autoprefixer` | `10.5.4` |
| `esbuild` | `0.25.12` |
| `tailwindcss` | `4.3.3` |
| `tsx` | `4.23.5` |
| `typescript` | `5.8.3` |

---

## Environment Variables
- `GEMINI_API_KEY`: Required for server-side Google GenAI API operations.
- Firebase config stored in `firebase-applet-config.json`