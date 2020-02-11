from flask import Flask, request
import database_handler
import json

app = Flask(__name__)

@app.teardown_request
def after_request(exception):
    database_handler.disconnect_db()

@app.route('/contact/store/', methods = ['PUT'])
def store_contact():
    data = request.get_json()
    if 'name' in data and 'number' in data and \
       len(data['name']) <= 100 and len(data['number']) <= 30:

        result = database_handler.save_contact(data['name'], data['number'])
        if result == True:
            return json.dumps({'msg': 'Contact saved'}), 200
        else:
            return json.dumps({'msg': 'Failed to save contact'}), 500

    else:
        return '', 400

@app.route('/contact/get/<name>')
def get_contact(name=None):
    if name is not None:
        result = database_handler.get_contact(name)
        return result, 200
    return 'Contact name is none', 400

if __name__ == '__main__':
    app.run()
            
