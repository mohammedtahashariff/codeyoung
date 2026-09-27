import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🚀 Starting Codeyoung Trial Booking Backend and Frontend...\n");

// Start backend
const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const serverProcess = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "server"),
  stdio: "inherit",
  shell: true,
});

// Start frontend
const clientProcess = spawn(npmCmd, ["run", "dev"], {
  cwd: path.join(rootDir, "Premium Trial Class Booking"),
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  console.log("\n🛑 Stopping servers...");
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
