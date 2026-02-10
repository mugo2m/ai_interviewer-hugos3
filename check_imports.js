import * as fs from "fs";
import * as path from "path";

function checkMemoryImports() {
  const projectRoot = process.cwd();
  const memoryDir = path.join(projectRoot, "lib", "memory");
  
  console.log("Checking memory module imports...\n");
  
  // First, check what's exported from lib/memory/index.ts
  const indexPath = path.join(memoryDir, "index.ts");
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, "utf-8");
    console.log("📦 Exports from lib/memory/index.ts:");
    const exports = indexContent.match(/export\s+{[^}]+}/gs);
    if (exports) {
      console.log(exports[0]);
    }
  }
  
  // Check app files for memory imports
  const appFiles = [
    path.join(projectRoot, "app", "api", "memory", "performance", "route.ts"),
    path.join(projectRoot, "app", "api", "memory", "route.ts"),
    path.join(projectRoot, "app", "page.tsx"),
    path.join(projectRoot, "app", "layout.tsx")
  ];
  
  console.log("\n🔗 Memory imports in key files:");
  appFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const memoryImports = content.match(/from\s+['"][^'"]*memory[^'"]*['"]/g);
      if (memoryImports) {
        console.log(`\n${path.relative(projectRoot, filePath)}:`);
        memoryImports.forEach(imp => console.log(`  ${imp}`));
      }
    }
  });
}

checkMemoryImports();
