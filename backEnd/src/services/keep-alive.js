import axios from 'axios';
import logger from '../logger/winston.js';

const PING_URL = 'https://csa-church-website-rosy.vercel.app/';
const INTERVAL_MS = 15 * 60 * 1000; // 13 minutes

export const startKeepAliveWorker = () => {
    logger.info(`🚀 Keep-alive worker started. Pinging ${PING_URL} every 13 minutes.`);

    // Initial ping after 30 seconds to allow server to fully settle
    setTimeout(() => {
        pingServer();
    }, 30000);

    setInterval(() => {
        pingServer();
    }, INTERVAL_MS);
};

const pingServer = async () => {
    try {
        const response = await axios.get(PING_URL);
        logger.debug(`📡 Keep-alive ping successful: ${response.status} ${response.statusText}`);
    } catch (error) {
        logger.warn(`⚠️ Keep-alive ping failed for ${PING_URL}: ${error.message}`);
    }
};
