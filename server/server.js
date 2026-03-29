import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { buildPrompt } from "./promptEngine.js";
import { selectTopPrecedents, getPrecedentCatalog } from "./selectPrecedents.js";
import { logExternalPrecedentSuggestions } from "./logExternalPrecedents.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*"
  })
);

app.use(express.json());

function extractMentionedPrecedents(responseText, precedentCatalog) {
  const lowerResponse = responseText.toLowerCase();

  return precedentCatalog.filter((precedent) =>
    lowerResponse.includes(precedent.name.toLowerCase())
  );
}

app.get("/", (req, res) => {
  res.send("Tectonic Companion server running");
});

app.post("/api/query", async (req, res) => {
  const userPrompt = req.body.prompt;

  const precedentCatalog = getPrecedentCatalog();
  const selectedPrecedents = selectTopPrecedents(userPrompt, 8);
  const fullPrompt = buildPrompt(userPrompt, selectedPrecedents, precedentCatalog);

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-5",
        max_tokens: 3200,
        messages: [
          {
            role: "user",
            content: fullPrompt
          }
        ]
      },
      {
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );

    const reply = response.data.content[0].text;

    const selectedNames = selectedPrecedents.map((p) => p.name.toLowerCase());
    const mentionedCatalogPrecedents = extractMentionedPrecedents(reply, precedentCatalog);

    const externalPrecedents = mentionedCatalogPrecedents
      .filter((precedent) => !selectedNames.includes(precedent.name.toLowerCase()))
      .map((precedent) => ({
        name: precedent.name,
        architect: precedent.architect
      }));

    if (externalPrecedents.length > 0) {
      logExternalPrecedentSuggestions({
        userPrompt,
        selectedPrecedentNames: selectedPrecedents.map((p) => p.name),
        responseText: reply,
        externalPrecedents
      });
    }

    const matchedPrecedents = mentionedCatalogPrecedents.slice(0, 4).map((precedent) => ({
      name: precedent.name,
      architect: precedent.architect,
      image: precedent.image || "https://via.placeholder.com/600x400?text=No+Image"
    }));

res.json({
  reply,
  precedents: matchedPrecedents
});  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Claude API error" });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});