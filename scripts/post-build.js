import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

// Find all function directories in .vercel/output/functions
const functionsDir = path.join(rootDir, ".vercel", "output", "functions");

if (!fs.existsSync(functionsDir)) {
  console.log("No functions directory found, skipping post-build");
  process.exit(0);
}

// Read the root package.json
const rootPackageJson = JSON.parse(
  fs.readFileSync(path.join(rootDir, "package.json"), "utf-8")
);

// Create a production package.json with only dependencies
const prodPackageJson = {
  type: "module",
  dependencies: rootPackageJson.dependencies || {},
};

// Find all function directories
function findFunctionDirs(dir) {
  const dirs = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      // Check if this is a function directory (has .vc-config.json)
      if (fs.existsSync(path.join(fullPath, ".vc-config.json"))) {
        dirs.push(fullPath);
      } else {
        // Recursively search subdirectories
        dirs.push(...findFunctionDirs(fullPath));
      }
    }
  }

  return dirs;
}

const functionDirs = findFunctionDirs(functionsDir);

console.log(`Found ${functionDirs.length} function directories`);

for (const funcDir of functionDirs) {
  const packageJsonPath = path.join(funcDir, "package.json");
  console.log(`Writing package.json to ${packageJsonPath}`);
  console.log(`Content: ${JSON.stringify(prodPackageJson, null, 2)}`);
  try {
    fs.writeFileSync(packageJsonPath, JSON.stringify(prodPackageJson, null, 2));
    console.log(`Successfully wrote ${packageJsonPath}`);
    // Verify it was written
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    console.log(`Verified content: ${content}`);

    // Install dependencies in the function directory
    console.log(`Installing dependencies in ${funcDir}`);
    try {
      execSync("npm install", { cwd: funcDir, stdio: "inherit" });
      console.log(`Successfully installed dependencies in ${funcDir}`);
    } catch (err) {
      console.error(
        `Error installing dependencies in ${funcDir}: ${err.message}`
      );
    }
  } catch (err) {
    console.error(`Error writing ${packageJsonPath}: ${err.message}`);
  }
}

console.log("Post-build script completed");
