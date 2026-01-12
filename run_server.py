"""
🚀 הפעלת שרת קטלוג דיגיטלי יום האישה
אלטשולר שחם
"""

import os
import sys
import webbrowser
import time
from threading import Timer

def open_browser():
    """פתיחה אוטומטית של הדפדפן"""
    time.sleep(1.5)
    webbrowser.open('http://127.0.0.1:8000')

if __name__ == "__main__":
    print("=" * 60)
    print("🌸 קטלוג דיגיטלי יום האישה - אלטשולר שחם")
    print("=" * 60)
    print()
    print("🚀 מפעיל את השרת...")
    print("📱 הדפדפן ייפתח אוטומטית בעוד רגע...")
    print()
    print("🌐 כתובת: http://127.0.0.1:8000")
    print("🛑 לעצירה: לחץ Ctrl+C")
    print()
    print("=" * 60)
    print()

    # פתיחה אוטומטית של הדפדפן אחרי 1.5 שניות
    Timer(1.5, open_browser).start()

    # הפעלת השרת
    import uvicorn
    from app import app

    try:
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except KeyboardInterrupt:
        print("\n\n👋 השרת נעצר בהצלחה!")
        print("להפעלה מחדש הריצי: npm run dev")
        sys.exit(0)
