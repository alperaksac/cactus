import base64
import os
import threading
import time
from datetime import datetime, timedelta

import networkx as nx
import numpy as np
from bson import json_util
from flask import (Flask, abort, flash, jsonify, render_template, request,
                   send_file, session, url_for)
from flask_compress import Compress
from flask_mail import Mail
from flask_pymongo import PyMongo
from networkx.algorithms import community
from networkx.readwrite import json_graph
from nltk import agreement
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename

from cactus.db_handler import DatabaseHandler, User
from cactus.img_handler import ImageHandler
from cactus.mail_handler import MailHandler

# from cactus.model import *

TEST = False
APP_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)
app.config.from_object(__name__)
if TEST:
    app.config['SERVER_NAME'] = 'test_server_name'
else:
    app.config['SERVER_NAME'] = 'server_name'
app.config['SECRET_KEY'] = os.urandom(24)
app.config['SECURITY_PASSWORD_SALT'] = os.urandom(24)
app.permanent_session_lifetime = timedelta(minutes=60)

# Flask-Mail configuration
app.config['MAIL_SERVER'] = 'server_adress'
app.config['MAIL_PORT'] = 'port'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'username'
app.config['MAIL_PASSWORD'] = 'password'
app.config['MAIL_DEFAULT_SENDER'] = 'sender_name'

# MongoDB configuration
app.config['MONGO_HOST'] = 'host_adress'
app.config['MONGO_PORT'] = 'port'
app.config['MONGO_DBNAME'] = 'dbname'
app.config['MONGO_USERNAME'] = 'username'
app.config['MONGO_PASSWORD'] = 'password'

# Initialize Flask-Mail
mail = Mail(app)

# Initialize gZip compression
Compress(app)

# Initialize PyMongoDB
mongo = PyMongo(app, config_prefix='MONGO')

# Control connection
# if not TEST:
#     Limiter(app, key_func=get_remote_address,
#             global_limits=["100 per hour", "20 per minute"])

db_handler = DatabaseHandler(mongo)
mail_handler = MailHandler(app, mail)

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/login', methods=['POST'])
def login():
    req = request.get_json()
    user = db_handler.get_user(req['email'].lower())
    if user is None or req['email'].lower() not in user['user'][-1]['email'] or not check_password_hash(user['user'][-1]['password'], req['password']):
        db_handler.write_logging('Login Failed! ' + req['email'].lower(), request)
        return jsonify({'result': False})
    else:
        if user['user'][0]['confirmed']:
            session['user_id'] = str(user['_id'])
            session['user'] = User(user['user'][-1]['email'], user['user'][-1]['firstname'],
                                   user['user'][-1]['lastname'], user['role'],
                                   str(user['last_dataset']),
                                   str(user['last_annotation']), str(user['last_login'])).toJSON()
            session['logged_in'] = True
            _id = db_handler.update_last_login(session['user_id'])
            log_id = db_handler.write_logging(
                'Login Successful!', request, session['user_id'])
            session['log_id'] = str(log_id)
            return jsonify({'result': True, 'confirmed': True, 'last_dataset': str(user['last_dataset'])})
        else:
            return jsonify({'result': True, 'confirmed': False})
    return jsonify({'result': False})


@app.route('/api/logout', methods=['POST'])
def logout():
    if not session.get('logged_in'):
        abort(401)

    db_handler.write_logging('Logout Successful!',
                             request, session['user_id'], session['log_id'])
    session.clear()
    return jsonify({'result': True})


@app.route('/api/checkEmail', methods=['POST'])
def check_email():
    req = request.get_json()
    user = db_handler.get_user(req['email'].lower())

    return jsonify({'result': False}) if user is None else jsonify({'result': True})


@app.route('/api/signup', methods=['POST'])
def signup():
    req = request.get_json()
    user = db_handler.get_user(req['email'].lower())
    if user is None:
        user_id = db_handler.add_user(req['firstname'], req['lastname'],
                                      req['email'].lower(), req['password'])
        token = mail_handler.generate_confirmation_token(req['email'].lower())
        confirm_url = url_for('confirm_email', token=token, _external=True)
        html = render_template('user/activate.html', confirm_url=confirm_url)
        subject = "Please confirm your email"
        t = threading.Thread(target=send_async_email,
                             args=(req['email'].lower(), subject, html,))
        t.start()
        return jsonify({'result': False}) if user_id is None else jsonify({'result': True})
    else:
        return jsonify({'result': False})


