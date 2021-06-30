const app = new Vue({
    el: "#main-window",
    data: {
        people: [],
        currentFIO: "",
        filteredPeople: [],
        currentHuman: { disciplines: [] },
        auditories: [],
        auditory: {},
        hasFullAccess: false,
        places: [],
        textForShow: null,
        objectLoading: {
            loading: false,
            loaded: false
        }
    },
    methods: {

        init: function () {
            $('#form-1').on("submit", function () {
                event.preventDefault();
            });
            setTimeout(function () {
                $('#fio').focus();
            }, 200)

            //$.ajax({
            //    url: "/api/statistic/findfio",
            //    type: 'post',
            //    data: { Fio: self.currentFIO },
            //    success: function (data) {
            //        if (data.length == 0) {
            //            self.textForShow = "Люди не найдены";
            //            self.filteredPeople = [];
            //        }
            //        else { self.textForShow = null; }
            //        if (data.length == 1) {
            //            self.selectHuman(data[0].Id);
            //        }
            //        self.filteredPeople = data;

            //        self.objectLoading.loading = false;
            //    }
            //})
        },
        findByFIO: function () {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/findfio",
                type: 'post',
                data: { Fio: self.currentFIO },
                success: function (data) {
                    if (data.length == 0) {
                        self.textForShow = "Люди не найдены";
                        self.filteredPeople = [];
                    }
                    else { self.textForShow = null; }
                    if (data.length == 1) {
                        self.selectHuman(data[0].Id);
                    }
                    self.filteredPeople = data;

                    self.objectLoading.loading = false;
                },
                error: function (error) {
                    notifier([{ Type: 'error', Body: error.responseJSON.ExceptionMessage}]);
                }
            })
        },
        download: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 1, '_blank');
        },
        initDisciplines(discs) {
            let self = this;
            discs.map(a => {
                a.TestingDate = new Date(a.TestingDate).toLocaleString();
                if (a.TestingBegin) {
                    a.TestingBegin = new Date(a.TestingBegin).toLocaleTimeString();
                }
                else {
                    a.TestingBegin = "Не приступал";

                }
                if (a.TestingEnd) {
                    a.TestingEnd = new Date(a.TestingEnd).toLocaleTimeString();
                }
                else {
                    a.TestingEnd = "Не завершил";

                }
            });
            return discs;
        },
        selectHuman: function (Id) {
            var self = this;
            $.ajax({
                url: "/api/statistic/getById?Id=" + Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.disciplines = self.initDisciplines(data);
                    self.currentHuman.placeInfo = {};
                }
            })
        },
        resetTP: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/statistic/resetProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.disciplines = self.initDisciplines(data);
                    self.objectLoading.loading = false;
                }
            })
        },

        downloadCamera: function (Id, type) {
            window.open('/statistic/Download?Id=' + Id + '&Type=' + type, '_blank');
        },
        finishTP: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/finishProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.disciplines = self.initDisciplines(data);
                }
            })
        },
        hasAccess: function (type) {
            var self = this;
            $.ajax({
                url: "/api/statistic/?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.disciplines = self.initDisciplines(data);
                }
            })
        },
        nullify: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/nullifyProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman.disciplines = self.initDisciplines(data);
                }
            })
        },
        deleteTP: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/deleteProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    if (data == 1) {
                        self.currentHuman.disciplines = self.currentHuman.disciplines.filter(function (item1) { return item1.Id != item.Id });
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Сперва нужно сбросить' }]);
                    }
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
