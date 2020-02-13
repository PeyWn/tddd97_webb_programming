#!/usr/bin/env python3
from random import randrange
import json
import webapp.database_handler
from flask import Flask, request
app = Flask(__name__)


class Session:
    def __init__(self):
        self.__logged_in_users = {}

    def get_email_by_token(self, token):
        for email, val in self.__logged_in_users.items():
            if val == token:
                return email
        return None

    def get_token_by_email(self, email):
        return self.__logged_in_users[email]

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
        if token in self.__logged_in_users.values():
            return True
        return False

    def create_session(self, email):
        if email:
            token = self.generate_token()
            self.__logged_in_users[email] = token
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
    data = json.loads(webapp.database_handler.get_profile_by_email(email))
    if 'password' in data and data['password'] == password:
        return True
    return False


def validate_password(password):
    if len(password) >= 4:
        return True
    return False


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

    if validate_signin(email, data['oldpassword']) == False:
        return json.dumps({"success": False,
                           "message": "Old password is incorrect."})

    if validate_password(data['newpassword']):
        return json.dumps({"success": False,
                           "message": "Invalid password, must be of length 4 or greater"})

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
    if 'Token' not in request.headers or \
            not session.has_valid_token(request.headers['token']):
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

    user = json.loads(
        webapp.database_handler.get_profile_by_email(data['email']))

    if user == False:
        return json.dumps({"success": False,
                           "message": "User does not exist"})

    if 'password' not in user or \
            'email' not in user:
        return json.dumps({"success": False,
                           "message": "Something went wrong in the db."})

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
    if 'email' not in data or \
        'password' not in data or \
        'firstname' not in data or \
        'familyname' not in data or \
        'gender' not in data or \
        'city' not in data or \
        'country' not in data or \
            'messages' not in data:

        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})                           

    if validate_password(data['newpassword']):
        return json.dumps({"success": False,
                           "message": "Invalid password, must be of length 4 or greater"})

    result = webapp.database_handler.create_profile(data)
    if result == True:
        return json.dumps({"success": True,
                           "message": "Successfully created a new user."})
    else:
        return json.dumps({"success": False,
                           "message": "Something went wrong."})


@app.route('/profile/get-by-token', methods=['GET'])
def get_profile_by_token():
    if 'Token' in request.headers:
        token = session.has_valid_token(request.headers['token'])
        if token:
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

        profile = webapp.database_handler.get_profile_by_email(data['email'])
        if profile == False:
            return json.dumps({
                "success": False,
                "message": "Someting went wrong..."
            })
        profile = json.loads(profile)
        if 'password' not in profile:
            return json.dumps({
                "success": False,
                "message": "Something went wrong."
            })
        del profile['password']
        return json.dumps(profile)

    return json.dumps({
        "success": False,
        "message": "You are not signed in."
    })


@app.route('/profile/messages-by-token', methods=["GET"])
def get_messages_by_token():
    if 'Token' not in request.headers:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})
    if not session.has_valid_token(request.headers['token']):
        return json.dumps({"success": False,
                           "message": "You are not signed in."})
    email = session.get_email_by_token(request.headers['token'])
    profile = webapp.database_handler.get_profile_by_email(email)

    if profile == False:
        return json.dumps({
            "success": False,
            "message": "Someting went wrong..."
        })
    profile = json.loads(profile)
    if 'password' not in profile:
        return json.dumps({
            "success": False,
            "message": "Something went wrong."
        })
    del profile['password']
    return json.dumps(profile)


@app.route('/profile/messages-by-email', methods=["POST"])
def get_messages_by_email():
    data = request.get_json()

    if 'Token' not in request.headers or 'email' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if not session.has_valid_token(request.headers['token']):
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

    if not session.has_valid_token(request.headers['token']):
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
