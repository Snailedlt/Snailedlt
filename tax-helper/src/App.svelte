<script lang="ts">
  import { calculate, type TaxReport } from './lib/engine/calculate';
  import { SUPPORTED_TAX_YEARS, YEAR_PARAMS } from './lib/engine/rates';
  import { MissingRateError, RateTable, fetchNorgesBankRates, norgesBankUrl, parseNorgesBankCsv } from './lib/fx/rates';
  import { parseFile } from './lib/parsers';
  import type { Transaction } from './lib/types';
  import { DEMO_FILES, DEMO_YEAR, demoRates } from './lib/demo';
  import { countryFromIsin, kr, reportCsv } from './lib/report';

  interface LoadedFile {
    name: string;
    broker: string;
    transactions: Transaction[];
    warnings: string[];
  }

  let files = $state<LoadedFile[]>([]);
  let fileErrors = $state<string[]>([]);
  let taxYear = $state(SUPPORTED_TAX_YEARS[0]);
  let rates = $state<RateTable | null>(null);
  let ratesSource = $state<'norges-bank' | 'file' | 'demo' | null>(null);
  let rateError = $state('');
  let loadingRates = $state(false);
  let dragging = $state(false);
  let copied = $state('');

  const transactions = $derived(files.flatMap((f) => f.transactions));
  const currencies = $derived([...new Set(transactions.map((t) => t.currency))].filter((c) => c !== 'NOK').sort());
  const firstDate = $derived(transactions.map((t) => t.date).sort()[0]);
  const today = new Date().toISOString().slice(0, 10);

  const result = $derived.by((): { report?: TaxReport; error?: string } => {
    if (!transactions.length) return {};
    if (currencies.length && !rates) return {};
    try {
      return { report: calculate(transactions, { taxYear, fx: rates ? rates.lookup : () => 1 }) };
    } catch (e) {
      if (e instanceof MissingRateError) {
        return { error: `${e.message} Load rates that cover this date, or check the file.` };
      }
      return { error: (e as Error).message };
    }
  });

  async function addFiles(list: FileList | File[]) {
    for (const file of Array.from(list)) {
      if (files.some((f) => f.name === file.name)) {
        fileErrors = [...fileErrors, `${file.name} is already added.`];
        continue;
      }
      const text = await file.text();
      // A Norges Bank rates file can be dropped in the same place.
      if (/TIME_PERIOD/.test(text.slice(0, 2000)) && /OBS_VALUE/.test(text.slice(0, 2000))) {
        loadRatesFile(text);
        continue;
      }
      try {
        const parsed = parseFile(text, file.name);
        files = [...files, { name: file.name, ...parsed }];
      } catch (e) {
        fileErrors = [...fileErrors, (e as Error).message];
      }
    }
    if (currencies.length && ratesSource !== 'file' && ratesSource !== 'demo') await loadRates();
  }

  async function loadRates() {
    if (!currencies.length || !firstDate) return;
    loadingRates = true;
    rateError = '';
    try {
      rates = await fetchNorgesBankRates(currencies, firstDate, today);
      ratesSource = 'norges-bank';
    } catch {
      rateError = "Couldn't reach Norges Bank from this page.";
    } finally {
      loadingRates = false;
    }
  }

  function loadRatesFile(text: string) {
    try {
      const table = parseNorgesBankCsv(text);
      rates = rates && ratesSource !== 'demo' ? rates.merge(table) : table;
      ratesSource = 'file';
      rateError = '';
    } catch (e) {
      rateError = (e as Error).message;
    }
  }

  function loadDemo() {
    reset();
    files = DEMO_FILES.map((f) => ({ name: f.name, ...parseFile(f.text, f.name) }));
    taxYear = DEMO_YEAR;
    rates = demoRates();
    ratesSource = 'demo';
  }

  function reset() {
    files = [];
    fileErrors = [];
    rates = null;
    ratesSource = null;
    rateError = '';
  }

  function removeFile(name: string) {
    files = files.filter((f) => f.name !== name);
    if (!files.length) reset();
  }

  async function copy(value: number, key: string) {
    try {
      await navigator.clipboard.writeText(String(Math.round(value)));
      copied = key;
      setTimeout(() => (copied = ''), 1500);
    } catch {
      copied = '';
    }
  }

  function download() {
    if (!result.report) return;
    const blob = new Blob([reportCsv(result.report)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tax-report-${taxYear}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }
</script>

{#snippet copyable(value: number, key: string)}
  <button class="num-btn" onclick={() => copy(value, key)} title="Copy {kr(value)}">
    <span>{kr(value)}</span><span class="copy-hint">{copied === key ? 'Copied' : 'Copy'}</span>
  </button>
{/snippet}

<header class="top">
  <div class="wrap top-inner">
    <p class="brand">Foreign broker tax helper <span class="beta">Beta</span></p>
    <p class="privacy">Your files are read in this browser and never uploaded.</p>
  </div>
</header>

<main class="wrap">
  <section class="intro">
    <h1>Your foreign shares, ready for the Norwegian tax return</h1>
    <p class="lede">
      Trades with foreign brokers aren't filled in on your tax return (skattemeldingen). Upload your exports and get
      gains, losses, dividends and the shielding deduction (skjermingsfradrag) in NOK, for each company.
    </p>
  </section>

  <section class="step" aria-labelledby="s1">
    <h2 id="s1"><span class="step-n">1</span> Add your broker exports</h2>
    <div
      class="drop"
      class:dragging
      role="region"
      aria-label="Drop files here"
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={() => (dragging = false)}
      ondrop={onDrop}
    >
      <p><strong>Drop CSV files here</strong> or</p>
      <label class="btn primary">
        Choose files
        <input
          id="file-input"
          type="file"
          accept=".csv,text/csv"
          multiple
          onchange={(e) => {
            const input = e.currentTarget;
            if (input.files) addFiles(input.files).then(() => (input.value = ''));
          }}
        />
      </label>
      <p class="hint">
        Supported: Interactive Brokers (Activity Statement, CSV), Trading 212 (History export), DEGIRO
        (Transactions). Include every year since you first bought, so costs and shielding are right.
      </p>
      {#if !files.length}
        <button class="btn link" onclick={loadDemo}>Try it with example data</button>
      {/if}
    </div>

    {#each fileErrors as err}
      <p class="alert bad">{err}</p>
    {/each}

    {#if files.length}
      <ul class="files">
        {#each files as f (f.name)}
          <li>
            <div>
              <strong>{f.name}</strong>
              <span class="muted">{f.broker} · {f.transactions.length} rows read</span>
              {#each f.warnings as w}<p class="small warn-text">{w}</p>{/each}
            </div>
            <button class="btn ghost" onclick={() => removeFile(f.name)} aria-label="Remove {f.name}">Remove</button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if files.length}
    <section class="step" aria-labelledby="s2">
      <h2 id="s2"><span class="step-n">2</span> Tax year and exchange rates</h2>
      <div class="row">
        <label class="field">
          <span>Tax year</span>
          <select id="tax-year" bind:value={taxYear}>
            {#each SUPPORTED_TAX_YEARS as y}<option value={y}>{y}</option>{/each}
          </select>
        </label>
        <div class="field grow">
          <span>Exchange rates</span>
          {#if !currencies.length}
            <p>All amounts are already in NOK.</p>
          {:else if loadingRates}
            <p>Getting {currencies.join(', ')} rates from Norges Bank…</p>
          {:else if ratesSource === 'demo'}
            <p class="warn-text">Example rates (1 USD = 10.60 NOK). Load real rates before using real files.</p>
          {:else if rates}
            <p class="ok-text">
              Daily rates for {currencies.join(', ')} from Norges Bank{ratesSource === 'file' ? ' (your file)' : ''}.
            </p>
          {:else}
            <p>Rates for {currencies.join(', ')} are needed.</p>
          {/if}
        </div>
      </div>

      {#if rateError}
        <div class="alert warn">
          <p><strong>{rateError}</strong> You can load the rates yourself in two clicks:</p>
          <ol>
            <li>
              <a href={norgesBankUrl(currencies, firstDate ?? `${taxYear}-01-01`, today)} target="_blank" rel="noreferrer"
                >Download the rates file from Norges Bank</a
              >
            </li>
            <li>Drop the downloaded file into step 1.</li>
          </ol>
          <button class="btn ghost" onclick={loadRates}>Try again</button>
        </div>
      {/if}
    </section>
  {/if}

  {#if result.error}
    <p class="alert bad">{result.error}</p>
  {/if}

  {#if result.report}
    {@const r = result.report}
    {@const p = YEAR_PARAMS[taxYear]}
    <section class="step" aria-labelledby="s3">
      <h2 id="s3"><span class="step-n">3</span> Your numbers for {taxYear}</h2>

      <div class="tiles">
        <div class="tile"><span>Gains</span><b>{kr(r.totals.gainsNok)}</b></div>
        <div class="tile"><span>Losses</span><b>{kr(r.totals.lossesNok)}</b></div>
        <div class="tile"><span>Taxable dividends</span><b>{kr(r.totals.taxableDividendsNok)}</b></div>
        <div class="tile"><span>Foreign tax withheld</span><b>{kr(r.totals.withholdingNok)}</b></div>
        <div class="tile accent">
          <span>Estimated tax</span><b>{kr(r.totals.estimatedTaxNok)}</b>
          <small>({kr(r.totals.netResultNok + r.totals.taxableDividendsNok)} × {p.upwardFactor} × 22%, before credit for foreign tax)</small>
        </div>
      </div>

      {#each r.warnings as w}<p class="alert warn">{w}</p>{/each}

      <h3>Per company</h3>
      <p class="muted small">
        On the tax return, add each company under shares in foreign companies and enter these figures. Click a
        number to copy it.
      </p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th class="r">Gain</th>
              <th class="r">Loss</th>
              <th class="r">Dividends (taxable)</th>
              <th class="r">Foreign tax</th>
              <th class="r">Shares 31.12</th>
              <th class="r">Unused shield</th>
            </tr>
          </thead>
          <tbody>
            {#each r.securities as s (s.securityId)}
              <tr>
                <td>
                  <strong>{s.name}</strong>
                  <span class="muted small block">{s.isin ?? s.symbol}{s.isin ? ` · ${countryFromIsin(s.isin)}` : ''}</span>
                </td>
                <td class="r">{@render copyable(s.gainsNok, `${s.securityId}-g`)}</td>
                <td class="r">{@render copyable(s.lossesNok, `${s.securityId}-l`)}</td>
                <td class="r">
                  {@render copyable(s.taxableDividendsNok, `${s.securityId}-d`)}
                  {#if s.dividendsNok > 0}<span class="muted small block">of {kr(s.dividendsNok)} received</span>{/if}
                </td>
                <td class="r">{@render copyable(s.withholdingNok, `${s.securityId}-w`)}</td>
                <td class="r">{s.sharesAtYearEnd}</td>
                <td class="r">{kr(s.unusedShieldAtYearEndNok)}</td>
              </tr>
              {#if s.sales.length}
                <tr class="detail">
                  <td colspan="7">
                    <details>
                      <summary>{s.sales.length} sale{s.sales.length > 1 ? 's' : ''}: how the gain was worked out</summary>
                      <table class="inner">
                        <thead>
                          <tr><th>Date</th><th class="r">Shares</th><th class="r">Proceeds</th><th class="r">Cost (FIFO)</th><th class="r">Result</th><th class="r">Shield used</th><th class="r">Taxable</th></tr>
                        </thead>
                        <tbody>
                          {#each s.sales as sale}
                            <tr>
                              <td>{sale.date}</td><td class="r">{sale.quantity}</td><td class="r">{kr(sale.proceedsNok)}</td>
                              <td class="r">{kr(sale.costNok)}</td><td class="r">{kr(sale.resultNok)}</td>
                              <td class="r">{kr(sale.shieldUsedNok)}</td><td class="r"><b>{kr(sale.taxableResultNok)}</b></td>
                            </tr>
                          {/each}
                        </tbody>
                      </table>
                    </details>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
      <div class="row">
        <button class="btn primary" onclick={download}>Download report (CSV)</button>
        <button class="btn ghost" onclick={reset}>Start over</button>
      </div>
    </section>

    <section class="step guide" aria-labelledby="s4">
      <h2 id="s4"><span class="step-n">4</span> Entering it on the tax return</h2>
      <ol>
        <li>Open your tax return on skatteetaten.no and find the section for shares, then add a share in a foreign company.</li>
        <li>For each company above, enter the name, country and ISIN, then its gain or loss and dividends.</li>
        <li>Enter the foreign tax withheld so you get credit for it (kreditfradrag). For US shares the credit is normally capped at 15% of the dividend.</li>
        <li>For wealth tax, also enter the market value of the shares you held on 31 December. This tool doesn't know prices, so look them up at your broker.</li>
        <li>Keep the downloaded report with your records.</li>
      </ol>
    </section>
  {/if}

  <section class="fine">
    <h2>What this does and doesn't cover</h2>
    <ul>
      <li>Shares and ETFs owned directly by a private person. Not options, bonds, crypto, share savings accounts (aksjesparekonto) or companies.</li>
      <li>First-in, first-out across all your files, with cost and proceeds converted to NOK on each trade date.</li>
      <li>Shield rates and upward factors are built in for {SUPPORTED_TAX_YEARS.at(-1)}–{SUPPORTED_TAX_YEARS[0]}. Shielding for years before 2019 isn't counted yet.</li>
      <li>Not handled yet: stock splits and other corporate actions, currency gains on cash, DEGIRO dividends, and funds taxed as bond funds.</li>
      <li>This is a helper, not tax advice. Check the figures before you submit, and ask Skatteetaten or an accountant if you're unsure.</li>
    </ul>
  </section>
</main>
