# 🚀 Setup Instructions - NO MORE DEPENDENCY CONFLICTS

## ✅ GUARANTEED WORKING SETUP

### Step 1: Clean Environment
```bash
# Remove any old virtual environment
rm -rf venv .venv

# Create fresh virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### Step 2: Install Dependencies
```bash
# Install from MASTER requirements file (project root)
pip install -r requirements.txt
```

### Step 3: Setup Environment
```bash
# Copy environment template
cp backend/python-services/gateway/env.example backend/python-services/gateway/.env

# Edit .env file and add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here
```

### Step 4: Install Frontend
```bash
cd frontend
npm install
cd ..
```

### Step 5: Start Services
```bash
# Terminal 1: Backend
source venv/bin/activate
cd backend/python-services/gateway
python main.py

# Terminal 2: Frontend
cd frontend  
npm run dev
```

## 🎯 What's Fixed

### ❌ OLD (Conflicting):
- Multiple requirements.txt files with different versions
- `openai>=1.100.0` conflicting with `openai-agents==0.3.0`
- Version ranges causing pip resolver issues

### ✅ NEW (Working):
- **ONE** master requirements.txt at project root
- `openai==1.107.2` (exact version)
- `openai-agents==0.3.0` (exact version)
- Compatible version ranges for other packages
- **ALL** individual service requirements deleted

## 🚫 DO NOT:
- Install from `backend/python-services/*/requirements.txt` (DELETED)
- Use `pip install openai>=1.100.0` 
- Mix requirements from different files

## ✅ DO:
- Use `pip install -r requirements.txt` (project root)
- Use the setup script: `./setup.sh`
- Follow these exact instructions

## 🔍 Verification
After installation, check:
```bash
pip list | grep -E "(openai|websockets)"
```

Should show:
```
openai                1.107.2
openai-agents         0.3.0  
websockets            14.2
```

## 🎉 Success!
- No more dependency conflicts
- One source of truth for requirements
- Tested and working configuration

**Your voice agent should now work perfectly!** 🎤✨
