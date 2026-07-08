import fs from "fs";
import path from "path";

const RESOURCES_FILE = "resources.json";

const FILES_FOLDER = "files/test";

const repoName =
  process.env.GITHUB_REPOSITORY || "fishdynasty/datasoc_resources_page_git_test";

const [owner, repo] = repoName.split("/");
const pagesBaseUrl = `https://${owner}.github.io/${repo}`;
const allowedFileTypes = [
  ".pdf",
  ".docx",
  ".pptx",
  ".xlsx",
  ".csv",
  ".zip",
  ".ipynb",
  ".png",
  ".jpg",
  ".jpeg",
];

function getFiles(folder) {
  let allFiles = [];

  if (!fs.existsSync(folder)) {
    return allFiles;
  }

  const items = fs.readdirSync(folder, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(folder, item.name);

    if (item.isDirectory()) {
      allFiles = allFiles.concat(getFiles(itemPath));
    } else {
      const fileType = path.extname(item.name).toLowerCase();

      if (allowedFileTypes.includes(fileType)) {
        allFiles.push(itemPath);
      }
    }
  }

  return allFiles;
}

// Turns a file name/path into a clean id
// Example: "test/My File.pdf" -> "test-my-file"
function makeId(text) {
  return text
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Creates the GitHub Pages URL for the file
function makePagesUrl(filePath) {
  const urlPath = filePath
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${pagesBaseUrl}/${urlPath}`;
}

// Read resources.json
function readResources() {
  if (!fs.existsSync(RESOURCES_FILE)) {
    return [];
  }

  const jsonText = fs.readFileSync(RESOURCES_FILE, "utf8").trim();

  if (jsonText === "") {
    return [];
  }

  return JSON.parse(jsonText);
}

// Save resources.json
function saveResources(resources) {
  fs.writeFileSync(
    RESOURCES_FILE,
    JSON.stringify(resources, null, 2) + "\n",
    "utf8"
  );
}

const originalResources = readResources();
const files = getFiles(FILES_FOLDER);

// Make a list of URLs for files that currently exist
const currentFileUrls = new Set();

for (const filePath of files) {
  currentFileUrls.add(makePagesUrl(filePath));
}

// Remove JSON entries if the matching file was deleted
let resources = originalResources.filter((resource) => {
  // Keep non-file resources, like normal external links
  if (resource.type !== "file") {
    return true;
  }

  // Only remove files hosted from this repo's GitHub Pages files folder
  const isHostedFile =
    typeof resource.url === "string" &&
    resource.url.startsWith(`${pagesBaseUrl}/${FILES_FOLDER}/`);

  if (!isHostedFile) {
    return true;
  }

  // Keep the resource only if the actual file still exists
  return currentFileUrls.has(resource.url);
});

const deletedResourcesCount = originalResources.length - resources.length;

let newResourcesAdded = 0;

for (const filePath of files) {
  const cleanPath = filePath.replaceAll("\\", "/");
  const fileName = path.basename(filePath);

  // Example:
  // files/test/example.pdf
  // folderParts becomes ["test"]
  const folderParts = cleanPath.split("/").slice(1, -1);

  const id = makeId([...folderParts, fileName].join("-"));
  const url = makePagesUrl(filePath);

  const alreadyInJson = resources.some((resource) => {
    return resource.id === id || resource.url === url;
  });

  if (alreadyInJson) {
    continue;
  }

  const newResource = {
    id: id,
    title: "TODO: WRITE TITLE!",
    type: "file",
    category: "TODO: Insert Category Here",
    description: "TODO: Add short description.",
    url: url,
    tags: [],
    needsReview: true,
  };

  resources.push(newResource);
  newResourcesAdded += 1;
}

saveResources(resources);

console.log(`Added ${newResourcesAdded} new resource(s).`);
console.log(`Removed ${deletedResourcesCount} deleted resource(s).`);
