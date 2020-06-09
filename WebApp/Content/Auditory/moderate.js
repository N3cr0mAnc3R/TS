
const app = new Vue({
    el: "#main-window",
    data: {
        img: null,
        domain: "",
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
        queue: [{ type: 1, candidates: [] }, { type: 2, candidates: [] }],
        localization: 1,
        currentStatus: -1,
        currentDate: null,
        statuses: [],
        streamObjects: []
    },
    methods: {
        init: function () {
            let self = this;
            window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;

            $.ajax({
                url: "/account/GetDomain",
                type: "POST",
                async: false,
                success: function (domain) {
                    self.domain = domain;
                }
            });

            //GetAuditoryInfo
            let str = window.location.href;
            let newId = Number.parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.getAuditories(newId, self);

            setInterval(function () {
                self.getAuditories(newId, self);
            }, 5000);

            $.ajax({
                url: "/user/GetErrorTypes",
                type: "POST",
                async: false,
                success: function (errorTypes) {
                    self.errorTypes = errorTypes;
                }
            });
            $.ajax({
                url: "/auditory/GetStatuses",
                type: "POST",
                async: false,
                success: function (statuses) {
                    self.statuses = statuses;
                }
            });

            $.ajax({
                url: "/account/GetCurrentUser",
                type: "POST",
                async: false,
                success: function (user) {
                    self.me = user;
                }
            });
        },
        getAuditories: function (newId, self) {
            $.ajax({
                url: "/auditory/GetAuditoryInfoForModerate?Id=" + newId,
                type: "POST",
                async: false,
                success: function (auditory) {
                    self.auditory = auditory.Id;
                    self.auditoryName = auditory.Name;
                    self.NeedPin = auditory.NeedPin;
                    self.computerList.forEach(function (item) {
                        let found = auditory.ComputerList.filter(function (comp) { return item.Id == comp.Id; })[0];
                        if (!found) {
                            self.computerList = self.computerList.filter(function (comp) { return comp.Id != item.Id; });
                            self.videoSockets = self.videoSockets.filter(function (sock) { return sock.id != item.TestingProfileId; });
                        }
                    });
                    //Смотрим то, что пришло
                    if (auditory.ComputerList.length > 0) {
                        auditory.ComputerList.forEach(function (item) {
                            //Если уже есть в списке, находим
                            let found = self.computerList.filter(function (comp) {
                                return comp.Id == item.Id;
                            })[0];
                            //Если нет, то инициализируем
                            if (!found) {
                                item.errors = [];
                                item.Image = "";
                                //Сокет на вебку
                                self.initSocket(2, item, 1);
                                //Если подтверждён
                                if (item.UserVerified) {
                                    //Сокет на экран
                                    self.initSocket(2, item, 2);
                                }
                                //В любом случае нужно добавить в список
                                self.computerList.push(item);
                                self.initSocket(1, item);
                            }
                            else {
                                //Если уже существует и сменился статус подтверждения, то значит, нужно получить экран
                                if (found.UserVerified != item.UserVerified) {
                                    if (item.UserVerified) {
                                        self.initSocket(2, found, 2);
                                    }
                                }
                            }
                        });

                        //auditory.ComputerList.map(function (a) { a.errors = []; a.Image = ""; });
                        //console.log(auditory.ComputerList);
                        //self.computerList = auditory.ComputerList;
                        //self.computerList.map(a => self.maxContent = Math.max(self.maxContent, +a.Name));
                        self.initAud();
                    }
                }
            });
        },
        filterComps: function (position) {
            let self = this;
            let items = self.computerList.filter((item) => item.PositionX == position);

            if (items.length > 0 && items.length < self.maxY + 1) {
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
            });
        },
        initRTCPeer: function (created, socket, a, type) {
            let self = this;
            let STUN = {
                urls: 'stun:stun.advfn.com:3478'
            };
            let TURN = {
                url: 'turn:turn.bistri.com:80',
                credential: 'homeo',
                username: 'homeo'
            };

            let configuration = {
                iceServers: [STUN, TURN]
            };
            let peer = new RTCPeerConnection(configuration);

            peer.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(peer, e, socket, a.TestingProfileId, type);
            })

            peer.addEventListener('connectionstatechange', function (event) {
                if (peer.connectionState == 'connecting') {
                    setTimeout(function () {
                        if (peer.connectionState == 'connecting') {
                            self.initRTCPeer(created, socket, a, type);
                        }
                    }, 10000);
                }
                if (peer.connectionState == 'disconnected') {
                    self.initRTCPeer(created, socket, a, type);
                }
            });
            peer.addEventListener('track', function (e) {
                self.gotRemoteStream(e, a, type);
            });
            let found = created.peers.filter(function (item) { return item.type == type; })[0];
            if (found) {
                found.peer = peer;
            }
            else created.peers.push({ type: type, peer: peer });
        },
        initSocket: function (type, a, cam) {
            if (a.TestingProfileId == 0) return;
            let self = this;
            let socket = null;
            if (type === 1) {
                if (typeof (WebSocket) !== 'undefined') {
                    socket = new WebSocket(self.domain + "/ChatHandler.ashx");
                }
                else {
                    socket = new MozWebSocket(self.domain + "/ChatHandler.ashx");
                }
                //if (typeof (WebSocket) !== 'undefined') {
                //    socket = new WebSocket("ws://" + window.location.hostname + "/ChatHandler.ashx");
                //}
                //else {
                //    socket = new MozWebSocket("ws://" + window.location.hostname + "/ChatHandler.ashx");
                //}
                //if (typeof (WebSocket) !== 'undefined') {
                //    socket = new WebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
                //}
                //else {
                //    socket = new MozWebSocket("wss://" + window.location.hostname + "/ChatHandler.ashx");
                //}
                self.chatSockets.push({ id: a.TestingProfileId, socket: socket });
                self.chats.push(self.initChat(a.TestingProfileId));
                socket.onopen = function () {
                    socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: a.TestingProfileId }));
                    self.getMessages(a.TestingProfileId);
                }
                socket.onmessage = function (msg) {
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
                if (typeof (WebSocket) !== 'undefined') {
                    socket = new WebSocket(self.domain + "/StreamHandler.ashx");
                }
                else {
                    socket = new MozWebSocket(self.domain + "/StreamHandler.ashx");
                }
                //if (typeof (WebSocket) !== 'undefined') {
                //    socket = new WebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                //}
                //else {
                //    socket = new MozWebSocket("ws://" + window.location.hostname + "/StreamHandler.ashx");
                //}
                //if (typeof (WebSocket) !== 'undefined') {
                //    socket = new WebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                //}
                //else {
                //    socket = new MozWebSocket("wss://" + window.location.hostname + "/StreamHandler.ashx");
                //}
                let created = { id: a.TestingProfileId, socket: socket, peers: [] };
                self.videoSockets.push(created);
                socket.onopen = function () {
                    socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: a.TestingProfileId }));
                    socket.send(JSON.stringify({ TestingProfileId: a.TestingProfileId, requestOffer: true, IsSender: false }));
                    self.initRTCPeer(created, socket, a, cam);
                    //self.initRTCPeer(created, socket, a, 2);

                };
                socket.onmessage = function (msg) {
                    //console.log(msg);
                    let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                    if (message.IsSender) {
                        if (message.candidate && message.candidate != '{}') {
                            let candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                            let queue = self.queue.filter(function (item) { return item.type == message.type; })[0];
                            queue.candidates.push(candidate);
                        }
                        else if (message.offer) {
                            navigator.getUserMedia({ video: true }, function (stream) {
                                let created = self.videoSockets.filter(function (item) { return item.id == message.TestingProfileId; })[0];
                                let peerObj = created.peers.filter(function (item) { return item.type == message.type; })[0];

                                if (!peerObj) {
                                    return;
                                }
                                let peer = peerObj.peer;
                                peer.addStream(stream);
                                peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(message.offer)), function () {
                                    peer.createAnswer(function (answer) {
                                        peer.setLocalDescription(answer, function () {
                                            let obj1 = {};
                                            for (let i in answer) {
                                                if (typeof answer[i] != 'function')
                                                    obj1[i] = answer[i];
                                            }
                                            obj = { answer: JSON.stringify(obj1), IsSender: false, TestingProfileId: a.TestingProfileId, type: message.type };
                                            socket.send(JSON.stringify(obj));
                                            let queue = self.queue.filter(function (item) { return item.type == message.type; })[0];
                                            queue.candidates.forEach(function (candidate) {
                                                peer.addIceCandidate(candidate);
                                            });

                                        }, function (r) { console.log(r); });
                                    }, function (r) { console.log(r); });
                                }, function (r) { console.log(r); });
                            }, function (r) { console.log(r); });
                        }
                    }
                };
            }
            socket.onclose = function (event) {
                console.log('Соединение закрыто');
                self.initSocket(type, a, cam);
            };
        },
        onIceCandidate: function (pc, e, socket, tpid, type) {
            let obj1 = {};
            for (let i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            let obj = {
                candidate: JSON.stringify(obj1), IsSender: false, TestingProfileId: tpid, type: type
            };
            if (socket && socket.readyState == 1) {
                socket.send(JSON.stringify(obj));
            }
            else {
                app.onIceCandidate(pc, e, socket, tpid, type);
            }
        },
        isMe: function (message) {
            let self = this;
            console.log(self.me.Id, message);
            return self.me.Id == message.UserIdFrom;
        },
        verifyUser: function (Verified) {
            //SetUserVerified
            let self = this;
            let socketObj = self.videoSockets.filter(function (sock) { return sock.id == self.currentUser.TestingProfileId })[0];
            socketObj.socket.send(JSON.stringify({ TestingProfileId: socketObj.id, verified: Verified, IsSender: false }));
            $.ajax({
                url: "/auditory/SetUserVerified",
                data: {
                    Id: self.currentUser.TestingProfileId,
                    Verified: Verified
                },
                type: "POST",
                async: false,
                success: function (errors) {
                    self.currentUser.errors = errors;
                }
            });
        },
        getUserList: function () {
            //GetUsersByDate
            let self = this;
            if (self.currentStatus == -1 || !self.currentDate) {
                return;
            }
            $.ajax({
                url: "/auditory/GetUsersByDate",
                data: {
                    Id: self.auditory,
                    StatusId: self.currentStatus,
                    Date: self.currentDate
                },
                type: "POST",
                async: false,
                success: function (errors) {
                    self.currentUser.errors = errors;
                }
            });
        },
        gotRemoteStream: function (e, a, type) {
            let self = this;
            let found = self.streamObjects.filter(function (item) { return item.Id == a.TestingProfileId && item.type == type;  })[0];
            if (!found) {
                self.streamObjects.push({ Id: a.TestingProfileId, stream: e.streams[0], type: type });
            }
            else {
                found.stream = e.streams[0];
            }
            $('#video-' + a.TestingProfileId + '-' + type)[0].srcObject = e.streams[0];
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
            clearInterval(self.interval);
        },
        select: function (id) {
            let self = this;
            self.testingProfileId = id;
            self.toggleChat(id);
        },
        openFull: function (user) {
            let self = this;
            if (user) {
                self.currentUser = user;
            }
            else {
                let found = self.computerList.filter(function (item) { return item.TestingProfileId == self.currentChat.testingProfileId; })[0];
                self.currentUser = found;
            }
            self.getErrors();
            //GetUserPicture
            $.ajax({
                url: "/auditory/GetUserPicture?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: false,
                success: function (picture) {
                    self.currentUser.Image = picture;
                }
            });
            $('#full-wrapper').modal('toggle');
            setTimeout(function () {
                $('#full-video-camera')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-1')[0].srcObject;
                $('#full-video-screen')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-2')[0].srcObject;
            }, 500)
            //console.log(user);
        },
        openModal: function () {
            $('#user-modal').modal('toggle');
        },
        getErrors: function () {
            let self = this;
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
        reconnect: function () {
            let self = this;
            let socketObj = self.videoSockets.filter(function (sock) { return sock.id == self.currentUser.TestingProfileId; })[0];
            socketObj.socket.send(JSON.stringify({ TestingProfileId: socketObj.id, requestOffer: true, IsSender: false }));

            setTimeout(function () {
                let found = self.streamObjects.filter(function (item) { return item.Id == self.currentUser.TestingProfileId; });
                $('#full-video-camera')[0].srcObject = found[0].stream;
                if (found[1])
                $('#full-video-screen')[0].srcObject = found[1].stream;
               // $('#full-video-screen')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-2')[0].srcObject;
            }, 2000);
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
        resetPlace: function () {
            let self = this;
            let obj = { Id: self.currentUser.PlaceProfileId, PlaceConfig: null, PlaceId: self.currentUser.Id };
            $.ajax({
                url: "/auditory/UpdatePlaceConfig",
                type: "POST",
                async: false,
                data: obj,
                success: function () {
                    let found = self.videoSockets.filter(function (item) { return item.id == self.currentUser.TestingProfileId; })[0];
                    found.socket.send(JSON.stringify({ IsSender: false, TestingProfileId: self.currentUser.TestingProfileId, resetRequest: true }));
                    console.log(self.videoSockets, self.currentUser.TestingProfileId);
                }
            });
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
        subscribeEnter: function () {
            let self = this;
            $(document).on('keyup', function () { self.beforeSend(self); });
        },
        beforeSend: function (self) {
            if (event.keyCode == 13 && !event.shiftKey) {
                self.sendMessage();
            }
        },
        sendMessage: function () {
            let self = this;
            if (self.currentChat.Message == "" || self.currentChat.Message.trim() == "") return;
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
                case 5: return self.localization == 1 ? "Завершить вступительное испытание" : "Finish test";
                case 6: return self.localization == 1 ? "Приостановить вступительное испытание" : "Pause test";
                case 7: return self.localization == 1 ? "Возобновить вступительное испытание" : "Resume test";
                case 8: return self.localization == 1 ? "Сбросить место" : "Reset place";
                case 9: return self.localization == 1 ? "Закрыть" : "Close";
                case 10: return self.localization == 1 ? "Открыть список" : "Open user list";
                case 11: return self.localization == 1 ? "Список пользователей" : "User list";
                case 12: return self.localization == 1 ? "Отклонить" : "Decline";
                case 13: return self.localization == 1 ? "Подтвердить" : "Verify";
                case 14: return self.localization == 1 ? "Переподключиться" : "Reconnect";
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