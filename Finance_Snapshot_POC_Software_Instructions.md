Finance Snapshot POC – Software Setup & Folder Structure

1. Supported Operating Systems

This application can be run on:
• macOS
• Windows (Windows 10 / 11)
• Linux

The only requirement is Python 3.8 or later.

2. Folder Structure (as shared by email)

I used this folder structure

finance_snapshot_poc/
app.py
requirements.txt
rebuild_poc.sh
data/
services/
static/
templates/
secrets/(not shared as it contains open ai key)

3. Installation Instructions (macOS / Linux)

1. Open Terminal
1. Navigate to the project folder
1. Create a virtual environment:

   python3 -m venv venv

1. Activate the environment:

   source venv/bin/activate

1. Install dependencies:

   pip install -r requirements.txt

1. Installation Instructions (Windows)

1. Open Command Prompt or PowerShell
1. Navigate to the project folder
1. Create a virtual environment:

   python -m venv venv

1. Activate the environment:

   venv\Scripts\activate

1. Install dependencies:

   pip install -r requirements.txt

1. Running the Application

Run the application with:

python app.py

Then open a browser and navigate to:

http://127.0.0.1:5000

6. Optional: Enabling OpenAI Simulation

Simulation features are optional and disabled by default.

To enable:

1. Create a file: secrets/openai_key.txt
2. Paste your own OpenAI API key on a single line
3. Restart the application

If no key is provided, the application still runs fully, but scenario simulations will be unavailable.
