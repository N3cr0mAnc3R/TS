const app = new Vue({
    el: "#main-window",
    data: {
        disciplines: [],
        items: [],
        listOpened: false,
        currentDiscipline: '',
        filteredItems: [],
        isFiltered: false
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
        toggleFilter: function () {
            var self = this;
            self.isFiltered = !self.isFiltered;
            if (self.isFiltered) {
                self.filteredItems = self.items.filter(function (item) { return item.Score == null || item.Score == 0 });
            }
            else {
                self.filteredItems = self.items;
            }
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
                    items.map(a => a.checked = false);
                    self.items = items;
                    self.filteredItems = items;

                }
            });
        },
        backToList: function () {
            this.listOpened = false;
        },
        getNormalJobName(q) {
            q = q % 10;
            if (q == 0 || q > 4) {
                return 'работ';
            }
            else if (q == 1) {
                return 'работа';
            }
            else {
                return 'работы';
            }
        },

        getNormalEmptyName(q) {
            q = q % 10;
            if (q == 1) {
                return 'пустая';
            }
            else {
                return 'пустых';
            }
        },
        saveMark: function (item) {
            let self = this;
            if (item.Score < 0 || item.Score > 100) {
                notifier([{ Type: 'error', Body: 'Некорректная оценка' }]);
                return;
            }
            $.ajax({
                type: 'POST',
                url: '/api/verification/SaveMark',
                async: true,
                data: {
                    TestingProfileId: item.Id,
                    Score: item.Score
                },
                success: function (items) {
                    self.toggleFilter();
                    self.toggleFilter();
                    notifier([{ Type: 'success', Body: 'Сохранено' }]);
                },
                error: function () {
                    notifier([{ Type: 'error', Body: 'Произошла ошибка. Обновите страницу' }]);
                }
            });
        },
        getZeroInfo: function () {
            return this.filteredItems.filter(function (item) { return item.Score == null || item.Score == 0 }).length;
        }
    },
    mounted: function () {
        this.init();
    }
})