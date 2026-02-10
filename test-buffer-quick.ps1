Write-Host "🧪 TESTING BUFFER MEMORY SYSTEM" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Gray

# Check if server is running
Write-Host "`n🔍 Checking if server is running..." -ForegroundColor White

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -ErrorAction Stop
    Write-Host "✅ Server is running on localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "❌ Server not running. Please start it with: npm run dev" -ForegroundColor Red
    exit
}

# Test 1: Create a buffer
Write-Host "`n1️⃣ Creating interview buffer..." -ForegroundColor White

$body = @{
    userId = "test_user_123"
    interviewType = "technical"
    difficulty = "mid-level"
    preferences = @{
        userId = "test_user_123"
        preferredRoles = @("Frontend")
        preferredTechStack = @("React", "TypeScript")
        defaultLevel = "Mid-level"
        defaultType = "Technical"
        defaultQuestionCount = 5
        voiceSettings = @{
            rate = 1.0
            volume = 0.8
            pitch = 1.0
            language = "en-US"
        }
        updatedAt = "2024-01-25T10:30:00.000Z"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/interview/buffer?action=create" `
        -Method Post `
        -Headers @{"Content-Type"="application/json"} `
        -Body $body
    
    if ($response.success) {
        Write-Host "✅ Buffer created successfully!" -ForegroundColor Green
        Write-Host "   Session ID: $($response.buffer.sessionId)" -ForegroundColor Gray
        Write-Host "   Interview ID: $($response.buffer.interviewId)" -ForegroundColor Gray
        
        $sessionId = $response.buffer.sessionId
        
        # Test 2: Add a message
        Write-Host "`n2️⃣ Adding AI question..." -ForegroundColor White
        
        $messageBody = @{
            role = "assistant"
            content = "What are the key differences between useEffect and useLayoutEffect in React?"
            metadata = @{
                questionId = "q1"
                category = "React"
                difficulty = "medium"
            }
        } | ConvertTo-Json
        
        $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/interview/buffer?action=addMessage&sessionId=$sessionId" `
            -Method Put `
            -Headers @{"Content-Type"="application/json"} `
            -Body $messageBody
        
        if ($response2.success) {
            Write-Host "✅ AI question added!" -ForegroundColor Green
            
            # Test 3: Get context
            Write-Host "`n3️⃣ Getting buffer context..." -ForegroundColor White
            
            $response3 = Invoke-RestMethod -Uri "http://localhost:3000/api/interview/buffer?action=context&sessionId=$sessionId" `
                -Method Get
            
            if ($response3.success) {
                Write-Host "✅ Buffer context retrieved!" -ForegroundColor Green
                Write-Host "`n📊 BUFFER STATS:" -ForegroundColor Cyan
                Write-Host "   Messages: $($response3.buffer.messages.Count)" -ForegroundColor Gray
                Write-Host "   Status: $($response3.buffer.metadata.status)" -ForegroundColor Gray
                Write-Host "   Can Resume: $($response3.buffer.metadata.canResume)" -ForegroundColor Gray
                
                Write-Host "`n🎉 BUFFER MEMORY SYSTEM IS WORKING PERFECTLY! 🚀" -ForegroundColor Magenta
            }
        }
    } else {
        Write-Host "❌ Failed: $($response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n🔧 Make sure your server is running with: npm run dev" -ForegroundColor Yellow
}
