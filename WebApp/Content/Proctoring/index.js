const app = new Vue({
    el: "#main-window",
    data: {
        HasCase: false,
        TestingProfileId: 0,
        questions: [],//testingResultId (2179), TestingPackageId, AnswerId, Id, TypeAnswerId, Sort, UserAnswer
        loadObject: {
            loading: null,
            loaded: null
        },
        page: 1,
        selectedQuestion: {},
        members: [],//Id, UserId, fio, UserRoleId, UserRoleName
        openedMembers: [],//Id, UserId, fio, UserRoleId, UserRoleName
        currentAnswerVote: 0,
        currentMarkVote: 0,
        shownSummary: false,
        currentMarkVoteDate: null,
        currentUser: {},
        maxScore: 0,
        socket: null,
        messageText: "",
        localization: 1,
        isChatOpened: true,
        isFullChatOpened: true,
        messages: [],
        currentMsgParent: null,
        filteredMessages: []
    },
    methods: {
        init: function () {
            let self = this;

            let str = window.location.href;
            let newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.TestingProfileId = newId;
            $.ajax({
                url: "/verification/IsAvailable?Id=" + newId,
                type: "POST",
                async: false,
                success: function (HasAccess) {
                    self.HasCase = HasAccess;
                    console.log(HasAccess);
                    if (HasAccess) {
                        self.initQuestions(newId);
                        self.GetMembers(newId);
                    }
                }
            });
            $.ajax({
                url: "/verification/GetCurrentUser?TestingProfileId=" + newId,
                type: "POST",
                async: false,
                success: function (user) {
                    self.currentUser = user;
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
                }
            });

            if (typeof (WebSocket) !== 'undefined') {
                self.socket = new WebSocket("wss://" + window.location.hostname + "/ProctorHandler.ashx");
            } else {
                self.socket = new MozWebSocket("wss://" + window.location.hostname + "/ProctorHandler.ashx");  
            }
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.socket = new WebSocket("ws://" + window.location.hostname + "/ProctorHandler.ashx");
            //} else {
            //    self.socket = new MozWebSocket("ws://" + window.location.hostname + "/ProctorHandler.ashx");
            //}
            if (self.socket) {
                self.socket.onopen = function () {
                    self.socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: self.TestingProfileId }));
                }
                self.socket.onmessage = function (msg) {
                    console.log(msg);
                    let message;
                    if (msg.data.indexOf("\0") != -1) {
                        message = JSON.parse(msg.data.substr(0, msg.data.indexOf("\0")));
                    }
                    else {
                        message = JSON.parse(msg.data);
                    }
                    switch (message.Id) {
                        case 1: {
                            console.log(message.Data);

                            let msg = JSON.parse(message.Data);
                            msg.Readed = true;
                           // console.log(msg.Date);
                            msg.Date = new Date(Number(msg.Date.substr(msg.Date.indexOf('(') + 1, msg.Date.indexOf(')') - msg.Date.indexOf('(') - 1)));
                            //msg.Date = new Date(msg.Date);
                            //console.log(msg.Date);
                            self.messages.push(msg);
                            break;
                        }
                        case 2: {
                            console.log(message.Data);
                            self.updateScoreAnswer(message.Data);
                            //message.Data; //Chat
                            break;
                        }
                        case 3: {
                            console.log(message.Data);
                            self.updateScoreExam(message.Data);
                            //message.Data; //Chat
                            break;
                        }
                    }
                };
                self.socket.onclose = function (event) {
                    console.log('close');
                }
            }
        },
        getDateFormat: function (date) {
            return date.toLocaleTimeString();
        },
        initQuestions: function (newId) {
            //GetInfoAboutVerification
            let self = this;

            $.ajax({
                url: "/verification/GetInfoAboutVerification?Id=" + newId,
                type: "POST",
                async: false,
                success: function (questions) {
                    console.log(questions);
                    questions.forEach(function (item) {
                        item.IsLoaded = false;
                        item.QuestionImage = null;
                        item.Answers = [{ UserAnswer: (item.UserAnswer && item.UserAnswer.trim() != "") ? item.UserAnswer : "Абитуриент не ответил" }];
                        item.Scores = [];
                        item.maxScore = 0;
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
            console.log(self.currentMsgParent);
            let obj = JSON.stringify({ Id: 1, TestingProfileId: self.TestingProfileId, Data: JSON.stringify({ Message: self.messageText, Date: new Date(), ParentId: self.currentMsgParent, UserIdTo: uid }) });
            self.socket.send(obj);
            self.messageText = "";
        },
        setParentMessage: function (id) {
            let self = this;
            self.currentMsgParent = id;
            console.log(id);
            let maxId = 0;
            self.filteredMessages.forEach(function (msg) {
                maxId = msg.Id > maxId ? msg.Id : maxId;
            });
            console.log(maxId);
            $('#message-' + maxId)[0].scrollIntoView();
            //scrollIntoView
        },
        resetParentMessage: function () {
            let self = this;
            self.currentMsgParent = null;
        },
        findParentMessage: function () {
            let self = this;
            let found = self.filteredMessages.filter(function (msg) {
                return msg.Id == self.currentMsgParent;
            })[0];
            console.log(found);
            return found.Message;
        },
        getUnreadMessagesCount: function (mId) {
            let self = this;
            let msgs = self.messages.filter(function (msg) {
                return msg.UserIdFrom == mId;
            })
            //console.log(msgs);
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
            console.log(self.selectedQuestion);
            self.currentAnswerVote = 0;
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
                        console.log(d);
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
                        console.log(d);
                        self.selectedQuestion.maxScore = d.MaxQuestionScore;
                        self.maxScore = d.MaxStructureDisciplineScore;
                    }
                });
                let counter = 0;
                //Изображения ответов
                if (self.selectedQuestion.TypeAnswerId && self.selectedQuestion.TypeAnswerId != 3) {
                    self.selectedQuestion.Answers.forEach(function (a) {
                        $.ajax({
                            type: 'POST',
                            dataType: 'json',
                            url: '/user/GetAnswerImage?Id=' + a.Id,
                            success: function (d) {
                                console.log(d);
                                a.AnswerImage = d.AnswerImage;
                                counter++;
                                if (counter == self.selectedQuestion.Answers.length) {
                                    self.loadObject.loading = false;
                                    self.loadObject.loaded = true;
                                }
                            }
                        });
                    });
                }
                else {
                    self.loadObject.loading = false;
                    self.loadObject.loaded = true;
                }
            }
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
                    console.log(d);
                    self.members = d;
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
                        console.log(question);
                        let scores = question.Scores.filter(function (score) {
                            return score.ExaminationBoardId == self.currentUser.Id;
                        })[0];
                        console.log(scores);
                        if (scores) {
                            counter--;
                        }
                    });
                    console.log(counter);
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
            console.log(Id);
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
            self.members.forEach(function (member) {
                score += self.getUserSummary(member.Id);
            });
            avg = score / self.members.length;
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
            console.log(question);
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
            console.log(self.currentUser);
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

            console.log(self.getUserSummary(self.currentUser.Id));


            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/verification/SaveInfoAboutTest',
                data: { Id: self.currentUser.Id, TestingProfileId: self.TestingProfileId, Score: self.getUserSummary(self.currentUser.Id) }
            });
        },
        IsUserMe: function (id) {
            let self = this;
            return id == self.currentUser.UserUid;
        },
        openChatInfo: function () {
            let self = this;
            self.isChatOpened = !self.isChatOpened;
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
            self.openedMembers.forEach(function (member) {
                member.isOpened = false;
            })
            if (Id == -1) {
                self.isFullChatOpened = true;
                self.filteredMessages = self.messages.filter(function (msg) {
                    return msg.UserIdTo == null;
                });
                console.log(self.filteredMessages, self.messages);
                return;
            }
            self.isFullChatOpened = false;
            let found = self.openedMembers.filter(function (member) {
                return member.Id == Id;
            })[0];
            found.isOpened = true;
            self.filteredMessages = self.messages.filter(function (msg) {
                return (msg.UserIdFrom == found.UserUid && msg.UserIdTo == self.currentUser.UserUid) || (msg.UserIdFrom == self.currentUser.UserUid && msg.UserIdTo == found.UserUid);
            });
            console.log(self.filteredMessages, self.messages);
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
            }
        }
    },
    mounted: function () {
        this.init();
    }
});