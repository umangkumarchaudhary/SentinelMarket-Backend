#!/bin/bash
set -e

# Force Python 3.11
echo "Setting up Python 3.11..."
export PYTHON_VERSION=3.11.7

# Install Python 3.11 if not available
if ! command -v python3.11 &> /dev/null; then
    echo "Python 3.11 not found, using system Python"
    python3 --version
else
    echo "Using Python 3.11"
    python3.11 --version
    # Create symlink or use python3.11 directly
    alias python=python3.11
    alias pip=pip3.11
fi

# Upgrade pip, setuptools, wheel
echo "Upgrading pip, setuptools, wheel..."
python3 -m pip install --upgrade pip setuptools wheel

# Install requirements
echo "Installing requirements..."
cd backend
python3 -m pip install -r requirements.txt

echo "Build completed successfully!"

