const express = require("express");
const cors = require("cors");
const roonConnection = require("./roon-connection");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/history/status", (req, res) => {
  const status = roonConnection.getConnectionStatus();
  console.log("Connection status:", status);
  res.json(status);
});

app.get("/api/history/now-playing", async (req, res) => {
  try {
    if (!roonConnection.isConnected()) {
      console.log("Roon not connected");
      return res.status(503).json({ error: "Roon service unavailable" });
    }

    const tracks = await roonConnection.getNowPlaying();
    res.json(tracks);
  } catch (err) {
    console.error("Error getting now playing:", err);
    res.status(500).json({ error: "Failed to get now playing info" });
  }
});

app.get("/api/history/image/:key", async (req, res) => {
  try {
    if (!roonConnection.isConnected()) {
      console.log("Roon not connected");
      return res.status(503).json({ error: "Roon service unavailable" });
    }

    const { key } = req.params;
    const { content_type, image } = await roonConnection.getImage(key);

    res.setHeader("Content-Type", content_type);
    res.send(image);
  } catch (err) {
    console.error("Error getting image:", err);
    res.status(500).json({ error: "Failed to get image" });
  }
});

const port = process.env.PORT || 3002;
app.listen(port, () => {
  console.log(`Test server listening on port ${port}`);
});
