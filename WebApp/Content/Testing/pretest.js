const app = new Vue({
    el: "#main-window",
    data: {
        hasPlaceConfig: false,
        tests: null,
        domain: "",
        activeTests: [],
        testingTests: [],
        user: '',
        //packages: [],
        interval: null,
        findTestInterval: null,
        findPlaceInterval: null,
        hasTestsToday: false,
        PIN: null,
        loadObject: {
            loading: null,
            loaded: null
        },
        recordedCamera: [],
        cameraRecorder: null,
        videoSockets: [],
        loadTestObject: {
            loading: null,
            loaded: null
        },
        localization: 1,
        videoSocket: null,
        chatSocket: null,
        chat: {
            IsOpened: false,
            participants: [],
            messages: [],
            Message: "",
            testingProfileId: 0
        },
        artFlag: false,
        recognized: false,
        tryRec: false,
        noFace: false,
        unreadCount: 0,
        verified: false,
        verifyInterval: null,
        pc1: null,
        stream: null,
        queue: [],
        enabled: false,
        counter: 0,
        testingProfileId: 0,
        identificationTimeLeft: 45,
        TURN: {}
    },
    methods: {
        init: function () {
            var self = this;
            self.loadTestObject.loading = true;
            self.loadTestObject.loaded = false;
            self.loadObject.loading = true;
            self.loadObject.loaded = false;
            var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (is_safari || navigator.userAgent.indexOf("Edge") > -1 || (typeof document !== 'undefined' && !!document.documentMode)) {
                notifier([{ Type: 'error', Body: self.switchLocal(18) }]);
            }
            //Загрузка доступных тестов 
            self.loadTests();

            if (localStorage['placeConfig']) {

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/api/account/IsAuthenticated',
                    success: function (d) {
                        if (d) {
                            $.ajax({
                                url: "/api/account/GetDomain",
                                type: "POST",
                                async: false,
                                success: function (domain) {
                                    self.domain = domain;
                                }
                            });

                            $.ajax({
                                url: "/api/account/GetLoginAndPassword",
                                type: "post",
                                async: false,
                                success: function (info) {
                                    //self.domain = domain;
                                    self.TURN = {
                                        url: 'turn:turn.ncfu.ru:8443',
                                        credential: info.Password,
                                        username: info.Login
                                    };
                                }
                            });
                        }
                        else {

                            clearInterval(self.findTestInterval);
                        }
                    }
                });

                setInterval(self.findTestInterval);
                self.hasPlaceConfig = true;
            }
            else {
                self.hasPlaceConfig = false;
                clearInterval(self.findTestInterval);

                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/api/account/IsAuthenticated',
                    success: function (d) {
                        if (d) {
                            self.startPlaceConfigInterval();
                        }
                    }
                });
            }
            setTimeout(function () {
                document.title = self.switchLocal(10);
            }, 600);
            //self.startCapture({ video: { cursor: 'always', logicalSurface: true }, audio: true });
        },
        isTodayLater: function (test) {
            test.TestingDate = new Date(test.TestingDate);
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday && test.TestingDate > new Date() && [1, 5].indexOf(test.StatusId) != -1;
        },
        isToday: function (test) {
            test.TestingDate = new Date(test.TestingDate);
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday && test.TestingDate < new Date() && [1, 5].indexOf(test.StatusId) != -1;
        },
        loadTests: function () {
            var self = this;

            $.ajax({
                url: "/api/user/GetUserTests?Localization=" + (localStorage["localization"] == 1 ? 'Ru' : 'En'),
                method: "get",
                success: function (data) {
                    if (data.length > 0) {
                        data.forEach(function (test) {
                            self.hasTestsToday = self.isTodayLater(test) || self.hasTestsToday;
                        })
                    }
                }
            })
            self.findTestInterval = setInterval(function () {
                self.loadObject.loading = true;
                self.loadObject.loaded = false;
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/api/user/GetTests?PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    success: function (d) {
                        if (d.Error) {
                            localStorage.removeItem('placeConfig');
                            clearInterval(self.findTestInterval);
                            self.hasPlaceConfig = false;
                            location.reload();
                            return;
                        }
                        if (d.length == 0) {
                            self.tests = [];
                            //localStorage.removeItem('placeConfig');
                            return;
                        }
                        //Отобразить дату в корректном формате
                        //d.forEach(a => {
                        //    var date = new Date(Number(a.TestingDate.substr(a.TestingDate.indexOf('(') + 1, a.TestingDate.indexOf(')') - a.TestingDate.indexOf('(') - 1)));
                        //    a.TestingDate = date.toLocaleString('Ru-ru');
                        //});
                        var flag = false;
                        var min = 0;
                        //Запись и отображение доступных тестов
                        if (!self.tests) {
                            //self.tests = d;
                            self.tests = d.filter(function (a) { return !a.IsForTesting; });
                            self.testingTests = d.filter(function (a) { return a.IsForTesting; });
                            var activeTests = self.testingTests.filter(function (item) { return item.TestingStatusId === 2; });
                            if (activeTests.length > 0) {
                                activeTests.forEach(function (test) {
                                    $.ajax({
                                        type: 'POST',
                                        dataType: 'json',
                                        url: '/api/user/FinishTest?Id=' + test.Id,
                                        success: function (d) {
                                            test.TestingStatusId = 3;
                                        }
                                    });
                                });
                            }
                            //navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
                            //console.log(window.URL);
                            //window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL || webkitURL.createObjectURL() || URL.createObjectURL();
                            min = self.tests.length > 0 ? self.tests[0].Id : 0;
                            //console.log(min);
                            self.tests.forEach(function (item) {
                                min = min > item.Id ? item.Id : min;
                                if (item.DisciplineName == 'Испытание творческой направленности (Журналистика)') {
                                    self.artFlag = true;
                                }
                            })
                            //console.log(self.artFlag);
                            //var min = d[0].Id;
                            //d.forEach(function (item) {
                            //    min = min > item.Id ? item.Id : min;
                            //})
                            self.testingProfileId = min;// d[0].Id;
                            if (min != 0) {
                                console.log(self.tests);
                                let founded = self.tests.find(function (atest) { return atest.IsCameraControl == true; });
                                if (founded) {
                                    console.log(founded);
                                    self.initWebCam();
                                }
                                else {
                                    self.verified = true;
                                }
                                //self.initChat();
                                self.initChatSignal(founded);
                                clearInterval(self.findTestInterval);
                            }
                            self.loadObject.loading = false;
                            self.loadObject.loaded = true;
                            //self.initRTCPeer();
                        }
                        else {
                            console.log('else', d);
                            d.forEach(function (test) {
                                var founded = self.tests.filter(function (atest) { return atest.Id == test.Id; })[0];
                                //console.log('founded', founded);
                                if (!founded) {
                                    //console.log('!founded', test);
                                    if (!test.IsForTesting) {
                                        //console.log('flag', test);
                                        self.tests.push(test);
                                        flag = true;
                                    }
                                }
                            });
                        }
                        //Информация о человеке, проходящим тест
                        self.user = d[0].LastName + " " + d[0].FirstName + " " + d[0].MiddleName;
                        //Если назначен тест, то больше не загружать
                        if (flag) {
                            min = self.tests[0].Id;
                            self.tests.forEach(function (item) {
                                min = min > item.Id ? item.Id : min;
                            })
                            self.testingProfileId = min;// d[0].Id;
                            if (min != 0) {
                                let founded = self.tests.find(function (atest) { return atest.IsCameraControl == true; });
                                if (founded) {
                                    console.log(founded);
                                    self.initWebCam();
                                }
                                else {
                                    self.verified = true;
                                }
                                //self.initChat();
                                //self.initStreamSignal();
                                clearInterval(self.findTestInterval);
                            }
                            clearInterval(self.findTestInterval);
                        }
                    },
                    error: function (e) {
                        console.log(e);

                    }
                });
            }, 5000);
        },
        //startCapture: function (displayMediaOptions) {
        //    var self = this;
        //    //var captureStream = null;

        //    navigator.mediaDevices.getDisplayMedia(displayMediaOptions).then(function (Str) {
        //        var tracks = Str.getVideoTracks();
        //        console.log(tracks[0].getSettings());
        //        if (tracks[0].getSettings().displaySurface != 'monitor') {
        //            console.log('fuck u');
        //            self.startCapture();
        //        }
        //        $('#video2')[0].srcObject = Str;
        //        Str.oninactive = function (er) {
        //            console.log(er);
        //            self.startCapture(displayMediaOptions);
        //        };
        //    })
        //        .catch(function (err) {
        //            console.error("Error:" + err);
        //            self.startCapture(displayMediaOptions);
        //            alert("Обновите страницу и разрешите запись экрана!");
        //            return null;
        //        });
        //},
        startPlaceConfigInterval: function () {
            var self = this;
            self.findPlaceInterval = setInterval(function () {
                //GetFreePlaces
                $.ajax({
                    url: "/api/user/GetFreePlaces",
                    type: "POST",
                    async: true,
                    success: function (data) {
                        if (data.Message) {
                            notifier([{ Type: 'error', Body: self.switchLocal(21) }]);
                        }
                        if (data.Id != 0) {
                            self.createPlaceConfig(data.PlaceId, data.PlaceProfile);
                            clearInterval(self.findPlaceInterval);
                            location.reload();
                            setInterval(self.findTestInterval);
                        }
                    }
                });
            }, 3000);
        },
        initChatSignal(place) {
            let self = this;
            console.log(place);

            self.chatSocket = $.connection.ChatHub;
            $.connection.hub.url = "../signalr";
            //$.connection.hub.proxy = 'ChatHub';

            self.chatSocket.client.onMessageGet = function (Id, TestingProfileId, message, date, admin) {
                let Message = self.initChatMessage(Id, message, date, admin);
                self.chat.messages.push(Message);
                if (!self.chat.IsOpened) {
                    self.unreadCount++;
                }
            }
            self.initStreamSignal();

            self.getMessages(self.testingProfileId);
            $.connection.hub.start().done(function () {
                self.chatSocket.server.connect(place.Id, false);
                self.streamSocket.server.connect(self.testingProfileId, false);
            }).fail(function (exc) {
                console.error(exc);
            });

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
                self.chatSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.testingProfileId, IsSender: true }));
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
        initStreamSignal() {
            let self = this;
            self.streamSocket = $.connection.StreamHub;

            self.streamSocket.url = '../signalr';
            //$.connection.hub.url = "../signalr";
            // self.streamSocket.proxy = 'StreamHub';

            self.streamSocket.client.setVerified = function (IsVeified) {
                self.verified = IsVeified;
            }
            self.streamSocket.client.requestReset = function () {
                localStorage.removeItem('placeConfig');
                window.open('/account/logout', '_self');
            }
        },
        checkAuth: function (placeId, PlaceProfile) {
            if (localStorage['placeConfig']) {
                //console.log();
            } else {
                this.createPlaceConfig(placeId, PlaceProfile);
            }
        },
        //Запуск теста
        startTest: function (id) {
            var self = this;
            window.open(window.location.protocol + '//' + window.location.hostname + "/user/process?Id=" + id, '_self');

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
                    setTimeout(function () {
                        $('#message-' + maxId)[0].scrollIntoView();
                    }, 20);
                }
            }
        },
        initSocket: function (id) {
            let self = this;
            let socket = null;
            if (typeof (WebSocket) !== 'undefined') {
                socket = new WebSocket(self.domain + "/StreamHandler.ashx");
            } else {
                socket = new MozWebSocket(self.domain + "/StreamHandler.ashx");
            }
            socket.onopen = function () {
                socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: id }));
                // self.initRTCPeer();
            };

            socket.onmessage = function (msg) {
                var message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));

                if (!message.IsSender) {
                    if (message.candidate && message.candidate != '{}') {
                        var candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                        self.queue.push(candidate);
                    }

                    else if (message.answer) {
                        self.pc1.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.answer)), function (r) {

                            self.queue.forEach(function (candidate) {
                                self.pc1.addIceCandidate(candidate);
                            })
                        }, function (r) { console.log(r); })
                    }
                    else if (message.verified != undefined) {
                        self.verified = message.verified;
                        if (message.verified == true) {
                            notifier([{ Type: 'success', Body: self.switchLocal(16) }]);
                        }
                        else {
                            notifier([{ Type: 'error', Body: self.switchLocal(17) }]);
                        }
                        clearInterval(self.verifyInterval);
                    }
                    else if (message.requestOffer) {
                        self.initRTCPeer();
                    }
                    else if (message.resetRequest) {
                        localStorage.removeItem('placeConfig');
                        window.open('/account/logout', '_self');
                        //location.reload();
                    }
                    else if (message.reloadRequest) {
                        window.reload(true);
                        //location.reload();
                    }
                }
            };
            socket.onclose = function () {
                console.log('Соединение сброшено');
                self.initWebCam();
            };
            self.videoSocket = socket;
        },
        initWebCam: function () {
            var self = this;
            //self.initSocket(self.testingProfileId);
            //if (!self.stream) {
            navigator.mediaDevices.getUserMedia(
                {
                    video: true//,
                    //audio: true
                }).then(function (stream) {/*callback в случае удачи*/
                    self.stream = stream;
                    self.enabled = true;
                    $('#video1')[0].srcObject = stream;

                    //if (typeof (WebSocket) !== 'undefined') {
                    //    self.videoSocket = new WebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                    //} else {
                    //    self.videoSocket = new MozWebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                    //}
                    //if (typeof (WebSocket) !== 'undefined') {
                    //    self.videoSocket = new WebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                    //} else {
                    //    self.videoSocket = new MozWebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                    //}


                    //self.tests.forEach(function (item) {
                    //    self.initSocket(item.Id);
                    //});
                    //self.testingTests.forEach(function (item) {
                    //    self.initSocket(item.Id);
                    //});
                }).catch(
                    function (er) {/*callback в случае отказа*/
                        notifier([{ Type: 'error', Body: self.switchLocal(8) }]);
                       // alert(self.switchLocal(8));
                        self.enabled = false;
                    });
            //}
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
                    messages.map(function (a) {
                        a.Date = new Date(a.Date);
                        //a.Date = new Date(Number(a.Date.substr(a.Date.indexOf('(') + 1, a.Date.indexOf(')') - a.Date.indexOf('(') - 1)));
                    });
                    self.chat.messages = messages;
                }
            });
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
        initChatMessage(Id, message, date, admin) {
            return {
                Id: Id,
                Message: message,
                Date: new Date(date),
                IsAdmin: admin
            };
        },
        sendMessage: function (self1) {
            var self = self1 ? self1 : this;
            if (self.chat.Message.trim() == "") {
                return;
            }
            let date = new Date();
            self.chat.Message = self.chat.Message.trim();
            $.ajax({
                url: "/api/user/SendMessage",
                type: "POST",
                async: true,
                data: {
                    Message: self.chat.Message,
                    Date: date,
                    IsSender: false,
                    TestingProfileId: self.testingProfileId,
                    ParentId: null
                },
                success: function (Id) {
                    let Message = self.initChatMessage(Id, self.chat.Message, date, false);

                    self.chat.messages.push(Message);
                    self.chatSocket.server.sendMessage(Id, self.testingProfileId, self.chat.Message, false);
                    self.chat.Message = "";
                }
            });

            //self.chatSocket.send(JSON.stringify({ Message: self.chat.Message, Date: new Date(), IsSender: true, TestingProfileId: self.testingProfileId, ParentId: null }));
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        },
        startRecord: function () {
            var self = this; var options;
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                options = { mimeType: 'video/webm; codecs=vp9' };
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
                options = { mimeType: 'video/webm; codecs=vp8' };
            }
            self.cameraRecorder = new MediaRecorder(self.stream, options);
            self.cameraRecorder.ondataavailable = self.recordingCamera;
            self.cameraRecorder.start(100);
            setTimeout(function () {
                if (self.cameraRecorder && self.cameraRecorder.state != 'inactive') self.cameraRecorder.stop();
                var bufferCamera = new Blob(self.recordedCamera, { type: 'video/webm' });
                var formaData1 = new FormData();

                formaData1.append('Id', self.testingProfileId);
                formaData1.append('Type', 1);
                formaData1.append('File', bufferCamera, 'identification');

                $.ajax({
                    url: "/user/SaveVideoFile",
                    type: "POST",
                    data: formaData1,
                    contentType: false,
                    processData: false,
                    success: function () {

                        clearInterval(self.verifyInterval);
                        self.verified = true;
                    }
                });



            }, 40000);
            self.enabled = false;
            var intLeft = setInterval(function () {
                self.identificationTimeLeft--;
                if (self.identificationTimeLeft == 0) {
                    clearInterval(intLeft);
                }
            }, 1000)
        },
        recordingCamera: function (event) {
            app.recordedCamera.push(event.data);
            // var reader = new FileReader();
        },
        tryVerify: function () {
            var self = this;
            try {
                self.tryRec = true;

                //self.verifyInterval = setInterval(function () {
                var canvas = document.createElement('canvas');
                var context = canvas.getContext('2d');
                canvas.width = 320;
                canvas.height = 230;
                context.drawImage($('#video1')[0], 0, 0, 320, 230);
                var data = canvas.toDataURL('image/png');
                if (!self.artFlag) {
                    $.ajax({
                        url: "/api/user/TryVerify",
                        type: "POST",
                        async: true,
                        data: { Image: data.substr(22), Id: self.testingProfileId },
                        success: function (res) {
                            if (res.Error == 1) {
                                self.noFace = true;
                            }
                            else {
                                self.recognized = res;
                                if (!res) {
                                    self.noFace = false;
                                }
                                else {
                                    clearInterval(self.verifyInterval);

                                    self.verified = true;

                                }
                            }
                        }
                    });
                }
                else {
                    self.startRecord();
                }
                //}, 500);
            }
            catch (exc) {
                console.log(exc);
            }
        },
        initRTCPeer: function () {
            var self = this;
            var STUN = {
                urls: 'stun:stun.advfn.com:3478'
            };
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
                self.TURN]
            };
            self.pc1 = new RTCPeerConnection(configuration);
            self.pc1.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(e);
            });

            self.pc1.addEventListener('connectionstatechange', function (event) {

                if (self.pc1.connectionState == 'connecting') {
                    setTimeout(function () {
                        if (self.pc1.connectionState == 'connecting') {
                            self.pc1.close();
                            self.initRTCPeer();
                        }
                    }, 10000)
                }
                if (self.pc1.connectionState == 'disconnected') {
                    self.initRTCPeer();
                }
            });
            self.stream.getTracks().forEach(function (track) {
                self.pc1.addTrack(track, self.stream);
            });

            try {
                self.pc1.createOffer(function (offer) {
                    self.pc1.setLocalDescription(offer, function () {
                        var obj1 = {};
                        for (var i in offer) {
                            if (typeof offer[i] != 'function')
                                obj1[i] = offer[i];
                        }
                        var obj = {
                            offer: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId, type: 1
                        };
                        if (app.videoSocket && app.videoSocket.readyState == 1) {
                            app.videoSocket.send(JSON.stringify(obj));
                        }
                    }, function () { });
                }, function () { }, { 'mandatory': { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } });
                self.loadTestObject.loading = false;
                self.loadTestObject.loaded = true;
            }
            catch (e) {
                console.log('error');
            }
        },
        onIceCandidate: function (e) {
            var obj1 = {};
            for (var i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            var obj = {
                candidate: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.testingProfileId, type: 1
            };
            if (app.videoSocket && app.videoSocket.readyState == 1) {
                //app.gotICE = true;
                app.videoSocket.send(JSON.stringify(obj));
            }
        },
        askReset: function () {
            var self = this;
            //GetChatMessages
            $.ajax({
                url: "/api/user/ResetPlaceRequest",
                type: "POST",
                async: false,
                success: function (response) {
                    if (response == 1) {
                        notifier([{ Type: 'success', Body: self.switchLocal(15) }]);
                        localStorage.removeItem('placeConfig');
                        location.reload();
                    }
                    else {
                        notifier([{ Type: 'error', Body: self.switchLocal(14) }]);

                    }
                }
            });
        },
        switchLocal: function (id) {
            var self = this;
            switch (id) {
                case 1: return localStorage["localization"] == 1 ? "Вам доступны следующие вступительные испытания для прохождения" : "The following tests are available";
                case 2: return localStorage["localization"] == 1 ? "Вы не завершили следующие вступительные испытания" : "Not completed";
                case 3: return localStorage["localization"] == 1 ? "Режим ожидания" : "Waiting";
                case 4: return localStorage["localization"] == 1 ? "Пожалуйста, ожидайте. В данный момент все места заняты, либо Вы авторизовались ранее на другом устройстве" : "Please, wait. Available tests will be shown below";
                case 5: return localStorage["localization"] == 1 ? "Администратор" : "Administrator";
                case 6: return localStorage["localization"] == 1 ? 'Перед началом вступительного испытания необходимо пройти процедуру идентификации личности. Нажмите кнопку "Подтвердить" и посмотрите в камеру' : 'Before start, You must verify Your identity. Push Verify and watch to camera';
                case 7: return localStorage["localization"] == 1 ? "Подтвердить" : "Verify";
                case 8: return localStorage["localization"] == 1 ? "Камера не найдена. Прохождение тестирования невозможно" : "Camera not found. Testing is not available";
                case 9: return localStorage["localization"] == 1 ? "Для тестирования системы можете воспользоваться следующими вступительными испытаниями" : "You can try preliminary tests";
                case 10: return localStorage["localization"] == 1 ? "Режим ожидания" : "Waiting";
                case 11: return localStorage["localization"] == 1 ? "Тесты не назначены. Ожидайте..." : "You don't have any tests. Wait...";
                case 12: return localStorage["localization"] == 1 ? "Вы можете запросить сбросить предыдущее устройство: " : "You may request for reset previous PC:";
                case 13: return localStorage["localization"] == 1 ? "Сбросить" : "Reset";
                case 14: return localStorage["localization"] == 1 ? "Во время выполнения запроса произошла ошибка" : "An error occured during Your request";
                case 15: return localStorage["localization"] == 1 ? "Запрос успешно отправлен" : "Your request has been sent";
                case 16: return localStorage["localization"] == 1 ? "Идентификация успешна" : "Identification succeeded";
                case 17: return localStorage["localization"] == 1 ? "Вы не идентфицированы" : "Your identification failed";
                case 18: return localStorage["localization"] == 1 ? "Ваш браузер не поддерживается. Воспользуйтесь другим устройством" : "Your browser is not supported. Please, try another device";
                case 19: return localStorage["localization"] == 1 ? "До окончания процедуры идентификации осталось: " : "Until the end of identification left: ";
                case 20: return localStorage["localization"] == 1 ? "секунд" : "seconds";
                case 21: return localStorage["localization"] == 1 ? "Тесты не назначены. Можете покинуть страницу" : "Tests not found. You may leave this page now";
                case 22: return localStorage["localization"] == 1 ? "Сброс предыдущих устройств завершит все незаконченные тесты. Вы уверены, что хотите продолжить?" : "Reset will automatically finish all the started tests. Are You sure to continue?";
                case 23: return localStorage["localization"] == 1 ? "На сегодня ВИ не назначено. Вы можете покинуть страницу" : "There are no tests today. You may close the page";
            }
        },
        isMe: function (message) {
            var self = this;
            return message.UserIdFrom == self.currentUser;
        },
        createPlaceConfig: function (placeId, PlaceProfile) {
            var self = this;
            if (placeId == 0 || PlaceProfile == 0) return;
            var str = CryptoJS.AES.encrypt("place-" + placeId, "Secret Passphrase");
            localStorage['placeConfig'] = str.toString();
            var obj = { Id: PlaceProfile, PlaceConfig: str.toString(), PlaceId: placeId };
            $.ajax({
                url: "/api/auditory/UpdatePlaceConfig",
                type: "POST",
                async: true,
                data: obj,
                success: function (data) {
                    self.hasPlaceConfig = true;
                    //window.open('/account/logout', '_self');
                    //location.reload();

                }
            });
        }
    },
    //После полной загрузки скрипта инициализируем
    mounted: function () {
        //$('#video-wrapper').draggable();
        this.init();
        $(window).on('focus');
    },
    watch: {
        PIN: function (val, oldval) {
            var self = this;
            if (self.PIN > 999)
                $.ajax({
                    url: '/auditory/GetPlaceConfig?pin=' + self.PIN,
                    method: 'post',
                    success: function (data) {
                        if (data.Error) {
                            self.PIN = null;
                            return;
                        }
                        self.createPlaceConfig(data.Id, data.PlaceProfileId);
                    }
                })
        },
        tests: function (val, oldval) {
            var self = this;
            self.activeTests = val.filter(function (a) { return a.TestingStatusId === 2; });
        }

        //,
        //stopTheTime
    }
});