@app.route('/api/forgotPassword', methods=['POST'])
def forgot_password():
    req = request.get_json()
    user = db_handler.get_user(req['email'].lower())
    if user:
        token = mail_handler.generate_confirmation_token(req['email'].lower())
        confirm_url = url_for('confirm_reset_password',
                              token=token, _external=True)
        html = render_template('user/reset.html', confirm_url=confirm_url)
        subject = "Request to reset password"
        t = threading.Thread(target=send_async_email,
                             args=(req['email'].lower(), subject, html,))
        t.start()
        return jsonify({'result': True})
    else:
        return jsonify({'result': False})


@app.route('/api/resetPassword', methods=['POST'])
def reset_password():
    req = request.get_json()
    user = db_handler.get_user(req['email'].lower())
    user_id = db_handler.update_user(user['_id'], user['user'][0]['firstname'], user['user'][0]['lastname'],
                                     req['email'].lower(), req['password'])
    return jsonify({'result': False}) if user_id is 0 else jsonify({'result': True})


def send_async_email(email, subject, html):
    """Background task to send an email with Flask-Mail."""
    with app.app_context():
        mail_handler.send_email(email, subject, html)


@app.route('/confirm/<token>')
def confirm_email(token):
    email = mail_handler.confirm_token(token)
    if not email:
        return render_template('index.html', task='alert', msg="The confirmation link is invalid or has expired.")
    else:
        user = db_handler.get_user(email)
        if user['user'][0]['confirmed']:
            return render_template('index.html', task='alert', msg="Account already confirmed. Please login.")
        else:
            user_id = db_handler.update_confirmation(user['_id'], email)
            return render_template('index.html', task='alert', msg="You have confirmed your account. Thanks!")


@app.route('/api/resend', methods=['POST'])
def resend_confirmation():
    req = request.get_json()
    token = mail_handler.generate_confirmation_token(req['email'].lower())
    confirm_url = url_for('confirm_email', token=token, _external=True)
    html = render_template('user/activate.html', confirm_url=confirm_url)
    subject = "Please confirm your email"
    t = threading.Thread(target=send_async_email,
                         args=(req['email'].lower(), subject, html,))
    t.start()
    return jsonify({'result': True})


@app.route('/reset/<token>')
def confirm_reset_password(token):
    email = mail_handler.confirm_token(token)
    if not email:
        return render_template('index.html', task='alert', msg="The reset password link is invalid or has expired.")
    else:
        return render_template('index.html', task='reset', email=email)


@app.route('/api/updateAccount', methods=['POST'])
def update_account():
    req = request.get_json()
    res = db_handler.update_user(session['user_id'], req['firstname'], req['lastname'],
                                 req['email'].lower(), req['password'])

    return jsonify({'result': False}) if res is 0 else jsonify({'result': True})


@app.route('/api/status')
def status():
    if session.get('logged_in'):
        if session['logged_in']:
            return jsonify({'status': True})
    else:
        return jsonify({'status': False})


@app.route('/api/getUser')
def get_user():
    if not session.get('logged_in'):
        abort(401)
    return json_util.dumps({'user': session['user']})


@app.route('/api/getAnnotationImages')
def get_annotation_images():
    if not session.get('logged_in'):
        abort(401)
    if session['user']['last_dataset'] != 'None':
        images = db_handler.get_annotation_images(
            session['user']['last_dataset'], session['user_id'])
        return json_util.dumps({'result': True,
                                'images_annotated': images[0],
                                'images_unannotated': images[1]})
    else:
        return jsonify({'result': False})


@app.route('/api/getScoringImages')
def get_scoring_images():
    if not session.get('logged_in'):
        abort(401)
    if session['user']['last_annotation'] != 'None':
        images = db_handler.get_scoring_images(
            session['user']['last_dataset'], session['user']['last_annotation'], session['user_id'])

        return json_util.dumps({'result': True,
                                'images_scored': images[0],
                                'images_unscored': images[1],
                                'images_unfinished': images[2]})
    else:
        return jsonify({'result': False})


@app.route('/api/getDatasets', methods=['GET'])
def get_datasets():
    if not session.get('logged_in'):
        abort(401)

    datasets = db_handler.get_datasets()
    return json_util.dumps({'datasets': datasets})


