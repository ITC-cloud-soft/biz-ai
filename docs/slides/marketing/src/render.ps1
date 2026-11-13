# Renders a .pptx to PDF and/or one PNG per slide through PowerPoint (COM). Windows + PowerPoint only.
#   pwsh -File render.ps1 -Pptx <abs .pptx> [-Pdf <abs .pdf>] [-PngDir <abs dir>]
# Opens the deck read-only. PowerPoint is single-instance: if it was already running (your own windows), it is left running.
param([Parameter(Mandatory)][string]$Pptx, [string]$Pdf, [string]$PngDir)
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
  if (-not $wasRunning) { $app.Quit() }
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
