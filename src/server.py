# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import utils
import tempfile

app = Flask(__name__)
CORS(app)

# Constants
REPO_NAME = 'MagnusSletten/Databank'
BASE_BRANCH = 'dev_pipeline'



@app.route('/awake', methods=['GET'])
def awake():
    return "<h1> Server is awake!<h1>", 200


@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
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
        utils.push_to_repo(file, temp_folder, REPO_NAME, BASE_BRANCH)


        return jsonify({'message': 'File uploaded successfully!'}), 200
        
    

if __name__ == '__main__':
    app.run(port="5001", debug=True)
