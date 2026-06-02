$ErrorActionPreference = 'Stop'

# Fresh extract
$src='C:\Users\Milos\Downloads\Stake_Engine_Checklist.xlsx'
$zip='C:\Users\Milos\Desktop\VikingThor\.tmp_xlsx.zip'
$dst='C:\Users\Milos\Desktop\VikingThor\.tmp_xlsx'
Copy-Item $src $zip -Force
if(Test-Path $dst){ Remove-Item -Recurse -Force $dst }
Expand-Archive -Path $zip -DestinationPath $dst -Force

# Mapa: br -> @(Status, Komentar)
$M = @{}
function S($n,$s,$c){ $script:M[$n] = @($s,$c) }

S 1  'DONE' 'Implementirano kroz `packages/rgs-requests` (authenticate poziv na start).'
S 2  'DONE' 'Bet dugme okida `bet` zahtev kroz XState gameActor.'
S 3  'DONE' 'Naziv "Hammer of Thor" - ne sadrzi Megaways/Xways/Gates/Bonanza i ne aludira na postojece serije.'
S 4  'DONE' 'Tema (mitologija) - bez uvredljivog / diskriminatorskog sadrzaja.'
S 5  'DONE' 'Originalna tema + tumble/cluster mehanika - nema slicnosti sa postojecim naslovima.'
S 6  'TBD'  'Cekaju se finalni game tile asseti.'
S 7  'TBD'  'Cekaju se finalni background asseti.'
S 8  'TBD'  'Cekaju se finalni foreground asseti.'
S 9  'TBD'  'Definisati gradijent pri kreiranju tile-a.'
S 10 'TBD'  'Provera nakon kreiranja tile-a.'
S 11 'TBD'  'Provera nakon kreiranja tile-a.'
S 12 'TBD'  'Pokrenuti `make optimization` i proveriti warning-e.'
S 13 'DONE' 'RTP konfigurisan na 97.00% u `apps/olympus/src/game/config.ts` (u opsegu 90-97.7%).'
S 14 'TBD'  'Verifikovati simulacijama da su base i bonus mode u 0.5% opsegu.'
S 15 'TBD'  'Verifikovati simulacijama (max_win 5000x).'
S 16 'TBD'  'Verifikovati simulacijama (~1-8 za base).'
S 17 'TBD'  'Provera hit-rate tabele iz simulacija.'
S 18 'TBD'  'Provera iz simulacija.'
S 19 'TBD'  'Provera iz simulacija.'
S 20 'DONE' 'Spacebar mapiran na SPIN; navedeno u GameRulesContent.'
S 21 'DONE' 'Glavni frame je canvas (PIXI), HTML overlay fiksiran - nije skrolabilan.'
S 22 'DONE' '`ModalBuyBonusConfirm.svelte` - cost 100x zahteva eksplicitnu potvrdu (Confirm dugme).'
S 23 'DONE' '`apps/olympus/src/components/GameRulesContent.svelte` - opis svih kontrola (+/-, SPIN, TURBO, AUTO, SPACE).'
S 24 'TBD'  'Manual QA pass - uporediti 3 dobitka po modu sa Game Rules.'
S 25 'TBD'  'Manual QA pass - uporediti 10 dobitaka po modu.'
S 26 'TBD'  'Manual QA pass - uporediti 6 dobitaka po modu.'
S 27 'DONE' 'Implementirano: `stateUrlDerived.replay()` detektuje, `requestReplay` poziva RGS, `UIReplay` swap.'
S 28 'DONE' 'Podrzani parametri: amount, game, mode, version, event (videti `packages/state-shared/src/stateUrl.svelte.ts`).'
S 29 'TBD'  'Play Again nije implementirano kao posebno dugme - reload stranice pokrece replay ponovo.'
S 30 'DONE' 'LabelBet prikazuje bet amount; mode (BONUS/BASE) je vidljiv iz contexta. Real-cost multiplier kroz `betModes`.'
S 31 'TBD'  'Verifikovati u Popout S prikazu.'
S 32 'DONE' 'Detekcija `replay=true` u `Authenticate.svelte` (onMount provera).'
S 33 'DONE' '`requestReplay` u `packages/rgs-requests/src/rgs-requests.ts`: GET /bet/replay/{game}/{version}/{mode}/{event}.'
S 34 'DONE' 'Auto-load preko `Authenticate.handleReplay`; `betToResume` se postavi i game state machine rerun-uje event.'
S 35 'DONE' 'Loading state dodat u `Authenticate.svelte` - spinner + "Loading replay..." tekst dok je fetch u toku.'
S 36 'DONE' '`UIReplay` swap sakriva BET / SPIN / Buy Bonus / Auto Spin dugmad.'
S 37 'DONE' '`Authenticate.svelte` preskace `authenticate()` poziv kada je replay mod aktivan.'
S 38 'DONE' 'Replay koristi standardni `betToResume` flow - sve animacije i zvukovi se reprodukuju.'
S 39 'DONE' 'LabelBet + LabelWin u UIReplay prikazuju bet i win iznose.'
S 40 'TBD'  'Play Again dugme - reload stranice trenutno; mozemo dodati replay reset dugme po potrebi.'
S 41 'DONE' '`handleReplay` sada hvata greske (try/catch + null check) i otvara `error` modal sa porukom.'
S 42 'DONE' '`UIReplay` ne sadrzi SPIN/BET dugme - nema nacina da se iz replay-a pokrene normalna igra.'
S 43 'DONE' 'UIReplay sakriva bet selector, autoplay, buy bonus, spin. Vidljivo: bet/win labels, menu, turbo, paytable, rules, mute. + REPLAY MODE badge na vrhu.'
S 44 'TBD'  'Pripremiti event ID-eve po modu (normal/big/cap/loss/bonus) za QA submission.'
S 45 'DONE' 'GameRulesContent + PayTableContent navode: BASE = 1x bet, BONUS = 100x bet.'
S 46 'DONE' 'Max Win = 5000x bet (oba moda) - navedeno u GameRulesContent (sekcija RTP & Max Win).'
S 47 'TBD'  'Verifikovati simulacijama da max win cesce od 1/10M.'
S 48 'TBD'  'Pokrenuti 100k-1M simulacija.'
S 49 'TBD'  'Provera ratio non-zero ishoda iz simulacija.'
S 50 'TBD'  'Provera non-zero hit-rate (< 1/20).'
S 51 'TBD'  'Provera std. devijacije BASE moda.'
S 52 'TBD'  'Provera non-zero weight payouts.'
S 53 'TBD'  'Provera hit-rate raspodele po win opsezima.'
S 54 'TBD'  'Risk limiti po zvezdici (Exposure, CVaR, ETL).'
S 55 'INFO' 'Maksimalni bet u igri je ispod $500.000 RGS limita.'
S 56 'TBD'  'Primeniti bet-level template u Stake Engine dashboard-u.'
S 57 'TBD'  'Omoguciti Provably Fair i Replay u dashboard-u.'
S 58 'TBD'  'Postaviti Front i Math kao Approved & Active u dashboard-u.'
S 59 'TBD'  'Verifikovati pojavljivanje u stake-engine-game-approved kanalima.'
S 60 'TBD'  'Test na starijim Android/iOS verzijama.'
S 61 'INFO' 'Zatvara se nakon checked emoji-ja.'
S 62 'INFO' 'Pratiti nakon odobrenja.'
S 63 'TBD'  'Pripremiti kratak blurb (tema: nordijska/grcka mitologija; mehanika: cluster pays + tumble + free spins + buy bonus).'
S 64 'DONE' 'Stateless - svaki spin nezavisan; nema jackpot/gamble/continuation/early cashout.'
S 65 'DONE' 'Originalna implementacija, asseti kreirani za projekat.'
S 66 'DONE' 'Pravljeno od nule (nije pre-kupljeno/licencirano).'
S 67 'DONE' 'Asseti ne sadrze Stake brending ni teme.'
S 68 'DONE' 'Mitoloska tema, bez maloletnickih likova.'
S 69 'INFO' 'Process napomena - posle objave samo manje izmene.'
S 70 'DONE' '`packages/rgs-requests` koristi betLevels iz authenticate odgovora.'
S 71 'DONE' 'Inkrementi se citaju iz authenticate/config/minStep.'
S 72 'DONE' 'Min/max bet leveli iz auth dostupni u UI.'
S 73 'DONE' 'Vite build je staticki; fontovi i asseti lokalni (nema eksternih izvora).'
S 74 'DONE' '`packages/rgs-fetcher` koristi `rgs_url` query parametar.'
S 75 'DONE' 'EN je default jezik kroz Lingui; tekst se ne kvari pri promeni lang parametra.'
S 76 'DONE' 'Asseti specificni za "Hammer of Thor" (sym_h1..h4, sym_l1..l4, scatter, multiplier, custom zvuk).'
S 77 'TBD'  'Finalni QA prolazak na svim modovima.'
S 78 'TBD'  'Testirati Popout S - bez vidljivog izoblicenja.'
S 79 'DONE' 'Responsive SCSS (breakpoint <=640px) + PIXI resize observer.'
S 80 'TBD'  'Asseti se moraju ucitavati sa Stake Engine CDN-a po deploy-u.'
S 81 'DONE' '`ModalPayTable` + `ModalGameRules` dostupni iz menija u igri.'
S 82 'DONE' 'GameRulesContent navodi: BASE 1x, BUY BONUS 100x; PayTable opisuje sta se kupuje.'
S 83 'DONE' 'RTP 97.00% jasno naveden u GameRulesContent (sekcija RTP & MAX WIN).'
S 84 'DONE' 'Max Win 5000x per round za BASE i BONUS - naveden u GameRulesContent.'
S 85 'DONE' '`PayTableContent.svelte` - cluster opsezi 8-9, 10-11, 12-14, 15-19, 20-29, 30+ za svih 8 simbola.'
S 86 'DONE' 'PayTableContent: Scatter (4=15FS, 5=20FS, 6=25FS) i Multiplier x2 do x500.'
S 87 'DONE' 'Pristup Free Spins eksplicitno opisan u PayTableContent (4/5/6+ scatter = 15/20/25 FS).'
S 88 'DONE' 'GameRulesContent ukljucuje malfunction disclaimer ("Malfunction voids all pays and plays").'
S 89 'DONE' 'GameRulesContent (sekcija Bet Controls) opisuje sva dugmad.'
S 90 'DONE' '+/- dugmad za bet size.'
S 91 'DONE' 'Bet leveli iz auth dostupni u UI (povezano sa #70).'
S 92 'DONE' 'Balance prikazan u glavnom UI bar-u.'
S 93 'DONE' 'Win iznosi prikazani jasno za non-zero rezultate.'
S 94 'DONE' 'Tumble feature inkrementalno azurira win iznos kroz svaku kaskadu.'
S 95 'DONE' 'Sound mute dugme u UI-u (`ButtonMute`).'
S 96 'DONE' 'Spacebar mapiran na bet dugme (povezano sa #20).'
S 97 'DONE' '`ModalAutoSpin.svelte` - zahteva izbor rounds + opcione loss/single-win limite + Start Autoplay klik.'
S 98 'TBD'  'QA prolazak - DevTools network tab cist.'
S 99 'TBD'  'QA prolazak - validacija kombinacija.'
S 100 'TBD' 'QA prolazak - razne currency/language kombinacije.'
S 101 'N/A' 'Fastplay mode nije implementiran.'
S 102 'TBD' 'Kreirati `HammerOfThor-BG.png` (high-res environmental BG).'
S 103 'TBD' 'Kreirati `HammerOfThor-FG.png` (feature lik, transparent).'
S 104 'TBD' 'Kreirati `VikingThor-Logo.png` (transparent, citljiv).'
S 105 'TBD' 'Optimizovati da BG+FG ukupno <= 3MB.'
S 106 'DONE' 'Sweeps swap implementiran preko `Wn.social()`: "BET"->"SPIN", "BUY BONUS"->"PLAY BONUS".'
S 107 'DONE' 'Implementirano: `social` query parametar + Lingui prevodi (de-facto sweeps fajl).'

