const app = new Vue({
    el: "#main-window",
    data: {
        people: [],
        currentHuman: { disciplines: [] },
        date: null,
        structureDisciplineId: null,
        testingStatusId: null,
        needTime: null,
        testingTime: null,
        lastName: null,
        firstName: null,
        auditoriumId: null,
        disciplines: [],
        filteredDisciplines: [],
        asc: null,
        disciplinePattern: null,
        auditories: [],
        statuses: [],
        objectLoading: {
            loading: false,
            loaded: false
        }
    },
    methods: {

        init: function () {
            let self = this;
            $('#form-1').on("submit", function () {
                event.preventDefault();
            });
            self.getStatuses();
            self.getAuditoriums();
            self.getDisciplines();
            setTimeout(function () {
                console.log($('#disc-auto')[0].offsetLeft);
                $('#discipline-select').css('left', $('#disc-auto')[0].offsetLeft + 'px');
                $('#discipline-select').css('top', $('#disc-auto')[0].offsetTop + 40 + 'px');
                $('#discipline-select').css('width', $('#disc-auto').width + 'px');
            }, 500)
        },
        find: function () {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/GetTestingProfiles",
                type: 'post',
                data: {
                    date: self.date,
                    structureDisciplineId: self.structureDisciplineId,
                    testingStatusId: self.testingStatusId,
                    needTime: self.needTime,
                    testingTime: self.testingTime,
                    lastName: self.lastName,
                    firstName: self.firstName,
                    auditoriumId: self.auditoriumId
                },
                success: function (data) {
                    data.map(a => {
                        a.testingDate = (new Date(a.testingDate)).toLocaleString();
                        a.testingBegin = a.testingBegin ? (new Date(a.testingBegin)).toLocaleTimeString() : "";
                        a.testingEnd = a.testingEnd ? (new Date(a.testingEnd)).toLocaleTimeString() : "";
                    });
                    self.people = data;
                    self.setSort();
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
                }
            })
        },
        download: function (test) {
            window.open('/auditory/DownloadReport?Id=' + test.ID + '&Type=' + 1, '_blank');
        },
        filterDisciplines() {
            let self = this;
            self.filteredDisciplines = self.disciplines.filter(a => {
                return a.Name.toLowerCase().indexOf(self.disciplinePattern) != -1;
            });

        },
        selectDiscipline(item) {
            let self = this;
            self.structureDisciplineId = item.Id;
            self.filteredDisciplines = [];
            self.disciplinePattern = item.Name;

        },
        getStatuses: function () {
            var self = this;
            $.ajax({
                url: "/api/auditory/GetStatuses",
                type: 'post',
                success: function (data) {
                    self.statuses = data;
                }
            })
        },
        getDisciplines: function () {
            var self = this;
            $.ajax({
                url: "/api/Administration/GetDisciplines",
                type: 'post',
                success: function (data) {
                    self.disciplines = data;
                    console.log(self.disciplines);
                }
            });
        },
        resetFilters: function () {
            let self = this;
            self.date = null;
            self.structureDisciplineId = null;
            self.testingStatusId = null;
            self.needTime = null;
            self.testingTime = null;
            self.lastName = null;
            self.firstName = null;
            self.auditoriumId = null;
            self.asc = null;
        },
        initItem: function (item, data) {
            item.testingStatusId = data.testingStatusId;
            item.score = data.Score;

            item.testingDate = (new Date(data.testingDate)).toLocaleString();
            item.testingBegin = data.testingBegin ? (new Date(data.testingBegin)).toLocaleTimeString() : "";
            item.testingEnd = data.testingEnd ? (new Date(data.testingEnd)).toLocaleTimeString() : "";
            return item;;
        },
        resetTP: function (test) {
            var self = this;
            let item = self.people.find(a => a.ID == test.ID);
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/administration/ResetStatus?Id=" + test.ID,
                type: 'post',
                success: function (data) {
                    if (data != 1) {
                        notifier([{ Type: 'error', Body: data }]);
                    }
                    self.find();
                }
            })
            //$.ajax({
            //    url: "/api/statistic/resetProfileTotal?Id=" + item.ID,
            //    type: 'post',
            //    success: function (data) {
            //        self.find();
            //    }
            //})
        },
        openMini(Id) {
            window.open('/statistic/minitotal?Id=' + Id), '_blank';
        },
        downloadCamera: function (Id, type) {
            window.open('/statistic/Download?Id=' + Id + '&Type=' + type, '_blank');
        },
        finishTP: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/finishProfileTotal?Id=" + item.ID,
                type: 'post',
                success: function (data) {
                    self.find();
                }
            })
        },
        nullify: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/nullifyProfileTotal?Id=" + item.ID,
                type: 'post',
                success: function (data) {
                    self.find();
                }
            })
        },
        deleteTP: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/deleteProfile?Id=" + item.ID,
                type: 'post',
                success: function (data) {
                    if (data == 1) {
                        self.find();
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Сперва нужно сбросить' }]);
                    }
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
                }
            })
        },
        getCurrentPlace: function () {
            var self = this;
            $.ajax({
                url: "/api/statistic/getCurrentPlace?Id=" + self.currentHuman.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.placeInfo = data;
                }
            })
        },
        getAuditoriums: function () {
            var self = this;
            $.ajax({
                url: "/api/administration/getAuditoryList",
                type: 'post',
                success: function (data) {
                    self.auditories = data;
                }
            })
        },
        getAuditoryInfo: function (Id) {
            var self = this;
            $.ajax({
                url: "/api/statistic/getAuditoryById?Id=" + Id,
                type: 'post',
                success: function (data) {
                    self.places = data;
                }
            })
        },
        sortByScore: function () {
            var self = this;
            self.asc = self.asc == null ? true : self.asc == true ? false : true;
            self.setSort();
        },
        findLongTerm: function () {
            var self = this;
            self.people = self.people.filter(a => {
                let splits = a.testingBegin.split(':');
                let currentSplits = [new Date().getHours(), new Date().getMinutes(), new Date().getSeconds()];
                return (currentSplits[0] - splits[0]) > 1;
            })
        },
        setSort() {
            let self = this;
            if (self.asc == true) {
                self.people.sort(function (a, b) {
                    return a.score - b.score
                });
            }
            else if (self.asc == false) {
                self.people.sort(function (a, b) {
                    return b.score - a.score
                });
            }
        },
        setPlaceToUser: function (Id) {
            var self = this;
            $.ajax({
                url: "/api/statistic/setPlacetouser",
                type: 'post',
                data: {
                    PlaceId: Id,
                    UserId: self.currentHuman.Id
                },
                success: function (data) {
                    self.currentHuman.placeInfo = data;
                },
                error: function () {
                    //notifier('');
                    notifier([{ Type: 'error', Body: 'Место занято' }]);
                }
            })
        }
    },
    mounted: function () {
        this.init();
    }
});
