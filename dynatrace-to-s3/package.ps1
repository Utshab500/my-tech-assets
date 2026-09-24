$ZipFile = "lambda_package.zip"
$PackageDir = "package"

if (Test-Path $ZipFile) { Remove-Item $ZipFile }
if (Test-Path $PackageDir) { Remove-Item -Recurse -Force $PackageDir }

New-Item -ItemType Directory -Path $PackageDir | Out-Null

pip install -r requirements.txt -t $PackageDir --quiet

Copy-Item fetch_audit_logs.py $PackageDir

Compress-Archive -Path "$PackageDir/*" -DestinationPath $ZipFile

Remove-Item -Recurse -Force $PackageDir

Write-Host "Created $ZipFile"
