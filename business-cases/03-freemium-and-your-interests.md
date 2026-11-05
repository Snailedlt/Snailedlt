# Can it stay free and still pay? + picks that fit you

## Short answer
**Yes, with freemium.** Keep the tool free for individuals and hobby use, and charge at the point where a *business* hits a limit: more seats, more volume, private use, automation, or an official report.
Fully free with donations alone usually stays at hobby money (mise: ~$500/month from sponsors).

**The math:** developer tools convert roughly 2–8% of active free users to paid.
`3,000 free users × 3% = 90 paying × €11 ≈ €1,000 / month`

| Freemium model | Free part | Paid part | Real example | Pays well? |
|---|---|---|---|---|
| Usage limit | Small volume | More checks, seats, submissions | Healthchecks.io: $18.3k/month, one person | ✅ Yes |
| Free for people, paid for companies | Personal + open-source use | Commercial license | Sidekiq Pro, BullMQ Pro | ✅ Yes |
| Free to use, pay to export | Preview the result | Full report or file | Tax report tools | ✅ Yes |
| Users free, organizers pay | Players, attendees | Per event / per team | Tournify: £35 per tournament | 🟡 Medium |
| Free + hosted convenience | Self-host | Managed version | Plausible: $1M/year | ✅ Yes |
| Free + sponsors/ads | Everything | Nothing | mise: ~$500/month | ❌ Rarely |

All 8 picks in [02-deep-dive-top-18.md](02-deep-dive-top-18.md) already have a free tier that stays free.

## New: picks matched to your interests
Based on your GitHub profile: ServiceNow, investing, volleyball, snowboarding/skiing, your portfolio site, devicon and SVG Recolor.

| # | Idea | Fits | Free tier | Paid | €1k/month = | U | B | M | P | **Total** |
|---|---|---|---|---|---|:-:|:-:|:-:|:-:|:-:|
| A | **ServiceNow developer toolkit** (VS Code: Glide autocomplete, linting, sync, ATF scaffolding) | ServiceNow + consulting | Free for individual devs | €8/mo Pro, €15/seat team | ~70 seats | 5 | 3 | 4 | 4 | **16** |
| B | **Norwegian investor tax helper** (IBKR/Degiro/Nordnet → numbers for the tax return, in NOK) | Investing | Free preview | €39 per tax year | ~300 reports/yr | 5 | 3 | 3 | 4 | **15** |
| C | **Beach volleyball tournament organizer** (pools, brackets, King of the Beach, live scores) | Volleyball | Players free; events ≤ 8 teams free | €1.50/team or €29/event | ~35 events of 20 teams | 4 | 3 | 4 | 3 | **14** |
| D | **Powder alert for Norway** (fresh-snow alerts + avalanche danger) | Snowboarding, skiing | One area free | €19/season + affiliates | ~600 passes/yr | 4 | 4 | 4 | 2 | **14** |
| E | **Git-CMS website kit for consultants** (SvelteKit + Sveltia CMS) | Your portfolio goal | Base theme free | €59/theme, €149 all | ~12 sales/mo | 3 | 4 | 4 | 3 | **14** |
| F | **SVG icon toolkit** (recolor/theme/batch export; builds on SVG Recolor) | devicon + SVG Recolor | Web tool free | €5/mo or €49 lifetime | ~200 subs | 3 | 5 | 5 | 2 | **15** |

**Best two for you:** **A** for the money, because companies pay for it. **B** is a tool you'd use yourself every spring. C–F are good side projects that bring in less.

### Notes and risks
- **A:** SN Utils is the strong free incumbent and already has a Pro tier. Compete on what it lacks (types, linting). ServiceNow ships two releases a year.
- **B:** Mistakes cost users money. Use clear disclaimers, test against real returns, and check the rules on skatteetaten.no.
- **C:** Seasonal. Official federation events may use their own system, so target clubs, series and company events.
- **D:** MET Norway's API is free for commercial use (CC BY 4.0, needs a proper User-Agent and caching). Check Varsom's data terms before launch.
- **F:** Low price ceiling. Best as an audience builder that leads people to your other tools.

## Sources
- [Freemium conversion benchmarks 2026](https://www.artisangrowthstrategies.com/blog/freemium-conversion-rate-benchmarks) · [ChartMogul conversion report](https://chartmogul.com/reports/saas-conversion-report/)
- [Healthchecks.io metrics](https://healthchecks.io/about)
- [SN Utils (Pro tier)](https://addons.mozilla.org/firefox/addon/servicenow-utils2) · [SN Utils repo overview](https://relatedrepos.com/gh/arnoudkooi/SN-Utils)
- [Tournify volleyball pricing](https://tournify.uk/sports/volleyball) · [R2 Sports sand volleyball pricing](https://www.r2sports.com/cartProducts/sand-volleyball-tournament-software.asp)
- [MET Norway API FAQ](https://docs.api.met.no/doc/FAQ) · [MET terms of service](https://api.met.no/doc/TermsOfService) · [Varsom fact sheet](https://www.varsom.no/media/1648/fakta_varsom_en.pdf)
- [Ghostfolio (open-source wealth tracker with Premium tier)](https://github.com/ghostfolio/ghostfolio)
- [IBKR tax information](https://www.interactivebrokers.co.uk/en/index.php?f=39943)