@app.route('/api/getAnnotations', methods=['GET'])
def get_annotations():
    if not session.get('logged_in'):
        abort(401)

    if session['user']['last_dataset'] == 'None':
        return json_util.dumps({'annotations': []})

    annotations = db_handler.get_annotations(session['user']['last_dataset'])
    for annotation in annotations:
        images = db_handler.get_annotation_images(
            session['user']['last_dataset'], annotation['_id'])

        mitosis = non_mitosis = apoptosis = tumor = non_tumor = lumen = non_lumen = 0
        for a in annotation['annotations']:
            mitosis += len(a[-1]['mitosis'])
            non_mitosis += len(a[-1]['non_mitosis'])
            apoptosis += len(a[-1]['apoptosis'])
            tumor += len(a[-1]['tumor'])
            non_tumor += len(a[-1]['non_tumor'])
            lumen += len(a[-1]['lumen'])
            non_lumen += len(a[-1]['non_lumen'])
        annotation['count'] = {'#ofa': len(images[0]), '#ofna': len(images[1]), 'mitosis': mitosis, 'non_mitosis': non_mitosis, 'apoptosis': apoptosis,
                               'tumor': tumor, 'non_tumor': non_tumor, 'lumen': lumen, 'non_lumen': non_lumen}
    return json_util.dumps({'annotations': annotations})


