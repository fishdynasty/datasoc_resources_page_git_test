import fs from "fs";
import path from "path";

// The JSON file we want to update
const RESOURCES_FILE = "resources.json";

// The folder where uploaded resource files are stored
const FILES_FOLDER = "files";

// GitHub gives this automatically when the Action runs.
// Example: fishdynasty/datasoc_resources_page_git_test
const repoName =
  process.env.GITHUB_REPOSITORY || "fishdynasty/datasoc_resources_page_git_test";

const [owner, repo] = repoName.split("/");

// Base GitHub Pages URL
const pagesBaseUrl = `https://${owner}.github.io/${repo}`;

// File types we want to include as resources
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

// Get all files inside a folder, including files inside subfolders
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

// Uses the first folder after files/ as the category
// Example: files/careers/resume-guide.pdf -> Careers
function getCategory(filePath) {
  const parts = filePath.split(path.sep);

  if (parts.length > 1) {
    return makeTitle(parts[1]);
  }

  return "General";
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

const resources = readResources();
const files = getFiles(FILES_FOLDER);

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
    title: "TODO: WRITE TITLE.",
    type: "file",
    category: getCategory(filePath),
    description: "TODO: Add short description.",
    url: url,
    tags: ["ADD", "TAG"],
  };

  resources.push(newResource);
  newResourcesAdded += 1;
}

saveResources(resources);

console.log(`Added ${newResourcesAdded} new resource(s).`);
