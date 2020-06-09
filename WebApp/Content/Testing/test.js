const app = new Vue({
    el: "#main-window",
    data: {
        testingProfileId: 0,
        domain: "",
        testInProcess: false,
        selectedTest: {},
        questions: [],
        answers: [],
        page: 0,
        selectedQuestion: {},
        timeStart: null,
        timeLeft: 0,
        IsTipOpened: false,
        tipPosition: {},
        loadObject: {
            loading: null,
            loaded: null
        },
        unloadedImage: "",
        buffer: {},
        intervalConnection: null,
        intervalConnectionLost: null,
        recordedCamera: [],
        recordedScreen: [],
        cameraRecorder: null,
        screenRecorder: null,
        pc1: {},
        peers: [],
        offerOptions: {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        },
        offer: null,
        cameraStream: null,
        screenStream: null,
        lostConnection: false,
        pause: false,
        chat: {
            IsOpened: false,
            participants: [],
            messages: [],
            Message: "",
            testingProfileId: 0
        },
        chatSocket: null,
        videoSocket: null,
        loadedSocket: false,
        shownVideos: true,
        gotICE: false,
        sourceMaterials: [],
        counter: 0,
        maxTipWidth: 540,
        unreadCount: 0,
        currentUser: {},
        queue: [{ type: 1, candidates: [] }, { type: 2, candidates: [] }],
        mediaSource: null,
        sourceBuffer: null,
        streamLoaded: null,
        streamQueue: [],
        needCalc: false,
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
        }
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/account/GetDomain",
                type: "POST",
                async: false,
                success: function (domain) {
                    self.domain = domain;
                }
            });
            self.mediaSource = new MediaSource();
            self.streamLoaded = URL.createObjectURL(self.mediaSource);
            self.mediaSource.addEventListener('sourceopen', self.sourceOpen);
            self.mediaSource.addEventListener('sourceclose', function (e) { console.log(e); });
            self.questions = [];
            self.testInProcess = true;
            self.answers = [];
            self.selectedQuestion = {};
            let str = window.location.href;
            let newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.startTest(newId);
            self.testingProfileId = newId;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
            self.initVideoSocket();
            self.initWebCam();
            self.startCapture({ video: { cursor: 'always' }, audio: true});
            self.initChat();
            setTimeout(function () {
                self.maxTipWidth = $('#main-window').width();
                console.log(self.maxTipWidth);
            }, 500);
            //GetCurrentUser
            $.ajax({
                url: "/user/GetCurrentUser?Id=" + newId,
                type: "POST",
                async: false,
                success: function (user) {
                    self.currentUser = user;
                    console.log(user);
                }
            });
        },
        startTest: function (id) {
            let self = this;
            try {
                $.when($.ajax({
                    url: "/user/StartTest?Id=" + id,
                    type: "POST",
                    async: true
                }), $.ajax({
                    url: "/user/GetTestquestionsById?Id=" + id,
                    type: "POST",
                    async: true
                }), $.ajax({
                    url: "/user/GetTestAnswersById?Id=" + id,
                    type: "POST",
                    async: true
                }), $.ajax({
                    url: "/user/GetSourceMaterials?Id=" + id,
                    type: "POST",
                    async: true
                })).then(function (resp1, resp2, resp3, resp4) {
                    //Получаем пакеты вопросов, ответов и то, как их разместить
                    let questions = resp2[0];
                    questions.map(function (question) { question.answerImage = ""; });
                    self.questions = questions;

                    //Добавляем пару своих полей для удобной работы (флаг, что выбран один из вариантов ответа, и порядок)
                    resp3[0].map(function (a) {
                        a.IsAnswered = false;
                        a.fileId = null;
                        a.TestingPackage = resp1[0].Packages.filter(function (b) { return b.AnswerId == a.Id; })[0];
                    });
                    self.answers = resp3[0];
                    self.timeStart = new Date(resp1[0].Date);
                    self.startTimer();
                    if (resp1[0].Answered && resp1[0].Answered.length > 0) {
                        self.questions.forEach(function (a) {
                            resp1[0].Answered.forEach(function (b) {
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
                        a.answered = a.answered ? a.answered : false;
                    });
                    //Сортируем вопросы в нужном порядке
                    self.questions.sort(function (a, b) { a.Rank - b.Rank });
                    //Сортируем ответы
                    self.questions.forEach(function (a) { a.Answers.sort(function (b, c) { b.Sort - c.Sort; }); });
                    //Текущий вопрос выбираем первый
                    self.selectQuestion(1);
                    //Флаг, что началася тест
                    self.testInProcess = true;
                    console.log(resp4);
                    self.sourceMaterials = resp4[0];
                    self.sourceMaterials.forEach(function (material) {
                        self.needCalc = material.isCalc || self.needCalc;
                    })
                    self.startCheckConnection(id);
                }, function (err) {
                    //alert(self.switchLocal(6));
                });
            }
            catch (exc) {
                console.log(exc);
            }
        },
        recordingCamera: function (event) {
            app.recordedCamera.push(event.data);
            var reader = new FileReader();
        },
        recordingScreen: function (event) {
            //console.log(event);
            if (event.data && event.data.size > 0) {
                app.recordedScreen.push(event.data);
            }
        },
        //Когда меняются значения, нужно сформировать нормально пакеты
        changeRadio: function (id) {
            let self = this;
            //Если радио, то выбранному ставим в true, остальные сбрасываем
            self.selectedQuestion.Answers.forEach(function (a) { a.IsAnswered = a.Id == id ? !a.IsAnswered : false; });
            //Ставим метку, что ответ менялся, чтобы не загружать по 100500 раз после каждого выбора вопроса
            self.selectedQuestion.changed = true;

            self.selectedQuestion.answered = true;
        },
        changeCheck: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            let self = this;

            let flag = false;
            this.selectedQuestion.Answers.forEach(function (a) { flag = a.IsAnswered || flag });
            self.selectedQuestion.answered = flag;
        },
        changeText: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            this.selectedQuestion.answered = true;
        },
        getAnswerFile: function (question, Id) {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/auditory/DownloadFile?Id=' + Id,
                success: function (data) {
                    question.answerImage = data;
                }
            });
        },
        removeFile: function () {
            let self = this;
            self.selectedQuestion.Answers[0].fileId = null;
            self.selectedQuestion.fileId = null;
            self.selectedQuestion.answerImage = null;
            self.answerQuestion();
        },
        changeFile: function (e) {
            let self = this;
            let extension = e.target.files[0].name.substr(e.target.files[0].name.lastIndexOf('.'));
            let formaData = new FormData();
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
                    self.selectedQuestion.Answers[0].fileId = data;

                    var reader = new FileReader();
                    reader.onload = function () {
                        self.selectedQuestion.answerImage = reader.result.substr(reader.result.indexOf(',') + 1);
                    };
                    console.log(e.target.files[0]);
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
            let self = this;
            let flag = false;
            self.questions.forEach(function (a) { flag = (a.Rank === id && a.answered) || flag });
            return flag;
        },
        selectQuestion: function (id) {
            let self = this;
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
                self.askQuestionImagePart(1);
                //Изображения ответов
                if ([1, 2].indexOf(self.selectedQuestion.TypeAnswerId) != -1) {
                    self.selectedQuestion.Answers.forEach(function (a) {
                        $.ajax({
                            type: 'POST',
                            dataType: 'json',
                            url: '/user/GetAnswerImage?Id=' + a.Id,
                            success: function (d) {
                                a.AnswerImage = d.AnswerImage;
                                self.counter++;
                                if (self.counter == self.selectedQuestion.Answers.length + 1) {
                                    self.loadObject.loading = false;
                                    self.loadObject.loaded = true;
                                    //self.loadTestObject.loading = false;
                                    //self.loadTestObject.loaded = true;
                                }
                            }
                        });
                    });
                }
            }
        },
        askQuestionImagePart: function (part) {
            let self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/user/GetQuestionImage?Id=' + self.selectedQuestion.Id + '&Type=' + self.selectedQuestion.TypeAnswerId + '&part=' + part,
                success: function (d) {
                    if (!self.unloadedImage || part == 1) {
                        self.selectedQuestion.QuestionImage = "";
                        self.unloadedImage = "";
                    }
                    if (d.QuestionImage.indexOf('flag') != -1) {
                        self.unloadedImage += d.QuestionImage.substr(4);
                        //self.selectedQuestion.QuestionImage += d.QuestionImage.substr(4);
                        self.askQuestionImagePart(part + 1);
                    }
                    else {
                        self.unloadedImage += d.QuestionImage;
                        self.selectedQuestion.QuestionImage = self.unloadedImage;
                        //После загрузки ставим метку, что загружено
                        self.counter++;
                        self.selectedQuestion.IsLoaded = true;
                        if (self.counter == self.selectedQuestion.Answers.length + 1 || [3, 4].indexOf(self.selectedQuestion.TypeAnswerId) != -1) {
                            self.loadObject.loading = false;
                            self.loadObject.loaded = true;

                            setTimeout(function () {
                                self.maxTipWidth = $('#main-window').width() < 500 ? $('#main-window').width() : 540;
                                console.log(self.maxTipWidth);
                            }, 500);
                        }
                        //self.selectedQuestion.QuestionImage += d.QuestionImage;
                    }

                }
            });
        },
        getHeight: function (Id) {
            let height = $('#answer-' + Id).height();
            if (height > 30 && height < 70) {
                return 'double';
            }
            else if (height > 70) {
                return 'triple';
            }
        },
        answerQuestion: function () {
            let self = this;
            let answers = [];
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
                answers.push({ TestingPackageId: self.selectedQuestion.Answers[0].TestingPackage.Id, TestingTime: 3, UserAnswer: null, FileId: self.selectedQuestion.Answers[0].fileId });
            }
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/user/UpdatequestionAnswer',
                data: { answer: answers },
                success: function () {
                    //Сбрасываем флаг изменения
                    self.selectedQuestion.changed = false;
                    //Для подсветки решённых заданий
                    self.selectedQuestion.answered = true;
                    if (self.selectedQuestion.TypeAnswerId == 3 || self.selectedQuestion.TypeAnswerId == 4) {
                        if (!self.selectedQuestion.Answers[0].fileId) {
                            self.selectedQuestion.answered = false;
                        }
                        else {
                            self.selectedQuestion.fileId = self.selectedQuestion.Answers[0].fileId;
                            console.log(self.selectedQuestion.fileId);
                        }
                    }
                }
            });
        },
        startCheckConnection: function (id) {
            let self = this;
            self.intervalConnection = setInterval(
                function () {
                    $.ajax({
                        url: "/user/HasConnection",
                        type: "POST",
                        data: {
                            TestingProfileId: id,
                            NeedDispose: false
                        },
                        success: function (data) {
                            if (data !== 1) {
                                self.pause = true;
                                if (!self.intervalConnectionLost) {
                                    self.intervalConnectionLost = setTimeout(function () {
                                        clearTimeout(self.intervalConnectionLost);
                                        self.lostConnection = true;
                                    }, 30000);
                                }
                            }
                            else {
                                if (self.intervalConnectionLost) {
                                    clearTimeout(self.intervalConnectionLost);
                                    self.lostConnection = false;
                                    self.pause = false;
                                }
                            }
                        },
                        error: function () {
                            self.pause = true;
                            if (!self.intervalConnectionLost) {
                                self.intervalConnectionLost = setTimeout(function () {
                                    clearTimeout(self.intervalConnectionLost);
                                    self.lostConnection = true;
                                }, 30000);
                            }
                        },
                        async: true
                    });
                }, 5000);
        },
        startTimer: function () {
            let self = this;
            self.timeLeft = self.timeStart ? self.timeStart : 1800;
            self.interval = setInterval(function () {
                self.timeLeft--;
                if (self.timeLeft <= 0) {
                    clearInterval(self.interval);
                    //self.finishTest();
                }
            }, 1000);
        },
        initChat: function () {
            let self = this;
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
                let message;
                if (msg.data.indexOf("\0") != -1) {
                    message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                }
                else {
                    message = JSON.parse(msg.data);
                }
                message.Date = new Date(Number(message.Date.substr(message.Date.indexOf('(') + 1, message.Date.indexOf(')') - message.Date.indexOf('(') - 1)));
                self.chat.messages.push(message);

                let maxId = 0;
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
                console.log('oh-oh');
                // alert('Мы потеряли её. Пожалуйста, обновите страницу');
            };
        },
        subscribeEnter: function () {
            let self = this;
            $(document).on('keyup', function () { self.beforeSend(self); });
        },
        beforeSend: function (self) {
            if (event.keyCode == 13 && !event.shiftKey) {
                self.sendMessage();
            }
        },
        isMe: function (message) {
            let self = this;
            return message.UserIdFrom == self.currentUser || message.IsSender;
        },
        initVideoSocket: function () {
            let self = this;

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
                self.videoSocket = new WebSocket(self.domain + "/StreamHandler.ashx");
            } else {
                self.videoSocket = new MozWebSocket(self.domain + "/StreamHandler.ashx");
            }
            self.videoSocket.onopen = function () {
                console.log('init videosocket');
                self.videoSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId }));
            };

            self.videoSocket.onmessage = function (msg) {
                let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));

                if (!message.IsSender) {
                    console.log(message);
                    console.log(message.type);
                    if (message.candidate && message.candidate != '{}') {
                        let candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                        //self.queue.push(candidate);


                        let queue = self.queue.filter(function (item) { return item.type == message.type; })[0];
                        queue.candidates.push(candidate);
                    }
                    else if (message.requestOffer) {
                        console.log('start request');
                        self.initRTCPeer(1);
                        self.initRTCPeer(2);
                    }
                    else if (message.answer) {
                        let interval = setInterval(function () {
                            console.log('start interval');
                            let found = self.peers.filter(function (item) { return item.type == message.type; })[0];
                            console.log('found', found);
                            if (found) {
                                clearInterval(interval);
                                let peer = found.peer;
                                console.log(message);
                                console.log(peer);
                                peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.answer)), function (r) {

                                    let queue = self.queue.filter(function (item) { return item.type == message.type })[0];
                                    queue.candidates.forEach(function (candidate) {
                                        peer.addIceCandidate(candidate);
                                    });
                                    console.log(r);
                                }, function (r) { console.log(r); });


                            }
                        }, 500);
                    }
                }
            };

        },
        initWebCam: function () {
            let self = this;
            let stream = self.cameraStream;
            console.log('init webcam');
            if (!stream) {
                navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: 'user'
                        },
                        audio: true
                    },
                    function (videostream) {/*callback в случае удачи*/
                        stream = videostream;
                        self.cameraStream = videostream;
                        console.log('init stream', self.cameraStream);
                        self.cameraRecorder = new MediaRecorder(videostream);
                        self.cameraRecorder.ondataavailable = self.recordingCamera;
                        self.cameraRecorder.start(1000);

                        self.initRTCPeer(1);
                        $('#video1')[0].srcObject = videostream;



                    },
                    function (er) {/*callback в случае отказа*/ alert(er); });
            }
            else {
                self.cameraRecorder.start(10);
            }
        },
        sourceOpen: function () {
            let self = this;
            self.sourceBuffer = self.mediaSource.addSourceBuffer('video/webm; codecs="vp8"');
            //self.sourceBuffer.addEventListener('update', function () {
            //    if (self.streamQueue.length > 0 && !self.sourceBuffer.updating) {
            //        self.sourceBuffer.appendBuffer(self.streamQueue.shift());
            //    }
            //});
        },
        b64toBlob: function (b64Data, sliceSize = 512) {
            // console.log(b64Data.substr(b64Data.indexOf('base64') + 7));
            //let self = this;
            //for (let i = 0; i < data.length; i++) {
            //    let byteCharacters = atob(data[i].substr(data[i].indexOf('base64') + 7));

            //    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            //        let slice = byteCharacters.slice(offset, offset + sliceSize);

            //        let byteNumbers = new Array(slice.length);
            //        for (let i = 0; i < slice.length; i++) {
            //            byteNumbers[i] = slice.charCodeAt(i);
            //        }

            //        let byteArray = new Uint8Array(byteNumbers);
            //        self.queueArray.push(byteArray);
            //    }
            //}

            //let blob = new Blob(self.queueArray, {
            //    type: 'video/webm'
            //});

            let byteCharacters = atob(b64Data.substr(b64Data.indexOf('base64') + 7));
            let byteArrays = [];

            for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                let slice = byteCharacters.slice(offset, offset + sliceSize);

                let byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }

                let byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            let blob = new Blob(byteArrays, {
                type: 'video/webm'
            });
            return blob;
        },
        pushBtn: function (char) {
            let self = this;
            let isFirst = self.calculator.second == '' && !self.calculator.isExpr;
            let middle = isFirst ? self.calculator.first : self.calculator.second;
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
                    let flag = false;

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
                    self.calculator.resultText = '0';
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
            let self = this;
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
            let self = this;
            self.answerQuestion();
            if (self.cameraRecorder) self.cameraRecorder.stop();
            //let obj = $('#video2')[0];
            self.bufferCamera = new Blob(self.recordedCamera, { type: 'video/webm' });
            self.bufferScreen = new Blob(self.recordedScreen, { type: 'video/webm' });
            //let src = URL.createObjectURL(self.bufferCamera);
            //let src1 = URL.createObjectURL(self.bufferScreen);
            let formaData = new FormData();

            //var a = document.createElement('a');
            //document.body.appendChild(a);
            //a.style = 'display: none';
            //a.href = src;
            //a.download = 'test.webm';
            //console.log(self.buffer);
            //a.click();
            //console.log(src, self.buffer);
            formaData.append('Id', self.testingProfileId);
            // let file = self.buffer;
            //let file = new File([self.buffer], "name");
            //const reader = new FileReader();
            //reader.readAsDataURL(file);
            formaData.append('File', self.bufferCamera);
            formaData.append('File1', self.bufferScreen);
            setTimeout(function () {
                // reader.onload = function () {
                //formaData.append('baseFile', reader.result);
                //console.log(self.selectedTest.Id, file, reader.result);
                $.ajax({
                    url: "/user/SaveVideoFile",
                    type: "POST",
                    data: formaData,
                    contentType: false,
                    processData: false,
                    success: function () {
                        $.ajax({
                            url: "/user/FinishTest?Id=" + self.testingProfileId,
                            type: "POST",
                            success: function () {
                                console.log('clos');
                                window.open('/user/waiting', '_self');
                            }
                        });
                    }
                });
                // }
            }, 2000);


            // obj.src = src;
            //obj.srcObject = self.buffer;
            //location.reload();
            //console.log(self.selectedTest);
            $.ajax({
                url: "/user/HasConnection",
                type: "POST",
                data: {
                    TestingProfileId: self.testingProfileId,
                    NeedDispose: true
                }
            });
            clearTimeout(self.intervalConnectionLost);
            clearTimeout(self.intervalConnection);
            //self.init();
        },
        startCapture: function (displayMediaOptions) {
            let self = this;
            //let captureStream = null;

            navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function (Str) {
                $('#video2')[0].srcObject = Str;
                self.screenStream = Str;
                //let tracks = Str.getTracks();
                //track.forE
                self.initRTCPeer(2);
                // self.screenRecorder = new MediaRecorder(Str);
                //self.screenRecorder.ondataavailable = self.recordingScreen;
                //self.screenRecorder.start(10);
                //   console.log(Str);
            })
                .catch(function (err) {
                    console.error("Error:" + err);
                    alert("Обновите страницу и разрешите запись экрана!");
                    return null;
                });
        },
        download: function () {
            $.ajax({
                url: "GetFileBase?Id=67",
                type: "POST",
                success: function (data) {
                    const downloadLink = document.createElement('a');
                    document.body.appendChild(downloadLink);

                    downloadLink.href = data;
                    downloadLink.target = '_self';
                    downloadLink.download = "na.webm";
                    downloadLink.click();
                }
            });
        },
        showCountLeft: function () {
            let self = this;
            let count = self.questions.length;

            self.questions.forEach(function (a) { count = a.answered ? (count - 1) : count });
            if (count > 0) {
                if (self.localization == 1) {
                    let str = count + ' ';
                    let procent = count % 10;
                    if (procent == 1) { str += 'вопрос'; }
                    else if (procent < 4 && procent > 1) { str += 'вопроса'; }
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
            let self = this;
            return Math.floor(self.timeLeft / 60) + ':' + self.isZeroNeed(self.timeLeft % 60);
        },
        isZeroNeed: function (value) {
            if (value < 10)
                return '0' + value;
            else return value;
        },
        openTip: function () {
            let self = this;
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
            let self = this;
            $(document).on('mousemove', function () { self.resizing(self); });
            self.tipPosition.width = $('#panel-right').width();
            self.tipPosition.start = $(document).width();// - $('#panel-right').width();
            //  console.log(self.tipPosition);
        },
        resizing: function (self) {
            $(document).on('mouseup', function () { self.stopResizing(self); });
            $('#panel-right').width(self.tipPosition.start - event.pageX);
            self.maxTipWidth = self.tipPosition.start - event.pageX - 20;
        },
        stopResizing: function (self) {
            self.tipPosition.width = $('#panel-right').width();
            $(document).off('mousemove');
            $(document).off('mouseup');
        },
        startResizeTouch: function () {
            let self = this;
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
            let self = this;
            self.chat.IsOpened = !self.chat.IsOpened;
            if (self.chat.IsOpened) {
                self.unreadCount = 0;
                setTimeout(function () {
                    $('#full-chat-wrapper')[0].scrollIntoView();
                }, 20);
                let maxId = 0;
                self.chat.messages.forEach(function (msg) {
                    maxId = msg.Id > maxId ? msg.Id : maxId;
                });
                if (maxId != 0) {
                    setTimeout(function () {
                        $('#message-' + maxId)[0].scrollIntoView();
                    }, 20);
                }
            }
        },
        toggleTypeChat: function () {
            let self = this;
            if (self.chat.IsOpened) {
                self.chat.IsChatVOpened = !self.chat.IsChatVOpened;
                self.chat.IsChatMOpened = !self.chat.IsChatMOpened;
            }
        },
        getMessages: function (newId) {
            let self = this;
            //GetChatMessages
            $.ajax({
                url: "/user/GetChatMessages?Id=" + newId,
                type: "POST",
                async: false,
                success: function (messageList) {
                    let messages = messageList;
                    messages.map(function (a) { a.Date = new Date(Number(a.Date.substr(a.Date.indexOf('(') + 1, a.Date.indexOf(')') - a.Date.indexOf('(') - 1))); });
                    self.chat.messages = messages;
                }
            });
        },
        sendMessage: function () {
            let self = this;
            self.chatSocket.send(JSON.stringify({ Message: self.chat.Message, Date: new Date(), IsSender: true, TestingProfileId: self.testingProfileId, ParentId: null }));
            self.chat.Message = "";
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        },
        initRTCPeer: function (type) {
            console.log('init rtcpeer');
            let self = this;
            let TURN = {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            };

            let configuration = {
                iceServers: [TURN]
            };
            let peer = new RTCPeerConnection(configuration);
            peer.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(e, type);
            });
            //peer.addEventListener('iceconnectionstatechange', function (e) {
            //    self.onIceStateChange(self.pc1, e);
            //});
            //peer.addEventListener('connectionstatechange', function (event) {
            //    console.log(peer.connectionState);
            //});
            let stream = type == 1 ? self.cameraStream : self.screenStream;
            stream.getTracks().forEach(function (track) {
                peer.addTrack(track, stream);
            });

            let found = self.peers.filter(function (item) { return item.type == type })[0];
            if (found) {
                found.peer = peer;
            }
            else self.peers.push({ type: type, peer: peer });
            try {
                peer.createOffer(function (offer) {
                    peer.setLocalDescription(offer, function () {
                        let obj1 = {};
                        for (let i in offer) {
                            if (typeof offer[i] != 'function')
                                obj1[i] = offer[i];
                        }
                        let obj = {
                            offer: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId, type: type
                        };
                        if (app.videoSocket && app.videoSocket.readyState == 1) {
                            app.videoSocket.send(JSON.stringify(obj));
                        }
                    }, function () { });
                }, function () { });
            }
            catch{
                console.log('error');
            }
        },
        onIceCandidate: function (e, type) {
            let obj1 = {};
            for (let i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            console.log(e.candidate);
            let obj = {
                candidate: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId, type: type
            };
            if (app.videoSocket && app.videoSocket.readyState == 1) {
                app.gotICE = true;
                app.videoSocket.send(JSON.stringify(obj));
            }
        },
        checkSecurity: function () {
            let self = this;
            if (localStorage['placeConfig']) {
                let str = window.location.href;
                let newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
                $.ajax({
                    url: "/user/GetSecurity?Id=" + newId + '&PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    type: "POST",
                    async: false,
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
            let self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Осталось" : "Left";
                case 2: return self.localization == 1 ? "Выберите несколько ответов" : "Select multiple answers";
                case 3: return self.localization == 1 ? "Выберите один ответ" : "Select one answer";
                case 4: return self.localization == 1 ? "Выберите файл для загрузки (если требуется) и впишите ответ в поле" : "Select file to upload (if necessary) and enter the answer in the field";
                case 5: return self.localization == 1 ? "Завершить вступительное испытание" : "Finish test";
                case 6: return self.localization == 1 ? "Произошла ошибка. Попробуйте перезагрузить страницу" : "An error occured. Try reload the page";
                case 7: return self.localization == 1 ? "Открыть чат" : "Open chat";
                case 8: return self.localization == 1 ? "Выберите файл для загрузки" : "Select file";
                case 9: return self.localization == 1 ? "Администратор" : "Administrator";
                case 10: return self.localization == 1 ? "Удалить файл" : "Remove file";
                case 11: return self.localization == 1 ? "Вы действительно хотите завершить тестирование" : "Are You sure, You want to finish test";
                case 12: return self.localization == 1 ? "Подтверждение" : "Confirmation";
                case 13: return self.localization == 1 ? "Вы не ответили на " : "Not answered: ";
                case 14: return self.localization == 1 ? "Свернуть" : "Collapse";
                case 15: return self.localization == 1 ? "Развернуть" : "Expand";
            }
        }
    },
    mounted: function () {
        this.checkSecurity();
    }
});

window.onerror = function (msg, url, line, col, error) {
    console.log(msg, url, line, col, error);
    //code to handle or report error goes here
}