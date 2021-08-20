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
        findTestInterval: null,
        findPlaceInterval: null,
        hasTestsToday: false,
        PIN: null,
        loadObject: {
            loading: null,
            loaded: null
        },
        requestCameraStreams: [],
        peers: [],
        recordedCamera: [],
        cameraRecorder: null,
        loadTestObject: {
            loading: null,
            loaded: null
        },
        localization: 1,
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
        enabled: false,
        testingProfileId: 0,
        identificationTimeLeft: 45,
        TURN: {}
    },
    methods: {
        init: function () {
            var self = this;
            self.loadTestObject.loading = true;
            self.loadTestObject.loaded = false;
            //self.loadObject.loading = true;
            //self.loadObject.loaded = false;
            var is_safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            if (is_safari || navigator.userAgent.indexOf("Edge") > -1 || (typeof document !== 'undefined' && !!document.documentMode)) {
                notifier([{ Type: 'error', Body: self.switchLocal(18) }]);
            }

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

                //Загрузка доступных тестов 
                self.loadTests();
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
                                    self.initChatSignal(founded);
                                }
                                else {
                                    self.verified = true;
                                }
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
        initStreamSignal() {
            let self = this;
            self.streamSocket = $.connection.StreamHub;

            self.streamSocket.url = '../signalr';

            self.streamSocket.client.setVerified = function (IsVeified) {
                self.verified = IsVeified;
            }
            self.streamSocket.client.requestReset = function () {
                localStorage.removeItem('placeConfig');
                window.open('/account/logout', '_self');
            }
            self.streamSocket.client.requestOffer = function (Type, guid) {
                if (self.cameraStream) {
                    self.initRTCPeer(guid);
                }
                else {
                    self.requestCameraStreams.push(guid);
                }
            }
            self.streamSocket.client.sendAnswer = function (Answer, Type, guid) {
                var found = self.peers.filter(function (item) { return item.uid == guid; })[0];
                if (found) {
                    var peer = found.peer;
                    peer.setRemoteDescription(new RTCSessionDescription(Answer), function (r) {
                    }, function (r) { console.log(r); });
                }
            }
            self.streamSocket.client.sendIceCandidate = function (Id, Type, candidate, guid, IsAdmin) {
                if (IsAdmin) {
                    var found = self.peers.filter(function (item) { return item.uid == guid; })[0];
                    if (found) {
                        var peer = found.peer;
                        peer.addIceCandidate(candidate);
                    }
                }
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
        initWebCam: function () {
            var self = this;
            //self.initSocket(self.testingProfileId);
            //if (!self.stream) {
            navigator.mediaDevices.getUserMedia(
                { video: { facingMode: 'user' }, audio: false }).then(function (stream) {/*callback в случае удачи*/
                    self.stream = stream;
                    self.enabled = true;
                    $('#video1')[0].srcObject = stream;

                    if (self.requestCameraStreams.length > 0) {

                        self.requestCameraStreams.forEach(function (guid) {
                            self.initRTCPeer(guid);
                        });
                        self.requestCameraStreams = [];
                    }
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
        initRTCPeer: function (uid) {
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
                self.onIceCandidate(e, uid);
            });
            //peer.addEventListener('iceconnectionstatechange', function (e) {
            //    self.onIceStateChange(self.pc1, e);
            //});
            //peer.addEventListener('connectionstatechange', function (event) {
            //    console.log(peer.connectionState);
            //});
            if (!self.stream) {
                peer.close();
                peer = null;
                setTimeout(function () { self.initRTCPeer(uid) }, 500);
                return;
            }
            stream.getTracks().forEach(function (track) {
                peer.addTrack(track, stream);
            });
            //app.videoSocket.send(JSON.stringify({ IsSender: true, TestingProfileId: app.testingProfileId, uid: uid }));
            var found = self.peers.filter(function (item) { return item.uid == uid; })[0];
            if (found) {
                found.peer.close();
                found.peer = peer;
            }
            else {
                self.peers.push({ peer: peer, uid: uid });
            }
            try {
                peer.createOffer(function (offer) {
                    peer.setLocalDescription(offer, function () {
                        self.streamSocket.server.sendOffer(app.testingProfileId, offer, 1, uid);
                    }, function (r) { console.log(r); });
                }, function (r) { console.log(r); }, { 'mandatory': { 'OfferToReceiveAudio': false, 'OfferToReceiveVideo': false } });
            }
            catch {
                console.log('error');
            }

        },
        onIceCandidate: function (e, uid) {
            let self = app;
            self.streamSocket.server.sendIceCandidate(app.testingProfileId, 1, e.candidate, uid, false);
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