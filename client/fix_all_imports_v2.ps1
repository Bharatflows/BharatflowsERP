$files = Get-ChildItem -Path "src" -Recurse | Where-Object { $_.Extension -eq ".tsx" -or $_.Extension -eq ".ts" }
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    # Regex to match @x.x.x at the end of the import string (before the closing quote)
    $newContent = $content -replace '(@\d+\.\d+\.\d+)(?=["''])', ''
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent
        Write-Host "Fixed $($file.FullName)"
    }
}
