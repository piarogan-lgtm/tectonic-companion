import fs from "fs";

const LOG_FILE = new URL("./knowledge/external_precedent_log.json", import.meta.url);

function ensureLogFileExists() {
  if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
  }
}

export function logExternalPrecedentSuggestions({
  userPrompt,
  selectedPrecedentNames,
  responseText,
  externalPrecedents
}) {
  ensureLogFileExists();

  const existing = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));

  const newEntry = {
    timestamp: new Date().toISOString(),
    userPrompt,
    selectedPrecedents: selectedPrecedentNames,
    externalPrecedents,
    responseText
  };

  existing.push(newEntry);

  fs.writeFileSync(LOG_FILE, JSON.stringify(existing, null, 2));
}