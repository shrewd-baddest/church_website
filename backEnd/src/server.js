// Trigger nodemon reload
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import net from "net";

dotenv.config({
  path: new URL("../.env", import.meta.url),
});

import { serverConfig } from "./Configs/serverConfigs.js";
import { httpServer } from "./app.js";
import { connectDb } from "./Configs/dbConfig.js";
import logger from "./logger/winston.js";
import { setupCommunityDatabase } from "./migrations/communityDbInit.js";
import { setupJumuiyaMemberSystem } from "./migrations/jumuiyaMemberSystem.js";
import { setupAssociatesSystem } from "./migrations/associatesMigration.js";
import { setupOfficialMemberLink } from "./migrations/officialMemberLink.js";
import { consolidateMemberData } from "./migrations/memberDataConsolidation.js";
import { repointForeignKeys } from "./migrations/repointForeignKeys.js";
import { setupRoleSystem } from "./migrations/roleAccessControl.js";
import { authAuditMigration } from "./migrations/authAuditMigration.js";
import { registeredSerialNoMigration } from "./migrations/registeredSerialNo.js";
import { importRecordsCourseMigration } from "./migrations/importRecordsCourse.js";
import { backfillSemRegMigration } from "./migrations/backfillSemReg.js";
import { startKeepAliveWorker } from "./services/keep-alive.js";
import { startImportSyncWorker } from "./services/importSyncJob.js";
import questionsMigration from "./migrations/questionsMigration.js";
import publishStatsMigration from "./migrations/publishStatsMigration.js";
import weeklyChallengeMigration from "./migrations/weeklyChallengeMigration.js";
import activityBookingMigration from "./migrations/activityBookingMigration.js";
import { pendingPaymentsMigration } from "./migrations/pendingPaymentsMigration.js";
import attendanceMigration from "./migrations/attendanceMigration.js";
import jumuiyaAttendanceMigration from "./migrations/jumuiyaAttendanceMigration.js";
import activityLogMigration from "./migrations/activityLogMigration.js";
import loginAuditMigration from "./migrations/loginAuditMigration.js";
import semesterConfigMigration from "./migrations/semesterConfigMigration.js";
import whatsappLinksMigration from "./migrations/whatsappLinksMigration.js";
import profileImageMigration from "./migrations/profileImageMigration.js";
import practiceSchedulesMigration from "./migrations/practiceSchedulesMigration.js";
import communityTshirtsMigration from "./migrations/communityTshirtsMigration.js";
import communityEnrollmentMigration from "./migrations/communityEnrollmentMigration.js";
import notificationsMigration from "./migrations/notificationsMigration.js";
import serialConfigMigration from "./migrations/serialConfigMigration.js";
import splitNoAndSerialNoMigration from "./migrations/splitNoAndSerialNo.js";
import jumuiyaTshirtsMigration from "./migrations/jumuiyaTshirtsMigration.js";
import backfillJumuiyaViceChairRole from "./migrations/backfillJumuiyaViceChairRole.js";
import relaxOfficialContactUniqueness from "./migrations/relaxOfficialContactUniqueness.js";
import electionTermClosingMessage from "./migrations/electionTermClosingMessage.js";
import { fixPendingPaymentsCascade } from "./migrations/fixPendingPaymentsCascade.js";
import { fixImportRecordsStatusConstraint } from "./migrations/fixImportRecordsStatusConstraint.js";
import removeGeneralParishModule from "./migrations/removeGeneralParishModule.js";
import choirMusicClassMigration from "./migrations/choirMusicClassMigration.js";
import { refreshTokenGraceWindow } from "./migrations/refreshTokenGraceWindow.js";
import relaxEnrollmentClassId from "./migrations/relaxEnrollmentClassId.js";
import productReviewsMigration from "./migrations/productReviewsMigration.js";
import jumuiyaChannelsMigration from "./migrations/jumuiyaChannelsMigration.js";
import whatsappSyncMigration from "./migrations/whatsappSyncMigration.js";
import heroSliderDynamicMigration from "./migrations/heroSliderDynamicMigration.js";
import communityModuleChannelsMigration from "./migrations/communityModuleChannelsMigration.js";

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

const PID_DIR = path.join(process.cwd(), "src", ".runtime");
const PID_FILE = path.join(PID_DIR, "server.pid");

const readPid = () => {
  try {
    return Number(fs.readFileSync(PID_FILE, "utf8").trim());
  } catch {
    return null;
  }
};

