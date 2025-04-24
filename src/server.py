# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import utils
import tempfile
import time 
import yaml 
import requests 
import jwt

app = Flask(__name__)
CORS(app)

# Constants
REPO_NAME = 'MagnusSletten/Databank'
BASE_BRANCH = 'dev_cicd'
WORKFLOW_BRANCH = 'dev_cicd'
ClientID =  "Ov23liS8svKowq4uyPcG"
ClientSecret = os.getenv("clientsecret")
jwt_key = os.getenv("jwtkey")




@app.route('/app/awake', methods=['GET','OPTIONS'])
def awake():
    return "<h1> Server is awake!<h1>", 200

@app.route('/app/verifyCode',methods=['POST', 'OPTIONS'])
def verifyCode():

    if request.method == 'OPTIONS':
       return '', 200

    code = request.get_json().get("code")
    if not code:
        return jsonify({"error": "Missing code parameter"}), 400

    url = "https://github.com/login/oauth/access_token"

    payload = {
        "client_id": ClientID,
        "client_secret": ClientSecret,
        "code": code
    }

    headers = {
        "Accept": "application/json"
    }

    response = requests.post(url, data=payload, headers=headers)
    data = response.json()
    access_token = data.get("access_token")

    if not access_token:
        return jsonify({"authenticated": False}), 401

    # Get user info
    user_info = requests.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token}"}
    ).json()

    username = user_info.get("login")

  
    encoded = jwt.encode({"username":username}, jwt_key, algorithm="HS256")
   
    return jsonify({"authenticated": True, "token": encoded, "username":username})


def verifyJwt(): 
    auth_header = request.headers.get('authorization')
    if(auth_header):
        try:
            token = auth_header.split(' ')[1]
            decoded_token = jwt.decode(token,jwt_key,algorithms=["HS256"])
            return decoded_token, None,None       
        except jwt.ExpiredSignatureError:
            return None,jsonify({"error":"Expired Signature"},),401
        except jwt.InvalidTokenError:
            return None,jsonify({"error": "Invalid token"}), 401
    return None,jsonify({"error": "Authorization header missing"}), 400


@app.route('/app/upload', methods=['POST'])
def upload_file():

    decoded,error,err_code = verifyJwt()
    if(error):
        return error,err_code 
    BASE_BRANCH=request.form.get('branch')
   
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

   
    pr_url,branch_name = utils.push_to_repo(file,name,"/Databank", REPO_NAME, BASE_BRANCH)
    
    utils.trigger_addData_workflow(REPO_NAME,branch_name,BASE_BRANCH,BASE_BRANCH)
            
    return jsonify({
        'message': f"File uploaded successfully! Here is the pull request:", "pullUrl": f"{pr_url}"
}), 200
    

        
    

if __name__ == '__main__':
    if not ClientSecret:
        raise ValueError("Missing client secret in environment!")
    utils.git_setup()
    utils.authenticate_gh()
    app.run(host="0.0.0.0", port=5001, debug=False)

