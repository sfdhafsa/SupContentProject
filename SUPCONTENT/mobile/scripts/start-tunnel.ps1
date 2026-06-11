$ErrorActionPreference = 'Stop'

$mobileRoot = Split-Path -Parent $PSScriptRoot
$projectRoot = Split-Path -Parent $mobileRoot
$mobileEnvPath = Join-Path $mobileRoot '.env'
$projectEnvPath = Join-Path $projectRoot '.env'
$logDirectory = Join-Path $env:TEMP 'supcontent-dev-tunnels'

$cloudflaredCandidates = @(
  (Get-Command cloudflared.exe -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1),
  'C:\Program Files (x86)\cloudflared\cloudflared.exe',
  'C:\Program Files\cloudflared\cloudflared.exe'
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

$cloudflared = $cloudflaredCandidates | Select-Object -First 1
if (-not $cloudflared) {
  throw 'cloudflared is not installed. Run: winget install Cloudflare.cloudflared'
}

function Stop-PreviousDevProcesses {
  Get-CimInstance Win32_Process |
    Where-Object {
      $_.Name -eq 'cloudflared.exe' -and
      $_.CommandLine -match 'tunnel --url http://localhost:(3000|8081)'
    } |
    ForEach-Object {
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }

  $listener = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
    if ($owner.CommandLine -match 'expo(.+)?start') {
      Stop-Process -Id $owner.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
}

function Set-EnvValue {
  param(
    [Parameter(Mandatory)] [string] $Path,
    [Parameter(Mandatory)] [string] $Name,
    [Parameter(Mandatory)] [string] $Value
  )

  $lines = [System.Collections.Generic.List[string]]::new()
  if (Test-Path -LiteralPath $Path) {
    foreach ($line in @(Get-Content -LiteralPath $Path)) {
      $lines.Add([string]$line)
    }
  }

  $prefix = "$Name="
  $updated = $false
  for ($index = 0; $index -lt $lines.Count; $index++) {
    if ($lines[$index].StartsWith($prefix, [System.StringComparison]::Ordinal)) {
      $lines[$index] = "$prefix$Value"
      $updated = $true
      break
    }
  }

  if (-not $updated) {
    $lines.Add("$prefix$Value")
  }

  [System.IO.File]::WriteAllLines($Path, $lines)
}

function Start-QuickTunnel {
  param(
    [Parameter(Mandatory)] [string] $Name,
    [Parameter(Mandatory)] [int] $Port
  )

  $stdoutLog = Join-Path $logDirectory "$Name.stdout.log"
  $stderrLog = Join-Path $logDirectory "$Name.stderr.log"
  Remove-Item -LiteralPath $stdoutLog, $stderrLog -Force -ErrorAction SilentlyContinue

  $process = Start-Process `
    -FilePath $cloudflared `
    -ArgumentList @('tunnel', '--url', "http://localhost:$Port", '--protocol', 'http2') `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -WindowStyle Hidden `
    -PassThru

  for ($attempt = 0; $attempt -lt 50; $attempt++) {
    Start-Sleep -Milliseconds 500

    if ($process.HasExited) {
      $details = Get-Content -LiteralPath $stderrLog -Raw -ErrorAction SilentlyContinue
      throw "The $Name tunnel stopped unexpectedly.`n$details"
    }

    $logs = @(
      (Get-Content -LiteralPath $stdoutLog -Raw -ErrorAction SilentlyContinue),
      (Get-Content -LiteralPath $stderrLog -Raw -ErrorAction SilentlyContinue)
    ) -join "`n"

    $match = [regex]::Match($logs, 'https://[a-z0-9-]+\.trycloudflare\.com')
    if ($match.Success) {
      return @{
        Process = $process
        Url = $match.Value
      }
    }
  }

  Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
  throw "Cloudflare did not provide a public URL for $Name within 25 seconds."
}

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Stop-PreviousDevProcesses
Start-Sleep -Seconds 2

$backendTunnel = $null
$mobileTunnel = $null

try {
  Write-Host 'Creating backend tunnel...' -ForegroundColor Cyan
  $backendTunnel = Start-QuickTunnel -Name 'backend' -Port 3000
  $apiUrl = "$($backendTunnel.Url)/api"
  $googleCallbackUrl = "$apiUrl/auth/google/callback"

  $health = $null
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
      Clear-DnsClientCache -ErrorAction SilentlyContinue
      $health = Invoke-RestMethod -Uri "$apiUrl/health" -TimeoutSec 5
      if ($health.status -eq 'ok') {
        break
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  if ($health.status -ne 'ok') {
    Write-Warning 'Windows DNS has not resolved the new backend URL yet. Continuing; it may need another minute before the phone can reach it.'
  }

  Set-EnvValue -Path $mobileEnvPath -Name 'EXPO_PUBLIC_API_URL' -Value $apiUrl
  Set-EnvValue -Path $projectEnvPath -Name 'GOOGLE_CALLBACK_URL' -Value $googleCallbackUrl

  Write-Host 'Restarting the backend with the new OAuth callback...' -ForegroundColor Cyan
  Push-Location $projectRoot
  try {
    & docker compose up -d --force-recreate backend
    if ($LASTEXITCODE -ne 0) {
      throw 'Docker could not recreate the backend service.'
    }
  } finally {
    Pop-Location
  }

  Write-Host "Backend API: $apiUrl" -ForegroundColor Green
  Write-Host "Google callback: $googleCallbackUrl" -ForegroundColor Yellow
  Write-Host 'Register this exact callback in Google Cloud Console for OAuth.' -ForegroundColor Yellow

  Write-Host 'Creating mobile tunnel...' -ForegroundColor Cyan
  $mobileTunnel = Start-QuickTunnel -Name 'mobile' -Port 8081
  $env:EXPO_PACKAGER_PROXY_URL = $mobileTunnel.Url

  Write-Host "Mobile tunnel: $($mobileTunnel.Url)" -ForegroundColor Green
  Write-Host 'Starting Expo Go on port 8081...' -ForegroundColor Cyan
  Push-Location $mobileRoot
  try {
    & npx expo start --localhost --clear --port 8081
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item Env:\EXPO_PACKAGER_PROXY_URL -ErrorAction SilentlyContinue

  foreach ($tunnel in @($mobileTunnel, $backendTunnel)) {
    if ($tunnel -and $tunnel.Process -and -not $tunnel.Process.HasExited) {
      Stop-Process -Id $tunnel.Process.Id -Force -ErrorAction SilentlyContinue
    }
  }
}
