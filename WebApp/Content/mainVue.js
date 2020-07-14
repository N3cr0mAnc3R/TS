const mainApp = new Vue({
    el: "#navigation",
    data: {
        localization: 1,
        forShow: [true, true, true, true],
        needShow1: false,
        needShow2: false,
        needShow3: false,
        needShow4: false,
        hasPhoto: false
    },
    methods: {
        init: function () {
            var self = this;
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/account/IsAuthenticated',
                success: function (d) {
                    self.getLocalization();
                    self.getLocation();
                    self.getCurrentUser();
                    $('#window-without-loader').css('display', 'block');
                    $('#main-loader').css('display', 'none');
                }
            });
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/account/HasPhoto',
                success: function (d) {
                    self.hasPhoto = d;
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
                        if (!$('#litem-1').hasClass('active')) { $('#litem-1').addClass('active'); }
                        $('#litem-2').removeClass('active');
                        if (typeof app !== 'undefined') {
                        app.localization = 1;
                        }
                        else {
                        self.localization = 1;
                        }
                    }
                    else {
                        if (!$('#litem-2').hasClass('active')) { $('#litem-2').addClass('active'); }
                        $('#litem-1').removeClass('active');
                        if (typeof app !== 'undefined') {
                        app.localization = 2;
                        }
                        else {
                        self.localization = 2;
                        }
                    }
                    self.switchLocal1();
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
                url: "/account/HasAccess?url=" + 1,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/account/HasAccess?url=" + 2,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/account/HasAccess?url=" + 3,
                type: "POST",
                async: true
            }), $.ajax({
                url: "/account/HasAccess?url=" + 4,
                type: "POST",
                async: true
            })).then(function (resp1, resp2, resp3, resp4) {
                self.needShow1 = resp1[0];
                self.needShow2 = resp2[0];
                self.needShow3 = resp3[0];
                self.needShow4 = resp4[0];

                console.log(self.forShow[0], self.forShow[1], self.forShow[2], self.forShow[3]);
            }, function (err) {

            });
        },
        setLocalization: function (Type) {
            Type = Type == 1 ? 'RU' : 'EN';
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/user/SetLocalization?Type=' + Type,
                success: function (s) {
                    location.reload();
                }
            });
        },
        getCurrentUser: function () {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/account/GetCurrentUser',
                success: function (s) {
                    if (s.PictureImage) {
                        $('#user-image').attr('src', 'data:image/png;base64, ' + s.PictureImage);
                    }
                }
            });
        },
        switchLocal1: function () {
            var self = this;
            console.log(123);
            var checking = (typeof app == 'undefined') ? self : app;
            $('#nav-4').text(checking.localization == 1 ? "Все права защищены, 2020" : "All rights reserved, 2020");
            $('#nav-8').text(checking.localization == 1 ? "Логин" : "UserName");
            $('#nav-9').text(checking.localization == 1 ? "Пароль" : "Password");
            $('#nav-10').text(checking.localization == 1 ? "Выполнить вход" : "Log in");

        },
        switchLocal: function (id) {
            var self = this;
            switch (id) {
                case 1: return self.localization == 1 ? "Система вступительных испытаний СКФУ" : "NCFU Enrolling System";
                case 2: return self.localization == 1 ? "Вход" : "Login";
                case 3: return self.localization == 1 ? "Выход" : "Logout";
                case 4: return self.localization == 1 ? "Все права защищены, 2020, СКФУ" : "All rights reserved, 2020, NCFU";
                case 5: return self.localization == 1 ? "Список аудиторий" : "Auditory list";
                case 6: return self.localization == 1 ? "Проверка ВИ" : "Verification";
                case 7: return self.localization == 1 ? "Используйте учетную запись eCampus для входа." : "Enter Your eCampus Login and password";
                case 8: return self.localization == 1 ? "Логин" : "UserName";
                case 9: return self.localization == 1 ? "Пароль" : "Password";
                case 10: return self.localization == 1 ? "Выполнить вход" : "Log in";
                case 11: return self.localization == 1 ? "Выход" : "Logout";
                case 12: return self.localization == 1 ? "Отчёты" : "Reports";
            }

        }
    },
    mounted: function () {
        this.init();
    }
});