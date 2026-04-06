import * as fs from "fs";
import * as https from "https";

import * as tar from "tar";
import * as zlib from "zlib";

const REPO_OWNER = "thesysdev";
const REPO_NAME = "openui";
const BRANCH = "main";

function getTarballUrl(): string {
  return `https://codeload.github.com/${REPO_OWNER}/${REPO_NAME}/tar.gz/refs/heads/${BRANCH}`;
}

function getExamplePrefix(exampleName: string): string {
  return `${REPO_NAME}-${BRANCH}/examples/${exampleName}/`;
}

function fetchWithRedirects(url: string): Promise<import("http").IncomingMessage> {
  return new Promise((resolve, reject) => {
    const request = (currentUrl: string) => {
      https
        .get(currentUrl, { headers: { "User-Agent": "openui-cli" } }, (res) => {
          if (
            res.statusCode &&
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            request(res.headers.location);
          } else {
            resolve(res);
          }
        })
        .on("error", reject);
    };
    request(url);
  });
}

export async function fetchExample(exampleName: string, targetDir: string): Promise<void> {
  const tarballUrl = getTarballUrl();
  const prefix = getExamplePrefix(exampleName);
  const stripComponents = prefix.split("/").length - 1;

  console.info(`\nDownloading example "${exampleName}" from GitHub...\n`);

  const res = await fetchWithRedirects(tarballUrl);

  if (res.statusCode && res.statusCode >= 400) {
    throw new Error(`Failed to download tarball: HTTP ${res.statusCode}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  await new Promise<void>((resolve, reject) => {
    res
      .pipe(zlib.createGunzip())
      .pipe(
        tar.extract({
          cwd: targetDir,
          strip: stripComponents,
          filter: (entryPath) => entryPath.startsWith(prefix),
        }),
      )
      .on("finish", resolve)
      .on("error", reject);
  });

  const entries = fs.readdirSync(targetDir);
  if (entries.length === 0) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    throw new Error(
      `Example "${exampleName}" was not found in the repository.\n` +
        `Run \`npx @openuidev/cli create --list-examples\` to see available examples.`,
    );
  }
}
