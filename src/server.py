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
from requests.auth import HTTPBasicAuth

app = Flask(__name__)
CORS(app)

# Constants
REPO_NAME = 'MagnusSletten/BilayerData'
BASE_BRANCH = 'main'
WORKFLOW_BRANCH = 'main'
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
    print(username)

   
    return jsonify({"authenticated": True, "token": access_token, "username":username})


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


def authorizeToken(access_token):
    url = f"https://api.github.com/applications/{ClientID}/token"
    headers = {"Accept": "application/vnd.github+json"}
    data = {"access_token": access_token}

    try:
        response = requests.post(url, auth=HTTPBasicAuth(ClientID, ClientSecret), headers=headers, json=data)
        
        if response.status_code == 200:
            return response.json(), None, 200
        elif response.status_code == 404:
            return None, "Token not found or invalid", 404
        elif response.status_code == 401:
            return None, "Bad credentials (check client_id and client_secret)", 401
        else:
            return None, f"Unexpected error: {response.text}", response.status_code

    except Exception as e:
        return None, str(e), 500
 
@app.route('/app/upload', methods=['POST'])
def upload_file():
    token_pre = request.headers.get('authorization')
    token = token_pre.split(' ')[1] if token_pre and " " in token_pre else None

    if not token:
        return jsonify({'error': 'Missing or malformed Authorization header'}), 400

    response,error,err_code = authorizeToken(token)
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
    
    try:
        yaml_data = yaml.safe_load(file.read().decode("utf-8"))
        file.seek(0)
    except:
        return jsonify({'error': f'Invalid YAML file'}), 400
 
    if not utils.is_input_valid(yaml_data):
        return jsonify({'error': 'File validation failed, check the required keys and values'}), 400

   
    pr_url,branch_name = utils.push_to_repo(file,name,"/BilayerData", REPO_NAME, BASE_BRANCH)
               
    return jsonify({
        'message': f"File uploaded successfully! Here is the pull request:", "pullUrl": f"{pr_url}"
}), 200
    

        
    

if __name__ == '__main__':
    if not ClientSecret:
        raise ValueError("Missing client secret in environment!")
    utils.git_setup()
    app.run(host="0.0.0.0", port=5001, debug=False)

