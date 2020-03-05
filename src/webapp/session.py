from random import randrange
class Session:
    def __init__(self):
        self.__logged_in_users = {}

    def get_email_by_token(self, token):
        for email, val in self.__logged_in_users.items():
            if val['token'] == token:
                return email
        return None

    def get_token_by_email(self, email):
        return self.__logged_in_users[email]['token']

    def get_connection_by_email(self, email):
        return self.__logged_in_users[email]['socket']

    def generate_token(self):
        letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        token = ""
        for _ in range(0, 35):
            token += letters[randrange(1, len(letters))]
        if token in self.__logged_in_users:
            return self.generate_token()
        return token

    def has_valid_session(self, email):
        if email in self.__logged_in_users.keys():
            if self.has_valid_email(email):
                return True
        return False

    def has_valid_email(self, email):
        if email in self.__logged_in_users:
            return True
        return False

    def add_connection(self, email, socket):
        self.__logged_in_users[email]['socket'] = socket

    def create_session(self, email):
        if email:
            if email in self.__logged_in_users and \
                    'socket' in self.__logged_in_users[email]:
                self.__logged_in_users[email]['socket'].close()

            token = self.generate_token()
            self.__logged_in_users[email] = {'token': token}
            return token
        return None

    def end_session(self, email):
        if self.has_valid_email(email):
            if (email != None):
                del self.__logged_in_users[email]
            return True
        return False
        
def new_session():
    return Session()