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
                    auditories.map(a => { a.Deleted = false; a.IsNew = false });
                    self.auditoryList = auditories;

                }
            });
        },
        addAuditory() {
            let Id = 0;
            this.auditoryList.forEach(a => Id = Math.max(Id, a.Id));
            this.auditoryList.push({ Id: Id + 1, IsNew: true, Name: "" });
        },
        deleteAud(id) {
            let item = this.auditoryList.find(a => a.Id == id);
            item.Deleted = !item.Deleted;
            if (item.IsNew) {
                this.auditoryList = this.auditoryList.filter(a => a.Id != id);
            }
        },
        startRename(item) {
            $('#renameModal').modal('show');
            let obj = {};
            Object.assign(obj, item);
            this.selectedAud = obj;
        },
        rename() {
            let self = this;
            this.auditoryList.find(a => self.selectedAud.Id == a.Id).Name = self.selectedAud.Name;
            $('#renameModal').modal('hide');
        },
        save() {
            let self = this;
            //ToDo Добавляются новые аудитории...
        },
        configAud(Id) {
            let flag = false;
            flag = this.auditoryList.find(a => a.Id == Id).IsNew;
            if (!flag) {
                window.open('/auditory/index?Id=' + Id, '_self');
            }
            else {
                $('.toast').toast('show');
            }
        },
        showAud(Id) {
            let flag = false;
            flag = this.auditoryList.find(a => a.Id == Id).IsNew;
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