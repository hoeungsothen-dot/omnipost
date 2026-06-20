# Facebook Pages + Instagram setup

Facebook and Instagram share a single Meta App, so one OAuth connection
covers both. This is the first of the remaining platform integrations,
built on top of new Vercel serverless functions under `/api`.

## 1. Create the Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com) → My Apps → Create App → choose **Business**.
2. From the App Dashboard, add these products:
   - **Facebook Login** (or **Facebook Login for Business**)
   - **Instagram Graph API** (find it under "Add Product")
3. Under Facebook Login → Settings, set:
   - **Valid OAuth Redirect URIs**: `https://<your-vercel-domain>/api/oauth/facebook-callback`
   - (Add your `vercel.app` preview domain too if you test there.)
4. Note your **App ID** and **App Secret** (App Settings → Basic).

## 2. Connect a Page + Instagram account during testing

While the app is in **Development mode**, only people added as Admins/
Developers/Testers on the app (Roles → Roles) can complete the OAuth flow.
Add yourself there first, or this will fail with an access error.

The Instagram account must be a **Professional (Business or Creator)**
account linked to the Facebook Page you're connecting — personal Instagram
accounts can't be used with the Graph API.

## 3. App Review (needed before real customers can connect)

Two permissions need Meta's review before they work for the public:

- `pages_manage_posts` — required to publish to the Page
- `instagram_content_publish` — required to publish to Instagram

Submit these from App Review → Permissions and Features, with a short
screen-recording showing the connect flow and a publish. Meta's review
turnaround varies, so it's worth submitting this while the rest of the
integration work is still in progress — check the current process on the
developer portal, since requirements do change.

## 4. Environment variables

Set these in Vercel → Project Settings → Environment Variables
(project-level, not the team "Shared" tab — see the Vercel learnings below).

| Variable | Where it's used | Sensitive? |
|---|---|---|
| `VITE_FB_APP_ID` | Browser (build-time) | No — do **not** mark Sensitive, or Vite won't see it |
| `FB_APP_SECRET` | Server only (`/api/oauth/facebook-callback`) | Yes |
| `SUPABASE_URL` | Server only (same value as `VITE_SUPABASE_URL`) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only (`/api/oauth/facebook-callback`) | Yes |
| `SUPABASE_ANON_KEY` | Server only (same value as `VITE_SUPABASE_ANON_KEY`) | No |
| `APP_URL` | Server only, e.g. `https://app.yourdomain.com` | No |

Reminder from earlier deploys: a variable marked **Sensitive** in Vercel is
hidden from the Vite build, so `VITE_FB_APP_ID` must stay non-sensitive or
`import.meta.env.VITE_FB_APP_ID` will be `undefined` at runtime. After
adding/changing env vars, push a new commit rather than just hitting
Redeploy — cached builds have served stale bundles before.

## 5. How it works

1. Platforms page → Connect (Facebook or Instagram) → browser redirects to
   Facebook's OAuth dialog.
2. Facebook redirects to `/api/oauth/facebook-callback` with a `code`.
3. That function exchanges the code for a long-lived Page access token,
   finds the linked Instagram Business account (if any), and writes both
   into `platform_accounts` using the Supabase service-role key.
4. Browser is redirected back to `/platforms?connected=facebook,instagram`.
5. Publishing goes through `/api/publish/facebook` and `/api/publish/instagram`,
   which look up the stored token via a Supabase client scoped to the
   caller's own session (RLS applies normally — no service role needed there).

## Known v1 limitations (fast-follows, not blockers)

- Only the first Page (preferring one with a linked Instagram account) is
  connected automatically. A business managing multiple Pages will need a
  page-picker UI — not built yet.
- Facebook photo posts currently support a single image per post; carousel/
  multi-photo album posts aren't implemented yet.
- The OAuth `state` parameter is base64-encoded but not cryptographically
  signed. Low risk today since the callback only trusts it to choose which
  user's row to update after a real Facebook code exchange succeeds, but
  worth hardening with an HMAC signature before scaling up.
