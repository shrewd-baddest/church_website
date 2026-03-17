# TODO: Fix MongoDB Connection Issue &amp; Make Server Robust

## Steps:

1. Clean merge conflicts in backEnd/src/server.js and backEnd/src/Configs/dbConfig.js
2. Update backEnd/src/Configs/dbConfig.js: Remove process.exit(1) from connectToMongoDb catch
3. Update backEnd/src/server.js: Wrap connectToMongoDb in try-catch, log error, set global flag (e.g. process.env.mongoConnected = 'false'), continue with app.listen
4. Update backEnd/src/routers/v1/GenerateQuestions.js: Check if mongoConnected, else return static questions or error
5. Test: cd backEnd &amp;&amp; npm start - server runs without crash
6. User: Fix MONGODB_URI in backEnd/.env (check Atlas cluster status/IP whitelist)

Current progress: Starting Step 1
