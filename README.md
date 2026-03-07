# Life in the UK Test — Quiz App

An adaptive quiz app to help you prepare for the [Life in the UK test](https://www.gov.uk/life-in-the-uk-test). It covers all 435 official questions across 18 practice exams, with a smart priority system that focuses more on questions you keep getting wrong.

🔗 **Live app:** https://alexwang216.github.io/life-in-the-uk-quiz/

---

## Features

- **435 questions** across 18 practice exams
- **Adaptive priority system** — questions you get wrong appear more often; questions you know well appear less
- **Multi-answer support** — some questions require selecting more than one correct answer
- **Review page** — two tabs:
  - *Still Incorrect* — questions you haven't got right yet
  - *Ever Missed* — questions you've ever got wrong, even if later corrected (great for catching lucky guesses)
- **Question grid** — visual overview of all 435 questions; click any box to jump directly to it
- **Progress persistence** — your progress is saved in the browser (localStorage), so it survives page refreshes
- **"Ask Claude" link** — after each question, open Claude AI with a pre-filled prompt to learn more about the topic
- **PWA support** — installable on mobile as a home screen app

---

## Tech Stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) — offline/installable support
- Deployed via [GitHub Actions](https://docs.github.com/en/actions) → GitHub Pages

---

## Local Development
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The app will be available at `http://localhost:5173`.

---

## Deployment

The app is automatically deployed to GitHub Pages on every push to `main` via the workflow at `.github/workflows/deploy.yml`.

If you fork this repo, update the `base` field in `vite.config.js` to match your repo name:
```js
base: '/your-repo-name/',
```

Then go to **Settings → Pages** and set the source to **GitHub Actions**.

---

## Data Sources

Questions and answers are sourced from the public dataset by [@domicch](https://github.com/domicch/life-in-uk), with the following corrections applied:

- Typo fixes (e.g. "invated" → "invited", "Angels" → "Angles")
- Factual corrections (e.g. Northern Ireland Assembly member count, Elizabeth of York)
- Missing references filled in for Exam 18

---

## Priority System

| Badge | Priority | Meaning |
|-------|----------|---------|
| 🟢 Easy | 1 | You know this well — appears less often |
| 🟡 Review | 2–3 | You've missed this — appears more often |
| 🔴 Hard | 4+ | You keep missing this — appears frequently |

- Correct answer → priority decreases by 1 (min 1)
- Wrong answer → priority increases by 2

---

## License

MIT