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
        loadedSocket: false
    },
    methods: {
        init: function () {
            let self = this;
            self.questions = [];
            self.testInProcess = true;
            self.answers = [];
            self.selectedQuestion = {};
            let str = window.location.href;
            let newId = Number.parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.startTest(newId);
            self.testingProfileId = newId;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
            if (!self.stream) {
                navigator.getUserMedia(
                    { video: true, audio: true },
                    function (stream) {/*callback в случае удачи*/
                        self.stream = stream;
                        self.cameraRecorder = new MediaRecorder(stream);
                        self.cameraRecorder.ondataavailable = self.recordingCamera;
                        self.cameraRecorder.start(10);
                        let servers = {};

                        //self.pc1 = new RTCPeerConnection({
                        //    iceServers: [
                        //        { urls: "stun:23.21.150.121" },
                        //        { urls: "stun:stun.l.google.com:19302" },
                        //        { urls: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com" }
                        //    ]
                        //});
                        //stream.getTracks().forEach(track => self.pc1.addTrack(track, stream));
                        console.log(stream);
                        // const offer = self.pc1.createOffer(self.offerOptions);
                        //self.pc1.createOffer(function (offer) {
                        //    self.pc1.setLocalDescription(offer, function () {
                        //        console.log(offer);
                        //        $.ajax({
                        //            url: '/user/SaveOffer',
                        //            type: 'POST',
                        //            data: {
                        //                Sdp: offer.sdp,
                        //                Type: offer.type,
                        //                Id: localStorage['placeConfig']
                        //            },
                        //            success: function () {
                        //                self.pc1.onicecandidate = function (e) {
                        //                    // candidate exists in e.candidate
                        //                    if (!e.candidate) return;
                        //                    $.ajax({
                        //                        url: '/user/SaveIcecandidate',
                        //                        type: 'POST',
                        //                        data: {
                        //                            Id: localStorage['placeConfig'],
                        //                            Icecandidate: JSON.stringify(e.candidate)
                        //                        }
                        //                    });
                        //                };
                        //            }
                        //        })
                        //        // send the offer to a server to be forwarded to the friend you're calling.
                        //    }, function () {
                        //    });

                        //}, function () { });
                        //self.getRemoteAnswer();
                        $('#video1')[0].srcObject = stream;

                        if (typeof (WebSocket) !== 'undefined') {
                            self.chatSocket = new WebSocket("ws://localhost/WebApp/ChatHandler.ashx");
                            self.videoSocket = new WebSocket("ws://localhost/WebApp/StreamHandler.ashx");
                        } else {
                            self.chatSocket = new MozWebSocket("ws://localhost/WebApp/ChatHandler.ashx");
                            self.videoSocket = new MozWebSocket("ws://localhost/WebApp/StreamHandler.ashx");
                        }
                        self.chatSocket.onopen = function () {
                            self.chatSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId }));
                            self.getMessages(self.testingProfileId);
                        }
                        self.videoSocket.onopen = function () {
                            self.loadedSocket = true;
                            self.videoSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId }));

                            let STUN = {
                                urls: 'stun:stun.l.google.com:19302'
                            };

                            let TURN = {
                                urls: 'turn:turn.bistri.com:80',
                                credential: 'homeo',
                                username: 'homeo'
                            };

                            let iceServers = {
                                iceServers: [STUN, TURN]
                            };
                            let DtlsSrtpKeyAgreement = {
                                DtlsSrtpKeyAgreement: true
                            };

                            let optional = {
                                optional: [DtlsSrtpKeyAgreement]
                            };

                            self.pc1 = new RTCPeerConnection(servers);
                            stream.getTracks().forEach(track => self.pc1.addTrack(track, stream));
                            self.pc1.onicecandidate = function (event) {
                                let candidate = event.candidate;
                                if (candidate) {
                                    //self.videoSocket.send(JSON.stringify({ candidate: candidate.candidate, address: candidate.address, component: candidate.component, foundation: candidate.foundation, port: candidate.port, priority: candidate.priority, Type: candidate.type, TestingProfileId: self.testingProfileId, IsSource: true, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex  }));
                                    console.log(candidate);
                                    self.videoSocket.send(JSON.stringify({
                                        IsSource: true,
                                        TestingProfileId: self.testingProfileId,
                                        candidate: candidate
                                    }));
                                }
                            };
                            self.pc1.onicecandidatestatechange = function (event) {
                                // let candidate = event.candidate;
                                // if (candidate) {
                                //self.videoSocket.send(JSON.stringify({ candidate: candidate.candidate, address: candidate.address, component: candidate.component, foundation: candidate.foundation, port: candidate.port, priority: candidate.priority, Type: candidate.type, TestingProfileId: self.testingProfileId  }));
                                console.log(event);
                                // }
                            };
                            const offer = self.pc1.createOffer(function (offer) {
                                console.log(offer);
                                self.videoSocket.send(JSON.stringify({
                                    Sdp: offer.sdp,
                                    Type: offer.type,
                                    TestingProfileId: self.testingProfileId//localStorage['placeConfig']
                                }));
                                self.pc1.setLocalDescription(offer, function () {
                                    console.log(offer);
                                    //console.log(offer2);
                                });
                            }, function () { });
                        }
                        self.chatSocket.onmessage = function (msg) {
                            //self.messages.push(msg);
                            let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                            message.Date = new Date(message.Date);
                            console.log(message);
                            self.chat.messages.push(message);
                            //let bffer = new Blob(msg.data, { type: 'video/webm' });
                            //console.log(bffer);
                            // $('#video2')[0].srcObject = bffer;
                            //console.log(msg);
                        };
                        self.videoSocket.onmessage = function (msg) {
                            let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                            console.log(message);
                            if (message.Type == 'answer') {
                                console.log(message);
                                let remoteDescription = new RTCSessionDescription({ sdp: message.Sdp, type: 'answer' });
                                self.pc1.setRemoteDescription(remoteDescription);
                            }
                            else if (message.Type != 'offer') {
                                console.log(message);
                                if (!message.IsSource)
                                    self.pc1.addIceCandidate(message.candidate);
                            }
                        }

                        self.chatSocket.onclose = function (event) {
                            alert('Мы потеряли её. Пожалуйста, обновите страницу');
                        };


                    },
                    function () {/*callback в случае отказа*/ });
            }
            else {
                self.cameraRecorder.start(10);
            }
        },
        startTest: function (id) {
            let self = this;
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
            })).then(function (resp1, resp2, resp3) {
                //Получаем пакеты вопросов, ответов и то, как их разместить
                self.questions = resp2[0];

                //Добавляем пару своих полей для удобной работы (флаг, что выбран один из вариантов ответа, и порядок)
                resp3[0].map(a => { a.IsAnswered = false; a.TestingPackage = resp1[0].Packages.find(b => b.AnswerId == a.Id) });
                self.answers = resp3[0];
                self.timeStart = new Date(resp1[0].Date);
                self.startTimer(self.timeStart);
                if (resp1[0].Answered && resp1[0].Answered.length > 0) {
                    self.questions.forEach(a => {
                        resp1[0].Answered.forEach(b => {
                            if (a.Id == b.Id) {
                                if (a.TypeAnswerId == 1) {
                                    if (b.UserAnswer) {
                                        a.answer = b.AnswerId;
                                        a.answered = true;
                                    }
                                }
                                else if (a.TypeAnswerId == 2) {
                                    if (b.UserAnswer) {
                                        self.answers.find(c => c.Id == b.AnswerId).IsAnswered = true;
                                        a.answered = true;
                                    }
                                }
                                else if (a.TypeAnswerId == 3) {
                                    a.answered = true;
                                    a.answer = b.UserAnswer;
                                }
                            }
                        })
                    })
                }
                //Маппим ответы для вопросов, добавляем флаги загрузки, изменения и ответа в принципе
                self.questions.map(a => { a.Answers = self.answers.filter(b => b.QuestionId == a.Id); a.IsLoaded = false; a.changed = false; a.answered = a.answered ? a.answered : false; });
                //Сортируем вопросы в нужном порядке
                self.questions.sort((a, b) => a.Rank - b.Rank);
                //Сортируем ответы
                self.questions.forEach(a => a.Answers.sort((b, c) => b.Sort - c.Sort));
                //Текущий вопрос выбираем первый
                self.selectQuestion(1);
                //Флаг, что началася тест
                self.testInProcess = true;
                self.startCheckConnection(id);
            });
        },
        recordingCamera: function (event) {
            //console.log(event);
            //if (event.data && event.data.size > 0) {
                app.recordedCamera.push(event.data);
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
            self.selectedQuestion.Answers.forEach(a => { a.IsAnswered = a.Id == id ? !a.IsAnswered : false; });
            //Ставим метку, что ответ менялся, чтобы не загружать по 100500 раз после каждого выбора вопроса
            self.selectedQuestion.changed = true;

            self.selectedQuestion.answered = true;
        },
        changeCheck: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            let self = this;

            let flag = false;
            this.selectedQuestion.Answers.forEach(a => flag = a.IsAnswered || flag);
            self.selectedQuestion.answered = flag;
        },
        changeText: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            this.selectedQuestion.answered = true;
        },
        IsQuestionAnswered: function (id) {
            let self = this;
            let flag = false;
            self.questions.forEach(a => flag = (a.Rank === id && a.answered) || flag);
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
            self.selectedQuestion = self.questions.find(a => a.Rank == id);
            //Если не загружали изображения, то загружаем
            if (!self.selectedQuestion.IsLoaded) {
                //Изображение вопроса
                self.loadObject.loaded = false;
                self.loadObject.loading = true;
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetQuestionImage?Id=' + self.selectedQuestion.Id,
                    success: function (d) {
                        self.selectedQuestion.QuestionImage = d.QuestionImage;
                        //После загрузки ставим метку, что загружено
                        self.selectedQuestion.IsLoaded = true;
                    }
                });
                let counter = 0;
                //Изображения ответов
                if (self.selectedQuestion.TypeAnswerId != 3) {
                    self.selectedQuestion.Answers.forEach(a => {
                        $.ajax({
                            type: 'POST',
                            dataType: 'json',
                            url: '/user/GetAnswerImage?Id=' + a.Id,
                            success: function (d) {
                                a.AnswerImage = d.AnswerImage;
                                counter++;
                                if (counter == self.selectedQuestion.Answers.length) {
                                    self.loadObject.loading = false;
                                    self.loadObject.loaded = true;
                                    //self.loadTestObject.loading = false;
                                    //self.loadTestObject.loaded = true;
                                }
                            }
                        });
                    })
                }
                else {
                    self.loadObject.loading = false;
                    self.loadObject.loaded = true;
                }
            }
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
        answerQuestion() {
            let self = this;
            let answers = [];
            //Запаковываем все ответы для предыдущего вопроса
            if (self.selectedQuestion.TypeAnswerId != 3) {
                self.selectedQuestion.Answers.forEach(function (item) {
                    answers.push({ TestingPackageId: item.TestingPackage.Id, TestingTime: 3, UserAnswer: item.IsAnswered ? "1" : null });
                })
            }
            else {
                answers.push({ TestingPackageId: self.selectedQuestion.Answers[0].TestingPackage.Id, TestingTime: 3, UserAnswer: self.selectedQuestion.answer });

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
                    //self.finishTest();
                }
            }, 1000);
            self.startCapture();
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
                    processData: false
                });
                // }
            }, 5000)


            // obj.src = src;
            //obj.srcObject = self.buffer;
            //location.reload();
            console.log(self.selectedTest);
            $.ajax({
                url: "/user/HasConnection",
                type: "POST",
                data: {
                    TestingProfileId: self.selectedTest.Id,
                    NeedDispose: true
                }
            });
            clearTimeout(self.intervalConnectionLost);
            clearTimeout(self.intervalConnection);
            //window.open('/user/waiting', '_self');
            //self.init();
        },
        startCapture: function (displayMediaOptions) {
            let self = this;
            let captureStream = null;

            navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function (Str) {
                $('#video2')[0].srcObject = Str;

                self.screenRecorder = new MediaRecorder(Str);
                self.screenRecorder.ondataavailable = self.recordingScreen;
                self.screenRecorder.start(10);
                console.log(Str);
            })
                .catch(err => { console.error("Error:" + err); return null; });
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

            self.questions.forEach(a => count = a.answered ? (count - 1) : count);
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
        isZeroNeed(value) {
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
            console.log(self.tipPosition);
        },
        resizing: function (self) {
            $(document).on('mouseup', function () { self.stopResizing(self); });
            $('#panel-right').width(self.tipPosition.start - event.pageX);
        },
        stopResizing: function (self) {
            self.tipPosition.width = $('#panel-right').width();
            $(document).off('mousemove');
            $(document).off('mouseup');
        },

        toggleChat: function () {
            let self = this;
            self.chat.IsOpened = !self.chat.IsOpened;
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
                    messages.map(a => a.Date = new Date(Number(a.Date.substr(a.Date.indexOf('(') + 1, a.Date.indexOf(')') - a.Date.indexOf('(') - 1))));
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
        }
    },
    mounted() {
        this.init();
    }
});