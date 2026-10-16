param([switch]$Deploy, [switch]$Verify, [switch]$Copy)
$ErrorActionPreference = 'Stop'
$releaseRoot = Split-Path -Parent $PSScriptRoot
$encryptedFile = Join-Path $releaseRoot 'artifacts\metrics-admin.dpapi'
$endpoint = 'https://brass-pittsburgh-metrics.brass-pittsburgh-metrics.workers.dev'
if (-not (Test-Path -LiteralPath $encryptedFile)) {
    if (-not $Deploy) { throw 'No administrator key has been provisioned on this PC.' }
    $adminKey = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLowerInvariant()
    $secureKey = ConvertTo-SecureString -String $adminKey -AsPlainText -Force
    New-Item -ItemType Directory -Path (Split-Path -Parent $encryptedFile) -Force | Out-Null
    # Generated credential artifact, encrypted by Windows DPAPI for the current user.
    [IO.File]::WriteAllText($encryptedFile, (ConvertFrom-SecureString $secureKey))
} else {
    $secureKey = ConvertTo-SecureString ([IO.File]::ReadAllText($encryptedFile))
    $adminKey = [Net.NetworkCredential]::new('', $secureKey).Password
}
if ($Deploy) {
    $wrangler = Join-Path $releaseRoot 'analytics\node_modules\wrangler\bin\wrangler.js'
    $config = Join-Path $releaseRoot 'analytics\wrangler.jsonc'
    # Pipe the secret through stdin. Never pass it as a process argument.
    $adminKey | & node $wrangler secret put ADMIN_TOKEN --config $config
    if ($LASTEXITCODE -ne 0) { throw 'Cloudflare secret upload failed.' }
}
if ($Verify) {
    $stats = Invoke-RestMethod -Uri "$endpoint/stats" -Headers @{ Origin='https://sirhero8282.github.io'; Authorization="Bearer $adminKey" }
    $stats | Select-Object asOf,timezone,active,today,activeWindowSeconds | ConvertTo-Json
}
if ($Copy) {
    Set-Clipboard -Value $adminKey
    Write-Host 'Administrator key copied. Paste it into the stats page, then clear your clipboard after use.'
} elseif (-not $Deploy -and -not $Verify) {
    Write-Host 'Use -Copy to copy the key, or -Verify to inspect current statistics without displaying the key.'
}
$adminKey = $null
