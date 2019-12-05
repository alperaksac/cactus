'use strict';

var cancerControllers = angular.module('cancerApp');

cancerControllers.config(function ($mdThemingProvider) {
    $mdThemingProvider.theme('dark-pink').primaryPalette('pink').dark();
});

cancerControllers.controller('DialogController', function ($scope, $mdDialog) {
    $scope.showAlert = function (msg) {
        $mdDialog.show(
            $mdDialog.alert()
            .parent(angular.element(document.querySelector('#dialogContainer')))
            .clickOutsideToClose(true)
            .textContent(msg)
            .ariaLabel('Dialog')
            .ok('OKAY!')
        );
    };
});

cancerControllers.controller('LoginController', function ($scope, $state, $http, $mdDialog) {

    // Function to log in user
    $scope.login = function () {
        // Create error
        $scope.loginForm.loginServerErrors = {};

        var user = $scope.user;

        // Send credentials to login endpoint
        $http.post('/api/login', $scope.user).then(function successCallback(response) {
            if (response.data['result']) {
                if (response.data['confirmed']) {
                    // Redirect to home dashboard upon success
                    if (response.data['last_dataset'] == 'None') {
                        $state.go('dashboard.datasets');
                    } else {
                        $state.go('dashboard');
                    }
                } else {
                    var confirm = $mdDialog.confirm()
                        .title("Didn't get the email?")
                        .textContent('You have not confirmed your account. Please check your inbox (and your spam folder) - you should have received an email with a confirmation link.')
                        .ok('Resend')
                        .cancel('Cancel');
                    $mdDialog.show(confirm).then(function () {
                        $http.post('/api/resend', user).then(function successCallback(response) {
                            if (response.data['result']) {
                                // Redirect to home dashboard upon success
                                $mdToast.show($mdToast.simple()
                                    .textContent('A new confirmation email has been sent.'));
                                $mdDialog.cancel();
                            }
                        });
                    }, function () {
                        $mdDialog.cancel();
                    });
                }
            } else {
                $scope.response = 'Oops! That email and/or password combination was incorrect.';
                $scope.loginForm.loginServerErrors.loginFailed = true;
            }
            // Clear out form
            $scope.user = {};
        }, function errorCallback(response) {
            $scope.response = response.status + ' ' + response.statusText;
            $scope.loginForm.loginServerErrors.loginFailed = true;
            // Clear out form
            $scope.user = {};
        });
    };

    WebFont.load({
        google: {
            families: ['Shojumaru']
        }
    });
});

cancerControllers.controller('LogoutController', function ($scope, $state, $http) {

    $scope.logout = function () {
        $http({
            url: "/api/logout",
            method: "POST"
        }).then(function successCallback(response) {
            if (response.data['result']) {
                $state.go('login');
            }
        });
    };
});

cancerControllers.controller('SignupController', function ($scope, $state, $http, $mdToast) {

    // Function to sign up user
    $scope.signup = function () {
        // Create error
        $scope.signupForm.signupServerErrors = {};

        // Send credentials to signup endpoint
        $http.post('/api/signup', $scope.user).then(function successCallback(response) {
            if (response.data['result']) {
                // Redirect to login upon success
                $mdToast.show($mdToast.simple()
                    .textContent('A confirmation email has been sent.'));
                $state.go('login')
            } else {
                $scope.response = 'Oops! That email is already being used.';
                $scope.signupForm.signupServerErrors.signupFailed = true;
                $mdToast.show($mdToast.simple()
                    .textContent('Signup is unsuccessful!'));
                // Clear out form
                $scope.user.email2 = '';
                $scope.user.password = '';
            }
        }, function errorCallback(response) {
            $scope.response = response.status + ' ' + response.statusText;
            $scope.signupForm.signupServerErrors.signupFailed = true;

            $mdToast.show($mdToast.simple()
                .textContent('Signup is unsuccessful!'));
            // Clear out form
            $scope.user = {};
        });
    };

    $scope.cancel = function () {
        $state.go('login');
    };
});

cancerControllers.controller('ResetController', function ($scope, $state, $http, $mdToast, $mdDialog) {

    $scope.email = '';
    $scope.showDialog = function (email) {
        $scope.email = email;
        $mdDialog.show({
            contentElement: '#myDialog',
            parent: angular.element(document.body),
            clickOutsideToClose: true
        })
    };

    // Function to search user's account
    $scope.forgot = function () {
        // Create error
        $scope.resetForm.resetServerErrors = {};
        // Send credentials to reset endpoint
        $http.post('/api/forgotPassword', $scope.user).then(function successCallback(response) {
            if (response.data['result']) {
                // Redirect to login upon success
                $mdToast.show($mdToast.simple()
                    .textContent('A password reset email has been sent.'));
                $state.go('login')
            } else {
                $scope.response = 'Oops! That email address is not available.';
                $scope.resetForm.resetServerErrors.signupFailed = true;
                // Clear out form
                $scope.user = {};
            }
        });
    };

    // Function to reset user's password
    $scope.reset = function () {
        $scope.user.email = $scope.email;
        // Send credentials to reset endpoint
        $http.post('/api/resetPassword', $scope.user).then(function successCallback(response) {
            if (response.data['result']) {
                $mdDialog.cancel();
                $mdToast.show($mdToast.simple()
                    .textContent('Your password has been reset successfully!'));
            } else {
                $mdToast.show($mdToast.simple()
                    .textContent('Password reset is unsuccessful!'));
                // Clear out form
                $scope.user = {};
            }
        });
    };

    $scope.cancel = function () {
        $state.go('login');
    };

    $scope.close = function () {
        $mdDialog.cancel();
    };
});

cancerControllers.controller('ConfirmController', function ($scope, $state, $http, $mdToast) {
    //'You have confirmed your account. Thanks!'
    // Function to sign up user
    $scope.signup = function () {
        // Create error
        $scope.signupForm.signupServerErrors = {};

        // Send credentials to login endpoint
        $http.post('/api/signup', $scope.user).then(function successCallback(response) {
            if (response.data['result']) {
                // Redirect to login upon success
                $mdToast.show($mdToast.simple()
                    .textContent('Signup is successful!'));
                $state.go('login')
            } else {
                $mdToast.show($mdToast.simple()
                    .textContent('Signup is unsuccessful!'));
                // Clear out form
                $scope.user.password = '';
            }
        }, function errorCallback(response) {
            $scope.response = response.status + ' ' + response.statusText;
            $scope.signupForm.signupServerErrors.signupFailed = true;

            $mdToast.show($mdToast.simple()
                .textContent('Signup is unsuccessful!'));
            // Clear out form
            $scope.user = {};
        });
    };

    // Function to check that email is used or not
    $scope.check = function () {
        if ($scope.user.email === undefined)
            return;

        $scope.signupForm.signupServerErrors = {};

        // Send credentials to login endpoint
        $http.post('/api/checkEmail', $scope.user).then(function successCallback(response) {
            if (!response.data['result']) {
                $scope.signupForm.signupServerErrors.signupFailed = false;
            } else {
                $scope.response = 'Oops! That email is already being used.';
                $scope.signupForm.signupServerErrors.signupFailed = true;
            }
        });
    }

    $scope.cancel = function () {
        $state.go('login');
    };
});

