const express = require("express");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const cors = require("cors");
const logger = require("./logger");

const app = express();
const DEFAULT_PORT = 5000;
const MAX_PORT_ATTEMPTS = 10;

app.use(cors());

let skillsData = [];
let server;

function readCSV() {
  skillsData = [];
  const startTime = new Date();
  const csvPath = path.join(__dirname, "data.csv");
  
  logger.info(`CSV read started at ${startTime}`);

  if (!fs.existsSync(csvPath)) {
    logger.error(`CSV file not found at ${csvPath}`);
    return;
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on("data", (row) => {
      skillsData.push(row);
    })
    .on("end", () => {
      logger.info(`CSV read completed. Records parsed: ${skillsData.length}`);
    })
    .on("error", (err) => {
      logger.error("Error reading CSV: " + err.message);
    });
}

readCSV();

app.get("/api/skills", (req, res) => {
  try {
    if (!skillsData || skillsData.length === 0) {
      return res.status(404).json({ error: "No skills data available" });
    }
    res.json(skillsData);
  } catch (error) {
    logger.error("Error serving skills data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", port: server.address().port });
});

function startServer(port = DEFAULT_PORT, attempts = 0) {
  if (attempts >= MAX_PORT_ATTEMPTS) {
    logger.error(`Failed to start server after ${MAX_PORT_ATTEMPTS} attempts`);
    process.exit(1);
  }

  server = app.listen(port, () => {
    const actualPort = server.address().port;
    logger.info(`Server running on http://localhost:${actualPort}`);
    // Log the port for frontend configuration
    console.log(`\nFrontend should connect to: http://localhost:${actualPort}\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.warn(`Port ${port} is busy, trying ${port + 1}`);
      server.close();
      startServer(port + 1, attempts + 1);
    } else {
      logger.error('Server error:', err);
      process.exit(1);
    }
  });
}

// Handle graceful shutdown
function gracefulShutdown(signal) {
  logger.info(`${signal} signal received: closing HTTP server`);
  if (server) {
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();
