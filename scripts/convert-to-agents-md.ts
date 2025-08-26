#!/usr/bin/env -S deno run --allow-read --allow-write

import { walk } from "jsr:@std/fs";
import { join, dirname } from "jsr:@std/path";

/**
 * Script to convert CLAUDE.md files to AGENTS.md files
 * Finds all CLAUDE.md files recursively and copies them to AGENTS.md in the same directory
 */

async function convertClaudeToAgents() {
  const projectRoot = Deno.cwd();
  const claudeFiles: string[] = [];

  console.log(`🔍 Searching for CLAUDE.md files in ${projectRoot}...`);

  // Find all CLAUDE.md files recursively
  for await (const entry of walk(projectRoot, {
    match: [/CLAUDE\.md$/],
    includeDirs: false,
  })) {
    claudeFiles.push(entry.path);
  }

  if (claudeFiles.length === 0) {
    console.log("❌ No CLAUDE.md files found");
    Deno.exit(1);
  }

  console.log(`📁 Found ${claudeFiles.length} CLAUDE.md files:`);
  claudeFiles.forEach(file => console.log(`   - ${file}`));

  // Convert each CLAUDE.md to AGENTS.md
  let successCount = 0;
  let errorCount = 0;

  for (const claudeFile of claudeFiles) {
    try {
      const content = await Deno.readTextFile(claudeFile);
      const directory = dirname(claudeFile);
      const agentsFile = join(directory, "AGENTS.md");

      await Deno.writeTextFile(agentsFile, content);
      
      console.log(`✅ ${claudeFile} → ${agentsFile}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to convert ${claudeFile}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully converted: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`);
  }

  if (errorCount > 0) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await convertClaudeToAgents();
}