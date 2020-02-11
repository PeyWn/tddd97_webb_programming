#!/usr/bin/env python3
from flask import Flask, request
app = Flask(__name__)

import webapp.database_handler
import json
from random import randrange

logged_in_users = {}


def validate_signin(email, password):
    data = json.loads(webapp.database_handler.get_profile_by_email(email))
    if 'password' in data and data['password'] == password:
        return True
    return False


def get_email_by_token(token):
    return logged_in_users[token]


def generate_token():
    letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    token = ""
    for _ in range(0, 35):
        token += letters[randrange(1, len(letters))]
    if token in logged_in_users:
        return generate_token()
    return token


def has_valid_token(token):
    if token in logged_in_users:
        return True
    return False


def add_user(token, email):
    if email and token:
        logged_in_users[token] = email
        return True
    return False


def remove_user(token):
    if token in logged_in_users:
        del logged_in_users[token]
        return True
    return False


@app.route('/profile/passchange', methods=['PUT'])
def change_password():
    data = request.get_json()

    if 'token' not in data and 'oldpassword' not in data and \
            'newpassword' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if has_valid_token(data['token']) == False:
        return json.dumps({"success": False,
                           "message": "You are not logged in."})

    email = get_email_by_token(data['token'])

    if validate_signin(email, data['oldpassword']) == False:
        return json.dumps({"success": False,
                           "message": "Old password is incorrect."})

    result = webapp.database_handler.change_password(
        get_email_by_token(data['token']), data['newpassword'])

    if result == True:
        return json.dumps({"success": True,
                           "message": "Password changed."})
    else:
        return json.dumps({"success": False,
                           "message": "Something went wrong."})


@app.route('/user/signout', methods=['PUT'])
def sign_out():
    data = request.get_json()

    if 'token' not in data and data['token'] not in logged_in_users:
        return json.dumps({"success": False,
                           "message": "You are not signed in."})

    del logged_in_users[data['token']]
    return json.dumps({"success": True,
                       "message": "Successfully signed out."})


@app.route('/user/signin', methods=['POST'])
def sign_in():

    data = request.get_json()
    print('Request signin data: ', data, type(data))
    if 'email' not in data and \
            'password' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    user = json.loads(webapp.database_handler.get_profile_by_email(data['email']))

    if user == False:
        return json.dumps({"success": False,
                           "message": "User does not exist"})

    if 'password' not in user and \
            'email' in user:
        return json.dumps({"success": False,
                           "message": "Something went wrong."})

    if user['password'] == data['password'] and \
       user['email'] == data['email']:
        token = generate_token()
        add_user(token, data['email'])
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
        print(data, type(data)) 
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
    data = request.get_json()
    if 'token' in data and has_valid_token(data['token']):
        return webapp.database_handler.get_profile_by_email(get_email_by_token(data['token']))
    return json.dumps({
        "success": False,
        "message": "You are not signed in."
    })


@app.route('/profile/get-by-email', methods=['GET'])
def get_profile_by_email():
    data = request.get_json()
    if 'email' in data and \
        'token' in data and \
            has_valid_token(data['token']):

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
    data = request.get_json()

    if 'token' not in data:
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})
    if not has_valid_token(data['token']):
        return json.dumps({"success": False,
                           "message": "You are not signed in."})
    result = webapp.database_handler.get_messages_by_email(
        get_email_by_token(data['token']))

    if result == False:
        return json.dumps({"success": False,
                           "message": "Something went wrong..."})
    return json.dumps(result)


@app.route('/profile/messages-by-email', methods=["GET"])
def get_messages_by_email():
    data = request.get_json()

    if not ('token' in data and
            'email' in data):

        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if not has_valid_token(data['token']):
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

    if not (
        'token' in data and
        'email' in data and
        'content' in data
    ):
        return json.dumps({"success": False,
                           "message": "Form data missing or incorrect type."})

    if not has_valid_token(data['token']):
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
    app.run(debug=True)