cancerControllers.controller('DashboardController', function ($scope, $state, $rootScope, $http, $mdSidenav) {
    $scope.dashboard = function () {
        $rootScope.selectedDataset = $rootScope.selectedAnnotation = null
        $http.get('/api/getDatasets')
            .then(function successCallback(response) {
                $rootScope.datasets = response.data['datasets'];
                $http.get('/api/getAnnotations')
                    .then(function successCallback(response) {
                        $rootScope.annotations = response.data['annotations'];
                        $http.get('/api/getUser')
                            .then(function successCallback(response) {
                                $rootScope.username = titleCase(response.data['user']['firstname']) + ' ' + titleCase(response.data['user']['lastname']);
                                for (var i = 0; i < $rootScope.datasets.length; i++) {
                                    if ($rootScope.datasets[i]._id.$oid == response.data['user']['last_dataset']) {
                                        $rootScope.selectedDataset = response.data['user']['last_dataset'];
                                        $rootScope.selectedDatasetName = $rootScope.datasets[i].name;
                                    }
                                }
                                for (var i = 0; i < $rootScope.annotations.length; i++) {
                                    if ($rootScope.annotations[i]._id.$oid == response.data['user']['last_annotation']) {
                                        $rootScope.selectedAnnotation = response.data['user']['last_annotation'];
                                        var user = $rootScope.annotations[i].users[0].user.slice(-1)[0];
                                        $rootScope.selectedAnnotationCreatedBy = titleCase(user['firstname']) + ' ' + titleCase(user['lastname']);
                                    }
                                }
                                $scope.lastLogin = new Date(response.data['user']['last_login']);
                                $rootScope.role = response.data['user']['role'];
                                if ($state.current.name == "dashboard") {
                                    if ($rootScope.role < 3) {
                                        $rootScope.selectedIndex = 'Annotation';
                                        $state.go('dashboard.annotation');
                                    } else {
                                        $rootScope.selectedIndex = 'Grading';
                                        $state.go('dashboard.grading')
                                    }
                                } else {
                                    $rootScope.selectedIndex = titleCase($state.current.name.split('.')[1]);
                                }
                            });
                    });
            });
    };

    $scope.navSelect = function (title) {
        $rootScope.selectedIndex = title;
    };

    $scope.toggleMenu = function () {
        $mdSidenav('left').toggle();
    };

    function titleCase(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
});

cancerControllers.controller('HomeController', function ($scope, $state, $rootScope, $http, $mdSidenav, $mdToast, $mdDialog, $mdBottomSheet) {

    $scope.isOpen = false;
    $scope.deleteMode = false;

    $scope.annotationImages = function () {
        $http.get('/api/getAnnotationImages')
            .then(function successCallback(response) {
                if (response.data['result']) {
                    $scope.images_unannotated = response.data['images_unannotated'];
                    $scope.images_annotated = response.data['images_annotated'];
                } else
                    $state.go('dashboard.datasets')
            });
    };

    $scope.scoringImages = function () {
        $http.get('/api/getScoringImages')
            .then(function successCallback(response) {
                if (response.data['result']) {
                    $scope.images_unscored = response.data['images_unscored'];
                    $scope.images_scored = response.data['images_scored'];
                    $scope.images_unfinished = response.data['images_unfinished'];
                } else
                    $state.go('dashboard.annotations')
            });
    };

    $scope.upload = function (ev) {
        var dataset;
        var is_exist = false;
        for (var i = 0; i < $rootScope.datasets.length; i++) {
            if ($rootScope.datasets[i]._id.$oid == $rootScope.selectedDataset) {
                is_exist = true;
                break;
            }
        }
        if (is_exist) {
            $mdDialog.show({
                controller: 'HomeController',
                templateUrl: '../static/partials/upload.html',
                parent: angular.element(document.body),
                targetEvent: ev,
                clickOutsideToClose: true,
                onRemoving: reloadPage
            });
        } else {
            var confirm = $mdDialog.confirm()
                .title('Please Select a Dataset to Upload!')
                .textContent('There is no any selected dataset for uploading. You can create a new one (click Create) or ' +
                    'select from created ones (click Select and select it from the toolbar).')
                .targetEvent(ev)
                .ok('Create')
                .cancel('Select');

            $mdDialog.show(confirm).then(function () {
                $rootScope.selectedIndex = 'Datasets';
                $state.go('dashboard.datasets');
            });
        }
    };

    $scope.isLoading = false;
    $scope.uploadImages = function () {

        if ($scope.files.length < 1)
            return;

        $scope.isLoading = true;
        var formData = new FormData();

        angular.forEach($scope.files, function (obj) {
            if (!obj.isRemote) {
                formData.append('files[]', obj.lfFile);
            }
        });
        $http.post('/api/upload', formData, {
            transformRequest: angular.identity,
            headers: {
                'Content-Type': undefined
            }
        }).then(function (response) {
            if (response.data['result']) {
                $scope.lfApi.removeAll();
                $scope.isLoading = false;
                $mdToast.show($mdToast.simple().textContent('Uploaded!'));
            } else {
                console.log(response.data['error'])
                $state.go('login')
            }
        });
    };

    function reloadPage() {
        $state.reload();
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.showCharts = function () {
        $mdBottomSheet.show({
            templateUrl: '../static/partials/charts.html',
            controller: 'ChartController'
        });
    };

    $scope.delete = function () {
        $scope.deleteMode = !$scope.deleteMode;

        if ($scope.deleteMode)
            $mdToast.show($mdToast.simple().textContent('Delete Mode is activated!').parent(document.getElementById("toast-container")));
        else
            $mdToast.show($mdToast.simple().textContent('Delete Mode is deactivated!').parent(document.getElementById("toast-container")));
    };

    $scope.deleteImage = function (idx, masked) {

        $scope.deleteMode = false;
        var removed;
        if (masked)
            removed = $scope.images_annotated.splice(idx, 1);
        else
            removed = $scope.images_unannotated.splice(idx, 1);

        // var toast = $mdToast.simple()
        //     .textContent('Moved to Bin')
        //     .action('UNDO')
        //     .highlightAction(true);

        // $mdToast.show(toast).then(function (response) {
        //     if (response == 'ok') {
        //         if (masked)
        //             $scope.images_annotated.push(removed[0]);
        //         else
        //             $scope.images_unannotated.push(removed[0]);
        //         $scope.deleteMode = true;
        //     } else {
        var data = {
            "id": removed[0]._id.$oid
        };

        $http.post('/api/moveToBin', data).then(function (response) {
            if (response.data['result']) {
                $scope.deleteMode = true;
            } else {
                console.log(response.data)
            }
        }, function (err) {
            // do something
        });
        //     }
        // });
    };

    $scope.deleteScore = function (idx, scoredDone) {

        $scope.deleteMode = false;
        var removed;
        if (scoredDone)
            removed = $scope.images_scored.splice(idx, 1);
        else
            removed = $scope.images_unfinished.splice(idx, 1);
        $scope.images_unscored.push(removed[0]);

        var data = {
            "annotation_id": removed[0]['scores'].slice(-1)[0].annotation_id.$oid,
            "created_by": removed[0]['scores'].slice(-1)[0].created_by.$oid
        };

        $http.post('/api/deleteScore', data).then(function (response) {
            if (response.data['result']) {
                $scope.deleteMode = true;
            } else {
                console.log(response.data)
            }
        }, function (err) {
            // do something
        });
    };

    $scope.annotate = function (image, masked) {
        $rootScope.selected = image;
        $rootScope.masked = masked;
        $rootScope.versions = 0;
        $rootScope.selectedIndex = "Annotate";

        if (!masked) {
            $state.go('editor');
        } else {
            var arr = [];
            $rootScope.versions = image['annotations'];
            var data = $rootScope.versions.slice(-1)[0]['annotations']
            arr.push(data['mitosis']);
            arr.push(data['non_mitosis']);
            arr.push(data['apoptosis']);
            arr.push(data['tumor']);
            arr.push(data['non_tumor']);
            arr.push(data['lumen']);
            arr.push(data['non_lumen']);
            $rootScope.points = arr;
            $state.go("editor");
        }
    };

    $scope.grading = function (image, scored) {
        $rootScope.compareScores = undefined;
        $rootScope.selected = image;
        $rootScope.scored = scored;
        $rootScope.selectedIndex = "Scoring";

        var arr = [];
        var data = image['annotations'].slice(-1)[0]['annotations'];
        arr.push(data['mitosis']);
        arr.push(data['non_mitosis']);
        arr.push(data['apoptosis']);
        arr.push(data['tumor']);
        arr.push(data['non_tumor']);
        arr.push(data['lumen']);
        arr.push(data['non_lumen']);
        $rootScope.points = arr;
        if (scored == 1) {
            $rootScope.scores = image['scores'].slice(-1)[0]['scores'];
            $rootScope.scoredDone = false;
        } else if (scored == 2) {
            $rootScope.scores = image['scores'].slice(-1)[0]['scores'];
            $rootScope.scoredDone = true;
        } else
            $rootScope.scoredDone = false;
        $state.go("scoring");
    };

    function titleCase(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    $scope.seeResults = function () {
        $state.go('dashboard.results');
    };
});

cancerControllers.controller('ChartController', function ($http) {
    google.charts.load("current", {
        packages: ["corechart"]
    });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        $http.get('/api/getStatusAnnotation')
            .then(function successCallback(response) {
                var countCells = response.data['count'];
                var options = {
                    'backgroundColor': 'transparent',
                    is3D: true
                };
                var annotation = google.visualization.arrayToDataTable([
                    ['Overall', 'Counts'],
                    ['Annotated', response.data['#ofa']],
                    ['Not Annotated', response.data['#ofna']]
                ]);
                var dataMitosis = google.visualization.arrayToDataTable([
                    ['Nuclei Types', 'Counts'],
                    ['Mitosis', countCells['mitosis']],
                    ['Non-Mitosis', countCells['non_mitosis']],
                    ['Apoptosis', countCells['apoptosis']]
                ]);
                var dataTumor = google.visualization.arrayToDataTable([
                    ['Nuclei Types', 'Counts'],
                    ['Tumor', countCells['tumor']],
                    ['Non-Tumor', countCells['non_tumor']]
                ]);
                var dataLumen = google.visualization.arrayToDataTable([
                    ['Nuclei Types', 'Counts'],
                    ['Lumen', countCells['lumen']],
                    ['Non-Lumen', countCells['non_lumen']]
                ]);
                var chart = new google.visualization.PieChart(document.getElementById('annotationChart'));
                chart.draw(annotation, options);
                var chart = new google.visualization.PieChart(document.getElementById('mitosisChart'));
                chart.draw(dataMitosis, options);
                var chart = new google.visualization.PieChart(document.getElementById('tumorChart'));
                chart.draw(dataTumor, options);
                var chart = new google.visualization.PieChart(document.getElementById('lumenChart'));
                chart.draw(dataLumen, options);
            });
    }

    window.addEventListener('resize', drawChart);
});

cancerControllers.controller('BinController', function ($scope, $http, $state, $mdDialog) {

    $scope.isOpen = false;

    $http.get('/api/bin')
        .then(function successCallback(response) {
            $scope.images = response.data['images'];
        });

    $scope.restore = function (image) {
        var files = {
            "id": image._id.$oid
        };

        $http.post('/api/restore', files).then(function (response) {
            if (response.data['result']) {
                $state.reload();
            } else {
                console.log(response.data)
            }
        }, function (err) {
            // do something
        });
    };

    $scope.restoreAll = function (ev) {
        if ($scope.images.length == 0)
            return;

        var confirm = $mdDialog.confirm()
            .title('Restore ALL items in the bin?')
            .textContent('Do you want to proceed?')
            .targetEvent(ev)
            .ok('RESTORE')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            $http.post('/api/restoreAll').then(function (response) {
                if (response.data['result']) {
                    $state.reload();
                } else {
                    console.log(response.data)
                }
            }, function (err) {
                // do something
            });
        });
    };
});

cancerControllers.controller('DatasetController', function ($scope, $rootScope, $http, $state, $mdDialog) {

    var bookmark;
    $scope.selected = [];

    $scope.query = {
        filter: '',
        limit: 10,
        page: 1
    };

    $scope.submitDataset = function () {
        $scope.datasetForm.$setSubmitted();
        if ($scope.datasetForm.$valid) {
            if ($rootScope.selected._id == null) {
                $http.post('/api/addDataset', $rootScope.selected).then(function successCallback(response) {
                    if (response.data['result']) {
                        $mdDialog.cancel();
                        $state.reload();
                    }
                });
            } else {
                var data = {
                    'id': $rootScope.selected._id.$oid,
                    'name': $rootScope.selected.name,
                    'description': $rootScope.selected.description
                }
                $http.post('/api/updateDataset', data).then(function successCallback(response) {
                    if (response.data['result']) {
                        $mdDialog.cancel();
                        $state.reload();
                    }
                });
            }
        }
    };

    $scope.datasetDialog = function (event) {
        $rootScope.selected = $scope.selected[0];
        $mdDialog.show({
            clickOutsideToClose: true,
            controller: 'DatasetController',
            focusOnOpen: false,
            targetEvent: event,
            templateUrl: 'static/partials/dataset/dataset_dialog.html'
        });
    };

    $scope.removeFilter = function () {
        $scope.filter.show = false;
        $scope.query.filter = '';

        if ($scope.filterForm.$dirty) {
            $scope.filterForm.$setPristine();
        }
    };

    $scope.$watch('query.filter', function (newValue, oldValue) {
        if (!oldValue) {
            bookmark = $scope.query.page;
        }

        if (newValue !== oldValue) {
            $scope.query.page = 1;
        }

        if (!newValue) {
            $scope.query.page = bookmark;
        }
    });

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.updateSelectedDataset = function (dataset) {
        var data = {
            'last_dataset': dataset._id.$oid
        }
        $http.post('/api/updateLastDataset', data).then(function (response) {
            if (response.data['result']) {
                $state.go('dashboard', {}, {
                    'reload': 'dashboard'
                });
            }
        });
    };
});

