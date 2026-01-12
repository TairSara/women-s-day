from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI()

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def read_root():
    """Serve the main HTML page"""
    return FileResponse("static/index.html")

@app.get("/api/pages")
async def get_pages():
    """Return list of available page images"""
    pages = []
    pages_dir = "static/pages"

    # Check for images 001.jpg through 005.jpg (or .webp, .png)
    for i in range(1, 6):
        page_num = f"{i:03d}"
        found = False

        # Check for different image formats
        for ext in ['.jpg', '.jpeg', '.webp', '.png']:
            image_path = f"{pages_dir}/{page_num}{ext}"
            if os.path.exists(image_path):
                pages.append({
                    "page": i,
                    "image": f"/static/pages/{page_num}{ext}",
                    "exists": True
                })
                found = True
                break

        if not found:
            pages.append({
                "page": i,
                "image": None,
                "exists": False
            })

    # Add an empty back page to make even number (needed for PageFlip with showCover)
    pages.append({
        "page": 6,
        "image": None,
        "exists": False
    })

    return {"pages": pages, "total": 6}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
