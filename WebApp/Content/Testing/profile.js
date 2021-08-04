const app = new Vue({
    el: "#main-window",
    data: {
        tests: []
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/api/user/GetUserTests?Localization=" + (localStorage["localization"] == 1? 'Ru' : 'En'),
                method: "get",
                success: function (data) {
                    self.tests = data;
                    self.tests.map(a => a.TestingDate = new Date(a.TestingDate))
                }
            })
        },
        switchLocal: function (id) {
            var self = this;
            switch (id) {
                case 1: return localStorage["localization"] == 1 ? "Тесты не назначены" : "There are no tests for You";
                case 2: return localStorage["localization"] == 1 ? "Предмет" : "Discipline";
                case 3: return localStorage["localization"] == 1 ? "Дата проведения" : "Date of the test";
                case 4: return localStorage["localization"] == 1 ? "Набранный балл" : "Score";
                case 5: return localStorage["localization"] == 1 ? "Статус" : "State";
                case 6: return localStorage["localization"] == 1 ? "Здесь отображены даты и результаты проведения вступительных испытаний СКФУ" : "Here You may watch results of the tests";
                case 7: return localStorage["localization"] == 1 ? "Тёмным выделены вступительные испытания, которые необходимо пройти сегодня" : "Dark cells inform about today tests";
                case 8: return localStorage["localization"] == 1 ? "Красным выделены вступительные испытания, по которым не был набран минимальный проходной балл" : "Red cells inform about failed tests";
                case 9: return localStorage["localization"] == 1 ? "Результаты будут отображены в личном кабинете портала eCampus и на данной странице на следующий день после проведения ВИ" : "Results will be shown in portal eCampus and in here the very next day after complete";
                case 10: return localStorage["localization"] == 1 ? "В случае возникновения вопросов по поводу проведения ВИ следует обращаться в техническую поддержку по телефону, указанному внизу страницы" : "For any questions call the Support phone at page below";
                case 11: return localStorage["localization"] == 1 ? "Перейти к ВИ" : "Go to tests";
            }
        },
        isPossible: function (test) {
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday && test.TestingDate < new Date() && [1,5].indexOf(test.StatusId) != -1;
            return true;
        },
        isToday: function (test) {
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday;
        },
        getDateFormat: function (date) {
            var t = new Date();
            return date.toLocaleString();
        }
    },
    //После полной загрузки скрипта инициализируем
    mounted: function () {
        this.init();

    }

});