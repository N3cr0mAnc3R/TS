const app = new Vue({
    el: "#main-window",
    data: {
        people: [],
        currentFIO: "",
        filteredPeople: [],
        currentHuman: { disciplines: [] },
        auditories: [],
        auditory: {},
        userAnswerLog: [],
        hasFullAccess: null,
        currentTest: {},
        places: [],
        textForShow: null,
        objectLoading: {
            loading: false,
            loaded: false
        },
        modalLoading: {
            loading: false,
            loaded: false
        },

    },
    methods: {

        init: function () {
            let self = this;
            $('#form-1').on("submit", function () {
                event.preventDefault();
            });
            setTimeout(function () {
                $('#fio').focus();
            }, 200)

            $.ajax({
                url: '/api/administration/HasFullAccess',
                method: 'post',
                async: true,
                success: function (data) {
                    self.hasFullAccess = data;

                }
            })
            this.getAuditoriums();
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
                        self.selectHuman(data[0]);
                    }
                    self.filteredPeople = data;

                    self.objectLoading.loading = false;
                },
                error: function (error) {
                    notifier([{ Type: 'error', Body: error.responseJSON.ExceptionMessage }]);
                }
            })
        },
        download: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 1, '_blank');
        },
        initDisciplines(discs) {
            let self = this;
            discs.map(a => {
                a.TestingDate = new Date(a.TestingDate);
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
                    if (a.StatusId == 2) {
                        a.TestingEnd = "Не завершил";
                    }
                    else {
                        a.TestingEnd = null;
                    }

                }
            });
            return discs;
        },
        isToday: function (test) {
            let isToday = test.TestingDate.getDate() == new Date().getDate() && test.TestingDate.getMonth() == new Date().getMonth() && test.TestingDate.getFullYear() == new Date().getFullYear();
            return isToday;
        },
        selectHuman: function (human) {
            var self = this;
            $.ajax({
                url: "/api/statistic/getById?Id=" + human.Id,
                type: 'post',
                success: function (data) {
                    self.currentHuman = {};
                    self.currentHuman = human;
                    self.currentHuman.disciplines = [];
                    self.currentHuman.disciplines = self.initDisciplines(data);

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
                    //console.log(self.currentHuman.disciplines);
                    //console.log(data);
                    //self.currentHuman.disciplines = self.initDisciplines(data);

                    self.selectHuman(self.currentHuman);
                    self.objectLoading.loading = false;
                }
            })
        },
        openUserAnswerLogMWindow: function (item) {
            let self = this;
            self.modalLoading.loading = true;
            self.modalLoading.loaded = false;
            //console.log(item);
            $('#user-answer-log-window').modal('show');

            $.ajax({
                url: "/api/Administration/GetUserAnswerLog?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.userAnswerLog = data;
                    self.modalLoading.loading = false;
                    self.modalLoading.loaded = true;
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
                    //self.currentHuman.disciplines = self.initDisciplines(data);

                    self.selectHuman(self.currentHuman);
                }
            })
        },
        nullify: function (item) {
            var self = this;
            $.ajax({
                url: "/api/statistic/nullifyProfile?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    //self.currentHuman.disciplines = self.initDisciplines(data);

                    self.selectHuman(self.currentHuman);
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
        openNewPlaceWindow: function (disc) {
            $('#place-window').modal('show');
            this.currentTest = disc;
            //console.log(this.currentTest.PlaceId);
            //this.getCurrentPlace();
        },
        unload: function (item) {
            var self = this;
            $.ajax({
                url: "/api/auditory/UpdateStatus?Id=" + item.Id + '&StatusId=4',
                type: "POST",
                async: true,
                success: function (newStatus) {
                    if (newStatus.Error) {
                        notifier([{ Type: 'error', Body: newStatus.Error }]);
                    }
                    else
                        notifier([{ Type: 'success', Body: "Результат успешно выгружен" }]);

                    self.selectHuman(self.currentHuman);
                }
            });
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
        getAuditoryInfo: function (aud) {
            var self = this;
            $.ajax({
                url: "/api/administration/getAuditoryById?Id=" + aud.Id,
                type: 'post',
                success: function (data) {
                    self.places = data;
                    self.auditory = aud;
                }
            })
        },
        closeModal() {
            let self = this;
            $('#place-window').modal('hide');
            self.currentTest = {};
            self.auditory = {};
            self.places = [];
        },
        setPlaceToUser: function (Id) {
            var self = this;
            if (self.places.find(a => a.Id == Id).IsUsed) {
                notifier([{ Type: 'error', Body: 'Место занято' }]);
                return;
            }
            $.ajax({
                url: "/api/statistic/setPlacetouser",
                type: 'post',
                data: {
                    PlaceId: Id,
                    TestingProfileId: self.currentTest.Id,
                    UserId: self.currentHuman.Id
                },
                success: function () {
                    notifier([{ Type: 'success', Body: 'Место обновлено' }]);
                    self.selectHuman(self.currentHuman);
                    self.closeModal();
                },
                error: function () {
                    //notifier('');
                    notifier([{ Type: 'error', Body: 'Место занято' }]);
                    self.closeModal();
                }
            })
        }
    },
    mounted: function () {
        this.init();
    }
});
