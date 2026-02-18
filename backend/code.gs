// --- GLOBAL CONFIGURATION ---
const GH_TOKEN = PropertiesService.getScriptProperties().getProperty('GH_TOKEN');
const REPO_OWNER = PropertiesService.getScriptProperties().getProperty('REPO_OWNER');
const APPSCRIPT_PROPERTIES = PropertiesService.getScriptProperties().getProperties();
const REPO_NAME = APPSCRIPT_PROPERTIES['REPO_NAME'];
const JSON_FILE_PATH_PROD = "data/products.json"; 
const JSON_FILE_PATH_COLL = "data/collections.json"; 
const IMAGE_FOLDER_PATH = "images/raw/";
const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/`;
const DRIVE_FOLDER_ID_COLLECTIONS = APPSCRIPT_PROPERTIES['DRIVE_FOLDER_ID_COLLECTIONS']; 
const DRIVE_FOLDER_ID_PRODUCTS = APPSCRIPT_PROPERTIES['DRIVE_FOLDER_ID_PRODUCTS'];
const YAML_FILENAME = "optimize-images.yml";

/**
 * Handle Webhook from AppSheet
 */
function doPost(e) {
  const lock = LockService.getScriptLock();

  //Try to get a lock for 1 second. If we can't get it, it means a sync is already running.
  try{
    if(!lock.tryLock(1000)){
      console.log('Sync already in progress');
      return ContentService.createTextOutput("Sync already in progress. Ignoring duplicate request.");
    }
    console.log('Calling syncAll()');
    // --- RUN SYNC ---
    syncAll();
    
    // Release lock when done
    lock.releaseLock();
    return ContentService.createTextOutput("Sync Completed Successfully");
  }
  catch(err){
    return ContentService.createTextOutput("Error: " + err.message);
  }  
}

/**
 * Main Orchestrator
 */
function syncAll() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const adminSheet = ss.getSheetByName("Admin_Sync");
  const registry = new Set(); 
  const filesToCommit = []; // <-- THE BATCH BUCKET

  if(adminSheet){
    adminSheet.getRange("C2").setValue("⏳ In Progress...").setFontColor("#e67e22");
    SpreadsheetApp.flush(); 
  }

  try {
    console.log("Starting Full Sync...");
    
    // Pass filesToCommit to collect all images and JSONs
    syncCollections(registry, filesToCommit);
    syncProducts(registry, filesToCommit);
    
    // PERFORM THE BATCH COMMIT AT THE VERY END
    if (filesToCommit.length > 0) {
      commitBatchToGitHub(filesToCommit, "Bulk Sync: Images and Data [skip ci]");
    }

    if(adminSheet){
      const now = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
      adminSheet.getRange("B2").setValue(now);
      adminSheet.getRange("C2").setValue("✅ Sync Successful").setFontColor("#38761d");
    }

    triggerGitHubWorkflow();
    console.log("Full Sync Finished.");
  } catch(err) {
    console.error(err);
    if(adminSheet) {
      adminSheet.getRange("C2").setValue("❌ Failed: " + err.message).setFontColor("#cc0000");
    }
  }
}

// --- SYNC CORE FUNCTIONS ---

function syncProducts(registry, filesToCommit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Products") || ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxStatus = headers.indexOf("status");
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID_PRODUCTS);

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    if (row[idxStatus] !== "Synced") {
      let rowHasError = processRowImages(sheet, i + 1, row, headers, folder, registry, filesToCommit);
      if (!rowHasError) {
        sheet.getRange(i + 1, idxStatus + 1).setValue("Synced").setFontColor("#38761d");
      }
    }
  }
  
  const finalJson = generateJsonFromSheet(sheet, headers, false);
  filesToCommit.push({
    path: JSON_FILE_PATH_PROD,
    content: Utilities.base64Encode(Utilities.newBlob(JSON.stringify(finalJson, null, 2)).getBytes())
  });
}

function syncCollections(registry, filesToCommit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Collections");
  if(!sheet) return;

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idxStatus = headers.indexOf("status");
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID_COLLECTIONS);

  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    if (row[idxStatus] !== "Synced") {
      let rowHasError = processRowImages(sheet, i + 1, row, headers, folder, registry, filesToCommit);
      if (!rowHasError) {
        sheet.getRange(i + 1, idxStatus + 1).setValue("Synced").setFontColor("#38761d");
      }
    }
  }

  const finalJson = generateJsonFromSheet(sheet, headers, true);
  filesToCommit.push({
    path: JSON_FILE_PATH_COLL,
    content: Utilities.base64Encode(Utilities.newBlob(JSON.stringify(finalJson, null, 2)).getBytes())
  });
}
// --- HELPERS ---

function processRowImages(sheet, rowNum, row, headers, folder, registry, filesToCommit) {
  let hasError = false;
  headers.forEach((header, colIdx) => {
    if (header.startsWith("image_id")) {
      let suffix = header.replace("image_id", "");
      let nameColIdx = headers.indexOf("image_name" + suffix);
      let imageName = row[nameColIdx];
      let oldDriveId = row[colIdx]; 

      if (imageName) {
        try {
          let fileName = imageName.split('/').pop();
          let files = folder.getFilesByName(fileName);
          
          if (files.hasNext()) {
            let foundFile = files.next();
            let newDriveId = foundFile.getId();

            // --- DRIVE CLEANUP (RESTORED) ---
            if (oldDriveId && oldDriveId !== newDriveId) {
              try {
                DriveApp.getFileById(oldDriveId).setTrashed(true);
                console.log("Deleted old orphaned file: " + oldDriveId);
              } catch (err) {
                console.log("Cleanup skipped (file already gone): " + oldDriveId);
              }
            }

            if (oldDriveId !== newDriveId) {
              sheet.getRange(rowNum, colIdx + 1).setValue(newDriveId);
            }

            // ADD TO BATCH INSTEAD OF UPLOADING IMMEDIATELY
            if (!registry.has(fileName)) {
              filesToCommit.push({
                path: IMAGE_FOLDER_PATH + fileName,
                content: Utilities.base64Encode(foundFile.getBlob().getBytes())
              });
              registry.add(fileName);
            }
          }
        } catch (e) {
          hasError = true;
          console.error("Error in row " + rowNum + ": " + e.message);
        }
      }
    }
  });
  return hasError;
}

// --- NEW BATCH COMMITTER ---

function commitBatchToGitHub(files, message) {
  const headers = {
    "Authorization": "token " + GH_TOKEN,
    "Content-Type": "application/json"
  };

  const repoUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;
  
  // 1. Get current branch state
  const baseRef = JSON.parse(UrlFetchApp.fetch(`${repoUrl}/branches/main`, {headers}).getContentText());
  const latestCommitSha = baseRef.commit.sha;
  const baseTreeSha = baseRef.commit.commit.tree.sha;

  // 2. Create Blobs for each file and get their SHAs
  // This ensures images stay as binary and JSONs stay as text
  const treeNodes = files.map(file => {
    const blobPayload = {
      content: file.content, // This is already Base64 from your processRowImages logic
      encoding: "base64"
    };
    
    const blobRes = JSON.parse(UrlFetchApp.fetch(`${repoUrl}/git/blobs`, {
      method: "POST", headers, payload: JSON.stringify(blobPayload)
    }).getContentText());

    return {
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobRes.sha // Reference the binary SHA instead of 'content'
      //content: Utilities.newBlob(Utilities.base64Decode(file.content)).getDataAsString()
    }
  });

  // 3. Create the Tree object
  const treePayload = { base_tree: baseTreeSha, tree: treeNodes };
  const newTree = JSON.parse(UrlFetchApp.fetch(`${repoUrl}/git/trees`, {
    method: "POST", headers, payload: JSON.stringify(treePayload)
  }).getContentText());

  // 4. Create the Commit
  const commitPayload = { message: message, tree: newTree.sha, parents: [latestCommitSha] };
  const newCommit = JSON.parse(UrlFetchApp.fetch(`${repoUrl}/git/commits`, {
    method: "POST", headers, payload: JSON.stringify(commitPayload)
  }).getContentText());

  // 5. Update the Branch
  UrlFetchApp.fetch(`${repoUrl}/git/refs/heads/main`, {
    method: "PATCH", headers, payload: JSON.stringify({ sha: newCommit.sha })
  });
}

function generateJsonFromSheet(sheet, headers, isCollection) {
  const data = sheet.getDataRange().getValues();
  return data.slice(1).map(row => {
    let item = isCollection ? {} : { specs: {}, images: [] };
    headers.forEach((header, i) => {
      const val = row[i];
      if (val === "" || val === undefined || header === "status" || header.startsWith("image_id")) return;
      if (["purity", "weight", "stones_en", "stones_te"].includes(header)) {
        item.specs[header] = val;
      } else if (header.startsWith("image_name")) {
        let path = cleanImagePath(val);
        if (isCollection) { if (header === "image_name1") item["image"] = path; }
        else { item.images.push(path); if (!item.image) item.image = path; }
      } else { item[header] = val; }
    });
    return item;
  });
}

function handleJsonCommit(path, jsonObject, uploadCount, type, errorLog) {
  const newContent = JSON.stringify(jsonObject, null, 2);
  const existingFile = getFile(path);
  let oldContent = existingFile ? Utilities.newBlob(Utilities.base64Decode(existingFile.content)).getDataAsString() : "";
  
  if (oldContent !== newContent || uploadCount > 0) {
    uploadToGitHub(path, Utilities.newBlob(newContent), `Sync ${type}`, existingFile ? existingFile.sha : null);
  }
}

function getFile(path) {
  const options = { "headers": { "Authorization": "token " + GH_TOKEN }, "muteHttpExceptions": true };
  const res = UrlFetchApp.fetch(BASE_URL + path, options);
  return res.getResponseCode() === 200 ? JSON.parse(res.getContentText()) : null;
}

function uploadToGitHub(path, blob, message, sha = null) {
  const payload = { "message": message, "content": Utilities.base64Encode(blob.getBytes()), "sha": sha || (getFile(path) ? getFile(path).sha : null) };
  const options = { "method": "PUT", "headers": { "Authorization": "token " + GH_TOKEN }, "contentType": "application/json", "payload": JSON.stringify(payload) };
  UrlFetchApp.fetch(BASE_URL + path, options);
}

function cleanImagePath(path) {
  return path ? "images/dist/" + path.split('/').pop() : "";
}

function triggerGitHubWorkflow() {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/${YAML_FILENAME}/dispatches`;
  
  const options = {
    "method": "POST",
    "headers": {
      "Authorization": "token " + GH_TOKEN,
      "Accept": "application/vnd.github.v3+json"
    },
    "payload": JSON.stringify({ "ref": "main" }), // Ensure 'main' is your default branch name
    "muteHttpExceptions": true // This lets us see the full error message
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const body = response.getContentText();
  console.log(`Status: ${code}`);
  console.log(`Response: ${body}`);

  if (code !== 204) {
     console.error("Workflow failed to trigger. Check permissions for 'Actions: Read/Write'.");
  } else {
     console.log("🚀 Workflow triggered successfully!");
  }
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🚀 Pabba Admin').addItem('Sync All', 'doPost').addToUi();
}
