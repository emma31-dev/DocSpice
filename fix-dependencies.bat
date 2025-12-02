@echo off
echo ========================================
echo Fixing Node Modules Issue
echo ========================================
echo.

echo Step 1: Removing node_modules directory...
if exist node_modules (
    rmdir /s /q node_modules
    echo node_modules removed successfully
) else (
    echo node_modules directory not found
)
echo.

echo Step 2: Removing package-lock.json...
if exist package-lock.json (
    del package-lock.json
    echo package-lock.json removed successfully
) else (
    echo package-lock.json not found
)
echo.

echo Step 3: Removing pnpm-lock.yaml (if exists)...
if exist pnpm-lock.yaml (
    del pnpm-lock.yaml
    echo pnpm-lock.yaml removed successfully
) else (
    echo pnpm-lock.yaml not found
)
echo.

echo Step 4: Installing dependencies with npm...
echo This may take a few minutes...
echo.
npm install

echo.
echo ========================================
echo Installation complete!
echo ========================================
echo.
echo You can now run: npm run dev
echo Or build with: npm run build
echo.
pause
