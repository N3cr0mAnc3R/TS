const app = new Vue({
    el: "#main-window",
    data: {
        shownTable: false,
        users: [],
        currentStatus: 0,
        currentDate: new Date().toISOString().slice(0, 10),
        filterFIO: "",
        statuses: [],
        auditoryList: [],
        currentAud: null
    },
    methods: {
        init: function () {
            var self = this;
           // self.currentDate = new Date();
            console.log(self.currentDate);
            $.ajax({
                url: "/auditory/GetStatuses",
                type: "POST",
                async: false,
                success: function (statuses) {
                    self.statuses = statuses;
                    self.currentStatus = statuses[0].Id;
                }
            });

            $.ajax({
                url: "/auditory/GetAuditoryList",
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
                url: "/auditory/GetNewPeople",
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
        showTable: function () {
            this.shownTable = !this.shownTable;
        },
        findStatus: function (id) {
            var self = this;
            return self.statuses.filter(function (item) { return item.Id == id; })[0].Name;
        },
        printAudResult: function (Id) {
            var self = this;
            window.open('/auditory/DownloadReport?Id=' + Id + '&Type=' + 2 + '&StatusId=' + self.currentStatus, '_blank');
        },
        saveResult: function (Id) {
            var self = this;
            $.ajax({
                url: "/auditory/UpdateStatus?Id=" + ID + '&StatusId=' + self.currentStatus,
                type: "POST",
                async: false,
                success: function (newStatus) {
                    if (newStatus.Error) {
                        notifier([{ Type: 'Error', Body: newStatus.Error }]);
                    }
                    else if (newStatus != self.currentStatus) {
                        self.users = self.users.filter(function (item) { return item.Id != Id; });
                        notifier([{ Type: 'Success', Body: "Результат успешно выгружен" }]);
                    }
                }
            });
        },
        getUsers: function () {
            var self = this;
            $.ajax({
                url: "/auditory/GetUsersByDate",
                data: {
                    StatusId: self.currentStatus,
                    Date: self.currentDate,
                    Auditory: self.currentAud
                },
                type: "POST",
                async: false,
                success: function (users) {
                    self.users = users;
                    self.users.forEach(function (user) {
                        user.TestingDate = new Date(Number(user.TestingDate.substr(user.TestingDate.indexOf('(') + 1, user.TestingDate.indexOf(')') - user.TestingDate.indexOf('(') - 1))).toLocaleString();
                    })
                }
            });
        }

    },
    mounted: function () {
        this.init();
    }
});