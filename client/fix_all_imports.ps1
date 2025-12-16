$files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Replace @x.x.x with empty string in import paths
    # We look for patterns like "package@1.2.3" or 'package@1.2.3'
    $newContent = $content -replace '(@\d+\.\d+\.\d+)(?=["''])', ''
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Fixed $($file.FullName)"
    }
}
