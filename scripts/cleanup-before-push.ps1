Write-Host "Starting cleanup..."

$folders = @(
    "tmp",
    "temp",
    "artifacts",
    "qa_reports"
)

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "Deleting $folder ..."
        Remove-Item -Recurse -Force $folder
    }
}

Write-Host "Deleting archive files..."
Get-ChildItem -Recurse -File -Include *.zip, *.tar, *.gz, *.rar, *.7z |
    Where-Object { $_.FullName -notmatch '[\\/](node_modules|\.git)[\\/]' } |
    Remove-Item -Force

Write-Host "Cleanup completed."
