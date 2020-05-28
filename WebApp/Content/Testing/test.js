const app = new Vue({
    el: "#main-window",
    data: {
        testingProfileId: 0,
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
        offerOptions: {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        },
        offer: null,
        stream: null,
        lostConnection: false,
        pause: false,
        chat: {
            IsOpened: false,
            IsChatMOpened: true,
            IsChatVOpened: false,
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
        queue: []
    },
    methods: {
        init: function () {
            let self = this;
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
            self.initWebCam();
            self.initChat();
            //GetCurrentUser
            $.ajax({
                url: "/user/GetCurrentUser?Id=" + newId,
                type: "POST",
                async: false,
                success: function (user) {
                    self.currentUser = user;
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
                    self.startTimer(self.timeStart);
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
                                    }
                                    else if (a.TypeAnswerId == 4) {
                                        a.answered = true;
                                        a.fileId = b.FileId;
                                        if (a.fileId) {
                                            self.getAnswerFile(a, a.fileId);
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
                    self.startCheckConnection(id);
                }, function (err) { alert(self.switchLocal(6)); });
            }
            catch (exc) {
                console.log(exc);
            }
        },
        recordingCamera: function (event) {
            //console.log(event);
            //if (event.data && event.data.size > 0) {
            app.recordedCamera.push(event.data);
            var reader = new FileReader();
            let canvas = document.createElement('canvas');
            var context = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 150;
            context.drawImage($('#video1')[0], 0, 0, 200, 150);
            //console.log(context);
            var data = canvas.toDataURL('image/png');
            // let photo = $('#photo')[0];
            //photo.setAttribute('src', data);

            //reader.readAsDataURL(new Blob([event.data], { type: 'video/webm; codecs="vp8"'}));
            //reader.onloadend = function () {
            //if (app.videoSocket && app.videoSocket.readyState == 1) {
            //    app.videoSocket.send(JSON.stringify({ IsSender: true, TestingProfileId: app.testingProfileId, Stream: data }));
            //}
            //    var base64data = reader.result;
            //    console.log(base64data);
            //}
            //  if (app.videoSocket && app.loadedSocket) {
            //      console.log(JSON.stringify(event.data));
            //app.videoSocket.send(JSON.stringify({ IsSender: true, TestingProfileId: app.testingProfileId, Stream: event.data }));
            //   }
            //if (app.socket)
            //   app.socket.send(event.data);
            //    let bffer = new Blob(app.recordedCamera, { type: 'video/webm' });
            //   $('#video2')[0].src = URL.createObjectURL(bffer);
            // }
            //console.log(event.data);
            //console.log(app.stream.id, app.stream.);
            //let formData = new FormData();
            //formData.append('Id', localStorage['placeConfig']);
            //formData.append('File', event.data);
            ////$.ajax({
            //    url: '/user/save',
            //    type: 'POST',
            //    contentType: false,//'application/octet-stream',
            //    data: formData,
            //    processData: false
            //});
        },
        recordingScreen: function (event) {
            //console.log(event);
            if (event.data && event.data.size > 0) {
                app.recordedScreen.push(event.data);
                // if (app.videoSocket && app.loadedSocket) {
                //console.log(JSON.stringify(event.data));
                //app.videoSocket.send(JSON.stringify({ IsSender: true, TestingProfileId: app.testingProfileId, Stream: event.data }));
                //}
                //if (app.socket)
                //   app.socket.send(event.data);
                //let bffer = new Blob(app.recordedScreen, { type: 'video/webm' });
                // $('#video2')[0].src = URL.createObjectURL(bffer);
            }
            //console.log(event.data);
            //console.log(app.stream.id, app.stream.);
            //let formData = new FormData();
            //formData.append('Id', localStorage['placeConfig']);
            //formData.append('File', event.data);
            ////$.ajax({
            //    url: '/user/save',
            //    type: 'POST',
            //    contentType: false,//'application/octet-stream',
            //    data: formData,
            //    processData: false
            //});
        },
        getRemoteAnswer: function () {
            let self = this;
            $.ajax({
                url: '/user/GetAnswer?Id=' + localStorage['placeConfig'],
                type: 'POST',
                //data: {
                //    Id: localStorage['placeConfig']
                //},
                success: function (offer) {
                    console.log(self.pc1);
                    if (offer.Answer) {
                        self.pc1.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer.Answer)), function () { }, function () { });
                        flag = false;
                    }
                    else {
                        self.getAnswer();
                    }
                }
                //  processData: false
            });
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
                        self.selectedQuestion.answerImage = reader.result;
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
                    self.finishTest();
                }
            }, 1000);
            //self.startCapture();
        },
        initChat: function () {
            let self = this;
            if (typeof (WebSocket) !== 'undefined') {
                self.chatSocket = new WebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
            } else {
                self.chatSocket = new MozWebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
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
                if (!self.chat.IsOpened) {
                    self.unreadCount++;
                }
            };
            self.chatSocket.onclose = function (event) {
                self.initChat();
                // alert('Мы потеряли её. Пожалуйста, обновите страницу');
            };
        },
        isMe: function (message) {
            let self = this;
            return message.UserIdFrom == self.currentUser;
        },
        initWebCam: function () {
            let self = this;
            if (!self.stream) {
                navigator.getUserMedia(
                    {
                        video: true,
                        //audio: true
                    },
                    function (stream) {/*callback в случае удачи*/
                        self.stream = stream;
                        console.log(stream);
                        self.cameraRecorder = new MediaRecorder(stream);
                        self.cameraRecorder.ondataavailable = self.recordingCamera;
                        self.cameraRecorder.start(1000);

                        $('#video1')[0].srcObject = stream;

                        if (typeof (WebSocket) !== 'undefined') {
                            self.videoSocket = new WebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                        } else {
                            self.videoSocket = new MozWebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                        }
                        //if (typeof (WebSocket) !== 'undefined') {
                        //    self.videoSocket = new WebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                        //} else {
                        //    self.videoSocket = new MozWebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                        //}
                        self.videoSocket.onopen = function () {
                            self.videoSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId }));
                            self.initRTCPeer();
                        }

                        self.videoSocket.onmessage = function (msg) {
                            let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));

                            if (!message.IsSender) {
                                if (message.candidate && message.candidate != '{}') {
                                    let candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                                    console.log(candidate);
                                    self.queue.push(candidate);
                                }

                                else if (message.answer) {
                                    console.log(message.answer);
                                    self.pc1.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.answer)), function (r) { console.log(r); }, function (r) { console.log(r); })
                                    //let createDescPromise = new Promise(function (resolve) {
                                    //    console.log('start remote');
                                    //    let sdp = JSON.parse(message.answer).sdp;
                                    //    //let sdp = JSON.parse(message.answer).sdp;
                                    //    //console.log(sdp);
                                    //    //if (sdp.search(/^a=mid.*$/gm) === -1) {
                                    //   // var mlines_1 = sdp.match(/^m=.*$/gm);
                                    //    //console.log(mlines_1);
                                    //   // let sdps = sdp.split(/^m=.*$/gm);
                                    //  //  console.log(sdps);
                                    //    //mlines_1.forEach(function (elem, idx) {
                                    //    //    console.log(elem, idx);
                                    //    //    mlines_1[idx] = elem + '\na=mid:' + idx;
                                    //    //});
                                    //   // console.log(JSON.stringify(sdp));
                                    //    console.log(message.answer);
                                    //    resolve(self.pc1.setRemoteDescription({ type: 'answer', sdp: sdp }));
                                    //})
                                    //createDescPromise.then(function (result) {
                                    //    console.log('stop remote');
                                    //})
                                    //console.log(message.answer);
                                }
                            }
                            //console.log(message);
                        }


                    },
                    function () {/*callback в случае отказа*/ });
            }
            else {
                self.cameraRecorder.start(10);
            }
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
            let captureStream = null;

            navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function (Str) {
                $('#video2')[0].srcObject = Str;

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
                let str = count + ' ';
                let procent = count % 10;
                if (procent == 1) { str += 'вопрос'; }
                else if (procent < 4 && procent > 1) { str += 'вопроса'; }
                else { str += 'вопросов'; }
                return str;
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

        toggleChat: function () {
            let self = this;
            self.chat.IsOpened = !self.chat.IsOpened;
            if (self.chat.IsOpened) {
                self.unreadCount = 0;
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
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Осталось" : "Left";
                case 2: return self.localization == 1 ? "Выберите несколько ответов" : "Select multiple answers";
                case 3: return self.localization == 1 ? "Выберите один ответ" : "Select one answer";
                case 4: return self.localization == 1 ? "Выберите файл для загрузки (если требуется) и впишите ответ в поле" : "Select file to upload (if necessary) and enter the answer in the field";
                case 5: return self.localization == 1 ? "Завершить тестирование" : "Finish test";
                case 6: return self.localization == 1 ? "Произошла ошибка. Попробуйте перезагрузить страницу" : "An error occured. Try reload the page";
                case 7: return self.localization == 1 ? "Открыть чат" : "Open chat";
                case 8: return self.localization == 1 ? "Выберите файл для загрузки" : "Select file";
                case 9: return self.localization == 1 ? "Администратор" : "Administrator";
                case 10: return self.localization == 1 ? "Удалить файл" : "Remove file";
            }
        },
        initRTCPeer: function () {
            let self = this;
            let videoTracks = self.stream.getVideoTracks();
            let audioTracks = self.stream.getAudioTracks();
            let configuration = { sdpSemantics: "unified-plan" };
            self.pc1 = new RTCPeerConnection(configuration);
            console.log('Created local peer connection object pc1', new Date().getSeconds(), new Date().getMilliseconds());
            self.pc1.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(self.pc1, e);
            })
            self.pc1.addEventListener('iceconnectionstatechange', function (e) {
                self.onIceStateChange(self.pc1, e);
            })

            self.stream.getTracks().forEach(function (track) {
                self.pc1.addTrack(track, self.stream);
            });

            try {

                self.pc1.createOffer(function (offer) {
                    self.pc1.setLocalDescription(offer, function () {
                        let obj1 = {};
                        for (let i in offer) {
                            if (typeof offer[i] != 'function')
                                obj1[i] = offer[i];
                        }
                        let obj = {
                            offer: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId
                        };
                        if (app.videoSocket && app.videoSocket.readyState == 1) {
                            app.videoSocket.send(JSON.stringify(obj));
                        }
                    }, function () { });
                }, function () { });

                //let offerPromise = new Promise(function (resolve) {
                //    console.log('Created offerPromise start', new Date().getSeconds(), new Date().getMilliseconds());
                //    resolve(self.pc1.createOffer(self.offerOptions));
                //})
                //let CreateofferPromise = new Promise(function (resolve) {
                //    console.log('Created setLocalDescription start', new Date().getSeconds(), new Date().getMilliseconds());
                //    resolve(self.pc1.setLocalDescription(self.offer));
                //})
                //offerPromise.then(function (data) {
                //    console.log('Created offerPromise finished', new Date().getSeconds(), new Date().getMilliseconds());
                //    console.log(data);
                //    self.offer = data;
                //    CreateofferPromise.then(function (off) {
                //        console.log('Created setLocalDescription finish', new Date().getSeconds(), new Date().getMilliseconds());
                //        let obj1 = {};
                //        for (let i in data) {
                //            if (typeof data[i] != 'function')
                //                obj1[i] = data[i];
                //        }
                //        let obj = {
                //            offer: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId
                //        };
                //        if (app.videoSocket && app.videoSocket.readyState == 1) {
                //            app.videoSocket.send(JSON.stringify(obj));
                //        }
                //    });
                //})
            }
            catch{
                console.log('error');
            }
        },
        onIceCandidate: function (pc, e) {
            let obj1 = {};
            for (let i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            //if(e.candidate)
            //for (let i in e.candidate.__proto__) {
            //    if (typeof e.candidate[i] != 'function')
            //        obj1[i] = e.candidate[i];
            //}
            console.log(e.candidate);
            let obj = {
                candidate: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId
            };
            if (app.videoSocket && app.videoSocket.readyState == 1) {
                app.gotICE = true;
                app.videoSocket.send(JSON.stringify(obj));
            }
        },
        onIceStateChange: function (pc, e) {

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