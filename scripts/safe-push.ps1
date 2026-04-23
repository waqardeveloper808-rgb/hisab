Write-Host "Running cleanup..."
& "$PSScriptRoot/cleanup-before-push.ps1"

Write-Host "Re-indexing git..."
git rm -r --cached . 2>$null

Write-Host "Adding files..."
git add .

if (git diff --cached --quiet) {
    Write-Host "Nothing to commit."
    exit 0
}

Write-Host "Committing..."
git commit -m "auto: safe push checkpoint"

Write-Host "Pushing..."
git push

Write-Host "Done."
