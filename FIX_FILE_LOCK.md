# Fix for Windows File Lock Error

## Problem
```
ERROR: Could not install packages due to an OSError: [WinError 32] 
The process cannot access the file because it is being used by another process
```

This happens when:
- Python IDE/editor has files open
- Python process is running in background
- Antivirus is scanning the file
- File explorer has the folder open

## Solutions (Try in Order)

### Solution 1: Use --user Flag (Easiest)
Installs to user directory, avoids system-wide conflicts:

```powershell
pip install --user -r requirements.txt
```

### Solution 2: Close All Python Processes
```powershell
# Check running Python processes
tasklist | findstr python

# Kill if needed (replace PID with actual process ID)
taskkill /F /PID <process_id>
```

### Solution 3: Close IDE/Editor
- Close VS Code, PyCharm, or any editor with Python files open
- Close file explorer windows showing Python packages folder

### Solution 4: Use --no-cache-dir
```powershell
pip install --no-cache-dir -r requirements.txt
```

### Solution 5: Install with Elevated Permissions
```powershell
# Run PowerShell as Administrator, then:
pip install -r requirements.txt
```

### Solution 6: Install Packages One by One
Skip the problematic package and install others first:

```powershell
pip install yfinance scikit-learn scipy matplotlib seaborn
pip install psycopg2-binary sqlalchemy python-dotenv
pip install fastapi "uvicorn[standard]" requests
pip install tweepy telethon
# Skip transformers/torch if they cause issues
pip install transformers --user
pip install torch --user
```

## Recommended Approach

1. **Close all Python IDEs/editors**
2. **Close file explorer windows**
3. **Use --user flag:**
   ```powershell
   pip install --user -r requirements.txt
   ```

This installs packages to your user directory and avoids most file lock issues.

