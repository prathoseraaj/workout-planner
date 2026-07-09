"""
api/index.py — Vercel serverless entry point for FitDSA backend.
Vercel looks for a callable named `app` in this file.
"""
import sys
import os

# Add the parent directory (backend/) to Python path so imports work
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: F401 — Vercel uses this `app` object
