const app = new Vue({
    el: "#main-window",
    data: {
        disciplines: [],
        currentDiscipline: null,
        filteredDisciplines: [],
        disciplinePattern: null,
        countOfQuestions: null,
        totalCount: null,
        countOnPage: 100,
        currentPage: 0,
        questionLoader: {
            loading: false,
            loaded: true
        },
        questions: []
    },
    methods: {
        init() {
            let self = this;
            $.ajax({
                url: "/api/Administration/GetDisciplines",
                type: 'post',
                success: function (data) {
                    self.disciplines = data;
                    self.filteredDisciplines = data;
                }
            });
        },
        filterDisciplines() {
            let self = this;
            self.filteredDisciplines = self.disciplines.filter(a => {
                return a.Name.toLowerCase().indexOf(self.disciplinePattern) != -1;
            });

        },
        selectDiscipline(disc) {
            let self = this;
            self.currentDiscipline = disc;
            self.filteredDisciplines = self.disciplines;
            self.disciplinePattern = null;
            setTimeout(function () {
                $('#disc-' + disc.Id)[0].scrollIntoView();
            }, 100);

            $.ajax({
                url: "/api/Administration/GetQuestionCount?Id=" + disc.Id,
                type: 'post',
                success: function (data) {
                    self.countOfQuestions = data;
                    self.totalCount = Number.parseInt(data / self.countOnPage) + (data % self.countOnPage > 0 ? 1 : 0);
                }
            });
        },
        selectPage(Id) {
            let self = this;
            self.currentPage = Id;
            self.questionLoader.loading = true;
            self.questionLoader.loaded = false;
            $.ajax({
                url: "/api/Administration/GetDisciplineQuestions?Id=" + self.currentDiscipline.Id + '&Offset=' + self.countOnPage * (self.currentPage - 1) + '&Count=' + self.countOnPage,
                type: 'post',
                success: function (data) {
                    self.questions = data;
                    self.questionLoader.loading = false;
                    self.questionLoader.loaded = true;
                }
            });

        }
       
    },

    //После полной загрузки скрипта инициализируем
    mounted: function () {
        this.init();
    }
});