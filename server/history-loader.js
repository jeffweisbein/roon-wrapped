const loadHistoryData = async (browse) => {
  console.log("Loading history data...");

  const loadPage = (params) => {
    return new Promise((resolve, reject) => {
      browse.browse(
        {
          ...params,
        },
        (err, r) => {
          if (err) {
            console.error("Browse error:", err);
            reject(err);
          } else {
            resolve(r);
          }
        },
      );
    });
  };

  try {
    // Start at the root level
    console.log("Loading root browse level...");
    const root = await loadPage({
      hierarchy: "browse",
      pop_all: true,
    });

    if (!root || !root.items) {
      console.error("Invalid root response:", root);
      return;
    }

    // Look for History in the root items
    const historyItem = root.items.find(
      (item) => item.title === "History" || item.title === "Play History",
    );

    if (!historyItem) {
      console.error("Could not find History section");
      return;
    }

    console.log("Found History, loading contents...");
    let currentList = await loadPage({
      hierarchy: "browse",
      item_key: historyItem.item_key,
      pop_all: true,
    });

    // Log the structure of the history section
    console.log("History section structure:", {
      title: currentList.title,
      subtitle: currentList.subtitle,
      hint: currentList.hint,
      level: currentList.level,
      total_items: currentList.items?.length || 0,
      has_more: !!currentList.more,
    });

    let loadedItems = 0;
    let hasMore = true;
    let offset = 0;

    while (hasMore) {
      if (!currentList.items || currentList.items.length === 0) {
        console.log("No more items to load");
        break;
      }

      console.log(
        `Processing ${currentList.items.length} items from ${currentList.title || "list"}`,
      );

      for (const item of currentList.items) {
        // Skip items that are not tracks (e.g., navigation items)
        if (item.hint === "action" || item.hint === "list") {
          continue;
        }

        if (item.subtitle && item.title) {
          // Try to parse the timestamp from various sources
          let timestamp;
          try {
            if (item.input_prompt) {
              timestamp = new Date(item.input_prompt).getTime();
            } else if (currentList.title) {
              if (currentList.title.includes("Today")) {
                timestamp = new Date().setHours(0, 0, 0, 0);
              } else if (currentList.title.includes("Yesterday")) {
                timestamp =
                  new Date().setHours(0, 0, 0, 0) - 24 * 60 * 60 * 1000;
              } else {
                timestamp = new Date(currentList.title).getTime();
              }
            }

            if (!timestamp || isNaN(timestamp)) {
              if (item.hint && item.hint.includes("played")) {
                const now = Date.now();
                if (item.hint.includes("minutes ago")) {
                  const minutes = parseInt(item.hint.match(/(\d+) minutes/)[1]);
                  timestamp = now - minutes * 60 * 1000;
                } else if (item.hint.includes("hours ago")) {
                  const hours = parseInt(item.hint.match(/(\d+) hours/)[1]);
                  timestamp = now - hours * 60 * 60 * 1000;
                } else if (item.hint.includes("yesterday")) {
                  timestamp = now - 24 * 60 * 60 * 1000;
                } else {
                  timestamp = now;
                }
              }
            }
          } catch (err) {
            console.error("Error parsing date:", err);
            timestamp = Date.now();
          }

          const track = {
            title: item.title,
            artist: item.subtitle,
            album: item.line3 || "Unknown Album",
            timestamp: timestamp || Date.now(),
            duration: item.length || 180, // Default to 3 minutes if length not provided
          };

          console.log("Adding historical track:", track);
          historyService.addTrack(track);
          loadedItems++;

          if (loadedItems % 100 === 0) {
            console.log(`Progress: ${loadedItems} tracks loaded`);
            await historyService.saveHistory();
          }
        }
      }

      // Load more if available
      if (currentList.more) {
        console.log("Loading more items...");
        offset += currentList.items.length;
        currentList = await loadPage({
          hierarchy: "browse",
          item_key: historyItem.item_key,
          offset: offset,
          pop_all: true,
        });
      } else {
        hasMore = false;
      }

      console.log(`Loaded ${loadedItems} tracks so far...`);
    }

    console.log(
      `History data loaded successfully. Total tracks: ${loadedItems}`,
    );
    await historyService.saveHistory();
  } catch (err) {
    console.error("Error loading history data:", err);
    throw err;
  }
};

module.exports = loadHistoryData;
