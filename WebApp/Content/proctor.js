const app = new Vue({
    el: "#main-window",
    data: {
        list: [],
        room: {},
        socket: null,
        messages: [],
        textMsg: ""
    },
    methods: {
        getList: function () {
            let self = this;
            $.ajax({
                url: '/user/GetProctorRooms',
                type: 'POST',
                success: function (data) {
                    self.list = data;
                    console.log(self.list);
                }
            });
        },
        getRoom: function (Id) {
            let self = this;
            $.ajax({
                url: '/user/GetProctorRoom?Id=' + Id,
                type: 'POST',
                success: function (data) {
                    self.room = data;
                    console.log(self.room);
                }
            });
        },
        openRoom: function (Id) {
            window.open("/user/ProctorProcess?Id=" + Id, "_self");
        },
        sendMsg: function () {
            let self = this;
            self.socket.send(self.textMsg);
        },
        init: function () {
            let self = this;
            let str = window.location.href;
            let newId = Number.parseInt(str.substr(str.lastIndexOf('Id=') + 3));
            if (newId) {
                self.getRoom(newId);

                if (typeof (WebSocket) !== 'undefined') {
                    self.socket = new WebSocket("wss://localhost/WebApp/ChatHandler.ashx");
                } else {
                    self.socket = new MozWebSocket("wss://localhost/WebApp/ChatHandler.ashx");
                }
                console.log(self.socket);
                self.socket.onmessage = function (msg) {
                    self.messages.push(msg);
                    console.log(msg);
                };

                self.socket.onclose = function (event) {
                    alert('Мы потеряли её. Пожалуйста, обновите страницу');
                };
            }
            else {
                self.getList();
            }
        }
    },
    mounted() {
        this.init();
    }
});