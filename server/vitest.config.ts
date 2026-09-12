import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "test_secret",
      MONGODB_URI: "mongodb://localhost:27017/cubecoach_test",
    },
  },
});
