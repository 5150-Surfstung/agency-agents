# Placeholder — the app is moving to its own repo

This folder is intentionally (almost) empty.

The Equipped Agent app (live seminar deck, games, deployed assistants) was
built on the branch `claude/agent-connection-real-estate-ai-odi1e2` of this
repo, and a Vercel project named **the-equipped-agent** is connected to this
repo with its Root Directory set to `projects/equipped-agent-live`. Because
that folder never existed on `main`, every push to `main` made Vercel error
and send failure emails.

This placeholder exists only so that:

1. The Root Directory Vercel looks for exists on `main`.
2. The `vercel.json` here (`"github": { "enabled": false }`) tells Vercel not
   to deploy from this repo at all.

The app itself is not gone — it still lives, with full history, on the
`claude/agent-connection-real-estate-ai-odi1e2` branch, and the live seminar
deployment on Vercel is untouched.

## Finishing the move (for a future Claude session or a human)

1. Create an empty GitHub repo (e.g. `5150-Surfstung/the-equipped-agent`),
   no README/license (it must be empty).
2. Extract the app history from this repo and push it there:

   ```bash
   pip install git-filter-repo
   git clone https://github.com/5150-Surfstung/agency-agents.git export
   cd export
   git checkout claude/agent-connection-real-estate-ai-odi1e2
   git filter-repo --path projects/ --force
   git remote add new https://github.com/5150-Surfstung/the-equipped-agent.git
   git push -u new HEAD:main
   ```

   This keeps the `projects/equipped-agent-live/...` paths identical, so the
   Vercel Root Directory setting still matches.
3. In the Vercel dashboard: project **the-equipped-agent** → Settings → Git →
   disconnect `agency-agents`, connect `the-equipped-agent`. Root Directory
   stays `projects/equipped-agent-live`. Environment variables, domains, and
   deployment history are all preserved because it is the same project.
4. Afterwards, this placeholder folder and the
   `claude/agent-connection-real-estate-ai-odi1e2` branch can be deleted from
   this repo.
