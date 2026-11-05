# Open-source business ideas, scored for low maintenance

**Goal:** an open-source project that earns money while needing little of your time.
**Scoring:** 1 (bad) to 5 (great) on each axis. **Max score is 20.**

| Axis | What a 5 means |
|---|---|
| **Useful** | People feel the pain weekly and search for a fix |
| **Easy to build** | A working v1 takes a few weekends |
| **Easy to maintain** | Stateless, few dependencies, rare breaking changes, no 3 a.m. pages |
| **Profitable** | Businesses (not hobbyists) pay, and the price can be €20+/month |

## The scoreboard

| # | Idea | One-line pitch | How it earns | Useful | Build | Maintain | Profit | **Total** |
|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| 1 | **Pro add-on for a popular library** | Free core library, paid "Pro" package with the features companies need | Yearly license key | 4 | 3 | 5 | 5 | **17** |
| 2 | **Cron job / heartbeat monitor** | "Tell me when my nightly backup didn't run" | Hosted plans; self-host free | 5 | 5 | 4 | 3 | **17** |
| 3 | **EU e-invoice toolkit** | Library + API that makes and checks legally valid e-invoices (Peppol, XRechnung, Factur-X) | Hosted validation/convert API | 5 | 3 | 3 | 5 | **16** |
| 4 | **Database anonymizer CLI** | Copy production DB to staging with personal data scrambled (GDPR) | Pro license for teams/CI | 5 | 3 | 4 | 4 | **16** |
| 5 | **Premium UI blocks** | Free open component kit, paid packs of ready-made page sections | One-time purchase | 4 | 4 | 4 | 4 | **16** |
| 6 | **Form backend for static sites** | Point an HTML form at a URL, get submissions by email/webhook | Hosted plans by volume | 4 | 5 | 4 | 3 | **16** |
| 7 | **GitHub App: free for public, paid for private** | A PR checker (licenses, PR size, policy rules) | GitHub Marketplace per-seat | 4 | 4 | 4 | 3 | **15** |
| 8 | **SaaS data backup** | Nightly backup of GitHub / Notion / Jira into *your* S3 bucket | Hosted plans; self-host free | 5 | 3 | 3 | 4 | **15** |
| 9 | **OG / social image generator** | Template + URL params → share image | Hosted API by volume | 3 | 5 | 5 | 2 | **15** |
| 10 | **Static status page** | Status page built by CI, hosted on a CDN | Hosted plans, custom domain | 4 | 4 | 4 | 3 | **15** |
| 11 | **Changelog / "What's new" widget** | Drop-in widget fed from Markdown or GitHub Releases | Hosted plans | 3 | 5 | 5 | 2 | **15** |
| 12 | **SaaS starter kit** | Free boilerplate, paid Pro kit (billing, teams, auth) | One-time purchase | 4 | 4 | 3 | 4 | **15** |
| 13 | **LLM cost & budget proxy** | One gateway for AI API keys with per-team budgets and logs | Hosted plans | 5 | 4 | 2 | 4 | **15** |
| 14 | **HTML → PDF rendering API** | Invoices, reports, tickets from HTML templates | Hosted API by volume | 4 | 4 | 3 | 3 | **14** |
| 15 | **Editor plugin with Pro tier** | Obsidian / VS Code plugin, Pro unlock | License key | 3 | 5 | 4 | 2 | **14** |
| 16 | **Niche MCP server** | Connects AI assistants to one business tool | Hosted tier | 4 | 4 | 2 | 3 | **13** |
| 17 | **Screenshot API** | URL → screenshot | Hosted API by volume | 4 | 3 | 2 | 4 | **13** |
| 18 | **Webhook inspector / relay** | Catch, view and replay webhooks | Hosted plans | 4 | 3 | 3 | 3 | **13** |
| 19 | Cookie consent banner | GDPR banner + scanner | Hosted plans | 4 | 3 | 2 | 3 | 12 |
| 20 | Privacy-friendly analytics | Google Analytics alternative | Hosted plans | 4 | 3 | 2 | 3 | 12 |
| 21 | Feature flags | Toggle features without deploys | Hosted plans | 4 | 3 | 3 | 2 | 12 |
| 22 | Link shortener + QR | Short links with stats | Hosted plans | 3 | 5 | 3 | 1 | 12 |
| 23 | Newsletter platform | Self-hosted Mailchimp | Hosted plans | 4 | 2 | 1 | 3 | 10 |
| 24 | File transfer | Self-hosted WeTransfer | Hosted plans | 3 | 4 | 2 | 1 | 10 |

## What the research says (patterns that hold up)

1. **Donations alone don't pay.** A popular dev tool (mise) reports ~$500/month from GitHub Sponsors. Plan for a product people *buy*.
2. **Sell convenience, not code.** Plausible and Ghost make nearly all revenue from managed hosting while the code stays open.
3. **License keys are the lowest-maintenance money.** Sidekiq's free core + closed Pro/Enterprise add-ons is run by one person and earns millions a year (self-reported). No servers to babysit.
4. **Avoid ideas where *you* carry ops risk:** email deliverability, storing lots of user data, headless browsers at scale, fast-moving AI APIs. Those are the low "Maintain" scores above.
5. **Regulation creates buyers who must pay.** GDPR (anonymizer, backups) and EU e-invoicing mandates make companies buy, not "nice to have."

## Sources
- [Plausible: open-source SaaS to $1M ARR](https://ingest.plausible.io/blog/open-source-saas)
- [Open-source business models research (Ghost, Plausible, Cal.com, Discourse)](https://devon-wiki.pages.dev/research/oss-business-models)
- [jdx (mise): going full-time on open source, sponsor numbers](https://jdx.dev/posts/2026-04-17-going-full-time-on-open-source/)
- [Sidekiq (Wikipedia)](https://en.wikipedia.org/wiki/Sidekiq) and [Startups for the Rest of Us ep. 661](https://www.startupsfortherestofus.com/episodes/episode-661-millions-in-revenue-as-a-one-person-software-company)
- [Mike Perham: The path to full-time open source](https://mikeperham.com/2014/10/01/the-path-to-full-time-open-source)
- [Indie Hackers: BullMQ Pro / Taskforce](https://www.indiehackers.com/post/msg4SYwhig4CiPxFzvlB)
- [Coolify pricing teardown](https://dev.to/beton/coolify-pricing-teardown-2026-5675)

> Revenue figures are self-reported or from third-party blogs; treat them as direction, not fact.
