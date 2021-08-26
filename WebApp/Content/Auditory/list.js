const app = new Vue({
    el: "#main-window",
    data: {
        auditoryList: [],
        selectedAud: {},
        isSuperAdmin: false,
        localization: 1
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/api/auditory/GetAuditoryList",
                type: "POST",
                async: false,
                success: function (auditories) {
                    auditories.map(function (a) {
                        a.Deleted = false;
                        a.IsNew = false;
                        a.Info = {};
                        a.videoStream = {};
                        a.hasVideo = false;
                    });
                    self.auditoryList = auditories;
                    setTimeout(function () {
                    for (let i = 0; i < self.auditoryList.length; i++) {
                        setTimeout(function () {
                            self.getAuditoryStatistic(self.auditoryList[i]);
                        }, 100)
                        }
                    }, 100)
                    //self.auditoryList.forEach(function (a) {
                    //    self.getAuditoryStatistic(a.Id);
                    //});
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
        },
        getAuditoryStatistic: function (item) {
            //getAuditoryStatistic: function (Id) {
            let self = this;
            //let found = self.auditoryList.filter(function (auditory) {
            //    return auditory.Id === Id;
            //})[0];
            $.ajax({
                url: "/api/auditory/GetAuditoryStatistic?Id=" + item.Id,
                //url: "/api/auditory/GetAuditoryStatistic?Id=" + Id,
                type: "POST",
                async: false,
                success: function (info) {
                    item.Info = info;
                    //found.Info = info;
                }
            });
        },
        addAuditory: function () {
            let Id = 0;
            this.auditoryList.forEach(function (a) { Id = Math.max(Id, a.Id); });
            this.auditoryList.push({ Id: Id + 1, IsNew: true, Name: "" });
        },
        deleteAud: function (id) {
            let item = this.auditoryList.filter(function (a) { return a.Id == id; })[0];
            item.Deleted = !item.Deleted;
            if (item.IsNew) {
                this.auditoryList = this.auditoryList.filter(function (a) { return a.Id != id });
            }
        },
        startRename: function (item) {
            $('#renameModal').modal('show');
            let obj = {};
            Object.assign(obj, item);
            this.selectedAud = obj;
        },
        rename: function () {
            let self = this;
            this.auditoryList.filter(function (a) { return self.selectedAud.Id == a.Id; })[0].Name = self.selectedAud.Name;
            $('#renameModal').modal('hide');
        },
        save: function () {
            let self = this;
            //ToDo Добавляются новые аудитории...
        },
        configAud: function (Id) {
            let flag = false;
            flag = this.auditoryList.filter(function (a) { return a.Id == Id; })[0].IsNew;
            if (!flag) {
                window.open('/auditory/index?Id=' + Id, '_self');
            }
            else {
                $('.toast').toast('show');
            }
        },
        showAud: function (Id) {
            let flag = false;
            flag = this.auditoryList.filter(function (a) { return a.Id == Id; })[0].IsNew;
            if (!flag) {
                window.open('/auditory/Moderate?Id=' + Id, '_self');
            }
            else {
                $('.toast').toast('show');
            }
        },
        switchLocal: function (id) {
            let self = this;
            switch (id) {
                case 1: return localStorage["localization"] == 1 ? "Список аудиторий" : "Auditory list";
                case 2: return localStorage["localization"] == 1 ? "Сохранить" : "Save";
                case 3: return localStorage["localization"] == 1 ? "Переименовать элемент" : "Rename item";
                case 4: return localStorage["localization"] == 1 ? "Закрыть" : "Close";
                case 5: return localStorage["localization"] == 1 ? "Ошибка" : "Error";
                case 6: return localStorage["localization"] == 1 ? "Сперва сохраните изменения" : "Save changes before leaving";
                case 7: return localStorage["localization"] == 1 ? "Места:" : "Places:";
                case 8: return localStorage["localization"] == 1 ? "Пользователи:" : "Users:";
            }
        }
    },
    mounted: function () {
        this.init();
    }
});