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
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
];

function getFiles(folder) {
  let files = [];

  if (!fs.existsSync(folder)) {
    return files;
  }

  const items = fs.readdirSync(folder, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(folder, item.name);

    if (item.isDirectory()) {
      files = files.concat(getFiles(itemPath));
      continue;
    }

    const fileType = path.extname(item.name).toLowerCase();

    if (allowedFileTypes.includes(fileType)) {
      files.push(itemPath);
    }
  }

  return files;
}

function makeId(text) {
  return text
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function makePagesUrl(filePath) {
  const urlPath = filePath
    .split(path.sep)
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${pagesBaseUrl}/${urlPath}`;
}

function readResources() {
  if (!fs.existsSync(RESOURCES_FILE)) {
    return [];
  }

  const content = fs.readFileSync(RESOURCES_FILE, "utf8").trim();

  if (content === "") {
    return [];
  }

  return JSON.parse(content);
}

function saveResources(resources) {
  fs.writeFileSync(
    RESOURCES_FILE,
    JSON.stringify(resources, null, 2) + "\n",
    "utf8"
  );
}

const oldResources = readResources();
const uploadedFiles = getFiles(FILES_FOLDER);

const currentUrls = new Set(
  uploadedFiles.map((filePath) => makePagesUrl(filePath))
);

let resources = oldResources.filter((resource) => {
  if (resource.type !== "file") {
    return true;
  }

  const isTestFile =
    typeof resource.url === "string" &&
    resource.url.startsWith(`${pagesBaseUrl}/${FILES_FOLDER}/`);

  if (!isTestFile) {
    return true;
  }

  return currentUrls.has(resource.url);
});

const deletedCount = oldResources.length - resources.length;
let addedCount = 0;

for (const filePath of uploadedFiles) {
  const cleanPath = filePath.replaceAll("\\", "/");
  const fileName = path.basename(filePath);
  const folders = cleanPath.split("/").slice(1, -1);

  const id = makeId([...folders, fileName].join("-"));
  const url = makePagesUrl(filePath);

  const alreadyExists = resources.some((resource) => {
    return resource.id === id || resource.url === url;
  });

  if (alreadyExists) {
    continue;
  }

  resources.push({
    id,
    title: "TODO: WRITE TITLE!",
    type: "file",
    category: "TODO: Insert Category Here",
    description: "TODO: Add short description.",
    url,
    tags: [],
    needsReview: true,
  });

  addedCount += 1;
}

saveResources(resources);

console.log(`Added ${addedCount} new resource(s).`);
console.log(`Removed ${deletedCount} deleted resource(s).`);
