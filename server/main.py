from flask import Flask, request
import database_handler
import json

app = Flask(__name__)

@app.route('/', methods = ['PUT'])
def tmp():
    database_handler.put_crap_db()
    result = database_handler.get_profile_by_email("sven@s.c")

    print(result)

    return '', 400

if __name__ == '__main__':
    app.run()
