param([string]$Pptx, [string]$Pdf, [string]$PngDir)
# Renders the deck with PowerPoint (COM): PDF and/or one 1600x900 PNG per slide.
#   pwsh -File render.ps1 -Pptx <abs .pptx> [-Pdf <abs .pdf>] [-PngDir <abs dir>]
# Use absolute paths (PowerPoint resolves relative paths against its own working directory).
$ErrorActionPreference = 'Stop'
$wasRunning = [bool](Get-Process POWERPNT -ErrorAction SilentlyContinue)
$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open($Pptx, $true, $false, $false)  # ReadOnly, Untitled=false, WithWindow=false
  if ($Pdf) { $pres.SaveAs($Pdf, 32) }                            # ppSaveAsPDF
  if ($PngDir) {
    New-Item -ItemType Directory -Force $PngDir | Out-Null
    Get-ChildItem $PngDir -Filter *.png | Remove-Item -Force
    $i = 0
    foreach ($s in $pres.Slides) { $i++; $s.Export((Join-Path $PngDir ('s{0:D2}.png' -f $i)), 'PNG', 1600, 900) }
  }
  $pres.Close()
} finally {
  # leave a PowerPoint that was already open (the user's) running
  if (-not $wasRunning -and $app.Presentations.Count -eq 0) { $app.Quit() }
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
