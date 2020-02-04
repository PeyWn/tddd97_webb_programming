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


def get_profile_by_email(email):
    try:
        cursor = get_db().execute('select * from profile where email like ?', [email])
        data = cursor.fetchall()
        cursor.close()

        if len(data) > 1:
            raise Exeption
        
        return json.dumps(data[0])

    except:
        return False
        



def put_crap_db():
    get_db().execute("insert into profile values(?, 'panda', 'sven', 'svensson', 'helicopter', 'newheaven', 'pandora')", ['sven@s.c'])
