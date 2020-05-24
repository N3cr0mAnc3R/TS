const app = new Vue({
    el: "#main-window",
    data: {
        auditoryList: [],
        selectedAud: {}
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/auditory/GetAuditoryList",
                type: "POST",
                async: false,
                success: function (auditories) {
                    auditories.map(function (a) { a.Deleted = false; a.IsNew = false; } );
                    self.auditoryList = auditories;

                }
            });
        },
        addAuditory: function() {
            let Id = 0;
            this.auditoryList.forEach(function (a) { Id = Math.max(Id, a.Id); });
            this.auditoryList.push({ Id: Id + 1, IsNew: true, Name: "" });
        },
        deleteAud: function(id) {
            let item = this.auditoryList.filter(function (a) { return a.Id == id; })[0];
            item.Deleted = !item.Deleted;
            if (item.IsNew) {
                this.auditoryList = this.auditoryList.filter(function (a) { return a.Id != id });
            }
        },
        startRename: function(item) {
            $('#renameModal').modal('show');
            let obj = {};
            Object.assign(obj, item);
            this.selectedAud = obj;
        },
        rename: function() {
            let self = this;
            this.auditoryList.filter(function (a) { return self.selectedAud.Id == a.Id; })[0].Name = self.selectedAud.Name;
            $('#renameModal').modal('hide');
        },
        save: function() {
            let self = this;
            //ToDo Добавляются новые аудитории...
        },
        configAud: function(Id) {
            let flag = false;
            flag = this.auditoryList.filter(function (a) { return a.Id == Id; })[0].IsNew;
            if (!flag) {
                window.open('/auditory/index?Id=' + Id, '_self');
            }
            else {
                $('.toast').toast('show');
            }
        },
        showAud: function(Id) {
            let flag = false;
            flag = this.auditoryList.filter(function (a) { return a.Id == Id; })[0].IsNew;
            if (!flag) {
                window.open('/auditory/Moderate?Id=' + Id, '_self');
            }
            else {
                $('.toast').toast('show');
            }
        }
    },
    mounted: function () {
        this.init();
    }
});