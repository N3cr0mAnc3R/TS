﻿const app = new Vue({
    el: "#main-window",
    data: {
        shownTable: false,
        users: [],
        currentStatus: 0,
        currentDate: new Date().toISOString().slice(0, 10),
        filterFIO: "",
        statuses: [],
        auditoryList: [],
        currentAud: null,
        isSuperAdmin: false
    },
    methods: {
        init: function () {
            var self = this;
           // self.currentDate = new Date();
           // console.log(self.currentDate);
            $.ajax({
                url: "/api/auditory/GetStatuses",
                type: "POST",
                async: false,
                success: function (statuses) {
                    self.statuses = statuses;
                    self.currentStatus = statuses[0].Id;
                }
            });
            $.ajax({
                url: "/api/account/IsPaul",
                type: "POST",
                async: false,
                success: function (domain) {
                    self.isSuperAdmin = domain;
                }
            });

            $.ajax({
                url: "/api/auditory/GetAuditoryList",
                type: "POST",
                async: false,
                success: function (auditories) {
                    self.auditoryList = auditories;
                }
            });
        },
        selectAud: function (id) {
            var self = this;
            self.currentAud = id;
        },
        loadPeople: function () {
            $.ajax({
                url: "/api/auditory/GetNewPeople",
                type: "POST",
                async: true,
                success: function (result) {
                    console.log(result);
                }
            });

        },
        Download: function (Id, type) {
            window.open('/statistic/Download?Id=' + Id + '&Type=' + type, '_blank');
        },
        printTPResult: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 1, '_blank');
        },
        printTitleResult: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 3, '_blank');
        },
        printProtocolResult: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 4, '_blank');
        },
        showTable: function () {
            this.shownTable = !this.shownTable;
        },
        findStatus: function (id) {
            var self = this;
            return self.statuses.filter(function (item) { return item.Id == id; })[0].Name;
        },
        printAudResult: function (Id) {
            var self = this;
            //console.log(self.currentDate);
            //console.log((self.currentDate == null ? '&Date=' + self.currentDate.getFullYear() + ',' + self.currentDate.gegetMonthtMonth() + ',' + self.currentDate.getDate() : ''));
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 2 + '&StatusId=' + self.currentStatus + '&Date=' + self.currentDate, '_blank');
            //window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 2 + '&StatusId=' + self.currentStatus + (self.currentDate == null ? '&Date=' + self.currentDate.getFullYear() + ',' + self.currentDate.gegetMonthtMonth() + ',' + self.currentDate.getDate(): ''), '_blank');
        },
        saveResult: function (Id) {
            var self = this;
            $.ajax({
                url: "/api/auditory/UpdateStatus?Id=" + Id + '&StatusId=4',
                type: "POST",
                async: true,
                success: function (newStatus) {
                    if (newStatus.Error) {
                        notifier([{ Type: 'error', Body: newStatus.Error }]);
                    }
                    else if (newStatus != self.currentStatus) {
                        self.users = self.users.filter(function (item) { return item.Id != Id; });
                        notifier([{ Type: 'success', Body: "Результат успешно выгружен" }]);
                    }
                    else {
                        notifier([{ Type: 'error', Body: 'Произошла ошибка при выгрузке. Попробуйте позже' }]);
                    }
                }
            });
        },
        getUsers: function () {
            var self = this;
            $.ajax({
                url: "/api/auditory/GetUsersByDate",
                data: {
                    StatusId: self.currentStatus,
                    Date: self.currentDate,
                    Auditory: self.currentAud
                },
                type: "POST",
                async: false,
                success: function (users) {
                    self.users = users;
                    //self.users.forEach(function (user) {
                    //    user.TestingDate = new Date(Number(user.TestingDate.substr(user.TestingDate.indexOf('(') + 1, user.TestingDate.indexOf(')') - user.TestingDate.indexOf('(') - 1))).toLocaleString();
                    //})
                }
            });
        },
        donwloadAll: function () {
            var self = this;
            if (self.isSuperAdmin) {
                self.users.forEach(function (item) {
                    console.log(item);
                    self.printTPResult(item.Id);
                })
            }
        },
        uploadAll: function () {
            var self = this;
            if (self.isSuperAdmin) {
                self.users.forEach(function (item) {
                    if (item.Score > 20) {
                        self.saveResult(item.Id);
                    }
                })
            }
        }

    },
    mounted: function () {
        this.init();
    }
});