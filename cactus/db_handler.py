import re
from datetime import datetime, timedelta

from bson.objectid import ObjectId
from werkzeug.security import check_password_hash, generate_password_hash


class DatabaseHandler(object):

    def __init__(self, mongo):
        self.mongo = mongo

    def add_user(self, firstname, lastname, email, password, confirmed=0, role=2):
        users = self.mongo.db.users
        if confirmed:
            user_id = users.insert_one({'last_dataset': None, 'last_annotation': None, 'last_login': None, 'role': role,
                                        'user': [{'date_created': datetime.utcnow(),
                                                  'date_confirmed': datetime.utcnow(), 'confirmed': 1,
                                                  'firstname': firstname, 'lastname': lastname,
                                                  'email': email, 'password': generate_password_hash(password)}]})
        else:
            user_id = users.insert_one({'last_dataset': None, 'last_annotation': None, 'last_login': None, 'role': role,
                                        'user': [{'date_created': datetime.utcnow(),
                                                  'date_confirmed': None, 'confirmed': 0,
                                                  'firstname': firstname, 'lastname': lastname,
                                                  'email': email, 'password': generate_password_hash(password)}]})
        return user_id.inserted_id

    def update_user(self, user_id, firstname, lastname, email, password, confirmed=1):
        users = self.mongo.db.users
        if confirmed:
            user_id = users.update_one({'_id': ObjectId(user_id)},
                                       {'$push': {'user': {'date_created': datetime.utcnow(),
                                                           'date_confirmed': datetime.utcnow(), 'confirmed': 1,
                                                           'firstname': firstname, 'lastname': lastname,
                                                           'email': email, 'password': generate_password_hash(password)}}})
        else:
            user_id = users.update_one({'_id': ObjectId(user_id)},
                                       {'$push': {'user': {'date_created': datetime.utcnow(),
                                                           'date_confirmed': None, 'confirmed': 0,
                                                           'firstname': firstname, 'lastname': lastname,
                                                           'email': email, 'password': generate_password_hash(password)}}})
        return user_id.modified_count

    def update_confirmation(self, user_id, email):
        users = self.mongo.db.users
        user_id = users.update_one({'_id': ObjectId(user_id),
                                    'user.email': email, 'user.confirmed': 0},
                                   {'$set': {'user.$.date_confirmed': datetime.utcnow(),
                                             'user.$.confirmed': 1}})
        return user_id.modified_count

    def get_user(self, email):
        users = self.mongo.db.users
        # search in only last array of user, ignore other
        # user = list(users.aggregate([{'$project': {'user': {'$slice': ['$user', -1]}}},
        #                             {'$match': {'user.email': email}}]))
        user = list(users.find({'user.email': email}))
        return user[0] if len(user) > 0 else None

    def update_last_dataset(self, user_id, last_dataset):
        users = self.mongo.db.users
        user_id = users.update_one({'_id': ObjectId(user_id)},
                                   {'$set': {'last_dataset': ObjectId(last_dataset),
                                             'last_annotation': None}})
        return user_id.modified_count

    def update_last_annotation(self, user_id, last_annotation):
        users = self.mongo.db.users
        user_id = users.update_one({'_id': ObjectId(user_id)},
                                   {'$set': {'last_annotation': ObjectId(last_annotation)}})
        return user_id.modified_count

    def update_last_login(self, user_id):
        users = self.mongo.db.users
        user_id = users.update_one({'_id': ObjectId(user_id)},
                                   {'$set': {'last_login': datetime.utcnow()}})
        return user_id.modified_count

    def add_dataset(self, user_id, name, description):
        datasets = self.mongo.db.datasets
        dataset_id = datasets.insert_one({'created_by': ObjectId(user_id),
                                          'date_created': datetime.utcnow(),
                                          'name': name, 'description': description})
        return dataset_id.inserted_id

    def update_dataset(self, dataset_id, name, description):
        datasets = self.mongo.db.datasets
        datasets_id = datasets.update_one({'_id': ObjectId(dataset_id)},
                                          {'$set': {'name': name, 'description': description}})
        return datasets_id.modified_count

    def get_datasets(self):
        datasets = self.mongo.db.datasets
        return list(datasets.aggregate([{'$lookup': {'from': 'users', 'localField': 'created_by', 'foreignField': '_id', 'as': 'users'}},
                                        {'$lookup': {'from': 'images', 'localField': '_id', 'foreignField': 'dataset_id', 'as': 'images'}}]))

    def get_authors(self, name=None, page=1, limit=10, filter=None, coauthor=False):
        authors = self.mongo.db.authors
        if name is None:
            if filter is None:
                res = authors.find({})
                return list(res.skip(limit * (page - 1)).limit(limit)), res.count()
            else:
                # return list(authors.find({'_id': {"$gt": ObjectId(last_id)}}).limit(page_size)), authors.find({}).count()
                if coauthor:
                    res = authors.find({'$or': [{'name': {'$regex': filter, '$options': 'i'}}, {'h_index': {
                                       '$regex': filter, '$options': 'i'}}, {'coauthors': {'$regex': filter, '$options': 'i'}}]})
                else:
                    res = authors.find({'$or': [{'name': {'$regex': filter, '$options': 'i'}}, {
                                       'h_index': {'$regex': filter, '$options': 'i'}}]})
                return list(res.skip(limit * (page - 1)).limit(limit)), res.count()
        else:
            return list(authors.find({'name': name}))

    def get_articles(self, name=None):
        articles = self.mongo.db.articles
        if name is None:
            return list(articles.find({}))
        else:
            return list(articles.find({'authors.author': name}))

    def add_image(self, dataset_id, user_id, name):
        images = self.mongo.db.images
        image_id = images.insert_one({'dataset_id': ObjectId(dataset_id),
                                      'created_by': ObjectId(user_id),
                                      'date_created': datetime.utcnow(),
                                      'name': name})
        return image_id.inserted_id

    def get_images(self, dataset_id=None):
        images = self.mongo.db.images
        if dataset_id is None:
            return list(images.find({}))
        else:
            return list(images.find({'dataset_id': ObjectId(dataset_id)}))

    def get_bin_images(self, dataset_id):
        images = self.mongo.db.images
        return list(images.aggregate([{'$lookup': {'from': 'bins', 'localField': '_id', 'foreignField': 'image_id', 'as': 'bins'}},
                                      {'$lookup': {
                                          'from': 'users', 'localField': 'bins.created_by', 'foreignField': '_id', 'as': 'users'}},
                                      {'$match': {'dataset_id': ObjectId(dataset_id), 'bins': {'$ne': []}}}]))

    def get_annotation_images(self, dataset_id, user_id):
        images = self.mongo.db.images
        annotated = list(images.aggregate([{'$lookup': {'from': 'bins', 'localField': '_id',
                                                        'foreignField': 'image_id', 'as': 'bins'}},
                                           {'$lookup': {'from': 'annotations', 'localField': '_id',
                                                        'foreignField': 'image_id', 'as': 'annotations'}},
                                           {'$match': {'dataset_id': ObjectId(dataset_id), 'bins': {
                                               '$eq': []}, 'annotations.created_by': ObjectId(user_id)}},
                                           {'$project': {
                                               'annotations': {'$filter': {
                                                   'input': '$annotations',
                                                   'as': 'annotation',
                                                   'cond': {'$eq': ['$$annotation.created_by', ObjectId(user_id)]}
                                               }},
                                               'dataset_id': 1,
                                               'created_by': 1,
                                               'date_created': 1,
                                               'name': 1
                                           }}]))
        unannotated = list(images.aggregate([{'$lookup': {'from': 'bins', 'localField': '_id',
                                                          'foreignField': 'image_id', 'as': 'bins'}},
                                             {'$lookup': {'from': 'annotations', 'localField': '_id',
                                                          'foreignField': 'image_id', 'as': 'annotations'}},
                                             {'$match': {'dataset_id': ObjectId(dataset_id), 'bins': {
                                                 '$eq': []}, 'annotations.created_by': {'$ne': ObjectId(user_id)}}},
                                             {'$project': {
                                                 'annotations': {'$filter': {
                                                     'input': '$annotations',
                                                     'as': 'annotation',
                                                     'cond': {'$ne': ['$$annotation.created_by', ObjectId(user_id)]}
                                                 }},
                                                 'dataset_id': 1,
                                                 'created_by': 1,
                                                 'date_created': 1,
                                                 'name': 1
                                             }}]))
        return [annotated, unannotated]

    def get_scoring_images(self, dataset_id, annotate_user_id, user_id):
        images = self.mongo.db.images
        scored = list(images.aggregate([{'$lookup': {'from': 'bins', 'localField': '_id',
                                                     'foreignField': 'image_id', 'as': 'bins'}},
                                        {'$lookup': {'from': 'annotations', 'localField': '_id',
                                                     'foreignField': 'image_id', 'as': 'annotations'}},
                                        {'$match': {'dataset_id': ObjectId(dataset_id), 'bins': {'$eq': []},
                                                    'annotations.created_by': ObjectId(annotate_user_id)}},
                                        {'$project': {
                                            'annotations': {'$filter': {
                                                'input': '$annotations',
                                                'as': 'annotation',
                                                'cond': {'$eq': ['$$annotation.created_by', ObjectId(annotate_user_id)]}
                                            }},
                                            'dataset_id': 1,
                                            'created_by': 1,
                                            'date_created': 1,
                                            'name': 1,
                                            'scores': 1
                                        }},
                                        {'$lookup': {'from': 'scores', 'localField': 'annotations._id',
                                                     'foreignField': 'annotation_id', 'as': 'scores'}},
                                        {'$match': {
                                            'scores.created_by': ObjectId(user_id)}},
                                        {'$project': {
                                            'scores': {'$filter': {
                                                'input': '$scores',
                                                'as': 'score',
                                                'cond': {'$eq': ['$$score.created_by', ObjectId(user_id)]}
                                            }},
                                            'dataset_id': 1,
                                            'created_by': 1,
                                            'date_created': 1,
                                            'name': 1,
                                            'annotations': 1
                                        }},
                                        {'$addFields': {'scores': {
                                            '$slice': ['$scores', -1]}}},
                                        {'$match': {'$and': [{'scores.scores.lumen.overall': {'$ne': None}},
                                                             {'scores.scores.mitosis.overall': {
                                                                 '$ne': None}},
                                                             {'scores.scores.nuclear.overall': {
                                                                 '$ne': None}},
                                                             {'scores.scores.lumen.data.score': {
                                                                 '$ne': None}},
                                                             {'scores.scores.mitosis.data.score': {
                                                                 '$ne': None}},
                                                             {'scores.scores.nuclear.data.score': {'$ne': None}}]}
                                         }]))
        unfinished = list(images.aggregate([{'$lookup': {'from': 'bins', 'localField': '_id',
                                                         'foreignField': 'image_id', 'as': 'bins'}},
                                            {'$lookup': {'from': 'annotations', 'localField': '_id',
                                                         'foreignField': 'image_id', 'as': 'annotations'}},
                                            {'$match': {'dataset_id': ObjectId(dataset_id), 'bins': {'$eq': []},
                                                        'annotations.created_by': ObjectId(annotate_user_id)}},
                                            {'$project': {
                                                'annotations': {'$filter': {
                                                                'input': '$annotations',
                                                                'as': 'annotation',
                                                                'cond': {'$eq': ['$$annotation.created_by', ObjectId(annotate_user_id)]}
                                                                }},
                                                'dataset_id': 1,
                                                'created_by': 1,
                                                'date_created': 1,
                                                'name': 1,
                                                'scores': 1
                                            }},
                                            {'$lookup': {'from': 'scores', 'localField': 'annotations._id',
                                                         'foreignField': 'annotation_id', 'as': 'scores'}},
                                            {'$match': {
                                                'scores.created_by': ObjectId(user_id)}},
                                            {'$project': {
                                                'scores': {'$filter': {
                                                    'input': '$scores',
                                                    'as': 'score',
                                                    'cond': {'$eq': ['$$score.created_by', ObjectId(user_id)]}
                                                }},
                                                'dataset_id': 1,
                                                'created_by': 1,
                                                'date_created': 1,
                                                'name': 1,
                                                'annotations': 1
                                            }},
                                            {'$addFields': {'scores': {
                                                '$slice': ['$scores', -1]}}},
                                            {'$match': {'$or': [{'scores.scores.lumen.overall': None},
                                                                {'scores.scores.mitosis.overall': None},
                                                                {'scores.scores.nuclear.overall':  None},
                                                                {'scores.scores.lumen.data.score': None},
                                                                {'scores.scores.mitosis.data.score': None},
                                                                {'scores.scores.nuclear.data.score': None}]}
                                             }]))
        unscored = list(images.aggregate([{'$lookup': {'from': 'bins', 'localField': '_id',
                                                       'foreignField': 'image_id', 'as': 'bins'}},
                                          {'$lookup': {'from': 'annotations', 'localField': '_id',
                                                       'foreignField': 'image_id', 'as': 'annotations'}},
                                          {'$match': {'dataset_id': ObjectId(dataset_id), 'bins': {'$eq': []}, 'annotations.created_by': ObjectId(
                                              annotate_user_id)}},
                                          {'$project': {
                                              'annotations': {'$filter': {
                                                  'input': '$annotations',
                                                  'as': 'annotation',
                                                  'cond': {'$eq': ['$$annotation.created_by', ObjectId(annotate_user_id)]}
                                              }},
                                              'dataset_id': 1,
                                              'created_by': 1,
                                              'date_created': 1,
                                              'name': 1,
                                              'scores': 1
                                          }},
                                          {'$lookup': {'from': 'scores', 'localField': 'annotations._id',
                                                       'foreignField': 'annotation_id', 'as': 'scores'}},
                                          {'$match': {
                                              'scores.created_by': {'$ne': ObjectId(user_id)}}},
                                          {'$project': {
                                              'scores': {'$filter': {
                                                  'input': '$scores',
                                                  'as': 'score',
                                                  'cond': {'$ne': ['$$score.created_by', ObjectId(user_id)]}
                                              }},
                                              'dataset_id': 1,
                                              'created_by': 1,
                                              'date_created': 1,
                                              'name': 1,
                                              'annotations': 1
                                          }}]))
        return [scored, unscored, unfinished]

    def add_bin(self, image_id, user_id):
        bins = self.mongo.db.bins
        bins_id = bins.insert_one({'image_id': ObjectId(image_id),
                                   'created_by': ObjectId(user_id),
                                   'date_created': datetime.utcnow()})
        return bins_id.inserted_id

    def remove_bin(self, image_id):
        bins = self.mongo.db.bins
        bins_id = bins.delete_one({'image_id': ObjectId(image_id)})
        return bins_id.deleted_count

    def remove_bin_all(self, dataset_id):
        images = self.get_bin_images(dataset_id)
        bins = self.mongo.db.bins
        for image in images:
            bins_id = bins.delete_many({'image_id': image['_id']})

    def add_annotation(self, image_id, user_id, locs):
        annotations = self.mongo.db.annotations
        annotations_id = annotations.insert_one({'image_id': ObjectId(image_id),
                                                 'created_by': ObjectId(user_id),
                                                 'date_created': datetime.utcnow(),
                                                 'annotations': locs})
        return annotations_id.inserted_id

    def get_annotation(self, image_id, user_id):
        annotations = self.mongo.db.annotations
        return list(annotations.find({'image_id': ObjectId(image_id), 'created_by': ObjectId(user_id)}))

    def get_annotations(self, dataset_id):
        annotations = self.mongo.db.annotations
        return list(annotations.aggregate([{'$lookup': {'from': 'users', 'localField': 'created_by', 'foreignField': '_id', 'as': 'users'}},
                                           {'$lookup': {
                                               'from': 'images', 'localField': 'image_id', 'foreignField': '_id', 'as': 'images'}},
                                           {'$match': {
                                               'images.dataset_id': ObjectId(dataset_id)}},
                                           {'$group': {'_id': {"image_id": '$image_id', "created_by": '$created_by'}, 'created_by': {'$first': '$created_by'}, 'users': {'$first': '$users'},
                                                       'annotations': {'$push': '$annotations'}}},
                                           {'$group': {'_id': '$created_by', 'users': {'$first': '$users'}, 'annotations': {'$push': '$annotations'}}}]))

    def add_score(self, annotation_id, user_id, locs):
        scores = self.mongo.db.scores
        scores_id = scores.insert_one({'annotation_id': ObjectId(annotation_id),
                                       'created_by': ObjectId(user_id),
                                       'date_created': datetime.utcnow(),
                                       'scores': locs})
        return scores_id.inserted_id

    def delete_score(self, annotation_id, user_id):
        scores = self.mongo.db.scores
        scores_id = scores.delete_many(
            {'annotation_id': ObjectId(annotation_id), 'created_by': ObjectId(user_id)})
        return scores_id.deleted_count

    def get_scores(self, dataset_id, annotate_user_id):
        scores = self.mongo.db.scores
        return list(scores.aggregate([
            {'$lookup': {'from': 'users', 'localField': 'created_by',
                         'foreignField': '_id', 'as': 'users'}},
            {'$lookup': {'from': 'annotations', 'localField': 'annotation_id',
                         'foreignField': '_id', 'as': 'annotations'}},
            {'$match': {'annotations.created_by': ObjectId(annotate_user_id)}},
            {'$lookup': {'from': 'images', 'localField': 'annotations.image_id',
                         'foreignField': '_id', 'as': 'images'}},
            {'$match': {'images.dataset_id': ObjectId(dataset_id)}},
            {'$group': {'_id': {"annotation_id": '$annotation_id', "created_by": '$created_by'}, 'images': {'$first': '$images'},
                        'users': {'$first': '$users'}, 'scores': {'$push': '$scores'}}},
            {'$group': {'_id': '$_id.created_by', 'users': {
                '$first': '$users'}, 'images': {'$push': '$images'},  'annotations': {'$push': '$_id.annotation_id'}, 'scores': {'$push': '$scores'}}}
        ]))

    def write_logging(self, event, request, user_id=None, log_id=None):
        logs = self.mongo.db.logs
        host = request.headers.get('X-Forwarded-For')
        referer = request.headers.get('Referer')
        user_agent = request.headers.get('User-Agent')
        if log_id is None:
            if user_id is None:
                log_id = logs.insert_one({'log': [{'date_created': datetime.utcnow(),
                                                   'user_id': None, 'event': event,
                                                   'host': host, 'referer': referer,
                                                   'user_agent': user_agent}]})
                return log_id.inserted_id
            else:
                log_id = logs.insert_one({'log': [{'date_created': datetime.utcnow(),
                                                   'user_id': ObjectId(user_id), 'event': event,
                                                   'host': host, 'referer': referer,
                                                   'user_agent': user_agent}]})
                return log_id.inserted_id
        else:
            log_id = logs.update_one({'_id': ObjectId(log_id)},
                                     {'$push': {'log': {'date_created': datetime.utcnow(),
                                                        'user_id': ObjectId(user_id), 'event': event,
                                                        'host': host, 'referer': referer,
                                                        'user_agent': user_agent}}})
            return log_id.modified_count


class User(object):
    def __init__(self, email, firstname, lastname, role, last_dataset, last_annotation, last_login):
        self.email = email
        self.firstname = firstname
        self.lastname = lastname
        self.role = role
        self.last_dataset = last_dataset
        self.last_annotation = last_annotation
        self.last_login = last_login

    def toJSON(self):
        return {'email': self.email,
                'firstname': self.firstname,
                'lastname': self.lastname,
                'role': self.role,
                'last_dataset': self.last_dataset,
                'last_annotation': self.last_annotation,
                'last_login': self.last_login}
