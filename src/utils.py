# app.py
import subprocess
import os
import yaml
import time
from werkzeug.datastructures import FileStorage
from DatabankLib.databankLibrary import parse_valid_config_settings, YamlBadConfigException
import sys 

def is_input_valid(info_yaml_dict:dict ):
    """Validate the input file for the required keys and values."""
    try:
        sim, files = parse_valid_config_settings(info_yaml_dict)
    except:
        return False

    return True

def git_pull():
    subprocess.run(["git", "fetch"])


def push_to_repo(file: FileStorage, contributer_name, repo_folder, repo_name, base_branch):
    """Push the file content to the specified repository."""
    
    # Retrieve the GitHub token from environment variables
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
    if not GITHUB_TOKEN:
        raise ValueError("GITHUB_TOKEN environment variable not set")

    # Change to the repository folder
    os.chdir(repo_folder)
    subprocess.run(["git", "fetch"])
    subprocess.run(["git", "checkout", base_branch], check=True)
    subprocess.run(["git", "pull"])

    new_folder_path = os.path.join("UserData")

    # Create the new folder
    os.makedirs(new_folder_path, exist_ok=True)

    # Save the file in the new folder
    save_path = os.path.join(new_folder_path, file.filename)
    file.save(save_path)
    print(f"Saved file to {save_path}")

 
    # Set the remote URL to include the token (for push)
    run_command(f"git remote set-url origin https://{GITHUB_TOKEN}@github.com/{repo_name}.git")

    # Create and switch to a new branch
    branch_name = branch_out()

    # Add, commit, and push the file to the repository
    run_command(f"git add {save_path}")
    run_command("git commit -m 'Add new file'")
    run_command(f"git push --set-upstream origin {branch_name}")

    print("Pushed file to new branch")
    pr_url = "default"
    #Create a pull request
    #pr_url = create_pull_request(repo_name, base_branch, branch_name, contributer_name)

    # Return to the original directory
    os.chdir("..")
    return pr_url, branch_name

def run_command(command, error_message="Command failed", working_dir=None):
    try:
        subprocess.run(command, shell=True, check=True, cwd=working_dir)
    except subprocess.CalledProcessError:
        print(error_message)
        sys.exit(1)

def create_pull_request(repo_name, base_branch, branch_name, contributer_name):
    """Create a pull request using GitHub CLI."""
    result = subprocess.run(
        [
            "gh", "pr", "create",
            "--title", f"{contributer_name}'s addition of a new simulation to the branch: {base_branch}",
            "--body", "This PR adds a new file to the repository.",
            "--base", base_branch,
            "--head", branch_name,
            "-R", repo_name
        ],
        check=True,
        capture_output=True,
        text=True
    )
     # Extract and return the PR URL
    pr_url = result.stdout.strip()
    print(f"Pull request created: {pr_url}")
    return pr_url

def branch_out():
    """Create a new branch in the repository, and changes to the new branch."""
    branch_name = "bot/info_yaml_" + time.strftime("%Y%m%d%H%M%S")
    subprocess.run(["git", "checkout", "-b", branch_name])
    subprocess.run(["git", "push", "--set-upstream", "origin", branch_name], check=True)
    return branch_name
    

def authenticate_gh():
    # Get the GitHub token from the environment
    GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

    try:
        # Check if already authenticated
        status_result = subprocess.run(["gh", "auth", "status"], capture_output=True, text=True)

        if status_result.returncode == 0:
            print("GitHub CLI is already authenticated.")
            return  # No need to re-authenticate
        else:
            print("GitHub CLI is not authenticated. Proceeding with login.")
        
        if not GITHUB_TOKEN:
            print("GITHUB_TOKEN environment variable not set.")
            return  # Exit the function if the token is not set

        # Authenticate with GitHub CLI using the provided token
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



def trigger_addData_workflow(repo_name, working_branch_name, target_branch_name, workflow_branch="dev_info_process"):
    print("Starting to trigger the workflow...")  

    """Triggers the AddData GitHub workflow using the GitHub CLI."""
    workflow_filename = "AddData.yml"  # Fixed workflow filename

    try:
        result = subprocess.run(
            [
                "gh", "workflow", "run", workflow_filename,
                "--repo", repo_name,
                "--ref", workflow_branch,  # Specify the branch containing the workflow file
                "--field", f"working_branch_name={working_branch_name}",
                "--field", f"target_branch_name={target_branch_name}"
            ],
            check=True,
            capture_output=True,
            text=True
        )
        workflow_trigger_output = result.stdout.strip()
        print(f"Workflow triggered successfully: {workflow_trigger_output}")
        return workflow_trigger_output
    except subprocess.CalledProcessError as e:
        print(f"Error triggering workflow: {e.stderr}")
        return None