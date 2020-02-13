#!/usr/bin/env python3
from random import randrange
import json
import webapp.database_handler
from flask import Flask, request
app = Flask(__name__)


class Session:
    def __init__(self):
        self.__logged_in_users = {}

    def validate_signin(self, email, password):
        data = json.loads(webapp.database_handler.get_profile_by_email(email))
        if 'password' in data and data['password'] == password:
            return True
        return False

    def get_email_by_token(self, token):
        return self.__logged_in_users[token]

    def generate_token(self):
        letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        token = ""
        for _ in range(0, 35):
            token += letters[randrange(1, len(letters))]
        if token in self.__logged_in_users:
            return self.generate_token()
        return token

    def get_token_by_email(email):
        for token, mail in __logged_in_users.items():
            if mail == email:
                return token
        return None

    def has_valid_session(self, email):
        if email in self.__logged_in_users.values():
            token = self.get_token_by_email(email)
            if token != None and has_valid_token(token):
                return True
        return False

    def has_valid_token(self, token):
        if token in self.__logged_in_users.keys():
            return True
        return False

    def create_session(self, email):
        if email and token:
            token = self.generate_token()
            self.__logged_in_users[token] = email
            return token
        return None

    def end_session(self, token):
        if token in self.__logged_in_users:
            del self.__logged_in_users[token]
            return True
        return False


global session
session = Session()


@app.route('/profile/passchange', methods=['PUT'])
def change_password():
    data = request.get_json()

    if 'Token' not in request.headers or 'oldpassword' not in data or \
            'newpassword' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if session.has_valid_token(request.headers['token']) == False:
        return json.dumps({"success": False,
                           "message": "You are not logged in."})

    email = session.get_email_by_token(request.headers['token'])

    if session.validate_signin(email, data['oldpassword']) == False:
        return json.dumps({"success": False,
                           "message": "Old password is incorrect."})

    result = webapp.database_handler.change_password(
        session.get_email_by_token(request.headers['token']), data['newpassword'])

    if result == True:
        return json.dumps({"success": True,
                           "message": "Password changed."})
    else:
        return json.dumps({"success": False,
                           "message": "Something went wrong."})


@app.route('/user/signout', methods=['PUT'])
def sign_out():
    if 'Token' not in request.headers or not session.has_valid_token(request.headers['token']):
        return json.dumps({"success": False,
                           "message": "You are not signed in."})

    session.end_session(request.headers['token'])
    return json.dumps({"success": True,
                       "message": "Successfully signed out."})


@app.route('/user/signin', methods=['POST'])
def sign_in():
    data = request.get_json()

    if 'email' not in data or \
            'password' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if session.has_valid_session(data['email']):


    user = json.loads(
        webapp.database_handler.get_profile_by_email(data['email']))

    if user == False:
        return json.dumps({"success": False,
                           "message": "User does not exist"})

    if 'password' not in user or \
            'email' in user:
        return json.dumps({"success": False,
                           "message": "Something went wrong."})

    if user['password'] == data['password'] and \
       user['email'] == data['email']:
        token = session.create_session(data['email'])
        return json.dumps({"success": True,
                           "message": "Successfully signed in.",
                           "data": token})

    else:
        return json.dumps({"success": False,
                           "message": "Wrong username or password."})


@app.route('/user/signup', methods=['PUT'])
def sign_up():
    data = request.get_json()
    if 'messages' not in data:
        data['messages'] = '[]'
    if 'email' in data and \
        'password' in data and \
        'firstname' in data and \
        'familyname' in data and \
        'gender' in data and \
        'city' in data and \
        'country' in data and \
            'messages' in data:

        result = webapp.database_handler.create_profile(data)
        if result == True:
            return json.dumps({"success": True,
                               "message": "Successfully created a new user."})
        else:
            return json.dumps({"success": False,
                               "message": "Something went wrong."})
    else:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})


@app.route('/profile/get-by-token', methods=['GET'])
def get_profile_by_token():
    if 'Token' in request.headers:
        token = session.has_valid_token(request.headers['token'])
        if token
        email = session.get_email_by_token(request.headers['token'])
        return webapp.database_handler.get_profile_by_email(email)
    return json.dumps({
        "success": False,
        "message": "You are not signed in."
    })


@app.route('/profile/get-by-email', methods=['POST'])
def get_profile_by_email():
    data = request.get_json()
    if 'email' in data and \
        'Token' in request.headers and \
            session.has_valid_token(request.headers['token']):

        res = webapp.database_handler.get_profile_by_email(data['email'])
        if res == False:
            return json.dumps({
                "success": False,
                "message": "Someting went wrong..."
            })
        return res

    return json.dumps({
        "success": False,
        "message": "You are not signed in."
    })


@app.route('/profile/messages-by-token', methods=["GET"])
def get_messages_by_token():
    if 'Token' not in request.headers:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})
    if not has_valid_token(request.headers['token']):
        return json.dumps({"success": False,
                           "message": "You are not signed in."})
    email = get_email_by_token(request.headers['token'])
    result = webapp.database_handler.get_messages_by_email(email)

    if result == False:
        return json.dumps({"success": False,
                           "message": "Something went wrong..."})
    return json.dumps(result)


@app.route('/profile/messages-by-email', methods=["POST"])
def get_messages_by_email():
    data = request.get_json()

    if 'Token' not in request.headers or 'email' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if not has_valid_token(request.headers['token']):
        return json.dumps({"success": False,
                           "message": "You are not signed in."})

    result = webapp.database_handler.get_messages_by_email(data['email'])

    if result == False:
        return json.dumps({"success": False,
                           "message": "Something went wrong..."})

    return json.dumps(result)


@app.route('/profile/post', methods=['PUT'])
def post_message_by_email():
    data = request.get_json()

    if 'Token' not in request.headers or \
        'email' not in data or \
        'content' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if not has_valid_token(request.headers['token']):
        return json.dumps({"success": False, "message": "You are not signed in."})

    result = webapp.database_handler.add_message_by_email(
        data['email'], data['content'])

    if result == True:
        return json.dumps({"success": True, "message": "Message posted"})
    else:
        return json.dumps({"success": False, "message": "Something went wrong..."})


@app.route('/')
def root():
    return app.send_static_file('client.html')


if __name__ == '__main__':
    app.run()
