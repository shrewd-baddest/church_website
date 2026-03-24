# Church Website Task Progress

## Current Task: Find Schema & Fix 500 Error (Merge Conflicts + DB)

### Step 1: Resolve Merge Conflicts (Priority)

- [x] backEnd/src/model/question.js - Keep origin/main schema
- [x] backEnd/src/Configs/dbConfig.js - Fix ssl & logs to origin/main
- [x] backEnd/src/app.js - Use origin/main full version (hub, gallery)
- [x] backEnd/src/routers/v1/GenerateQuestions.js - origin/main error handling
- [ ] Frontend files (optional, for polish)

### Step 2: Backend Setup

- [ ] Update backEnd/.env with DB creds (Postgres/Mongo)
- [ ] cd backEnd && rm -rf node_modules package-lock.json && npm install
- [ ] npm run dev (PORT=5000)

### Step 3: Verify

- [ ] Backend logs: DB connected, Server running :5000
- [ ] curl http://localhost:5000/
- [ ] Frontend localhost:5173 no 500

### Schema Location

backEnd/src/model/question.js (Mongoose QuestionSchema for AI questions)

Progress: Ready to resolve conflicts.
