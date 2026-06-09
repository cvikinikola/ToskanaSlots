# Keys opaque black matte (RGB ~0) to transparent on deka character PNGs.
param(
	[int]$Threshold = 20
)

Add-Type -AssemblyName System.Drawing

$appRoot = Split-Path -Parent $PSScriptRoot
$files = @(
	Join-Path $appRoot 'static/assets/deka_v2_idle.png'
	Join-Path $appRoot 'static/assets/deka2.png'
	Join-Path $appRoot 'static/assets/deka_v2_toast.png'
)

foreach ($path in $files) {
	if (-not (Test-Path $path)) {
		Write-Warning "Missing: $path"
		continue
	}

	$img = [System.Drawing.Image]::FromFile($path)
	$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
	$graphics = [System.Drawing.Graphics]::FromImage($bmp)
	$graphics.DrawImage($img, 0, 0, $img.Width, $img.Height)
	$graphics.Dispose()
	$img.Dispose()

	$transparent = 0
	for ($y = 0; $y -lt $bmp.Height; $y++) {
		for ($x = 0; $x -lt $bmp.Width; $x++) {
			$color = $bmp.GetPixel($x, $y)
			if ($color.R -le $Threshold -and $color.G -le $Threshold -and $color.B -le $Threshold) {
				$bmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
				$transparent++
			}
		}
	}

	$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
	$bmp.Dispose()
	Write-Host "Fixed $($path.Split('\')[-1]): $transparent transparent pixels"
}
