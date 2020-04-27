const app = new Vue({
    el: "#main-window",
    data: {
        hasPlaceConfig: false,
        tests: null,
        activeTests: [],
        testInProcess: false,
        selectedTest: {},
        user: '',
        //packages: [],
        questions: [],
        answers: [],
        page: 0,
        interval: null,
        intervalConnection: null,
        intervalConnectionLost: null,
        findTestInterval: null,
        PIN: null,
        selectedQuestion: {},
        timeStart: new Date(),
        timeLeft: 0,
        IsTipOpened: false,
        tipPosition: {},
        loadObject: {
            loading: null,
            loaded: null
        },
        loadTestObject: {
            loading: null,
            loaded: null
        },
        canvas: {},
        pos: 0,
        img: {},
        buffer: {},
        recorded: [],
        mediaRecorder: {},
        pc1: {},
        offerOptions: {
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1
        },
        stream: null,
        lostConnection: false,
        pause: false
    },
    methods: {
        init: function () {
            let self = this;
            self.questions = [];
            self.testInProcess = false;
            self.answers = [];
            self.selectedQuestion = {};
            //Загрузка доступных тестов 
            self.findTestInterval = setInterval(function () {
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetTests?PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    success: function (d) {
                        if (d.Error) {
                            localStorage.removeItem('placeConfig');
                            clearInterval(self.findTestInterval);
                            self.hasPlaceConfig = false;
                            return;
                        }
                        if (d.length == 0) return;
                        //Отобразить дату в корректном формате
                        //d.forEach(a => {
                        //    var date = new Date(Number(a.TestingDate.substr(a.TestingDate.indexOf('(') + 1, a.TestingDate.indexOf(')') - a.TestingDate.indexOf('(') - 1)));
                        //    a.TestingDate = date.toLocaleString('Ru-ru');
                        //});
                        //Запись и отображение доступных тестов
                        if (!self.tests)
                            self.tests = d;
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
                    }
                });
            }, 1000);
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
            if (!self.stream) {
                navigator.getUserMedia(
                    { video: true, audio: true },
                    function (stream) {/*callback в случае удачи*/
                        self.stream = stream;
                        self.mediaRecorder = new MediaRecorder(stream);
                        self.mediaRecorder.ondataavailable = self.handleDataAvailable;
                        self.mediaRecorder.start(10);

                        self.pc1 = new RTCPeerConnection({
                            iceServers: [
                                { urls: "stun:23.21.150.121" },
                                { urls: "stun:stun.l.google.com:19302" },
                                { urls: "turn:numb.viagenie.ca", credential: "webrtcdemo", username: "louis%40mozilla.com" }
                            ]
                        });
                        stream.getTracks().forEach(track => self.pc1.addTrack(track, stream));
                        console.log(stream);
                        // const offer = self.pc1.createOffer(self.offerOptions);
                        self.pc1.createOffer(function (offer) {
                            self.pc1.setLocalDescription(offer, function () {
                                console.log(offer);
                                $.ajax({
                                    url: '/user/SaveOffer',
                                    type: 'POST',
                                    data: {
                                        Sdp: offer.sdp,
                                        Type: offer.type,
                                        Id: localStorage['placeConfig']
                                    },
                                    success: function () {
                                        self.pc1.onicecandidate = function (e) {
                                            // candidate exists in e.candidate
                                            if (!e.candidate) return;
                                            $.ajax({
                                                url: '/user/SaveIcecandidate',
                                                type: 'POST',
                                                data: {
                                                    Id: localStorage['placeConfig'],
                                                    Icecandidate: JSON.stringify(e.candidate)
                                                }
                                            });
                                        };
                                    }
                                })
                                // send the offer to a server to be forwarded to the friend you're calling.
                            }, function () {
                            });

                        }, function () { });
                        //self.getRemoteAnswer();

                        $('#video1')[0].srcObject = stream;
                    },
                    function () {/*callback в случае отказа*/ });
            }
            else {
                self.mediaRecorder.start(10);
            }
            if (localStorage['placeConfig']) {
                setInterval(self.findTestInterval);
                self.hasPlaceConfig = true;
            }
            else {
                self.hasPlaceConfig = false;
                clearInterval(self.findTestInterval);
                self.findTestInterval = null;
            }
        },
        handleDataAvailable: function (event) {

            if (event.data && event.data.size > 0) {
                app.recorded.push(event.data);
            }
            //console.log(event.data);
            //console.log(app.stream.id, app.stream.);
            //let formData = new FormData();
            //formData.append('Id', localStorage['placeConfig']);
            //formData.append('File', event.data);
            ////$.ajax({
            //    url: '/user/save',
            //    type: 'POST',
            //    contentType: false,//'application/octet-stream',
            //    data: formData,
            //    processData: false
            //});
        },
        getRemoteAnswer: function () {
            let self = this;
            $.ajax({
                url: '/user/GetAnswer?Id=' + localStorage['placeConfig'],
                type: 'POST',
                //data: {
                //    Id: localStorage['placeConfig']
                //},
                success: function (offer) {
                    console.log(self.pc1);
                    if (offer.Answer) {
                        self.pc1.setRemoteDescription(new RTCSessionDescription(JSON.parse(offer.Answer)), function () { }, function () { });
                        flag = false;
                    }
                    else {
                        self.getAnswer();
                    }
                }
                //  processData: false
            });
        },
        //Когда меняются значения, нужно сформировать нормально пакеты
        changeRadio: function (id) {
            let self = this;
            //Если радио, то выбранному ставим в true, остальные сбрасываем
            self.selectedQuestion.Answers.forEach(a => { a.IsAnswered = a.Id == id ? !a.IsAnswered : false; });
            //Ставим метку, что ответ менялся, чтобы не загружать по 100500 раз после каждого выбора вопроса
            self.selectedQuestion.changed = true;

            self.selectedQuestion.answered = true;
        },
        changeCheck: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQuestion.changed = true;
            let self = this;

            let flag = false;
            this.selectedQuestion.Answers.forEach(a => flag = a.IsAnswered || flag);
            self.selectedQuestion.answered = flag;
        },
        IsQuestionAnswered: function (id) {
            let self = this;
            let flag = false;
            self.questions.forEach(a => flag = (a.Rank === id && a.answered) || flag);
            return flag;
        },
        selectQuestion: function (id) {
            let self = this;
            //Если выбран несуществующий номер (кто-то нажал на назад на первом вопросе), то ничего не делать
            if (id == 0 || id == self.questions.length + 1) return;
            //Текущий вопрос для подсветки
            self.page = id;
            //Если вопрос выбран и менялся вариант ответа
            if (self.selectedQuestion.Id && self.selectedQuestion.changed) {
                self.answerQuestion();
            }
            //Находим новый вопрос
            self.selectedQuestion = self.questions.find(a => a.Rank == id);
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
                        self.selectedQuestion.QuestionImage = d.QuestionImage;
                        //После загрузки ставим метку, что загружено
                        self.selectedQuestion.IsLoaded = true;
                    }
                });
                let counter = 0;
                //Изображения ответов
                self.selectedQuestion.Answers.forEach(a => {
                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: '/user/GetAnswerImage?Id=' + a.Id,
                        success: function (d) {
                            a.AnswerImage = d.AnswerImage;
                            counter++;
                            if (counter == self.selectedQuestion.Answers.length) {
                                self.loadObject.loading = false;
                                self.loadObject.loaded = true;
                                self.loadTestObject.loading = false;
                                self.loadTestObject.loaded = true;
                            }
                        }
                    });
                })
            }
        },
        //Запуск теста
        startTest: function (id) {
            let self = this;
            // webcam.capture();
            self.loadTestObject.loading = true;
            self.loadTestObject.loaded = false;
            self.selectedTest = self.tests.find(a => a.Id == id);
            $.when($.ajax({
                url: "/user/StartTest?Id=" + id,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/user/GetTestquestionsById?Id=" + id,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/user/GetTestAnswersById?Id=" + id,
                type: "POST",
                async: true
            })).then(function (resp1, resp2, resp3) {
                //Получаем пакеты вопросов, ответов и то, как их разместить
                self.questions = resp2[0];

                //Добавляем пару своих полей для удобной работы (флаг, что выбран один из вариантов ответа, и порядок)
                resp3[0].map(a => { a.IsAnswered = false; a.TestingPackage = resp1[0].Packages.find(b => b.AnswerId == a.Id) });
                self.answers = resp3[0];
                self.timeStart = new Date(resp1[0].Date);
                self.startTimer();
                //Маппим ответы для вопросов, добавляем флаги загрузки, изменения и ответа в принципе
                self.questions.map(a => { a.Answers = self.answers.filter(b => b.QuestionId == a.Id); a.IsLoaded = false; a.changed = false; a.answered = false; });
                //Сортируем вопросы в нужном порядке
                self.questions.sort((a, b) => a.Rank - b.Rank);
                //Сортируем ответы
                self.questions.forEach(a => a.Answers.sort((b, c) => b.Sort - c.Sort));
                //Текущий вопрос выбираем первый
                self.selectQuestion(1);
                //Флаг, что началася тест
                self.testInProcess = true;
                self.startCheckConnection(id);
            });
        },
        getHeight: function (Id) {
            let height = $('#answer-' + Id).height();
            if (height > 30 && height < 70) {
                return 'double';
            }
            else if (height > 70) {
                return 'triple';
            }
        },
        answerQuestion() {
            let self = this;
            let answers = [];
            //Запаковываем все ответы для предыдущего вопроса
            self.selectedQuestion.Answers.forEach(function (item) {
                answers.push({ TestingPackageId: item.TestingPackage.Id, TestingTime: 3, UserAnswer: item.IsAnswered ? "1" : null });
            })
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/user/UpdatequestionAnswer',
                data: { answer: answers },
                success: function () {
                    //Сбрасываем флаг изменения
                    self.selectedQuestion.changed = false;
                    //Для подсветки решённых заданий
                    self.selectedQuestion.answered = true;
                }
            });
        },
        startCheckConnection: function (id) {
            let self = this;
            self.intervalConnection = setInterval(
                function () {
                    $.ajax({
                        url: "/user/HasConnection",
                        type: "POST",
                        data: {
                            TestingProfileId: id,
                            NeedDispose: false
                        },
                        success: function (data) {
                            if (data !== 1) {
                                self.pause = true;
                                if (!self.intervalConnectionLost) {
                                    self.intervalConnectionLost = setTimeout(function () {
                                        clearTimeout(self.intervalConnectionLost);
                                        self.lostConnection = true;
                                    }, 30000);
                                }
                            }
                            else {
                                if (self.intervalConnectionLost) {
                                    clearTimeout(self.intervalConnectionLost);
                                    self.lostConnection = false;
                                    self.pause = false;
                                }
                            }
                        },
                        error: function () {
                            self.pause = true;
                            if (!self.intervalConnectionLost) {
                                self.intervalConnectionLost = setTimeout(function () {
                                    clearTimeout(self.intervalConnectionLost);
                                    self.lostConnection = true;
                                }, 30000);
                            }
                        },
                        async: true
                    });
                }, 5000);
        },
        startTimer: function () {
            let self = this;
            self.timeLeft = 1800;
            self.interval = setInterval(function () {
                self.timeLeft--;
                if (self.timeLeft == 0) {
                    clearInterval(self.interval);
                    self.finishTest();
                }
            }, 1000);
        },
        finishTest: function () {
            let self = this;
            clearInterval(self.interval);
            self.answerQuestion();
            if (self.mediaRecorder) self.mediaRecorder.stop();
            //let obj = $('#video2')[0];
            self.buffer = new Blob(self.recorded, { type: 'video/webm' });
            let src = URL.createObjectURL(self.buffer);
            let formaData = new FormData();

            var a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = src;
            a.download = 'test.webm';
            console.log(self.buffer);
            a.click();
            console.log(src, self.buffer);
            formaData.append('Id', self.selectedTest.Id);
           // let file = self.buffer;
            let file = new File([self.buffer], "name");
            const reader = new FileReader();
            reader.readAsDataURL(file);
            formaData.append('File', self.buffer);
            setTimeout(function () {
               // reader.onload = function () {
                    formaData.append('baseFile', reader.result);
                    console.log(self.selectedTest.Id, file, reader.result);
                    $.ajax({
                        url: "/user/SaveVideoFile",
                        type: "POST",
                        data: formaData,
                        contentType: false,
                        processData: false
                    });
               // }
            }, 5000)
            

            // obj.src = src;
            //obj.srcObject = self.buffer;
            //location.reload();
            console.log(self.selectedTest);
            $.ajax({
                url: "/user/HasConnection",
                type: "POST",
                data: {
                    TestingProfileId: self.selectedTest.Id,
                    NeedDispose: true
                }
            });
            clearTimeout(self.intervalConnectionLost);
            clearTimeout(self.intervalConnection);
            self.init();
        },
        download: function () {
            $.ajax({
                url: "GetFileBase?Id=67",
                type: "POST",
                success: function (data) {
                    const downloadLink = document.createElement('a');
                    document.body.appendChild(downloadLink);

                    downloadLink.href = data;
                    downloadLink.target = '_self';
                    downloadLink.download = "na.webm";
                    downloadLink.click(); 
                }
            });
        },
        showCountLeft: function () {
            let self = this;
            let count = self.questions.length;

            self.questions.forEach(a => count = a.answered ? (count - 1) : count);
            if (count > 0) {
                let str = count + ' ';
                let procent = count % 10;
                if (procent == 1) { str += 'вопрос'; }
                else if (procent < 4 && procent > 1) { str += 'вопроса'; }
                else { str += 'вопросов'; }
                return str;
            }
            else {
                return null;
            }
        },
        showTimeLeft: function () {
            let self = this;
            return Math.floor(self.timeLeft / 60) + ':' + self.isZeroNeed(self.timeLeft % 60);
        },
        isZeroNeed(value) {
            if (value < 10)
                return '0' + value;
            else return value;
        },
        hasActiveTest: function () {
            let self = this;
            if (!self.tests) return false;
            self.activeTests = self.tests.filter(a => a.TestingStatusId === 2);
            return self.tests.find(a => a.TestingStatusId === 2);
        },
        resumeTest: function (id) {
            let self = this;
            self.selectedTest = self.tests.find(a => a.Id == id);
            $.when($.ajax({
                url: "/user/GetAnswersForActiveTest?Id=" + id,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/user/GetTestquestionsById?Id=" + id,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/user/GetTestAnswersById?Id=" + id,
                type: "POST",
                async: true
            })).then(function (resp1, resp2, resp3) {
                //Получаем пакеты вопросов, ответов и то, как их разместить
                self.questions = resp2[0];
                //Добавляем пару своих полей для удобной работы (флаг, что выбран один из вариантов ответа, и порядок)
                resp3[0].map(a => { a.IsAnswered = false; a.TestingPackage = resp1[0].Packages.find(b => b.AnswerId == a.Id) });
                self.answers = resp3[0];
                self.timeStart = new Date(resp1[0].Date);
                self.startTimer();
                console.log(resp1[0].Answered);
                self.questions.forEach(a => {
                    resp1[0].Answered.forEach(b => {
                        if (a.Id == b.Id) {
                            a.answered = true;
                            if (a.TypeAnswerId == 1) {
                                if (b.UserAnswer) {
                                    a.answer = b.AnswerId;
                                }
                            }
                            if (a.TypeAnswerId == 2) {
                                if (b.UserAnswer) {
                                    self.answers.find(c => c.Id == b.AnswerId).IsAnswered = true;
                                }
                            }
                        }
                    })
                })
                //Маппим ответы для вопросов, добавляем флаги загрузки, изменения и ответа в принципе
                self.questions.map(a => { a.Answers = self.answers.filter(b => b.QuestionId == a.Id); a.IsLoaded = false; a.changed = false; a.answered = a.answered ? a.answered : false; });
                //Сортируем вопросы в нужном порядке
                self.questions.sort((a, b) => a.Rank - b.Rank);
                //Сортируем ответы
                self.questions.forEach(a => a.Answers.sort((b, c) => b.Sort - c.Sort));
                //Текущий вопрос выбираем первый
                self.selectQuestion(1);
                //Флаг, что началася тест
                self.testInProcess = true;

                self.startCheckConnection(id);
            });
        },
        openTip: function () {
            let self = this;
            //self.tipPosition.width = $('#panel-right').width();
            //$('#panel-right').css('right', 0 - self.tipPosition.width);
            if (this.IsTipOpened) {
                $('#panel-right').css('right', 0 - self.tipPosition.width);
            }
            else {
                $('#panel-right').css('right', '');

            }
            this.IsTipOpened = !this.IsTipOpened;
        },
        startResize: function () {
            let self = this;
            console.log('start');
            $(document).on('mousemove', function () { self.resizing(self); });
            self.tipPosition.width = $('#panel-right').width();
            self.tipPosition.start = $(document).width();// - $('#panel-right').width();
            console.log(self.tipPosition);
        },
        resizing: function (self) {
            console.log('move');
            $(document).on('mouseup', function () { self.stopResizing(self); });
            console.log(event.pageX);
            $('#panel-right').width(self.tipPosition.start - event.pageX);
        },
        stopResizing: function (self) {
            console.log('stop');
            self.tipPosition.width = $('#panel-right').width();
            $(document).off('mousemove');
            $(document).off('mouseup');
        }
    },
    //После полной загрузки скрипта инициализируем
    mounted() {
        //$('#video-wrapper').draggable();
        this.init();
        $(window).on('focus')
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
                        let str = CryptoJS.AES.encrypt("place-" + data.Id, "Secret Passphrase");
                        console.log(data);
                        localStorage['placeConfig'] = str.toString();
                        let obj = { Id: data.PlaceProfileId, PlaceConfig: str.toString(), PlaceId: data.Id };
                        console.log(obj);
                        $.ajax({
                            url: "/auditory/UpdatePlaceConfig",
                            type: "POST",
                            async: false,
                            data: { model: obj },
                            success: function () {
                                location.reload();
                            }
                        });
                    }
                })
        }//,
        //stopTheTime
    }
});