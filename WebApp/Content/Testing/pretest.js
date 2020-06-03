const app = new Vue({
    el: "#main-window",
    data: {
        hasPlaceConfig: false,
        tests: null,
        activeTests: [],
        user: '',
        //packages: [],
        interval: null,
        findTestInterval: null,
        findPlaceInterval: null,
        PIN: null,
        loadObject: {
            loading: null,
            loaded: null
        },
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
        unreadCount: 0,
        verified: false,
        pc1: null,
        stream: null,
        queue: []
    },
    methods: {
        init: function () {
            let self = this;
            //Загрузка доступных тестов 
            self.findTestInterval = setInterval(function () {
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetTests?PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    success: function (d) {
                        console.log(d);
                        if (d.Error) {
                            localStorage.removeItem('placeConfig');
                            clearInterval(self.findTestInterval);
                            self.hasPlaceConfig = false;
                            return;
                        }
                        if (d.length == 0) {
                            return;
                        }
                        //Отобразить дату в корректном формате
                        //d.forEach(a => {
                        //    var date = new Date(Number(a.TestingDate.substr(a.TestingDate.indexOf('(') + 1, a.TestingDate.indexOf(')') - a.TestingDate.indexOf('(') - 1)));
                        //    a.TestingDate = date.toLocaleString('Ru-ru');
                        //});
                        //Запись и отображение доступных тестов
                        if (!self.tests) {
                            self.tests = d;
                            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
                            window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
                            self.initWebCam();
                            //self.initRTCPeer();
                        }
                        else {
                            self.tests = null;
                            self.tests = d;
                        }
                        //Информация о человеке, проходящем тест
                        self.user = d[0].LastName + " " + d[0].FirstName + " " + d[0].MiddleName;
                        //Если назначен тест, то больше не загружать
                        if (d.length > 0) {
                            clearInterval(self.findTestInterval);
                            self.findTestInterval = null;
                        }
                    },
                    error: function (e) {
                        console.log(e);

                    }
                });
            }, 1000);

            if (localStorage['placeConfig']) {
                setInterval(self.findTestInterval);
                self.hasPlaceConfig = true;
            }
            else {
                self.hasPlaceConfig = false;
                clearInterval(self.findTestInterval);
                self.findTestInterval = null;
                self.startPlaceConfigInterval();
            }
        },
        startPlaceConfigInterval: function () {
            let self = this;
            self.findPlaceInterval = setInterval(function () {
                //GetFreePlaces
                $.ajax({
                    url: "/user/GetFreePlaces",
                    type: "POST",
                    async: true,
                    success: function (data) {
                        if (data.Id != 0) {
                            self.createPlaceConfig(data.PlaceId, data.PlaceProfile);
                            clearInterval(self.findPlaceInterval);
                        }
                    }
                });
            }, 5000);
        },
        checkAuth: function (placeId, PlaceProfile) {
            if (localStorage['placeConfig']) {
                console.log();
            } else {
                this.createPlaceConfig(placeId, PlaceProfile);
            }
        },
        //Запуск теста
        startTest: function (id) {
            let self = this;
            window.open("/user/process?Id=" + id, '_self');

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
        initWebCam: function () {
            let self = this;
            if (!self.stream) {
                navigator.getUserMedia(
                    {
                        video: true,
                        audio: true
                    },
                    function (stream) {/*callback в случае удачи*/
                        self.stream = stream;

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
                            self.videoSocket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.tests[0].Id }));
                            self.initRTCPeer();
                        };

                        self.videoSocket.onmessage = function (msg) {
                            let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));

                            if (!message.IsSender) {
                                if (message.candidate && message.candidate != '{}') {
                                    let candidate = new RTCIceCandidate(JSON.parse(message.candidate));
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
                                    console.log(message.verified);
                                    self.verified = message.verified;
                                }
                            }
                        };
                    },
                    function () {/*callback в случае отказа*/ });
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
            self.chatSocket.send(JSON.stringify({ Message: self.chat.Message, Date: new Date(), IsSender: true, TestingProfileId: self.tests[0].Id, ParentId: null }));
            self.chat.Message = "";
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        },
        tryVerify: function () {
            console.log(123);
        },
        initRTCPeer: function () {
            let self = this;
            let TURN = {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            };

            let configuration = {
                iceServers: [TURN]
            };
            self.pc1 = new RTCPeerConnection(configuration);
            self.pc1.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(e);
            });

            self.pc1.addEventListener('connectionstatechange', function (event) {
                console.log(self.pc1.connectionState);
                if (self.pc1.connectionState == 'connecting') {
                    setTimeout(function () {
                        if (self.pc1.connectionState == 'connecting') {
                            self.initRTCPeer();
                        }
                    }, 5000)
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
                        let obj1 = {};
                        for (let i in offer) {
                            if (typeof offer[i] != 'function')
                                obj1[i] = offer[i];
                        }
                        let obj = {
                            offer: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.tests[0].Id
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
        onIceCandidate: function (e) {
            let obj1 = {};
            for (let i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            let obj = {
                candidate: JSON.stringify(obj1), IsSender: true, TestingProfileId: app.tests[0].Id
            };
            if (app.videoSocket && app.videoSocket.readyState == 1) {
                //app.gotICE = true;
                app.videoSocket.send(JSON.stringify(obj));
            }
        },
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Вам доступны следующие тесты для прохождения" : "The following tests are available";
                case 2: return self.localization == 1 ? "Вы не завершили следующие тесты" : "Not completed";
                case 3: return self.localization == 1 ? "Режим ожидания" : "Waiting";
                case 4: return self.localization == 1 ? "Пожалуйста, ожидайте. В данный момент все места заняты, либо Вы авторизовались ранее на другом устройстве" : "Please, wait. Available tests will be shown below";
                case 5: return self.localization == 1 ? "Администратор" : "Administrator";
            }
        },
        createPlaceConfig: function (placeId, PlaceProfile) {
            let self = this;
            if (placeId == 0 || PlaceProfile == 0) return;
            let str = CryptoJS.AES.encrypt("place-" + placeId, "Secret Passphrase");
            localStorage['placeConfig'] = str.toString();
            let obj = { Id: PlaceProfile, PlaceConfig: str.toString(), PlaceId: placeId };
            console.log(obj);
            $.ajax({
                url: "/auditory/UpdatePlaceConfig",
                type: "POST",
                async: false,
                data: { model: obj },
                success: function (data) {
                    console.log(data);
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
            let self = this;
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
            let self = this;
            self.activeTests = val.filter(function (a) { return a.TestingStatusId === 2; });
        }

        //,
        //stopTheTime
    }
});