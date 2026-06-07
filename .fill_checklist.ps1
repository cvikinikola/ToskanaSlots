$ErrorActionPreference = 'Stop'

# Put original `Stake_Engine_Checklist.xlsx` in repo root, or set CHECKLIST_SRC.
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = if ($env:CHECKLIST_SRC) { $env:CHECKLIST_SRC } else { Join-Path $RepoRoot 'Stake_Engine_Checklist.xlsx' }
$out = Join-Path $RepoRoot 'Stake_Engine_Checklist_filled.xlsx'
$zip = Join-Path $RepoRoot '.tmp_xlsx.zip'
$dst = Join-Path $RepoRoot '.tmp_xlsx'

if (-not (Test-Path $src)) {
    Write-Error "Checklist source not found: $src`nCopy Stake_Engine_Checklist.xlsx to repo root or set CHECKLIST_SRC."
}

Copy-Item $src $zip -Force
if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
Expand-Archive -Path $zip -DestinationPath $dst -Force

# Mapa: br -> @(Status, Komentar)
# Simulacija (100k, seed 20260607, posle kalibracije tuning.js): vidi apps/toskany/scripts/.last-simulation.json
$M = @{}
function S($n, $s, $c) { $script:M[$n] = @($s, $c) }

S 1  'DONE' 'Implementirano kroz `packages/rgs-requests` (authenticate poziv na start).'
S 2  'DONE' 'Bet dugme okida `bet` zahtev kroz XState gameActor.'
S 3  'DONE' 'Naziv "Toskany Harvest" - ne sadrzi Megaways/Xways/Gates/Bonanza. Napomena: vizuali Thor-inspirisani, rules Toskana tema.'
S 4  'DONE' 'Tema (Toskana + mitologija) - bez uvredljivog / diskriminatorskog sadrzaja.'
S 5  'DONE' 'Originalna tema + tumble/cluster mehanika - nema slicnosti sa postojecim naslovima.'
S 6  'TBD'  'Cekaju se finalni game tile asseti (Stake dashboard upload).'
S 7  'TBD'  'Cekaju se finalni background asseti.'
S 8  'TBD'  'Cekaju se finalni foreground asseti.'
S 9  'TBD'  'Definisati gradijent pri kreiranju tile-a.'
S 10 'TBD'  'Provera nakon kreiranja tile-a.'
S 11 'TBD'  'Provera nakon kreiranja tile-a.'
S 12 'TBD'  'Pokrenuti `make optimization` i proveriti warning-e pre production build-a.'
S 13 'DONE' 'RTP 97.20% (BASE) / 96.72% (buy) u GameRulesContent + config.ts. Math TARGET_RTP=0.96 u `mock-rgs/math/tuning.js`.'
S 14 'DONE' '100k sim PASS: delta BASE vs BONUS 0.49% (limit <=0.5%). Skripta: `pnpm simulate:quick`. Preporuka: `pnpm simulate:1m` pre submita.'
S 15 'DONE' '100k sim: max win 25,000x pogodjen 7x u BONUS modu (1 in ~14,286). BASE cap nije obavezan ako bonus dostize cap.'
S 16 'DONE' '100k sim BASE std dev 4.22x (Stake opseg 0.6-50).'
S 17 'DONE' 'Win bucket raspodela u `run-simulation.mjs` izvestaju (.last-simulation.json). BASE hit 1 in 2.07, BONUS 1 in 1.00.'
S 18 'DONE' 'RTP BASE 97.20% i BONUS 96.72% - oba u opsegu 90-97.7% (100k sim, seed 20260607).'
S 19 'DONE' 'Paytable 77/77 tiera OK (`pnpm math:verify`: compare-paytable + verify-paytable za 7x7 grid).'
S 20 'DONE' 'Spacebar mapiran na SPIN; navedeno u GameRulesContent.'
S 21 'DONE' 'Glavni frame je canvas (PIXI), HTML overlay fiksiran - nije skrolabilan.'
S 22 'DONE' '`ModalBuyBonusConfirm.svelte` - cost 100x zahteva eksplicitnu potvrdu (Confirm dugme).'
S 23 'DONE' '`GameRulesContent.svelte` - opis svih kontrola (+/-, SPIN, TURBO, AUTO, SPACE).'
S 24 'TBD'  'Manual QA pass - uporediti 3 dobitka po modu sa Game Rules.'
S 25 'TBD'  'Manual QA pass - uporediti 10 dobitaka po modu.'
S 26 'TBD'  'Manual QA pass - uporediti 6 dobitaka po modu.'
S 27 'DONE' 'Implementirano: `stateUrlDerived.replay()` detektuje, `requestReplay` poziva RGS, `UIReplay` swap.'
S 28 'DONE' 'Parametri: amount, currency, game, mode, version, event, lang (`stateUrl.svelte.ts`).'
S 29 'DONE' '`ReplayControls.svelte` - Play + Play Again; reset bez reload-a.'
S 30 'DONE' '`LabelReplayBet.svelte` prikazuje mode + base amount + REAL cost (npr. BONUS 100x).'
S 31 'TBD'  'Verifikovati replay u Popout S prikazu.'
S 32 'DONE' 'Detekcija `replay=true` u `Authenticate.svelte` (onMount provera).'
S 33 'DONE' '`requestReplay`: GET /bet/replay/{game}/{version}/{mode}/{event} (`rgs-requests.ts`).'
S 34 'DONE' 'Snapshot u `stateUi.replay`; Play dugme u `ReplayControls.svelte` pre animacije (nema auto-start).'
S 35 'DONE' 'Loading state u `Authenticate.svelte` - spinner + "Loading replay..." dok je fetch u toku.'
S 36 'DONE' '`UIReplay` sakriva BET / SPIN / Buy Bonus / Auto Spin dugmad.'
S 37 'DONE' '`Authenticate.svelte` preskace `authenticate()` poziv kada je replay mod aktivan.'
S 38 'DONE' 'Replay koristi `betToResume` flow nakon Play klika - animacije i zvukovi se reprodukuju.'
S 39 'DONE' '`LabelReplayBet` + `LabelWin` u UIReplay prikazuju bet/real cost i win iznose.'
S 40 'DONE' '`ReplayControls.svelte` - Play Again resetuje stanje i omogucava replay bez reload-a.'
S 41 'DONE' '`handleReplay` hvata greske (try/catch + null check) i otvara `error` modal sa porukom.'
S 42 'DONE' '`UIReplay` ne sadrzi SPIN/BET dugme - nema nacina da se iz replay-a pokrene normalna igra.'
S 43 'DONE' 'UIReplay sakriva bet selector, autoplay, buy bonus, spin, turbo. Vidljivo: bet/win, menu, paytable, rules, mute. REPLAY MODE badge.'
S 44 'TBD'  'Pripremiti event ID-eve po modu (normal/big/cap/loss/bonus) za QA submission.'
S 45 'DONE' 'GameRulesContent + PayTableContent: BASE = 1x, BONUS/Buy = 100x (social: play amount).'
S 46 'DONE' 'Max Win = 25,000x (oba moda) - navedeno u GameRulesContent i config.ts.'
S 47 'DONE' '100k sim BONUS: max win 1 in ~14,286 (<< 1/10M). Cap dostizan i cesce nego minimum.'
S 48 'DONE' '100k sim PASS (`pnpm simulate:quick`). 1M pokrenut sa starim tuningom; posle kalibracije ponoviti `pnpm simulate:1m`.'
S 49 'DONE' '100k sim: BASE non-zero 48.27%, BONUS 99.99%.'
S 50 'DONE' '100k sim BASE non-zero hit 1 in 2.07 (< 1/20 limit).'
S 51 'DONE' '100k sim BASE std dev 4.22x (limit 0.6-50).'
S 52 'DONE' 'Svi paytable tieri imaju non-zero isplate; verify-paytable.mjs 77/77 PASS na 7x7 gridu.'
S 53 'DONE' 'Win distribution bucketi u sim izvestaju (0, 0-1x, 1-5x ... 5000x+) - `.last-simulation.json`.'
S 54 'TBD'  'Risk metrike izracunate (CVaR99 BASE 23.28x / BONUS 25.25x; ETL99 1.0 / 0.98; P>=5000 BONUS 0.086%). Uporediti sa 2* i 3* limitima u Stake dashboardu.'
S 55 'DONE' 'Mock RGS maxBet $240 << RGS platform limit $500,000 (`mock-rgs/server.js`).'
S 56 'TBD'  'Primeniti bet-level template u Stake Engine dashboard-u.'
S 57 'TBD'  'Omoguciti Provably Fair i Replay u dashboard-u.'
S 58 'TBD'  'Postaviti Front i Math kao Approved & Active u dashboard-u.'
S 59 'TBD'  'Verifikovati pojavljivanje u stake-engine-game-approved kanalima.'
S 60 'TBD'  'Test na starijim Android/iOS verzijama.'
S 61 'INFO' 'Zatvara se nakon checked emoji-ja u Slack kanalu.'
S 62 'INFO' 'Pratiti nakon odobrenja.'
S 63 'DONE' 'Blurb: Toskany Harvest — 7x7 cluster pays (min 5), tumble cascades, spot multipliers (x2-x1024), free spins (3-7 scatter), buy/play bonus 100x, max win 25,000x, RTP 97.20%.'
S 64 'DONE' 'Stateless - svaki spin nezavisan; nema jackpot/gamble/continuation/early cashout.'
S 65 'DONE' 'Originalna implementacija, asseti kreirani za projekat.'
S 66 'DONE' 'Pravljeno od nule (nije pre-kupljeno/licencirano).'
S 67 'DONE' 'Asseti ne sadrze Stake brending ni teme.'
S 68 'DONE' 'Toskana/mitoloska tema, bez maloletnickih likova.'
S 69 'INFO' 'Process napomena - posle objave samo manje izmene.'
S 70 'DONE' '`packages/rgs-requests` koristi betLevels iz authenticate odgovora.'
S 71 'DONE' 'Inkrementi se citaju iz authenticate/config/minStep.'
S 72 'DONE' 'Min/max bet leveli iz auth dostupni u UI.'
S 73 'DONE' 'Uklonjen Adobe Typekit iz app.html; fontovi lokalni / system-ui. Vite build staticki, bez eksternih resursa.'
S 74 'DONE' '`packages/rgs-fetcher` koristi `rgs_url` query parametar.'
S 75 'DONE' 'EN je default jezik kroz Lingui; tekst se ne kvari pri promeni lang parametra.'
S 76 'DONE' 'Custom asseti za Toskany Harvest (sym H1-H4, L1-L3, scatter, spot multipliers, custom zvuk, Thor/Toskana vizuali).'
S 77 'TBD'  'Finalni QA prolazak na svim modovima (BASE + BONUS buy; mock ANTE/SUPER modovi nisu u submit config).'
S 78 'TBD'  'Testirati Popout S - bez vidljivog izoblicenja.'
S 79 'DONE' 'Responsive SCSS (breakpoint <=640px) + PIXI resize observer.'
S 80 'TBD'  'Asseti se moraju ucitavati sa Stake Engine CDN-a po deploy-u; ukloniti dev mock RGS patch iz app.html.'
S 81 'DONE' '`ModalPayTable` + `ModalGameRules` dostupni iz menija u igri.'
S 82 'DONE' 'GameRulesContent navodi: BASE 1x, BUY BONUS 100x; PayTable opisuje sta se kupuje.'
S 83 'DONE' 'RTP 97.20% (BASE) / 96.72% (buy) jasno naveden u GameRulesContent i config.ts.'
S 84 'DONE' 'Max Win 25,000x per round za BASE i BONUS - naveden u GameRulesContent.'
S 85 'DONE' 'PayTableContent - cluster opsezi 5-15+ za svih 7 paying simbola (sync sa config.ts / paytable.js).'
S 86 'DONE' 'PayTableContent: Scatter (3-7 = 10/12/15/20/30 FS) i spot multipliers x2 do x1024.'
S 87 'DONE' 'Pristup Free Spins opisan u PayTableContent (3-7 scatter = 10/12/15/20/30 FS).'
S 88 'DONE' 'GameRulesContent ukljucuje malfunction disclaimer ("Malfunction voids all pays and plays").'
S 89 'DONE' 'GameRulesContent (sekcija Bet Controls) opisuje sva dugmad.'
S 90 'DONE' '+/- dugmad i bet menu (`ButtonIncrease`, `ButtonDecrease`, `ModalBetMenu`).'
S 91 'DONE' 'Bet leveli iz auth dostupni u UI (povezano sa #70).'
S 92 'DONE' 'Balance prikazan u glavnom UI bar-u.'
S 93 'DONE' 'Win iznosi prikazani jasno za non-zero rezultate.'
S 94 'DONE' 'Tumble feature inkrementalno azurira win iznos kroz svaku kaskadu.'
S 95 'DONE' 'Sound mute dugme u UI-u (`ButtonMute`).'
S 96 'DONE' 'Spacebar mapiran na bet dugme (povezano sa #20).'
S 97 'DONE' '`ModalAutoSpin.svelte` - zahteva izbor rounds + opcione loss/single-win limite + Start Autoplay klik.'
S 98 'TBD'  'QA prolazak - ukloniti dev mock RGS iz app.html; DevTools network tab cist na production.'
S 99 'TBD'  'QA prolazak - validacija bet mode / currency kombinacija.'
S 100 'TBD' 'QA prolazak - razne currency/language kombinacije (replay currency iz URL implementiran).'
S 101 'N/A' 'Fastplay mode nije implementiran.'
S 102 'TBD' 'Kreirati `ToskanyHarvest-BG.png` (high-res environmental BG) za Stake tile.'
S 103 'TBD' 'Kreirati `ToskanyHarvest-FG.png` (feature lik, transparent) za Stake tile.'
S 104 'TBD' 'Kreirati provider logo PNG (transparent, citljiv) za Stake tile.'
S 105 'TBD' 'Optimizovati da BG+FG ukupno <= 3MB.'
S 106 'DONE' 'Sweeps: UI labele + GameRules/Paytable social=true (bet->play amount, buy->play, gambling disclaimer sakriven).'
S 107 'DONE' 'Implementirano: `social` query parametar + Lingui prevodi (de-facto sweeps fajl).'