@app.route('/api/getScores', methods=['GET'])
def get_scores():
    if not session.get('logged_in'):
        abort(401)

    scores = db_handler.get_scores(
        session['user']['last_dataset'], session['user']['last_annotation'])

    user_idx = -1
    for idx, val in enumerate(scores):
        if str(val['_id']) == session['user_id']:
            user_idx = idx
            break

    if user_idx == -1:
        return json_util.dumps({'results': []})

    annotations_scores = []
    for score in scores:
        annotations_scores.append(
            dict(zip(score['annotations'], [x[-1] for x in score['scores']])))

    results = []
    for idx, val in enumerate(scores):
        if idx == user_idx:
            continue

        user = dict()
        scored_idx = set(annotations_scores[user_idx].keys()) & set(
            annotations_scores[idx].keys())

        a = [annotations_scores[user_idx][x] for x in scored_idx]
        b = [annotations_scores[idx][x] for x in scored_idx]

        scorer1 = {'histologicType': [], 'initialScore': [],
                   'mitosis': [], 'lumen': [], 'nuclear': []}
        scorer2 = {'histologicType': [], 'initialScore': [],
                   'mitosis': [], 'lumen': [], 'nuclear': []}

        for x, y in zip(a, b):
            scorer1['histologicType'].append(x['histologicType'])
            scorer2['histologicType'].append(y['histologicType'])

            scorer1['initialScore'].append(x['initialScore'])
            scorer2['initialScore'].append(y['initialScore'])

            scorer1['mitosis'].append(x['mitosis']['overall'])
            scorer2['mitosis'].append(y['mitosis']['overall'])

            scorer1['lumen'].append(x['lumen']['overall'])
            scorer2['lumen'].append(y['lumen']['overall'])

            scorer1['nuclear'].append(round(x['nuclear']['overall']))
            scorer2['nuclear'].append(round(y['nuclear']['overall']))

            for v, w in zip(x['mitosis']['data'], y['mitosis']['data']):
                scorer1['mitosis'].append(v['score'])
                scorer2['mitosis'].append(w['score'])

            for v, w in zip(x['lumen']['data'], y['lumen']['data']):
                scorer1['lumen'].append(v['score'])
                scorer2['lumen'].append(w['score'])

            for v, w in zip(x['nuclear']['data'], y['nuclear']['data']):
                scorer1['nuclear'].append(v['score'])
                scorer2['nuclear'].append(w['score'])
        index = 0
        data = [[0, str(i + index), str(scorer1['histologicType'][i])] for i in range(len(scorer1['histologicType']))] + \
               [[1, str(i + index), str(scorer2['histologicType'][i])]
                for i in range(len(scorer2['histologicType']))]
        rating = agreement.AnnotationTask(data=data)
        histo_sim = rating.alpha()
        index += len(scorer1['histologicType'])
        data = [[0, str(i + index), str(scorer1['initialScore'][i])] for i in range(len(scorer1['initialScore']))] + \
               [[1, str(i + index), str(scorer2['initialScore'][i])]
                for i in range(len(scorer2['initialScore']))]
        rating = agreement.AnnotationTask(data=data)
        initial_sim = rating.alpha()
        index + len(scorer1['initialScore'])
        data = [[0, str(i + index), str(scorer1['mitosis'][i])] for i in range(len(scorer1['mitosis']))] + \
               [[1, str(i + index), str(scorer2['mitosis'][i])]
                for i in range(len(scorer2['mitosis']))]
        rating = agreement.AnnotationTask(data=data)
        mitosis_sim = rating.alpha()
        index + len(scorer1['mitosis'])
        data = [[0, str(i + index), str(scorer1['lumen'][i])] for i in range(len(scorer1['lumen']))] + \
               [[1, str(i + index), str(scorer2['lumen'][i])]
                for i in range(len(scorer2['lumen']))]
        rating = agreement.AnnotationTask(data=data)
        tubular_sim = rating.alpha()
        index + len(scorer1['lumen'])
        data = [[0, str(i + index), str(scorer1['nuclear'][i])] for i in range(len(scorer1['nuclear']))] + \
               [[1, str(i + index), str(scorer2['nuclear'][i])]
                for i in range(len(scorer2['nuclear']))]
        rating = agreement.AnnotationTask(data=data)
        nuclear_sim = rating.alpha()
        total_sim = (histo_sim + initial_sim + mitosis_sim +
                     tubular_sim + nuclear_sim) / 5
        user['users'] = val['users']
        user['similarity'] = {'histo_sim': histo_sim, 'initial_sim': initial_sim, 'mitosis_sim': mitosis_sim,
                              'tubular_sim': tubular_sim, 'nuclear_sim': nuclear_sim, 'total_sim': total_sim}
        results.append(user)
    if len(scores) < 3:
        return json_util.dumps({'results': results})
    else:
        scored_idx = set()
        for idx, val in enumerate(scores):
            if len(scored_idx) == 0:
                scored_idx = set(val['annotations'])
            else:
                scored_idx &= set(val['annotations'])

        scorers = []
        for idx, val in enumerate(scores):
            scorer1 = {'histologicType': [], 'initialScore': [],
                       'mitosis': [], 'lumen': [], 'nuclear': []}
            a = [annotations_scores[idx][x] for x in scored_idx]
            for x in a:
                scorer1['histologicType'].append(x['histologicType'])
                scorer1['initialScore'].append(x['initialScore'])
                scorer1['mitosis'].append(x['mitosis']['overall'])
                scorer1['lumen'].append(x['lumen']['overall'])
                scorer1['nuclear'].append(round(x['nuclear']['overall']))
                for v in x['mitosis']['data']:
                    scorer1['mitosis'].append(v['score'])
                for v in x['lumen']['data']:
                    scorer1['lumen'].append(v['score'])
                for v in x['nuclear']['data']:
                    scorer1['nuclear'].append(v['score'])
            scorers.append(scorer1)
        data_histo, data_initial, data_mitosis, data_tubular, data_nuclear = [], [], [], [], []
        for idx, s in enumerate(scorers):
            data_histo += [[idx, str(i), str(s['histologicType'][i])]
                           for i in range(len(s['histologicType']))]
            data_initial += [[idx, str(i), str(s['initialScore'][i])]
                             for i in range(len(s['initialScore']))]
            data_mitosis += [[idx, str(i), str(s['mitosis'][i])]
                             for i in range(len(s['mitosis']))]
            data_tubular += [[idx, str(i), str(s['lumen'][i])]
                             for i in range(len(s['lumen']))]
            data_nuclear += [[idx, str(i), str(s['nuclear'][i])]
                             for i in range(len(s['nuclear']))]

        rating = agreement.AnnotationTask(data=data_histo)
        histo_sim = rating.alpha()
        rating = agreement.AnnotationTask(data=data_initial)
        initial_sim = rating.alpha()
        rating = agreement.AnnotationTask(data=data_mitosis)
        mitosis_sim = rating.alpha()
        rating = agreement.AnnotationTask(data=data_tubular)
        tubular_sim = rating.alpha()
        rating = agreement.AnnotationTask(data=data_nuclear)
        nuclear_sim = rating.alpha()
        total_sim = (histo_sim + initial_sim + mitosis_sim +
                     tubular_sim + nuclear_sim) / 5
        total = [{'histo_sim': histo_sim, 'initial_sim': initial_sim, 'mitosis_sim': mitosis_sim,
                  'tubular_sim': tubular_sim, 'nuclear_sim': nuclear_sim, 'total_sim': total_sim}]
        return json_util.dumps({'results': results, 'total': total})


