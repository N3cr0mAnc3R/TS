const app = new Vue({
    el: "#main-window",
    data: {
        people: [],
        currentFIO: "",
        filteredPeople: [],
        currentHuman: { disciplines: [] },
        auditories: [],
        auditory: {},
        currentPhoto: null,
        userAnswerLog: [],
        hasFullAccess: null,
        currentTest: {},
        places: [],
        disciplines: [],
        newDate: null,
        textForShow: null,
        assignedModel: {
            DisciplineId: null,
            UserId: null,
            Date: new Date(),
            PlaceId: null
        },
        objectLoading: {
            loading: false,
            loaded: false
        },
        modalLoading: {
            loading: false,
            loaded: false
        },
        answerRequest: null
    },
    methods: {

        init: function () {
            let self = this;
            $('#form-1').on("submit", function () {
                event.preventDefault();
            });

            $.ajax({
                url: '/api/administration/HasFullAccess',
                method: 'post',
                async: true,
                success: function (data) {
                    self.hasFullAccess = data;

                }
            })
            this.getAuditoriums();

            let foreignQuery = location.href.split('=');
            if (foreignQuery.length > 1) {
                self.selectHuman({});
                return;
            }

            setTimeout(function () {
                $('#fio').focus();
            }, 200)

        },
        findByFIO: function () {
            var self = this;
            self.objectLoading.loading = true;
            self.currentFIO = self.currentFIO.trim()
            $.ajax({
                url: "/api/statistic/findfio",
                type: 'post',
                data: { Fio: self.currentFIO },
                success: function (data) {
                    if (data.length == 0) {
                        self.textForShow = "Люди не найдены";
                        self.filteredPeople = [];
                        self.currentHuman = {};
                        self.currentHuman.disciplines = [];
                    }
                    else { self.textForShow = null; }
                    if (data.length == 1) {
                        self.selectHuman(data[0]);
                    }
                    else {
                        document.title = "Результаты поиска по " + self.currentFIO;
                    }
                    self.filteredPeople = data;

                    self.objectLoading.loading = false;
                },
                error: function (error) {
                    notifier([{ Type: 'error', Body: error.responseJSON.ExceptionMessage }]);
                }
            })
        },
        goToTop() {
            $('#navigation')[0].scrollIntoView();
        },
        download: function (item) {
            let self = this;
            self.download1(item, 1);
            if (item.IsArt) {
                self.download1(item, 3);
                self.download1(item, 4);
            }
        },
        download1: function (item, Id) {
            window.open('/auditory/DownloadReport?Id=' + item.Id + '&Type=' + Id, '_blank');
        },
        openFullPhoto(human) {
            $('#user-photo-window').modal('show');
            event.stopPropagation();
            this.currentPhoto = human.picture;
        },
        closePhoto() {
            this.currentPhoto = null;
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
                    document.title = self.currentHuman.Name;

                    notifier([{ Type: 'success', Body: 'Загружено' }]);
                }
            })
        },
        getHumanInfo(id) {
            $.ajax({
                url: "/api/statistic/getById?Id=" + id,
                type: 'post',
                success: function (data) {

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
        DoubleNullified: function (item) {
            var self = this;
            self.objectLoading.loading = true;
            $.ajax({
                url: "/api/Administration/DoubleNullified?Id=" + item.Id,
                type: 'post',
                success: function (data) {

                    self.selectHuman(self.currentHuman);
                    self.objectLoading.loading = false;
                }
            })
        },
        openUserAnswerLogMWindow: function (item) {
            let self = this;
            self.modalLoading.loading = true;
            //console.log(item);
            $('#user-answer-log-window').modal('show');
            if (self.answerRequest) {
                self.answerRequest.abort();
            }
            self.answerRequest = $.ajax({
                url: "/api/Administration/GetUserAnswerLog?Id=" + item.Id,
                type: 'post',
                success: function (data) {
                    self.userAnswerLog = data;
                    self.answerRequest = null;
                    self.modalLoading.loading = false;
                    self.modalLoading.loaded = true;
                }
            })

        },
        openNewTestWindow: function (item) {
            let self = this;
            self.modalLoading.loading = true;
            self.assignedModel.UserId = item.Id
            //console.log(item);
            $('#user-new-test-window').modal('show');

            if (self.disciplines.length == 0) {
                $.ajax({
                    url: "/api/Administration/GetDisciplines",
                    type: 'post',
                    success: function (data) {
                        self.disciplines = data;
                        self.modalLoading.loading = false;
                        self.modalLoading.loaded = true;
                    }
                });
            }

        },
        openChangeTimeMWindow: function (item) {
            let self = this;

            self.currentTest = item;
            console.log(item);
            $('#user-new-time-window').modal('show');
        },
        selectPlace(place) {
            let self = this;
            self.assignedModel.PlaceId = place;
        },
        saveNewDate() {
            let self = this;
            if (!self.newDate) {
                let t = new Date();
                self.newDate = t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() + 'T' + t.toLocaleTimeString();
            }
            //self.modalLoading.loading = true;
            console.log(self.newDate);
            $.ajax({
                url: "/api/Administration/ChangeTestingDate",
                type: 'post',
                data: {
                    Id: self.currentTest.Id,
                    TestingDate: self.newDate
                },
                success: function (data) {
                    if (data == 1) {
                        notifier([{ Type: 'success', Body: 'Успешно сохранено' }]);
                        self.selectHuman(self.currentHuman);
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Произошла ошибка при сохранении даты' }]);
                    }
                    self.modalLoading.loading = false;
                    self.modalLoading.loaded = true;
                }
            });

        },
        assignTest() {
            let self = this;
            console.log(self.assignedModel);//AssignDisciplineToUser
            if (!(self.assignedModel.DisciplineId && self.assignedModel.PlaceId)) {
                notifier([{ Type: 'error', Body: 'Заполните все поля' }]);
                return
            }
            $.ajax({
                url: "/api/Administration/AssignDisciplineToUser",
                type: 'post',
                data: self.assignedModel,
                success: function (data) {
                    if (data == 1) {
                        self.selectHuman(self.currentHuman);
                        $('#user-new-test-window').modal('hide');
                        notifier([{ Type: 'success', Body: 'Успешно назначено' }]);
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Во время соохранения произошла ошибка' }]);
                    }
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
                        //self.currentHuman.disciplines = self.currentHuman.disciplines.filter(function (item1) { return item1.Id != item.Id });
                        self.selectHuman(self.currentHuman);
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
