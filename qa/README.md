# Optional browser QA

`browser_qa.py` runs a Chromium interaction suite over the project's actual HTML, CSS, and JavaScript. It loads local source files directly into an isolated browser document, so it does not depend on external fonts or an internet connection. It is an additional check, not a substitute for testing through the production hosting setup.

## Requirements

- Python 3.10 or later
- Playwright for Python
- Chromium / Chrome (or a Playwright-installed Chromium)

Install Playwright if needed:

```powershell
py -m pip install playwright
py -m playwright install chromium
```

Run it from the project root:

```powershell
py qa/browser_qa.py
```

Or use `npm run qa:browser` if `python` points to the relevant interpreter. Set `CHROMIUM_PATH` if your Chromium executable is not on `PATH`. The script writes optional reconciliation and incident screenshots to a temporary output folder; set `QA_OUTPUT_DIR` to choose another destination.
