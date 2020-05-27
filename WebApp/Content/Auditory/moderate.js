
const app = new Vue({
    el: "#main-window",
    data: {
        img: null,
        interval: null,
        video3: null,
        pc2Local: null,
        stream: null,
        auditory: 0,
        auditoryName: '',
        computerList: [],
        maxX: 0,
        maxY: 0,
        chats: [],
        isChatOpened: false,
        testingProfileId: 0,
        chatSockets: [],
        videoSockets: [],
        currentChat: null,
        pc2: null,
        currentUser: null,
        errorTypes: [],
        shownError: false,
        currentError: 0,
        gotICE: false,
        me: {},
        queue: []


    },
    methods: {
        init: function () {
            let self = this;
            window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;


            //GetAuditoryInfo
            let str = window.location.href;
            let newId = Number.parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            $.ajax({
                url: "/auditory/GetAuditoryInfoForModerate?Id=" + newId,
                type: "POST",
                async: false,
                success: function (auditory) {
                    self.auditory = auditory.Id;
                    self.auditoryName = auditory.Name;
                    self.NeedPin = auditory.NeedPin;
                    auditory.ComputerList.map(a => a.errors = []);
                    self.computerList = auditory.ComputerList;
                    self.computerList.map(a => self.maxContent = Math.max(self.maxContent, +a.Name));
                    self.initAud();
                }
            });
            $.ajax({
                url: "/user/GetErrorTypes",
                type: "POST",
                async: false,
                success: function (errorTypes) {
                    self.errorTypes = errorTypes;
                }
            });

            $.ajax({
                url: "/auditory/GetCurrentUser",
                type: "POST",
                async: false,
                success: function (user) {
                    self.me = user;
                }
            });
        },
        filterComps: function (position) {
            let self = this;
            let items = self.computerList.filter((item) => item.PositionX == position);
            if (items.length < self.maxY + 1) {
                let maxId = 0;
                self.computerList.forEach(a => maxId = a.Id > maxId ? a.Id : maxId);
                maxId++;
                let length = self.maxY + 1 - items.length;
                for (let i = 0; i < length; i++) {
                    items.sort((a, b) => a.PositionY - b.PositionY);
                    //if (items.length == 0) console.log(position);
                    let newObj = { Id: maxId, IsNew: true, Name: '', PositionX: position, PositionY: self.findIndex(items) };
                    items.push(newObj);
                    self.computerList.push(newObj);
                    maxId++;
                }
            }
            items.sort((a, b) => a.PositionY - b.PositionY);
            return items;
        },
        initAud: function () {
            let self = this;
            self.maxX = 0, self.maxY = 0;
            self.computerList.forEach(a => {
                self.maxX = Math.max(self.maxX, a.PositionX);
                self.maxY = Math.max(self.maxY, a.PositionY);
                self.initSocket(1, a);
                self.initSocket(2, a);
            });
        },
        initSocket: function (type, a) {
            if (a.TestingProfileId == 0) return;
            let self = this;
            let socket = null;
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
            if (type === 1) {
                //if (typeof (WebSocket) !== 'undefined') {
                //    socket = new WebSocket("ws://" + window.location.hostname + "/ChatHandler.ashx");
                //}
                //else {
                //    socket = new MozWebSocket("ws://" + window.location.hostname + "/ChatHandler.ashx");
                //}
                if (typeof (WebSocket) !== 'undefined') {
                    socket = new WebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
                }
                else {
                    socket = new MozWebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
                }
                self.chatSockets.push({ id: a.TestingProfileId, socket: socket });
                self.chats.push(self.initChat(a.TestingProfileId));
                socket.onopen = function () {
                    socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: a.TestingProfileId }));
                    self.getMessages(a.TestingProfileId);
                }
                socket.onmessage = function (msg) {
                    console.log(msg);
                    let message;
                    if (msg.data.indexOf("\0") != -1) {
                        message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                    }
                    else {
                        message = JSON.parse(msg.data);
                    }
                    message.Date = new Date(Number(message.Date.substr(message.Date.indexOf('(') + 1, message.Date.indexOf(')') - message.Date.indexOf('(') - 1)));
                    let chat = self.chats.filter(a => a.TestingProfileId == msg.data.testingProfileId)[0];
                    chat.messages.push(message);
                };
            }
            else {
                //if (typeof (WebSocket) !== 'undefined') {
                //    socket = new WebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                //}
                //else {
                //    socket = new MozWebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                //}
                if (typeof (WebSocket) !== 'undefined') {
                socket = new WebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                 }
                 else {
                socket = new MozWebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                 }
                self.videoSockets.push({ id: a.TestingProfileId, socket: socket });
                socket.onopen = function () {
                    socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: a.TestingProfileId }));
                    let configuration = { sdpSemantics: "unified-plan" };
                    self.pc2 = new RTCPeerConnection(configuration);
                    console.log('Created local peer connection object pc2', new Date().getSeconds(), new Date().getMilliseconds());

                    self.pc2.addEventListener('icecandidate', function (e) {
                        console.log('ad');
                        self.onIceCandidate(self.pc2, e, socket, a.TestingProfileId);
                    })
                    self.pc2.addEventListener('iceconnectionstatechange', function (e) {
                        self.onIceStateChange(self.pc2, e);
                    })
                    self.pc2.addEventListener('track', self.gotRemoteStream);
                }
                socket.onmessage = function (msg) {
                    //console.log(msg);
                    let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));

                    if (message.IsSender) {
                        if (message.candidate && message.candidate != '{}') {
                            let candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                            console.log(candidate);
                            self.queue.push(candidate);
                        }
                        else if (message.offer) {
                            //console.log(message.offer);
                            navigator.getUserMedia({ video: true }, function (stream) {
                                self.pc2.addStream(stream);
                                self.pc2.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.offer)), function () {
                                    self.pc2.createAnswer(function (answer) {
                                        console.log('answer');
                                        self.pc2.setLocalDescription(answer, function () {
                                            let obj1 = {};
                                            for (let i in answer) {
                                                if (typeof answer[i] != 'function')
                                                    obj1[i] = answer[i];
                                            }
                                            obj = { answer: JSON.stringify(obj1), IsSender: false, TestingProfileId: a.TestingProfileId };
                                            console.log(obj, JSON.stringify(obj));
                                            socket.send(JSON.stringify(obj));
                                            self.queue.forEach(function (candidate) {
                                                self.pc2.addIceCandidate(candidate);
                                            })

                                        }, function (r) { console.log(r);});
                                    }, function (r) { console.log(r); })
                                }, function (r) { console.log(r); })
                            }, function (r) { console.log(r); })
                            //let CreateDescriptionPromise = new Promise(function (resolve) {
                            //    console.log('Created setRemoteDescription start', new Date().getSeconds(), new Date().getMilliseconds());
                            //    resolve(self.pc2.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.offer))));
                            //})
                            //let answer;
                            //CreateDescriptionPromise.then(function (ev) {
                            //    console.log('Created setRemoteDescription finish', new Date().getSeconds(), new Date().getMilliseconds());

                            //    let CreateAnswerPromise = new Promise(function (resolve) {
                            //        console.log('Created createAnswer start', new Date().getSeconds(), new Date().getMilliseconds());

                            //        resolve(self.pc2.createAnswer());
                            //    })
                            //    CreateAnswerPromise.then(function (ans) {
                            //        console.log('Created createAnswer finish', new Date().getSeconds(), new Date().getMilliseconds());

                            //        answer = ans;
                            //        console.log(answer);
                            //        let CreatelocalPromise = new Promise(function (resolve) {
                            //            console.log('Created setLocalDescription start', new Date().getSeconds(), new Date().getMilliseconds());

                            //            resolve(self.pc2.setLocalDescription(answer));
                            //        })
                            //        CreatelocalPromise.then(function (res) {
                            //            console.log('Created setLocalDescription finish', new Date().getSeconds(), new Date().getMilliseconds());

                            //            let obj1 = {};
                            //            for (let i in answer) {
                            //                if (typeof answer[i] != 'function')
                            //                    obj1[i] = answer[i];
                            //            }
                            //            let obj = {
                            //                answer: JSON.stringify(obj1), IsSender: false, TestingProfileId: a.TestingProfileId
                            //            };
                            //            if (socket && socket.readyState == 1) {
                            //                socket.send(JSON.stringify(obj));
                            //            }
                            //        })
                            //    })
                            //})

                        }
                    }
                    //console.log(message);

                    if (message.Stream) {
                        $('#img-' + message.TestingProfileId)[0].src = message.Stream;
                      //  console.log(a);
                    }
                };
            }
            socket.onclose = function (event) {
                self.initSocket(type, a);
            };
        },
        onIceCandidate: function (pc, e, socket, tpid) {
            let obj1 = {};
            for (let i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            let obj = {
                candidate: JSON.stringify(obj1), IsSender: false, TestingProfileId: tpid
            };
            console.log(e.candidate);
            if (socket && socket.readyState == 1) {
                console.log('send');
                socket.send(JSON.stringify(obj));
            }
            else {
                app.onIceCandidate(pc, e, socket);
            }
        },
        isMe: function (message) {
            let self = this;
            return self.me.Id == message.UserIdFrom;
        },
        onIceStateChange: function (pc, e) {

        },
        gotRemoteStream: function (e) {
            console.log(e.streams);
            $('#video-87')[0].srcObject = e.streams[0];
        },

        b64toBlob: function (b64Data, contentType = '', sliceSize = 512) {
            // console.log(b64Data.substr(b64Data.indexOf('base64') + 7));
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

            let blob = new Blob(byteArrays, { type: contentType });
            return blob;
        },
        initChat: function (id) {
            return {
                IsOpened: false,
                IsChatMOpened: true,
                IsChatVOpened: false,
                participants: [],
                messages: [],
                Message: "",
                testingProfileId: id
            };
        },
        findIndex: function (array) {
            if (array.length == 0) return array.length;
            let index = -1;

            for (let i = 0; i < array.length; i++) {
                //  console.log(array[i].PositionY);
            }
            for (let i = 0; i < array.length - 1; i++) {
                if (array[i + 1].PositionY - array[i].PositionY > 1) {
                    index = array[i].PositionY + 1;
                }
            }
            if (index == -1) {
                index = array[0].PositionY == 0 ? array.length : 0;
            }
            //  console.log(index);
            return index;
        },
        stop: function () {
            let self = this;
            console.log('stop');
            clearInterval(self.interval);
        },
        select: function (id) {
            let self = this;
            console.log(id);
            self.testingProfileId = id;
            self.toggleChat(id);
        },
        openFull: function (user) {
            let self = this;
            self.currentUser = user;
            self.getErrors();
            $('#full-wrapper').modal('toggle');
            //console.log(user);
        },
        getErrors: function () {
            let self = this;
            console.log(self.currentUser);
            $.ajax({
                url: "/user/GetUserErrors?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: false,
                success: function (errors) {
                    self.currentUser.errors = errors;
                }
            });
        },
        tipError: function () {
            let self = this;
            let str = "";
            self.currentUser.errors.map(a => str += (a.ViolationTypeName + " - " + a.ViolationCount + " раз; "));
            return str;
        },
        showError: function () {
            let self = this;
            self.shownError = !self.shownError;
        },
        download: function (type) {
            let self = this;
            console.log(self.currentUser.TestingProfileId, type);
            window.open('/auditory/DownloadVideoFile?Id=' + self.currentUser.TestingProfileId + '&Type=' + type, '_blank');
        },
        sendError: function () {
            let self = this;
            $.ajax({
                url: "/user/SetUserErrors?Id=" + self.currentUser.TestingProfileId + "&Type=" + self.currentError,
                type: "POST",
                async: false,
                success: function (errors) {
                    self.currentUser.errors = errors;
                    self.shownError = !self.shownError;
                }
            });
        },
        getErrorCount: function () {
            let self = this;
            let counter = 0;
            self.currentUser.errors.forEach(a => counter += a.ViolationCount);
            return counter;
        },
        togglePause: function () {
            let self = this;
            $.ajax({
                url: "/user/PauseTest?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: false,
                success: function () {
                }
            });
        },
        finishTest: function () {
            let self = this;
            $.ajax({
                url: "/user/FinishTest?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: false,
                success: function () {

                }
            });
        },


        toggleChat: function (id) {
            let self = this;
            let flagClose = false;
            let founded = self.chats.find(a => a.testingProfileId == id);
            if (self.currentChat && self.currentChat == founded) {
                flagClose = true;
            }
            self.currentChat = founded;
            if (!flagClose)
                self.isChatOpened = !self.isChatOpened;
        },
        toggleTypeChat: function () {
            let self = this;
            if (self.isChatOpened) {
                self.currentChat.IsChatVOpened = !self.currentChat.IsChatVOpened;
                self.currentChat.IsChatMOpened = !self.currentChat.IsChatMOpened;
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
                    let chat = self.chats.find(a => a.testingProfileId == newId);
                    chat.messages = messages;
                }
            });
        },
        sendMessage: function () {
            let self = this;
            let socket = self.chatSockets.find(a => a.id == self.testingProfileId).socket;
            socket.send(JSON.stringify({ Message: self.currentChat.Message, Date: new Date(), IsSender: false, TestingProfileId: self.testingProfileId, ParentId: null }));
            self.currentChat.Message = "";
        },
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Аудитория" : "Auditory";
                case 2: return self.localization == 1 ? "Выдано" + self.getErrorCount() + " предупреждений" : self.getErrorCount() + "warnings issued";
                case 3: return self.localization == 1 ? "Сохранить" : "Save";
                case 4: return self.localization == 1 ? "Сообщить о нарушении" : "Issue a warning";
                case 5: return self.localization == 1 ? "Завершить тестирование" : "Finish test";
                case 6: return self.localization == 1 ? "Приостановить тестирование" : "Pause test";
                case 7: return self.localization == 1 ? "Возобновить тестирование" : "Resume test";
                case 8: return self.localization == 1 ? "Завершить тестирование" : "Finish test";
                case 9: return self.localization == 1 ? "Закрыть" : "Close";
            }
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        }
    },
    mounted() {
        console.log(1);
        this.init();
    }
});