using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;

namespace WebApp
{
    [HubName("ChatHub")]
    public class ChatHub : Hub
    {
        private static Dictionary<int, List<string>> Users = new Dictionary<int, List<string>>();
        public void Connect(int TestingProfileId, bool IsAdmin = false)
        {
            var id = Context.ConnectionId;

            if (!Users.ContainsKey(TestingProfileId))
            {
                Users.Add(TestingProfileId, new List<string>() { id });
            }
            else
            {
                List<string> founded = Users.Where(a => a.Key == TestingProfileId).FirstOrDefault().Value;

                if (!founded.Contains(id))
                {
                    founded.Add(id);
                }

                Clients.Clients(founded).onNewUserConnected(IsAdmin);
            }

        }
        public void sendMessage(int Id, int TestingProfileId, string Message, bool IsAdmin)
        {
            List<string> founded = Users.Where(a => a.Key == TestingProfileId).FirstOrDefault().Value.Where(a => a != Context.ConnectionId).ToList();

            Clients.Clients(founded).onMessageGet(Id, TestingProfileId, Message, DateTime.Now, IsAdmin);
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