$targetPaths = @("apps\olympus", "packages\components-ui-pixi")
$extensions = @(".ts",".js",".svelte",".json",".html",".css",".scss",".md",".yml",".yaml")

$allTargetFiles = Get-ChildItem -Path $targetPaths -Recurse -File

# Exclude .svelte-kit and standard exclude patterns
$devTargetFiles = $allTargetFiles | Where-Object { 
    $extensions -contains $_.Extension -and 
    $_.FullName -notmatch '\\static\\' -and 
    $_.FullName -notmatch '\\assets\\' -and
    $_.FullName -notmatch '\\\.svelte-kit\\'
}
$staticTargetFiles = $allTargetFiles | Where-Object { $_.FullName -match '\\static\\' -or $_.FullName -match '\\assets\\' }

$universeFiles = Get-ChildItem -Path "apps", "packages" -Recurse -File | Where-Object { 
  $full = $_.FullName
  $match = $false
  foreach($tp in $targetPaths) { 
    if($full -like "*$tp*") { $match = $true; break } 
  }
  -not $match
}

$universeDevFiles = $universeFiles | Where-Object { $extensions -contains $_.Extension }
$universeHashes = @{}
foreach($f in $universeDevFiles) {
    try {
        $h = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
        if (-not $universeHashes.ContainsKey($h)) { $universeHashes[$h] = @() }
        $universeHashes[$h] += $f.FullName
    } catch {}
}

$results = foreach ($f in $devTargetFiles) {
    $hash = (Get-FileHash $f.FullName -Algorithm SHA256).Hash
    $exactMatches = if ($universeHashes.ContainsKey($hash)) { $universeHashes[$hash] } else { @() }
    
    $relPath = ""
    $pattern = ""
    if ($f.FullName -match "apps\\olympus\\(.*)") {
        $relPath = $matches[1]
        $pattern = "apps\\(?!olympus\\).+\\" + [regex]::Escape($relPath)
    } elseif ($f.FullName -match "packages\\components-ui-pixi\\(.*)") {
        $relPath = $matches[1]
        $pattern = "packages\\(?!components-ui-pixi\\).+\\" + [regex]::Escape($relPath)
    }
    
    $pathMatches = if ($relPath) { $universeFiles | Where-Object { $_.FullName -match $pattern } } else { @() }
    
    [PSCustomObject]@{
        Target = $f.FullName.Replace((Get-Location).Path.TrimEnd('\') + "\", "")
        ExactMatchCount = $exactMatches.Count
        CounterpartCount = $pathMatches.Count
        ExampleMatch = if ($exactMatches.Count -gt 0) { $exactMatches[0] } elseif ($pathMatches.Count -gt 0) { $pathMatches[0].FullName } else { "" }
    }
}

Write-Host "--- ANALYSIS RESULTS ---"
Write-Host "Total Dev Files Analyzed: $($devTargetFiles.Count)"
Write-Host "Exact Hash Matches: $($results | Where-Object { $_.ExactMatchCount -gt 0 } | Measure-Object | Select-Object -ExpandProperty Count)"
Write-Host "Counterpart Path Matches: $($results | Where-Object { $_.CounterpartCount -gt 0 } | Measure-Object | Select-Object -ExpandProperty Count)"

Write-Host "`n--- SAMPLE ROWS (CSV-like) ---"
$results | Select-Object -First 15 | ForEach-Object { "$($_.Target)|$($_.ExactMatchCount)|$($_.CounterpartCount)|$($_.ExampleMatch)" } | Out-Host

Write-Host "`n--- STATIC/ASSETS COUNTS ---"
$staticTargetFiles | Group-Object Extension | Select-Object @{N='Extension';E={$_.Name}}, Count | Format-Table -AutoSize | Out-Host

if ($devTargetFiles.Count -gt 0) {
    $either = $results | Where-Object { $_.ExactMatchCount -gt 0 -or $_.CounterpartCount -gt 0 } | Measure-Object | Select-Object -ExpandProperty Count
    $reuseLow = [math]::Round(($either / $devTargetFiles.Count) * 100, 2)
    Write-Host "`nConservative Reuse Estimate: $reuseLow% (based on exact hash or path counterpart existence)"
} else {
    Write-Host "`nConservative Reuse Estimate: 0% (no dev files found)"
}
