const app = new Vue({
    el: "#main-window",
    data: {
        hasPlaceConfig: false,
        tests: [],
        testInProcess: false,
        user: '',
        packages: [],
        qwestions: [],
        answers: [],
        page: 0,
        PIN: undefined,
        selectedQwestion: {},
        timeStart: new Date(),
        timeLeft: 0
    },
    methods: {
        init: function () {
            let self = this;
            //Загрузка доступных тестов 
            var findTests = setInterval(function () {
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetTests?PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    success: function (d) {
                        if (d.Error) {
                            localStorage.removeItem('placeConfig');
                            clearInterval(findTests);
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
                        self.tests = d;
                        //Информация о человеке, проходящем тест
                        self.user = d[0].LastName + " " + d[0].FirstName + " " + d[0].MiddleName;
                        //Если назначен тест, то больше не загружать
                        if (d.length > 0) {
                            clearInterval(findTests);
                        }
                    }
                });
            }, 1000);
            if (localStorage['placeConfig']) {
                setInterval(findTests);
                this.hasPlaceConfig = true;
            }
            else {
                this.hasPlaceConfig = false;
                clearInterval(findTests);
            }
        },
        //Когда меняются значения, нужно сформировать нормально пакеты
        changeRadio: function (id) {
            let self = this;
            //Если радио, то выбранному ставим в true, остальные сбрасываем
            self.selectedQwestion.Answers.forEach(a => { a.IsAnswered = a.Id == id ? !a.IsAnswered : false; });
            //Ставим метку, что ответ менялся, чтобы не загружать по 100500 раз после каждого выбора вопроса
            self.selectedQwestion.changed = true;

            self.selectedQwestion.answered = true;
        },
        changeCheck: function () {
            //Такая же метка, как в radio, чтобы исключить повторную загрузку
            this.selectedQwestion.changed = true;
            let self = this;

            let flag = false;
            this.selectedQwestion.Answers.forEach(a => flag = a.IsAnswered || flag);
            self.selectedQwestion.answered = flag;
        },
        IsQwestionAnswered: function (id) {
            let self = this;
            let flag = false;
            self.qwestions.forEach(a => flag = (a.Rank === id && a.answered) || flag);
            return flag;
        },
        selectQwestion: function (id) {
            let self = this;
            //Если выбран несуществующий номер (кто-то нажал на назад на первом вопросе), то ничего не делать
            if (id == 0 || id == self.qwestions.length + 1) return;
            //Текущий вопрос для подсветки
            self.page = id;
            //Если вопрос выбран и менялся вариант ответа
            if (self.selectedQwestion.Id && self.selectedQwestion.changed) {
                let answers = [];
                //Запаковываем все ответы для предыдущего вопроса
                self.selectedQwestion.Answers.forEach(function (item) {
                    answers.push({ TestingPackageId: item.TestingPackage.Id, TestingTime: 3, UserAnswer: item.IsAnswered ? "1" : null });
                })
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/UpdateQwestionAnswer',
                    data: { answer: answers },
                    success: function () {
                        //Сбрасываем флаг изменения
                        self.selectedQwestion.changed = false;
                        //Для подсветки решённых заданий
                        self.selectedQwestion.answered = true;
                    }
                });
            }
            //Находим новый вопрос
            self.selectedQwestion = self.qwestions.find(a => a.Rank == id);
            //Если не загружали изображения, то загружаем
            if (!self.selectedQwestion.IsLoaded) {
                //Изображение вопроса
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetQwestionImage?Id=' + self.selectedQwestion.Id,
                    success: function (d) {
                        self.selectedQwestion.QwestionImage = d.QwestionImage;
                        //После загрузки ставим метку, что загружено
                        self.selectedQwestion.IsLoaded = true;
                    }
                });
                //Изображения ответов
                self.selectedQwestion.Answers.forEach(a => {
                    $.ajax({
                        type: 'POST',
                        dataType: 'json',
                        url: '/user/GetAnswerImage?Id=' + a.Id,
                        success: function (d) {
                            a.AnswerImage = d.AnswerImage;
                        }
                    });
                })
            }
        },
        //Запуск теста
        startTest: function (id) {
            let self = this;
            $.when($.ajax({
                url: "/user/StartTest?Id=" + id,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/user/GetTestQwestionsById?Id=" + id,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/user/GetTestAnswersById?Id=" + id,
                type: "POST",
                async: true
            })).then(function (resp1, resp2, resp3) {
                //Получаем пакеты вопросов, ответов и то, как их разместить
                self.qwestions = resp2[0];

                //Добавляем пару своих полей для удобной работы (флаг, что выбран один из вариантов ответа, и порядок)
                resp3[0].map(a => { a.IsAnswered = false; a.TestingPackage = resp1[0].Packages.find(b => b.AnswerId == a.Id) });
                self.answers = resp3[0];
                self.timeStart = new Date(resp1[0].Date);
                self.startTimer();
                //Маппим ответы для вопросов, добавляем флаги загрузки, изменения и ответа в принципе
                self.qwestions.map(a => { a.Answers = self.answers.filter(b => b.QwestionId == a.Id); a.IsLoaded = false; a.changed = false; a.answered = false; });
                console.log(self.qwestions);
                //Сортируем вопросы в нужном порядке
                self.qwestions.sort((a, b) => a.Rank - b.Rank);
                //Сортируем ответы
                self.qwestions.forEach(a => a.Answers.sort((b, c) => b.Sort - c.Sort));
                //Текущий вопрос выбираем первый
                self.selectQwestion(1);
                //Флаг, что началася тест
                self.testInProcess = true;

            });
        },
        startTimer: function () {
            let self = this;
            self.timeLeft = 1800;
            let interval = setInterval(function () {
                self.timeLeft--;

                //clearInterval(interval);
            }, 1000);
        },
        showTimeLeft: function () {
            let self = this;
            return Math.floor(self.timeLeft / 60) + ':' + self.isZeroNeed(self.timeLeft % 60);
        },
        isZeroNeed(value) {
            if (value < 10)
                return '0' + value;
            else return value;
        }
    },
    //После полной загрузки скрипта инициализируем
    mounted() {

        this.init();
    },
    watch: {
        PIN: function (val, oldval) {
            let self = this;
            if(self.PIN > 999)
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
        }
    }
});