$sheet = "$dst\xl\worksheets\sheet1.xml"
$xml = Get-Content $sheet -Raw

function EscapeXml($s){ return ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace "'",'&apos;' -replace '"','&quot;') }

function Update-Cell([ref]$xmlRef, $col, $row, $value){
    foreach($s in 1..30){
        $old = "<c r=`"$col$row`" s=`"$s`"/>"
        if($xmlRef.Value.Contains($old)){
            $new = "<c r=`"$col$row`" s=`"$s`" t=`"inlineStr`"><is><t xml:space=`"preserve`">$value</t></is></c>"
            $xmlRef.Value = $xmlRef.Value.Replace($old, $new)
            return $true
        }
    }
    return $false
}

$miss = 0
for($n=1; $n -le 107; $n++){
    $row = $n + 2
    $status = EscapeXml $M[$n][0]
    $komentar = EscapeXml $M[$n][1]
    if(-not (Update-Cell ([ref]$xml) 'F' $row $status)){ Write-Warning "F$row not found"; $miss++ }
    if(-not (Update-Cell ([ref]$xml) 'G' $row $komentar)){ Write-Warning "G$row not found"; $miss++ }
}

Set-Content -Path $sheet -Value $xml -Encoding UTF8 -NoNewline

$out = 'C:\Users\Milos\Downloads\Stake_Engine_Checklist_filled.xlsx'
$tmpZip = 'C:\Users\Milos\Desktop\VikingThor\.tmp_xlsx_out.zip'
if(Test-Path $tmpZip){ Remove-Item $tmpZip -Force }
if(Test-Path $out){ Remove-Item $out -Force }
Push-Location $dst
Compress-Archive -Path * -DestinationPath $tmpZip -Force
Pop-Location
Move-Item $tmpZip $out
Write-Host ""
Write-Host "Misses: $miss"
Write-Host "Created: $out" -ForegroundColor Green
