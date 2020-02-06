from flask import g
import sqlite3
import json


def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect('database.db')
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
             "[]"])

        return True

    except Exception as e:
        print("'create_profile' failed dur to ", e)
        return False


def get_profile_by_email(email):
    try:
        cursor = get_db().execute(
            'SELECT * FROM profile WHERE email LIKE ?', [email])
        data = cursor.fetchall()
        cursor.close()

        if len(data) > 1:
            raise Exception

        return json.dumps(data[0])

    except:
        print("'get_profile_by_email' failed")
        return False


def change_password(email, new_password):
    try:
        get_db().execute("UPDATE profile \
                        SET password = values(?) \
                        WHERE email = values(?)",
                         [new_password, email])
        return True
    except:
        print("'change_password' failed")
        return False


def get_messages_by_email(email):
    try:
        data = get_db().execute("SELECT * from messages \
                            WHERE email = values(?)",
                                [email])

        return json.dumps(data['messages'])
    except:
        print("'get_messages_by_email' failed")
        return False


def add_message_by_email(email, message):
    try:
        data = get_messages_by_email(email)

        if data == False:
            return False

        data = json.loads(data)
        data.append(message)
        data = json.dumps(data)
        get_db().execute("UPDATE messages \
                            SET messages = values(?) \
                            WHERE email = values(?)",
                         [data, email])
        return True
    except:
        print("'add_messages_by_email' failed")
        return False
