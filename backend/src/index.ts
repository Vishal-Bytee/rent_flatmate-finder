import { createServer } from "http";
import app from "./app";
import { env } from "./config/env";
import { initSocket } from "./socket/socket";

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Rent & Flatmate Finder API listening on port ${env.port} [${env.nodeEnv}]`);
});

process.on("unhandledRejection", (reason) => {
  // eslint-disable-next-line no-console
  console.error("Unhandled promise rejection:", reason);
});