cancerControllers.controller('AuthorController', function ($scope, $rootScope, $http, $state, $q) {

    var bookmark;

    $scope.$watchGroup(['query.limit', 'query.page', 'query.coauthor'], function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.load(0);
        }
    });

    $scope.load = function (init) {

        if ($scope.deferred)
            $scope.deferred.resolve();

        if (init && $rootScope.authors !== undefined) {
            return;
        } else {
            if ($rootScope.authors === undefined) {
                $rootScope.query = {
                    filter: '',
                    limit: 10,
                    page: 1,
                    last_id: '',
                    coauthor: false
                };
            }
            $scope.deferred = $q.defer();
            $scope.promise = $scope.deferred.promise;
            $http.post('/api/getAuthors', $rootScope.query).then(function (response) {
                if (response.data['result']) {
                    $rootScope.authors = response.data['authors'];
                    for (var i = 0, len = $rootScope.authors.length; i < len; i++)
                        $rootScope.authors[i].mesh_headings_freq = $rootScope.authors[i].mesh_headings.slice(0, 5)
                    $rootScope.count = response.data['count'];
                    $rootScope.query['last_id'] = response.data['authors'].slice(-1)[0]._id.$oid
                }
                $scope.deferred.resolve();
            });
        }
    };

    $scope.showNetwork = function (author) {
        var data = {
            'name': author.name
        }
        $http.post('/api/getNetwork', data).then(function (response) {
            if (response.data['result']) {
                $rootScope.network = response.data['network'];
                $rootScope.mesh_headings = author.mesh_headings;
                $rootScope.keywords = author.keywords;
                $state.go('network');
            }
        });
    };

    $scope.removeFilter = function () {
        $scope.filter.show = false;
        $rootScope.query.filter = '';
        $scope.load(0)
        if ($scope.filterForm.$dirty) {
            $scope.filterForm.$setPristine();
        }
    };

    $scope.$watch('query.filter', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $rootScope.query.page = 1;
        }
    });
});

cancerControllers.controller('CompareScoreController', function ($scope, $rootScope, $http, $state, $mdDialog) {

    var bookmark;
    $scope.selected = [];

    $scope.query = {
        filter: '',
        limit: 10,
        page: 1
    };

    $scope.init = function () {
        $http.get('/api/getScores')
            .then(function successCallback(response) {
                $rootScope.scoringResults = response.data['results'];
                $rootScope.totalScoringResults = response.data['total'];
            })
    }

    $scope.removeFilter = function () {
        $scope.filter.show = false;
        $scope.query.filter = '';

        if ($scope.filterForm.$dirty) {
            $scope.filterForm.$setPristine();
        }
    };

    $scope.$watch('query.filter', function (newValue, oldValue) {
        if (!oldValue) {
            bookmark = $scope.query.page;
        }

        if (newValue !== oldValue) {
            $scope.query.page = 1;
        }

        if (!newValue) {
            $scope.query.page = bookmark;
        }
    });

    $scope.seeDetails = function () {
        var data = {
            'selected_ids': $scope.selected
        }
        $http.post('/api/getScoresDetail', data).then(function (response) {
            if (response.data['results']) {
                $rootScope.scoresDetail = response.data['results']
                $rootScope.users = response.data['users']
                $state.go('dashboard.compare');
            } else {

            }
        });
    };

    $scope.compare = function (selected) {
        $rootScope.compareScores = selected
        $state.go('scoring');
    };

    $scope.isSame = function (arr) {
        if (arr[0].overall != undefined) {
            var val = arr[0].overall
            for (var i = 1; i < arr.length; i++) {
                if (val != arr[i].overall)
                    return false
            }
            return true
        } else
            return new Set(arr).size == 1;
    }

    $scope.back = function (nav) {
        if (nav == 'results') {
            $state.go('dashboard.results');
        } else {
            $state.go('dashboard.grading');
        }
    };
});

cancerControllers.controller('NetworkController', function ($scope, $rootScope, $http, $state) {

    if ($rootScope.network === undefined) {
        $state.go('dashboard.authors');
        return;
    };

    var graph, width, height, svg, color, simulation, link, node;

    $scope.back = function () {
        $state.go("dashboard.authors");
    };

    $scope.init = function () {
        graph = $rootScope.network;
        width = window.innerWidth;
        height = window.innerHeight;

        var linkedByIndex = {};

        graph.links.forEach(function (d) {
            linkedByIndex[d.source + "," + d.target] = 1;
            linkedByIndex[d.target + "," + d.source] = 1;
        });

        d3.select("svg").remove();
        svg = d3.select('.svg-container').append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr('viewBox', '0 0 ' + Math.min(width, height) + ' ' + Math.min(width, height))
            .attr('preserveAspectRatio', 'xMinYMin');

        color = d3.scaleOrdinal(d3.schemeCategory20);

        simulation = d3.forceSimulation()
            .force("link", d3.forceLink().id(function (d) {
                return d.id;
            }).distance(150))
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("center", d3.forceCenter(width / 2, height / 2));


        link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .style("stroke", "#999")
            .style("stroke-opacity", "0.6")
            .attr("stroke-width", function (d) {
                return d.weight;
            });

        node = svg.selectAll(".nodes")
            .data(graph.nodes)
            .enter()
            .append("g")
            .attr("class", "nodes")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended));

        node.append("circle")
            .style("stroke", "#FFF")
            .style("stroke-width", "1.5px")
            .attr("r", function (d) {
                return d.hindex + 10;
            })
            .attr("name", function (d) {
                return d.id;
            })
            .attr("fill", function (d) {
                return color(d.hindex + 1);
            })

        node.append("text")
            .attr("dx", "-.35em")
            .attr("dy", ".35em")
            .style("fill", "#FFF")
            .style("font-size", "10px")
            .text(function (d) {
                return d.hindex;
            });

        node.append("text")
            .attr("dx", function (d) {
                return d.hindex + 15;
            })
            .attr("dy", ".35em")
            .style("font-size", "10px")
            .text(function (d) {
                return d.id;
            });

        simulation
            .nodes(graph.nodes)
            .on("tick", ticked);

        simulation.force("link")
            .links(graph.links);
    };

    $scope.show_coauthor_network = function () {
        var nodes = d3.selectAll('circle').nodes();
        for (var i = 0; i < nodes.length; i++) {
            d3.select(nodes[i]).attr("fill", function (d) {
                return color(d.hindex + 1);
            });
        }
    };

    $scope.show_communities = function () {
        $http.get('/api/getCommunities')
            .then(function successCallback(response) {
                $scope.communities = response.data['communities'];
                var nodes = d3.selectAll('circle').nodes();
                for (var i = 0; i < $scope.communities.length; i++) {
                    for (var j = 0; j < $scope.communities[i].length; j++) {
                        var loc = searchInNodes($scope.communities[i][j], nodes);
                        if (loc != -1) {
                            d3.select(nodes[loc]).attr("fill", function (d) {
                                return color(i + 1);
                            });
                        }
                    }
                }
            });
    };

    $scope.show_areas = function () {

        var words = []
        for (var i = 0, len = $rootScope.mesh_headings.length; i < len; i++) {
            words.push({
                'text': $rootScope.mesh_headings[i][0],
                'size': $rootScope.mesh_headings[i][1]
            })
        }

        var xScale = d3.scaleLinear()
            .domain([1, d3.max(words, function (d) {
                return d.size;
            })])
            .range([20, 100]);

        d3.layout.cloud().size([width, height])
            .words(words)
            .padding(5)
            .rotate(function () {
                return ~~(Math.random() * 6 - 3) * 30;
            })
            .font("Impact")
            .spiral('archimedean')
            .fontSize(function (d) {
                return xScale(d.size);
            })
            .on("end", end)
            .start();

        function end(words) {
            d3.select("svg").remove();
            d3.select(".svg-container").append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr('viewBox', '0 0 ' + Math.min(width, height) + ' ' + Math.min(width, height))
                .attr('preserveAspectRatio', 'xMinYMin')
                .append("g")
                .attr("transform", "translate(" + ~~(width / 2) + "," + ~~(height / 2) + ")")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", function (d) {
                    return d.size + "px";
                })
                .style("-webkit-touch-callout", "none")
                .style("-webkit-user-select", "none")
                .style("-khtml-user-select", "none")
                .style("-moz-user-select", "none")
                .style("-ms-user-select", "none")
                .style("user-select", "none")
                .style("cursor", "default")
                .style("font-family", "Impact")
                .style("fill", function (d, i) {
                    return color(i);
                })
                .attr("text-anchor", "middle")
                .attr("transform", function (d) {
                    return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                })
                .text(function (d) {
                    return d.text;
                });
        }
    };

    function ticked() {
        link
            .attr("x1", function (d) {
                return d.source.x;
            })
            .attr("y1", function (d) {
                return d.source.y;
            })
            .attr("x2", function (d) {
                return d.target.x;
            })
            .attr("y2", function (d) {
                return d.target.y;
            });

        node
            .attr("transform", function (d) {
                var radius = d.hindex + 10;
                d.x = Math.max(radius, Math.min(width - radius, d.x));
                d.y = Math.max(radius, Math.min(height - radius, d.y));
                return "translate(" + d.x + ", " + d.y + ")";
            });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;

        d3.selectAll("line").transition().duration(500)
            .style("opacity", function (o) {
                return o.source === d || o.target === d ? 1 : 0;
            });
        d3.selectAll("circle").each(function () {
            d3.select(this.parentNode).transition().duration(500)
                .style("opacity", function (o) {
                    return neighboring(d, o) ? 1 : 0.25;
                });
        });
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;

        d3.selectAll("line").transition().duration(500)
            .style("opacity", 1);
        d3.selectAll("circle").each(function () {
            d3.select(this.parentNode).transition().duration(500)
                .style("opacity", 1);
        });
    }

    function searchInNodes(name, nodes) {
        for (var i = 0; i < nodes.length; i++) {
            if (d3.select(nodes[i]).attr('name') === name) return i;
        }
        return -1;
    }

    function neighboring(a, b) {
        return a.id == b.id || linkedByIndex[a.id + "," + b.id];
    }
});

