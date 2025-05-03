#!/usr/bin/env python3
"""
Python Package Installer Helper
------------------------------
A utility script to help install Python packages with proper syntax.
"""

import sys
import subprocess
import os
import argparse

def install_package(package_name, options=None):
    """Install a Python package with pip."""
    if options is None:
        options = []

    cmd = [sys.executable, "-m", "pip", "install"] + options + [package_name]
    print(f"Running: {' '.join(cmd)}")

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        print(result.stdout)
        print(f"Successfully installed {package_name}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing {package_name}:")
        print(e.stderr)
        return False

def main():
    """Main function to parse arguments and install packages."""
    parser = argparse.ArgumentParser(description="Install Python packages with proper syntax")
    parser.add_argument("packages", nargs="+", help="Package names to install")
    parser.add_argument("-u", "--upgrade", action="store_true", help="Upgrade the package")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show verbose output")
    parser.add_argument("--user", action="store_true", help="Install to the Python user install directory")

    args = parser.parse_args()

    options = []
    if args.upgrade:
        options.append("--upgrade")
    if args.verbose:
        options.append("--verbose")
    if args.user:
        options.append("--user")

    success_count = 0
    for package in args.packages:
        if install_package(package, options):
            success_count += 1

    print(f"\nInstalled {success_count} of {len(args.packages)} packages")

if __name__ == "__main__":
    main()