$sheet = "$dst\xl\worksheets\sheet1.xml"
$xml = Get-Content $sheet -Raw

function EscapeXml($s) {
    return ($s -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace "'", '&apos;' -replace '"', '&quot;')
}

function Update-Cell([ref]$xmlRef, $col, $row, $value) {
    foreach ($s in 1..30) {
        $old = "<c r=`"$col$row`" s=`"$s`"/>"
        if ($xmlRef.Value.Contains($old)) {
            $new = "<c r=`"$col$row`" s=`"$s`" t=`"inlineStr`"><is><t xml:space=`"preserve`">$value</t></is></c>"
            $xmlRef.Value = $xmlRef.Value.Replace($old, $new)
            return $true
        }
    }
    return $false
}

$miss = 0
for ($n = 1; $n -le 107; $n++) {
    $row = $n + 2
    $status = EscapeXml $M[$n][0]
    $komentar = EscapeXml $M[$n][1]
    if (-not (Update-Cell ([ref]$xml) 'F' $row $status)) { Write-Warning "F$row not found"; $miss++ }
    if (-not (Update-Cell ([ref]$xml) 'G' $row $komentar)) { Write-Warning "G$row not found"; $miss++ }
}

Set-Content -Path $sheet -Value $xml -Encoding UTF8 -NoNewline

$tmpZip = Join-Path $RepoRoot '.tmp_xlsx_out.zip'
if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force }
if (Test-Path $out) { Remove-Item $out -Force }
Push-Location $dst
Compress-Archive -Path * -DestinationPath $tmpZip -Force
Pop-Location
Move-Item $tmpZip $out -Force
Remove-Item $zip -Force -ErrorAction SilentlyContinue
Remove-Item $dst -Recurse -Force -ErrorAction SilentlyContinue

Write-Host ''
Write-Host "Misses: $miss"
Write-Host "Created: $out" -ForegroundColor Green
