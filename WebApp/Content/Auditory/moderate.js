
const app = new Vue({
    el: "#main-window",
    data: {
        //img: null,
        domain: "",
        interval: null,
        //video3: null,
        //pc2Local: null,
        //stream: null,
        auditory: 0,
        auditoryName: '',
        computerList: [],
        maxX: 0,
        maxY: 0,
        chats: [],
        isChatOpened: false,
        testingProfileId: 0,
        chatSocket: null,
        chatSockets: [],
        videoSockets: [],
        MainSocket: null,
        currentChat: null,
        //pc2: null,
        currentUser: null,
        errorTypes: [],
        shownError: false,
        currentError: 0,
        //gotICE: false,
        //socketQueue: [],
        //socketConnecting: false,
        me: {},
        isSuperAdmin: false,
        queue: [],
        localization: 1,
        currentStatus: -1,
        currentDate: null,
        statuses: [],
        streamObjects: [],
        currentUid: '',
        times: [],
        //currentDate: null,
        scheduleUsers: [],
        filteredPlaceList: [],
        TURN: {},
        fullInfo: null,
        offset: 1,
        fullComputerList: [],
        isDebug: true,
        loadObject: {
            loading: null,
            loaded: null
        },
        auditoryLoader: {
            loading: null,
            loaded: null
        }
    },
    methods: {
        init: function () {
            let self = this;
            //window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;

            $.ajax({
                url: "/api/account/GetDomain",
                type: "POST",
                success: function (domain) {
                    self.domain = domain;
                    self.isDebug = false;
                    //self.isDebug = domain.indexOf('wss') == -1;
                }
            });
            $.ajax({
                url: "/api/auditory/GetTimes",
                type: "POST",
                async: true,
                success: function (times) {
                    self.times = times;
                }
            });

            $.ajax({
                url: "/api/account/GetLoginAndPassword",
                type: "post",
                async: false,
                success: function (info) {
                    //self.domain = domain;
                    self.TURN = {
                        urls: 'turn:turn.ncfu.ru:8443',
                        credential: info.Password,
                        username: info.Login
                    };
                }
            });
            $.ajax({
                url: "/api/account/IsPaul",
                type: "POST",
                async: true,
                success: function (domain) {
                    self.isSuperAdmin = domain;
                }
            });

            //GetAuditoryInfo
            let str = window.location.href;
            let newId = Number.parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.getAuditories(newId, self);

            //setInterval(function () {
            //    try {
            //        self.getAuditories(newId, self);
            //    }
            //    catch{
            //        location.reload();
            //    }
            //}, 5000);

            $.ajax({
                url: "/api/user/GetErrorTypes",
                type: "POST",
                async: true,
                success: function (errorTypes) {
                    self.errorTypes = errorTypes;
                }
            });
            $.ajax({
                url: "/api/auditory/GetStatuses",
                type: "POST",
                async: true,
                success: function (statuses) {
                    self.statuses = statuses;
                }
            });

            $.ajax({
                url: "/api/account/GetCurrentUser",
                type: "POST",
                async: true,
                success: function (user) {
                    self.me = user;
                }
            });
        },
        getAuditories: function (newId, self) {
            self.auditoryLoader.loading = true;
            $.ajax({
                url: "/api/auditory/GetAuditoryInfoForModerate?Id=" + newId,
                type: "POST",
                async: true,
                success: function (auditory) {
                    self.auditory = auditory.Id;
                    self.auditoryName = auditory.Name;
                    document.title = self.auditoryName;
                    self.initChatSignal(auditory);
                    //self.initStreamSignal(auditory);
                    self.auditoryLoader.loading = false;
                    self.auditoryLoader.loaded = true;

                },
                error: function () {
                    location.reload();
                }
            });
        },
        initChatMessage(Id, message, date, admin) {
            return {
                Id: Id,
                Message: message,
                Date: new Date(date),
                IsAdmin: admin
            };
        },
        initChat: function (id) {
            let self = this;
            let chat = {
                IsOpened: false,
                IsChatMOpened: true,
                IsChatVOpened: false,
                participants: [],
                messages: [],
                Message: "",
                unreadCount: 0,
                testingProfileId: id
            };

            self.chats.push(chat);

            self.chatSocket.server.connect(id, true);
            self.streamSocket.server.connect(id, true);
            self.currentUid = self.currentUid == '' ? self.uuidv4() : self.currentUid;

            self.streamSocket.server.requestOffer(id, 1, self.currentUid);
            self.streamSocket.server.requestOffer(id, 2, self.currentUid);
            self.getMessages(id);
            return chat;
        },
        initChatSignal(auditory) {
            let self = this;
            self.chatSocket = $.connection.ChatHub;
            console.log(self.chatSocket);
            $.connection.hub.url = "../signalr";
            //$.connection.hub.proxy = 'ChatHub';

            self.chatSocket.client.onMessageGet = function (Id, TestingProfileId, message, date, admin) {
                let Message = self.initChatMessage(Id, message, date, admin);

                let found = self.computerList.find(function (item) { return item.TestingProfileId == TestingProfileId; });
                let chat = self.chats.find(function (item) { return item.testingProfileId == TestingProfileId });

                if (!chat.isChatOpened) {
                    chat.unreadCount++;
                }

                if (!admin) {
                    $('#msg-audio')[0].play();


                    notifier([{ Type: 'success', Body: found.LastName + " " + found.FirstName + " " + found.MiddleName + ": " + Message.Message }]);
                }
                chat.messages.push(Message);
            }
            $.connection.hub.disconnected(function () {
                setTimeout(function () {
                    //Connect to hub again
                    $.connection.hub.start();
                }, 3000);
            });
            self.initStreamSignal();
            $.connection.hub.reconnecting(function () {
                location.reload();
            });
            $.connection.hub.start().done(function () {
                auditory.ComputerList.forEach(function (item) {
                    item = self.initComputerPlace(item);
                    if ([2, 5].indexOf(item.TestingStatusId) != -1) {
                        self.initChat(item.TestingProfileId);
                    }
                    self.computerList.push(item);
                });
            }).fail(function (exc) {
                console.error(exc);
            })
        },
        initComputerPlace(item) {
            let self = this;
            item.errors = [];
            item.Image = "";
            item.chat = {};
            item.IsPause = false;

            item.cameraInfo = {
                peer: self.initRTCPeer(item, 1)
            };
            item.screenInfo = {
                peer: self.initRTCPeer(item, 2)
            };
            return item;
        },
        initStreamSignal() {
            let self = this;
            self.streamSocket = $.connection.StreamHub;

            self.streamSocket.url = '../signalr';

            self.streamSocket.client.onNewUserConnected = function (testingProfileId, isAdmin) {
                if (!isAdmin) {
                    self.loadPlace(testingProfileId);
                }
            }
            self.streamSocket.client.onUserDisconnected = function (testingProfileId) {
                self.dropStreams({TestingProfileId: testingProfileId});
                self.loadPlace(testingProfileId);

            }
            self.streamSocket.client.sendTimeLeft = function (TimeLeft) {
                if (self.currentUser) {
                    self.currentUser.TimeLeft = TimeLeft;
                }
            }
            self.streamSocket.client.sendOffer = function (Id, Offer, Type, guid) {
                console.log(Id, Offer, Type, guid) ;
                if (guid != self.currentUid) {
                    return;
                }
                let info = null;
                if (Type == 1) {
                    info = self.computerList.find(function (a) {
                        return a.TestingProfileId == Id;
                    }).cameraInfo;
                }
                else {
                    info = self.computerList.find(function (a) {
                        return a.TestingProfileId == Id;
                    }).screenInfo;
                }
                let peer = info.peer;
                //  peer.addStream(stream);
                peer.setRemoteDescription(new RTCSessionDescription(Offer), function () {
                    peer.createAnswer(function (answer) {
                        peer.setLocalDescription(answer, function () {
                            self.streamSocket.server.sendAnswer(Id, answer, Type, self.currentUid);
                        }, function (r) { console.log(r); });
                    }, function (r) { console.log(r); });
                }, function (r) { console.log(r); });
            }
            self.streamSocket.client.sendIceCandidate = function (Id, Type, candidate, guid, IsAdmin) {
                if (guid != self.currentUid || IsAdmin) {
                    return;
                }
                let info = null;
                if (Type == 1) {
                    info = self.computerList.find(function (a) {
                        return a.TestingProfileId == Id;
                    }).cameraInfo;
                }
                else {
                    info = self.computerList.find(function (a) {
                        return a.TestingProfileId == Id;
                    }).screenInfo;
                }
                let peer = info.peer;
                peer.addIceCandidate(candidate);
            }
        },
        getInfoForAdmin: function () {
            var self = this;

            $('#full-wrapper').modal('hide');
            $('#user-info-wrapper').modal('show');
            if (self.isSuperAdmin) {
                $.ajax({
                    url: "/api/auditory/getInfoForAdmin?Id=" + self.currentUser.TestingProfileId,
                    type: "POST",
                    async: true,
                    success: function (info) {
                        self.fullInfo = {};
                        self.fullInfo.tests = [];
                        info.forEach(function (item) {
                            self.fullInfo.tests.push(item);
                        });
                    }
                });
            }
        },
        resetTest: function (Id) {
            var self = this;
            if (self.isSuperAdmin) {
                $.ajax({
                    url: "/api/auditory/resetTest?Id=" + Id,
                    type: "POST",
                    async: true,
                    success: function () {
                        self.getInfoForAdmin();
                    }
                });
            }
        },
        deletePreliminary: function (Id) {
            var self = this;
            if (self.isSuperAdmin) {
                $.ajax({
                    url: "/api/auditory/DeletePreliminary?Id=" + Id,
                    type: "POST",
                    async: true,
                    success: function () {
                        self.getInfoForAdmin();
                    }
                });
            }
        },
        finishTest: function (Id) {
            var self = this;
            if (self.isSuperAdmin) {
                $.ajax({
                    url: "/api/auditory/finishTest?Id=" + Id,
                    type: "POST",
                    async: true,
                    success: function () {
                        self.getInfoForAdmin();
                    }
                });
            }
        },
        consolePlace: function (item) {
            var self = this;
            if (self.isSuperAdmin) {
                console.log(item);
            }
        },
        goToTop() {
            $('#navigation')[0].scrollIntoView();
        },
        consoleUser: function (item) {
            var self = this;
            console.log(item);
            window.open('/statistic/minitotal?Id=' + item.UserId), '_blank';
        },
        resetIpConfig: function (item) {
            let self = this;
            $.ajax({
                url: "/api/auditory/UpdatePlaceConfig",
                type: "POST",
                async: false,
                data: {
                    Id: item.PlaceProfileId,
                    PlaceConfig: null,
                    PlaceId: item.Id
                },
                success: function () {
                    item.IsUsed = false;
                }
            });

        },
        resetUser: function (item) {
            var self = this;
            if (self.isSuperAdmin) {
                console.log(item, 1);
            }
        },
        initAud: function () {
            let self = this;
            self.maxX = 0, self.maxY = 0;
            self.computerList.forEach(a => {
                self.maxX = Math.max(self.maxX, a.PositionX);
                self.maxY = Math.max(self.maxY, a.PositionY);
            });
        },
        openSchedule: function () {
            $('#schedule').modal('toggle');
        },
        filterSchedule: function () {
            let self = this;
            console.log(self.currentDate);
            $.ajax({
                url: "/api/auditory/GetUserWithTimes",
                type: "POST",
                async: true,
                data: {
                    Id: self.auditory,
                    Date: self.currentDate
                },
                success: function (users) {
                    self.scheduleUsers = users;
                    notifier([{ Type: 'success', Body: "Запланировано " + users.length + " ВИ. Завершено " + users.filter(a => { return a.Score != null; }).length }]);
                    console.log(users);
                    users.forEach(function (item) {
                        if (self.filteredPlaceList.indexOf(item.PlaceId) == -1) {
                            self.filteredPlaceList.push(item.PlaceId);
                        }
                    });
                    self.filteredPlaceList.sort(function (a, b) { return a - b; });
                }
            });
        },
        filterScheduleUsers: function (place) {
            var self = this;
            return self.scheduleUsers.filter(function (item) { return item.PlaceId == place; });
        },
        initRTCPeer: function (item, type) {
            let self = this;
            //let STUN = {
            //    urls: 'stun:stun.advfn.com:3478'
            //},
            //    'stun.l.google.com: 19302',
            //    'stun1.l.google.com: 19302',
            //    'stun2.l.google.com: 19302',
            //    'stun3.l.google.com: 19302',
            //    'stun4.l.google.com: 19302']
            //};
            //let TURN = {
            //    url: 'turn:turn.bistri.com:80',
            //    credential: 'homeo',
            //    username: 'homeo'
            //};

            let configuration = {
                iceServers: [
                    { urls: 'stun:stun01.sipphone.com' },
                    { urls: 'stun:stun.ekiga.net' },
                    ////////////////{ url: 'stun:stun.fwdnet.net' },
                    ////////////////{ url: 'stun:stun.ideasip.com' },
                    ////////////////{ url: 'stun:stun.iptel.org' },
                    ////////////////{ url: 'stun:stun.rixtelecom.se' },
                    ////////////////{ url: 'stun:stun.schlund.de' },
                    ////////////////{ url: 'stun:stun.l.google.com:19302' },
                    ////////////////{ url: 'stun:stun1.l.google.com:19302' },
                    ////////////////{ url: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    ////////////////{ url: 'stun:stun4.l.google.com:19302' },
                    { urls: 'stun:stunserver.org' },
                    ////////////////{ url: 'stun:stun.softjoys.com' },
                    { urls: 'stun:stun.voiparound.com' },
                    ////////////////{ url: 'stun:stun.voipbuster.com' },
                    ////////////////{ url: 'stun:stun.voipstunt.com' },
                    ////////////////{ url: 'stun:stun.voxgratia.org' },
                    ////////////////{ url: 'stun:stun.xten.com' },
                    ////////////////{ url: 'STUN:turn.ncfu.ru:9003' },
                    {
                        urls: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    },
                    self.TURN,
                    //TURN
                ]
            };
            let peer = new RTCPeerConnection(configuration);

            peer.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(item, type, e.candidate);
            })
            peer.addEventListener('connectionstatechange', function (event) {
                if (peer && peer.connectionState == 'connecting') {
                    setTimeout(function () {
                        if (!peer || peer.connectionState == 'connecting') {
                            peer = null;
                            self.initRTCPeer(item, type);
                        }
                    }, 10000);
                }
                else if (peer && peer.connectionState == 'disconnected') {
                    self.initRTCPeer(item, type);
                }
            });
            peer.addEventListener('track', function (e) {
                self.gotRemoteStream(e, item, type);
            });

            return peer;
        },
       addIceCandidateToPeer(peer, self, message, a, inter) {
            let queue = self.queue.filter(function (item) { return item.type == message.type && item.Id == a.TestingProfileId; })[0];
            if (queue.candidates.length > 0) {
                clearInterval(inter);
                queue.candidates.forEach(function (candidate) {
                    peer.addIceCandidate(candidate);
                });
            }
        },
        onIceCandidate: function (item, type, candidate) {
            let self = app;
            self.streamSocket.server.sendIceCandidate(item.TestingProfileId, type, candidate, self.currentUid, true);
        },
        isMe: function (message) {
            let self = this;
            return self.me.Id == message.UserIdFrom;
        },
        switchVideo: function (partId) {
            let self = this;
            $('#' + partId + '-1').css('z-index', $('#' + partId + '-1').css('z-index') == 1 ? 2 : 1);
            $('#' + partId + '-2').css('z-index', $('#' + partId + '-2').css('z-index') == 1 ? 2 : 1);
        },
        showTimeLeft: function () {
            var self = this;
            return Math.floor(self.currentUser.TimeLeft / 60) + ':' + self.isZeroNeed(self.currentUser.TimeLeft % 60);
        },
        isZeroNeed: function (value) {
            if (value < 10)
                return '0' + value;
            else return value;
        },
        ResetServer: function () {
            //  var socket = null, socket1 = null;
            var self = this;
            $.ajax({
                url: "/api/user/ReconnectToSocket",
                type: "POST",
                async: true,
                success: function () {
                    notifier([{ Type: 'success', Body: 'Попытка' }]);

                }
            });
            //if (typeof (WebSocket) !== 'undefined') {
            //    socket = new WebSocket(self.domain + "/ChatHandler.ashx");
            //    socket1 = new WebSocket(self.domain + "/StreamHandler.ashx");
            //}
            //else {
            //    socket = new MozWebSocket(self.domain + "/ChatHandler.ashx");
            //    socket1 = new MozWebSocket(self.domain + "/StreamHandler.ashx");
            //}
            //socket.onopen = function () {
            //    socket.send(JSON.stringify({ ForReset: true }));
            //    socket.close();
            //};
            //socket1.onopen = function () {
            //    socket1.send(JSON.stringify({ ForReset: true }));
            //    socket1.close();
            //};
        },
        verifyUser: function (Verified) {
            //SetUserVerified
            let self = this;
            self.streamSocket.server.verify(self.currentUser.TestingProfileId, Verified);
        },
        SetPlaceFree: function (id) {
            let self = this;
            $.ajax({
                url: "/api/auditory/SetPlaceFree?Id=" + id,
                type: "POST",
                async: true,
                success: function (resp) {
                    if (resp.error) {
                        notifier([{ Type: 'error', Body: resp.error }]);
                    }
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
                url: "/api/auditory/GetUsersByDate",
                data: {
                    Id: self.auditory,
                    StatusId: self.currentStatus,
                    Date: self.currentDate
                },
                type: "POST",
                async: true,
                success: function (errors) {
                    self.currentUser.errors = errors;
                }
            });
        },
        gotRemoteStream: function (e, a, type) {
            let self = this;
            if (type == 1) {
                a.cameraInfo.stream = e.streams[0];
            }
            else {
                a.screenInfo.stream = e.streams[0];
            }
            //let found = self.streamObjects.filter(function (item) { return item.Id == a.TestingProfileId && item.type == type; })[0];
            //if (!found) {
            //    self.streamObjects.push({ Id: a.TestingProfileId, stream: e.streams[0], type: type });
            //}
            //else {
            //    found.stream = e.streams[0];
            //}
            $('#video-' + a.TestingProfileId + '-' + type)[0].srcObject = e.streams[0];
        },
        dropStreams(a) {
            $('#video-' + a.TestingProfileId + '-' + 1)[0].srcObject = null;
            $('#video-' + a.TestingProfileId + '-' + 2)[0].srcObject = null;
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
        findInfoForChat: function () {
            let self = this;
            if (!self.currentChat) return;
            let found = self.computerList.filter(function (item) { return item.TestingProfileId == self.currentChat.testingProfileId; })[0];
            if (!found) return;
            return found.LastName + " " + found.FirstName + " " + found.MiddleName;
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
            if (self.currentUser.TestingStatusId == 2) {
                self.streamSocket.server.requestTimeLeft(self.currentUser.TestingProfileId);
            }
            self.getErrors();
            //GetUserPicture
            $.ajax({
                url: "/api/auditory/GetUserPicture?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: true,
                success: function (picture) {
                    self.currentUser.Image = picture;
                }
            });
            $('#full-wrapper').modal('toggle');
            //console.log(self.currentUser);
            setTimeout(function () {
                $('#full-video-camera')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-1')[0].srcObject;
                $('#full-video-screen')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-2')[0].srcObject;
            }, 500)
            //console.log(user);
        },
        openModal: function () {
            $('#user-modal').modal('toggle');
        },
        emptySeats() {
            let self = this;
            let i = 0;
            self.computerList.forEach((item) => {
                if (item.IsUsed && !item.TestingProfileId) {
                    i++;
                    self.resetIpConfig(item);
                }
            });
            notifier([{ Type: 'success', Body: 'Освобождено: ' + i }]);
        },
        getErrors: function () {
            let self = this;
            $.ajax({
                url: "/api/user/GetUserErrors?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: true,
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
            //window.open('/auditory/DownloadVideoFile?Id=' + self.currentUser.TestingProfileId + '&Type=' + type, '_blank');
            window.open('/auditory/DownloadVideoFile?Id=' + 227 + '&Type=' + type, '_blank');
        },
        sendError: function (errorId) {
            let self = this;

            $.ajax({
                url: "/api/user/SetUserErrors?Id=" + self.currentUser.TestingProfileId + "&Type=" + errorId,
                //url: "/api/user/SetUserErrors?Id=" + self.currentUser.TestingProfileId + "&Type=" + self.currentError,
                type: "POST",
                async: true,
                success: function (errors) {
                    self.streamSocket.server.sendError(self.currentUser.TestingProfileId, errorId);
                    self.currentUser.errors = errors;
                    notifier([{ Type: 'success', Body: 'Отправлено' }]);
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
                url: "/api/user/PauseTest?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: true,
                success: function () {
                    self.currentUser.IsPause = !self.currentUser.IsPause;
                    self.streamSocket.server.togglePause(self.currentUser.TestingProfileId);
                }
            });

        },
        finishTest: function () {
            let self = this;
            $.ajax({
                url: "/api/user/FinishTest?Id=" + self.currentUser.TestingProfileId,
                type: "POST",
                async: true,
                success: function () {
                    self.streamSocket.server.finishTest(self.currentUser.TestingProfileId);
                }
            });
        },
        collapseVideo: function () {
            let self = this;
            self.streamSocket.server.collapseVideo(self.currentUser.TestingProfileId);
        },
        toggleUserChat: function () {
            let self = this;
            self.streamSocket.server.toggleUserChat(self.currentUser.TestingProfileId);
        },
        setCameraTrue: function () {
            let self = this;
            self.streamSocket.server.setCameraTrue(self.currentUser.TestingProfileId);
        },
        resetCapture: function () {
            let self = this;
            self.streamSocket.server.resetCapture(self.currentUser.TestingProfileId);
        },
        uuidv4: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        reconnectCamera: function () {
            let self = this;
            self.currentUid = self.currentUid == '' ? self.uuidv4() : self.currentUid;
            self.streamSocket.server.reconnectCamera(self.currentUser.TestingProfileId, self.currentUid);
        },
        reconnectScreen: function () {
            let self = this;
            self.currentUid = self.currentUid == '' ? self.uuidv4() : self.currentUid;
            self.streamSocket.server.reconnectScreen(self.currentUser.TestingProfileId, self.currentUid);
        },
        toggleChat: function (id) {
            let self = this;
            console.log('start', id);
            let founded = self.chats.filter(a => a.testingProfileId == id)[0];
            console.log('found', founded);
            if (!founded) return;
            founded.unreadCount = 0;
            if (self.currentChat && self.currentChat == founded) {
                self.isChatOpened = false;
                self.currentChat = null;
            }
            else {
                if (!self.currentChat) {
                    self.currentChat = founded;
                    self.isChatOpened = true;

                    $(document).on('keydown', self.subscribeExc);
                }
                else {
                    self.currentChat = founded;
                    console.log('else');
                }
                var maxId = 0;
                self.currentChat.messages.forEach(function (msg) {
                    maxId = msg.Id > maxId ? msg.Id : maxId;
                });
                if (maxId != 0) {
                    setTimeout(function () {
                        $('#message-' + maxId)[0].scrollIntoView();
                    }, 20);
                }
            }

            //if (!flagClose) {
            // self.isChatOpened = !self.isChatOpened;
            //}
        },
        subscribeExc() {
            if (event.keyCode == 27) {
                if (app.currentChat) {
                    app.toggleChat(app.currentChat.testingProfileId);
                }
                $(document).off('keydown', app.subscribeExc);
            }
        },
        resetPlace: function () {
            let self = this;
            let obj = { Id: self.currentUser.PlaceProfileId, PlaceConfig: null, PlaceId: self.currentUser.Id };
            $.ajax({
                url: "/api/auditory/UpdatePlaceConfig",
                type: "POST",
                async: true,
                data: obj,
                success: function () {
                    self.streamSocket.server.requestReset(self.currentUser.TestingProfileId);
                    $('#full-wrapper').modal('hide');
                    self.loadPlace(self.currentUser.TestingProfileId);
                }
            });
        },
        loadPlace: function (Id) {
            let self = this;

            $.ajax({
                url: "/api/auditory/GetPlaceByProfile?Id=" + Id,
                type: "POST",
                async: true,
                success: function (Place) {
                    $.ajax({
                        url: "/api/auditory/GetInfoAboutPlace?Id=" + Place.Id,
                        type: "POST",
                        async: true,
                        success: function (data) {
                            let obj = self.computerList.find(function (a) { return a.Id == data.Id });
                            for (var i in obj) {
                                obj[i] = data[i];
                            }

                            obj = self.initComputerPlace(obj);
                            if ([2, 5].indexOf(obj.TestingStatusId) != -1) {
                                self.initChat(obj.TestingProfileId);
                            }
                            else {

                            }
                        }
                    });

                }
            });
        },
        loadPeople: function () {
            var self = this;
            self.loadObject.loading = true;
            self.loadObject.loaded = false;
            $.ajax({
                url: "/api/auditory/GetNewPeople?Id=" + self.auditory,
                type: "POST",
                async: true,
                success: function (result) {
                    notifier([{ Type: 'success', Body: 'Данные загружены' }]);
                    self.filterSchedule();
                    self.loadObject.loading = false;
                    self.loadObject.loaded = true;
                }
            });

        },
        sendReload: function () {
            let self = this;
            self.streamSocket.server.requestReload(self.currentUser.TestingProfileId);
        },
        sendReloadForAll: function () {
            let self = this;
            self.computerList.forEach(function (item) {
                item = self.initComputerPlace(item);
                if ([2, 5].indexOf(item.TestingStatusId) != -1) {
                    self.streamSocket.server.requestReload(item.TestingProfileId);
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
                url: "/api/user/GetChatMessages?Id=" + newId,
                type: "POST",
                async: true,
                success: function (messageList) {
                    let messages = messageList;
                    messages.map(a => a.Date = new Date(a.Date));
                    //messages.map(a => a.Date = new Date(Number(a.Date.substr(a.Date.indexOf('(') + 1, a.Date.indexOf(')') - a.Date.indexOf('(') - 1))));
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
            let socket = self.chatSocket;//s.find(a => a.id == self.testingProfileId).socket;
            self.currentChat.Message = self.currentChat.Message.trim();
            let date = new Date();
            $.ajax({
                url: "/api/user/SendMessage",
                type: "POST",
                async: true,
                data: {
                    Message: self.currentChat.Message,
                    Date: date,
                    IsSender: false,
                    TestingProfileId: self.testingProfileId,
                    ParentId: null
                },
                success: function (Id) {
                    let Message = self.initChatMessage(Id, self.currentChat.Message, date, true);

                    self.currentChat.messages.push(Message);
                    socket.server.sendMessage(Id, self.testingProfileId, Message.Message, true);
                    self.currentChat.Message = "";
                }
            });
            //let socket = self.chatSockets.find(a => a.id == self.testingProfileId).socket;
            //socket.send(JSON.stringify({ Message: self.currentChat.Message, Date: new Date(), IsSender: false, TestingProfileId: self.testingProfileId, ParentId: null }));

        },
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return localStorage["localization"] == 1 ? "Аудитория" : "Auditory";
                case 2: return localStorage["localization"] == 1 ? "Выдано предупреждений: " + self.getErrorCount() + ". " : self.getErrorCount() + " warnings issued";
                case 3: return localStorage["localization"] == 1 ? "Сохранить" : "Save";
                case 4: return localStorage["localization"] == 1 ? "Сообщить о нарушении" : "Issue a warning";
                case 5: return localStorage["localization"] == 1 ? "Завершить вступительное испытание" : "Finish test";
                case 6: return localStorage["localization"] == 1 ? "Приостановить вступительное испытание" : "Pause test";
                case 7: return localStorage["localization"] == 1 ? "Возобновить вступительное испытание" : "Resume test";
                case 8: return localStorage["localization"] == 1 ? "Сбросить место" : "Reset place";
                case 9: return localStorage["localization"] == 1 ? "Закрыть" : "Close";
                case 10: return localStorage["localization"] == 1 ? "Открыть список" : "Open user list";
                case 11: return localStorage["localization"] == 1 ? "Список пользователей" : "User list";
                case 12: return localStorage["localization"] == 1 ? "Отклонить" : "Decline";
                case 13: return localStorage["localization"] == 1 ? "Подтвердить" : "Verify";
                case 14: return localStorage["localization"] == 1 ? "Переподключиться1" : "Reconnect1";
                case 15: return localStorage["localization"] == 1 ? "Переподключиться2" : "Reconnect2";
            }
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        }
    },
    mounted() {
        this.init();
    },
    computed: {
        filterComps() {
            return function (position) {
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
                console.log(items);
                items.sort((a, b) => a.PositionY - b.PositionY);
                return items;
            }
            // return salut => `${salut} ${this.firstName} ${this.lastName}`
        }
    },
    watch: {
        socketQueue: {
            handler: function (newOne, oldOne) {
                console.log(oldOne, newOne);
            }
        }
    }
});