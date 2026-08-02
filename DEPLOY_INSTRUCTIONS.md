# Deploying the buyer registry (Next.js + Vercel Supabase integration)

You're doing this via **Settings → Integrations → Supabase** in your Vercel
project, so most of the wiring is automatic. This is what's left.

## 1. Finish the integration install

In the dialog you had open (region: Mumbai, resource name
`supabase-cyan-ferry`), click **Create**. Vercel will:
- create the Supabase project for you
- automatically add `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (plus a few other Postgres/service-role
  vars you won't need here) to your Vercel project's environment variables

This app is already coded to read exactly those two `NEXT_PUBLIC_` vars —
no manual copy-pasting into the code required.

## 2. Create the table

The integration creates an empty Supabase project — it doesn't know about
your `complainants` table yet.

1. Open the new Supabase project (link from the Vercel Integrations page,
   or supabase.com/dashboard).
2. **SQL Editor → New query**, paste the full contents of
   `supabase_setup.sql`, click **Run**.
3. Confirm in **Table Editor** that `complainants` exists, and that RLS is
   enabled with only an INSERT policy for `anon` (no SELECT/UPDATE/DELETE
   for the public — that's what keeps submitted names/numbers private).

## 3. Deploy

If this Next.js folder is already the repo connected to your Vercel
project, just push to your main branch — Vercel will build and deploy with
the env vars already in place.

If you're starting a fresh repo:

```bash
cd karnataka-registry-next
git init && git add -A && git commit -m "buyer registry"
git remote add origin <your-new-github-repo-url>
git push -u origin main
```

Then import that repo into the same Vercel project you ran the Supabase
integration on (or link an existing one with `vercel link`).

## 4. Local development (optional)

```bash
npm install
vercel link              # connect this folder to your Vercel project
vercel env pull .env.local   # pulls the real Supabase URL/key down locally
npm run dev
```

## 5. Exporting the list for the police complaint

When you're ready to compile the annexure:

1. Supabase Dashboard → **Table Editor** → `complainants`
2. **Export** as CSV (or query/sort in the SQL Editor first — e.g. by
   `plot_number` or `created_at`).
3. Transfer into the same ಕ್ರಮ ಸಂಖ್ಯೆ / ಹೆಸರು / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ / ನಿವೇಶನ ಸಂಖ್ಯೆ
   table format as the complaint draft, then collect physical signatures
   next to each name before filing — the digital consent checkbox
   establishes intent and contact info, but the SP's office will likely
   still expect wet-ink signatures on the annexure itself.

## Notes on scope

- No admin login page is included — pulling data from the Supabase Table
  Editor directly is simpler and safer for a one-off petition list. Happy
  to add a proper authenticated admin view later if this registry needs
  to stay open long-term.
- The hidden "website" field in the form is a honeypot for basic bot
  deterrence, not hardened spam protection. If the link gets bot spam once
  it's circulating publicly, the next step would be adding Cloudflare
  Turnstile (free) in front of the submit button.
