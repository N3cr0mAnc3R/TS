var removeDelay = 5000, //Время жизни сообщения
    lastIndex = 0; //Идентификатор сообщения во время жизни приложения
notifierScope = { //Инкапсуляция
    messages: [],
    clear: function () {
        var self = this;
        self.messages = [];
    }
};
//Функция, которая находит крестик у сообщения
function findLastChild(elem) {
    //Изначально - это сам объект
    var finded = elem;
    //Получаем всех потомков
    var children = $(finded).children();
    //Если есть потомки, которые не являются другим сообщением, то нужно зайти дальше
    if (children.length > 0 && !$(finded).hasClass('kernel-system-notifications-wrapper')) {
        finded = findLastChild(children.last());
    }
    return finded;
}
//Конструктор сообщений
function notifier(incomeMessages) {
    //Если это массив
    if (incomeMessages instanceof Array) {
        //Все сообщения в div-е
        var fullWrapper = $('#notification-wrapper');
        //Перебор полученных сообщений
        incomeMessages.forEach(function (message, index) {
            //Увеличиваем общий счётчик сообщений страницы на 1
            lastIndex++;
            //Оболчка сообщения с доступными функциями
            var messageWrapper = {
                //Непосредственно сообщение
                source: message,
                //Функция удаления сообщения
                remove: function () {
                    var self = this;
                    //Находим сообщение во всём списке
                    var index = notifierScope.messages.indexOf(self);
                    //Дропаем его из списка
                    if (index !== -1) {
                        notifierScope.messages.splice(index, 1);
                    }
                    //Дропаем его со страницы
                    $('#index-' + self.index).fadeOut('slow', function () {
                        $('#index-' + self.index).remove();
                        if (notifierScope.messages.length === 0) {
                            $('.kernel-system').css('display', 'none');
                        }
                    });
                },
                class: [
                    "delay-" + (index + 1)
                ],
                index: lastIndex
            };
            //Добавление сообщения в начало массива
            notifierScope.messages.unshift(messageWrapper);
            if (notifierScope.messages.length > 5) {
                var removed = notifierScope.messages.pop();
                removed.remove();
            }
            //Внешний вид сообщения
            var msgWrapper = `<div class="notification-wrapper type-` + messageWrapper.source.Type + `" id="index-` + lastIndex + `">
                <div class="notification">
                    <div class="body">`+ messageWrapper.source.Body + `</div>
                    <div class="remove"><i class="fa fa-times-circle" aria-hidden="true"></i></div>

                </div>
            </div>`;
            //Добавление сообщения для оболочки
            $(msgWrapper).appendTo(findLastChild(fullWrapper));
            //Для ууспешных и неуспешных сообщений разные delay-и
            setTimeout(function () {
                //Удаляем сообщение по истечении времени жизни
                if (notifierScope.messages.find(a => a.index === messageWrapper.index)) {
                    messageWrapper.remove();
                }
            }, removeDelay * (message.Type === 'success' ? 1 : 2));
            //Вешаем событие удаления сообщения на крестик
            $(findLastChild($('#index-' + lastIndex))).on('click', function () { messageWrapper.remove(); });
        });
        //Сообщение всплывает медленно
        $('.kernel-system').fadeIn('slow');
        $('.kernel-system').css('display', 'block');
    }
}