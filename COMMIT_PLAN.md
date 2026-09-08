# Kormopulse delivery plan

Use the commits below in order. Each is intentionally small enough to demonstrate visible progress during a short team project.

1. `chore: scaffold Kormopulse workspace`
   - Add the root workspace, scripts, setup guide, and environment templates.
2. `feat(api): add recruitment platform backend`
   - Add Express API routes, MongoDB models, authentication, uploads, applications, companies, jobs, and messaging.
3. `feat(ui): add Kormopulse public and auth experience`
   - Add the Vite/React shell, Kormopulse branding, landing page, login, sign-up, and onboarding screens.
4. `feat(platform): add jobs and role-based dashboards`
   - Add job discovery, job posting, company pages, applications, saved jobs, profiles, messages, and recruiter/job-seeker dashboards.

## Next small commits

These are intentionally small additions for the next progress update.

1. `feat(api): add demo roadmap endpoint`
   - Add a database-independent `/api/demo/overview` response.
2. `feat(ui): preview demo jobs on home page`
   - Fetch and display featured demo jobs on the home page.
3. `chore(demo): add demo api script`
   - Add the root demo command and document the endpoint.

After committing, connect the new repository to its own remote (not the existing parent repository's remote) and push:

```bash
git remote add origin <your-kormopulse-repository-url>
git branch -M main
git push -u origin main
```