@app.route('/api/getScoresDetail', methods=['GET', 'POST'])
def get_scores_detail():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    req['selected_ids'].append(session['user_id'])

    scores = db_handler.get_scores(
        session['user']['last_dataset'], session['user']['last_annotation'])

    user_idx = -1
    annotations_scores, annotations_images = [], []
    scored_idx = set()
    users = []
    for idx, val in enumerate(scores):
        if str(val['_id']) == session['user_id']:
            user_idx = idx
            users.insert(0, val['users'][0]['user'][-1]['firstname'] +
                         ' ' + val['users'][0]['user'][-1]['lastname'])
        else:
            if str(val['_id']) in req['selected_ids']:
                users.append(val['users'][0]['user'][-1]['firstname'] +
                             ' ' + val['users'][0]['user'][-1]['lastname'])
        if str(val['_id']) in req['selected_ids']:
            annotations_scores.append(
                dict(zip(val['annotations'], [x[-1] for x in val['scores']])))
            annotations_images.append(
                dict(zip(val['annotations'], [x[-1] for x in val['images']])))
            if len(scored_idx) == 0:
                scored_idx = set(val['annotations'])
            else:
                scored_idx &= set(val['annotations'])
        else:
            annotations_scores.append(None)
            annotations_images.append(None)

    results = []
    if len(scored_idx) == 0:
        return json_util.dumps({'results': results})

    for idx, val in enumerate(scores):
        if not str(val['_id']) in req['selected_ids']:
            continue

        scores = [annotations_scores[idx][x] for x in scored_idx]
        images = [annotations_images[idx][x] for x in scored_idx]

        for x, y in zip(scores, images):
            image = dict()
            mitosis_score, mitosis_locs = [], []
            for v in x['mitosis']['data']:
                if 'score' in v:
                    mitosis_score.append(v['score'])
                    mitosis_locs.append({'x': v['x'], 'y': v['y']})

            tubular_score, tubular_locs = [], []
            for v in x['lumen']['data']:
                if 'score' in v:
                    tubular_score.append(v['score'])
                    tubular_locs.append({'x': v['x'], 'y': v['y']})

            nuclear_score = [v['score']
                             for v in x['nuclear']['data'] if 'score' in v]

            if not any(y['name'] == r['image_name'] for r in results):
                image['image_name'] = y['name']
                image['scores'] = {'histologicType': [x['histologicType']],
                                   'initialScore': [x['initialScore']],
                                   'mitosis': [{'overall': x['mitosis']['overall'],
                                                'score':mitosis_score}],
                                   'tubular': [{'overall': x['lumen']['overall'],
                                                'score':tubular_score}],
                                   'nuclear': [{'overall': round(x['nuclear']['overall']),
                                                'score':nuclear_score}]
                                   }
                image['locs'] = {'mitosis': mitosis_locs,
                                 'tubular': tubular_locs}
                results.append(image)
            else:
                image = next(
                    (item for item in results if item["image_name"] == y['name']))
                if user_idx == idx:
                    image['scores']['histologicType'].insert(
                        0, x['histologicType'])
                    image['scores']['initialScore'].insert(
                        0, x['initialScore'])
                    image['scores']['mitosis'].insert(0, {'overall': x['mitosis']['overall'],
                                                          'score': mitosis_score})
                    image['scores']['tubular'].insert(0, {'overall': x['lumen']['overall'],
                                                          'score': tubular_score})
                    image['scores']['nuclear'].insert(0, {'overall': round(x['nuclear']['overall']),
                                                          'score': nuclear_score})
                else:
                    image['scores']['histologicType'].append(
                        x['histologicType'])
                    image['scores']['initialScore'].append(x['initialScore'])
                    image['scores']['mitosis'].append({'overall': x['mitosis']['overall'],
                                                       'score': mitosis_score})
                    image['scores']['tubular'].append({'overall': x['lumen']['overall'],
                                                       'score': tubular_score})
                    image['scores']['nuclear'].append({'overall': round(x['nuclear']['overall']),
                                                       'score': nuclear_score})
    return json_util.dumps({'results': results, 'users': users})


