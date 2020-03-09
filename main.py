#!/usr/bin/env python3
import json

from flask import Flask, request
from flask_bcrypt import Bcrypt

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

import hashlib
import base64
import hmac

import database_handler
from session import new_session

app = Flask(__name__)
bcrypt = Bcrypt(app)


global session
session = new_session()


def validate_signin(email, password):
    data = database_handler.get_profile_by_email(email)
    if 'password' in data and bcrypt.check_password_hash(data['password'], password):
        return True
    return False


def validate_password(password):
    if len(password) >= 4:
        return True
    return False


def has_valid_headers(headers):
    if not 'Email' in headers or \
            not session.has_valid_email(headers['Email']):
        return json.dumps({
            "success": False,
            "data": "No valid Email in request"
        })
    return


def validate_data(request):
    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return False, not_valid

    data = request.get_json()
    orig_hmac = data['hmac']
    del data['hmac']

    msg = ""
    for key, val in data.items():
        msg += key + val

    email = request.headers['Email']
    key = session.get_token_by_email(email)

    signature = msg.encode('utf-8')
    secret_key = key.encode('utf-8')

    local_hmac = hmac.new(secret_key, signature, "sha512").hexdigest()

    if hmac.compare_digest(local_hmac, orig_hmac):
        return True, data

    return False, json.dumps({
        "success": False,
        "data": "HMAC does not match"
    })


@app.route('/api/session')
def socket():
    if not request.environ.get('wsgi.websocket'):
        print('No request environ get socket')
        return ''
    try:
        ws = request.environ['wsgi.websocket']
        msg = ws.receive()
        data = json.loads(msg)

        if 'Email' in data:
            session.add_connection(data['Email'], ws)

        while True:
            ws.receive()
    except Exception as e:
        print("Websocket crashed: ", e)
        pass
    return ''


@app.route('/profile/passchange', methods=['PUT'])
def change_password():

    success, data = validate_data(request)
    if success == False:
        return data

    if 'oldpassword' not in data or \
            'newpassword' not in data:
        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    email = request.headers['Email']

    if validate_signin(email, data['oldpassword']) == False:
        return json.dumps({"success": False,
                           "data":  "Old password is incorrect."})

    if not validate_password(data['newpassword']):
        return json.dumps({"success": False,
                           "data":  "Invalid password, must be of length 4 or greater"})

    data['password'] = bcrypt.generate_password_hash(data['newpassword'])

    result = database_handler.change_password(
        request.headers['Email'], data['password'])

    if result == True:
        return json.dumps({"success": True,
                           "data":  "Password changed."})
    else:
        return json.dumps({"success": False,
                           "data":  "Something went wrong."})


@app.route('/user/valid-session', methods=['GET'])
def valid_session():
    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    email = request.headers['Email']

    if not session.has_valid_session(email):
        return json.dumps({"success": False,
                           "data":  "The current session is no longer valid"})

    return json.dumps({"success": True,
                       "data":  "The current ession is valid"})


@app.route('/user/signout', methods=['PUT'])
def sign_out():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    session.end_session(request.headers['Email'])
    return json.dumps({"success": True,
                       "data":  "Successfully signed out."})


@app.route('/user/signin', methods=['POST'])
def sign_in():
    data = request.get_json()

    if 'email' not in data or \
            'password' not in data:
        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    user = database_handler.get_profile_by_email(data['email'])

    if user == False:
        return json.dumps({"success": False,
                           "data":  "User does not exist"})

    if bcrypt.check_password_hash(user['password'], data['password']) and \
            user['email'] == data['email']:
        token = session.create_session(data['email'])
        return json.dumps({"success": True,
                           "data":  "Successfully signed in.",
                           "data": token})
    else:
        return json.dumps({"success": False,
                           "data":  "Wrong username or password."})


@app.route('/user/signup', methods=['PUT'])
def sign_up():
    data = request.get_json()
    if 'messages' not in data:
        data['messages'] = '[]'
    if 'email' not in data or \
        'password' not in data or \
        'firstname' not in data or \
        'familyname' not in data or \
        'gender' not in data or \
        'city' not in data or \
        'country' not in data or \
            'messages' not in data:

        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    if not validate_password(data['password']):
        return json.dumps({"success": False,
                           "data":  "Invalid password, must be of length 4 or greater"})

    pw_hash = bcrypt.generate_password_hash(data['password'])
    data['password'] = pw_hash

    result = database_handler.create_profile(data)
    if result == True:
        return json.dumps({"success": True,
                           "data":  "Successfully created a new user."})
    else:
        return json.dumps({"success": False,
                           "data":  "Something went wrong."})


@app.route('/profile/get-by-token', methods=['GET'])
def get_profile_by_token():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    email = request.headers['Email']

    profile = database_handler.get_profile_by_email(email)

    if profile == False:
        return json.dumps({
            "success": False,
            "data": "Someting went wrong..."
        })

    del profile['password']

    return json.dumps({'success': True, 'data': profile})


@app.route('/profile/get-by-email', methods=['POST'])
def get_profile_by_email():

    success, data = validate_data(request)
    if success == False:
        return data

    if 'email' not in data:
        return json.dumps({
            "success": False,
            "data": "You are not signed in."
        })

    profile = database_handler.get_profile_by_email(data['email'])
    if profile == False:
        return json.dumps({
            "success": False,
            "data": "Someting went wrong..."
        })
    del profile['password']

    return json.dumps({'success': True, 'data': profile})


@app.route('/profile/messages-by-token', methods=["GET"])
def get_messages_by_token():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    email = request.headers['Email']
    data = database_handler.get_messages_by_email(email)

    if data == False:
        return json.dumps({"success": False,
                           "data":  "Something went wrong..."})

    return json.dumps({'success': True, 'data': data["messages"]})


@app.route('/profile/messages-by-email', methods=["POST"])
def get_messages_by_email():

    success, data = validate_data(request)
    if success == False:
        return data

    if 'email' not in data:
        return json.dumps({
            "success": False,
            "data": "Wrong data in request"
        })

    data = database_handler.get_messages_by_email(data['email'])

    if data == False:
        return json.dumps({"success": False,
                           "data":  "Something went wrong..."})

    return json.dumps({'success': True, 'data': data["messages"]})


@app.route('/profile/post', methods=['PUT'])
def post_message_by_email():

    success, data = validate_data(request)
    if success == False:
        return data

    if 'email' not in data or \
            'content' not in data:
        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    if not session.has_valid_email(request.headers['Email']):
        return json.dumps({"success": False, "data":  "You are not signed in."})

    writer = request.headers['Email']
    result = database_handler.add_message_by_email(
        data['email'], data['content'], writer)
    if result == True:
        return json.dumps({"success": True, "data":  "Message posted"})
    else:
        return json.dumps({"success": False, "data":  "Something went wrong..."})


@app.route('/')
def root():
    return app.send_static_file('client.html')


if __name__ == '__main__':
    server = WSGIServer(('127.0.0.1', 8000), app,
                        handler_class=WebSocketHandler)
    server.serve_forever()
