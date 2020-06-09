const app = new Vue({
    el: "#main-window",
    data: {
        HasCase: false,
        TestingProfileId: 0,
        domain:"",
        questions: [],//testingResultId (2179), TestingPackageId, AnswerId, Id, TypeAnswerId, Sort, UserAnswer
        loadObject: {
            loading: null,
            loaded: null
        },
        fullLoadObject: {
            loading: true,
            loaded: false
        },
        page: 1,
        selectedQuestion: {},
        members: [],//Id, UserId, fio, UserRoleId, UserRoleName
        openedMembers: [],//Id, UserId, fio, UserRoleId, UserRoleName
        notMeMembers: [],//Id, UserId, fio, UserRoleId, UserRoleName,
        ableMembers: [],
        currentAnswerVote: 0,
        currentMarkVote: 0,
        shownSummary: false,
        currentMarkVoteDate: null,
        currentUser: {},
        maxScore: 0,
        socket: null,
        messageText: "",
        localization: 1,
        isChatOpened: false,
        isFullChatOpened: true,
        messages: [],
        currentMsgParent: null,
        filteredMessages: [],
        enrollee: {},
        pageWidth: 0,
        newMessages: [],
        counter: 0,
        unloadedImage: '',
        videoRTCPeers: [],
        stream: null,
        queue: []
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/account/GetDomain",
                type: "POST",
                async: false,
                success: function (domain) {
                    self.domain = domain;
                }
            });
            window.onresize = function () {
                self.pageWidth = $('#main-window').width();
            };
            let str = window.location.href;
            let newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.TestingProfileId = newId;
            let loadedCount = 0;

            $.ajax({
                url: "/verification/IsAvailable?Id=" + newId,
                type: "POST",
                async: false,
                success: function (HasAccess) {
                    self.HasCase = HasAccess;
                    console.log(HasAccess);
                    //if (HasAccess) {
                    self.initQuestions(newId);
                    self.GetMembers(newId);
                    loadedCount++;
                    if (loadedCount == 4) {
                        self.fullLoadObject.loaded = true;
                        self.fullLoadObject.loading = false;
                    }
                    // }
                }
            });
            $.ajax({
                url: "/verification/GetCurrentUser?TestingProfileId=" + newId,
                type: "POST",
                async: false,
                success: function (user) {
                    user.peer = null;
                    self.currentUser = user;
                    loadedCount++;
                    if (loadedCount == 4) {
                        self.fullLoadObject.loaded = true;
                        self.fullLoadObject.loading = false;
                    }
                }
            });
            $.ajax({
                url: "/verification/GetEnrolleeInfo?TestingProfileId=" + newId,
                type: "POST",
                async: false,
                success: function (user) {
                    self.enrollee = user;
                    loadedCount++;
                    if (loadedCount == 4) {
                        self.fullLoadObject.loaded = true;
                        self.fullLoadObject.loading = false;
                    }
                }
            });
            $.ajax({
                url: "/user/GetChatMessages?Id=" + newId,
                type: "POST",
                async: false,
                success: function (messageList) {
                    let messages = messageList;
                    let i = 0;
                    messages.map(function (a) {
                        a.Date = new Date(Number(a.Date.substr(a.Date.indexOf('(') + 1, a.Date.indexOf(')') - a.Date.indexOf('(') - 1)));
                        if (i < 4) {
                            i++;
                            a.UserIdFrom = "a7646fb3-430b-4982-817c-6b0f14642e5a";
                        }
                        a.Readed = true;
                    });
                    self.messages = messages;
                    self.filteredMessages = self.messages.filter(function (msg) {
                        return msg.UserIdTo == null;
                    });
                    loadedCount++;
                    if (loadedCount == 4) {
                        self.fullLoadObject.loaded = true;
                        self.fullLoadObject.loading = false;
                    }
                    setTimeout(function () {

                        self.pageWidth = $('#main-window').width();
                    }, 300);
                }
            });

            if (typeof (WebSocket) !== 'undefined') {
                self.socket = new WebSocket(self.domain + "/ProctorHandler.ashx");
            } else {
                self.socket = new MozWebSocket(self.domain + "/ProctorHandler.ashx");
            }
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.socket = new WebSocket("wss://" + window.location.hostname + "/ProctorHandler.ashx");
            //} else {
            //    self.socket = new MozWebSocket("wss://" + window.location.hostname + "/ProctorHandler.ashx");
            //}
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.socket = new WebSocket("ws://" + window.location.hostname + "/ProctorHandler.ashx");
            //} else {
            //    self.socket = new MozWebSocket("ws://" + window.location.hostname + "/ProctorHandler.ashx");
            //}
            if (self.socket) {
                self.socket.onopen = function () {
                    self.socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.TestingProfileId }));
                    self.initWebCam();
                    self.socket.send(JSON.stringify({ Id: 4, TestingProfileId: self.TestingProfileId, Data: JSON.stringify({ requestOffer: true, UserId: self.currentUser.Id }) }));
                }
                self.socket.onmessage = function (msg) {
                    let message;
                    if (msg.data.indexOf("\0") != -1) {
                        message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                    }
                    else {
                        message = JSON.parse(msg.data);
                    }
                    switch (message.Id) {
                        case 1: {

                            let msg = JSON.parse(message.Data);
                            msg.Readed = true;
                            // console.log(msg.Date);
                            msg.Date = new Date(Number(msg.Date.substr(msg.Date.indexOf('(') + 1, msg.Date.indexOf(')') - msg.Date.indexOf('(') - 1)));
                            //msg.Date = new Date(msg.Date);
                            //console.log(msg.Date);
                            self.messages.push(msg);
                            self.newMessages.push(msg);
                            let found = self.openedMembers.filter(function (member) {
                                return member.isOpened;
                            })[0];
                            if (found) {
                                self.filterMessages();
                            }
                            else {
                                self.filterMessages(true);
                            }
                            break;
                        }
                        case 2: {
                            self.updateScoreAnswer(message.Data);
                            //message.Data; //Chat
                            break;
                        }
                        case 3: {
                            self.updateScoreExam(message.Data);
                            //message.Data; //Chat
                            break;
                        }
                        case 4: {
                            //self.updateScoreExam(message.Data);
                            //message.Data; //Chat
                            let msg = JSON.parse(message.Data);
                            console.log(msg, self.currentUser);
                            if (msg.UserId != self.currentUser.Id) {
                                console.log(message.Data);
                                console.log(found);
                                let found = self.members.filter(function (member) {
                                    return member.Id == msg.UserId;
                                })[0];
                                self.initRTCPeer(self.currentUser, found);
                            }
                            else {
                               // if (!self.currentUser.peer)
                                 //   self.initRTCPeer(self.currentUser, found);
                            }
                            break;
                        }
                        case 5: {
                            //self.updateScoreExam(message.Data);
                            //message.Data; //Chat
                            let msg = JSON.parse(message.Data);
                            console.log(msg);
                            if (msg.To == self.currentUser.Id) {
                                if (msg.candidate && msg.candidate != '{}') {
                                    let candidate = new RTCIceCandidate(JSON.parse(message.candidate));
                                    self.queue.push(candidate);
                                }
                                else if (msg.offer) {
                                    navigator.getUserMedia({ video: true }, function (stream) {
                                        console.log('start video', msg.UserId);
                                        let found = self.members.filter(function (member) {
                                            console.log(member);
                                            return member.Id == msg.UserId;
                                        })[0];
                                        console.log('start video', found);
                                        let interval = setInterval(function () {
                                            if (found) {
                                                console.log('add stream');
                                                found.peer.addStream(stream);
                                                clearInterval(interval);
                                                console.log('start desc');
                                                found.peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.offer)), function () {
                                                    found.peer.createAnswer(function (answer) {
                                                        found.peer.setLocalDescription(answer, function () {
                                                            let obj1 = {};
                                                            for (let i in answer) {
                                                                if (typeof answer[i] != 'function')
                                                                    obj1[i] = answer[i];
                                                            }
                                                            obj = {
                                                                Data: { answer: JSON.stringify(obj1), To: msg.UserId, UserId: self.currentUser.Id }, TestingProfileId: self.TestingProfileId, Id: 5
                                                            };//UserId: app.currentUser.Id, UserIdTo: to.Id
                                                            socket.send(JSON.stringify(obj));
                                                            self.queue.forEach(function (candidate) {
                                                                found.peer.addIceCandidate(candidate);
                                                            });

                                                        }, function (r) { console.log(r); });
                                                    }, function (r) { console.log(r); });
                                                }, function (r) { console.log(r); });
                                            }
                                        }, 1000)
                                    }, function (r) { console.log(r); });

                                }
                                else if (msg.answer) {
                                    let found = self.members.filter(function (member) {
                                        return member.Id == msg.UserId;
                                    });
                                    found.peer.setRemoteDescription(new RTCSessionDescription(JSON.parse(msg.answer)), function (r) {

                                        self.queue.forEach(function (candidate) {
                                            found.peer.addIceCandidate(candidate);
                                        });
                                    }, function (r) { console.log(r); });
                                }
                            }


                            break;
                        }
                    }
                };
                self.socket.onclose = function (event) {
                    console.log('close');
                };
            }
        },
        initRTCPeer: function (created, to) {
            let self = this;
            console.log('init', created, to);
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
            console.log(created);
            to.peer = new RTCPeerConnection(configuration);

            to.peer.addEventListener('icecandidate', function (e) {
                self.onIceCandidate(e, to);
            });

            to.peer.addEventListener('connectionstatechange', function (event) {
                console.log(to.peer.connectionState);
                if (to.peer.connectionState == 'connecting') {
                    setTimeout(function () {
                        if (to.peer.connectionState == 'connecting') {
                            self.initRTCPeer(to, to);
                        }
                    }, 10000);
                }
                if (to.peer.connectionState == 'disconnected') {
                    self.initRTCPeer(to, to);
                }
            });
            console.log('start');
            to.peer.addEventListener('track', function (e) {
                self.gotRemoteStream(e);
            });

            let interval = setInterval(function () {
                if (self.stream) {
                    self.stream.getTracks().forEach(function (track) {
                        to.peer.addTrack(track, self.stream);
                    });
                    clearInterval(interval);
                }
            }, 500)

            try {
                to.peer.createOffer(function (offer) {
                    to.peer.setLocalDescription(offer, function () {
                        let obj1 = {};
                        for (let i in offer) {
                            if (typeof offer[i] != 'function')
                                obj1[i] = offer[i];
                        }
                        console.log(to, self.currentUser);
                        let obj = {
                            offer: JSON.stringify(obj1), TestingProfileId: self.TestingProfileId, To: to.Id, UserId: self.currentUser.Id
                        };
                        if (self.socket && self.socket.readyState == 1) {
                            self.socket.send(JSON.stringify({ Id: 5, TestingProfileId: self.TestingProfileId, Data: JSON.stringify(obj) }));
                        }
                    }, function () { });
                }, function () { });
            }
            catch{
                console.log('error');
            }
        },
        initWebCam: function () {
            let self = this;
            if (!self.stream) {
                setTimeout(function () {
                    navigator.getUserMedia(
                        {
                            video: true,
                            audio: true
                        },
                        function (stream) {/*callback в случае удачи*/
                            self.stream = stream;
                            console.log('stream', stream);
                            // self.initRTCPeer(created, to);
                            $('#video' + self.currentUser.Id)[0].srcObject = stream;

                        },
                        function () {/*callback в случае отказа*/ });
                }, 500)
            }
        },
        gotRemoteStream: function (e) {
            console.log(e);
        },
        onIceCandidate: function (e, to) {
            let obj1 = {};
            for (let i in e.candidate) {
                if (typeof e.candidate[i] != 'function')
                    obj1[i] = e.candidate[i];
            }
            let obj = {
                candidate: JSON.stringify(obj1), TestingProfileId: app.TestingProfileId, UserId: app.currentUser.Id, UserIdTo: to.Id
            };
            //console.log(e.candidate);
            if (app.socket && app.socket.readyState == 1) {
                // console.log('send');
                app.socket.send(JSON.stringify({ Id: 5, TestingProfileId: app.TestingProfileId, Data: JSON.stringify(obj) }));
            }
            else {
                app.onIceCandidate(e, to);
            }
        },
        getDateFormat: function (date) {
            let self = this;
            return self.isZeroNeed(date.getHours()) + ":" + self.isZeroNeed(date.getMinutes());
        },
        isZeroNeed: function (value) {
            if (value < 10)
                return '0' + value;
            else return value;
        },
        initQuestions: function (newId) {
            //GetInfoAboutVerification
            let self = this;

            $.ajax({
                url: "/verification/GetInfoAboutVerification?Id=" + newId,
                type: "POST",
                async: false,
                success: function (questions) {
                    questions.forEach(function (item) {
                        item.IsLoaded = false;
                        item.QuestionImage = null;
                        item.Answers = [{ UserAnswer: (item.UserAnswer && item.UserAnswer.trim() != "") ? item.UserAnswer : "Абитуриент не ответил" }];
                        item.Scores = [];
                        item.maxScore = 0;
                        item.answerImage = "";
                    });
                    self.questions = questions;
                    self.selectQuestion(1);
                }
            });
        },
        sendMessage: function () {
            let self = this;
            let found = self.openedMembers.filter(function (member) {
                return member.isOpened;
            })[0];
            let uid = found ? found.UserUid : null;
            let obj = JSON.stringify({ Id: 1, TestingProfileId: self.TestingProfileId, Data: JSON.stringify({ Message: self.messageText, Date: new Date(), ParentId: self.currentMsgParent, UserIdTo: uid }) });
            self.socket.send(obj);
            self.messageText = "";
        },
        setParentMessage: function (id) {
            let self = this;
            self.currentMsgParent = id;
            self.scrollToLastMessage();
            //scrollIntoView
        },
        resetParentMessage: function () {
            let self = this;
            self.currentMsgParent = null;
        },
        findParentMessage: function (Id) {
            let self = this;
            let found;
            if (!Id) {
                found = self.filteredMessages.filter(function (msg) {
                    return msg.Id == self.currentMsgParent;
                })[0];
            }
            else {
                found = self.filteredMessages.filter(function (msg) {
                    return msg.Id == Id;
                })[0];
            }
            return found;
        },
        getUnreadMessagesCount: function (mId) {
            let self = this;
            if (mId == 1) {
                let msgs = self.newMessages.filter(function (msg) {
                    return msg.UserIdTo == null;
                });
                return msgs.length;
            }

            let found = self.openedMembers.filter(function (member) {
                return member.isOpened;
            })[0];

            let msgs = self.newMessages.filter(function (msg) {
                return msg.UserIdFrom == mId && found.UserUid != msg.UserIdFrom;
            })
            return msgs.length;
        },
        getShortFio: function (fio) {
            let fios = fio.split(' ');
            return fios[0] + " " + fios[1][0] + "." + fios[2][0] + ".";
        },
        selectQuestion: function (id) {
            let self = this;
            //Если выбран несуществующий номер (кто-то нажал на назад на первом вопросе), то ничего не делать
            if (id == 0 || id == self.questions.length + 1) return;
            this.shownSummary = false;
            //Текущий вопрос для подсветки
            self.page = id;
            //Находим новый вопрос
            self.selectedQuestion = self.questions.filter(function (a) { return a.Sort == id; })[0];
            self.currentAnswerVote = 0;
            //Если не загружали изображения, то загружаем
            if (!self.selectedQuestion.IsLoaded) {
                //Изображение вопроса
                self.loadObject.loaded = false;
                self.loadObject.loading = true;

                self.counter = 0;
                self.askQuestionImagePart(1);
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetQuestionImage?Id=' + self.selectedQuestion.Id,
                    success: function (d) {
                        self.selectedQuestion.QuestionImage = d.QuestionImage;
                        //После загрузки ставим метку, что загружено
                        self.selectedQuestion.IsLoaded = true;
                        self.GetInfoAboutAnswer(self.selectedQuestion, self.selectedQuestion.TestingResultId);
                    }
                });
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/verification/GetMaxScore?Id=' + self.selectedQuestion.TestingResultId,
                    success: function (d) {
                        self.selectedQuestion.maxScore = d.MaxQuestionScore;
                        self.maxScore = d.MaxStructureDisciplineScore;
                    }
                });
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
                                }
                            }
                        });
                    });
                }
                else {

                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: '/auditory/DownloadFile?Id=' + self.selectedQuestion.FileId,
                        success: function (data) {
                            self.selectedQuestion.answerImage = data;
                            self.loadObject.loading = false;
                            self.loadObject.loaded = true;
                        }
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
                        if (self.counter == self.selectedQuestion.Answers.length + 1 || self.selectedQuestion.TypeAnswerId == 3) {
                            self.loadObject.loading = false;
                            self.loadObject.loaded = true;
                        }
                        console.log(self.selectedQuestion);
                        //self.selectedQuestion.QuestionImage += d.QuestionImage;
                    }

                }
            });
        },
        showTotal: function () {
            let self = this;
            self.shownSummary = true;
            self.page = -1;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/GetMark?Id=' + self.TestingProfileId,
                success: function (d) {
                    if (d) {
                        self.currentMarkVote = d.Score;
                        self.currentMarkVoteDate = new Date(Number(d.ScoreDate.substr(d.ScoreDate.indexOf('(') + 1, d.ScoreDate.indexOf(')') - d.ScoreDate.indexOf('(') - 1))).toLocaleDateString();
                    }
                }
            });
            self.questions.forEach(function (item) {
                self.GetInfoAboutAnswer(item, item.TestingResultId);
            })
        },
        GetMembers: function (Id) {
            let self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/GetMembers?Id=' + Id,
                success: function (d) {
                    d.map(function (item) {
                        item.peer = null;
                    });
                    self.members = d;
                    self.ableMembers = self.members.filter(function (member) { return member.UserRoleId != 4; });
                    self.notMeMembers = self.members.filter(function (member) { return member.Id != self.currentUser.Id; });

                    self.notMeMembers.forEach(function (member) {
                        if (self.socket && self.socket.readyState == 1) {
                            // self.initRTCPeer(member);
                        } else {
                            let interval = setInterval(function () {
                                if (self.socket && self.socket.readyState == 1) {
                                    clearInterval(interval);
                                    //self.initRTCPeer(member);
                                }
                            }, 1000);
                        }
                    });
                }
            });
        },
        GetInfoAboutAnswer: function (question, Id) {
            //Получаем то, что ответили другие
            let self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/GetInfoAboutAnswer?Id=' + Id,
                success: function (d) {
                    question.Scores = d;
                    let counter = self.questions.length;
                    self.questions.forEach(function (question) {
                        let scores = question.Scores.filter(function (score) {
                            return score.ExaminationBoardId == self.currentUser.Id;
                        })[0];
                        if (scores) {
                            counter--;
                        }
                    });
                    if (counter == 0) {
                        self.saveTest();
                    }
                    // self. = d;
                }
            });
        },
        getUserScore: function (Id, question) {
            let self = this;
            let score;
            if (!question)
                score = self.selectedQuestion.Scores.filter(function (a) {
                    //console.log(a, self.selectedQuestion.TestingResultId);
                    return a.ExaminationBoardId == Id;
                })[0];
            else {
                score = question.Scores.filter(function (a) {
                    return a.ExaminationBoardId == Id;
                })[0];
            }
            return score ? score.Score : self.switchLocal(6);
            //let score = self.selectedQuestion.Scores.filter();
        },
        getQuestionById: function (id) {
            let self = this;
            let question = self.questions.filter(function (item) {
                return item.Sort == id;
            })[0];
            //self.GetInfoAboutAnswer(question, question.TestingResultId);
            return question;
        },
        getUserSummary: function (Id) {
            let self = this;
            let total = 0;
            self.questions.forEach(function (question) {
                let score = question.Scores.filter(function (a) {
                    return a.ExaminationBoardId == Id;
                })[0];
                total += score ? parseInt(score.Score) : 0;
            });

            return total;
            //let score = self.selectedQuestion.Scores.filter();
        },
        getUsersSummary: function () {
            let self = this;
            let score = 0;
            let avg = 0;
            self.ableMembers.forEach(function (member) {
                score += self.getUserSummary(member.Id);
            });
            avg = (score / self.ableMembers.length).toFixed(2);
            return avg;
        },
        saveTotal: function () {
            let self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/SaveMark',
                data: { TestingProfileId: self.TestingProfileId, Score: self.currentMarkVote }
            });
            if (self.socket) {
                self.socket.send(JSON.stringify({ Id: 3, Data: { Score: self.currentMarkVote, ScoreDate: new Date() }, TestingProfileId: self.TestingProfileId }));
            }
        },
        updateScoreAnswer: function (info) {
            let self = this;
            let question = self.questions.filter(function (question) {
                return (question.TestingResultId == info.TestingResultId);
            })[0];
            let score = question.Scores.filter(function (score) {
                return score.TestingResultId == info.TestingResultId && score.ExaminationBoardId == info.ExaminationBoardId;
            })[0];
            if (score) {
                score.Score = info.Score;
            }
            else {
                question.Scores.push(info);
            }
        },
        updateScoreExam: function (info) {
            let self = this;
            self.currentMarkVote = info.Score;
            self.currentMarkDate = new Date(Number(info.ScoreDate.substr(info.ScoreDate.indexOf('(') + 1, info.ScoreDate.indexOf(')') - info.ScoreDate.indexOf('(') - 1))).toLocaleDateString();
        },
        saveAnswer: function () {
            //SaveInfoAboutAnswer
            //Id = question.Scores.ExaminationBoardId, 
            //TestingResultId = self.selectedQuestion.TestingResultId
            //Score = self.currentAnswerVote
            let self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/SaveInfoAboutAnswer',
                data: { Id: self.currentUser.Id, TestingResultId: self.selectedQuestion.TestingResultId, Score: self.currentAnswerVote }
            });
            //self.GetInfoAboutAnswer(self.selectedQuestion, self.selectedQuestion.TestingResultId);
            if (self.socket) {
                self.socket.send(JSON.stringify({ Id: 2, Data: { ExaminationBoardId: self.currentUser.Id, Score: self.currentAnswerVote, TestingResultId: self.selectedQuestion.TestingResultId }, TestingProfileId: self.TestingProfileId }));
            }
        },
        saveTest: function () {
            //Вызывается автоматически после ввода всех ответов.
            //SaveInfoAboutAnswer
            //Id = question.Scores.ExaminationBoardId, 
            //TestingResultId = self.selectedQuestion.TestingResultId
            //Score = self.currentMarkVote
            let self = this;

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/SaveInfoAboutTest',
                data: { Id: self.currentUser.Id, TestingProfileId: self.TestingProfileId, Score: self.getUserSummary(self.currentUser.Id) }
            });
        },
        downloadFile: function (id) {
            let self = this;
            //window.open('/auditory/DownloadFile?Id=' + id, '_blank');
        },
        IsUserMe: function (id) {
            let self = this;
            return id == self.currentUser.UserUid;
        },
        openChatInfo: function () {
            let self = this;
            self.isChatOpened = !self.isChatOpened;
            if (self.isChatOpened) {
                self.scrollToLastMessage();
            }
        },
        scrollToLastMessage: function () {
            let self = this;
            let maxId = 0;
            self.filteredMessages.forEach(function (msg) {
                maxId = msg.Id > maxId ? msg.Id : maxId;
            });
            console.log($('#message-' + maxId));
            setTimeout(function () {
                $('#message-' + maxId)[0].scrollIntoView();
            }, 20);
        },
        openChat: function (Id) {
            let self = this;
            self.openedMembers.forEach(function (member) {
                member.isOpened = false;
            })
            self.isFullChatOpened = false;
            let found = self.members.filter(function (member) {
                return member.Id == Id;
            })[0];
            let opened = self.openedMembers.filter(function (member) {
                return member.Id == Id;
            })[0];
            if (opened) {
                self.openOChat(Id);
                return;
            }
            else {
                let obj = {};
                Object.assign(obj, found);
                obj.isOpened = true;
                self.openedMembers.unshift(obj);
                self.openOChat(Id);
            }
        },
        openOChat: function (Id) {
            let self = this;
            self.resetParentMessage();
            self.openedMembers.forEach(function (member) {
                member.isOpened = false;
            })
            if (Id == -1) {
                self.isFullChatOpened = true;
                self.filterMessages(true);
                return;
            }
            self.isFullChatOpened = false;
            let found = self.openedMembers.filter(function (member) {
                return member.Id == Id;
            })[0];
            found.isOpened = true;
            self.filterMessages();
        },
        filterMessages: function (fullchat) {
            let self = this;
            if (!fullchat) {
                let found = self.openedMembers.filter(function (member) {
                    return member.isOpened;
                })[0];
                self.filteredMessages = self.messages.filter(function (msg) {
                    return (msg.UserIdFrom == found.UserUid && msg.UserIdTo == self.currentUser.UserUid) || (msg.UserIdFrom == self.currentUser.UserUid && msg.UserIdTo == found.UserUid);
                });
            }
            else {
                self.filteredMessages = self.messages.filter(function (msg) {
                    return msg.UserIdTo == null;
                });
            }
        },
        isCurrentChat: function (id) {
            let self = this;
            if (self.isFullChatOpened) {
                return false;
            }
            let opened = self.openedMembers.filter(function (member) {
                return member.Id == id;
            })[0];
            return opened.isOpened;
        },
        closeChat: function (Id) {
            let self = this;
            self.openedMembers = self.openedMembers.filter(function (member) {
                return member.Id != Id;
            });
            self.isFullChatOpened = true;
        },
        getChatWidth: function () {
            let self = this;
            let width = self.pageWidth;
            console.log(width);
            return width + 'px';
        },
        findAuthor: function (message) {
            let self = this;
            if (!self.currentUser || self.members.length == 0 || !message) {
                return "";
            }
            let member = self.members.filter(function (member) { return member.UserUid == message.UserIdFrom; })[0];
            if (member.Id == self.currentUser.Id) {
                return self.switchLocal(20);
            }
            return self.getShortFio(member.fio);
        },
        getFontSize: function (initSize) {
            let self = this;
            let width = self.pageWidth;
            if (width > 1400) {
                return (initSize + 2) + 'px';
            }
            else if (width > 1100) {
                return initSize + 'px';
            }
            else if (width > 1000) {
                return initSize - 2 + 'px';
            }
            else if (width > 900) {
                return initSize - 4 + 'px';
            }
            else if (width > 500) {
                return initSize - 6 + 'px';
            }
        },
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Абитуриент ответил на вопросы:" : "Answered: ";
                case 2: return self.localization == 1 ? "Ваш балл за ответ:" : "Set for answer";
                case 4: return self.localization == 1 ? "Баллы, выставленные другими членами комиссии: " : "Other members: ";
                case 5: return self.localization == 1 ? "Итоги" : "Result";
                case 6: return self.localization == 1 ? "Не выставлено" : "Not set";
                case 7: return self.localization == 1 ? "Вопрос" : "Question";
                case 8: return self.localization == 1 ? "Средний балл за дисциплину: " : "Average score: ";
                case 9: return self.localization == 1 ? "Выставлено: " : "Set: ";
                case 10: return self.localization == 1 ? "Сохранить" : "Save";
                case 11: return self.localization == 1 ? "Проверка не доступна" : "Verification is not available";
                case 12: return self.localization == 1 ? "Абитуриент" : "Enrollee";
                case 13: return self.localization == 1 ? "вопроса" : "of question";
                case 14: return self.localization == 1 ? "Оценки членов комиссии" : "Committee's score";
                case 15: return self.localization == 1 ? "Итоговые баллы:" : "Result score";
                case 16: return self.localization == 1 ? "Общий чат" : "General chat";
                case 17: return self.localization == 1 ? "Отправить" : "Send";
                case 18: return self.localization == 1 ? "Открыть чат" : "Open chat";
                case 19: return self.localization == 1 ? "Время на ответ:" : "Spent time for answer:";
                case 20: return self.localization == 1 ? "Вы" : "You";
            }
        }
    },
    mounted: function () {
        this.init();
    }
});