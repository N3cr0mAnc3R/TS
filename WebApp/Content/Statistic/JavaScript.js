const app = new Vue({
    el: "#main-window",
    data: {
        disciplines: [],
        items: [],
        listOpened: false,
        currentDiscipline: ''

    },
    methods: {
        init: function () {
            var self = this;
            $.ajax({
                type: 'POST',
                url: '/api/verification/GetDisciplines',
                async: true,
                success: function (disciplines) {
                    self.disciplines = disciplines;
                }
            });
        },
        selectDiscipline: function (Id) {
            var self = this;
            $.ajax({
                type: 'POST',
                url: '/api/verification/GetMarks?Id=' + Id,
                async: true,
                success: function (items) {
                    self.listOpened = true;
                    self.currentDiscipline = self.disciplines.filter(function (item) { return item.Id == Id })[0].Name;
                    self.items = items;
                }
            });
        },
        saveMark: function (item) {
            $.ajax({
                type: 'POST',
                url: '/api/verification/SaveMark',
                async: true,
                data: {
                    TestingProfileId: item.Id,
                    Score: item.Score
                },
                success: function (items) {
                    notifier([{ Type: 'success', Body: 'Сохранено' }]);
                },
                error: function () {
                    notifier([{ Type: 'success', Body: 'Произошла ошибка. Обновите страницу' }]);
                }
            });
        }
    },
    mounted: function () {
        this.init();
    }
})