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
                        a.testingDate = new Date(a.testingDate);
                        a.testingBegin = new Date(a.testingBegin);
                        a.testingEnd = new Date(a.testingEnd);
                    });
                    self.people = data;
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
                }
            })
        },
        download: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 1, '_blank');
        },
        selectHuman: function (Id) {
            var self = this;
            $.ajax({
                url: "/api/statistic/getById?Id=" + Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.disciplines = data;
                    self.currentHuman.placeInfo = {};
                }
            })
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
        resetFilters: function() {
            console.log(1);
            let self = this;
            self.date = null;
            self.structureDisciplineId = null;
            self.testingStatusId = null;
            self.needTime = null;
            self.testingTime = null;
            self.lastName = null;
            self.firstName = null;
            self.auditoriumId = null;
        },
        resetTP: function (test) {
            var self = this;
            let item = self.people.find(a => a.ID == test.ID);
            self.objectLoading.loading = true;

            $.ajax({
                url: "/api/statistic/resetProfileTotal?Id=" + item.ID,
                type: 'post',
                success: function (data) {
                    item.testingStatusId = data.testingStatusId;
                    item.score = data.Score;
                    item.testingDate = new Date(data.testingDate);
                    item.testingBegin = new Date(data.testingBegin);
                    item.testingEnd = new Date(data.testingEnd);
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
                }
            })
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
                    item.testingStatusId = data.testingStatusId;
                    item.score = data.Score;
                    item.testingDate = new Date(data.testingDate);
                    item.testingBegin = new Date(data.testingBegin);
                    item.testingEnd = new Date(data.testingEnd);
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
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
                    item.testingStatusId = data.testingStatusId;
                    item.score = data.Score;
                    item.testingDate = new Date(data.testingDate);
                    item.testingBegin = new Date(data.testingBegin);
                    item.testingEnd = new Date(data.testingEnd);
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
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
                        self.people = self.people.filter(function (item1) { return item1.ID != item.ID });
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Сперва нужно сбросить' }]);
                    }
                    self.objectLoading.loading = false;
                    self.objectLoading.loaded = true;
                }
            })
        },
        openNewPlaceWindow: function () {
            $('#place-window').modal('show');
            this.getCurrentPlace();
            this.getAuditoriums();
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
                url: "/api/statistic/getAuditoryList",
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
