Write-Host "?? TESTING FIXED GAMIFICATION API" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Gray

$userId = "w8gyG77B3xe15bYapExlW6Py1553"
$url = "http://localhost:3000/api/gamification"

Write-Host "User ID: $($userId.Substring(0, 10))..." -ForegroundColor Gray
Write-Host "URL: $url" -ForegroundColor Gray
Write-Host ""

try {
    $body = "{`"userId`":`"$userId`"}"
    Write-Host "Sending request..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $url `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    Write-Host ""
    Write-Host "? ? ? SUCCESS! ? ? ?" -ForegroundColor Green
    Write-Host ""
    Write-Host "?? Gamification API is WORKING!" -ForegroundColor Green
    Write-Host ""
    Write-Host "?? YOUR DATA:" -ForegroundColor Magenta
    Write-Host "Level: $($response.level)" -ForegroundColor White
    Write-Host "Points: $($response.points)" -ForegroundColor White
    Write-Host "Total Interviews: $($response.totalInterviews)" -ForegroundColor White
    Write-Host "Achievements: $($response.achievements -join ', ')" -ForegroundColor White
    Write-Host "Next Goal: $($response.nextMilestone)" -ForegroundColor White
    Write-Host ""
    Write-Host "?? System is ready! You can now:" -ForegroundColor Cyan
    Write-Host "1. Add the ProfileCard component to your dashboard" -ForegroundColor Gray
    Write-Host "2. Use the useGamification hook in React" -ForegroundColor Gray
    Write-Host "3. Call this API from anywhere in your app" -ForegroundColor Gray
    
} catch {
    Write-Host ""
    Write-Host "? ERROR: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response body:" -ForegroundColor Yellow
            $responseBody
        } catch {}
    }
    
    Write-Host ""
    Write-Host "?? RESTART SERVER:" -ForegroundColor Yellow
    Write-Host "1. Ctrl+C in server terminal" -ForegroundColor Gray
    Write-Host "2. rm -rf .next" -ForegroundColor Gray
    Write-Host "3. npm run dev" -ForegroundColor Gray
    Write-Host "4. Wait for '? Ready on http://localhost:3000'" -ForegroundColor Gray
    Write-Host "5. Test again" -ForegroundColor Gray
}
