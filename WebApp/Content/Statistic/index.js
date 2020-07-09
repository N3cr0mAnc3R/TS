const app = new Vue({
    el: "#main-window",
    data: {
        shownTable: false,
        users: [],
        currentStatus: 0,
        currentDate: new Date().toISOString().slice(0, 10),
        filterFIO: "",
        statuses: []
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
        printResult: function (Id) {
            window.open('/auditory/DownloadReport?Id=' + Id, '_blank');
        },
        showTable: function () {
            this.shownTable = !this.shownTable;
        },
        findStatus: function (id) {
            var self = this;
            return self.statuses.filter(function (item) { return item.Id == id; })[0].Name;
        },
        getUsers: function () {
            var self = this;
            $.ajax({
                url: "/auditory/GetUsersByDate",
                data: {
                    StatusId: self.currentStatus,
                    Date: self.currentDate
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