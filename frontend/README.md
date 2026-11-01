# SignConnect AI — Frontend

Static HTML, CSS and JavaScript. No build step and no npm packages.

## Open it

Double-click `index.html`, or serve the folder for a more realistic test:

```bash
cd frontend
python -m http.server 5500
# open http://localhost:5500
```

The camera works on `localhost` and on HTTPS sites only.

## Configuration

Everything is in `assets/js/config.js`:

| Setting | Meaning |
|---|---|
| `API_BASE` | Backend URL, default `http://127.0.0.1:5000`. Use `""` if Flask serves these files. |
| `UI_PREVIEW` | `true` = pages open without a backend and show empty states (nothing is invented). Set to `false` when the backend is ready. |
| `FRAME_INTERVAL_MS`, `FRAME_WIDTH`, `JPEG_QUALITY` | How often and how large the frames sent for recognition are. |

## Files

```
frontend/
├── index.html        Home (hero, features, how it works)
├── about.html        About, limitations, feedback form
├── login.html        Login
├── register.html     Registration
├── dashboard.html    Stats and recent history
├── recognize.html    Webcam, prediction, sentence builder, speech
├── history.html      Saved sessions, clear history
├── evaluation.html   Real model metrics
└── assets/
    ├── css/style.css     Design system
    ├── images/logo.svg
    └── js/
        ├── config.js     Settings
        ├── common.js     Header/footer, icons, API helper, toast, modal, auth guard
        ├── forms.js      Form validation helpers
        ├── login.js  register.js  feedback.js
        ├── dashboard.js  history.js  evaluation.js
        └── recognize.js  Camera, throttled frames, sentence builder, speech
```

## API contract the backend must provide

All requests use cookies (`credentials: include`). State-changing requests send `X-CSRF-Token`, fetched from `GET /api/csrf` -> `{ "csrf_token": "..." }`. Enable CORS with credentials for the frontend origin if it is served separately.

| Method | Path | Body / response |
|---|---|---|
| GET | `/api/csrf` | `{ csrf_token }` |
| POST | `/api/auth/register` | `{ full_name, email, password, confirm_password }`; 409 if email exists; optional `{ fields: { name: "message" } }` on 400 |
| POST | `/api/auth/login` | `{ email, password }`; 401 on failure |
| POST | `/api/auth/logout` | — |
| GET | `/api/auth/me` | `{ user: { id, full_name, email } }`; 401 if not logged in |
| GET | `/api/dashboard/stats` | `{ total_sessions, total_signs, recent: [history rows] }` |
| POST | `/api/predict` | multipart field `frame` (JPEG) -> `{ status: ok / no_hand / low_confidence / error, label, confidence (0–1 or null), stable, message }` |
| GET | `/api/history` | `{ items: [{ id, recognized_text, created_at, duration, status }] }` |
| POST | `/api/history` | `{ recognized_text, duration, status }` |
| DELETE | `/api/history` | clears only the logged-in user's records |
| GET | `/api/model/evaluation` | `{ available, dataset:{train,validation,test}, classes, metrics:{accuracy,precision,recall,f1}, per_class:[...], confusion_matrix:{labels,matrix}, model:{...} }` |
| POST | `/api/feedback` | `{ name, email, message }` |

Errors should be JSON: `{ "error": "message" }`.

## Notes

- Camera frames are only sent for prediction; the frontend never stores them.
- Speech runs only when the user presses **Speak**.
- Letters are added only by the **Add letter** button, or by the optional "add automatically" switch when the server reports the sign as stable.
