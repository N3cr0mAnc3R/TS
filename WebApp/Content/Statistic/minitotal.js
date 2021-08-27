const app = new Vue({
    el: "#main-window",
    data: {
        people: [],
        currentFIO: "",
        filteredPeople: [],
        currentHuman: { disciplines: [] },
        auditories: [],
        auditory: {},
        currentPhoto: null,
        userAnswerLog: [],
        hasFullAccess: null,
        currentTest: {},
        places: [],
        disciplines: [],
        currentUser: null,
        newDate: null,
        streamSocket: null,
        textForShow: null,
        currentUid:'',
        assignedModel: {
            DisciplineId: null,
            UserId: null,
            Date: new Date(),
            PlaceId: null
        },
        fromExternal: false,
        objectLoading: {
            loading: false,
            loaded: false
        },
        humanLoader: {
            loading: false,
            loaded: false
        },
        modalLoading: {
            loading: false,
            loaded: false
        },
        answerRequest: null
    },
    methods: {

        init: function () {
            let self = this;
            $('#form-1').on("submit", function () {
                event.preventDefault();
            });

            $.ajax({
                url: '/api/administration/HasFullAccess',
                method: 'post',
                async: true,
                success: function (data) {
                    self.hasFullAccess = data;

                }
            })
            this.getAuditoriums();
            self.initStreamSignal();
            let foreignQuery = location.href.split('=');
            if (foreignQuery.length > 1) {
                self.fromExternal = true;
                self.humanLoader.loaded = false;
                self.humanLoader.loading = true;

                $.ajax({
                    url: "/api/administration/GetUserFamilyById?Id=" + foreignQuery[1],
                    type: 'post',
                    success: function (data) {
                        self.currentFIO = data.Name;
                        self.findByFIO(data.Id);
                    }
                })
                return;
            }

            setTimeout(function () {
                $('#fio').focus();
            }, 200)

        },
        uuidv4: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        findByFIO: function (Id) {
            var self = this;
            self.objectLoading.loading = true;
            self.currentFIO = self.currentFIO.trim();
            $.ajax({
                url: "/api/statistic/findfio",
                type: 'post',
                data: { Fio: self.currentFIO },
                success: function (data) {
                    if (Id != 0 && typeof Id == 'number') {
                        console.log(321);
                        self.filteredPeople = data;
                        self.humanLoader.loaded = true;
                        self.humanLoader.loading = false;
                        self.selectHuman(data.find(a => { return a.Id == Id; }));
                        return;
                    }
                    if (data.length == 0) {
                        self.textForShow = "Люди не найдены";
                        self.filteredPeople = [];
                        self.currentHuman = {};
                        self.currentHuman.disciplines = [];
                    }
                    else { self.textForShow = null; }
                    if (data.length == 1) {
                        self.selectHuman(data[0]);
                    }
                    else {
                        document.title = "Результаты поиска по " + self.currentFIO;
                    }
                    self.filteredPeople = data;

                    self.objectLoading.loading = false;
                },
                error: function (error) {
                    notifier([{ Type: 'error', Body: error.responseJSON.ExceptionMessage }]);
                }
            })
        },
        goToTop() {
            $('#navigation')[0].scrollIntoView();
        },
        download: function (item) {
            let self = this;
            self.download1(item, 1);
            if (item.IsArt) {
                self.download1(item, 3);
                self.download1(item, 4);
            }
        },
        download1: function (item, Id) {
            window.open('/auditory/DownloadReport?Id=' + item.Id + '&Type=' + Id, '_blank');
        },
        initStreamSignal() {
            let self = this;
            self.streamSocket = $.connection.StreamHub;
            $.connection.hub.url = "../signalr";
            //$.connection.hub.proxy = 'ChatHub';

            self.currentUid = self.currentUid == '' ? self.uuidv4() : self.currentUid;

            $.connection.hub.disconnected(function () {
                setTimeout(function () {
                    //Connect to hub again
                    $.connection.hub.start();
                }, 3000);
            });

            $.connection.hub.reconnecting(function () {
                location.reload();
            });

            self.streamSocket.client.onNewUserConnected = function (testingProfileId, isAdmin) {
                if (!isAdmin) {
                    //self.loadPlace(testingProfileId);
                }
            }
            self.streamSocket.client.sendTimeLeft = function (TimeLeft) {
                if (self.currentUser) {
                    self.currentUser.TimeLeft = TimeLeft;
                }
            }
            self.streamSocket.client.sendOffer = function (Id, Offer, Type, guid) {

                if (guid != self.currentUid) {/////////
                    return;
                }
                let info = null;
                if (Type == 1) {
                    info = self.currentUser.cameraInfo;
                }
                else {
                    info = self.currentUser.screenInfo;
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
                    info = self.currentUser.cameraInfo;
                }
                else {
                    info = self.currentUser.screenInfo;
                }
                let peer = info.peer;
                peer.addIceCandidate(candidate);
            }
            self.streamSocket.client.onUserDisconnected = function (testingProfileId) {
                //self.loadPlace(testingProfileId);

            }
            $.connection.hub.start().done(function () {
            }).fail(function (exc) {
                console.error(exc);
            })
        },
        openFull: function (user) {
            let self = this;
            event.stopPropagation();
            self.currentUser = user;

            console.log(self.currentUser);
            let min = 99999999;
            let hasStarted = false;

            self.currentUser.disciplines.forEach(
                function (a) {
                    min = (a.Id < min && a.StatusId == 5 && !hasStarted) ? a.Id : min;
                    if (a.StatusId == 2) {
                        hasStarted = true;
                        min = a.Id;
                    }
                });
            self.currentUser.TestingProfileId = min;
            if (hasStarted) {
                self.currentUser.TestingStatusId = 2;
                self.streamSocket.server.connect(min, true);

                self.currentUser.cameraInfo = {
                    peer: self.initRTCPeer(1)
                };
                self.currentUser.screenInfo = {
                    peer: self.initRTCPeer(2)
                }

                self.streamSocket.server.requestOffer(min, 1, self.currentUid);
                self.streamSocket.server.requestOffer(min, 2, self.currentUid);
            }
            else if (min != 99999999) {
                self.currentUser.TestingStatusId = 5;
                self.currentUser.cameraInfo = {
                    peer: self.initRTCPeer(1)
                };
                self.currentUser.screenInfo = {
                    peer: self.initRTCPeer(2)
                }
                self.streamSocket.server.connect(min, true);
                self.streamSocket.server.requestOffer(min, 1, self.currentUid);
                self.streamSocket.server.requestOffer(min, 2, self.currentUid);
            }
            console.log(min);
            $('#full-wrapper').modal('toggle');
            ////console.log(self.currentUser);
            //setTimeout(function () {
            //    $('#full-video-camera')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-1')[0].srcObject;
            //    $('#full-video-screen')[0].srcObject = $('#video-' + self.currentUser.TestingProfileId + '-2')[0].srcObject;
            //}, 500)
            //console.log(user);
        },
        initRTCPeer: function (type) {
            let self = this;
            let configuration = {
                iceServers: [
                    { urls: 'stun:stun01.sipphone.com' },
                    { urls: 'stun:stun.ekiga.net' },
                    { urls: 'stun:stun3.l.google.com:19302' },
                    { urls: 'stun:stunserver.org' },
                    { urls: 'stun:stun.voiparound.com' },
                    {
                        urls: 'turn:numb.viagenie.ca',
                        credential: 'muazkh',
                        username: 'webrtc@live.com'
                    }
                    //TURN
                ]
            };
            let peer = new RTCPeerConnection(configuration);

            //peer.addEventListener('icecandidate', function (e) {
            //    self.onIceCandidate(self.currentUser, type, e.candidate);
            //})
            peer.addEventListener('track', function (e) {
                self.gotRemoteStream(e, type);
            });

            peer.addEventListener('connectionstatechange', function (event) {
                if (peer && peer.connectionState == 'connecting') {
                    setTimeout(function () {
                        if (!peer || peer.connectionState == 'connecting') {
                            peer = null;
                            self.initRTCPeer(type);
                        }
                    }, 10000);
                }
                else if (peer && (peer.connectionState == 'disconnected' || peer.connectionState == 'failed')) {
                    self.initRTCPeer(type);
                }
            });
            return peer;
        },
        gotRemoteStream: function (e, type) {
            let self = this;
            if (type == 1) {
                self.currentUser.cameraInfo.stream = e.streams[0];
                $('#full-video-camera')[0].srcObject = self.currentUser.cameraInfo.stream;
            }
            else {
                self.currentUser.screenInfo.stream = e.streams[0];
                $('#full-video-screen')[0].srcObject = self.currentUser.screenInfo.stream;
            }

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
        verifyUser: function (Verified) {
            //SetUserVerified
            let self = this;
            self.streamSocket.server.verify(self.currentUser.TestingProfileId, Verified);
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
        sendReload: function () {
            let self = this;
            self.streamSocket.server.requestReload(self.currentUser.TestingProfileId);
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
        openFullPhoto(human) {
            $('#user-photo-window').modal('show');
            event.stopPropagation();
            this.currentPhoto = human.picture;
        },
        closePhoto() {
            this.currentPhoto = null;
        },
        initDisciplines(discs) {
            let self = this;
            discs.map(a => {
                a.TestingDate = new Date(a.TestingDate);
                if (a.TestingBegin) {
                    a.TestingBegin = new Date(a.TestingBegin).toLocaleTimeString();
                }
                else {
                    a.TestingBegin = "Не приступал";

                }
                if (a.TestingEnd) {
                    a.TestingEnd = new Date(a.TestingEnd).toLocaleTimeString();
                }
                else {
                    if (a.StatusId == 2) {
                        a.TestingEnd = "Не завершил";
                    }
                    else {
                        a.TestingEnd = null;
                    }

                }
            });
            return discs;
        },
        isToday: function (test) {
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday;
        },
        selectHuman: function (human) {
            var self = this;
            if (!human.Id) {
                notifier([{ Type: 'error', Body: 'Необходимо загрузить' }]);
            }
            $.ajax({
                url: "/api/statistic/getById?Id=" + human.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman = {};
                    self.currentHuman = human;
                    self.currentHuman.disciplines = [];
                    self.currentHuman.disciplines = self.initDisciplines(data);
                    document.title = self.currentHuman.Name;

                    if (self.fromExternal) {
                        $('#user-' + human.Id)[0].scrollIntoView();
                        self.fromExternal = false;
                    }
                    notifier([{ Type: 'success', Body: 'Загружено' }]);
                }
            })
        },
        resetTP: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/resetProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.selectHuman(self.currentHuman);
                    self.objectLoading.loading = false;
                }
            })
        },
        DoubleNullified: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/Administration/DoubleNullified?Id=" + item.Id,
                type: 'post',
                success: function (data) {

                    self.selectHuman(self.currentHuman);
                    self.objectLoading.loading = false;
                }
            })
        },
        openUserAnswerLogMWindow: function (item) {
            let self = this;
            self.modalLoading.loading = true;
            //console.log(item);
            $('#user-answer-log-window').modal('show');
            if (self.answerRequest) {
                self.answerRequest.abort();
            }
            self.answerRequest = $.ajax({
                url: "/api/Administration/GetUserAnswerLog?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.userAnswerLog = data;
                    self.answerRequest = null;
                    self.modalLoading.loading = false;
                    self.modalLoading.loaded = true;
                }
            })

        },
        openNewTestWindow: function (item) {
            let self = this;
            self.modalLoading.loading = true;
            self.assignedModel.UserId = item.Id
            //console.log(item);
            $('#user-new-test-window').modal('show');

            if (self.disciplines.length == 0) {
                $.ajax({
                    url: "/api/Administration/GetDisciplines",
                    type: 'post',
                    success: function (data) {
                        self.disciplines = data;
                        self.modalLoading.loading = false;
                        self.modalLoading.loaded = true;
                    }
                });
            }

        },
        openChangeTimeMWindow: function (item) {
            let self = this;

            self.currentTest = item;
            console.log(item);
            $('#user-new-time-window').modal('show');
        },
        selectPlace(place) {
            let self = this;
            self.assignedModel.PlaceId = place;
        },
        saveNewDate() {
            let self = this;
            if (!self.newDate) {
                let t = new Date();
                self.newDate = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() + 'T' + t.toLocaleTimeString();
            }
            //self.modalLoading.loading = true;
            console.log(self.newDate);
            $.ajax({
                url: "/api/Administration/ChangeTestingDate",
                type: 'post',
                data: {
                    Id: self.currentTest.Id,
                    TestingDate: self.newDate
                },
                success: function (data) {
                    if (data == 1) {
                        notifier([{ Type: 'success', Body: 'Успешно сохранено' }]);
                        self.selectHuman(self.currentHuman);
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Произошла ошибка при сохранении даты' }]);
                    }
                    self.modalLoading.loading = false;
                    self.modalLoading.loaded = true;
                }
            });

        },
        assignTest() {
            let self = this;
            console.log(self.assignedModel);//AssignDisciplineToUser
            if (!(self.assignedModel.DisciplineId && self.assignedModel.PlaceId)) {
                notifier([{ Type: 'error', Body: 'Заполните все поля' }]);
                return
            }
            $.ajax({
                url: "/api/Administration/AssignDisciplineToUser",
                type: 'post',
                data: self.assignedModel,
                success: function (data) {
                    if (data == 1) {
                        self.selectHuman(self.currentHuman);
                        $('#user-new-test-window').modal('hide');
                        notifier([{ Type: 'success', Body: 'Успешно назначено' }]);
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Во время соохранения произошла ошибка' }]);
                    }
                    self.modalLoading.loading = false;
                    self.modalLoading.loaded = true;
                }
            })
        },
        downloadCamera: function (Id, type) {
            window.open('/statistic/Download?Id=' + Id + '&Type=' + type, '_blank');
        },
        finishTP: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/finishProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    //self.currentHuman.disciplines = self.initDisciplines(data);

                    self.selectHuman(self.currentHuman);
                }
            })
        },
        nullify: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/nullifyProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    //self.currentHuman.disciplines = self.initDisciplines(data);

                    self.selectHuman(self.currentHuman);
                }
            })
        },
        deleteTP: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/deleteProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    if (data == 1) {
                        //self.currentHuman.disciplines = self.currentHuman.disciplines.filter(function (item1) { return item1.Id != item.Id });
                        self.selectHuman(self.currentHuman);
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Сперва нужно сбросить' }]);
                    }
                }
            })
        },
        openNewPlaceWindow: function (disc) {
            $('#place-window').modal('show');
            this.currentTest = disc;
            //console.log(this.currentTest.PlaceId);
            //this.getCurrentPlace();
        },
        unload: function (item) {
            var self = this;
            $.ajax({
                url: "/api/auditory/UpdateStatus?Id=" + item.Id + '&StatusId=4',
                type: "POST",
                async: true,
                success: function (newStatus) {
                    if (newStatus.Error) {
                        notifier([{ Type: 'error', Body: newStatus.Error }]);
                    }
                    else
                        notifier([{ Type: 'success', Body: "Результат успешно выгружен" }]);

                    self.selectHuman(self.currentHuman);
                }
            });
        },
        getCurrentPlace: function () {
            var self = this;
            $.ajax({
                url: "/api/statistic/getCurrentPlace?Id=" + self.currentHuman.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.placeInfo = data;
                }
            })
        },
        getAuditoriums: function () {
            var self = this;
            $.ajax({
                url: "/api/administration/getAuditoryList",
                type: 'post',
                success: function (data) {
                    self.auditories = data;
                }
            })
        },
        getAuditoryInfo: function (aud) {
            var self = this;
            $.ajax({
                url: "/api/administration/getAuditoryById?Id=" + aud.Id,
                type: 'post',
                success: function (data) {
                    self.places = data;
                    self.auditory = aud;
                }
            })
        },
        closeModal() {
            let self = this;
            $('#place-window').modal('hide');
            self.currentTest = {};
            self.auditory = {};
            self.places = [];
        },
        setPlaceToUser: function (Id) {
            var self = this;
            if (self.places.find(a => a.Id == Id).IsUsed) {
                notifier([{ Type: 'error', Body: 'Место занято' }]);
                return;
            }
            $.ajax({
                url: "/api/statistic/setPlacetouser",
                type: 'post',
                data: {
                    PlaceId: Id,
                    TestingProfileId: self.currentTest.Id,
                    UserId: self.currentHuman.Id
                },
                success: function () {
                    notifier([{ Type: 'success', Body: 'Место обновлено' }]);
                    self.selectHuman(self.currentHuman);
                    self.closeModal();
                },
                error: function () {
                    //notifier('');
                    notifier([{ Type: 'error', Body: 'Место занято' }]);
                    self.closeModal();
                }
            })
        }
    },
    mounted: function () {
        this.init();
    }
});
