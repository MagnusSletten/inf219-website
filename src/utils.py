# app.py
import subprocess
import os
import yaml
import time
from werkzeug.datastructures import FileStorage


def is_input_valid(file):
    """Validate the input file for the required keys and values."""
    try:
        data = yaml.safe_load(file)
    except yaml.YAMLError as exc:
        return False

    required_keys = [
        "DOI",
    ]

    for key in required_keys:
        if key not in data:
            return False

    # Additional checks for COMPOSITION dictionary
    if not isinstance(data["COMPOSITION"], dict):
        return False

    # Check for UNITEDATOM_DICT if it's a UA simulation
    if "UNITEDATOM_DICT" in data and not isinstance(data["UNITEDATOM_DICT"], dict):
        return False

    return True


def push_to_repo(file: FileStorage, repo_folder, repo_name, base_branch):
    """Push the file content to the specified repository."""
    # Clone the repository
    subprocess.run(
        [
            "git",
            "clone",
            "-b",
            base_branch,
            "--single-branch",
            "--depth=1",
            f"https://github.com/{repo_name}.git",
            repo_folder,
        ]
    )
    print("Cloned repository")
    subprocess.run(["cd", repo_folder])
    file.save("Scripts/BuildDatabank/"+file.filename)
    print("Saved file")
    # Add, commit, and push the file to the repository
    branch_out()
    print("Branched out")
    subprocess.run(["git", "add", file.filename])
    subprocess.run(["git", "commit", "-m", "Add new file"])
    subprocess.run(["git", "push"])
    print("Pushed file")
    subprocess.run(["cd", "-"])
    return True


def branch_out():
    """Create a new branch in the repository, and changes to the new branch."""
    branch_name = "bot/info_yaml_" + time.strftime("%Y%m%d%H%M%S")
    subprocess.run(["git", "checkout", "-b", branch_name])
    subprocess.run(["git", "push", "origin", branch_name])