cancerControllers.controller('AnnotationsController', function ($scope, $rootScope, $http, $state, $mdDialog) {

    var bookmark;
    $scope.selected = [];

    $scope.query = {
        filter: '',
        order: 'name',
        limit: 10,
        page: 1
    };

    $scope.removeFilter = function () {
        $scope.filter.show = false;
        $scope.query.filter = '';

        if ($scope.filterForm.$dirty) {
            $scope.filterForm.$setPristine();
        }
    };

    $scope.$watch('query.filter', function (newValue, oldValue) {
        if (!oldValue) {
            bookmark = $scope.query.page;
        }

        if (newValue !== oldValue) {
            $scope.query.page = 1;
        }

        if (!newValue) {
            $scope.query.page = bookmark;
        }
    });

    $scope.updateSelectedAnnotation = function (annotation) {
        var data = {
            'last_annotation': annotation._id.$oid
        }
        $http.post('/api/updateLastAnnotation', data).then(function (response) {
            if (response.data['result']) {
                $state.go('dashboard.grading', {}, {
                    'reload': 'dashboard'
                });
            }
        });
    };
});

cancerControllers.controller('ComparisonController', function ($scope, $rootScope) {
    google.charts.load("current", {
        packages: ["corechart"]
    });
    google.charts.setOnLoadCallback(drawDetails);

    function drawDetails() {
        angular.element(document).ready(function () {
            var options = {
                'backgroundColor': 'transparent'
            };

            var oldData = google.visualization.arrayToDataTable([
                ['Overall', 'Counts'],
                ['Mitosis', $rootScope.prevPoints[0].length],
                ['Non-Mitosis', $rootScope.prevPoints[1].length],
                ['Apoptosis', $rootScope.prevPoints[2].length],
                ['Tumor', $rootScope.prevPoints[3].length],
                ['Non-Tumor', $rootScope.prevPoints[4].length],
                ['Lumen', $rootScope.prevPoints[5].length],
                ['Non-Lumen', $rootScope.prevPoints[6].length]
            ]);

            var newData = google.visualization.arrayToDataTable([
                ['Overall', 'Counts'],
                ['Mitosis', $rootScope.currPoints[0].length],
                ['Non-Mitosis', $rootScope.currPoints[1].length],
                ['Apoptosis', $rootScope.currPoints[2].length],
                ['Tumor', $rootScope.currPoints[3].length],
                ['Non-Tumor', $rootScope.currPoints[4].length],
                ['Lumen', $rootScope.currPoints[5].length],
                ['Non-Lumen', $rootScope.currPoints[6].length]
            ]);

            var chartDiff = new google.visualization.PieChart(document.querySelector('#versionsChart'));
            var diffData = chartDiff.computeDiff(oldData, newData);
            chartDiff.draw(diffData, options);
        });
    }
});

