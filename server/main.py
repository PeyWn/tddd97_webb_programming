#!/usr/bin/env python3
from flask import Flask, request
import database_handler
import json

app = Flask(__name__)

logged_in_users = {}


def validate_signin(email, password):
    data = json.loads(database_handler.get_profile_by_email(email))
    if 'password' in data and data['password'] == password:
        return True
    return False


def get_email_by_token(token):
    return True


def has_valid_token(token):
    if token in logged_in_users:
        return True
    return False


def add_user(token):
    email = get_email_by_token(token)
    if email != False:
        logged_in_users[token] = email
        return
    return False


def remove_user(token):
    if token in logged_in_users:
        del logged_in_users[token]
        return True
    return False


@app.route('/profile/passchange')
def change_password():
    data = request.get_json()

    if 'token' not in data and 'oldPassword' not in data and \
            'newPassword' not in data:
        return json.dumps({"success": False, "message": "Form data missing or incorrect type."})

    if has_valid_token(data['token']) == False:
        return json.dumps({"success": False, "message": "You are not logged in."})

    result = database_handler.change_password(
        get_email_by_token(data['token']))

    if result == True:
        return json.dumps({"success": True, "message": "Password changed."})
    else:
        return json.dumps({"success": False, "message": "Something went wront."})


@app.route('/profile/signup', methods=['PUT'])
def create_profile():
    data = request.get_json()
    if 'email' in data and 'password' in data and \
        'firstname' in data and 'familyname' in data and \
            'gender' in data and 'city' in data and 'country' in data:

        result = database_handler.create_profile(data)
        if result == True:
            return json.dumps({"success": True, "message": "Successfully created a new user."})
        else:
            return json.dumps({"success": False, "message": "Form data missing or incorrect type."})
    else:
        return json.dumps({"success": False, "message": "Form data missing or incorrect type."})


@app.route('/profile/get-by-token', methods=['GET'])
def get_profile_by_token():
    data = request.get_json()
    if 'token' in data and has_valid_token(data['token']):
        return database_handler.get_profile_by_email(get_email_by_token(data['token']))
    return json.dumps({
        "success": False,
        "message": "You are not signed in."
    })


@app.route('/profile/get-by-email', methods=['GET'])
def get_profile_by_email():
    data = request.get_json()
    if 'email' in data and 'token' in data and has_valid_token(data['token']):
        res = database_handler.get_profile_by_email(data['email'])
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


@app.route('/', methods=['PUT'])
def tmp():
    database_handler.put_crap_db()
    result = database_handler.get_profile_by_email("sven@s.c")

    return result


if __name__ == '__main__':
    app.run()