@app.route('/api/addDataset', methods=['POST'])
def add_dataset():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    _id = db_handler.add_dataset(
        session['user_id'], req['name'], req['description'])

    os.makedirs(APP_ROOT + '/images/' + str(_id))

    db_handler.write_logging(
        'Dataset is created, ' + req['name'], request, session['user_id'], session['log_id'])
    return jsonify({'result': False}) if _id is None else jsonify({'result': True})


@app.route('/api/updateDataset', methods=['POST'])
def update_dataset():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    _id = db_handler.update_dataset(req['id'], req['name'], req['description'])
    db_handler.write_logging(
        'Dataset is updated, ' + req['id'], request, session['user_id'], session['log_id'])
    return jsonify({'result': False}) if _id is None else jsonify({'result': True})


@app.route('/api/updateLastDataset', methods=['POST'])
def update_last_dataset():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    _id = db_handler.update_last_dataset(
        session['user_id'], req['last_dataset'])
    # update session information
    session['user']['last_dataset'] = req['last_dataset']
    session['user']['last_annotation'] = 'None'
    db_handler.write_logging(
        'Dataset is chosen, ' + req['last_dataset'], request, session['user_id'], session['log_id'])
    return jsonify({'result': False}) if _id is None else jsonify({'result': True})


@app.route('/api/updateLastAnnotation', methods=['POST'])
def update_last_annotation():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    _id = db_handler.update_last_annotation(
        session['user_id'], req['last_annotation'])
    # update session information
    session['user']['last_annotation'] = req['last_annotation']
    db_handler.write_logging(
        'Annotation is chosen, ' + req['last_annotation'], request, session['user_id'], session['log_id'])
    return jsonify({'result': False}) if _id is None else jsonify({'result': True})


