
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
        currentError: 0


    },
    methods: {
        init: function () {
            let self = this;
            //self.interval = setInterval(function () {
            //    $.ajax({
            //        url: '/user/getoffer?Id=' + 81,
            //        method: 'post',
            //        success: function (data) {
            //            self.pc2Local = new RTCPeerConnection();
            //            self.pc2Local.onaddstream = function (obj) {
            //                console.log(obj);
            //                self.video3[0].srcObject = obj.stream;
            //            }
            //            console.log(data);
            //            var offer = data;//getOfferFromFriend();
            //            navigator.getUserMedia({ video: true }, function (stream) {
            //                //self.pc2Local.onaddstream = e => { self.video3[0].srcObject = e.stream; console.log(self.video3[0].srcObject); }
            //                    self.pc2Local.addStream(stream);

            //                self.pc2Local.setRemoteDescription(new RTCSessionDescription(offer), function () {
            //                    console.log(offer);
            //                    self.pc2Local.createAnswer(function (answer) {
            //                        console.log(answer);
            //                        self.pc2Local.setLocalDescription(answer, function () {
            //                            $.ajax({
            //                                url: '/user/SaveAnswer',
            //                                type: 'POST',
            //                                data: {
            //                                    Id: localStorage['placeConfig'],
            //                                    Answer: JSON.stringify(answer)
            //                                }
            //                                //  processData: false
            //                            });
            //                                // send the answer to a server to be forwarded back to the caller (you)
            //                            }, function () { });
            //                        }, function () { });
            //                    }, function () { });
            //                }, function () { });

            //            //self.pc2Local.onicecandidate = function (e) {
            //            //    console.log(e);
            //            //    // candidate exists in e.candidate
            //            //    if (!e.candidate) return;
            //            //    send("icecandidate", JSON.stringify(e.candidate));
            //            //};
            //            //console.log(self.pc2Remote);


            //            //let buffer = new Blob(data, { type: 'video/webm' });
            //            //window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
            //            //let src = URL.createObjectURL(buffer);
            //            //let obj = $('#video')[0];
            //            //obj.src = src;
            //            //self.img = src;
            //        }
            //    });

            ////}, 200);
            //self.video3 = $('#video');

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
                let socket = null;
                let socket1 = null;
                console.log(a);
                if (typeof (WebSocket) !== 'undefined') {
                    socket = new WebSocket("ws://localhost/WebApp/ChatHandler.ashx");
                    socket1 = new WebSocket("ws://localhost/WebApp/StreamHandler.ashx");
                    self.chatSockets.push({ id: a.TestingProfileId, socket: socket });
                    self.videoSockets.push({ id: a.TestingProfileId, socket: socket1 });
                } else {
                    socket = new MozWebSocket("ws://localhost/WebApp/ChatHandler.ashx");
                    self.chatSockets.push({ id: a.TestingProfileId, socket: socket });
                    socket1 = new MozWebSocket("ws://localhost/WebApp/StreamHandler.ashx");
                    self.videoSockets.push({ id: a.TestingProfileId, socket: socket1 });
                }
                self.chats.push(self.initChat(a.TestingProfileId));
                socket.onopen = function () {
                    socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: a.TestingProfileId }));
                    self.getMessages(a.TestingProfileId);
                }

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

                socket1.onopen = function () {
                    socket1.send(JSON.stringify({ ForCreate: true, TestingProfileId: a.TestingProfileId }));
                    self.pc2 = new RTCPeerConnection(iceServers, optional);
                    self.pc2.onicecandidate = function (event) {
                        var candidate = event.candidate;
                        if (candidate) {
                            //let socket = self.videoSockets.find(a => a.id == offerSDP.TestingProfileId).socket;
                            console.log(candidate);
                            //self.pc2.addIceCandidate(candidate);
                            //socket1.send(JSON.stringify({ candidate: candidate.candidate, address: candidate.address, component: candidate.component, foundation: candidate.foundation, port: candidate.port, priority: candidate.priority, Type: candidate.type, TestingProfileId: a.TestingProfileId, IsSource: false, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex }));
                            console.log(a);
                            console.log(JSON.stringify({
                                IsSource: false,
                                TestingProfileId: a.TestingProfileId,
                                candidate: candidate
                            }));
                            socket1.send(JSON.stringify({
                                IsSource: false,
                                TestingProfileId: a.TestingProfileId,
                                candidate: candidate
                            }));
                        }
                    };
                    self.pc2.onicecandidatestatechange = function (event) {
                        // let candidate = event.candidate;
                        // if (candidate) {
                        //self.videoSocket.send(JSON.stringify({ candidate: candidate.candidate, address: candidate.address, component: candidate.component, foundation: candidate.foundation, port: candidate.port, priority: candidate.priority, Type: candidate.type, TestingProfileId: self.testingProfileId  }));
                        console.log(event);
                        // }
                    };
                    self.pc2.ontrack = function (stream) {
                        console.log(stream.streams[0]);
                        $('#video1')[0].srcObject = stream.streams[0];

                    }


                    //self.getMessages(a.TestingProfileId);
                }
                socket.onmessage = function (msg) {
                    console.log(msg);
                    let message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                    message.Date = new Date(message.Date);
                    let chat = self.chats.filter(a => a.TestingProfileId == msg.data.testingProfileId);
                    chat.messages.push(message);
                };
                socket1.onmessage = function (msg) {
                    let info = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                    console.log(info);
                    if (info.Type == 'offer') {
                        let remoteDescription = new RTCSessionDescription({ sdp: info.Sdp, type: 'offer' });
                        self.pc2.setRemoteDescription(remoteDescription, function () { }, function () { });
                        const answer = self.pc2.createAnswer(
                            function (answer) {
                                console.log(answer);
                                socket1.send(JSON.stringify({ TestingProfileId: info.TestingProfileId, Type: answer.type, Sdp: answer.sdp }));
                                self.pc2.setLocalDescription(answer, function () { }, function () { });
                            }, function () { });
                    }
                    else {
                        console.log(info);
                        if (info.IsSource)
                            self.pc2.addIceCandidate(info.candidate);
                    }
                    console.log(info);
                };
                socket.onclose = function (event) {
                    alert('Мы потеряли её. Пожалуйста, обновите страницу');
                };
            });
        },
        createAnswer: function (offerSDP) {
            let self = this;
            var MediaConstraints = {
                audio: true,
                video: true
            };
            navigator.webkitGetUserMedia(MediaConstraints, OnMediaSuccess, OnMediaError);

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
            function OnMediaError(error) {
                console.error(error);
            }

            function OnMediaSuccess(mediaStream) {
                //var peer = new [webkit | moz]RTCPeerConnection(iceServers, optional);
                self.pc2 = new RTCPeerConnection(iceServers, optional)
                self.pc2.addStream(mediaStream);

                self.pc2.onaddstream = function (mediaStream) {
                    console.log(mediaStream);
                    $('#video1')[0].srcObject = mediaStream.stream;
                };

                self.pc2.onicecandidate = function (event) {
                    var candidate = event.candidate;
                    if (candidate) {
                        let socket = self.videoSockets.find(a => a.id == offerSDP.TestingProfileId).socket;
                        console.log(candidate);
                        socket.send(JSON.stringify({ candidate: candidate.candidate, address: candidate.address, component: candidate.component, foundation: candidate.foundation, port: candidate.port, priority: candidate.priority, Type: candidate.type, TestingProfileId: offerSDP.TestingProfileId }));
                    }
                };
                console.log(offerSDP);
                //// remote-descriptions should be set earlier
                //// using offer-sdp provided by the offerer
                let remoteDescription = new RTCSessionDescription({ sdp: offerSDP.Sdp, type: 'offer' });
                self.pc2.setRemoteDescription(remoteDescription, function () { }, function () { });

                self.pc2.createAnswer(function (answerSDP) {
                    self.pc2.setLocalDescription(answerSDP, function () { }, function () { });
                    let socket = self.videoSockets.find(a => a.id == offerSDP.TestingProfileId).socket;
                    console.log(answerSDP);
                    socket.send(JSON.stringify({
                        Sdp: answerSDP.sdp,
                        Type: answerSDP.type,
                        TestingProfileId: offerSDP.testingProfileId
                    }));
                    console.log(answerSDP);
                }, function () { }, function () { });
            }
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
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        }
    },
    mounted() {
        console.log(1);
        this.init();
    }
});