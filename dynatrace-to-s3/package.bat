@echo off

set ZIP_FILE=lambda_package.zip
set PACKAGE_DIR=package

if exist %ZIP_FILE% del %ZIP_FILE%
if exist %PACKAGE_DIR% rmdir /s /q %PACKAGE_DIR%

mkdir %PACKAGE_DIR%

pip install -r requirements.txt -t %PACKAGE_DIR% --quiet

copy lambda_function.py %PACKAGE_DIR%

powershell -Command "Compress-Archive -Path '%PACKAGE_DIR%/*' -DestinationPath '%ZIP_FILE%'"

rmdir /s /q %PACKAGE_DIR%

echo Created %ZIP_FILE%
