using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApp
{
    [HubName("StreamHub")]
    public class StreamHub : Hub
    {
        private static Dictionary<int, List<string>> Users = new Dictionary<int, List<string>>();
        public void Connect(int TestingProfileId, bool IsAdmin = false)
        {
            //Текущее подключение
            var id = Context.ConnectionId;

            //Если ещё нет с таким профилем в активных, то добавить
            if (!Users.ContainsKey(TestingProfileId))
            {
                Users.Add(TestingProfileId, new List<string>() { id });
                Clients.All.onNewUserConnected(TestingProfileId, IsAdmin);
            }
            else
            {
                //Если профиль есть, то просто уведомляем всех, кто связан с этим профилем
                List<string> founded = Users.Where(a => a.Key == TestingProfileId).FirstOrDefault().Value;

                if (!founded.Contains(id))
                {
                    founded.Add(id);
                }

                Clients.Clients(founded).onNewUserConnected(TestingProfileId, IsAdmin);
            }

        }
        //Подтвердить насильно пользователя
        public void verify(int Id, bool IsVerified)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).setVerified(IsVerified);
        }
        //Сбросить место пользователя с выходом из системы
        public void requestReset(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestReset();
        }
        //Приостановить тест
        public void togglePause(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).togglePause();
        }
        //Завершить тест удалённо
        public void finishTest(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).finishTest();
        }
        public void reconnectCamera(int Id, Guid guid)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).reconnectCamera(guid);
        }
        public void reconnectScreen(int Id, Guid guid)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).reconnectScreen(guid);
        }
        //Перезагрузить страницу удалённо
        public void requestReload(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestReload();
        }
        //Свернуть панель с видео
        public void collapseVideo(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).collapseVideo();
        }
        //Открыть/закрыть чат пользователя с администратором
        public void toggleUserChat(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).toggleUserChat();
        }
        //Узнать, сколько осталось времени до конца ВИ
        public void requestTimeLeft(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestTimeLeft();
        }
        //Отправить результат, сколько осталось времени до конца вИ
        public void sendTimeLeft(int Id, int TimeLeft)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendTimeLeft(TimeLeft);
        }
        //Убрать удалённо доступ к камере
        public void setCameraTrue(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).setCameraTrue();
        }
        //Перезапустить разрешение на доступ к экрану
        public void resetCapture(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).resetCapture();
        }
        //Уведомить о нарушении
        public void sendError(int Id, int error)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendError(error);
        }

        //Доступ к QR. Подключение телефона, смена QR у ВИ
        public void requestLoadFile(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestLoadFile();
        }
        //Отправить ID файла после успешнорй загрузки
        public void gotUserAnswer(int Id, Guid guid)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).gotUserAnswer(guid);
        }

        //Запрос на доступ к потокам
        public void requestOffer(int Id, int Type, Guid guid)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestOffer(Type, guid);
        }
        //Отправка кандидата
        public void sendIceCandidate(int Id, int Type, dynamic candidate, Guid guid, bool IsAdmin)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendIceCandidate(Id, Type, candidate, guid, IsAdmin);
        }
        //Отправка ответа на запрос к потоку
        public void sendAnswer(int Id, dynamic Answer, int Type, Guid guid)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendAnswer(Answer, Type, guid);
        }
        //Отправка запроса на соединение
        public void sendOffer(int Id, dynamic Offer, int Type, Guid guid)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendOffer(Id, Offer, Type, guid);
        }
        // Отключение пользователя
        public override Task OnDisconnected(bool stopCalled)
        {
            var id = Context.ConnectionId;
            var item = Users.Where(x => x.Value.Contains(id));
            if (item != null && item.Any())
            {
                int Key = item.First().Key;
                List<string> value = item.First().Value;
                value.Remove(id);
                if (!value.Any())
                {
                    Users.Remove(Key);
                }
                else
                {
                    //Уведомить, что пользователь отключился, чтобы убрать его из интерфейса
                    Clients.Clients(value).onUserDisconnected(Key);
                }
            }

            return base.OnDisconnected(stopCalled);
        }
    }
}