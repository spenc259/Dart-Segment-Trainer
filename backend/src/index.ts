import { buildApp } from "./app.js";

const start = async () => {
  const { app, config } = await buildApp();

  try {
    await app.listen({
      host: config.host,
      port: config.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

void start();
