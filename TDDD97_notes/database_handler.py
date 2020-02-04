import sqlite3

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
        get_db().execute("insert into contact values(?,?)", [name, number])
        return True
    except:        
        return False
    
