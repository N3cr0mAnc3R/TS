const app = new Vue({
    el: "#main-window",
    data: {
        profiles: [],
        currentProfile: -1,
        profileForSelect: {},
        students: []
    },
    methods: {
        init: function () {
            let self = this;
            $.ajax({
                url: "/Verification/GetProctorProfiles",
                type: "POST",
                async: false,
                success: function (profiles) {
                    self.profiles = profiles;
                    if (profiles.length == 1) {
                        self.currentProfile = profiles[0].Id;
                        self.selectProfile(self.currentProfile);
                    }
                }
            });
        },
        selectProfile: function (id) {
            let self = this;
            $.ajax({
                url: "/Verification/GetProctorTests?Id=" + id,
                type: "POST",
                async: false,
                success: function (students) {
                    self.students = students;
                }
            });
        },
        SaveProfile: function () {
            let self = this;
            self.currentProfile = self.profileForSelect;
            self.selectProfile(self.currentProfile);
        },
        selectStudent: function(id){
            window.open('/verification/index?Id=' + id, '_self');
        }

    },
    mounted: function () {
        this.init();
    }
});