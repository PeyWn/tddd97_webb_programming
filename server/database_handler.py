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
            "insert into profile values(?,?,?,?,?,?,?)",
            [data['email'], data['password'], data['firstname'],
             data['familyname'], data['gender'], data['city'], data['country']])

        return True

    except:
        return False


def get_profile_by_email(email):
    try:
        cursor = get_db().execute(
            'select * from profile where email like ?', [email])
        data = cursor.fetchall()
        cursor.close()

        if len(data) > 1:
            raise Exception

        return json.dumps(data[0])

    except:
        return False


def change_password(email, new_password):
    try:
        get_db().execute("UPDATE profile \
                        SET password = values(?) \
                        WHERE email = values(?)",
                         [new_password, email])
        return True
    except:
        return False


def put_crap_db():
    get_db().execute(
        "insert into profile values(?, 'panda', 'sven', 'svensson', 'helicopter', 'newheaven', 'pandora')", ['sven@s.c'])


def get_messages_by_email(email):
    try:
        data = get_db().execute("SELECT * from messages \
                            WHERE email = values(?)",
                                [email])

        return json.dumps(data['messages'])
    except:
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
        return False
