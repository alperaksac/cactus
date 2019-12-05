from flask_mail import Message
from itsdangerous import URLSafeTimedSerializer


class MailHandler(object):

    def __init__(self, app, mail):
        self.app = app
        self.mail = mail

    def generate_confirmation_token(self, email):
        serializer = URLSafeTimedSerializer(self.app.config['SECRET_KEY'])
        return serializer.dumps(email, salt=self.app.config['SECURITY_PASSWORD_SALT'])

    def confirm_token(self, token, expiration=3600):
        serializer = URLSafeTimedSerializer(self.app.config['SECRET_KEY'])
        try:
            email = serializer.loads(
                token,
                salt=self.app.config['SECURITY_PASSWORD_SALT'],
                max_age=expiration
            )
        except:
            return False
        return email

    def send_email(self, to, subject, template):
        msg = Message(
            subject,
            recipients=[to],
            html=template,
            sender=self.app.config['MAIL_DEFAULT_SENDER']
        )
        self.mail.send(msg)
