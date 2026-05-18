$ErrorActionPreference = "Stop"

Write-Host "Downloading MinGit..."
Invoke-WebRequest -Uri "https://github.com/git-for-windows/git/releases/download/v2.45.1.windows.1/MinGit-2.45.1-64-bit.zip" -OutFile "mingit.zip"

Write-Host "Extracting MinGit..."
Expand-Archive -Path "mingit.zip" -DestinationPath "mingit" -Force

Write-Host "Configuring repository..."
.\mingit\cmd\git.exe init
.\mingit\cmd\git.exe config user.name "Ledger360 Bot"
.\mingit\cmd\git.exe config user.email "bot@ledger360.local"

Write-Host "Adding files..."
.\mingit\cmd\git.exe add .

Write-Host "Committing..."
.\mingit\cmd\git.exe commit -m "feat: Initial commit for Ledger360 Production Build"

Write-Host "Pushing to GitHub..."
.\mingit\cmd\git.exe branch -M main

# Use the token for authentication
$repoUrl = "https://Gitahi77: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@github.com/Gitahi77/Ledger360.git"
.\mingit\cmd\git.exe remote add origin $repoUrl
.\mingit\cmd\git.exe push -u origin main --force

Write-Host "Done!"
