#!/usr/bin/env python3
from random import randrange
import json
import database_handler
from flask import Flask, request
from flask.ext.bcrypt import Bcrypt

from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer

app = Flask(__name__)

class Session:
    def __init__(self):
        self.__logged_in_users = {}

    def get_email_by_token(self, token):
        for email, val in self.__logged_in_users.items():
            if val['token'] == token:
                return email
        return None

    def get_token_by_email(self, email):
        return self.__logged_in_users[email]['token']

    def get_connection_by_token(self, token):
        email = self.get_email_by_token(token)
        return self.__logged_in_users[email]['socket']

    def generate_token(self):
        letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        token = ""
        for _ in range(0, 35):
            token += letters[randrange(1, len(letters))]
        if token in self.__logged_in_users:
            return self.generate_token()
        return token

    def has_valid_session(self, email):
        if email in self.__logged_in_users.keys():
            token = self.get_token_by_email(email)
            if token != None and self.has_valid_token(token):
                return True
        return False

    def has_valid_token(self, token):
        for item in self.__logged_in_users.values():
            if token == item['token']:
                return True
        return False

    def add_connection(self, token, socket):
        email = self.get_email_by_token(token)
        self.__logged_in_users[email]['socket'] = socket

    def create_session(self, email):
        if email:
            if email in self.__logged_in_users and \
                    'socket' in self.__logged_in_users[email]:
                self.__logged_in_users[email]['socket'].close()

            token = self.generate_token()
            self.__logged_in_users[email] = {'token': token}
            return token
        return None

    def end_session(self, token):
        if self.has_valid_token(token):
            email = self.get_email_by_token(token)
            if (email != None):
                del self.__logged_in_users[email]
            return True
        return False


global session
session = Session()


def validate_signin(email, password):
    data = json.loads(database_handler.get_profile_by_email(email))
    if 'password' in data and data['password'] == password:
        return True
    return False


def validate_password(password):
    if len(password) >= 4:
        return True
    return False


def has_valid_headers(headers):
    if not 'Token' in headers or \
            not session.has_valid_token(headers['Token']):
        return json.dumps({
            "success": False,
            "data": "No valid token in request"
        })
    return False


@app.route('/api/session')
def socket():
    if not request.environ.get('wsgi.websocket'):
        print('No request environ get socket')
        return ''
    try:
        ws = request.environ['wsgi.websocket']
        msg = ws.receive()
        data = json.loads(msg)

        if 'Token' in data:
            session.add_connection(data['Token'], ws)

        while True:
              ws.receive()
    except:
        pass
    return ''


@app.route('/profile/passchange', methods=['PUT'])
def change_password():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    data = request.get_json()

    if 'oldpassword' not in data or \
            'newpassword' not in data:
        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    email = session.get_email_by_token(request.headers['token'])

    if validate_signin(email, data['oldpassword']) == False:
        return json.dumps({"success": False,
                           "data":  "Old password is incorrect."})

    if not validate_password(data['newpassword']):
        return json.dumps({"success": False,
                           "data":  "Invalid password, must be of length 4 or greater"})

    result = database_handler.change_password(
        session.get_email_by_token(request.headers['token']), data['newpassword'])

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

    email = session.get_email_by_token(request.headers['Token'])

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

    session.end_session(request.headers['Token'])
    return json.dumps({"success": True,
                       "data":  "Successfully signed out."})


@app.route('/user/signin', methods=['POST'])
def sign_in():
    data = request.get_json()

    if 'email' not in data or \
            'password' not in data:
        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    user = json.loads(
        database_handler.get_profile_by_email(data['email'])
        )

    if user == False:
        return json.dumps({"success": False,
                           "data":  "User does not exist"})

    if user['password'] == data['password'] and \
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

    email = session.get_email_by_token(request.headers['Token'])

    profile = database_handler.get_profile_by_email(email)

    if profile == False:
        return json.dumps({
            "success": False,
            "data": "Someting went wrong..."
        })

    profile = json.loads(profile)
    del profile['password']

    return json.dumps({'success': True, 'data': profile})


@app.route('/profile/get-by-email', methods=['POST'])
def get_profile_by_email():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    data = request.get_json()
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
    profile = json.loads(profile)
    del profile['password']

    return json.dumps({'success': True, 'data': profile})


@app.route('/profile/messages-by-token', methods=["GET"])
def get_messages_by_token():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    email = session.get_email_by_token(request.headers['Token'])
    data = database_handler.get_messages_by_email(email)

    if data == False:
        return json.dumps({"success": False,
                           "data":  "Something went wrong..."})

    return json.dumps({'success': True, 'data': data["messages"]})


@app.route('/profile/messages-by-email', methods=["POST"])
def get_messages_by_email():

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    data = request.get_json()
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

    not_valid = has_valid_headers(request.headers)
    if not_valid:
        return not_valid

    data = request.get_json()
    if 'email' not in data or \
            'content' not in data:
        return json.dumps({"success": False,
                           "data":  "Form data missing or incorrect type."})

    if not session.has_valid_token(request.headers['token']):
        return json.dumps({"success": False, "data":  "You are not signed in."})

    writer = session.get_email_by_token(request.headers['Token'])
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
    server = WSGIServer(('127.0.0.1', 5000), app, handler_class=WebSocketHandler)
    server.serve_forever()
