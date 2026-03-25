try {
    await import('./src/server.js');
} catch (e) {
    console.error(e);
    process.exit(1);
}
