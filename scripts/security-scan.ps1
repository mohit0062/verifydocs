Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "== VerifyDocs Free Security Scan ==" -ForegroundColor Cyan
Write-Host "Project: $((Get-Location).Path)"

$scanPath = (Get-Location).Path

if (Get-Command Start-MpScan -ErrorAction SilentlyContinue) {
  Write-Host "`n[1/2] Running Microsoft Defender custom scan..." -ForegroundColor Yellow
  Start-MpScan -ScanType CustomScan -ScanPath $scanPath
  Write-Host "Defender scan completed." -ForegroundColor Green
} else {
  Write-Warning "Microsoft Defender command not available on this machine. Skipping antivirus scan."
}

Write-Host "`n[2/2] Running npm dependency vulnerability audit..." -ForegroundColor Yellow
npm audit --audit-level=moderate

if ($LASTEXITCODE -ne 0) {
  Write-Warning "npm audit reported issues. Review output and update vulnerable packages."
  exit $LASTEXITCODE
}

Write-Host "`nSecurity scan finished with no npm audit issues at moderate+ severity." -ForegroundColor Green
