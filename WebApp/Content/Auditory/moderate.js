
const app = new Vue({
    el: "#main-window",
    data: {
        img: null,
        interval: null,
        video3: null,
        pc2Local: null,
        stream: null
    },
    methods: {
        init: function () {
            let self = this;
            //self.interval = setInterval(function () {
                $.ajax({
                    url: '/user/getoffer?Id=' + 81,
                    method: 'post',
                    success: function (data) {
                        self.pc2Local = new RTCPeerConnection();
                        self.pc2Local.onaddstream = function (obj) {
                            console.log(obj);
                            self.video3[0].srcObject = obj.stream;
                        }
                        console.log(data);
                        var offer = data;//getOfferFromFriend();
                        navigator.getUserMedia({ video: true }, function (stream) {
                            //self.pc2Local.onaddstream = e => { self.video3[0].srcObject = e.stream; console.log(self.video3[0].srcObject); }
                                self.pc2Local.addStream(stream);

                            self.pc2Local.setRemoteDescription(new RTCSessionDescription(offer), function () {
                                console.log(offer);
                                self.pc2Local.createAnswer(function (answer) {
                                    console.log(answer);
                                    self.pc2Local.setLocalDescription(answer, function () {
                                        $.ajax({
                                            url: '/user/SaveAnswer',
                                            type: 'POST',
                                            data: {
                                                Id: localStorage['placeConfig'],
                                                Answer: JSON.stringify(answer)
                                            }
                                            //  processData: false
                                        });
                                            // send the answer to a server to be forwarded back to the caller (you)
                                        }, function () { });
                                    }, function () { });
                                }, function () { });
                            }, function () { });

                        //self.pc2Local.onicecandidate = function (e) {
                        //    console.log(e);
                        //    // candidate exists in e.candidate
                        //    if (!e.candidate) return;
                        //    send("icecandidate", JSON.stringify(e.candidate));
                        //};
                        //console.log(self.pc2Remote);


                        //let buffer = new Blob(data, { type: 'video/webm' });
                        //window.URL.createObjectURL = window.URL.createObjectURL || window.URL.webkitCreateObjectURL || window.URL.mozCreateObjectURL || window.URL.msCreateObjectURL;
                        //let src = URL.createObjectURL(buffer);
                        //let obj = $('#video')[0];
                        //obj.src = src;
                        //self.img = src;
                    }
                });
           
            //}, 200);
            self.video3 = $('#video');
        },
        stop: function () {
            let self = this;
            console.log('stop');
            clearInterval(self.interval);
        },
    },
    mounted() {
        console.log(1);
        this.init();
    }
});