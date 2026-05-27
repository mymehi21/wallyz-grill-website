#!/bin/bash

# This script will sync all files from this environment to your GitHub

echo "Syncing Wallyz Grill website to GitHub..."

# Check if in git repo
if [ ! -d ".git" ]; then
    echo "Error: Not in a git repository"
    exit 1
fi

# Add all files
git add -A

# Commit changes
git commit -m "Sync: Complete Wallyz Grill website from Claude environment - $(date)"

# Push to GitHub
git push origin main

echo "Done! All files synced to GitHub."
