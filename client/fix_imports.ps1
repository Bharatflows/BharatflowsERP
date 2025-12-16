$files = Get-ChildItem -Path "src/components/ui/*.tsx"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace '@\d+\.\d+\.\d+', ''
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Fixed $($file.Name)"
    }
}
