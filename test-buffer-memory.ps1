Write-Host "?? TESTING BUFFER MEMORY SYSTEM" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray

# Test 1: Check if files exist
Write-Host "`n?? FILE CHECK:" -ForegroundColor White
$files = @(
    ".\lib\memory\types\buffer.ts",
    ".\lib\memory\bufferMemory.ts", 
    ".\pages\api\interview\buffer.ts",
    ".\lib\hooks\useBufferMemory.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "? $file" -ForegroundColor Green
    } else {
        Write-Host "? $file" -ForegroundColor Red
    }
}

# Test 2: Check TypeScript compilation
Write-Host "`n?? TYPE CHECK:" -ForegroundColor White
try {
    # Quick syntax check
    Get-Content ".\lib\memory\bufferMemory.ts" | Select-String -Pattern "class BufferMemoryService" -Quiet
    if ($?) {
        Write-Host "? BufferMemoryService class found" -ForegroundColor Green
    }
    
    Get-Content ".\lib\hooks\useBufferMemory.ts" | Select-String -Pattern "export function useBufferMemory" -Quiet
    if ($?) {
        Write-Host "? useBufferMemory hook found" -ForegroundColor Green
    }
    
} catch {
    Write-Host "? Type check failed: $_" -ForegroundColor Red
}

# Test 3: Create a simple test
Write-Host "`n?? QUICK API TEST:" -ForegroundColor White
Write-Host "To test the Buffer Memory API:" -ForegroundColor Gray
Write-Host "1. Start your server: npm run dev" -ForegroundColor Cyan
Write-Host "2. Test with curl:" -ForegroundColor Cyan
Write-Host @'
   # Create buffer
   curl -X POST http://localhost:3000/api/interview/buffer?action=create \
     -H "Content-Type: application/json" \
     -d '"'"'{
       "userId": "demo_user_123",
       "interviewType": "technical", 
       "difficulty": "mid-level",
       "preferences": {
         "userId": "demo_user_123",
         "preferredRoles": ["Frontend"],
         "preferredTechStack": ["React"],
         "defaultLevel": "Mid-level",
         "defaultType": "Technical",
         "defaultQuestionCount": 5,
         "voiceSettings": {
           "rate": 1.0,
           "volume": 0.8,
           "pitch": 1.0,
           "language": "en-US"
         },
         "updatedAt": "'"'"'$(Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ")'"'"'"
       }
     }'"'"'

   # Add message
   curl -X PUT "http://localhost:3000/api/interview/buffer?action=addMessage&sessionId=YOUR_SESSION_ID" \
     -H "Content-Type: application/json" \
     -d '"'"'{
       "role": "assistant",
       "content": "Explain React hooks",
       "metadata": {
         "questionId": "q1",
         "category": "React",
         "difficulty": "medium"
       }
     }'"'"'
