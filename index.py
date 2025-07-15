import sys
import os

# Add the backend directory to the path
sys.path.append('backend')

from app.main import app

# This is the handler for Vercel
handler = app 