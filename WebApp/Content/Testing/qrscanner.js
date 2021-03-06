const app = new Vue({
    el: "#main-window",
    data: {
        camQrResult: '',
        video: '',
        scanner: {},
        bestResult: {},
        fileId: '',
        flag: false,
        answerImage: null,
        loadObject: {
            loading: null,
            loaded: null
        },
        socket: null,
        streamSocket: null,
        testingProfileId: 0,
        isSuperAdmin: false,
        error: {},
        //testingProfileId: 0,
        testingPackageId: 0
    },
    methods: {
        init: function () {
            var self = this;
            self.camQrResult = $('#cam-qr-result')[0];
            self.video = $('#qr-video')[0];
            self.scanner = new QrScanner(self.video, function (result) { self.setResult(self.camQrResult, result); }, error => {
                self.camQrResult.innerText = error;
                //  alert('err' + error);
                self.camQrResult.style.color = 'inherit';
            });
            var str = window.location.href;
            var newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.testingProfileId = newId;

            self.streamSocket = $.connection.StreamHub;
            $.connection.hub.url = "../signalr";

            self.streamSocket.client.onMessageGet = function (Id, TestingProfileId, message, date, admin) {

            }

            $.connection.hub.start().done(function () {
                self.streamSocket.server.requestLoadFile(self.testingProfileId);
            }).fail(function (exc) {
                console.error(exc);
            });
            //if (typeof (WebSocket) !== 'undefined') {
            //    self.socket = new WebSocket("wss://de.ncfu.ru/StreamHandler.ashx");
            //} else {
            //    self.socket = new MozWebSocket("wss://de.ncfu.ru/StreamHandler.ashx");
            //}
            //self.socket.onopen = function () {
            //    self.socket.send(JSON.stringify({ ForCreate: true, TestingProfileId: newId }));
            //    self.socket.send(JSON.stringify({ TestingProfileId: newId, IsSender: false, requestLoadFile: true }));
            //};

            self.camQrResult.parentNode.insertBefore(self.scanner.$canvas, self.camQrResult.nextSibling);
            self.scanner.$canvas.style.display = 'block';

            $.ajax({
                url: "/api/account/IsPaul",
                type: "POST",
                async: true,
                success: function (domain) {
                    self.isSuperAdmin = domain;
                }
            });
        },
        start: function () {
            try {
                console.log(this);
                this.scanner.start();
                //QrScanner.hasCamera().then(function (res) {
                //    alert(res);
                //});
            }
            catch (exc) {
                alert(exc);
            }
        },
        stop: function () {
            this.QrScanner.stop();
        },
        changeFile1: function (e) {
            var self = this;
            var extension = e.target.files[0].name.substr(e.target.files[0].name.lastIndexOf('.'));
            var formaData = new FormData();
            formaData.append('Id', self.testingPackageId);
            formaData.append('File', e.target.files[0]);
            formaData.append('AnswerFileExtension', extension);

            $.ajax({
                type: 'POST',
                url: '/user/SaveAnswerFile',
                data: formaData,
                contentType: false,
                processData: false,
                success: function (data) {
                    var answers = [];
                    answers.push({ TestingPackageId: self.testingPackageId, TestingTime: 3, UserAnswer: null, FileId: data });
                    $.ajax({
                        type: 'POST',
                        url: '/api/user/UpdatequestionAnswer',
                        async: false,
                        data: { answers: answers },
                        success: function () {
                        }
                    });
                    $.ajax({
                        type: 'POST',
                        url: '/api/user/UpdatequestionAnswer1',
                        async: false,
                        data: { answers: answers },
                        success: function () {
                        }
                    });
                }
            });

        },
        changeFile: function (e) {
            var self = this;
            self.loadObject.loading = true;
            self.loadObject.loaded = false;
            var extension = e.target.files[0].name.substr(e.target.files[0].name.lastIndexOf('.'));
            let formaData = new FormData();
            formaData.append('Id', self.bestResult.TestingPackageId);
            formaData.append('File', e.target.files[0]);
            formaData.append('AnswerFileExtension', extension);
            $.ajax({
                type: 'POST',
                url: '/user/SaveAnswerFile',
                data: formaData,
                contentType: false,
                processData: false,
                success: function (data) {
                    self.loadObject.loading = false;
                    self.loadObject.loaded = true;
                    self.fileId = data;
                    var reader = new FileReader();
                    reader.onload = function () {
                        self.answerImage = reader.result.substr(reader.result.indexOf(',') + 1);
                    };
                    reader.readAsDataURL(e.target.files[0]);
                    self.answerQuestion(data);
                },
                error: function (er) {
                    self.error = er;
                }
            });
            //self.AnswerFileExtension = ;
        },
        answerQuestion: function (data) {
            var self = this;
            //ToDo безтттопастттттттность!!
            var answers = [{ TestingPackageId: self.bestResult.TestingPackageId, TestingTime: 3, UserAnswer: null, FileId: self.fileId }];

            $.ajax({
                type: 'POST',
                url: '/api/user/UpdateQuestionAnswer',
                //url: 'https://de.ncfu.ru/api/user/UpdateQuestionAnswer',
                async: true,
                data: { answers: answers },
                success: function () {
                    self.streamSocket.server.gotUserAnswer(self.testingProfileId, data);
                    //self.socket.send(JSON.stringify({ TestingProfileId: self.testingProfileId, IsSender: false, gotUserAnswer: true, Id: data }));
                },
                error: function (er) {
                    //self.socket.send(JSON.stringify({ TestingProfileId: self.testingProfileId, IsSender: false, gotUserAnswer: true, Id: data }));
                }
            });
        },
        setResult: function (label, result) {
            var self = this;
            //alert('suc' + result);
            //label.innerText = result;
            //label.style.color = 'teal';
            //  clearTimeout(label.highlightTimeout);
            label.highlightTimeout = setTimeout(() => label.style.color = 'inherit', 100);
            self.bestResult = JSON.parse(result);
            self.flag = true;
        }
    },
    mounted: function () {
        this.init();
    }
})