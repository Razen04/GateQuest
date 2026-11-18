Hey, this is a small project, not a corporation. Here's what happens with your data.

## What I collect

**When you sign in with Google:** your name, email, profile picture, and a username. Nothing else. I never see your Google password.

**What you tell me:** college, target year, bio (will be optional in future update), and any social links you add. All optional.

**What you do here:** the questions you attempt, your answers, how long you spent, your scores. Mock tests work the same way. That's how the app tracks progress as there is no way around it.

You can also poke around as a guest without signing in. In that case there's no account attached to what you do.

**What you put on your profile:** your picture and banner, if you upload them. They live in Supabase Storage and their URLs are public, like the rest of your public profile.

**If you donate:** the amount, the UPI reference number, your message if you leave one. Payments go straight to my UPI ID from your UPI app. The confirmation email is checked automatically against your UTR and I don't see card details or UPI credentials, just the amount and reference.

**AI handoff:** when you click "Ask AI," the question text (and your custom prompt, if you're a supporter who set one) gets sent to whichever provider you picked (ChatGPT, Claude, or Grok) via a URL. That's their policy from that point on, not mine.

## Why I collect it

- To keep you signed in
- To save your practice history and show your progress
- To show peer stats like "70% got this right" — these now include answers from mock tests too
- To show your profile to others (only if you turn on public profile)
- To display donations (unless you marked yours anonymous)
- To send push notifications (only if you turned them on)

**I am not interested in selling data.**

## Who else sees it

Just the services that make the app work:

- **Supabase** — database and login
- **Google** — for sign-in and web fonts
- **Vercel** — hosts the site
- **UPI networks** — for donations
- **AI providers** — only when you click "Ask AI"

That's it.

## Your controls

In **Settings**, you can turn off anything you don't want:

- Public profile — hide yourself from other users
- Share Progress & Global Ranking — stop broadcasting metrics and ranks
- Notifications — no push notifications
- Beta channel — opt out of early, unstable features (it doesn't control diagnostics)
- Custom AI prompt — supporters can save one and edit it anytime
- Themes and accents — a few of them are supporter-only

## Deleting your data

Two ways:

- **Delete Account** — Settings → Privacy & Data. Deletes your tests, revision sets, queue, bookmarks, goals, social links, push subscriptions and profile images, then strips your username, profile text, public visibility and tier tags and removes your sign-in. Your attempt history and question reports stay, but detached from you — they're what the peer stats are built on. Donation records stay for the ledger, also without your name. Your browser cache is wiped too. So "delete" means "detach my identity", not a total erase.
- **Clear Profile Data** — same menu. Resets your progress without deleting the account. You get 5 of these total.

If you want something specific deleted, just email me. I'll handle it.

## Your rights (DPDP Act, India)

You can ask to **see**, **fix**, or **delete** your data anytime. Email me and I'll respond as soon as I see it.

## Security

Everything goes over HTTPS. Database access is locked down per user. No plaintext passwords. But no system is perfect — if something ever goes wrong, I'll tell you.

## Data location

Supabase, Vercel, and the AI providers may store data outside India. Standard practice, protected by their own terms.

## Browser storage

I use:

- `localStorage` for your sign-in session, theme and preferences
- `IndexedDB` to cache questions, sessions and answers so practice works offline, plus peer stats for 30 minutes (all cleared when you log out)

Clearing browser data logs you out and resets your settings.

## When you leave the app

Clicking Discord, GitHub, or any external link takes you off-site. What happens there is their policy, not mine.

## Updates

I'll update this page when things change. The date at the top always reflects the current version. Big changes get announced in the app.