cancerControllers.controller('EditorController', function ($scope, $state, $rootScope, $http, $mdToast, $mdBottomSheet, $mdDialog) {

    if ($rootScope.selected === undefined) {
        $state.go('dashboard.annotation');
        return;
    }

    $scope.deleteMode = false;
    $scope.select = false;
    $scope.versions = [];

    $scope.mitosis = 0;
    $scope.non_mitosis = 0;
    $scope.apoptosis = 0;
    $scope.tumor = 0;
    $scope.non_tumor = 0;
    $scope.lumen = 0;
    $scope.non_lumen = 0;

    var undoManager = new UndoManager();
    $scope.canUndo = false;
    $scope.canRedo = false;

    $scope.points = [];
    $scope.compareMode = false;
    $scope.visible = false;

    $scope.loadVersion = function (v) {
        if (v == 0)
            v = $rootScope.versions.length - 1
        else
            v = v - 1
        $scope.compareMode = true;
        var arr = [];
        var data = $rootScope.versions[v]['annotations'];
        for (var x in data)
            arr.push(data[x]);
        $scope.points = arr
        compareVersions();
    };

    function compareVersions() {
        var bounds = stage.getBounds();
        var prevPoints = $scope.points;
        var currPoints = $rootScope.points;

        var scale = 1;
        if (contentCells.children.length != 0)
            scale = contentCells.getChildAt(0).scaleX;

        // Clear circles
        contentCells.visible = false;
        contentCompare.removeAllChildren();
        content.addChild(contentCompare);

        var same = [],
            added = [],
            removed = [];
        var count = 1;
        for (var i = 0; i < prevPoints.length; i++) {

            color = colors[i];
            index = i + 1;
            if (JSON.stringify(prevPoints[i]) == JSON.stringify(currPoints[i])) {
                circle_a = 0.75;
                strokeColor = "black";
                for (var j = 0; j < prevPoints[i].length; j++) {
                    var p = prevPoints[i][j];
                    createCircle(p.x * bounds.width, p.y * bounds.height, scale, contentCompare);
                    same.push({
                        'index': index,
                        'id': count++
                    })
                }
                continue;
            }

            for (var x = 0; x < prevPoints[i].length; x++) {
                var isRemoved = true;
                for (var y = 0; y < currPoints[i].length; y++) {
                    if (prevPoints[i][x].x == currPoints[i][y].x && prevPoints[i][x].y == currPoints[i][y].y) {
                        circle_a = 0.75;
                        strokeColor = "black";
                        var p = prevPoints[i][x];
                        createCircle(p.x * bounds.width, p.y * bounds.height, scale, contentCompare);
                        same.push({
                            'index': index,
                            'id': count++
                        });
                        isRemoved = false;
                        break;
                    }
                }
                if (isRemoved) {
                    circle_a = 0.5;
                    strokeColor = "red";
                    var p = prevPoints[i][x];
                    createCircle(p.x * bounds.width, p.y * bounds.height, scale, contentCompare);
                    removed.push({
                        'index': index,
                        'id': count++
                    })
                }
            }

            for (var x = 0; x < currPoints[i].length; x++) {
                var isAdded = true;
                for (var y = 0; y < prevPoints[i].length; y++) {
                    if (prevPoints[i][y].x == currPoints[i][x].x && prevPoints[i][y].y == currPoints[i][x].y) {
                        isAdded = false;
                        break;
                    }
                }
                if (isAdded) {
                    circle_a = 0.5;
                    strokeColor = "green";
                    var p = currPoints[i][x];
                    createCircle(p.x * bounds.width, p.y * bounds.height, scale, contentCompare);
                    added.push({
                        'index': index,
                        'id': count++
                    })
                }
            }
        }

        $rootScope.same = same;
        $rootScope.added = added;
        $rootScope.removed = removed;
        $rootScope.prevPoints = $scope.points;
        $rootScope.currPoints = $rootScope.points;
    }

    $scope.undo = function () {
        undoManager.undo();
        $scope.canUndo = undoManager.hasUndo();
        $scope.canRedo = undoManager.hasRedo();
        update = true;
    };
    $scope.redo = function () {
        undoManager.redo();
        $scope.canUndo = undoManager.hasUndo();
        $scope.canRedo = undoManager.hasRedo();
        update = true;
    };

    var stage, image, content, contentCells, contentCompare, mouseX, isChanged = false,
        update = true;
    var w = window.innerWidth,
        h = window.innerHeight;
    var colors = ["#5BC0EB", "#FDE74C", "#9BC53D", "#FA7921", "#FF1654", "#2364AA", "#2B2D42"];
    var color = colors[0],
        index = 1,
        zoom = 1.0,
        radius = 10,
        circle_a = 0.75,
        stroke_w = 2,
        strokeColor = "black";
    var scale = 1;
    // Resize event listener
    window.addEventListener('resize', resize);

    $scope.init = function () {
        if ($rootScope.masked) {
            $scope.versions = [{
                'id': 0,
                'name': 'Latest',
                'abbr': 'L'
            }];
            var i = $rootScope.versions.length - 5 > 0 ? $rootScope.versions.length - 4 : 1;
            for (i; i < $rootScope.versions.length; i++) {
                $scope.versions.push({
                    'id': i,
                    'name': 'Version ' + i,
                    'abbr': 'v' + i
                });
            }
        }

        stage = new createjs.Stage("imageCanvas");
        stage.enableMouseOver();
        createContent();
        createjs.Ticker.addEventListener("tick", tick);

        // zooming events
        stage.canvas.addEventListener("mousewheel", MouseWheelHandler);
        stage.canvas.addEventListener("DOMMouseScroll", MouseWheelHandler);
        stage.addEventListener("stagemousedown", function (e) {
            var offset = {
                x: stage.x - e.stageX,
                y: stage.y - e.stageY
            };
            mouseX = e.stageX;
            stage.addEventListener("stagemousemove", function (e) {
                stage.x = e.stageX + offset.x;
                stage.y = e.stageY + offset.y;
                update = true;
            });
            stage.addEventListener("stagemouseup", function () {
                stage.removeAllEventListeners("stagemousemove");
            });
        });

        resize();
    };

    function createContent() {
        content = new createjs.Container();
        contentCells = new createjs.Container();
        contentCompare = new createjs.Container();
        stage.addChild(content);

        // Load the Image
        image = new Image();
        image.src = "static/cache/" + $rootScope.selected.name.split('.')[0] + ".jpg";
        image.onload = handleImageLoad;
    }

    function loadAnnotation(points, scale) {
        var bounds = stage.getBounds();
        for (var i = 0; i < points.length; i++) {
            color = colors[i];
            index = i + 1;
            circle_a = 0.75;
            strokeColor = "black";
            for (var j = 0; j < points[i].length; j++) {
                var p = points[i][j];
                createCircle(p.x * bounds.width, p.y * bounds.height, scale, contentCells);
            }
        }
    }

    function handleImageLoad() {
        // Create a CreateJS bitmap from the loaded image
        var bitmap = new createjs.Bitmap(image);
        var w = bitmap.image.width,
            h = bitmap.image.height;

        // Set size of radius of circles
        if (w > h)
            radius = Math.round(w / 120);
        else
            radius = Math.round(h / 120);

        // Add the bitmap to the Container
        content.addChild(bitmap);
        content.addChild(contentCells);

        // Calculate a scale factor to keep a correct aspect ratio.
        var ratio = w / h;
        var windowRatio = stage.canvas.width / stage.canvas.height;
        scale = stage.canvas.width / w;
        if (windowRatio > ratio)
            scale = stage.canvas.height / h;

        // Set the scale value
        bitmap.scaleX = bitmap.scaleY = scale;

        // Set the registration point of the content Container to center
        content.regX = bitmap.image.width * scale / 2;
        content.regY = bitmap.image.height * scale / 2;

        bitmap.addEventListener("click", function (e) {
            addCircle(scale);
            isChanged = true;
        });

        if ($rootScope.masked) {
            loadAnnotation($rootScope.points, scale);

            // set undo/redo
            $scope.canUndo = undoManager.hasUndo();
            $scope.canRedo = undoManager.hasRedo();

            // reinitialize
            color = colors[0];
            index = 1;
        }
        update = true;
    }

    function tick() {
        if (update) {
            update = false; // only update once
            stage.update();
        }
    }

    function MouseWheelHandler(e) {
        // prevent browser scrolling
        e.preventDefault();
        if (Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) > 0)
            zoom = 1.1;
        else
            zoom = 1 / 1.1;

        var tempX = stage.scaleX * zoom;
        if (tempX > 1 && tempX < 8) {
            var local = stage.globalToLocal(stage.mouseX, stage.mouseY);
            stage.regX = local.x;
            stage.regY = local.y;
            stage.x = stage.mouseX;
            stage.y = stage.mouseY;
            stage.scaleX = stage.scaleY *= zoom;
        }
        update = true;
    }

    function resize() {
        // Resize the canvas element
        stage.canvas.width = window.innerWidth;
        stage.canvas.height = window.innerHeight;

        // Calculate a scale factor to keep a correct aspect ratio.
        var ratio = w / h;
        var windowRatio = stage.canvas.width / stage.canvas.height;
        var scale = stage.canvas.width / w;
        if (windowRatio > ratio) {
            scale = stage.canvas.height / h;
        }

        // Content: scaled
        content.scaleX = content.scaleY = scale;

        // Content: centered
        content.x = stage.canvas.width / 2;
        content.y = stage.canvas.height / 2;

        update = true;
    }

    function addCircle(scale) {
        if ($scope.deleteMode)
            return;

        var local = content.globalToLocal(stage.mouseX, stage.mouseY);

        if (Math.abs((mouseX - stage.mouseX)) > 5)
            return;

        circle_a = 0.75;
        strokeColor = "black";
        createCircle(local.x, local.y, scale, contentCells);
    }

    $scope.deleteCircle = function () {
        $scope.deleteMode = !$scope.deleteMode;

        if ($scope.deleteMode)
            $mdToast.show($mdToast.simple().textContent('Delete Mode is activated!'));
        else
            $mdToast.show($mdToast.simple().textContent('Delete Mode is deactivated!'));
    };

    function increaseCount(index) {
        if (index == 1)
            $scope.mitosis++;
        else if (index == 2)
            $scope.non_mitosis++;
        else if (index == 3)
            $scope.apoptosis++;
        else if (index == 4)
            $scope.tumor++;
        else if (index == 5)
            $scope.non_tumor++;
        else if (index == 6)
            $scope.lumen++;
        else if (index == 7)
            $scope.non_lumen++;
    }

    function decreaseCount(index) {
        if (index == 1)
            $scope.mitosis--;
        else if (index == 2)
            $scope.non_mitosis--;
        else if (index == 3)
            $scope.apoptosis--;
        else if (index == 4)
            $scope.tumor--;
        else if (index == 5)
            $scope.non_tumor--;
        else if (index == 6)
            $scope.lumen--;
        else if (index == 7)
            $scope.non_lumen--;
    }

    function createCircle(x, y, scale, c) {
        var circle = new createjs.Shape();
        circle.graphics.setStrokeStyle(stroke_w * scale).beginStroke(strokeColor).beginFill(color).drawCircle(0, 0, radius * scale);

        circle.x = x;
        circle.y = y;
        circle.alpha = circle_a;
        circle.name = index;
        circle.cursor = "pointer";
        circle.scaleX = circle.scaleY = scale;

        circle.on("rollover", function (evt) {
            this.scaleX = this.scaleY = scale * 1.3;
            update = true;
        });

        circle.on("rollout", function (evt) {
            this.scaleX = this.scaleY = scale;
            update = true;
        });

        if (!$scope.compareMode) {
            circle.addEventListener("dblclick", function (e) {
                c.removeChild(e.target);
                decreaseCount(e.target.name);

                undoManager.add({
                    undo: function () {
                        c.addChild(circle);
                    },
                    redo: function () {
                        c.removeChild(circle);
                    }
                });
                update = true;
            });

            circle.addEventListener("click", function (e) {
                if ($scope.deleteMode) {
                    c.removeChild(e.target);
                    decreaseCount(e.target.name);

                    undoManager.add({
                        undo: function () {
                            c.addChild(circle);
                        },
                        redo: function () {
                            c.removeChild(circle);
                        }
                    });
                    update = true;
                }
            });

            undoManager.add({
                undo: function () {
                    c.removeChild(circle);
                },
                redo: function () {
                    c.addChild(circle);
                }
            });

            $scope.$apply(function () {
                $scope.canUndo = undoManager.hasUndo();
                $scope.canRedo = undoManager.hasRedo();
            });

            increaseCount(index);
        } else {
            var fontSize = Math.round(20 * scale);
            var text = new createjs.Text(c.numChildren / 2 + 1, "bold " + fontSize + "px Arial", strokeColor);
            text.alpha = 0.75;
            text.x = x;
            text.y = y - (10 * scale);
            text.textBaseline = "alphabetic";
            text.textAlign = "center";

            c.addChild(text);
        }

        c.addChild(circle);
        update = true;
    }

    $scope.setColor = function (i) {
        color = colors[i - 1];
        index = i;
    };

    $scope.setVisibility = function () {
        $scope.visible = !$scope.visible;
        contentCells.visible = !contentCells.visible;
        update = true;
    };

    $scope.showDetails = function () {
        $mdBottomSheet.show({
            templateUrl: '../static/partials/comparison.html'
        });
    };

    $scope.save = function (train) {
        if ($scope.compareMode) {
            $scope.compareMode = false;
            content.removeChild(contentCompare);

            var scale = 1;
            if (contentCells.children.length != 0)
                scale = contentCells.getChildAt(0).scaleX;

            contentCells.removeAllChildren();
            contentCells.visible = true;

            //clear old one
            $rootScope.points = $scope.points;
            $scope.mitosis = 0;
            $scope.non_mitosis = 0;
            $scope.apoptosis = 0;
            $scope.tumor = 0;
            $scope.non_tumor = 0;
            $scope.lumen = 0;
            $scope.non_lumen = 0;

            loadAnnotation($rootScope.points, scale);

            // set undo/redo
            $scope.canUndo = undoManager.hasUndo();
            $scope.canRedo = undoManager.hasRedo();

            // reinitialize
            color = colors[0];
            index = 1;
        } else {
            var bounds = stage.getBounds();
            if (contentCells.children.length > 0) {
                var points = {
                    "id": $rootScope.selected._id.$oid,
                    "train": train,
                    "locs": {
                        "mitosis": [],
                        "non_mitosis": [],
                        "apoptosis": [],
                        "tumor": [],
                        "non_tumor": [],
                        "lumen": [],
                        "non_lumen": []
                    }
                };

                for (var i = 0; i < contentCells.children.length; i++) {
                    var index = contentCells.getChildAt(i).name
                    if (index == 1)
                        points.locs['mitosis'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                    else if (index == 2)
                        points.locs['non_mitosis'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                    else if (index == 3)
                        points.locs['apoptosis'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                    else if (index == 4)
                        points.locs['tumor'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                    else if (index == 5)
                        points.locs['non_tumor'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                    else if (index == 6)
                        points.locs['lumen'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                    else if (index == 7)
                        points.locs['non_lumen'].push({
                            "x": Math.abs(contentCells.getChildAt(i).x) / bounds.width,
                            "y": Math.abs(contentCells.getChildAt(i).y) / bounds.height
                        });
                }

                $http.post('/api/addAnnotation', points).then(function (response) {
                    if (response.data['result']) {
                        $state.go("dashboard.annotation");
                    } else {
                        console.log(response.data)
                    }
                }, function (err) {
                    // do something
                });
            }
        }
    };

    $scope.cancel = function () {
        if ($scope.compareMode) {
            content.removeChild(contentCompare);
            contentCells.visible = true;
            $scope.compareMode = false;
            update = true;
        } else {
            if (contentCells.children.length == 0 || !isChanged)
                $state.go("dashboard.annotation");
            else {
                var confirm = $mdDialog.confirm()
                    .title('Do you really want to close this?')
                    .textContent('Annotation data will be lost.')
                    .ok('CLOSE')
                    .cancel('Cancel');

                $mdDialog.show(confirm).then(function () {
                    $state.go("dashboard.annotation");
                });
            }
        }
    };

    $scope.predictModel = function (newOld) {
        var points = {
            "name": $rootScope.selected,
            "new": newOld
        };

        $http.post('/api/predictModel', points).then(function (response) {
            if (response.data['result']) {
                var arr = [];
                var data = response.data['points'];
                for (var x in data)
                    arr.push(data[x]);
                $rootScope.points = arr;

                contentCells.removeAllChildren();
                contentCells.visible = true;

                //clear old one
                $scope.mitosis = 0;
                $scope.non_mitosis = 0;
                $scope.apoptosis = 0;
                $scope.tumor = 0;
                $scope.non_tumor = 0;
                $scope.lumen = 0;
                $scope.non_lumen = 0;

                loadAnnotation($rootScope.points, scale);

                // set undo/redo
                $scope.canUndo = undoManager.hasUndo();
                $scope.canRedo = undoManager.hasRedo();

                // reinitialize
                color = colors[0];
                index = 1;
            } else {
                console.log(response.data)
            }
        }, function (err) {
            // do something
        });
    };
});

cancerControllers.controller('ScoringController', function ($scope, $state, $rootScope, $http, $mdDialog, $mdToast, $mdBottomSheet) {

    if ($rootScope.selected === undefined && $rootScope.compareScores === undefined) {
        $state.go('dashboard.grading');
        return;
    }

    var stage, stageNuclear, image, content, contentMitosis, contentTubule, update = true,
        imageRef = [],
        imageLoaded = false;
    var w = window.innerWidth,
        h = window.innerHeight;
    var colors = ["#5BC0EB", "#FDE74C", "#9BC53D", "#FA7921", "#FF1654", "#2364AA", "#2B2D42"];
    var color = colors[1],
        zoom = 1.0,
        radius = 10,
        stroke_w = 2,
        wMitos = 100,
        wGland = 500,
        wNuclear,
        scale;

    $scope.selectedTab = 0;
    $scope.initialStep = true;
    $scope.compare = false;
    $rootScope.initialScore = 0;
    $rootScope.histologicType = 0;
    $scope.mitosisScore = [];
    $scope.nuclearScore = [];
    $scope.tubularScore = [];

    $scope.tabs = [{
            src: 'static/cache/Normal breast-01.jpg'
        },
        {
            src: 'static/cache/Normal breast-02.jpg'
        },
        {
            src: 'static/cache/Normal breast-03.jpg'
        },
        {
            src: 'static/cache/Normal breast-04.jpg'
        }
    ]

    // Resize event listener
    window.addEventListener('resize', resize);
    if ($rootScope.compareScores === undefined)
        loadScores();
    else {
        $scope.compare = true;
        $rootScope.scoredDone = true;
        $rootScope.selected = {
            'name': $rootScope.compareScores.image_name
        }
        $scope.mitosisScore['data'] = $rootScope.compareScores.locs.mitosis;
        $scope.tubularScore['data'] = $rootScope.compareScores.locs.tubular;
    }

    $scope.init = function () {
        stage = new createjs.Stage("imageCanvas");
        stage.enableMouseOver();
        createContent();
        createjs.Ticker.addEventListener("tick", tick);

        // zooming events
        stage.canvas.addEventListener("mousewheel", MouseWheelHandler);
        stage.canvas.addEventListener("DOMMouseScroll", MouseWheelHandler);
        stage.addEventListener("stagemousedown", function (e) {
            var offset = {
                x: stage.x - e.stageX,
                y: stage.y - e.stageY
            };
            stage.addEventListener("stagemousemove", function (e) {
                stage.x = e.stageX + offset.x;
                stage.y = e.stageY + offset.y;
                update = true;
            });
            stage.addEventListener("stagemouseup", function () {
                stage.removeAllEventListeners("stagemousemove");
            });
        });

        resize();
    };

    $scope.showCharts = function () {
        $rootScope.ms = $scope.mitosisScore;
        $rootScope.ns = $scope.nuclearScore;
        $rootScope.ts = $scope.tubularScore;

        $mdBottomSheet.show({
            templateUrl: '../static/partials/scoringChart.html',
            controller: 'ScoringChartController'
        });
    };

    $scope.initMitosis = function () {
        contentMitosis.visible = true;
        contentTubule.visible = false;
        if ($scope.mitosisScore['data'].length > 0 && contentMitosis.numChildren == 0)
            loadAnnotation();
        update = true;
    };

    $scope.initNuclear = function () {
        contentMitosis.visible = false;
        contentTubule.visible = false;
        if (imageLoaded)
            loadAnnotation();
        update = true;
    };

    $scope.initTubular = function () {
        contentMitosis.visible = false;
        contentTubule.visible = true;
        if ($scope.tubularScore['data'].length > 0 && contentTubule.numChildren == 0)
            loadAnnotation();
        update = true;
    };

    $scope.setHistologicType = function () {
        if ($rootScope.histologicType == 2)
            $rootScope.initialScore = 2;
        else if ($rootScope.histologicType == 3 || $rootScope.histologicType == 4)
            $rootScope.initialScore = 1;
        else if ($rootScope.histologicType == 5)
            $rootScope.initialScore = 3;
        else
            $rootScope.initialScore = 0;
    };

    $scope.checkScoreForStyle = function (score) {
        if (score > 0 && score < 1)
            return 0.5;
        else
            return score;
    };

    $scope.setCustom = function (score) {
        if (score > 0 && score < 1) {
            this.$parent.other = parseFloat(score);
            this.other = parseInt(parseFloat(score) * 100);
        }
    };

    $scope.setCustomScore = function (type, idx, score) {
        if (score < 1) {
            score = 1;
            this.other = score;
        } else if (score > 99) {
            score = 99;
            this.other = score;
        }
        this.$parent.other = score / 100;
        if (type == 0) {
            $scope.mitosisScore['data'][idx]['score'] = score / 100;
        } else if (type == 2) {
            $scope.tubularScore['data'][idx]['score'] = score / 100;
        }
    };

    $scope.calculateOverallScore = function () {
        var sum = 0,
            count = 0,
            overallScore = 0;
        for (var i = 0; i < $scope.nuclearScore['data'].length; i++) {
            if ($scope.nuclearScore['data'][i]['score'] != undefined && $scope.nuclearScore['data'][i]['score'] != 0) {
                sum += parseInt($scope.nuclearScore['data'][i]['score'])
                count++
            }
        }
        if (count != 0)
            $scope.nuclearScore['overall'] = sum / count;

        if ($scope.mitosisScore['overall'] != undefined)
            overallScore += parseInt($scope.mitosisScore['overall'])
        if ($scope.nuclearScore['overall'] != undefined)
            overallScore += parseInt($scope.nuclearScore['overall'])
        if ($scope.tubularScore['overall'] != undefined)
            overallScore += parseInt($scope.tubularScore['overall'])

        $mdToast.show($mdToast.simple().textContent('Overall score is ' +
            Math.round(overallScore)).parent(document.getElementById("toast-container")));
    };

    $scope.showDialog = function () {
        $mdDialog.show({
            contentElement: '#myDialog',
            parent: angular.element(document.body),
            clickOutsideToClose: true
        });
    };

    $scope.zoom = function (val) {
        if (contentMitosis.visible) {
            var temp = wMitos + val
            if (temp > 50 && temp < 200)
                wMitos += val
        } else if (contentTubule.visible) {
            var temp = wGland + (val * 3)
            if (temp > 200 && temp < 500)
                wGland += (val * 3)
        } else {
            var temp = wNuclear - (val * 8)
            if (temp > 500 && temp < 2000)
                wNuclear -= (val * 8)
        }
        loadAnnotation(scale);
    };

    function loadScores() {
        // Show only 0, 1, 2 (mitosis, non-mitosis, apoptosis)
        if ($rootScope.scored) {
            $rootScope.histologicType = $rootScope.scores['histologicType'];
            $rootScope.initialScore = $rootScope.scores['initialScore'];
            $scope.initialStep = false;
            $scope.mitosisScore = {
                'overall': $rootScope.scores['mitosis'].overall,
                'data': []
            };
            $scope.tubularScore = {
                'overall': $rootScope.scores['lumen'].overall,
                'data': []
            };
            $scope.nuclearScore = {
                'overall': $rootScope.scores['nuclear'].overall,
                'data': []
            };
        } else {
            $rootScope.histologicType = 0;
            $rootScope.initialScore = 0;
            $scope.initialStep = true;
            $scope.mitosisScore = {
                'overall': null,
                'data': []
            };
            $scope.tubularScore = {
                'overall': null,
                'data': []
            };
            $scope.nuclearScore = {
                'overall': null,
                'data': []
            };
        }
        for (var i = 0; i < $rootScope.points.length; i++) {
            for (var j = 0; j < $rootScope.points[i].length; j++) {
                var p = $rootScope.points[i][j];
                var isFound = true;
                if (i < 3) {
                    if ($rootScope.scored) {
                        // between 1-3 mitosis
                        for (var k = 0; k < $rootScope.scores['mitosis'].data.length; k++) {
                            var loc = $rootScope.scores['mitosis'].data[k];
                            if (loc.x == p.x && loc.y == p.y) {
                                $scope.mitosisScore['data'].push({
                                    'x': p.x,
                                    'y': p.y,
                                    'score': $rootScope.scores['mitosis'].data[k].score
                                });
                                isFound = false;
                                break;
                            }
                        }
                    }
                    if (isFound)
                        $scope.mitosisScore['data'].push({
                            'x': p.x,
                            'y': p.y,
                            'score': null
                        });
                }
                // between 6-7 lumen
                else if (5 < i) {
                    if ($rootScope.scored) {
                        for (var k = 0; k < $rootScope.scores['lumen'].data.length; k++) {
                            var loc = $rootScope.scores['lumen'].data[k];
                            if (loc.x == p.x && loc.y == p.y) {
                                $scope.tubularScore['data'].push({
                                    'x': p.x,
                                    'y': p.y,
                                    'score': $rootScope.scores['lumen'].data[k].score
                                });
                                isFound = false;
                                break;
                            }
                        }
                    }
                    if (isFound)
                        $scope.tubularScore['data'].push({
                            'x': p.x,
                            'y': p.y,
                            'score': null
                        });
                }
            }
        }
        if ($rootScope.scored) {
            for (var k = 0; k < $rootScope.scores['nuclear'].data.length; k++) {
                var idx = $rootScope.scores['nuclear'].data[k].criteria;
                $scope.nuclearScore['data'][idx - 1] = {
                    'criteria': idx,
                    'score': $rootScope.scores['nuclear'].data[k].score
                }
            }
        } else {
            for (var i = 0; i < 6; i++)
                $scope.nuclearScore['data'].push({
                    'criteria': i + 1,
                    'score': null
                });
        }
    }

    function createContent() {
        content = new createjs.Container();
        contentMitosis = new createjs.Container();
        contentTubule = new createjs.Container();
        stage.addChild(content);

        contentMitosis.visible = false;
        contentTubule.visible = false;

        // Load the Ref Images
        loadAllRefImages(0);
    }

    function loadAllRefImages(index) {
        if (index >= $scope.tabs.length) {
            // Load the Image
            image = new Image();
            image.src = "static/cache/" + $rootScope.selected.name.split('.')[0] + ".jpg";
            image.onload = handleImageLoad;
            return;
        }

        //create image object
        var ref = new Image();

        //add image path
        ref.src = $scope.tabs[index].src;

        //bind load event
        ref.onload = function () {
            imageRef.push(ref);
            //now load next image
            loadAllRefImages(index + 1);
        }
    }

    function loadAnnotation() {
        var bounds = stage.getBounds();
        if (contentMitosis.visible) {
            var imageCanvas = document.querySelectorAll("#mitosis canvas");
            for (var i = 0; i < $scope.mitosisScore['data'].length; i++) {
                var x = $scope.mitosisScore['data'][i].x * bounds.width,
                    y = $scope.mitosisScore['data'][i].y * bounds.height;

                createCircle(x, y, i + 1, contentMitosis);

                var stageMitosis = new createjs.Stage(imageCanvas[i]);
                // Make it visually fill the positioned parent
                stageMitosis.canvas.style.width = '100%';
                // ...then set the internal size to match
                stageMitosis.canvas.width = stageMitosis.canvas.height = stageMitosis.canvas.offsetWidth;
                var bitmap = new createjs.Bitmap(image);
                // crop size of rectangle
                var boundsMitosis = bitmap.getBounds();
                var w = wMitos;
                var s = stageMitosis.canvas.width / w;
                bitmap.scaleX = bitmap.scaleY = s;
                bitmap.sourceRect = new createjs.Rectangle($scope.mitosisScore['data'][i].x * boundsMitosis.width - (w / 2),
                    $scope.mitosisScore['data'][i].y * boundsMitosis.height - (w / 2), w, w);
                stageMitosis.addChild(bitmap);
                stageMitosis.update();
            }
        } else if (contentTubule.visible) {
            var imageCanvas = document.querySelectorAll("#lumen canvas");
            for (var i = 0; i < $scope.tubularScore['data'].length; i++) {
                var x = $scope.tubularScore['data'][i].x * bounds.width,
                    y = $scope.tubularScore['data'][i].y * bounds.height;

                createCircle(x, y, i + 1, contentTubule);

                var stageTubular = new createjs.Stage(imageCanvas[i]);
                // Make it visually fill the positioned parent
                stageTubular.canvas.style.width = '100%';
                // ...then set the internal size to match
                stageTubular.canvas.width = stageTubular.canvas.height = stageTubular.canvas.offsetWidth;

                var bitmap = new createjs.Bitmap(image);
                // crop size of rectangle
                var boundsTubular = bitmap.getBounds();
                var w = wGland;
                var s = stageTubular.canvas.width / w;
                bitmap.scaleX = bitmap.scaleY = s;
                bitmap.sourceRect = new createjs.Rectangle($scope.tubularScore['data'][i].x * boundsTubular.width - (w / 2),
                    $scope.tubularScore['data'][i].y * boundsTubular.height - (w / 2), w, w);
                stageTubular.addChild(bitmap);
                createCircle((w / 2) * s, (w / 2) * s, '', stageTubular);
                stageTubular.update();
            }
        } else {
            stageNuclear = new createjs.Stage("imageCanvas");
            // Make it visually fill the positioned parent
            stageNuclear.canvas.style.width = '100%';

            var bitmap = new createjs.Bitmap(image);
            var w = bitmap.image.width,
                h = bitmap.image.height;

            // Calculate a scale factor to keep a correct aspect ratio.
            var ratio = w / h;
            // ...then set the internal size to match
            stageNuclear.canvas.width = stageNuclear.canvas.offsetWidth;
            stageNuclear.canvas.height = stageNuclear.canvas.offsetWidth / ratio;

            var windowRatio = stageNuclear.canvas.width / stageNuclear.canvas.height;
            var s = stageNuclear.canvas.width / w;
            if (windowRatio > ratio)
                s = stageNuclear.canvas.height / h;

            if (wNuclear == undefined)
                wNuclear = stageNuclear.canvas.width;
            else
                s = wNuclear / w;

            // Set the scale value
            bitmap.scaleX = bitmap.scaleY = s;

            // Moving image with mouse
            stageNuclear.addEventListener("stagemousedown", function (e) {
                var offset = {
                    x: stageNuclear.x - e.stageX,
                    y: stageNuclear.y - e.stageY
                };
                stageNuclear.addEventListener("stagemousemove", function (e) {
                    stageNuclear.x = e.stageX + offset.x;
                    stageNuclear.y = e.stageY + offset.y;
                    stageNuclear.update();
                });
                stageNuclear.addEventListener("stagemouseup", function () {
                    stageNuclear.removeAllEventListeners("stagemousemove");
                    stageNuclear.update();
                });
            });

            stageNuclear.addChild(bitmap);
            stageNuclear.update();

            // Load the Ref Images
            for (var i = 0; i < imageRef.length; i++) {
                var stageNuclearRef = new createjs.Stage("imageCanvas" + i);

                // Make it visually fill the positioned parent
                stageNuclearRef.canvas.style.width = '100%';

                var bitmap = new createjs.Bitmap(imageRef[i]);
                var w = bitmap.image.width,
                    h = bitmap.image.height;

                // Calculate a scale factor to keep a correct aspect ratio.
                var ratio = w / h;
                // ...then set the internal size to match
                stageNuclearRef.canvas.width = stageNuclearRef.canvas.offsetWidth;
                stageNuclearRef.canvas.height = stageNuclearRef.canvas.offsetWidth / ratio;

                var windowRatio = stageNuclearRef.canvas.width / stageNuclearRef.canvas.height;
                var s = stageNuclearRef.canvas.width / w;
                if (windowRatio > ratio)
                    s = stageNuclearRef.canvas.height / h;

                if (wNuclear == undefined)
                    wNuclear = stageNuclearRef.canvas.width;
                else
                    s = wNuclear / w;

                // Set the scale value
                bitmap.scaleX = bitmap.scaleY = s;
                
                stageNuclearRef.addChild(bitmap);
                stageNuclearRef.update();
            }
        }
    }

    function handleImageLoad() {
        // Create a CreateJS bitmap from the loaded image
        var bitmap = new createjs.Bitmap(image);
        var w = bitmap.image.width,
            h = bitmap.image.height;
        if (stageNuclear == undefined && !$scope.initialStep)
            loadAnnotation();

        // Add the bitmap to the Container
        content.addChild(bitmap);
        content.addChild(contentMitosis);
        content.addChild(contentTubule);

        // Calculate a scale factor to keep a correct aspect ratio.
        var ratio = w / h;
        var windowRatio = stage.canvas.width / stage.canvas.height;
        scale = stage.canvas.width / w;
        if (windowRatio > ratio)
            scale = stage.canvas.height / h;

        // Set the scale value
        bitmap.scaleX = bitmap.scaleY = scale;

        // Set the registration point of the content Container to center
        content.regX = bitmap.image.width * scale / 2;
        content.regY = bitmap.image.height * scale / 2;

        update = true;
        imageLoaded = true;
    }

    function tick() {
        if (update) {
            update = false; // only update once
            stage.update();
        }
    }

    function MouseWheelHandler(e) {
        // prevent browser scrolling
        e.preventDefault();
        if (Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail))) > 0)
            zoom = 1.1;
        else
            zoom = 1 / 1.1;

        var tempX = stage.scaleX * zoom;
        if (tempX > 1 && tempX < 8) {
            var local = stage.globalToLocal(stage.mouseX, stage.mouseY);
            stage.regX = local.x;
            stage.regY = local.y;
            stage.x = stage.mouseX;
            stage.y = stage.mouseY;
            stage.scaleX = stage.scaleY *= zoom;
        }
        update = true;
    }

    function resize() {
        // Resize the canvas element
        stage.canvas.width = window.innerWidth;
        stage.canvas.height = window.innerHeight;

        // Calculate a scale factor to keep a correct aspect ratio.
        var ratio = w / h;
        var windowRatio = stage.canvas.width / stage.canvas.height;
        var scale = stage.canvas.width / w;
        if (windowRatio > ratio) {
            scale = stage.canvas.height / h;
        }

        // Content: scaled
        content.scaleX = content.scaleY = scale;

        // Content: centered
        content.x = stage.canvas.width / 2;
        content.y = stage.canvas.height / 2;
        update = true;
    }

    function createCircle(x, y, index, content) {
        var circle = new createjs.Shape();
        circle.graphics.setStrokeStyle(stroke_w * scale).beginStroke("black").beginFill(colors[1]).drawCircle(0, 0, radius * scale);

        var fontSize = Math.round(20 * scale);
        var text = new createjs.Text(index, "bold " + fontSize + "px Arial", colors[5]);
        text.x = x;
        text.y = y - (10 * scale);
        text.textBaseline = "alphabetic";
        text.textAlign = "center";

        circle.x = x;
        circle.y = y;
        circle.alpha = 0.75;
        circle.name = index;
        circle.cursor = "pointer";
        circle.scaleX = circle.scaleY = scale;

        circle.on("rollover", function (evt) {
            this.scaleX = this.scaleY = scale * 1.3;
            update = true;
        });

        circle.on("rollout", function (evt) {
            this.scaleX = this.scaleY = scale;
            update = true;
        });

        content.addChild(circle);
        content.addChild(text);
    }

    $scope.save = function () {
        var scores = {
            "id": $rootScope.selected['annotations'].slice(-1)[0]._id.$oid,
            "scores": {
                "histologicType": $rootScope.histologicType,
                "initialScore": $rootScope.initialScore,
                "mitosis": $scope.mitosisScore,
                "nuclear": $scope.nuclearScore,
                "lumen": $scope.tubularScore
            }
        };
        if ($rootScope.histologicType == 2 || $rootScope.histologicType == 3 || $rootScope.histologicType == 4) {
            $scope.mitosisScore['overall'] = -10
            $scope.nuclearScore['overall'] = -10
            $scope.tubularScore['overall'] = -10

            for (var k = 0; k < $scope.mitosisScore['data'].length; k++)
                $scope.mitosisScore['data'][k]['score'] = -10

            for (var k = 0; k < $scope.tubularScore['data'].length; k++)
                $scope.tubularScore['data'][k]['score'] = -10

            for (var k = 0; k < $scope.nuclearScore['data'].length; k++)
                $scope.nuclearScore['data'][k]['score'] = -10
        }

        if ($scope.initialStep) {
            var confirm = $mdDialog.confirm()
                .title("Do you want to continue?")
                .textContent('The inital scoring value cannot be changed later.')
                .ok('Continue')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function () {
                $scope.initialStep = false;
                $http.post('/api/addScore', scores).then(function (response) {
                    if (response.data['result']) {
                        if ($scope.mitosisScore['overall'] == -10)
                            $state.go("dashboard.grading");
                        else
                            $scope.initNuclear();
                    } else {
                        console.log(response.data)
                    }
                }, function (err) {
                    // do something
                });
            }, function () {
                $mdDialog.cancel();
            });
        } else {
            $http.post('/api/addScore', scores).then(function (response) {
                if (response.data['result']) {
                    $state.go("dashboard.grading");
                } else {
                    console.log(response.data)
                }
            }, function (err) {
                // do something
            });
        }
    };

    $scope.cancel = function () {
        $state.go("dashboard.grading");
    };

    $scope.back = function () {
        if ($scope.compare) {
            $state.go("dashboard.compare");
        } else
            $state.go("dashboard.grading");
    };
});

cancerControllers.controller('ScoringChartController', function ($http, $rootScope) {
    google.charts.load("current", {
        packages: ["corechart"]
    });
    google.charts.setOnLoadCallback(drawChart);

    function drawChart() {
        var sum = 0,
            ns = 0,
            ms = 0,
            ts = 0,
            scores = [];
        for (var i = 0; i < $rootScope.ns['data'].length; i++) {
            if ($rootScope.ns['data'][i]['score'] != undefined && $rootScope.ns['data'][i]['score'] != 0) {
                scores[i] = parseInt($rootScope.ns['data'][i]['score'])
                sum += scores[i]
            } else
                scores[i] = 0
        }
        if ($rootScope.ns['overall'] !== undefined)
            ns = $rootScope.ns['overall'];

        if ($rootScope.ms['overall'] !== undefined)
            ms = $rootScope.ms['overall'];

        if ($rootScope.ts['overall'] !== undefined)
            ts = $rootScope.ts['overall'];

        var dataFactor = google.visualization.arrayToDataTable([
            ['Factors', 'Scores', {
                role: 'style'
            }],
            ['Nuclear Features', ns, 'red'],
            ['Mitotic Rate', ms, 'blue'],
            ['Tubule Formation', ts, 'orange']
        ]);
        var optionsFactor = {
            title: 'Detailed Criteria used in Histologic Grade',
            legend: {
                position: "none"
            }
        };

        var data = google.visualization.arrayToDataTable([
            ['Nuclear Features', 'Size of Nuclei', 'Size of Nucleoli', 'Density of Chromatin', 'Thickness of Nuclear Membrane',
                'Regularity of Nuclear Contour', 'Anisonucleosis'
            ],
            ['Scores', scores[0], scores[1],
                scores[2], scores[3],
                scores[4], scores[5]
            ]
        ]);

        var options = {
            title: 'Detailed Nuclear Features',
            isStacked: true,
            legend: {
                position: 'top',
                maxLines: 3
            },
            vAxis: {
                minValue: 0
            }
        };

        if ($rootScope.ns['overall'] != null || $rootScope.ms['overall'] != null || $rootScope.ts['overall'] != null) {
            var chart = new google.visualization.ColumnChart(document.getElementById('scoresChart'));
            chart.draw(dataFactor, optionsFactor);
        } else {
            document.getElementById('scoresChart').innerHTML += 'Scoring data is not available!'
        }
        if (sum != 0) {
            var chart = new google.visualization.ColumnChart(document.getElementById('detailedNuclearChart'));
            chart.draw(data, options);
        } else {
            document.getElementById('detailedNuclearChart').innerHTML += 'Nuclear data is not available!'
        }
    }
});

cancerControllers.controller('IntroController', function ($scope, $rootScope, $state, ngIntroService) {
    var data = [];
    var ele;
    $scope.startIntro = function (s) {
        var step = 1;
        if ($rootScope.selectedDataset == undefined) {
            data = [{
                    element: '#account',
                    intro: 'You can see your name and last login time.'
                },
                {
                    element: '#navButton',
                    intro: 'It is used for navigation, click to open the content, click anywhere to close it.'
                },
                {
                    element: '#controlButtons',
                    intro: 'Floating action buttons are used for a special type of promoted action on each page'
                },
                {
                    element: '#accountInfo',
                    intro: 'It used for the account information and logout.'
                }
            ]
        } else if ($rootScope.selectedIndex == 'Annotation') {
            data = [{
                    element: '#workspace',
                    intro: 'You can see your dataset name which you are currently working on.'
                },
                {
                    element: '#controlButtons',
                    intro: `<ul>
                                <li>Get the details about the annotation. #ofMitosis, #ofTumor, #ofLumen, etc.</li>
                                <li>Delete images, if you want to restore them, go to the Bin from navigation menu.</li>
                                <li>Upload new images to the current dataset.</li>
                            </ul>`
                },
                {
                    element: '#imagesUnannotated',
                    intro: 'Unannotated images will be marked with a red label.'
                },
                {
                    element: '#imagesAnnotated',
                    intro: 'Annotated images will be marked with a green label.'
                }
            ]
        } else if ($rootScope.selectedIndex == 'Grading') {
            data = [{
                    element: '#workspace',
                    intro: 'You can see your dataset name which you are currently working on. And your annotation set made by whom.'
                },
                {
                    element: '#controlButtons',
                    intro: `<ul>
                                <li><b>Scoring Results</b> See your correlation and compare your scores with other participants. This button will appear once you completed whole set.</li>                    
                                <li><b>Annotation Details</b> Get the details about the annotation. #ofMitosis, #ofTumor, #ofLumen, etc.</li>
                                <li><b>Select Annotation</b> Select which anotation set to use for grading/scoring.</li>
                            </ul>`
                },
                {
                    element: '#imagesUnscored',
                    intro: 'Scoring undone images will be marked with a red label.'
                },
                {
                    element: '#imagesUnfinished',
                    intro: 'Scoring unfinished images will be marked with a blue label.'
                },
                {
                    element: '#imagesScored',
                    intro: 'Scoring done images will be marked with a green label.'
                }
            ]
        } else if ($rootScope.selectedIndex == 'Scoring') {
            if (s == 0)
                step = 1;
            else if (s == 1)
                step = 4;
            else if (s == 2)
                step = 9;
            else if (s == 3)
                step = 13;
            data = [{
                    element: '#histoType',
                    intro: 'Select the histologic type of the given cancer image.'
                },
                {
                    element: '#initialScore',
                    intro: `Assign the Initial Cancer Grade. There are some cases that the grade will be assigned by default.
                            <ul>
                                <li><b>Invasive Lobular Carcinoma</b> The grade 2 will be assigned and none of the grading questions will apply.</li>                    
                                <li><b>Mucinous Breast Carcinoma</b> The grade 1 will be assigned and none of the grading questions will apply.</li>
                                <li><b>Tubular Breast Carcinoma</b> The grade 1 will be assigned.</li>
                                <li><b>Undifferentiated Carcinoma</b> The grade 3 will be assigned.</li>
                            </ul>`
                },
                {
                    element: '#controlButtons',
                    intro: `<ul>
                                <li><b>Help</b> Help for the content.</li>
                                <li><b>Cancel</b> Exit from grading without saving.</li>                    
                                <li><b>Next</b> You will continue with the detailed grading questions. Don't forget, you will NOT see this page again or change anything.</li>
                            </ul>`
                },
                {
                    element: document.querySelector('#scoringSteps md-tabs-canvas'),
                    intro: 'This is your navigation menu for the 3-step scoring. To pass to next one, click here.'
                },
                {
                    element: '#caseImage',
                    intro: 'Your case image which you are scoring now.'
                },
                {
                    element: '#referenceImages',
                    intro: 'Normal breast cancer images to help you in Nuclear Scoring. You can see others by clicking tabs.'
                },
                {
                    element: '#nuclear1',
                    intro: 'Nuclear features for scoring. You will assign scores 1, 2, 3 to these features. ' +
                        'The avearage of them will be the nuclear score. If you choose \'Cannot Assess\', Score 0 will be given.'
                },
                {
                    element: '#controlButtons',
                    intro: `<ul>
                                <li><b>Help</b> Help for the content.</li>
                                <li><b>Charts</b> Show current scoring status for each step.</li>
                                <li><b>Cancel</b> Exit from grading without saving.</li>                    
                                <li><b>Done</b> You will save & exit the current scoring, you can continue later from where you left.</li>
                            </ul>`
                },
                {
                    element: '#overall',
                    intro: 'Overall mitotic rate.'
                },
                {
                    element: '#mitosis1',
                    intro: 'Is the given image a mitosis, non-mitosis, apoptosis?'
                },
                {
                    element: '#referenceButton',
                    intro: 'The given cases are marked with yellow dots in the reference image. Numbers show the IDs of the cases.'
                },
                {
                    element: '#zoomButtons',
                    intro: 'You can zoom in or out.'
                },
                {
                    element: '#overallLumen',
                    intro: 'Overall tubule formation rate.'
                },
                {
                    element: '#lumen1',
                    intro: 'Is the given image a lumen, non-lumen, blood/lymph/vessel? Yellow dots represent the case lumen.'
                }
            ]
        }
        $scope.IntroOptions = {
            steps: data,
            showBullets: false,
            showProgress: true,
            tooltipPosition: 'auto',
            exitOnOverlayClick: true,
            exitOnEsc: true,
            nextLabel: 'Next',
            prevLabel: 'Back',
            skipLabel: '<span style="color:red">Skip</span>',
            doneLabel: 'Done'
        };

        ngIntroService.clear();
        ngIntroService.setOptions($scope.IntroOptions);

        ngIntroService.onChange((element) => {
            if ($rootScope.selectedDataset == undefined) {
                if (ngIntroService.intro._currentStep == 1)
                    $scope.toggleMenu();
                else if (ngIntroService.intro._currentStep == 2) {
                    angular.element(element).scope().isOpen = true;
                    angular.element(element).scope().$apply();
                    ele = element;
                } else if (ngIntroService.intro._currentStep == 3) {
                    angular.element(ele).scope().isOpen = false;
                    angular.element(ele).scope().$apply();
                }
            } else if ($rootScope.selectedIndex == 'Annotation' || $rootScope.selectedIndex == 'Grading') {
                if (ngIntroService.intro._currentStep == 0)
                    $scope.toggleMenu();
                else if (ngIntroService.intro._currentStep == 1) {
                    angular.element(element).scope().isOpen = true;
                    angular.element(element).scope().$apply();
                    ele = element;
                } else if (ngIntroService.intro._currentStep == 2) {
                    angular.element(ele).scope().isOpen = false;
                    angular.element(ele).scope().$apply();
                }
            } else if ($rootScope.selectedIndex == 'Scoring') {
                if (step > ngIntroService.intro._currentStep)
                    return;

                if (ngIntroService.intro._currentStep == 1) {
                    angular.element(element).scope().compare = true;
                    angular.element(element).scope().$apply();
                    ele = element;
                } else if (ngIntroService.intro._currentStep == 2) {
                    angular.element(ele).scope().compare = false;
                    angular.element(ele).scope().$apply();
                    angular.element(element).scope().btn = true;
                    angular.element(element).scope().$apply();
                    ele = element;
                } else if (ngIntroService.intro._currentStep == 7) {
                    angular.element(element).scope().btn = true;
                    angular.element(element).scope().$apply();
                    ele = element;
                }
            }
        });

        ngIntroService.onAfterChange(() => {
            if ($rootScope.selectedIndex == 'Scoring') {
                if (step > ngIntroService.intro._currentStep)
                    return;

                if (ngIntroService.intro._currentStep == 3) {
                    angular.element(ele).scope().btn = false;
                    angular.element(ele).scope().$apply();
                    ngIntroService.exit();
                } else if (ngIntroService.intro._currentStep == 8) {
                    angular.element(ele).scope().btn = false;
                    angular.element(ele).scope().$apply();
                    ngIntroService.exit();
                } else if (ngIntroService.intro._currentStep == 12) {
                    ngIntroService.exit();
                }
            }
        });

        // ngIntroService.onExit(() => {
        //     if ($rootScope.selectedIndex == 'Scoring') {
        //         $state.go('scoring', {}, {
        //             'reload': 'scoring'
        //         }).then(function () {
        //             ngIntroService.clear();
        //         });
        //     }
        // });

        ngIntroService.start(step);
    };
});