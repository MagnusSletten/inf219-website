# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import shutil

app = Flask(__name__)
CORS(app)

# Define a folder to save uploaded files
UPLOAD_FOLDER = 'uploads'
REPO_FOLDER = 'Databank'
REPO_NAME = 'MagnusSletten/Databank'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    if file and (file.filename.endswith('.yaml') or file.filename.endswith('.jpeg')):
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        return jsonify({'message': 'File uploaded successfully', 'file_path': file_path}), 200
    else:
        return jsonify({'error': 'File type not allowed, only .yaml or .jpeg files are accepted'}), 400
    


def validate_gh_auth(pat):
    """Authenticate GitHub CLI with a Personal Access Token (PAT) at runtime"""
    try:
        # Run GitHub CLI authentication command with PAT
        process = subprocess.run(
            ["gh", "auth", "login", "--with-token"],
            input=pat.encode(),
            check=True,
            capture_output=True
        )
        return process.returncode == 0
    except subprocess.CalledProcessError:
        return False

@app.route('/push', methods=['POST'])
def push_to_github():
    # Get the first file in the upload folder
    files = os.listdir(UPLOAD_FOLDER)
    if not files:
        return jsonify({'error': 'No files found in the upload folder'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, files[0])
    branch_name = f"upload-{os.path.basename(file_path).split('.')[0]}"

    try:
        # Change to the repository directory
        os.chdir(REPO_FOLDER)

        # Pull the latest changes
        subprocess.run(["git", "pull", "origin", "main"], check=True)

        # Create and checkout a new branch
        subprocess.run(["git", "checkout", "-b", branch_name], check=True)

        # Copy the file from the uploads folder to the repository directory
        shutil.copy(file_path, os.path.join(REPO_FOLDER, os.path.basename(file_path)))

        # Add and commit the file
        subprocess.run(["git", "add", os.path.basename(file_path)], check=True)
        commit_message = f"Add {os.path.basename(file_path)}"
        subprocess.run(["git", "commit", "-m", commit_message], check=True)

        # Push the branch to GitHub
        subprocess.run(["git", "push", "origin", branch_name], check=True)

        # Create a pull request using GitHub CLI
        pr_message = f"PR to add {os.path.basename(file_path)} to main"
        subprocess.run(["gh", "pr", "create", "--repo", REPO_NAME, "--head", branch_name, "--base", "main", "--title", pr_message, "--body", pr_message], check=True)

        return jsonify({'message': 'File pushed to GitHub and PR created successfully'}), 200

    except subprocess.CalledProcessError as e:
        return jsonify({'error': f'GitHub push failed: {str(e)}'}), 500



if __name__ == '__main__':
    app.run(debug=True)
