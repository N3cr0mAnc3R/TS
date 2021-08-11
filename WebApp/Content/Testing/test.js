const app = new Vue({
    el: "#main-window",
    data: {
        testingProfileId: 0,
        domain: "",
        questions: [],
        answers: [],
        page: 0,
        selectedQuestion: {},
        timeStart: null,
        timeLeft: 0,
        timeAlarm: 0,
        IsTipOpened: false,
        tipPosition: {},
        needShowScore: false,
        score: null,
        timeRecording: -1,
        answerInterval: null,
        testingTime: 0,
        hasPermissions: false,
        loadObject: {
            loading: null,
            loaded: null
        },
        adminPaused: false,
        unloadedImage: "", //Если вопрос много весит, то загружаем по кусочкам
        buffer: {},
        intervalConnection: null,
        intervalConnectionLost: null,
        recordedCamera: [],
        recordedScreen: [],
        cameraRecorder: null,
        screenRecorder: null,
        peers: [],
        offer: null,
        confirmed: false,
        cameraStream: null,
        screenStream: null,
        lostConnection: false,
        timerStarted: false,
        finishScreen: false,
        pause: false,
        testing: false,
        hasCameraConnection: false,
        isCameraControl: true,
        chat: {
            IsOpened: false,
            participants: [],
            messages: [],
            Message: "",
            testingProfileId: 0
        },
        isFireFox: false,
        flagStopRec: false,
        chatSocket: null,
        videoSocket: null,
        loadedSocket: false,
        shownVideos: true,
        gotICE: false,
        sourceMaterials: [],
        counter: 0,
        loadedCount: 0,
        maxTipWidth: 540,
        unreadCount: 0,
        currentUser: {},
        queue: [{ type: 1, candidates: [] }, { type: 2, candidates: [] }],
        mediaSource: null,
        sourceBuffer: null,
        streamLoaded: null,
        streamQueue: [],
        needCalc: false,
        NameDiscipline: "",
        startedTimeRecording: 0,
        blurReady: false,
        stepCounter: 0,
        countOfAttemptScreen: 0,
        stepNumber: 5,
        //stepNumber: 240,
        calculator: {
            rows: [
                { id: 0, columns: [{ k: 7, size: 1 }, { k: 8, size: 1 }, { k: 9, size: 1 }, { k: '←', size: 1 }, { k: 'C', size: 1 }] },
                { id: 1, columns: [{ k: 4, size: 1 }, { k: 5, size: 1 }, { k: 6, size: 1 }, { k: '/', size: 1 }, { k: '*', size: 1 }] },
                { id: 2, columns: [{ k: 1, size: 1 }, { k: 2, size: 1 }, { k: 3, size: 1 }, { k: '+', size: 1 }, { k: '-', size: 1 }] },
                { id: 3, columns: [{ k: 0, size: 1 }, { k: '√', size: 1 }, { k: ',', size: 1 }, { k: '=', size: 2 }] }
            ],
            result: 0,
            resultText: '',
            first: '',
            second: '',
            isExpr: false,
            expr: ''
        },
        errorText: "",
        adminErrors: [],
        potentialPeers: [],
        Turn: {},
        QRCodeImage: "",
        QRCodeHref: "",
        openedQRPage: false
    },
    methods: {
        init: function () {
            //alert('start init');
            var self = this;
            self.isFireFox = navigator.userAgent.indexOf('Firefox') != -1;
            var ctrlDown = false,
                ctrlKey = 17,
                cmdKey = 91,
                shiftKey = 16,
                vKey = 86,
                cKey = 67;

            $(document).keydown(function (e) {
                if (e.keyCode == ctrlKey || e.keyCode == cmdKey) ctrlDown = true;
            }).keyup(function (e) {
                if (e.keyCode == ctrlKey || e.keyCode == cmdKey) ctrlDown = false;
            });

            //alert('subscription');

            $("#noCopyPaste").keydown(function (e) {
                if (ctrlDown && (e.keyCode == vKey || e.keyCode == cKey || e.keyCode == 45)) {
                    e.preventDefault();
                    return false;
                }
            });

            // Document Ctrl + C/V 
            $(document).keydown(function (e) {
                if (ctrlDown && (e.keyCode == cKey))
                    e.preventDefault();// console.log("Document catch Ctrl+C");
                if (ctrlDown && (e.keyCode == vKey))
                    e.preventDefault();//console.log("Document catch Ctrl+V");
            });

            //alert('домен');
            $.ajax({
                url: "/api/account/GetDomain",
                type: "POST",
                async: false,
                success: function (domain) {
                    self.domain = domain;
                    // alert(JSON.stringify(domain));
                }
            });
            $.ajax({
                url: "/api/account/GetLoginAndPassword",
                type: "post",
                async: false,
                success: function (info) {
                    //self.domain = domain;
                    // alert(JSON.stringify(info));
                    self.TURN = {
                        url: 'turn:turn.ncfu.ru:8443',
                        credential: info.Password,
                        username: info.Login
                    };
                }
            });
            //$(window).on('mousemove', function (e) {
            //    if (e.pageX >= $(document.body).width() - 1 || e.pageY > $(document.body).height() || e.pageX <= 1 || e.pageY <= 1) {
            //        // self.errorText = self.switchLocal(27);
            //        if (self.blurReady) {
            //            notifier([{ Type: 'error', Body: self.switchLocal(27) }]);
            //        }
            //    }
            //});
            self.questions = [];
            self.answers = [];
            self.selectedQuestion = {};
            var str = window.location.href;
            var newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            window.onerror = function (errorInfo, url, lineNumber) {
                $.ajax({
                    url: "/api/user/SaveError",
                    type: "POST",
                    async: true,
                    data: { TestingProfileId: newId, Content: errorInfo.type + ": " + errorInfo.message + " on " + url + " at line " + lineNumber },
                    success: function () {
                    },
                    error: function () {
                        location.reload();
                    }
                });
            }
            self.startTest(newId);
            self.GetQrHref(newId);
            self.testingProfileId = newId;
            //navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            //window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
            setTimeout(function () {
                self.maxTipWidth = $('#main-window').width();
            }, 500);
            //GetCurrentUser
            $.ajax({
                url: "/api/user/GetCurrentUser?Id=" + newId,
                type: "POST",
                async: true,
                success: function (user) {
                    self.currentUser = user;
                },
                error: function () {
                    location.reload();
                }
            });
            $.ajax({
                url: "/api/user/GetInfoAboutTest?Id=" + newId,
                type: "POST",
                async: true,
                success: function (info) {
                    if (info.TestingTimeRemaining <= 0) {
                        //self.finishTest();
                        //window.open('/user/waiting','_self');
                    }
                    self.testing = info.IsForTesting;
                    if (!self.testing) {
                        //  alert('start socket');
                        self.initVideoSocket();
                        self.isCameraControl = info.IsCameraControl;
                        if (!self.isFireFox) {
                            // alert('start init webcam');
                            if (info.IsCameraControl) {
                                self.initWebCam({ video: { facingMode: 'user' }, audio: true });
                            }
                            else {
                                self.hasCameraConnection = true;
                                self.isCameraControl = false;
                            }
                            // alert('start capture');

                            var is_safari = false;///^((?!chrome|android).)*safari/i.test(navigator.userAgent);

                            if (!is_safari) {
                                self.startCapture({ video: { cursor: 'always' }, audio: true });
                            }
                            else {
                                self.shownVideos = false;
                            }
                        }
                        //alert('start chat');
                        self.initChat();
                    }
                    self.timeAlarm = info.TimeAlarm;
                    self.needShowScore = info.NeedShowScore;
                    self.timeRecording = info.TimeRecording;
                    self.testingTime = info.TestingTime;
                    self.NameDiscipline = info.NameDiscipline;
                    setTimeout(function () {
                        document.title = self.switchLocal(26);
                    }, 600);
                }
            });
        },
        startIfMozilla() {
            let self = this;
            if (self.IsCameraControl) {
                self.initWebCam({ video: { facingMode: 'user' }, audio: true });
            }
            else {
                self.hasCameraConnection = true;
                self.isCameraControl = false;
            }
            // alert('start capture');

            var is_safari = false;///^((?!chrome|android).)*safari/i.test(navigator.userAgent);

            if (!is_safari) {
                self.startCapture({ video: { cursor: 'always' }, audio: true });
            }
            else {
                self.shownVideos = false;
            }
        },
        startTest: function (id) {
            var self = this;
            try {
                $.ajax({
                    url: "/api/user/StartTest?Id=" + id,
                    type: "POST",
                    async: true,
                    success: function (resp1) {
                        $.when($.ajax({
                            url: "/api/user/GetTestquestionsById?Id=" + id,
                            type: "POST",
                            async: true
                        }), $.ajax({
                            url: "/api/user/GetTestAnswersById?Id=" + id,
                            type: "POST",
                            async: true
                        }), $.ajax({
                            url: "/api/user/GetSourceMaterials?Id=" + id,
                            type: "POST",
                            async: true
                        })).then(function (resp2, resp3, resp4) {
                            //Получаем пакеты вопросов, ответов и то, как их разместить
                            var questions = resp2[0];
                            questions.map(function (question) { question.answerImage = ""; });
                            self.questions = questions;

                            //Добавляем пару своих полей для удобной работы (флаг, что выбран один из вариантов ответа, и порядок)
                            resp3[0].map(function (a) {
                                a.IsAnswered = false;
                                a.fileId = null;
                                a.TestingPackage = resp1.Packages.filter(function (b) { return b.AnswerId == a.Id; })[0];
                            });
                            self.answers = resp3[0];
                            self.timeStart = resp1.Date;
                            if (resp1.Answered && resp1.Answered.length > 0) {
                                self.questions.forEach(function (a) {
                                    resp1.Answered.forEach(function (b) {
                                        if (a.Id == b.Id) {
                                            if (a.TypeAnswerId == 1) {
                                                if (b.UserAnswer) {
                                                    a.answer = b.AnswerId;
                                                    a.answered = true;
                                                }
                                            }
                                            else if (a.TypeAnswerId == 2) {
                                                if (b.UserAnswer) {
                                                    self.answers.filter(function (c) { return c.Id == b.AnswerId; })[0].IsAnswered = true;
                                                    a.answered = true;
                                                }
                                            }
                                            else if (a.TypeAnswerId == 3) {
                                                a.answered = true;
                                                a.answer = b.UserAnswer;
                                                a.fileId = b.FileId;
                                                if (a.fileId) {
                                                    self.getAnswerFile(a, a.fileId);
                                                }
                                                else {
                                                    a.answered = false;
                                                }
                                            }
                                            else if (a.TypeAnswerId == 4) {
                                                a.answered = true;
                                                a.fileId = b.FileId;
                                                if (a.fileId) {
                                                    self.getAnswerFile(a, a.fileId);
                                                }
                                                else {
                                                    a.answered = false;
                                                }
                                            }
                                        }
                                    })
                                })
                            }
                            //Маппим ответы для вопросов, добавляем флаги загрузки, изменения и ответа в принципе
                            self.questions.map(function (a) {
                                a.Answers = self.answers.filter(function (b) { return b.QuestionId == a.Id });
                                a.IsLoaded = false;
                                a.changed = false;
                                // a.answered = a.answered ? a.answered : false;
                            });
                            //Сортируем вопросы в нужном порядке
                            self.questions.sort(function (a, b) { a.Rank - b.Rank });
                            //Сортируем ответы
                            self.questions.forEach(function (a) { a.Answers.sort(function (b, c) { b.Sort - c.Sort; }); });
                            //Текущий вопрос выбираем первый
                            self.selectQuestion(1);
                            self.sourceMaterials = resp4[0];
                            self.sourceMaterials.forEach(function (material) {
                                if (!material.IsCalc) {
                                    $.ajax({
                                        type: 'POST',
                                        async: true,
                                        url: '/api/user/GetSourceMaterial?Id=' + material.Id,
                                        success: function (data) {
                                            material.Image = data;
                                            //console.log(material);
                                        }
                                    });
                                }
                                self.needCalc = material.IsCalc || self.needCalc;
                            })
                            //self.startCheckConnection(id);
                        }, function (err) {
                            //alert(self.switchLocal(6));
                        });
                    }
                });

            }
            catch (exc) {
                //alert(exc);
                console.log(exc);
            }
        },
        recordingCamera: function (event) {
            app.recordedCamera.push(event.data);
            // var reader = new FileReader();
        },
        recordingScreen: function (event) {
            //console.log(event);
            // if (event.data && event.data.size > 0) {
            app.recordedScreen.push(event.data);
            //}
        },
        //Когда меняются значения, нужно сформировать нормально пакеты
        changeRadio: function (id) {
            var self = this;
            //Если радио, то выбранному ставим в true, остальные сбрасываем
            self.selectedQuestion.Answers.forEach(function (a) { a.IsAnswered = a.Id == id ? !a.IsAnswered : false; });
            //Ставим метку, что ответ менялся, чтобы не загружать по 100500 раз после каждого выбора вопроса
            self.selectedQuestion.changed = true;

            self.selectedQuestion.answered = true;
        },
        changeCheck: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            var self = this;

            var flag = false;
            this.selectedQuestion.Answers.forEach(function (a) { flag = a.IsAnswered || flag });
            self.selectedQuestion.answered = flag;
        },
        changeText: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            this.selectedQuestion.answered = true;
            var self = this;
            if (self.answerInterval) {
                return;
            }
            self.answerInterval = setInterval(function () {
                self.answerQuestion();
            }, 30000);
        },
        getAnswerFile: function (question, Id) {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                async: true,
                url: '/api/auditory/DownloadFile?Id=' + Id,
                success: function (data) {
                    question.answerImage = data;
                }
            });
        },
        returnToList: function () {
            window.open(window.location.protocol + '//' + window.location.hostname + '/user/waiting', '_self');
        },
        removeFile: function () {
            var self = this;
            self.selectedQuestion.Answers[0].fileId = null;
            self.selectedQuestion.fileId = null;
            self.selectedQuestion.answerImage = null;
            self.answerQuestion();
        },
        changeFile: function (e) {
            var self = this;
            var extension = e.target.files[0].name.substr(e.target.files[0].name.lastIndexOf('.'));
            var formaData = new FormData();
            formaData.append('Id', self.selectedQuestion.Answers[0].TestingPackage.Id);
            formaData.append('File', e.target.files[0]);
            formaData.append('AnswerFileExtension', extension);
            $.ajax({
                type: 'POST',
                url: '/user/SaveAnswerFile',
                data: formaData,
                contentType: false,
                processData: false,
                success: function (data) {
                    //Сбрасываем флаг изменения
                    self.selectedQuestion.changed = false;
                    //Для подсветки решённых заданий
                    self.selectedQuestion.answered = true;
                    self.selectedQuestion.fileId = data;

                    var reader = new FileReader();
                    reader.onload = function () {
                        self.selectedQuestion.answerImage = reader.result.substr(reader.result.indexOf(',') + 1);
                    };
                    reader.readAsDataURL(e.target.files[0]);
                    self.answerQuestion();
                }
            });

            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            this.selectedQuestion.answered = true;
            //self.AnswerFileExtension = ;
        },
        downloadFile: function (id) {
            window.open('/auditory/DownloadFile?Id=' + id, '_blank');
        },
        IsQuestionAnswered: function (id) {
            var self = this;
            var flag = false;
            self.questions.forEach(function (a) { flag = (a.Rank === id && a.answered) || flag });
            return flag;
        },
        selectQuestion: function (id) {
            var self = this;
            //Если выбран несуществующий номер (кто-то нажал на назад на первом вопросе), то ничего не делать
            if (id == 0 || id == self.questions.length + 1) return;
            //Текущий вопрос для подсветки
            self.page = id;
            //Если вопрос выбран и менялся вариант ответа
            if (self.selectedQuestion.Id && self.selectedQuestion.changed) {
                self.answerQuestion();
            }
            //Находим новый вопрос
            self.selectedQuestion = self.questions.filter(function (a) { return a.Rank == id; })[0];
            //Если не загружали изображения, то загружаем
            if (!self.selectedQuestion.IsLoaded) {
                //Изображение вопроса
                self.loadObject.loaded = false;
                self.loadObject.loading = true;
                self.counter = 0;
                try {
                    self.askQuestionImagePart(1);
                    let currentQuestion = self.selectedQuestion;
                    self.loadedCount += 1 + currentQuestion.Answers.length;
                    //Изображения ответов
                    if ([1, 2].indexOf(currentQuestion.TypeAnswerId) != -1) {
                        //if ([1, 2].indexOf(self.selectedQuestion.TypeAnswerId) != -1) {
                        currentQuestion.Answers.forEach(function (a) {
                            //self.selectedQuestion.Answers.forEach(function (a) {
                            $.ajax({
                                type: 'POST',
                                dataType: 'json',
                                url: '/api/user/GetAnswerImage?Id=' + a.Id,
                                async: true,
                                success: function (d) {
                                    a.AnswerImage = d.AnswerImage;
                                    self.counter++;
                                    self.loadedCount--;
                                    if (self.loadedCount == 0) {
                                        //if (self.counter == currentQuestion.Answers.length + 1) {
                                        //if (self.counter == self.selectedQuestion.Answers.length + 1) {
                                        self.loadObject.loading = false;
                                        self.loadObject.loaded = true;
                                        self.startTimer();
                                        //self.loadTestObject.loading = false;
                                        //self.loadTestObject.loaded = true;
                                    }
                                },
                                error: function () {
                                    location.reload();
                                }
                            });
                        });
                    }
                }
                catch {
                    location.reload();
                }
            }
        },
        askQuestionImagePart: function (part) {
            var self = this;
            let currentQuestion = self.selectedQuestion;
            $.ajax({
                type: 'POST',
                async: true,
                url: '/api/user/GetQuestionImage?Id=' + currentQuestion.Id + '&Type=' + currentQuestion.TypeAnswerId + '&part=' + part,
                //url: '/api/user/GetQuestionImage?Id=' + self.selectedQuestion.Id + '&Type=' + self.selectedQuestion.TypeAnswerId + '&part=' + part,
                success: function (d) {
                    if (!self.unloadedImage || part == 1) {
                        //self.selectedQuestion.QuestionImage = "";
                        currentQuestion.QuestionImage = "";
                        self.unloadedImage = "";
                    }
                    if (d.indexOf('flag') != -1 && d.indexOf('flag') < 3) {
                        //console.log('agaibn');
                        self.unloadedImage += d.substr(4);
                        //self.selectedQuestion.QuestionImage += d.QuestionImage.substr(4);
                        self.askQuestionImagePart(part + 1);
                    }
                    else {
                        //console.log('loaded');
                        self.unloadedImage += d;
                        currentQuestion.QuestionImage = self.unloadedImage;
                        //self.selectedQuestion.QuestionImage = self.unloadedImage;
                        //После загрузки ставим метку, что загружено
                        self.counter++;
                        self.loadedCount--;
                        currentQuestion.IsLoaded = true;
                        //self.selectedQuestion.IsLoaded = true;
                        if (self.loadedCount == 0 || [3, 4].indexOf(currentQuestion.TypeAnswerId) != -1) {
                            //if (self.counter == currentQuestion.Answers.length + 1 || [3, 4].indexOf(currentQuestion.TypeAnswerId) != -1) {
                            //if (self.counter == self.selectedQuestion.Answers.length + 1 || [3, 4].indexOf(self.selectedQuestion.TypeAnswerId) != -1) {
                            self.loadObject.loading = false;
                            self.loadObject.loaded = true;
                            self.startTimer();

                            setTimeout(function () {
                                self.maxTipWidth = $('#main-window').width() < 500 ? $('#main-window').width() : 540;
                            }, 500);
                        }
                        //self.selectedQuestion.QuestionImage += d.QuestionImage;
                    }

                }
            });
        },
        getHeight: function (Id) {
            var height = $('#answer-' + Id).height();
            if (height > 30 && height < 70) {
                return 'double';
            }
            else if (height > 70) {
                return 'triple';
            }
        },
        answerQuestion: function () {
            var self = this;
            var answers = [];
            //Запаковываем все ответы для предыдущего вопроса
            if ([1, 2].indexOf(self.selectedQuestion.TypeAnswerId) != -1) {
                self.selectedQuestion.Answers.forEach(function (item) {
                    answers.push({ TestingPackageId: item.TestingPackage.Id, TestingTime: 3, UserAnswer: item.IsAnswered ? "1" : null });
                })
            }
            else if (self.selectedQuestion.TypeAnswerId == 3) {
                answers.push({ TestingPackageId: self.selectedQuestion.Answers[0].TestingPackage.Id, TestingTime: 3, UserAnswer: self.selectedQuestion.answer, FileId: self.selectedQuestion.Answers[0].fileId });
            }
            else if (self.selectedQuestion.TypeAnswerId == 4) {
                answers.push({ TestingPackageId: self.selectedQuestion.Answers[0].TestingPackage.Id, TestingTime: 3, UserAnswer: null, FileId: self.selectedQuestion.fileId });
            }
            $.ajax({
                type: 'POST',
                url: '/api/user/UpdatequestionAnswer',
                async: false,
                data: { answers: answers },
                success: function () {
                    //Сбрасываем флаг изменения
                    self.selectedQuestion.changed = false;
                    //Для подсветки решённых заданий
                    self.selectedQuestion.answered = true;
                    if (/*self.selectedQuestion.TypeAnswerId == 3 ||*/ self.selectedQuestion.TypeAnswerId == 4) {
                        if (!self.selectedQuestion.Answers[0].fileId) {
                            self.selectedQuestion.answered = false;
                        }
                        else {
                            self.selectedQuestion.fileId = self.selectedQuestion.Answers[0].fileId;
                        }
                    }
                }
            });
        },
        startCheckConnection: function (id) {
            var self = this;
            self.intervalConnection = setInterval(
                function () {
                    $.ajax({
                        url: "/api/user/HasConnection",
                        type: "POST",
                        async: true,
                        data: {
                            TestingProfileId: id,
                            NeedDispose: false
                        },
                        success: function (data) {
                            if (data == null || data == undefined) {
                                self.pause = true;
                                if (!self.intervalConnectionLost) {
                                    self.intervalConnectionLost = setTimeout(function () {
                                        clearTimeout(self.intervalConnectionLost);
                                        self.lostConnection = true;
                                    }, 60000);
                                }
                            }
                            else {
                                if (data == true) {
                                    location.reload();
                                }
                                else {
                                    if (self.intervalConnectionLost) {
                                        clearTimeout(self.intervalConnectionLost);
                                        self.intervalConnectionLost
                                        self.lostConnection = false;
                                        self.pause = false;
                                    }
                                }
                            }
                            //if (data !== 1) {
                            //    self.pause = true;
                            //    if (!self.intervalConnectionLost) {
                            //        self.intervalConnectionLost = setTimeout(function () {
                            //            clearTimeout(self.intervalConnectionLost);
                            //            self.lostConnection = true;
                            //        }, 60000);
                            //    }
                            //}
                            //else {
                            //    if (self.intervalConnectionLost) {
                            //        clearTimeout(self.intervalConnectionLost);
                            //        self.lostConnection = false;
                            //        self.pause = false;
                            //    }
                            //}
                        },
                        error: function () {
                            self.pause = true;
                            if (!self.intervalConnectionLost) {
                                self.intervalConnectionLost = setTimeout(function () {
                                    clearTimeout(self.intervalConnectionLost);
                                    self.lostConnection = true;
                                }, 60000);
                            }
                        },
                        async: true
                    });
                }, 5000);
        },
        startTimer: function () {
            var self = this;
            if (self.timerStarted || !self.hasPermissions || !self.hasCameraConnection) return;
            self.timerStarted = true;
            self.timeLeft = self.timeStart ? self.timeStart : 1800;
            self.startedTimeRecording = self.timeLeft;
            // console.log(self.timeLeft);
            self.interval = setInterval(function () {
                if (self.lostConnection || self.adminPaused) return;
                self.timeLeft--;
                if (self.timeLeft <= 0) {
                    clearInterval(self.interval);

                    clearInterval(self.intervalConnection);
                    try {
                        self.finishTest();
                    }
                    catch {
                        setTimeOut(function () {
                            self.finishTest();
                        }, 5000);
                    }
                }
                //console.log(self.startedTimeRecording, self.timeLeft, self.timeRecording);
                if (self.startedTimeRecording - self.timeLeft >= self.timeRecording) {
                    if (self.flagStopRec) {
                        return;
                    }
                    setTimeout(function () {
                        if (self.cameraRecorder) self.cameraRecorder.ondataavailable = null;
                        if (self.screenRecorder) self.screenRecorder.ondataavailable = null;
                        self.finishRecord(self);
                    }, 2000);

                }
            }, 1000);
        },
        finishRecord: function (self) {
            //console.log(self.flagStopRec);
            if (self.flagStopRec) {
                return;
            }
            //console.log(self.recordedCamera, self.recordedScreen);
            self.flagStopRec = true;
            if (self.cameraRecorder && self.cameraRecorder.state != 'inactive') self.cameraRecorder.stop();
            if (self.screenRecorder && self.screenRecorder.state != 'inactive') self.screenRecorder.stop();
            self.bufferCamera = new Blob(self.recordedCamera, { type: 'video/webm' });
            self.bufferScreen = new Blob(self.recordedScreen, { type: 'video/webm' });
            var formaData1 = new FormData();

            formaData1.append('Id', self.testingProfileId);
            formaData1.append('Type', 1);
            formaData1.append('File', self.bufferCamera, self.showTimeLeft().replace(':', '_'));
            var formaData2 = new FormData();

            formaData2.append('Id', self.testingProfileId);
            formaData2.append('Type', 2);
            formaData2.append('File', self.bufferScreen, self.showTimeLeft().replace(':', '_'));
            let index = 0;
            $.ajax({
                url: "/user/SaveVideoFile",
                type: "POST",
                data: formaData1,
                contentType: false,
                processData: false,
                success: function () {
                    self.recordedCamera = [];
                    index++;
                    if (index == 2) {
                        self.reInitRecorders();
                    }
                }
            });
            $.ajax({
                url: "/user/SaveVideoFile",
                type: "POST",
                data: formaData2,
                contentType: false,
                processData: false,
                success: function () {
                    index++;
                    if (index == 2) {
                        self.reInitRecorders();
                    }
                },
                error: function () {
                    self.reInitRecorders();
                }
            });

        },
        reInitRecorders() {
            let self = this;
            //console.log("reInit recording");
            //console.log(self.stepCounter, self.stepNumber);
            self.recordedScreen = [];
            //console.log("Will start after" + (self.stepCounter * self.stepNumber));
            setTimeout(function () {
                //console.log("Started timeout", new Date());
                self.flagStopRec = false;
                self.startedTimeRecording = self.timeLeft;
                //self.cameraRecorder.stop();
                if (self.cameraRecorder) {
                    self.cameraRecorder.ondataavailable = self.recordingCamera;
                    self.cameraRecorder.start(100);
                }
                if (self.screenRecorder) {
                    //self.screenRecorder.stop();
                    self.screenRecorder.ondataavailable = self.recordingScreen;
                    self.screenRecorder.start(100);
                }
            }, (self.stepCounter * 5 + self.stepNumber) * 1000 * 60);
            self.stepCounter++;
            self.stepNumber += (self.stepCounter * 5);
        },
        initChat: function () {
            var self = this;
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.chatSocket = new WebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
            //} else {
            //    self.chatSocket = new MozWebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
            //}
            if (typeof (WebSocket) !== 'undefined') {
                self.chatSocket = new WebSocket(self.domain + "/ChatHandler.ashx");
            } else {
                self.chatSocket = new MozWebSocket(self.domain + "/ChatHandler.ashx");
            }
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.chatSocket = new WebSocket("ws://" + window.location.hostname + "/ChatHandler.ashx");
            //} else {
            //    self.chatSocket = new MozWebSocket("ws://" + window.location.hostname + "/ChatHandler.ashx");
            //}
            self.chatSocket.onopen = function () {
                self.chatSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId }));
                self.getMessages(self.testingProfileId);
            };
            self.chatSocket.onmessage = function (msg) {
                //self.messages.push(msg);
                var message;
                if (msg.data.indexOf("\0") != -1) {
                    message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                }
                else {
                    message = JSON.parse(msg.data);
                }
                message.Date = new Date(Number(message.Date.substr(message.Date.indexOf('(') + 1, message.Date.indexOf(')') - message.Date.indexOf('(') - 1)));

                $('#msg-audio')[0].play();
                self.chat.messages.push(message);

                if (!message.IsSender) {
                    notifier([{ Type: 'success', Body: message.Message }]);
                }
                var maxId = 0;
                self.chat.messages.forEach(function (msg) {
                    maxId = msg.Id > maxId ? msg.Id : maxId;
                });
                if (maxId != 0) {
                    setTimeout(function () {
                        $('#message-' + maxId)[0].scrollIntoView();
                    }, 20);
                }

                if (!self.chat.IsOpened) {
                    self.unreadCount++;
                }
            };
            self.chatSocket.onclose = function (event) {
                self.initChat();
                //console.log('oh-oh');
                // alert('Мы потеряли её. Пожалуйста, обновите страницу');
            };
        },
        subscribeEnter: function () {
            var self = this;
            $(document).on('keyup', function () { self.beforeSend(self); });
        },
        beforeSend: function (self) {
            if (event.keyCode == 13 && !event.shiftKey) {
                self.sendMessage(self);
            }
        },
        isMe: function (message) {
            var self = this;
            return message.UserIdFrom == self.currentUser || message.IsSender;
        },
        initVideoSocket: function () {
            var self = this;

            //if (typeof (WebSocket) !== 'undefined') {
            //    self.videoSocket = new WebSocket("wss://" + window.location.hostname + "/streamhandler.ashx");
            //} else {
            //    self.videoSocket = new MozWebSocket("wss://" + window.location.hostname + "/streamhandler.ashx");
            //}
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.videoSocket = new WebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
            //} else {
            //    self.videoSocket = new MozWebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
            //}
            if (typeof (WebSocket) !== 'undefined') {
                try {
                    self.videoSocket = new WebSocket(self.domain + "/StreamHandler.ashx");
                }
                catch {
                    notifier([{ Type: 'error', Body: self.switchLocal(16) }]);
                }
            } else {
                try {
                    self.videoSocket = new MozWebSocket(self.domain + "/StreamHandler.ashx");
                }
                catch {
                    notifier([{ Type: 'error', Body: self.switchLocal(16) }]);
                }
            }
            self.videoSocket.onopen = function () {
                //console.log('init videosocket');
                self.videoSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId }));
                self.videoSocket.send(JSON.stringify({ TestingProfileId: self.testingProfileId, IsSender: true, startOffer: true }));
            };

            self.videoSocket.onmessage = function (msg) {
                var message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));

                if (!message.IsSender) {
                    if (message.candidate && message.candidate != '{}') {
                        var candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                        //self.queue.push(candidate);


                        var queue = self.queue.filter(function (item) { return item.type == message.type; })[0];
                        //console.log(queue.candidates);
                        queue.candidates.push(candidate);
                    }
                    else if (message.requestOffer) {
                        //console.log('start request');
                        // self.reInitPeers();
                        console.log(message.typeOffer);
                        self.initRTCPeer(message.typeOffer, message.uid);
                        /*self.initRTCPeer(1, message.uid);*/
                        //self.initRTCPeer(2, message.uid);
                    }
                    else if (message.reloadRequest) {
                        location.href = location.href;
                        //window.reload(true);
                    }
                    else if (message.requestScreenOff) {
                        self.hasCameraConnection = true;
                    }
                    else if (message.requestCapture) {
                        self.startCapture({ video: { cursor: 'always' }, audio: true });
                    }
                    else if (message.requestFinish) {
                        notifier([{ Type: 'error', Body: self.switchLocal(28) }]);
                        self.finishTest();
                    }
                    else if (message.requestCollapse) {
                        self.shownVideos = !self.shownVideos;
                    }
                    else if (message.requestLoadFile) {
                        self.saveQrCode();
                        self.openedQRPage = true;
                    }
                    else if (message.gotUserAnswer) {
                        $.ajax({
                            url: "/api/user/GetUserAnswer?Id=" + message.Id,
                            type: "POST",
                            async: true,
                            success: function (data) {
                                self.selectedQuestion.fileId = message.Id;
                                self.selectedQuestion.answerImage = data;
                                self.selectedQuestion.answered = true;
                            }
                        });
                    }
                    else if (message.requestTimeLeft) {
                        //message.uid
                        self.videoSocket.send(JSON.stringify({ TestingProfileId: self.testingProfileId, IsSender: true, TimeLeft: self.timeLeft }));
                    }
                    else if (message.requestViolation) {
                        var errorBody = "";
                        switch (message.violation) {
                            case 1: errorBody = self.switchLocal(39); break;
                            case 2: errorBody = self.switchLocal(40); break;
                            case 3: errorBody = self.switchLocal(41); break;
                            case 4: errorBody = self.switchLocal(42); break;
                            case 5: errorBody = self.switchLocal(43); break;
                            case 6: errorBody = self.switchLocal(44); break;
                            default: errorBody = self.switchLocal(45);
                        }
                        notifier([{ Type: 'error', Body: errorBody }]);
                        console.log($('.main-wrapper'));
                        $('.main-wrapper').addClass('shaker-shaker');
                        setTimeout(function () {
                            $('.main-wrapper').removeClass('shaker-shaker');
                        }, 2000)
                    }
                    else if (message.answer) {
                        //var interval = setInterval(function () {
                        //console.log('start interval');
                        var found = self.peers.filter(function (item) { return item.type == message.type && item.uid == message.uid; })[0];
                        //console.log('found', found);
                        if (found) {
                            //  clearInterval(interval);
                            var peer = found.peer;
                            peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.answer)), function (r) {

                                var queue = self.queue.filter(function (item) { return item.type == message.type; })[0];
                                queue.candidates.forEach(function (candidate) {
                                    peer.addIceCandidate(candidate);
                                });
                                //console.log(r);
                            }, function (r) { console.log(r); });


                        }
                        // }, 500);
                    }
                    else if (message.requestPause) {
                        self.adminPaused = !self.adminPaused;

                    }
                    else if (message.requestCloseChat) {
                        self.chat.IsOpened = !self.chat.IsOpened;
                        setTimeout(function () {
                            $('#full-chat-wrapper')[0].scrollIntoView();
                        }, 300)
                        //#full-chat-wrapper
                    }
                }
            };

            self.videoSocket.onclose = function () {
                //console.log('close video');
                self.initVideoSocket();
            }
        },
        reInitPeers: function () {
            var self = this;
            self.queue = [{ type: 1, candidates: [] }, { type: 2, candidates: [] }];
            self.gotICE = false;
            self.peers.forEach(function (peerWithType) {
                peerWithType.peer.close();
                peerWithType.peer = null;
            });
        },
        initWebCam: function (params) {
            var self = this;
            navigator.mediaDevices.getUserMedia(params).then(function (videostream) {/*callback в случае удачи*/

                videostream.oninactive = function (er) {
                    self.initWebCam(params);
                    self.cameraStream = null;
                    self.cameraRecorder = null;
                    self.hasCameraConnection = false;
                    $('#video1')[0].srcObject = null;
                };
                self.cameraStream = videostream;
                self.hasCameraConnection = true;
                var options;
                self.startTimer();
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    options = { mimeType: 'video/webm; codecs=vp9' };
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                    options = { mimeType: 'video/webm; codecs=vp8' };
                }
                self.cameraRecorder = new MediaRecorder(videostream, options);
                self.cameraRecorder.ondataavailable = self.recordingCamera;
                self.cameraRecorder.start(100);

                //console.log("Start Recording Camera", new Date());

                //self.initRTCPeer(1, uid);
                $('#video1')[0].srcObject = videostream;



            }).catch(
                function (er) {/*callback в случае отказа*/
                    self.initWebCam({ video: { facingMode: 'user' } });

                    //alert("Ваш браузер не поддерживается");
                });

        },
        b64toBlob: function (b64Data, sliceSize = 512) {
            // console.log(b64Data.substr(b64Data.indexOf('base64') + 7));
            //var self = this;
            //for (var i = 0; i < data.length; i++) {
            //    var byteCharacters = atob(data[i].substr(data[i].indexOf('base64') + 7));

            //    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            //        var slice = byteCharacters.slice(offset, offset + sliceSize);

            //        var byteNumbers = new Array(slice.length);
            //        for (var i = 0; i < slice.length; i++) {
            //            byteNumbers[i] = slice.charCodeAt(i);
            //        }

            //        var byteArray = new Uint8Array(byteNumbers);
            //        self.queueArray.push(byteArray);
            //    }
            //}

            //var blob = new Blob(self.queueArray, {
            //    type: 'video/webm'
            //});

            var byteCharacters = atob(b64Data.substr(b64Data.indexOf('base64') + 7));
            var byteArrays = [];

            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                var slice = byteCharacters.slice(offset, offset + sliceSize);

                var byteNumbers = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                var byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            var blob = new Blob(byteArrays, {
                type: 'video/webm'
            });
            return blob;
        },
        pushBtn: function (char) {
            var self = this;
            var isFirst = self.calculator.second == '' && !self.calculator.isExpr;
            var middle = isFirst ? self.calculator.first : self.calculator.second;
            if (self.calculator.resultText.length > 19 && typeof char == "number") {
                return;
            }
            //if(self.calculator.first )
            self.calculator.resultText += char;
            if (typeof char == "number") {
                if (self.calculator.result != 0 && !self.calculator.isExpr) {
                    self.calculator.result = 0;
                    self.calculator.resultText = '';
                    self.calculator.first = '';
                    self.calculator.second = '';
                    self.calculator.resultText = char;
                    middle = '';
                }
                if (middle != 0 && !self.calculator.isExpr) {
                    middle += '' + char;
                    if (isFirst) {
                        self.calculator.first = middle;
                    }
                    else {
                        self.calculator.second = middle;
                    }
                }
                else if (middle == 0 && !self.calculator.isExpr) {
                    middle = '' + char;
                    if (isFirst) {
                        self.calculator.first = middle;
                    }
                    else {
                        self.calculator.second = middle;
                    }
                }
                else {
                    middle = '' + char;
                    self.calculator.second = middle;
                }
                self.calculator.isExpr = false;
            }
            else {
                if (char == ',') {
                    if ((typeof middle == 'number' && (middle ^ 0) == middle) || (typeof middle == 'string' && middle.indexOf('.') == -1)) {
                        middle += '.';
                        if (isFirst) {
                            self.calculator.first = middle;
                        }
                        else {
                            self.calculator.second = middle;
                        }
                    }
                    else {
                        self.calculator.resultText = self.calculator.resultText.substr(0, self.calculator.resultText.length - 1);
                    }
                }
                else if (char == '←') {
                    if (isFirst) {
                        self.calculator.first = ('' + self.calculator.first).substr(0, self.calculator.first.length - 1);
                    }
                    else {
                        self.calculator.second = ('' + self.calculator.second).substr(0, self.calculator.second.length - 1);
                    }
                    if (self.calculator.isExpr) {
                        self.calculator.isExpr = false;
                        self.calculator.expr = '';
                    }
                    self.calculator.resultText = self.calculator.resultText.substr(0, self.calculator.resultText.length - 2);
                    self.calculator.resultText = '' + self.calculator.result;
                    //  middle = middle.substr(0, middle.length - 1);
                }
                else if ('+-*/'.indexOf(char) != -1) {
                    var flag = false;

                    if (self.calculator.expr != '') {
                        self.calc();
                        flag = true;
                    }
                    self.calculator.isExpr = true;
                    self.calculator.expr = char;
                    if (flag) {

                        self.calculator.resultText += char;
                    }
                    //self.calculator.resultText = middle;
                }
                else if ('√' == char) {
                    self.calculator.result = Math.sqrt(parseFloat((self.calculator.first + '').replace(/,/g, '.')));
                    self.calculator.resultText = '' + self.calculator.result;
                    self.calculator.isExpr = false;
                    self.calculator.first = self.calculator.result;
                    self.calculator.expr = '';
                }
                else if (char == 'C') {

                    self.calculator.result = 0;
                    self.calculator.resultText = '';
                    self.calculator.first = '';
                    self.calculator.second = '';
                    self.calculator.isExpr = false;
                    self.calculator.expr = '';
                }
                else {
                    self.calc();
                }
            }
            $('#text-area').text(self.calculator.resultText);
        },
        calc: function () {
            var self = this;
            self.calculator.first = parseFloat((self.calculator.first + '').replace(/,/g, '.'));
            self.calculator.second = parseFloat((self.calculator.second + '').replace(/,/g, '.'));

            switch (self.calculator.expr) {
                case '+': self.calculator.result = self.calculator.first + self.calculator.second; break;
                case '-': self.calculator.result = self.calculator.first - self.calculator.second; break;
                case '*': self.calculator.result = self.calculator.first * self.calculator.second; break;
                case '/': self.calculator.result = self.calculator.first / self.calculator.second; break;
                default: break;
            }
            self.calculator.result = +self.calculator.result.toFixed(6);
            self.calculator.resultText = '' + self.calculator.result;
            self.calculator.first = self.calculator.result;
            self.calculator.second = '';
            self.calculator.isExpr = false;
            self.calculator.expr = '';
        },
        finishTest: function () {
            var self = this;
            self.loadObject.loading = true;
            self.loadObject.loaded = false;
            self.answerQuestion();
            //var obj = $('#video2')[0];
            //var src = URL.createObjectURL(self.bufferCamera);
            //var src1 = URL.createObjectURL(self.bufferScreen);
            self.finishRecord(self);
            self.finishScreen = true;

            try {
                $(document).off('click', self.goToFullScreen);
                document.exitFullscreen();
            }
            catch {

            }
            $.ajax({
                url: "/api/user/FinishTest?Id=" + self.testingProfileId,
                type: "POST",
                async: true,
                success: function () {
                    if (self.needShowScore) {
                        $.ajax({
                            url: "/api/user/GetScore?Id=" + self.testingProfileId,
                            type: "POST",
                            async: true,
                            success: function (info) {
                                self.score = info;
                                self.loadObject.loading = false;
                                self.loadObject.loaded = true;
                            }
                        });
                    }
                    else {
                        self.loadObject.loading = false;
                        self.loadObject.loaded = true;
                    }
                }
            });



            //$.ajax({
            //    url: "/user/HasConnection",
            //    type: "POST",
            //    async: true,
            //    data: {
            //        TestingProfileId: self.testingProfileId,
            //        NeedDispose: true
            //    }
            //});
            clearTimeout(self.intervalConnectionLost);
            clearTimeout(self.intervalConnection);
            //self.init();
        },
        goToFullScreen() {
            if ((!document.mozFullScreen && !document.webkitIsFullScreen)) {
                var element = $('html')[0];
                var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
                requestMethod.call(element);
            }
        },
        startCapture: function (displayMediaOptions) {
            var self = this;
            //var captureStream = null;
            // alert(JSON.stringify(navigator.mediaDevices));
            navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function (Str) {
                if (self.isCameraControl) {
                    $('#video2')[0].srcObject = Str;
                }

                self.hasPermissions = true;
                self.startTimer();
                self.screenStream = Str;
                self.isFireFox = false;
                $(document).on('click', self.goToFullScreen);

                Str.oninactive = function (er) {
                    console.log(er);
                    if (!self.finishScreen) {
                        self.startCapture(displayMediaOptions);
                    }
                };
                var options;
                if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                    options = { mimeType: 'video/webm; codecs=vp9' };
                } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                    options = { mimeType: 'video/webm; codecs=vp8' };
                }
                //var tracks = Str.getTracks();
                //track.forE
                //console.log(options);
                // self.initRTCPeer(2, uid);
                self.screenRecorder = new MediaRecorder(Str, options);
                self.screenRecorder.ondataavailable = self.recordingScreen;
                self.screenRecorder.start(100);
                //console.log("Start Recording", new Date());
                $(window).on('blur', function (e) {
                    if (self.blurReady) {
                        notifier([{ Type: 'error', Body: self.switchLocal(27) }]);
                        document.title = "!!!!";
                    }
                    self.blurReady = true;
                });
                $(window).on('focus', function (e) {
                    if (self.blurReady) {
                        document.title = self.switchLocal(26);
                    }
                    self.blurReady = true;
                });
                setTimeout(function () {
                    self.shownVideos = false;
                }, 5000)
                //   console.log(Str);
            })
                .catch(function (err) {
                    console.error("Error:" + err);
                    self.startCapture(displayMediaOptions);
                    return;
                });
        },
        subscribeExc() {
            event.stopPropagation();
            event.preventDefault();
            if (event.keyCode == 27) {
                app.toggleChat();
                $(document).off('keydown', app.subscribeExc);
            }
        },
        //download: function () {
        //    $.ajax({
        //        url: "GetFileBase?Id=67",
        //        type: "POST",
        //        async: true,
        //        success: function (data) {
        //            const downloadLink = document.createElement('a');
        //            document.body.appendChild(downloadLink);

        //            downloadLink.href = data;
        //            downloadLink.target = '_self';
        //            downloadLink.download = "na.webm";
        //            downloadLink.click();
        //        }
        //    });
        //},
        showCountLeft: function () {
            var self = this;
            var count = self.questions.length;

            self.questions.forEach(function (a) { count = a.answered ? (count - 1) : count });
            if (count > 0) {
                if (localStorage["localization"] == 1) {
                    var str = count + ' ';
                    var procent = count % 10;
                    if (procent == 1) { str += 'вопрос'; }
                    else if (procent < 5 && procent > 1) { str += 'вопроса'; }
                    else { str += 'вопросов'; }
                    return str;
                }
                else return count > 1 ? 'questions' : 'question';
            }
            else {
                return null;
            }
        },
        showTimeLeft: function () {
            var self = this;
            return Math.floor(self.timeLeft / 60) + ':' + self.isZeroNeed(self.timeLeft % 60);
        },
        isZeroNeed: function (value) {
            if (value < 10)
                return '0' + value;
            else return value;
        },
        openTip: function () {
            var self = this;
            //self.tipPosition.width = $('#panel-right').width();
            //$('#panel-right').css('right', 0 - self.tipPosition.width);
            if (this.IsTipOpened) {
                $('#panel-right').css('right', 0 - self.tipPosition.width);
            }
            else {
                $('#panel-right').css('right', '');

            }
            this.IsTipOpened = !this.IsTipOpened;
        },
        startResize: function () {
            var self = this;
            event.preventDefault();
            $(document).on('mousemove', function () {

                self.resizing(self);
            });
            self.tipPosition.width = $('#panel-right').width();
            self.tipPosition.start = $(document).width();// - $('#panel-right').width();
            //  console.log(self.tipPosition);
        },
        resizing: function (self) {
            $(document).on('mouseup', function () { self.stopResizing(self); });
            if (self.tipPosition.start - event.pageX > 320) {
                $('#panel-right').width(self.tipPosition.start - event.pageX);
                self.maxTipWidth = self.tipPosition.start - event.pageX - 20;
            }
        },
        stopResizing: function (self) {
            self.tipPosition.width = $('#panel-right').width();
            $(document).off('mousemove');
            $(document).off('mouseup');
        },
        startResizeTouch: function () {
            var self = this;
            $(document).on('touchmove', function () { self.resizingTouch(self); });
            self.tipPosition.width = $('#panel-right').width();
            self.tipPosition.start = $(document).width();// - $('#panel-right').width();
            //  console.log(self.tipPosition);
        },
        resizingTouch: function (self) {
            $(document).on('touchend', function () { self.stopResizingTouch(self); });
            $('#panel-right').width(self.tipPosition.start - event.changedTouches[0].pageX);
            self.maxTipWidth = self.tipPosition.start - event.changedTouches[0].pageX - 20;
        },
        stopResizingTouch: function (self) {
            self.tipPosition.width = $('#panel-right').width();
            $(document).off('touchmove');
            $(document).off('touchend');
        },

        toggleChat: function () {
            var self = this;
            self.chat.IsOpened = !self.chat.IsOpened;
            if (self.chat.IsOpened) {
                self.unreadCount = 0;
                setTimeout(function () {
                    $('#full-chat-wrapper')[0].scrollIntoView();
                }, 20);
                var maxId = 0;
                self.chat.messages.forEach(function (msg) {
                    maxId = msg.Id > maxId ? msg.Id : maxId;
                });
                if (maxId != 0) {
                    $(document).on('keydown', self.subscribeExc);
                    setTimeout(function () {
                        $('#message-' + maxId)[0].scrollIntoView();
                    }, 20);
                }
            }
        },
        toggleTypeChat: function () {
            var self = this;
            if (self.chat.IsOpened) {
                self.chat.IsChatVOpened = !self.chat.IsChatVOpened;
                self.chat.IsChatMOpened = !self.chat.IsChatMOpened;
            }
        },
        getMessages: function (newId) {
            var self = this;
            //GetChatMessages
            $.ajax({
                url: "/api/user/GetChatMessages?Id=" + newId,
                type: "POST",
                async: false,
                success: function (messageList) {
                    var messages = messageList;
                    messages.map(function (a) { a.Date = new Date(a.Date); });
                    //messages.map(function (a) { a.Date = new Date(Number(a.Date.substr(a.Date.indexOf('(') + 1, a.Date.indexOf(')') - a.Date.indexOf('(') - 1))); });
                    self.chat.messages = messages;
                },
                error: function () {
                    location.reload;
                }
            });
        },
        saveQrCode: function () {
            var self = this;
            //GetChatMessages
            $.ajax({
                url: "/api/user/SaveQrCode?Id=" + self.testingProfileId + '&TestingPackageId=' + self.selectedQuestion.Answers[0].TestingPackage.Id,
                type: "POST",
                async: true,
                success: function (qrString) {
                    self.QRCodeImage = qrString;
                }
            });
        },
        GetQrHref: function (newId) {
            var self = this;
            //GetChatMessages
            $.ajax({
                url: "/api/user/GetQrCode?Id=" + newId,
                type: "POST",
                async: true,
                success: function (qrString) {
                    self.QRCodeHref = qrString;
                }
            });
        },
        sendMessage: function (sself) {
            var self = sself ? sself : this;
            if (!self.chat || self.chat.Message == "" || self.chat.Message.trim() == "") return;
            self.chatSocket.send(JSON.stringify({ Message: self.chat.Message, Date: new Date(), IsSender: true, TestingProfileId: self.testingProfileId, ParentId: null }));
            self.chat.Message = "";
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        },
        initRTCPeer: function (type, uid) {
            this.countOfAttemptScreen++;
            if (this.countOfAttemptScreen == 100) {
                return;
            }
            //console.log('init rtcpeer');
            var self = this;
            var TURN = {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            };

            var configuration = {
                iceServers: [{ url: 'stun:stun01.sipphone.com' },
                { url: 'stun:stun.ekiga.net' },
                { url: 'stun:stun.fwdnet.net' },
                { url: 'stun:stun.ideasip.com' },
                { url: 'stun:stun.iptel.org' },
                { url: 'stun:stun.rixtelecom.se' },
                { url: 'stun:stun.schlund.de' },
                { url: 'stun:stun.l.google.com:19302' },
                { url: 'stun:stun1.l.google.com:19302' },
                { url: 'stun:stun2.l.google.com:19302' },
                { url: 'stun:stun3.l.google.com:19302' },
                { url: 'stun:stun4.l.google.com:19302' },
                { url: 'stun:stunserver.org' },
                { url: 'stun:stun.softjoys.com' },
                { url: 'stun:stun.voiparound.com' },
                { url: 'stun:stun.voipbuster.com' },
                { url: 'stun:stun.voipstunt.com' },
                { url: 'stun:stun.voxgratia.org' },
                { url: 'stun:stun.xten.com' },
                { url: 'STUN:turn.ncfu.ru:9003' },
                {
                    url: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
                {
                    url: 'turn:192.158.29.39:3478?transport=udp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
                {
                    url: 'turn:192.158.29.39:3478?transport=tcp',
                    credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
                    username: '28224511:1379330808'
                },
                {
                    url: 'turn:turn.bistri.com:80',
                    credential: 'homeo',
                    username: 'homeo'
                },
                {
                    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
                    credential: 'webrtc',
                    username: 'webrtc'
                },
                self.TURN]
            };
            var peer = new RTCPeerConnection(configuration);
            peer.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(e, type, uid);
            });
            //peer.addEventListener('iceconnectionstatechange', function (e) {
            //    self.onIceStateChange(self.pc1, e);
            //});
            //peer.addEventListener('connectionstatechange', function (event) {
            //    console.log(peer.connectionState);
            //});
            var stream = type == 1 ? self.cameraStream : self.screenStream;
            if (!stream) {
                peer.close();
                peer = null;
                setTimeout(function () { self.initRTCPeer(type, uid) }, 500);
                return;
            }
            stream.getTracks().forEach(function (track) {
                peer.addTrack(track, stream);
            });
            //app.videoSocket.send(JSON.stringify({ IsSender: true, TestingProfileId: app.testingProfileId, uid: uid }));
            var found = self.peers.filter(function (item) { return item.type == type && item.uid == uid; })[0];
            if (found) {
                found.peer.close();
                found.peer = peer;
            }
            else {
                self.peers.push({ type: type, peer: peer, uid: uid });
            }
            try {
                peer.createOffer(function (offer) {
                    peer.setLocalDescription(offer, function () {
                        var obj1 = {};
                        for (var i in offer) {
                            if (typeof offer[i] != 'function')
                                obj1[i] = offer[i];
                        }
                        var obj = {
                            offer: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId, type: type, uid: uid
                        };
                        if (app.videoSocket && app.videoSocket.readyState == 1) {
                            app.videoSocket.send(JSON.stringify(obj));
                        }
                    }, function (r) { console.log(r); });
                }, function (r) { console.log(r); }, { 'mandatory': { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } });
            }
            catch {
                console.log('error');
            }

        },
        onIceCandidate: function (e, type, uid) {
            var obj1 = {};
            for (var i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            var obj = {
                candidate: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId, type: type, uid: uid
            };
            if (app.videoSocket && app.videoSocket.readyState == 1) {
                app.gotICE = true;
                app.videoSocket.send(JSON.stringify(obj));
            }
        },
        confirm: function () {
            window.open('/user/waiting', '_self');
        },
        checkSecurity: function () {
            var self = this;
            if (localStorage['placeConfig']) {
                var str = window.location.href;
                var newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
                $.ajax({
                    url: "/api/user/GetSecurity?Id=" + newId + '&PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    type: "POST",
                    async: true,
                    success: function (result) {
                        if (result.HasAccess) {
                            self.init();
                        }
                        else {
                            window.open('/user/waiting', '_self');
                        }
                    }
                });
            }
            else {
                self.init();
            }
        },
        switchLocal: function (id) {
            var self = this;
            switch (id) {
                case 1: return localStorage["localization"] == 1 ? "Осталось" : "Left";
                case 2: return localStorage["localization"] == 1 ? "Выберите несколько ответов" : "Select multiple answers";
                case 3: return localStorage["localization"] == 1 ? "Выберите один ответ" : "Select one answer";
                case 4: return localStorage["localization"] == 1 ? "Впишите ответ в поле" : "Enter Your answer in the field";
                case 5: return localStorage["localization"] == 1 ? "Завершить вступительное испытание" : "Finish test";
                case 6: return localStorage["localization"] == 1 ? "Произошла ошибка. Попробуйте перезагрузить страницу" : "An error occured. Try reload the page";
                case 7: return localStorage["localization"] == 1 ? "Открыть чат" : "Open chat";
                case 8: return localStorage["localization"] == 1 ? "Выберите файл для загрузки" : "Select file";
                case 9: return localStorage["localization"] == 1 ? "Администратор" : "Administrator";
                case 10: return localStorage["localization"] == 1 ? "Удалить файл" : "Remove file";
                case 11: return localStorage["localization"] == 1 ? "Вы действительно хотите завершить тестирование" : "Are You sure, You want to finish test";
                case 12: return localStorage["localization"] == 1 ? "Подтверждение" : "Confirmation";
                case 13: return localStorage["localization"] == 1 ? "Вы не ответили на " : "Not answered: ";
                case 14: return localStorage["localization"] == 1 ? "Свернуть" : "Collapse";
                case 15: return localStorage["localization"] == 1 ? "Развернуть" : "Expand";
                case 16: return localStorage["localization"] == 1 ? "Потеряна связь с сервером. Перезагрузите страницу" : "Lost connection to the server. Reload Your page";
                case 17: return localStorage["localization"] == 1 ? "Потеряно соединение с сервером. Проверьте Ваше подключение к интернету." : "Lost connection to the server. Check Your internet-connection.";
                case 18: return localStorage["localization"] == 1 ? "Вступительное испытание завершено." : "Your test is over.";
                case 19: return localStorage["localization"] == 1 ? "Результат будет показан в личном кабинете портала eCampus на следующий день" : "Score will be shown in portal eCampus tomorrow";
                //case 19: return localStorage["localization"] == 1 ? "Ваш результат" : "Your score";
                case 20: return localStorage["localization"] == 1 ? "С результатами ознакомлен" : "I got acquainted with the results";
                case 21: return localStorage["localization"] == 1 ? "Подтвердить" : "Confirm";
                case 22: return localStorage["localization"] == 1 ? "Вернуться к списку" : "Back to test list";
                case 23: return localStorage["localization"] == 1 ? "Отмена" : "Cancel";
                case 24: return localStorage["localization"] == 1 ? "Завершить" : "Finish";
                case 25: return localStorage["localization"] == 1 ? "Администратор приостановил тестирование. Пожалуйста, подождите." : "Administrator paused Your test. Please, wait for continue.";
                case 26: return localStorage["localization"] == 1 ? "Тестирование" : "Testing";
                case 27: return localStorage["localization"] == 1 ? "Пожалуйста, не покидайте страницу" : "Please, return to the page";
                case 28: return localStorage["localization"] == 1 ? "Было допущено многократное нарушение правил. Проведение ВИ завершено." : "You have achieved too many violations. The test has been finished";
                case 30: return localStorage["localization"] == 1 ? "Для загрузки изображения через телефон Вы можете использовать QR-код:" : "For upload image using Your cell-phone You can use QR-code:";
                case 32: return localStorage["localization"] == 1 ? "1. Откройте сканер QR-кодов на телефоне и наведите на изображение" : "1. Open an app for reading QR-codes";
                case 33: return localStorage["localization"] == 1 ? "2. Наведите камеру на QR-код" : "2. Point camera on the screen";
                case 38: return localStorage["localization"] == 1 ? "3. Перейдите по ссылке, которую распознал сканер" : "3. Open recognized link on Your smartphone";
                case 34: return localStorage["localization"] == 1 ? "4. В открывшемся окне нажмите Start" : "4. In opened window push 'Start'";
                case 35: return localStorage["localization"] == 1 ? "5. Наведите камеру на QR-код" : "5. Point camera on the screen";
                case 36: return localStorage["localization"] == 1 ? "6. Загрузите фотографию с помощью устройства." : "6. Choose picture or make one and upload it.";
                case 37: return localStorage["localization"] == 1 ? "7. По окончании загрузки Вы увидете загруженное изображение и на телефоне, и на компьютере" : "7. After picture upload, You will see on both: smartphone and PC";
                case 39: return localStorage["localization"] == 1 ? "Пользователь не идентифицирован" : "User is undefined";
                case 40: return localStorage["localization"] == 1 ? "В кадре обнаружен посторонний. Попросите его покинуть комнату" : "There are someone else int he room. Please, let him leave";
                case 41: return localStorage["localization"] == 1 ? "Присутствуют посторонние звуки" : "There are undefined sounds";
                case 42: return localStorage["localization"] == 1 ? "Сворачивание окна запрещено!" : "You not allowed collapse the window";
                case 43: return localStorage["localization"] == 1 ? "Покидать окно тестов запрещено" : "You not allowed leave the window";
                case 44: return localStorage["localization"] == 1 ? "Вы должны всё время находиться в поле зрения веб-камеры!" : "You must always be visible in camera vision";
                case 45: return localStorage["localization"] == 1 ? "Вы нарушаете правила проведения ВИ!!" : "You breaking the rules!!";
                case 46: return localStorage["localization"] == 1 ? "Необходимо предоставить доступ к камере. Прохождение ВИ без камеры запрещено" : "Permission for camera denied. Grant access for camera, or the test won't be passed";
                case 47: return localStorage["localization"] == 1 ? "Необходимо предоставить доступ к экрану. Нажмите \"Разрешить\" и выберите из списка \"Весь экран\"" : "Permission for screen capture is necessary. Click \"Grant\"";
                case 48: return localStorage["localization"] == 1 ? "Разрешить" : "Grant";

            }
        }
    },
    mounted: function () {
        this.checkSecurity();
    },
    computed: {
        needAlarm: function () {
            var self = this;
            return self.timeLeft <= self.timeAlarm;
        }
    }
});

window.onerror = function (msg, url, line, col, error) {
    alert(msg, url, line, col, error);
    //code to handle or report error goes here
}