const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 'Rb1nPT2rS4OFDaVIsjESkn219sj2'; // From your logs

async function testAPI(endpoint, method = 'POST', body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        console.log(`Testing: ${endpoint}...`);
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        
        return {
            endpoint,
            status: response.status,
            ok: response.ok,
            statusText: response.statusText
        };
    } catch (error) {
        return {
            endpoint,
            status: 'ERROR',
            ok: false,
            error: error.message
        };
    }
}

async function runAllTests() {
    console.log('🧪 COMPREHENSIVE MEMORY API TEST\n');
    console.log('=' .repeat(50));
    
    const tests = [
        // Main memory API
        {
            endpoint: '/api/memory/performance',
            method: 'POST',
            body: { userId: TEST_USER_ID, action: 'getResumeData' }
        },
        {
            endpoint: '/api/memory/performance',
            method: 'POST', 
            body: { userId: TEST_USER_ID, action: 'getPerformanceHistory' }
        },
        {
            endpoint: '/api/memory/performance',
            method: 'POST',
            body: { userId: TEST_USER_ID, action: 'getProgress' }
        },
        
        // Buffer Memory API
        {
            endpoint: '/api/interview/buffer?action=get&sessionId=test-session',
            method: 'GET',
            headers: { 'x-user-id': TEST_USER_ID }
        },
        {
            endpoint: '/api/interview/buffer?action=getUserBuffers',
            method: 'GET',
            headers: { 'x-user-id': TEST_USER_ID }
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        const result = await testAPI(test.endpoint, test.method, test.body);
        results.push(result);
        
        // Add small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 TEST RESULTS:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let failed = 0;
    
    results.forEach(result => {
        if (result.ok) {
            console.log(`✅ ${result.endpoint}: ${result.status} ${result.statusText}`);
            passed++;
        } else {
            console.log(`❌ ${result.endpoint}: ${result.status} ${result.statusText || result.error}`);
            failed++;
        }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log(`🎯 TOTAL: ${passed} passed, ${failed} failed`);
    
    // Summary of what should work
    console.log('\n📋 EXPECTED WORKING APIS:');
    console.log('1. /api/memory/performance - Main memory API (from your logs)');
    console.log('2. /api/interview/buffer - Buffer memory API (we found the code)');
    console.log('3. Other APIs from your logs: /api/payment/*, /api/feedback');
}

runAllTests().catch(console.error);
