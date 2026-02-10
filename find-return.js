const fs = require("fs");

console.log("🔍 Searching for the return statement...");

const content = fs.readFileSync("lib/actions/general.action.ts", "utf8");
const lines = content.split("\n");

let found = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for a line with "return" and "success: true"
    if (line.includes("return") && line.includes("success: true")) {
        console.log(`\n✅ Found at line ${i + 1}:`);
        console.log(line.trim());
        
        // Show the next few lines to see the full return statement
        for (let j = i; j < Math.min(i + 10, lines.length); j++) {
            console.log(lines[j].trim());
            if (lines[j].includes("}") || lines[j].includes("};")) {
                break;
            }
        }
        found = true;
    }
    
    // Also look for lines with feedbackRef.id
    if (line.includes("feedbackRef.id") && !found) {
        console.log(`\n📝 Line ${i + 1} has feedbackRef.id:`);
        console.log(line.trim());
        
        // Check if this is in a return statement by looking backwards
        for (let j = Math.max(0, i - 5); j <= i; j++) {
            if (lines[j].includes("return")) {
                console.log("  This might be in a return statement!");
                for (let k = j; k <= Math.min(i + 2, lines.length); k++) {
                    console.log(`  ${lines[k].trim()}`);
                }
                break;
            }
        }
    }
}

if (!found) {
    console.log("\n❌ Could not find the return statement with 'success: true'");
    console.log("Let me search for all return statements...");
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("return")) {
            console.log(`\n📋 Return statement at line ${i + 1}:`);
            for (let j = i; j < Math.min(i + 8, lines.length); j++) {
                console.log(lines[j].trim());
                if (lines[j].includes("}") || lines[j].includes("};")) {
                    break;
                }
            }
        }
    }
}
