from flask import g
import sqlite3
import json
import ast


def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect('./database.db')
    return db


def disconnect_db():
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None


def create_profile(data):
    try:
        get_db().execute(
            "INSERT INTO profile values(?,?,?,?,?,?,?)",
            [data['email'],
             data['password'],
             data['firstname'],
             data['familyname'],
             data['gender'],
             data['city'],
             data['country']])

        get_db().execute(
            "INSERT INTO messages values(?, ?)",
            [data['email'],
             data['messages']])

        get_db().commit()

        return True

    except Exception as e:
        print("'create_profile' failed due to ", e)
        return False


def make_dictionary_profile(data_list):
    fields = [
        'email',
        'password',
        'firstname',
        'familyname',
        'gender',
        'city',
        'country'
    ]

    dict = {}

    for i in range(len(fields)):
        dict[fields[i]] = data_list[i]

    return dict


def get_profile_by_email(email):
    try:
        cursor = get_db().execute(
            'SELECT * FROM profile WHERE email LIKE ?', [email])
        data = cursor.fetchall()
        cursor.close()

        if len(data) > 1:
            print("'get_profile_by_email' failed, got no data from database")
            return False

        return make_dictionary_profile(data[0])

    except Exception as e:
        print("'get_profile_by_email' failed: ", e)
        return False


def change_password(email, new_password):
    try:
        get_db().execute("UPDATE profile \
                        SET password = ? \
                        WHERE email LIke ?",
                         [new_password, email])

        get_db().commit()
        return True
    except:
        print("'change_password' failed")
        return False


def make_dictionary_messages(data_list):
    dict = {'email': data_list[0], 'messages': ast.literal_eval(data_list[1])}
    return dict


def get_messages_by_email(email):
    try:
        cursor = get_db().execute("SELECT * FROM messages \
                            WHERE email LIKE ?",
                                  [email])

        data = cursor.fetchall()
        cursor.close()
        if data == []: return False
        return make_dictionary_messages(data[0])
    except Exception as e:
        print("'get_messages_by_email' failed due to ", e)
        return False


def add_message_by_email(email, message = '', writer = 'Unknown'):
    try:
        data = get_messages_by_email(email)

        if data == False:
            return False

        msg_list = data['messages']
        msg_list.append({'content': message, 'writer': writer})
        msg_list = str(msg_list)
        get_db().execute("UPDATE messages \
                            SET messages = ? \
                            WHERE email LIKE ?",
                         [msg_list, email])

        get_db().commit()
        return True
    except Exception as e:
        print("'add_messages_by_email' failed due to ", e)
        return False
