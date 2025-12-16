$files = @(
    "src/components/RegisterPage.tsx",
    "src/components/OTPLogin.tsx",
    "src/components/LoginPage.tsx",
    "src/components/Dashboard.tsx",
    "src/components/DashboardHeader.tsx"
)

foreach ($relativePath in $files) {
    $path = Join-Path (Get-Location) $relativePath
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $newContent = $content -replace '\.\./src/', '../'
        if ($content -ne $newContent) {
            Set-Content -Path $path -Value $newContent
            Write-Host "Fixed $relativePath"
        }
    }
    else {
        Write-Host "File not found: $relativePath"
    }
}
