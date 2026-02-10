Write-Host "?? QUICK GAMIFICATION TEST" -ForegroundColor Cyan

$userId = "w8gyG77B3xe15bYapExlW6Py1553"

# Wait a bit for server
Write-Host "Waiting 5 seconds for server..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Try port 3000 first, then 3001
$ports = @(3000, 3001)

foreach ($port in $ports) {
    $url = "http://localhost:$port/api/gamification"
    
    Write-Host "`nTesting $url ..." -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri $url `
            -Method Post `
            -Headers @{"Content-Type"="application/json"} `
            -Body "{`"userId`":`"$userId`"}" `
            -TimeoutSec 5
        
        Write-Host "? SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Level: $($response.level)" -ForegroundColor White
        Write-Host "Points: $($response.points)" -ForegroundColor White
        Write-Host "Achievements: $($response.achievements -join ', ')" -ForegroundColor White
        Write-Host "Success: $($response.success)" -ForegroundColor White
        Write-Host ""
        Write-Host "?? Gamification system is WORKING!" -ForegroundColor Green
        break
        
    } catch {
        Write-Host "? Port $port: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== SERVER STATUS ===" -ForegroundColor Yellow
netstat -ano | findstr ":3000 :3001" | ForEach-Object {
    Write-Host "  $_" -ForegroundColor Gray
}
