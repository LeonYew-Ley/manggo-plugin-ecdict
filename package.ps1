#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutDir = Join-Path $Root "dist"
$TmpDir = Join-Path $Root ".tmp"
$Manifest = Get-Content (Join-Path $Root "manggo.plugin.json") -Raw | ConvertFrom-Json
$PluginId = $Manifest.id
$OutFile = Join-Path $OutDir "$PluginId.mplugin"
$DbUrl = "https://github.com/skywind3000/ECDICT/releases/download/1.0.28/ecdict-sqlite-28.zip"
$ZipPath = Join-Path $TmpDir "ecdict-sqlite-28.zip"
$DbPath = Join-Path $TmpDir "stardict.db"

New-Item -ItemType Directory -Force -Path $OutDir, $TmpDir | Out-Null
if (Test-Path $OutFile) {
  Remove-Item -Force $OutFile
}

if (-not (Test-Path $DbPath)) {
  Write-Host "Downloading ECDICT sqlite database..."
  Invoke-WebRequest -Uri $DbUrl -OutFile $ZipPath
  Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force
  if (-not (Test-Path $DbPath)) {
    $Found = Get-ChildItem -Path $TmpDir -Filter "stardict.db" -Recurse -File | Select-Object -First 1
    if (-not $Found) {
      throw "stardict.db not found after extract"
    }
    Copy-Item $Found.FullName $DbPath -Force
  }
}

$StageDir = Join-Path $TmpDir "mplugin-stage"
if (Test-Path $StageDir) {
  Remove-Item -Recurse -Force $StageDir
}
New-Item -ItemType Directory -Force -Path $StageDir | Out-Null

Copy-Item (Join-Path $Root "manggo.plugin.json") $StageDir
Copy-Item (Join-Path $Root "main.js") $StageDir
Copy-Item (Join-Path $Root "icon.png") $StageDir
Copy-Item $DbPath (Join-Path $StageDir "stardict.db")

$ZipOut = Join-Path $TmpDir "$PluginId.zip"
if (Test-Path $ZipOut) {
  Remove-Item -Force $ZipOut
}

Compress-Archive -Path (Join-Path $StageDir "*") -DestinationPath $ZipOut -Force
Move-Item -Force $ZipOut $OutFile

Write-Host $OutFile
