#Requires -Version 5.1
$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$InstallDir = Join-Path $env:APPDATA "Manggo\Manggo\plugins\installed\com.leonyew.ecdict"
$CacheDir = Join-Path $env:APPDATA "Manggo\Manggo\plugins\cache\com.leonyew.ecdict"
$StageDir = Join-Path $Root ".tmp\mplugin-inspect"
$Mplugin = Join-Path $Root "dist\com.leonyew.ecdict.mplugin"
$Bun = Join-Path $env:APPDATA "Manggo\Manggo\plugins\runtime\bun\current\bin\bun.exe"
$Runner = Join-Path $env:APPDATA "Manggo\Manggo\plugins\runtime\runner\manggo-plugin-runner-v7.js"

if (-not (Test-Path $Mplugin)) {
  throw "Missing $Mplugin. Run .\package.ps1 first."
}
if (-not (Test-Path $Bun) -or -not (Test-Path $Runner)) {
  throw "Manggo plugin runtime not found. Install Manggo first."
}

if (-not (Test-Path $StageDir)) {
  New-Item -ItemType Directory -Force -Path $StageDir | Out-Null
  Expand-Archive -Path $Mplugin -DestinationPath $StageDir -Force
}

New-Item -ItemType Directory -Force -Path $InstallDir, $CacheDir | Out-Null
Copy-Item (Join-Path $StageDir "*") $InstallDir -Force
[guid]::NewGuid().Guid | Set-Content -NoNewline (Join-Path $InstallDir ".manggo-install-revision")

$pluginDir = $InstallDir.Replace("\", "/")
$cachePath = $CacheDir.Replace("\", "/")
$mainPath = "$pluginDir/main.js"

$reqHit = @{
  requestId = "verify-hit"
  compatibility = "manggo"
  kind = "translation"
  entry = "translate"
  mainPath = $mainPath
  pluginDir = $pluginDir
  cacheDir = $cachePath
  osType = "Windows_NT"
  config = @{}
  arguments = @{ text = "hello"; from = "en"; to = "zh"; detect = "en" }
} | ConvertTo-Json -Compress -Depth 6

$reqMiss = @{
  requestId = "verify-miss"
  compatibility = "manggo"
  kind = "translation"
  entry = "translate"
  mainPath = $mainPath
  pluginDir = $pluginDir
  cacheDir = $cachePath
  osType = "Windows_NT"
  config = @{}
  arguments = @{ text = "zzzznotawordxyz"; from = "en"; to = "zh"; detect = "en" }
} | ConvertTo-Json -Compress -Depth 6

$output = "$reqHit`n$reqMiss`n" | & $Bun $Runner
Write-Host $output

if ($output -notmatch '"kind":"dictionary"' -or $output -notmatch '未找到词条') {
  throw "Manggo runner verification failed"
}

Write-Host "Manggo runner verification passed"