@app.route('/api/upload', methods=['POST'])
def upload():
    if not session.get('logged_in'):
        abort(401)

    files = dict(request.files)

    for f in files['files[]']:
        if f.filename == '':
            return jsonify({'result': False, 'error': 'No selected file!'})
        img_arr = np.fromstring(f.read(), np.uint8)
        filename = secure_filename(f.filename)

        res = ImageHandler.save_image(
            img_arr, filename, session['user']['last_dataset'])
        if res is not None:
            return jsonify({'result': False, 'error': res})

        db_handler.add_image(
            session['user']['last_dataset'], session['user_id'], filename)

        db_handler.write_logging(
            'Upload Image, ' + filename, request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/bin')
def bin():
    if not session.get('logged_in'):
        abort(401)
    images = db_handler.get_bin_images(session['user']['last_dataset'])
    return json_util.dumps({'images': images})


@app.route('/api/restore', methods=['POST'])
def restore():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    db_handler.remove_bin(req['id'])
    db_handler.write_logging(
        'Restored Image, ' + req['id'], request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/restoreAll', methods=['POST'])
def restoreAll():
    if not session.get('logged_in'):
        abort(401)

    db_handler.remove_bin_all(session['user']['last_dataset'])
    db_handler.write_logging('Restore All Images',
                             request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/moveToBin', methods=['POST'])
def move_to_bin():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    db_handler.add_bin(req['id'], session['user_id'])
    db_handler.write_logging(
        'Image Moved To Bin, ' + req['id'], request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/addAnnotation', methods=['POST'])
def add_annotation():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    db_handler.add_annotation(req['id'], session['user_id'], req['locs'])
    db_handler.write_logging(
        'Annotation Created, ' + req['id'], request, session['user_id'], session['log_id'])
    if int(req['train']):
        pos = session['model'].createPos(req['name'])
        neg = session['model'].createNeg(req['name'], len(pos))
        train_data = np.array(pos + neg)
        train_labels = np.array([0] * len(neg) + [1] * len(pos))
        session['model'].trainModel(train_data, train_labels)
        db_handler.write_logging(
            'Model Trained, ' + req['name'], request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/addScore', methods=['POST'])
def add_score():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    db_handler.add_score(req['id'], session['user_id'], req['scores'])
    db_handler.write_logging(
        'Score Created, ' + req['id'], request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/deleteScore', methods=['POST'])
def delete_score():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    db_handler.delete_score(req['annotation_id'], req['created_by'])
    db_handler.write_logging(
        'Score Deleted, ' + req['annotation_id'], request, session['user_id'], session['log_id'])
    return jsonify({'result': True})


@app.route('/api/getStatusAnnotation')
def get_status_annotation():
    if not session.get('logged_in'):
        abort(401)

    mitosis = non_mitosis = apoptosis = tumor = non_tumor = lumen = non_lumen = 0
    images = db_handler.get_annotation_images(
        session['user']['last_dataset'], session['user_id'])
    for image in images[0]:
        annotations = db_handler.get_annotation(
            image['_id'], session['user_id'])[-1]['annotations']
        mitosis += len(annotations['mitosis'])
        non_mitosis += len(annotations['non_mitosis'])
        apoptosis += len(annotations['apoptosis'])
        tumor += len(annotations['tumor'])
        non_tumor += len(annotations['non_tumor'])
        lumen += len(annotations['lumen'])
        non_lumen += len(annotations['non_lumen'])
    count = {'mitosis': mitosis, 'non_mitosis': non_mitosis, 'apoptosis': apoptosis,
             'tumor': tumor, 'non_tumor': non_tumor, 'lumen': lumen, 'non_lumen': non_lumen}
    return jsonify({'count': count, '#ofa': len(images[0]),
                    '#ofna': len(images[1])})


@app.route('/api/predictModel', methods=['POST'])
def predictModel():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    points = session['img_handler'].getModel(req['name'], req['new'])
    db_handler.write_logging(
        'Model Predicted, ' + req['name'], request, session['user_id'], session['log_id'])
    return jsonify({'result': True, 'points': points})


@app.route('/api/getAuthors', methods=['POST'])
def get_authors():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    if req['filter'] == '':
        authors, count = db_handler.get_authors(
            page=req['page'], limit=req['limit'])
    else:
        authors, count = db_handler.get_authors(
            page=req['page'], limit=req['limit'], filter=req['filter'], coauthor=req['coauthor'])
    return json_util.dumps({'result': True, 'authors': authors, 'count': count})


@app.route('/api/getNetwork', methods=['POST'])
def get_network():
    if not session.get('logged_in'):
        abort(401)

    req = request.get_json()
    articles = db_handler.get_articles(req['name'])

    G = nx.Graph()
    for article in articles:
        coauthor_list = []
        for a in article['authors']:
            coauthor_list.append(a['author'])
            author = db_handler.get_authors(a['author'])
            if len(author) == 0:
                G.add_node(a['author'], hindex=0)
            else:
                G.add_node(a['author'], hindex=int(author[0]['h_index']))

        for a in coauthor_list:
            for b in coauthor_list:
                if a == b:
                    continue
                if G.has_edge(a, b):
                    G[a][b]['weight'] += 1
                else:
                    G.add_edge(a, b, weight=1)

    data = json_graph.node_link_data(G)
    session['network'] = data
    return json_util.dumps({'result': True, 'network': data})


@app.route('/api/getCommunities')
def get_communities():
    if not session.get('logged_in'):
        abort(401)

    if not session.get('network'):
        json_util.dumps({'result': False})
    G = json_graph.node_link_graph(session['network'])
    communities_generator = community.girvan_newman(G)
    top_level_communities = next(communities_generator)
    next_level_communities = next(communities_generator)
    communities = sorted(map(sorted, next_level_communities))
    return json_util.dumps({'result': True, 'communities': communities})


@app.errorhandler(401)
def unauthorized(e):
    return render_template('index.html')


@app.errorhandler(403)
def forbidden_page(e):
    return render_template('index.html')


@app.errorhandler(404)
def page_not_found(e):
    return render_template('index.html')


@app.errorhandler(500)
def server_error_page(e):
    return render_template('index.html')


@app.before_request
def before_request():
    session.permanent = True


if __name__ == '__main__':
    if not os.path.exists(APP_ROOT + '/static/cache/'):
        print('creating cache images')
        os.makedirs(APP_ROOT + '/static/cache/')
        with app.app_context():
            images = db_handler.get_images()
            for image in images:
                ImageHandler.save_cache(
                    image['name'], str(image['dataset_id']))
    print('starting tornado!')
    HTTP_SERVER = HTTPServer(WSGIContainer(app))
    if TEST:
        HTTP_SERVER.listen(5050)
    else:
        HTTP_SERVER.listen(5000)
    IOLoop.instance().start()
