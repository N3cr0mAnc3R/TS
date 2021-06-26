const app = new Vue({
    el: "#main-window",
    data: {
        tests: []
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/api/user/GetUserTests",
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
            }
        },
        isPossible: function (test) {
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday && test.TestingDate < new Date() && [1,5].indexOf(test.StatusId) != -1;
            return true;
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