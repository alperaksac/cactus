import glob
import os

from flask import json

APP_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


class FileHandler(object):
    def __init__(self, username, image_names):
        if not os.path.exists(APP_ROOT + '/annotations'):
            os.makedirs(APP_ROOT + '/annotations')
        if not os.path.exists(APP_ROOT + '/scores'):
            os.makedirs(APP_ROOT + '/scores')
        if not os.path.exists(APP_ROOT + '/tmp/annotations'):
            os.makedirs(APP_ROOT + '/tmp/annotations')
        if not os.path.exists(APP_ROOT + '/tmp/scores'):
            os.makedirs(APP_ROOT + '/tmp/scores')

        self.file_names = [os.path.basename(x).split('_' + username + '.')[0] for x in glob.glob(APP_ROOT + '/scores/*_' + username + '.json')]
        self.file_names_unscored = list(set(image_names) - set(self.file_names))

    def statusAnnotation(self):
        files = glob.glob(APP_ROOT + '/annotations/*.json')
        mitosis = non_mitosis = apoptosis = tumor = non_tumor = lumen = non_lumen = 0
        for f in files:
            data = json.load(open(f))
            mitosis += data['mitosis']
            non_mitosis += data['non_mitosis']
            apoptosis += data['apoptosis']
            tumor += data['tumor']
            non_tumor += data['non_tumor']
            lumen += data['lumen']
            non_lumen += data['non_lumen']

        c = Count(mitosis, non_mitosis, apoptosis, tumor, non_tumor, lumen, non_lumen)
        return c.toJSON()

    def read(self, filename):
        return json.load(open(filename, 'r'))

    def write(self, data, filename):
        json.dump(data, open(filename, 'w'))


class Score(FileHandler):
    def __init__(self, loc, score, note, time):
        self.loc = loc
        self.score = score
        self.note = note
        self.time = time

    def toJSON(self):
        return {'loc': self.loc,
                'score': self.score,
                'note': self.note,
                'time': self.time}


class Count(FileHandler):
    def __init__(self, mitosis, non_mitosis, apoptosis, tumor, non_tumor, lumen, non_lumen):
        self.mitosis = mitosis
        self.non_mitosis = non_mitosis
        self.apoptosis = apoptosis
        self.tumor = tumor
        self.non_tumor = non_tumor
        self.lumen = lumen
        self.non_lumen = non_lumen

    def toJSON(self):
        return {'mitosis': self.mitosis,
                'non_mitosis': self.non_mitosis,
                'apoptosis': self.apoptosis,
                'tumor': self.tumor,
                'non_tumor': self.non_tumor,
                'lumen': self.lumen,
                'non_lumen': self.non_lumen}
