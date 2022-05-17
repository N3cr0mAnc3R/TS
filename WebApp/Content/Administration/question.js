class MyUploadAdapter {
    constructor(loader) {
        // CKEditor 5's FileLoader instance.
        this.loader = loader;

        // URL where to send files.
        this.url = 'https://example.com/image/upload/path';
    }

    // Starts the upload process.
    upload() {
        return new Promise((resolve, reject) => {
            this._initRequest();
            this._initListeners(resolve, reject);
            this._sendRequest();
        });
    }

    // Aborts the upload process.
    abort() {
        if (this.xhr) {
            this.xhr.abort();
        }
    }

    // Example implementation using XMLHttpRequest.
    _initRequest() {
        const xhr = this.xhr = new XMLHttpRequest();

        //xhr.open('POST', this.url, true);
        //xhr.responseType = 'json';
    }
    // Initializes XMLHttpRequest listeners.
    async _initListeners(resolve, reject) {
        const xhr = this.xhr;
        const loader = this.loader;
        const genericErrorText = 'Couldn\'t upload file:' + ` ${loader.file.name}.`;

        xhr.addEventListener('error', () => reject(genericErrorText));
        xhr.addEventListener('abort', () => reject());
        xhr.addEventListener('load', () => {
            const response = xhr.response;

            if (!response || response.error) {
                return reject(response && response.error ? response.error.message : genericErrorText);
            }

            // If the upload is successful, resolve the upload promise with an object containing
            // at least the "default" URL, pointing to the image on the server.
            resolve({
                default: response.url
            });
        });
        let self = this;
        //console.log((await self.loader.file));

        var image = new Image();

        image.onload = function () {
            var canvas = document.createElement('canvas');
            canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
            canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

            canvas.getContext('2d').drawImage(this, 0, 0);

            // Get raw image data
            //callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
            //console.log(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));
            // ... or get as Data URI
            //callback(canvas.toDataURL('image/png'));
            //console.log(canvas.toDataURL('image/png'));
        };

        image.src = await this.toBase64(await this.loader.file);
        console.log(image);

        resolve({
            default: await this.toBase64(await this.loader.file)
        });
        if (xhr.upload) {
            xhr.upload.addEventListener('progress', evt => {
                if (evt.lengthComputable) {
                    loader.uploadTotal = evt.total;
                    loader.uploaded = evt.loaded;
                }
            });
        }
    }

    // Prepares the data and sends the request.
    async _sendRequest() {
        //const data = new FormData();

        //data.append('upload', this.loader.file);

        //this.xhr.send(data);
        console.log(await this.toBase64(await this.loader.file));
    }
    toBase64(file) {
       return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
}
function MyCustomUploadAdapterPlugin(editor) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
        return new MyUploadAdapter(loader);
    };
}
const app = new Vue({
    el: "#main-window",
    data: {
        disciplines: [],
        currentDiscipline: null,
        filteredDisciplines: [],
        disciplinePattern: null,
        countOfQuestions: null,
        disciplineListSelected: false,
        newDisciplineShow: false,
        totalCount: null,
        newDiscipline: {},
        countOnPage: 100,
        testingTypes: [],
        testingPasses: [],
        testingAnswerTypes: [],
        categories: [],
        themes: [],
        currentPage: 0,
        forcePage: 0,
        questionLoader: {
            loading: false,
            loaded: true
        },
        questions: [],
        newQuestionShow: false,
        newQuestion: {}
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
            self.loadDictionaries();
        },
        openDisciplineList() {
            this.disciplineListSelected = !this.disciplineListSelected;
        },
        showNewDiscipline() {
            this.newDisciplineShow = !this.newDisciplineShow;
        },
        loadDictionaries() {
            let self = this;
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
                }
            });
            $.ajax({
                url: "/api/Administration/GetTestingAnswerTypes",
                type: 'post',
                success: function (data) {
                    self.testingAnswerTypes = data;
                }
            });
        },
        saveDiscipline() {
            let self = this;
            //CreateDiscipline
            let model = {};
            Object.assign(model, self.newDiscipline);
            model.TestingTime = self.newDiscipline.TestingTime * 60;
            model.TimeAlarm = self.newDiscipline.TimeAlarm * 60;

            $.ajax({
                url: "/api/Administration/CreateDiscipline",
                type: 'post',
                data: model,
                success: function (data) {
                    self.newDiscipline.Id = data;
                    self.openDisciplineList();
                    let disc = self.filteredDisciplines.find(a => a.Id == data);
                    self.selectDiscipline(disc);
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

        },
        showQuestions() {
            let self = this;

            $.ajax({
                url: "/api/Administration/GetQuestionCount?Id=" + self.currentDiscipline.Id,
                type: 'post',
                success: function (data) {
                    self.countOfQuestions = data;
                    self.selectPage(1);
                    self.totalCount = Number.parseInt(data / self.countOnPage) + (data % self.countOnPage > 0 ? 1 : 0);
                }
            });
        },
        selectPage(Id) {
            let self = this;
            self.currentPage = Id;
            self.questionLoader.loading = true;
            self.questionLoader.loaded = false;
            let offset = self.countOnPage * (self.currentPage - 1);
            $.ajax({
                url: "/api/Administration/GetDisciplineQuestions?Id=" + self.currentDiscipline.Id + '&Offset=' + offset + '&Count=' + self.countOnPage,
                type: 'post',
                success: function (data) {
                    self.questions = data;
                    self.questionLoader.loading = false;
                    self.questionLoader.loaded = true;
                }
            });

        },
        toggleQuestion(question) {
            let self = this;
            $.ajax({
                url: "/api/Administration/ToggleQuestion?Id=" + question.Id + '&IsActive=' + (!question.IsActive),
                type: 'post',
                success: function (data) {
                    question.IsActive = !question.IsActive;
                }
            });

        },
        showPage() {
            let self = this;
            self.selectPage(self.forcePage);
        },
        getCategories() {
            let self = this;
            $.ajax({
                url: "/api/Administration/GetQuestionCategories?Id=" + self.currentDiscipline.Id,
                type: 'post',
                success: function (data) {
                    self.categories = data;
                }
            });
        },
        getThemes() {
            let self = this;
            $.ajax({
                url: "/api/Administration/GetQuestionThemes?Id=" + self.currentDiscipline.Id,
                type: 'post',
                success: function (data) {
                    self.themes = data;
                }
            });
        },
        addQuestion(question) {
            let self = this;
            self.disciplineListSelected = false;
            self.newQuestionShow = true;
            if (question) {
                self.newQuestion = question;
            }
            else {
                self.newQuestion = { Answers: [], TypeAnswerId: 0, CategoryQuestionId: 0, ThemeId: 0, Id: null };
            }
            self.getThemes();
            self.getCategories();
        },
        changeQuestionTypes() {
            let self = this;
            if (self.newQuestion.TypeAnswerId == 0 || self.newQuestion.CategoryQuestionId == 0 || self.newQuestion.ThemeId == 0) {
                return;
            }
            setTimeout(function () {
                self.newQuestion.textEditor = ClassicEditor
                    .create(document.querySelector('#editor'), {
                        toolbar: ['heading', '|', 'bold', 'italic', 'bulletedList', 'numberedList', '|', 'uploadImage'],
                        extraPlugins: [MyCustomUploadAdapterPlugin, ],
                        image: {
                            toolbar: ['toggleImageCaption', 'imageTextAlternative']
                        }
                    })
                    .catch(error => {
                        console.error(error);
                    });
            }, 200);
        },
        addAnswer() {
            let self = this;
            self.newQuestion.Answers.push({});
            console.log(self.newQuestion);
        },
        loadQuestion(e) {
            let self = this;
            var extension = e.target.files[0].name.substr(e.target.files[0].name.lastIndexOf('.'));
            self.newQuestion.docQuestion = e.target.files[0];

            var formaData = new FormData();
            if (!self.newQuestion.Id) {

            }
            console.log(self.newQuestion.Id);
            return;
            formaData.append('Id', self.newQuestion.Id);
            formaData.append('QuestionFile', self.newQuestion.docQuestion);
            formaData.append('TypeAnswerId', self.newQuestion.TypeAnswerId);
            formaData.append('ThemeId', self.newQuestion.ThemeId);
            formaData.append('CategoryQuestionId', self.newQuestion.CategoryQuestionId);
            formaData.append('IsActivity', self.newQuestion.IsActivity);
            $.ajax({
                url: "/Administration/SaveQuestionFile",
                type: 'POST',
                data: formaData,
                contentType: false,
                processData: false,
                success: function (data) {
                    console.log(data);
                }
            });
        },
        async saveQuestion() {
            let self = this;
            //let info = (await self.newQuestion.textEditor).data.get();

            //var formaData = new FormData();
            //formaData.append('QuestionString', info);
            //formaData.append('Id', self.newQuestion.Id);
            //formaData.append('Question', self.newQuestion.docQuestion);
            var formaData = {
                QuestionString: (await self.newQuestion.textEditor).data.get(),
                TypeAnswerId: self.newQuestion.TypeAnswerId,
                ThemeId: self.newQuestion.ThemeId,
                CategoryQuestionId: self.newQuestion.CategoryQuestionId,
                IsActivity: self.newQuestion.IsActivity,
            };
            //var formaData = { QuestionString: "<p>qwe <i>ewq</i></p> абвк <p>Второй абзац</p>"};
            console.log(formaData);
           //return;
            $.ajax({
                url: "/api/Administration/SaveQuestionString",
                type: 'post',
                data: formaData,
                //contentType: false,
                //processData: false,
                success: function (data) {
                    console.log(data);
                }
            });
        }

    },

    //После полной загрузки скрипта инициализируем
    mounted: function () {
        this.init();
    }
});