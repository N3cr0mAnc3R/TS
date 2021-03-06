const mainApp = new Vue({
    el: "#navigation",
    data: {
        localization: 1,
        forShow: [true, true, true, true],
        needShow1: false,
        needShow2: false,
        needShow3: false,
        needShow4: false,
        needShow5: false,
        hasPhoto: false,
        info: []
    },
    methods: {
        init: function () {
            var self = this;
            if (!localStorage["localization"]) {
                localStorage["localization"] = 1;
            }
            self.switchLocal1();
            self.getLocalization();
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/api/account/IsAuthenticated',
                success: function (d) {
                    if (d) {
                        //self.getLocalization();
                        self.getLocation();
                        self.getCurrentUser();
                        $.ajax({
                            type: 'POST',
                            dataType: 'json',
                            url: '/api/account/HasPhoto',
                            success: function (d) {
                                self.hasPhoto = d;
                            }
                        });
                    }
                    $('#window-without-loader').css('display', 'block');
                    $('#main-loader').css('display', 'none');
                    $('#navigation').css('display', 'flex');
                }
            });
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/api/auditory/GetOrganizationContacts',
                success: function (d) {
                    self.info = d;
                    var result = "";
                    d.forEach(function (item) {
                        result += (item.Name ? item.Name + ": " : "") + item.Contact + "<br>";
                    })
                    $('#nav-5').html(result);
                }
            });
            self.showUrl();
        },
        getLocalization: function () {
            var self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/user/GetLocalization',
                success: function (l) {
                    if (l.Localization == 1) {
                        $('#litem-1').addClass('active');
                        $('#litem-2').removeClass('active');
                    }
                    else {
                        $('#litem-2').addClass('active');
                        $('#litem-1').removeClass('active');
                    }
                    //if (l.Localization == 1) {
                    //    if (!$('#litem-1').hasClass('active')) { $('#litem-1').addClass('active'); }
                    //    $('#litem-2').removeClass('active');
                    //    if (typeof app !== 'undefined') {
                    //        app.localization = 1;
                    //    }
                    //    localStorage["localization"] = 1;

                    //}
                    //else {
                    //    if (!$('#litem-2').hasClass('active')) { $('#litem-2').addClass('active'); }
                    //    $('#litem-1').removeClass('active');
                    //    if (typeof app !== 'undefined') {
                    //        app.localization = 2;
                    //    }
                    //    localStorage["localization"] = 2;

                    //}
                    //self.switchLocal1();
                }
            });
        },
        toggleMenu: function () {

            $('#navbarSupportedContent').toggleClass('show');
        },
        getLocation: function () {
            if (window.location.pathname.indexOf('auditory') != -1) {
                $('#nav-url-1').addClass('active');
            }
            if (window.location.pathname.indexOf('verification') != -1) {
                $('#nav-url-2').addClass('active');
            }
        },
        showUrl: function () {
            var self = this;
            $.when($.ajax({
                url: "/api/Administration/HasAccess?url=" + 1,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/api/Administration/HasAccess?url=" + 2,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/api/Administration/HasAccess?url=" + 3,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/api/Administration/HasAccess?url=" + 4,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/api/Administration/HasAccess?url=" + 5,
                type: "POST",
                async: true
            })).then(function (resp1, resp2, resp3, resp4, resp5) {
                self.needShow1 = resp1[0];
                self.needShow2 = resp2[0];
                self.needShow3 = resp3[0];
                self.needShow4 = resp4[0];
                self.needShow5 = resp5[0];

                //console.log(self.forShow[0], self.forShow[1], self.forShow[2], self.forShow[3]);
            }, function (err) {
            });


        },
        setLocalization: function (Type) {
            Type1 = Type == 1 ? 'RU' : 'EN';
            localStorage["localization"] = Type;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/user/SetLocalization?Type=' + Type1,
                success: function (s) {
                    location.reload();
                }
            });
        },
        getCurrentUser: function () {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/api/account/GetCurrentUser',
                success: function (s) {
                    if (s.PictureImage) {
                        $('#user-image').attr('src', 'data:image/png;base64, ' + s.PictureImage);
                    }
                }
            });
        },
        switchLocal1: function () {
            var self = this;
            // var checking = (typeof app == 'undefined') ? self : app;
            $('#nav-4').text(localStorage["localization"] == 1 ? "Все права защищены, 2021, СКФУ" : "All rights reserved, 2020, NCFU");
            $('#nav-8').text(localStorage["localization"] == 1 ? "Логин" : "UserName");
            $('#nav-9').text(localStorage["localization"] == 1 ? "Пароль" : "Password");
            $('#nav-10').text(localStorage["localization"] == 1 ? "Выполнить вход" : "Log in");

        },
        switchLocal: function (id) {
            var self = this;
            switch (id) {
                case 1: { return localStorage["localization"] == 1 ? "Система вступительных испытаний СКФУ" : "NCFU Enrolling System"; }
                case 2: return localStorage["localization"] == 1 ? "Вход" : "Login";
                case 3: return localStorage["localization"] == 1 ? "Выход" : "Logout";
                case 4: return localStorage["localization"] == 1 ? "Все права защищены, 2021, СКФУ" : "All rights reserved, 2020, NCFU";
                case 5: return localStorage["localization"] == 1 ? "Аудитории" : "Auditory list";
                case 6: return localStorage["localization"] == 1 ? "Проверка ВИ" : "Verification";
                case 7: return localStorage["localization"] == 1 ? "Используйте учетную запись eCampus для входа." : "Enter Your eCampus Login and password";
                case 8: return localStorage["localization"] == 1 ? "Логин" : "UserName";
                case 9: return localStorage["localization"] == 1 ? "Пароль" : "Password";
                case 10: return localStorage["localization"] == 1 ? "Выполнить вход" : "Log in";
                case 11: return localStorage["localization"] == 1 ? "Выход" : "Logout";
                case 12: return localStorage["localization"] == 1 ? "Отчёты" : "Reports";
                case 13: return localStorage["localization"] == 1 ? "Мои ВИ" : "My tests";
                case 14: return localStorage["localization"] == 1 ? "Администрирование" : "Moderating";
            }

        }
    },
    mounted: function () {
        this.init();
    }
});