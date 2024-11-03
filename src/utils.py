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
        ],
        check=True
    )
    print("Cloned repository")
    
    # Change to the repository folder
    os.chdir(repo_folder)
    
    # Determine the next numbered directory within info_files
    info_files_path = os.path.join("Scripts", "BuildDatabank", "info_files")
    existing_folders = [
        int(folder) for folder in os.listdir(info_files_path) if folder.isdigit()
    ]
    next_folder_number = max(existing_folders, default=0) + 1
    new_folder_path = os.path.join(info_files_path, str(next_folder_number))
    
    # Create the new folder
    os.makedirs(new_folder_path, exist_ok=True)
    
    # Save the file in the new folder
    save_path = os.path.join(new_folder_path, file.filename)
    file.save(save_path)
    print(f"Saved file to {save_path}")
    
    # Create and switch to a new branch
    branch_name = branch_out()
  
    # Add, commit, and push the file to the repository
    subprocess.run(["git", "add", save_path], check=True)
    subprocess.run(["git", "commit", "-m", "Add new file"], check=True)
    subprocess.run(["git", "push"], check=True)
    print("Pushed file to new branch")

    # Create a pull request to the base branch using GitHub CLI and wait for completion
    subprocess.run(
    [
        "C:\\Program Files\\GitHub CLI\\gh.exe", "pr", "create",
        "--title", f"Add new file to {base_branch}",
        "--body", "This PR adds a new file to the repository.",
        "--base", base_branch,
        "--head", branch_name,
        "-R", f"{repo_name}"  # Specify the repository here
    ],
    check=True,
    shell=True
)

    print("Pull request created successfully")
    # Return to the original directory
    os.chdir("..")
    return True


def branch_out():
    """Create a new branch in the repository, and changes to the new branch."""
    branch_name = "bot/info_yaml_" + time.strftime("%Y%m%d%H%M%S")
    subprocess.run(["git", "checkout", "-b", branch_name])
    subprocess.run(["git", "push", "--set-upstream", "origin", branch_name], check=True)
    return branch_name
    
def authenticate_gh():
    # Get the GitHub token from the environment
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    
    if not GITHUB_TOKEN:
        print("GITHUB_TOKEN environment variable not set.")
        return  # Exit the function if the token is not set

    try:
        # Check if already authenticated
        status_result = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)

        if status_result.returncode == 0:
            print("GitHub CLI is already authenticated.")
        else:
            # Temporarily remove GITHUB_TOKEN for logout step
            del os.environ["GITHUB_TOKEN"]

            # Log out of any previous authentication
            subprocess.run(["gh", "auth", "logout", "--hostname", "github.com"], check=True)
            print("Previous GitHub authentication cleared.")

            # Restore the GITHUB_TOKEN environment variable
            os.environ["GITHUB_TOKEN"] = GITHUB_TOKEN

            # Authenticate with GitHub CLI
            subprocess.run(["gh", "auth", "login", "--with-token"], input=GITHUB_TOKEN.encode(), check=True)
            print("GitHub authentication successful.")
        
    except subprocess.CalledProcessError as e:
        print(f"Error during GitHub authentication: {e}")


def git_setup(name="NMRlipids_File_Upload", email="nmrlipids_bot@github.com"):
    """
    Configures Git with a specific user name and email.
    """
    try:
        # Set Git user name
        subprocess.run(["git", "config", "--global", "user.name", name], check=True)
        
        # Set Git user email
        subprocess.run(["git", "config", "--global", "user.email", email], check=True)
        
        print("Git configuration set successfully.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred while setting Git configuration: {e}")


