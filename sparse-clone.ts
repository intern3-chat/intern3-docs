import { execSync } from "node:child_process";
import { existsSync, rmSync, mkdirSync, cpSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const REPO_URL = "https://github.com/intern3-chat/intern3-chat.git";
const TARGET_DOCS_DIR = "./content/docs";

async function sparseCloneDocs(): Promise<void> {
	// Create a unique temporary directory
	const tempDir = join(tmpdir(), `intern3-docs-clone-${Date.now()}`);

	try {
		console.log("🚀 Starting optimized sparse clone of docs folder...");

		// Remove existing docs directory if it exists
		if (existsSync(TARGET_DOCS_DIR)) {
			console.log("📁 Removing existing docs directory...");
			rmSync(TARGET_DOCS_DIR, { recursive: true, force: true });
		}

		console.log(`📦 Creating optimized sparse clone in: ${tempDir}`);

		// Step 1: Clone with maximum filtering and no checkout
		// --filter=blob:none prevents downloading file contents initially (widely supported)
		// --depth=1 only gets the latest commit
		// --single-branch only gets the default branch
		execSync(
			`git clone --no-checkout --filter=blob:none --depth=1 --single-branch ${REPO_URL} "${tempDir}"`,
			{
				stdio: "inherit",
			},
		);

		// Step 2: Configure sparse-checkout before any checkout
		execSync("git config core.sparseCheckout true", {
			cwd: tempDir,
			stdio: "inherit",
		});

		// Step 3: Initialize sparse-checkout in cone mode (more efficient)
		execSync("git sparse-checkout init --cone", {
			cwd: tempDir,
			stdio: "inherit",
		});

		// Step 4: Set sparse-checkout to ONLY include docs folder, exclude everything else
		execSync("git sparse-checkout set docs", {
			cwd: tempDir,
			stdio: "inherit",
		});

		// Step 5: Now checkout - this should only download and checkout docs folder
		console.log("📋 Checking out only docs folder...");
		execSync("git checkout", {
			cwd: tempDir,
			stdio: "inherit",
		});

		// Step 6: Verify what was actually checked out
		console.log("🔍 Verifying sparse checkout contents...");
		try {
			const checkedOut = execSync(
				"find . -name '.*' -prune -o -type f -print",
				{
					cwd: tempDir,
					encoding: "utf8",
				},
			);
			console.log(
				"Files checked out:",
				checkedOut.trim().split("\n").length,
				"files",
			);
			console.log("Contents:", checkedOut.trim());
		} catch (error) {
			console.log("Could not list checked out files");
		}

		// Step 7: Copy only the docs folder to target location
		const tempDocsDir = join(tempDir, "docs");
		if (existsSync(tempDocsDir)) {
			console.log("📋 Copying docs folder to target location...");

			// Ensure the content directory exists
			mkdirSync("./content", { recursive: true });

			// Copy the docs folder
			cpSync(tempDocsDir, TARGET_DOCS_DIR, { recursive: true });

			console.log("✅ Successfully copied docs folder to ./content/docs");
			console.log("📊 Final result - files in ./content/docs:");

			// List the contents of the final docs directory
			try {
				const files = execSync("find ./content/docs -type f", {
					encoding: "utf8",
				});
				console.log(files);
				console.log(`Total files: ${files.trim().split("\n").length}`);
			} catch (error) {
				console.log("Could not list files, but copy completed successfully");
			}
		} else {
			throw new Error(
				"Docs folder not found in cloned repository - the repository might not have a docs folder",
			);
		}
	} catch (error) {
		console.error("❌ Error during sparse clone:", error);
		process.exit(1);
	} finally {
		// Clean up temporary directory
		if (existsSync(tempDir)) {
			console.log("🧹 Cleaning up temporary directory...");
			rmSync(tempDir, { recursive: true, force: true });
		}
	}
}

// Run the script
if (require.main === module) {
	sparseCloneDocs()
		.then(() => {
			console.log("🎉 Optimized sparse clone completed successfully!");
		})
		.catch((error) => {
			console.error("💥 Script failed:", error);
			process.exit(1);
		});
}

export { sparseCloneDocs };
