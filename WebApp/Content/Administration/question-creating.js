const app = new Vue({
    el: "#main-window",
    data: {
        categories: [],
        themes: [],
        Id: 0,
        currentCategory: null,
        currentTheme: null,
        categoryEditing: false,
        themeEditing: false,
        structureEditing: false,
        testingTypes: [],
        testingPasses: [],
        disciplineStructure: {}
    },
    methods: {
        init() {
            let self = this;
            let str = window.location.href;
            self.Id = Number.parseInt(str.substr(str.lastIndexOf('Id=') + 3));

            $.ajax({
                url: "/api/Administration/GetTestingTypes",
                type: 'post',
                success: function (data) {
                    self.testingTypes = data;
                }
            });

            $.ajax({
                url: "/api/Administration/GetTestingPassTimes",
                type: 'post',
                success: function (data) {
                    self.testingPasses = data;
                    self.getStructure();
                }
            });
            self.getCategories();
            self.getThemes();
        },
        getTotalScale() {
            let self = this;
            let counter = 0;
            self.categories.forEach(question => {
                counter += (question.Weight * question.Count);
            });
            return counter;
        },
        getCategories() {
            let self = this;
            $.ajax({
                url: "/api/Administration/GetQuestionCategories?Id=" + self.Id,
                type: 'post',
                success: function (data) {
                    self.categories = data;
                }
            });
        },
        getThemes() {
            let self = this;
            $.ajax({
                url: "/api/Administration/GetQuestionThemes?Id=" + self.Id,
                type: 'post',
                success: function (data) {
                    self.themes = data;
                }
            });
        },
        getStructure() {
            let self = this;
            $.ajax({
                url: "/api/Administration/GetStructureDiscipline?Id=" + self.Id,
                type: 'post',
                success: function (data) {
                    self.disciplineStructure = data;
                    self.disciplineStructure.TestingTime = self.disciplineStructure.TestingTime / 60;
                    self.disciplineStructure.TimeAlarm = self.disciplineStructure.TimeAlarm / 60;
                }
            });
        },
        addCategory() {
            let self = this;
            let item = { Id: null, Name: "Новая категория", StructureDisciplineId: self.Id, Weight: 1, Count: 1 };
            self.categories.push(item);
            self.editCategory(item);
        },
        addTheme() {
            let self = this;
            let item = { Id: null, Name: "Новая тема", StructureDisciplineId: self.Id, IsActive: true };
            self.themes.push(item);
            self.editTheme(item);
        },
        startEdit() {
            let self = this;
            self.structureEditing = !self.structureEditing;
        },
        editCategory(cat) {
            let self = this;
            self.categoryEditing = true;
            self.currentCategory = cat;
        },
        editTheme(theme) {
            let self = this;
            self.themeEditing = true;
            self.currentTheme = theme;
        },
        saveCategory() {
            let self = this;
            $.ajax({
                url: "/api/Administration/SaveQuestionCategory",
                type: 'post',
                data: self.currentCategory,
                success: function (data) {
                    self.categoryEditing = false;
                    self.currentCategory = null;
                    self.getCategories();
                }
            });
        },
        saveTheme() {
            let self = this;
            $.ajax({
                url: "/api/Administration/SaveQuestionTheme",
                type: 'post',
                data: self.currentTheme,
                success: function (data) {
                    self.themeEditing = false;
                    self.currentTheme = null;
                    self.getThemes();
                }
            });
        },
        getTypeName() {
            let self = this;
            let found = self.testingTypes.find(a => a.Id == self.disciplineStructure.TypeTesting);
            return found ? found.Name : "";
        },
        getPassName() {
            let self = this;
            let found = self.testingPasses.find(a => a.Id == self.disciplineStructure.TestingPass);
            return found ? found.Name : "";
        },
        saveStructure() {
            let self = this;
            let model = {};
            Object.assign(model, self.disciplineStructure);
            model.TestingTime = self.disciplineStructure.TestingTime * 60;
            model.TimeAlarm = self.disciplineStructure.TimeAlarm * 60;

            $.ajax({
                url: "/api/Administration/UpdateDiscipline",
                type: 'post',
                data: model,
                success: function (data) {
                    self.structureEditing = false;
                }
            });
        }
    },
    mounted: function () {
        this.init();
    }
});