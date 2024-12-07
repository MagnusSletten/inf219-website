# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import utils
import tempfile
import time 
app = Flask(__name__)
CORS(app)

# Constants
REPO_NAME = 'MagnusSletten/Databank'
BASE_BRANCH = 'dev_pipeline_compose'



@app.route('/awake', methods=['GET'])
def awake():
    return "<h1> Server is awake!<h1>", 200


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    name = request.form.get("name")
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    if not file:
        return jsonify({'error': 'File not found in the request'}), 400
    
    if  not file.filename.endswith(('.yaml', '.yml')):
        return jsonify({'error': 'File type not allowed, only .yaml or .yml files are accepted'}), 400
    
    if not utils.is_input_valid(file):
        return jsonify({'error': 'File validation failed, check the required keys and values'}), 400

    #Create a tempfolder
    with tempfile.TemporaryDirectory() as temp_folder:
        print(f"Created temporary directory: {temp_folder}")
        #Push the file to the repository
        repo_url,branch_name = utils.push_to_repo(file,name, temp_folder, REPO_NAME, BASE_BRANCH)
    
    utils.trigger_addData_workflow(REPO_NAME,branch_name,BASE_BRANCH,workflow_branch=BASE_BRANCH)
        
    return jsonify({
    'message': f"File uploaded successfully! Here is the pull request: <a href='{repo_url}' target='_blank'>View Pull Request</a>"
    
}), 200
        
    

if __name__ == '__main__':
    utils.git_setup()
    utils.authenticate_gh()
    app.run(host="0.0.0.0", port=5001, debug=True)

