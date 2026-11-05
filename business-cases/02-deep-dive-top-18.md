# Deep dive: top 18 ideas

Each idea gets the same five questions: **who pays, what they pay, how many customers make €1,000/month, what proves it works, and what could make it a time sink.**
Verdict: ✅ top pick · 🟡 good backup · ❌ dropped after the deep dive.

| # | Idea | Who pays | Price idea | Customers for €1k/mo | Proof it works | Maintenance trap | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Pro add-on for a library | Companies using the library in production | €99–999 / year per company | ~12 at €999/yr | Sidekiq: free core + Pro/Enterprise, one person, millions/yr (self-reported). BullMQ Pro ~$18k MRR | Getting adoption first is the hard part; keep Pro features stable | ✅ |
| 2 | Cron / heartbeat monitor | DevOps people, agencies, small SaaS | Free tier; €8 / €20 / €80 per month | 50 at €20 | Healthchecks.io: BSD-licensed, one person part-time, 825 paying accounts, $18.3k MRR (Feb 2026) | Must be reliable. Keep alerting simple (email, Slack, webhook) | ✅ |
| 3 | Database anonymizer CLI | Dev teams with personal data (GDPR) | Free CLI; Pro €29/mo per project, Team €99/mo | 35 at €29 | Enterprise test-data tools charge thousands per year; small teams are unserved | Supporting many databases. Start with Postgres only | ✅ |
| 4 | EU e-invoice toolkit | Accounting apps, ERPs, small SaaS that send invoices | Free library; API €49–299/mo | 10 at €99 | Belgium B2B mandate live since Jan 2026; Germany issuance 2027–28; France from 2026–27 | Spec updates a few times a year; don't become an access point (certification) at first | ✅ |
| 5 | Premium UI blocks | Developers and agencies building sites | Free kit; €149 one-time, €349 team | 7 sales / month | Tailwind Labs built a business on paid UI blocks over a free framework | Framework upgrades (e.g. Tailwind, React majors) every year or two | ✅ |
| 6 | Form backend | Static site owners, agencies, Jamstack devs | Free 50/mo; €9 / €29 per month | ~60 at €15 avg | Formspree, Basin, Getform are long-running paid businesses | Spam. Ship honeypot + rate limits on day one | ✅ |
| 7 | SaaS data backup to your S3 | Teams that fear losing GitHub/Notion/Jira data | €15 / workspace / mo; €49 business | 40 at €25 | Rewind (bought BackHub) shows companies pay for SaaS backup | Third-party API changes. Start with GitHub (stable API) | ✅ |
| 8 | GitHub App (free public, paid private) | Engineering teams | ~€4 / seat / mo via GitHub Marketplace | ~250 seats | Many Marketplace apps use this exact free-for-OSS model | GitHub API changes are rare and well announced | ✅ |
| 9 | OG image generator | Bloggers, SaaS marketing sites | €9 / €19 per month | ~70 | Several small paid APIs exist | Very low, but low price ceiling and Vercel offers a free library | 🟡 |
| 10 | Static status page | SaaS teams | €15 / €49 per month | ~40 | Statuspage, Instatus are paid | Competes with free Upptime | 🟡 |
| 11 | Changelog widget | SaaS teams | €9 / €29 per month | ~60 | Beamer, Headway are paid | Low willingness to pay | 🟡 |
| 12 | SaaS starter kit | Indie hackers | €199 one-time | 5 sales / month | Many kits sell well | Dependencies age fast; buyers expect updates | 🟡 |
| 13 | LLM cost proxy | Teams using AI APIs | €29–199 / month | ~15 | LiteLLM, Helicone show demand | AI APIs change monthly: too much upkeep | ❌ |
| 14 | HTML → PDF API | Apps making invoices/reports | €19 / €49 per month | ~30 | DocRaptor, PDFShift | Headless Chrome is heavy; Gotenberg is free | 🟡 |
| 15 | Editor plugin Pro | Note-takers, devs | €5–25 one-time | Many sales | Some Obsidian plugins earn | Low prices; editor API changes | 🟡 |
| 16 | Niche MCP server | AI power users | €10–30 / month | ~50 | Early market | Spec and clients change fast | ❌ |
| 17 | Screenshot API | Devs, marketers | €19–99 / month | ~25 | ScreenshotOne, Urlbox | Browser fleets break, abuse, high hosting cost | ❌ |
| 18 | Webhook inspector | Developers | €10–30 / month | ~50 | webhook.site, Hookdeck | Storage of other people's payloads, abuse | ❌ |

## Why these 8 won
- They sell to **businesses**, not hobbyists.
- None needs you to store sensitive data at scale or run a browser fleet.
- Each has a **free open-source version** that markets itself, and a **paid version** that is either a license key (no servers) or a small, boring hosted service.

## Sources
- [Healthchecks.io About page (MRR, paying accounts)](https://healthchecks.io/about) · [Running a one-man SaaS, 9 years in](https://blog.healthchecks.io/2024/07/running-one-man-saas-9-years-in/)
- [Sidekiq (Wikipedia)](https://en.wikipedia.org/wiki/Sidekiq) · [Startups for the Rest of Us ep. 661](https://www.startupsfortherestofus.com/episodes/episode-661-millions-in-revenue-as-a-one-person-software-company)
- [Indie Hackers: BullMQ Pro](https://www.indiehackers.com/post/msg4SYwhig4CiPxFzvlB)
- [Fonoa: Peppol adoption in Europe 2026](https://www.fonoa.com/resources/blog/peppol-adoption-europe-2026-mandates-vida) · [VATCalc: Belgium B2B e-invoicing 2026](https://www.vatcalc.com/?p=27567) · [eConnect: Mandatory e-invoicing in 2026](https://econnect.eu/en/blog/mandatory-e-invoicing-in-2026-which-countries-are-affected-0)
- [Plausible: open-source SaaS](https://ingest.plausible.io/blog/open-source-saas)

> E-invoicing dates differ between sources (especially France). Check the national tax authority before building on a date.