const isPidAlive = (pid) => {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const acquireLockOrExit = () => {
  fs.mkdirSync(PID_DIR, { recursive: true });
  const existingPid = readPid();
  if (existingPid && isPidAlive(existingPid)) {
    logger.error(`Another backend instance is already running (PID ${existingPid}). Exiting.`);
    process.exit(1);
  }
  fs.writeFileSync(PID_FILE, String(process.pid), "utf8");
};

const releaseLock = () => {
  try {
    const existingPid = readPid();
    if (existingPid === process.pid) fs.unlinkSync(PID_FILE);
  } catch {
    // ignore
  }
};

const getFreePort = async (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(null));
    server.listen(port, () => {
      const p = server.address()?.port ?? null;
      server.close(() => resolve(p));
    });
  });
};

const bindWithFallback = async ({ primaryPort, fallbackMax = 20 }) => {
  let portToUse = primaryPort;

  const primaryFree = await getFreePort(primaryPort);
  if (primaryFree == null) {
    // Try next ports
    for (let i = 1; i <= fallbackMax; i++) {
      const candidate = primaryPort + i;
      // eslint-disable-next-line no-await-in-loop
      const free = await getFreePort(candidate);
      if (free != null) {
        portToUse = candidate;
        break;
      }
    }
  }

  if (!portToUse) {
    throw new Error(`No available port found starting from ${primaryPort}`);
  }

  return new Promise((resolve, reject) => {
    const onError = (err) => {
      httpServer.off("listening", onListening);
      reject(err);
    };

    const onListening = () => {
      httpServer.off("error", onError);
      resolve(portToUse);
    };

    httpServer.once("error", onError);
    httpServer.once("listening", onListening);
    httpServer.listen(portToUse);
  });
};

let isShuttingDown = false;
let currentPort = null;

const shutDown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.debug(`Received ${signal}. Shutting down gracefully...`);

  try {
    // Stop accepting new connections
    await new Promise((resolve) => {
      httpServer.close(() => resolve());
    });
  } catch (e) {
    logger.warn(`httpServer.close failed: ${e?.message || e}`);
  }

  releaseLock();
  process.exit(0);
};

["SIGINT", "SIGTERM", "SIGHUP"].forEach((sig) => {
  process.on(sig, () => shutDown(sig));
});

const initServer = async () => {
  acquireLockOrExit();

  const primaryPort = Number(process.env.PORT || serverConfig.PORT || 3001);

  try {
    await connectDb();
    await setupCommunityDatabase();
    await setupJumuiyaMemberSystem();
    await setupAssociatesSystem();
    await setupOfficialMemberLink();
    await consolidateMemberData();
    await repointForeignKeys();
    await setupRoleSystem();
    await authAuditMigration();
    await registeredSerialNoMigration();
    await importRecordsCourseMigration();
    await backfillSemRegMigration();
    await questionsMigration();
    await publishStatsMigration();
    await weeklyChallengeMigration();
    await activityBookingMigration();
    await pendingPaymentsMigration();
    await fixPendingPaymentsCascade();
    await attendanceMigration();
    await jumuiyaAttendanceMigration();
    await activityLogMigration();
    await loginAuditMigration();
    await semesterConfigMigration();
    await whatsappLinksMigration();
    await profileImageMigration();
    await practiceSchedulesMigration();
    await communityTshirtsMigration();
    await communityEnrollmentMigration();
    await notificationsMigration();
    await serialConfigMigration();
    await splitNoAndSerialNoMigration();
    await jumuiyaTshirtsMigration();
    await backfillJumuiyaViceChairRole();
    await relaxOfficialContactUniqueness();
    await electionTermClosingMessage();
    await fixImportRecordsStatusConstraint();
    await removeGeneralParishModule();
    await choirMusicClassMigration();
    await jumuiyaChannelsMigration();
    await whatsappSyncMigration();
    await heroSliderDynamicMigration();
    await communityModuleChannelsMigration();
    await refreshTokenGraceWindow();
    await relaxEnrollmentClassId();
    await productReviewsMigration();

    httpServer.on("error", (err) => {
      if (err?.code === "EADDRINUSE") {
        logger.error(`Port already in use (${primaryPort}). Falling back to another available port...`);
      } else {
        logger.error(`Server error: ${err?.message || err}`);
      }
    });

    currentPort = await bindWithFallback({ primaryPort });
    logger.info(`Server is running on http://localhost:${currentPort}`);

    if (typeof startKeepAliveWorker === "function") {
      startKeepAliveWorker();
    } else {
      logger.warn("startKeepAliveWorker is not a function or is undefined");
    }

    startImportSyncWorker();
  } catch (error) {
    releaseLock();
    logger.error(`Failed to start server: ${error?.message || error}`);
    process.exit(1);
  }
};

initServer();

