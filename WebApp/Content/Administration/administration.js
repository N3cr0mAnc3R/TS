const app = new Vue({
    el: "#main-window",
    data: {
        auditories: [],
        currentAuditory: null,
        auditoryManagement: false,
        reportManagement: false,
        people: [],
        surname: "",
        userForAdd: {},
        hasFullAccess: false,
        searched: false,
        foundedUsers: [],
        minDate: null,
        objForLoading: {
            loading: false,
            loaded: true
        },
        modalLoader: {
            loading: false,
            loaded: true
        }
    },
    methods: {
        addZero(number){
            return number < 10?  '0' + number: number;
        },
        init() {
            let self = this;
            self.minDate = new Date().getFullYear() + '-' + self.addZero(new Date().getMonth() + 1) + '-' + self.addZero(new Date().getDate());
            $.ajax({
                url: "/api/auditory/GetAuditoryList",
                type: "POST",
                async: false,
                success: function (auditories) {
                    self.auditories = auditories;
                    self.selectAud(auditories[0].Id);
                }
            });
            $.ajax({
                url: "/api/administration/HasFullAccess",
                type: "POST",
                async: false,
                success: function (data) {
                    self.hasFullAccess = data;
                }
            });

            $('#form-1').on("submit", function () {
                event.preventDefault();
            });
            $('#form-2').on("submit", function () {
                event.preventDefault();
            });
        },
        selectUserForAdd(user) {
            this.userForAdd = user;
            $('#user-auditory-confirm').modal('show');
        },
        selectUserForReport(user) {
            this.userForAdd = user;
            $('#user-report-wrapper').modal('hide');
            $('#user-report-confirm').modal('show');
        },
        findAudById(id) {
            return this.auditories.find(a => a.Id == id).Name;
        },
        selectAud(aud) {
            let self = this;
            self.currentAuditory = aud;
            if (self.auditoryManagement) {
                self.getAudUsers();
            } else {
                self.getReportUsers();
            }
        },
        addInfoForReport() {
            let self = this;
            self.searched = false;
            $('#user-report-wrapper').modal('show');
        },
        addInfoForUser() {
            let self = this;
            self.searched = false;
            $('#user-auditory-wrapper').modal('show');
        },
        getAudUsers() {
            let self = this;
            if (!self.currentAuditory) {
                return;
            }
            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/Administration/GetPeopleWithAccess?Id=" + self.currentAuditory,
                type: "POST",
                async: false,
                success: function (data) {
                    self.people = data;
                    self.objForLoading.loading = false;
                    self.objForLoading.loaded = true;
                }
            });
        },
        findUsersByFio() {
            let self = this;
            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/statistic/findfio",
                type: "POST",
                async: false,
                data: { Fio: self.surname },
                success: function (data) {
                    let ids = [];
                    self.people.forEach(a => ids.push(a.Id));
                    self.searched = true;
                    data = data.filter(a => ids.indexOf(a.Id) == -1);
                    self.foundedUsers = data;
                    self.objForLoading.loading = false;
                    self.objForLoading.loaded = true;
                }
            });
        },
        getReportUsers() {
            let self = this;
            if (!self.currentAuditory) {
                return;
            }
            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/Administration/GetPeopleWithReportAccess?Id=" + self.currentAuditory,
                type: "POST",
                async: false,
                success: function (data) {
                    data.forEach(item => {
                        item.DateFromString = (new Date(item.DateFrom)).toLocaleDateString();
                        item.DateFrom = (new Date(item.DateFrom));
                        item.DateToString = (new Date(item.DateTo)).toLocaleDateString();
                        item.DateTo = (new Date(item.DateTo));
                    });
                    self.people = data;
                    self.objForLoading.loading = false;
                    self.objForLoading.loaded = true;
                }
            });
        },

        removeUserFromAud(user) {
            let self = this;
            if (!self.currentAuditory) {
                return;
            }
            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/Administration/SetUserToAuditory",
                type: "POST",
                async: false,
                data: { AuditoriumId: self.currentAuditory, UserId: user.Id, IsActive: false },
                success: function (data) {
                    if (data == 1) {
                        notifier([{ Type: 'success', Body: "Успешно сохранено" }]);
                        self.getAudUsers();
                    }
                    else {
                        self.objForLoading.loaded = true;
                        self.objForLoading.loading = false;
                        notifier([{ Type: 'error', Body: "Во время сохранения информации произошла ошибка" }]);
                    }
                }
            });
        },
        assignUserForAud() {
            let self = this;
            if (!self.currentAuditory) {
                return;
            }
            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/Administration/SetUserToAuditory",
                type: "POST",
                async: false,
                data: { AuditoriumId: self.currentAuditory, UserId: self.userForAdd.Id, IsActive: true },
                success: function (data) {
                    if (data == 1) {
                        notifier([{ Type: 'success', Body: "Успешно сохранено" }]);
                        self.getAudUsers();
                    }
                    else {
                        self.objForLoading.loaded = true;
                        self.objForLoading.loading = false;
                        notifier([{ Type: 'error', Body: "Во время сохранения информации произошла ошибка" }]);
                    }
                }
            });
        },
        removeUserFromReport(user) {
            let self = this;
            if (!self.currentAuditory) {
                return;
            }
            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/Administration/SetUserToReport",
                type: "POST",
                async: false,
                data: { AuditoriumId: self.currentAuditory, UserId: user.Id, IsActive: false },
                success: function (data) {
                    if (data == 1) {
                        notifier([{ Type: 'success', Body: "Успешно сохранено" }]);
                        self.getReportUsers();
                    }
                    else {
                        self.objForLoading.loaded = true;
                        self.objForLoading.loading = false;
                        notifier([{ Type: 'error', Body: "Во время сохранения информации произошла ошибка" }]);
                    }
                }
            });
        },
        assignUserForReport() {
            let self = this;
            if (!self.currentAuditory) {
                return;
            }

            if (!self.userForAdd.DateFrom || !self.userForAdd.DateTo) {
                notifier([{ Type: 'error', Body: "Необходимо выбрать даты" }]);
                return;
            }
            $('#user-report-confirm').modal('hide');

            self.objForLoading.loaded = false;
            self.objForLoading.loading = true;
            $.ajax({
                url: "/api/Administration/SetUserToReport",
                type: "POST",
                async: false,
                data: { AuditoriumId: self.currentAuditory, UserId: self.userForAdd.Id, IsActive: true, DateFrom: self.userForAdd.DateFrom, DateTo: self.userForAdd.DateTo },
                success: function (data) {
                    if (data == 1) {
                        notifier([{ Type: 'success', Body: "Успешно сохранено" }]);
                        self.getReportUsers();
                    }
                    else {
                        self.objForLoading.loaded = true;
                        self.objForLoading.loading = false;
                        notifier([{ Type: 'error', Body: "Во время сохранения информации произошла ошибка" }]);
                    }
                }
            });
        },
        setAuditoryManagement() {
            this.auditoryManagement = true;
            this.reportManagement = false;
            this.getAudUsers();
        },
        setReportManagement() {
            this.auditoryManagement = false;
            this.reportManagement = true;
            this.getReportUsers();
        }
    },

    //После полной загрузки скрипта инициализируем
    mounted: function () {

        // this.objForLoading.loading = true;
        //this.objForLoading.loaded = false;
        this.init();
    }
});