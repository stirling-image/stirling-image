import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

// Recursively get all markdown files
function getMdFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.vitepress' && file !== 'scripts') {
        getMdFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY environment variable is missing.");
    process.exit(1);
  }

  const diffPath = process.argv[2];
  if (!diffPath) {
    console.error("Please provide the path to the diff file. Usage: npx tsx apps/docs/scripts/update-docs.ts <path-to-diff>");
    process.exit(1);
  }

  const diffContent = readFileSync(path.resolve(process.cwd(), diffPath), 'utf-8');
  if (!diffContent.trim()) {
    console.log("No diff content. Exiting.");
    return;
  }

  const docsDir = path.resolve(__dirname, '..');
  const mdFiles = getMdFiles(docsDir);

  const docsContext = mdFiles.map(file => {
    const relativePath = path.relative(docsDir, file);
    const content = readFileSync(file, 'utf-8');
    return `--- FILE: ${relativePath} ---\n${content}\n`;
  }).join('\n');

  const prompt = `You are an expert technical writer and developer maintaining documentation for a project.
A code change has just been merged. 

Here is the git diff of the code changes:
\`\`\`diff
${diffContent}
\`\`\`

Here is the current VitePress documentation (Markdown files):
${docsContext}

Task:
Analyze the git diff and determine if any of the documentation files need to be updated to reflect these code changes.
If updates are needed, output a JSON array of objects with 'file' and 'content' properties.
- 'file' MUST be the exact relative path of the file to update (e.g., 'guide/architecture.md').
- 'content' MUST be the complete, updated markdown content for that file.
If no updates are needed, output an empty array: []

IMPORTANT: Respond ONLY with valid JSON. Do not include markdown formatting like \`\`\`json around your response. Just the raw JSON array.`;

  console.log("Sending diff and current docs to Claude API...");
  
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(\`API Error (\${response.status}):\`, errorText);
    process.exit(1);
  }

  const data = await response.json();
  const responseText = data.content?.[0]?.text;

  if (!responseText) {
    console.log("No response text from AI.");
    return;
  }

  try {
    const updates = JSON.parse(responseText);
    if (!Array.isArray(updates) || updates.length === 0) {
      console.log("AI determined no documentation updates are needed.");
      return;
    }

    for (const update of updates) {
      if (update.file && update.content) {
        const fullPath = path.join(docsDir, update.file);
        writeFileSync(fullPath, update.content, 'utf-8');
        console.log(\`Successfully updated \${update.file}\`);
      }
    }
    console.log("Documentation update complete.");
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    console.log("Raw Response:", responseText);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("An unexpected error occurred:", err);
  process.exit(1);
});
