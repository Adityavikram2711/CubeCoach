import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function main(): Promise<void> {
  try {
    await connectDatabase();
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB. Server will continue running without a database connection.");
    console.error(err);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`CubeCoach API listening on http://localhost:${env.port}`);
  });
}

main();
