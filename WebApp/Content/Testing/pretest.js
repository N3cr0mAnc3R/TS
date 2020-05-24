const app = new Vue({
    el: "#main-window",
    data: {
        hasPlaceConfig: false,
        tests: null,
        activeTests: [],
        user: '',
        //packages: [],
        interval: null,
        findTestInterval: null,
        PIN: null,
        loadObject: {
            loading: null,
            loaded: null
        },
        loadTestObject: {
            loading: null,
            loaded: null
        },
        localization: 1,
        socket: null
    },
    methods: {
        init: function () {
            let self = this;
            //Загрузка доступных тестов 
            self.findTestInterval = setInterval(function () {
                console.log('start');
                $.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: '/user/GetTests?PlaceConfig=' + encodeURIComponent(localStorage['placeConfig']),
                    success: function (d) {
                        console.log(d);
                        if (d.Error) {
                            localStorage.removeItem('placeConfig');
                            clearInterval(self.findTestInterval);
                            self.hasPlaceConfig = false;
                            return;
                        }
                        if (d.length == 0) {
                            return;
                        }
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
                    },
                    error: function (e) {
                        console.log(e);

                    }
                });
            }, 1000);
            console.log('endinit');
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
        checkAuth: function (placeId, PlaceProfile) {
            console.log(localStorage['placeConfig']);
            if (localStorage['placeConfig']) {
                console.log();
            } else {
                this.createPlaceConfig(placeId, PlaceProfile);
            }
        },
        //Запуск теста
        startTest: function (id) {
            let self = this;
            //// webcam.capture();
            //self.loadTestObject.loading = true;
            //self.loadTestObject.loaded = false;
            // self.selectedTest = self.tests.find(a => a.Id == id);

            window.open("/user/process?Id=" + id, '_self');

        },
        hasActiveTest: function () {
            let self = this;
            if (!self.tests) return false;
            self.activeTests = self.tests.filter(function (a) { return a.TestingStatusId === 2; });
            return self.tests.filter(function (a) { return a.TestingStatusId === 2; })[0];
        },
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Вам доступны следующие тесты для прохождения" : "The following tests are available";
                case 2: return self.localization == 1 ? "Вы не завершили следующие тесты" : "Not completed:";
            }
        },
        createPlaceConfig: function (placeId, PlaceProfile) {
            if (placeId == 0 || PlaceProfile == 0) return;
            let str = CryptoJS.AES.encrypt("place-" + placeId, "Secret Passphrase");
            localStorage['placeConfig'] = str.toString();
            let obj = { Id: PlaceProfile, PlaceConfig: str.toString(), PlaceId: placeId };
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
    },
    //После полной загрузки скрипта инициализируем
    mounted: function () {
        //$('#video-wrapper').draggable();
        this.init();
        $(window).on('focus');
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
                        self.createPlaceConfig(data.Id, data.PlaceProfileId);
                    }
                })
        }//,
        //stopTheTime
    }
});