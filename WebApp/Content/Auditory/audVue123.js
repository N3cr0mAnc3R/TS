const app = new Vue({
    el: "#main-window",
    data: {
        computerList: [],
        domain:"",
        maxX: 0,
        maxY: 0,
        maxContent: 0,
        selected: -1,
        selectedComp: {},
        isForSwap: false,
        auditory: 0,
        auditoryName: '',
        currentProfile: -1,
        NeedPin: false,
        fastModel: {
            count: 0,
            position: 1
        },
        needPin: false,
        IsRebuild: false,
        localizaion: 1,
        intervalPin: null,
        deletedPlaces: []
    },
    methods: {
        init: function () {
            let self = this;

            $.ajax({
                url: "/api/account/GetDomain",
                type: "POST",
                async: false,
                success: function (domain) {
                    self.domain = domain;
                }
            });
            let str = window.location.href;
            let newId = parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            self.getPlaceByConfig();
            $.ajax({
                url: "/api/auditory/GetAuditoryInfo?Id=" + newId,
                type: "POST",
                async: false,
                success: function (auditory) {
                    //auditory.ComputerList.map(a => a.Selected = false);
                    self.auditory = auditory.Id;
                    self.auditoryName = auditory.Name;
                    self.NeedPin = auditory.NeedPin;
                    self.computerList = auditory.ComputerList;
                    self.computerList.map(function (a) { self.maxContent = Math.max(self.maxContent, +a.Name); });

                    //self.startFindPin();

                    //let sizeX = Math.ceil(self.computerList.length / 6);
                    //let counter = 1;
                    //for (let i = 0; i < sizeX; i++) {
                    //    for (let j = 0; j < 6; j++) {
                    //        let comp = self.computerList.find(a => a.Name == counter);
                    //        console.log(comp);
                    //        if (counter < self.computerList.length + 1) {
                    //            comp.PositionX = i;
                    //            comp.PositionY = j;
                    //            //items.push({ PositionX: i, PositionY: j, IsNeedPlaceConfig: true, Name: counter + '', IsNew: true, Id: counter });
                    //        }
                    //        counter++;
                    //        console.log(counter);
                    //    }
                    //}
                    //let length = self.computerList.filter(a => a.PositionX == a.PositionY && a.PositionX == 0).length;
                    //if (length > 1) {
                    //    self.fastModel.count = self.computerList.length;
                    //    self.buildAuditory();
                    //}
                    self.initAud();
                }
            });
            $.ajax({
                url: "/api/auditory/ResetPins?Id=" + newId,
                type: "POST",
                async: false
            });
            $('#renameModal').on('shown.bs.modal', function () {
                $('#rename-input').trigger('focus');
            });
        },
        startFindPin: function () {
            let self = this;
            self.intervalPin = setInterval(function () {
                $.ajax({
                    url: "/api/auditory/GetAuditoryCompsWithoutPin?Id=" + self.auditory,
                    type: "POST",
                    async: false,
                    success: function (compIds) {
                        if (compIds.length != self.computerList.filter(function (item) { return item.Name != "" }).length) {
                            self.computerList.forEach(function (comp) {
                                let found = compIds.filter(function (id) {
                                    return id.PlaceId == comp.Id;
                                })[0];
                                if (found) {
                                    comp.PIN = null;
                                    comp.IsNeedPlaceConfig = false;
                                }
                            });
                        }
                        else {
                            clearInterval(self.intervalPin);
                        }

                        //if (compIds) {
                        //    clearInterval(self.intervalPin);
                        //}
                    }
                });
            }, 1000);
        },
        initAud: function () {
            let self = this;
            self.maxX = 0, self.maxY = 0;
            self.computerList.forEach(function (a) { self.maxX = Math.max(self.maxX, a.PositionX); self.maxY = Math.max(self.maxY, a.PositionY); });
        },
        select: function (Id) {
            let self = this;
            event.stopPropagation();
            console.log(self.isForSwap);
            if (self.isForSwap) {
                self.isForSwap = false;
                self.selectForSwap(Id);
                return;
            }
            let comp = self.computerList.filter(function (a) { return a.Id === Id; })[0];
            if (comp.Name == "") {
                self.maxContent++;
                comp.Name = self.maxContent + '';
            }
            if (comp.Id != self.selected) {
                self.selected = comp.Id;
                self.selectedComp = copyObj(comp);
            }
            else {
                self.selected = -1;
                self.selectedComp = {};
            }
            $(document).on('click', self.unselect);
        },
        unselect: function () {
            app.selected = -1;
            app.selectedComp = {};
            $(document).off('click', app.unselect);
        },
        stopP: function () {
            event.stopPropagation();
            $('#renameModal').modal('show');
        },
        setSwapFlag: function () {
            let self = this;
            event.stopPropagation();
            self.isForSwap = !self.isForSwap;
            console.log(self.isForSwap);
        },
        selectForSwap: function (Id) {
            let self = this;
            let comp = this.computerList.filter(function (a) { return a.Id === Id; })[0];
            if (self.selected === -1) {
                self.selected = Id;
                self.selectedComp = copyObj(comp);
            }
            else if (this.selected === Id) {
                self.selected = -1;
                self.selectedComp = {};
            }
            else {
                let from = [-1, -1], to = [-1, -1];
                let arr1 = this.computerList;

                let findedF = arr1.filter(function (a) { return a.Id === self.selected; })[0];
                from = [findedF.PositionX, findedF.PositionY];
                to = [comp.PositionX, comp.PositionY];
                findedF.PositionX = to[0];
                findedF.PositionY = to[1];

                comp.PositionX = from[0];
                comp.PositionY = from[1];
                self.selected = -1;
                self.selectedComp = {};
            }

        },
        buildAuditory: function () {
            let self = this;
            let items = [];
            let size = Math.ceil(this.fastModel.count / 4 + 1);
            let counter = 1;
            if (this.fastModel.position == 1) {
                let sizeX = Math.ceil(this.fastModel.count / 6);
                console.log(sizeX);
                for (let i = 0; i < sizeX; i++) {
                    for (let j = 0; j < 6; j++) {
                        if (counter < this.fastModel.count + 1) {
                            items.push({ PositionX: i, PositionY: j, IsNeedPlaceConfig: true, Name: counter + '', IsNew: true, Id: counter });
                            counter++;
                        }
                    }
                }
            }
            else if (this.fastModel.position == 2) {

                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        if ((self.can2(i, size - 1) || self.can2(j, size - 1)) && counter <= self.fastModel.count) {
                            items.push({ PositionX: i, PositionY: j, IsNeedPlaceConfig: true, Name: counter + '', IsNew: true, Id: counter });
                            counter++;
                        }
                    }
                }
            }
            else if (this.fastModel.position == 3) {
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {
                        if (self.can3(j, size - 1) && counter <= self.fastModel.count) {
                            items.push({ PositionX: i, PositionY: j, IsNeedPlaceConfig: true, Name: counter + '', IsNew: true, Id: counter });
                            counter++;
                        }
                    }
                }
            }
            console.log(self.computerList);
            self.deletedPlaces = self.computerList;
            console.log(self.deletedPlaces);
            self.computerList = items;
            self.initAud();
            self.IsRebuild = true;
        },
        can2: function (i, max) {
            if (i == 0 || i == max)
                return true;
            else return false;
        },
        can3: function (i) {
            if (i == 0 || i == 2 || i == 3 || i == 5)
                return true;
            else return false;
        },
        deletePlace: function (id) {
            let self = this;
            event.stopPropagation();
            let item = self.computerList.filter(function (a) { return a.Id == id; })[0];
            if (item.IsNew) {
                item.Name = '';
            }
            else item.Deleted = !item.Deleted;
            self.maxContent = 0;
            self.computerList.map(function (a) { self.maxContent = Math.max(self.maxContent, +a.Name) });
            self.selected = -1;
            self.selectedComp = {};

        },
        filterComps: function (position) {
            let self = this;
            let items = self.computerList.filter(function (item) { return item.PositionX == position });
            if (items.length < self.maxY + 1) {
                let maxId = 0;
                self.computerList.forEach(function (a) { maxId = a.Id > maxId ? a.Id : maxId });
                maxId++;
                let length = self.maxY + 1 - items.length;
                console.log(length);
                for (let i = 0; i < length; i++) {
                    items.sort(function (a, b) { return a.PositionY - b.PositionY });
                    //if (items.length == 0) console.log(position);
                    let newObj = { Id: maxId, IsNew: true, Name: '', PositionX: position, PositionY: self.findIndex(items), IsNeedPlaceConfig: true };
                    items.push(newObj);
                    self.computerList.push(newObj);
                    maxId++;
                }
            }
            items.sort(function (a, b) { return a.PositionY - b.PositionY });
            return items;
        },
        isSelected: function (item) {
            let self = this;
            console.log(item.Id, item.Name);
            return {
                'selected': item.Id == this.selected,
                'new': item.IsNew && item.Name.trim() != "",
                'deleted': item.Deleted,
                'hasPin': item.PIN && item.PIN != 0,
                'empty': item.Name == "" || (item.Name && item.Name.trim()) == "",
                'current': self.currentProfile == item.PlaceProfileId && item.PlaceProfileId != 0
            };
        },
        addRow: function () {
            let items = [];
            let maxId = 0;
            let self = this;
            self.computerList.forEach(function (a) { maxId = a.Id > maxId ? a.Id : maxId });
            maxId++;
            console.log(maxId);
            for (let i = 0; i < this.maxY; i++) {
                let newObj = { Id: maxId, IsNew: true, Name: '', PositionX: self.maxX + 1, PositionY: self.findIndex(items), IsNeedPlaceConfig: true };
                items.push(newObj);
                self.computerList.push(newObj);
                maxId++;
            }
            this.maxX++;
        },
        rename: function () {
            let self = this;
            let item = self.computerList.filter(function (a) { return a.Id == self.selectedComp.Id; })[0];
            let existedItem = self.computerList.filter(function (a) { return a.Name == self.selectedComp.Name; })[0];
            if (existedItem && existedItem.Id != self.selectedComp.Id) {

                $('#toast-exist').toast('show');
                return;
            }
            item.Name = self.selectedComp.Name;
            self.maxContent = 0;
            self.computerList.map(function (a) { self.maxContent = Math.max(self.maxContent, +a.Name) });
            self.selected = -1;
            self.selectedComp = {};
        },
        addColumn: function () {
            //let items = [];
            let self = this;
            if (self.maxY == 5) return;
            let maxId = 0;
            self.computerList.forEach(function (a) { maxId = a.Id > maxId ? a.Id : maxId });
            maxId++;
            for (let i = 0; i < self.maxX; i++) {
                let newObj = { Id: maxId, IsNew: true, Name: '', PositionX: i, PositionY: self.maxY + 1, IsNeedPlaceConfig: true };
                // items.push(newObj);
                self.computerList.push(newObj);
                maxId++;
            }
            this.maxY++;
        },
        setIpConfig: function () {
            let self = this;
            event.stopPropagation();
            let str = CryptoJS.AES.encrypt("place-" + self.selected, "Secret Passphrase");
            localStorage['placeConfig'] = str.toString();
            let obj = { Id: self.selectedComp.PlaceProfileId, PlaceConfig: str.toString(), PlaceId: self.selected };
            $.ajax({
                url: "/api/auditory/UpdatePlaceConfig",
                type: "POST",
                async: false,
                data: obj,
                success: function () {
                    self.computerList.filter(function (a) { return a.Id == self.selected; })[0].IsNeedPlaceConfig = false;
                    self.selectedComp.IsNeedPlaceConfig = false;
                    self.currentProfile = self.selectedComp.PlaceProfileId;
                }
            });

        },
        getPlaceByConfig: function () {
            if (!localStorage['placeConfig']) return;
            let self = this;
            $.ajax({
                url: "/api/auditory/GetProfileByPlaceConfig?placeConfig=" + encodeURIComponent(localStorage['placeConfig']),
                type: "POST",
                async: false,
                success: function (id) {
                    self.currentProfile = id;
                }
            })
        },
        resetIpConfig: function () {
            let self = this;
            event.stopPropagation();
            if (self.selectedComp.IsNeedPlaceConfig) return;
            if (self.selectedComp.PlaceProfileId == self.currentProfile) {
                localStorage.removeItem('placeConfig');
                self.currentProfile = -1;
            }
            let obj = { Id: self.selectedComp.PlaceProfileId, PlaceConfig: null, PlaceId: self.selectedComp.Id };
            $.ajax({
                url: "/api/auditory/UpdatePlaceConfig",
                type: "POST",
                async: false,
                data: obj,
                success: function () {
                    self.computerList.filter(function (a) { return a.Id == self.selected; })[0].IsNeedPlaceConfig = true;
                    self.selectedComp.IsNeedPlaceConfig = true;
                }
            });

        },
        generateConfiguration: function () {
            let self = this;
            let items = [];
            self.computerList.forEach(function (item) {
                let newItem = { Id: item.IsNew ? 0 : item.Id, Name: item.Name, PositionX: item.PositionX, PositionY: item.PositionY, Deleted: item.Deleted, PlaceProfileId: item.PlaceProfileId };
                if (!item.IsNew || item.Name.trim() !== "") {
                    items.push(newItem);
                }
            });
            let auditory = { Id: self.auditory, ComputerList: items };


            $.ajax({
                url: "/api/auditory/GenerateConfiguration",
                type: "POST",
                async: false,
                data: auditory,
                success: function (auditoryWithPins) {
                    self.computerList.forEach(function (a) {
                        a.IsNeedPlaceConfig = true;
                        if (!a.IsNew)
                            a.PIN = auditoryWithPins.ComputerList.filter(function (b) { return b.Id == a.Id; })[0].PIN;
                    })
                }
            });
            self.startFindPin();

        },
        saveChanges: function () {
            let self = this;
            let items = [];
            self.computerList.forEach(function (item) {
                let newItem = { Id: item.IsNew ? 0 : item.Id, Name: item.Name, PositionX: item.PositionX, PositionY: item.PositionY, Deleted: item.Deleted };
                if (!item.IsNew || item.Name.trim() !== "") {
                    items.push(newItem);
                }
            });
            console.log(self.deletedPlaces);
            self.deletedPlaces.forEach(function (item) {
                let newItem = { Id: item.IsNew ? 0 : item.Id, Name: item.Name, PositionX: item.PositionX, PositionY: item.PositionY, Deleted: item.IsNeedPlaceConfig };
                items.push(newItem);
            });
            console.log(items);
            let auditory = { Id: self.auditory, ComputerList: items };
            $.ajax({
                url: "/api/auditory/UpdateAuditoryInfo",
                type: "POST",
                async: false,
                data: auditory,
                success: function (data) {
                    if (data.Error) {
                        return;
                    }
                    else {
                        self.computerList = data.ComputerList;
                        self.initAud();
                    }
                }
            });
        },
        findIndex: function (array) {
            if (array.length == 0) return array.length;
            let index = -1;

            for (let i = 0; i < array.length; i++) {
                //  console.log(array[i].PositionY);
            }
            for (let i = 0; i < array.length - 1; i++) {
                if (array[i + 1].PositionY - array[i].PositionY > 1) {
                    index = array[i].PositionY + 1;
                }
            }
            if (index == -1) {
                index = array[0].PositionY == 0 ? array.length : 0;
            }
            //  console.log(index);
            return index;
        }
    },

    //После полной загрузки скрипта инициализируем
    mounted: function () {

        // this.objForLoading.loading = true;
        //this.objForLoading.loaded = false;
        this.init();
    }
});
//Снимаем базовый загрузчик
//window.onload = function () {
//    $('#form').css('display', 'block');
//    $('.sk-wave').css('display', 'none');
//};

copyObj = function (old) {
    let newOne = {};
    for (var i in old) {
        newOne[i] = old[i];
    }
    return newOne;
}