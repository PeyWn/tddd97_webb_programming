from flask import g
import sqlite3
import json

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE_URI)
    return db

def disconnect_db():
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None

def save_contact(name, number):
    try:
        print("in save_contact")
        database = get_db()
        print("type of db:" + type(database))
        get_db().execute("insert into contact values(?,?)", [name, number])
        get_db().commit()
        return True
    except:        
        return False

def get_contact(name):
    cursor = get_db().execute('select * from contact where name like ?')
    rows = cursor.fetchall()
    cursor.close()
    result = []

    for index in range(len(rows)):
        result.append({'name': rows[index][0], 'number':rows[index][1]})
        
    return json.dumps(result)
