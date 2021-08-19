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
            var id = Context.ConnectionId;

            if (!Users.ContainsKey(TestingProfileId))
            {
                Users.Add(TestingProfileId, new List<string>() { id });

                Clients.All.onNewUserConnected(TestingProfileId, IsAdmin);
            }
            else
            {
                List<string> founded = Users.Where(a => a.Key == TestingProfileId).FirstOrDefault().Value;

                if (!founded.Contains(id))
                {
                    founded.Add(id);
                }

                Clients.Clients(founded).onNewUserConnected(TestingProfileId, IsAdmin);
            }

        }
        public void verify(int Id, bool IsVerified)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).setVerified(IsVerified);
        }
        public void requestReset(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestReset();
        }
        public void togglePause(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).togglePause();
        }
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
        public void requestReload(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestReload();
        }
        public void collapseVideo(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).collapseVideo();
        }
        public void toggleUserChat(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).toggleUserChat();
        }
        public void requestTimeLeft(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).requestTimeLeft();
        }
        public void sendTimeLeft(int Id, int TimeLeft)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendTimeLeft(TimeLeft);
        }
        public void setCameraTrue(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).setCameraTrue();
        }
        public void resetCapture(int Id)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).resetCapture();
        }
        public void sendError(int Id, int error)
        {
            List<string> founded = Users.Where(a => a.Key == Id).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();
            Clients.Clients(founded).sendError(error);
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
                    Clients.Clients(value).onUserDisconnected(Key);
                }
            }

            return base.OnDisconnected(stopCalled);
        }
    }
}